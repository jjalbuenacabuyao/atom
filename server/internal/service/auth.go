// Package service implements the application's business logic. Services
// depend on small repository interfaces declared here, at the point of use,
// which keeps them decoupled from GORM and easy to test.
package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"atom/internal/apperr"
	"atom/internal/dto"
	"atom/internal/model"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// UserStore is the persistence required by Auth.
type UserStore interface {
	Create(ctx context.Context, u *model.User) error
	FindByEmail(ctx context.Context, email string) (*model.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.User, error)
}

const tokenIssuer = "atom"

// dummyHash is compared against when a login email is unknown so that the
// response time does not reveal whether an account exists.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("atom-timing-equaliser"), bcrypt.DefaultCost)

// Auth handles registration, login and session tokens.
type Auth struct {
	users  UserStore
	secret []byte
	ttl    time.Duration
	now    func() time.Time
}

// NewAuth returns an Auth service that signs session tokens with secret.
func NewAuth(users UserStore, secret string, ttl time.Duration) *Auth {
	return &Auth{users: users, secret: []byte(secret), ttl: ttl, now: time.Now}
}

// TTL is the lifetime of issued session tokens.
func (a *Auth) TTL() time.Duration { return a.ttl }

// Register creates a new account.
func (a *Auth) Register(ctx context.Context, in dto.RegisterRequest) (*model.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}
	u := &model.User{
		Name:         strings.TrimSpace(in.Name),
		Email:        normalizeEmail(in.Email),
		PasswordHash: string(hash),
	}
	if u.Name == "" {
		return nil, apperr.Validation("Please check the highlighted fields", map[string]string{"name": "Name is required"})
	}
	if err := a.users.Create(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

// Login verifies credentials and returns the matching user.
func (a *Auth) Login(ctx context.Context, in dto.LoginRequest) (*model.User, error) {
	u, err := a.users.FindByEmail(ctx, normalizeEmail(in.Email))
	if errors.Is(err, apperr.ErrNotFound) {
		_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(in.Password))
		return nil, apperr.ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(in.Password)) != nil {
		return nil, apperr.ErrInvalidCredentials
	}
	return u, nil
}

// Me returns the user for an authenticated session.
func (a *Auth) Me(ctx context.Context, id uuid.UUID) (*model.User, error) {
	u, err := a.users.FindByID(ctx, id)
	if errors.Is(err, apperr.ErrNotFound) {
		return nil, apperr.ErrUnauthorized
	}
	return u, err
}

// IssueToken creates a signed session token for the user.
func (a *Auth) IssueToken(userID uuid.UUID) (string, error) {
	now := a.now()
	claims := jwt.RegisteredClaims{
		Issuer:    tokenIssuer,
		Subject:   userID.String(),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(a.ttl)),
		ID:        uuid.NewString(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(a.secret)
}

// ParseToken validates a session token and returns the user ID it carries.
func (a *Auth) ParseToken(token string) (uuid.UUID, error) {
	var claims jwt.RegisteredClaims
	_, err := jwt.ParseWithClaims(token, &claims, func(*jwt.Token) (any, error) { return a.secret, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(tokenIssuer),
		jwt.WithExpirationRequired(),
		jwt.WithTimeFunc(a.now),
	)
	if err != nil {
		return uuid.Nil, apperr.ErrUnauthorized
	}
	id, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, apperr.ErrUnauthorized
	}
	return id, nil
}

// ToUserDTO maps a user model to its public representation.
func ToUserDTO(u *model.User) dto.User {
	return dto.User{ID: u.ID, Name: u.Name, Email: u.Email, CreatedAt: u.CreatedAt}
}

func normalizeEmail(s string) string { return strings.ToLower(strings.TrimSpace(s)) }
