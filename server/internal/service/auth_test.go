package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"atom/internal/apperr"
	"atom/internal/dto"
	"atom/internal/model"

	"github.com/google/uuid"
)

// memUsers is an in-memory UserStore for unit tests.
type memUsers struct{ byEmail map[string]*model.User }

func (m *memUsers) Create(_ context.Context, u *model.User) error {
	if _, ok := m.byEmail[u.Email]; ok {
		return apperr.ErrEmailTaken
	}
	u.ID = uuid.New()
	m.byEmail[u.Email] = u
	return nil
}

func (m *memUsers) FindByEmail(_ context.Context, email string) (*model.User, error) {
	if u, ok := m.byEmail[email]; ok {
		return u, nil
	}
	return nil, apperr.ErrNotFound
}

func (m *memUsers) FindByID(_ context.Context, id uuid.UUID) (*model.User, error) {
	for _, u := range m.byEmail {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, apperr.ErrNotFound
}

func newTestAuth() *Auth {
	return NewAuth(&memUsers{byEmail: map[string]*model.User{}}, "unit-test-secret-unit-test-secret", time.Hour)
}

func TestAuth_RegisterAndLogin(t *testing.T) {
	ctx := context.Background()
	a := newTestAuth()

	u, err := a.Register(ctx, dto.RegisterRequest{Name: " James ", Email: " James@Example.COM ", Password: "atomic-habits"})
	if err != nil {
		t.Fatal(err)
	}
	if u.Email != "james@example.com" || u.Name != "James" {
		t.Fatalf("input not normalised: %+v", u)
	}
	if u.PasswordHash == "atomic-habits" {
		t.Fatal("password stored in plain text")
	}

	if _, err := a.Login(ctx, dto.LoginRequest{Email: "JAMES@example.com", Password: "atomic-habits"}); err != nil {
		t.Fatalf("login failed: %v", err)
	}
	for _, in := range []dto.LoginRequest{
		{Email: "james@example.com", Password: "wrong-password"},
		{Email: "nobody@example.com", Password: "atomic-habits"},
	} {
		if _, err := a.Login(ctx, in); !errors.Is(err, apperr.ErrInvalidCredentials) {
			t.Errorf("Login(%q) error = %v, want ErrInvalidCredentials", in.Email, err)
		}
	}
}

func TestAuth_Tokens(t *testing.T) {
	a := newTestAuth()
	id := uuid.New()

	token, err := a.IssueToken(id)
	if err != nil {
		t.Fatal(err)
	}
	got, err := a.ParseToken(token)
	if err != nil || got != id {
		t.Fatalf("ParseToken() = %v, %v; want %v", got, err, id)
	}

	if _, err := a.ParseToken(token + "x"); err == nil {
		t.Error("tampered token accepted")
	}

	other := NewAuth(nil, "another-secret-another-secret-12345", time.Hour)
	if _, err := other.ParseToken(token); err == nil {
		t.Error("token signed with a different secret accepted")
	}

	a.now = func() time.Time { return time.Now().Add(2 * time.Hour) }
	if _, err := a.ParseToken(token); err == nil {
		t.Error("expired token accepted")
	}
}
