package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"atom/internal/config"
	"atom/internal/database"
	"atom/internal/handler"
	"atom/internal/middleware"
)

// newTestServer starts the API against TEST_DATABASE_URL with a clean schema.
// The test is skipped when no test database is configured.
func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL not set; skipping integration test")
	}
	ctx := context.Background()
	log := slog.New(slog.NewTextHandler(io.Discard, nil))

	db, err := database.Open(ctx, dsn, log)
	if err != nil {
		t.Fatal(err)
	}
	for _, stmt := range []string{"DROP SCHEMA public CASCADE", "CREATE SCHEMA public"} {
		if err := db.Exec(stmt).Error; err != nil {
			t.Fatal(err)
		}
	}
	if err := database.Migrate(ctx, db, log); err != nil {
		t.Fatal(err)
	}

	cfg := config.Config{
		Env:        config.EnvTest,
		JWTSecret:  "test-secret-test-secret-test-secret",
		SessionTTL: time.Hour,
	}
	router, err := handler.NewRouter(cfg, db, log)
	if err != nil {
		t.Fatal(err)
	}
	srv := httptest.NewServer(router)
	t.Cleanup(func() {
		srv.Close()
		if sqlDB, err := db.DB(); err == nil {
			_ = sqlDB.Close()
		}
	})
	return srv
}

// apiClient mimics the browser: it keeps cookies and echoes the CSRF token.
type apiClient struct {
	t    *testing.T
	base string
	http *http.Client
}

func newClient(t *testing.T, srv *httptest.Server) *apiClient {
	jar, _ := cookiejar.New(nil)
	return &apiClient{t: t, base: srv.URL, http: &http.Client{Jar: jar}}
}

func (c *apiClient) do(method, path string, body any, out any) int {
	c.t.Helper()
	var r io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			c.t.Fatal(err)
		}
		r = bytes.NewReader(b)
	}
	req, err := http.NewRequest(method, c.base+path, r)
	if err != nil {
		c.t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	for _, ck := range c.http.Jar.Cookies(req.URL) {
		if ck.Name == middleware.CSRFCookie {
			req.Header.Set(middleware.CSRFHeader, ck.Value)
		}
	}
	res, err := c.http.Do(req)
	if err != nil {
		c.t.Fatal(err)
	}
	defer func() { _ = res.Body.Close() }()
	if out != nil {
		if err := json.NewDecoder(res.Body).Decode(out); err != nil {
			c.t.Fatalf("%s %s: decode response: %v", method, path, err)
		}
	}
	return res.StatusCode
}

func expectStatus(t *testing.T, got, want int, what string) {
	t.Helper()
	if got != want {
		t.Fatalf("%s: status = %d, want %d", what, got, want)
	}
}

func TestAPI_HabitLifecycle(t *testing.T) {
	srv := newTestServer(t)
	c := newClient(t, srv)
	today := time.Now().UTC().Format(time.DateOnly)
	yesterday := time.Now().UTC().AddDate(0, 0, -1).Format(time.DateOnly)

	// Unauthenticated requests are rejected (and receive a CSRF cookie).
	expectStatus(t, c.do(http.MethodGet, "/api/v1/auth/me", nil, nil), http.StatusUnauthorized, "me before login")

	// Mutations without the CSRF header are rejected.
	raw, _ := http.Post(srv.URL+"/api/v1/auth/register", "application/json", bytes.NewBufferString(`{}`))
	expectStatus(t, raw.StatusCode, http.StatusForbidden, "register without CSRF")
	_ = raw.Body.Close()

	// Validation errors report JSON field names.
	var verr struct {
		Error struct {
			Code   string            `json:"code"`
			Fields map[string]string `json:"fields"`
		} `json:"error"`
	}
	expectStatus(t, c.do(http.MethodPost, "/api/v1/auth/register",
		map[string]string{"name": "James", "email": "not-an-email", "password": "short"}, &verr),
		http.StatusUnprocessableEntity, "invalid register")
	if verr.Error.Fields["email"] == "" || verr.Error.Fields["password"] == "" {
		t.Fatalf("expected email and password field errors, got %v", verr.Error.Fields)
	}

	expectStatus(t, c.do(http.MethodPost, "/api/v1/auth/register",
		map[string]string{"name": "James", "email": "James@Example.com", "password": "atomic-habits"}, nil),
		http.StatusCreated, "register")

	var me struct{ Email string }
	expectStatus(t, c.do(http.MethodGet, "/api/v1/auth/me", nil, &me), http.StatusOK, "me")
	if me.Email != "james@example.com" {
		t.Fatalf("email not normalised: %q", me.Email)
	}

	// Duplicate email (case-insensitive) conflicts.
	other := newClient(t, srv)
	other.do(http.MethodGet, "/api/v1/auth/me", nil, nil) // obtain CSRF cookie
	expectStatus(t, other.do(http.MethodPost, "/api/v1/auth/register",
		map[string]string{"name": "J", "email": "JAMES@example.com", "password": "atomic-habits"}, nil),
		http.StatusConflict, "duplicate register")

	var identity struct{ ID string }
	expectStatus(t, c.do(http.MethodPost, "/api/v1/identities",
		map[string]string{"statement": "I am a reader"}, &identity), http.StatusCreated, "create identity")

	var habit struct {
		ID        string
		StartDate string
		Identity  *struct{ Statement string }
	}
	expectStatus(t, c.do(http.MethodPost, "/api/v1/habits?today="+yesterday, map[string]any{
		"name":         "Read one page",
		"kind":         "build",
		"identityId":   identity.ID,
		"cueTime":      "21:00",
		"cueLocation":  "in bed",
		"stackAfter":   "I brush my teeth",
		"easyNote":     "Read one page",
		"scheduleDays": 127,
		"color":        "#6750a4",
		"icon":         "menu_book",
	}, &habit), http.StatusCreated, "create habit")
	if habit.StartDate != yesterday || habit.Identity == nil || habit.Identity.Statement != "I am a reader" {
		t.Fatalf("unexpected habit: %+v", habit)
	}

	// Another user cannot see the habit.
	other.do(http.MethodPost, "/api/v1/auth/register",
		map[string]string{"name": "Other", "email": "other@example.com", "password": "atomic-habits"}, nil)
	expectStatus(t, other.do(http.MethodGet, "/api/v1/habits/"+habit.ID, nil, nil), http.StatusNotFound, "foreign habit")

	// Check in yesterday and today.
	expectStatus(t, c.do(http.MethodPut, "/api/v1/habits/"+habit.ID+"/logs/"+yesterday, nil, nil), http.StatusNoContent, "check yesterday")
	expectStatus(t, c.do(http.MethodPut, "/api/v1/habits/"+habit.ID+"/logs/"+today, map[string]string{"note": "great"}, nil), http.StatusNoContent, "check today")
	// PUT is idempotent.
	expectStatus(t, c.do(http.MethodPut, "/api/v1/habits/"+habit.ID+"/logs/"+today, map[string]string{"note": "great"}, nil), http.StatusNoContent, "check today again")
	// Cannot check in before the start date.
	before := time.Now().UTC().AddDate(0, 0, -5).Format(time.DateOnly)
	expectStatus(t, c.do(http.MethodPut, "/api/v1/habits/"+habit.ID+"/logs/"+before, nil, nil), http.StatusBadRequest, "check before start")

	var dash struct {
		ScheduledCount int
		CompletedCount int
		TotalVotes     int
		Habits         []struct {
			Stats struct {
				CurrentStreak  int
				CompletedToday bool
			}
		}
		Identities []struct{ Votes int }
		Activity   []struct{ Count int }
	}
	expectStatus(t, c.do(http.MethodGet, "/api/v1/dashboard?today="+today, nil, &dash), http.StatusOK, "dashboard")
	if dash.ScheduledCount != 1 || dash.CompletedCount != 1 || dash.TotalVotes != 2 {
		t.Fatalf("unexpected dashboard counts: %+v", dash)
	}
	if dash.Habits[0].Stats.CurrentStreak != 2 || !dash.Habits[0].Stats.CompletedToday {
		t.Fatalf("unexpected stats: %+v", dash.Habits[0].Stats)
	}
	if len(dash.Identities) != 1 || dash.Identities[0].Votes != 2 {
		t.Fatalf("unexpected identity votes: %+v", dash.Identities)
	}
	if n := len(dash.Activity); n == 0 || dash.Activity[n-1].Count != 1 {
		t.Fatalf("unexpected activity tail: %+v", dash.Activity)
	}

	var longDash struct{ Activity []struct{ Count int } }
	expectStatus(t, c.do(http.MethodGet, "/api/v1/dashboard?days=9999&today="+today, nil, &longDash), http.StatusOK, "dashboard days")
	if len(longDash.Activity) != 7*53 {
		t.Fatalf("days should clamp to %d, got %d", 7*53, len(longDash.Activity))
	}
	expectStatus(t, c.do(http.MethodGet, "/api/v1/dashboard?days=abc", nil, nil), http.StatusBadRequest, "dashboard bad days")

	var logs []struct{ Date, Note string }
	expectStatus(t, c.do(http.MethodGet, "/api/v1/habits/"+habit.ID+"/logs?today="+today, nil, &logs), http.StatusOK, "logs")
	if len(logs) != 2 || logs[0].Date != today || logs[0].Note != "great" {
		t.Fatalf("unexpected logs: %+v", logs)
	}

	expectStatus(t, c.do(http.MethodDelete, "/api/v1/habits/"+habit.ID+"/logs/"+today, nil, nil), http.StatusNoContent, "uncheck")
	expectStatus(t, c.do(http.MethodPost, "/api/v1/habits/"+habit.ID+"/archive", nil, nil), http.StatusNoContent, "archive")

	var active []struct{ ID string }
	expectStatus(t, c.do(http.MethodGet, "/api/v1/habits", nil, &active), http.StatusOK, "list active")
	if len(active) != 0 {
		t.Fatalf("archived habit still listed: %+v", active)
	}
	var all []struct{ ID string }
	c.do(http.MethodGet, "/api/v1/habits?archived=true", nil, &all)
	if len(all) != 1 {
		t.Fatalf("expected archived habit in full list, got %+v", all)
	}

	// Deleting the identity detaches the habit.
	expectStatus(t, c.do(http.MethodDelete, "/api/v1/identities/"+identity.ID, nil, nil), http.StatusNoContent, "delete identity")
	expectStatus(t, c.do(http.MethodDelete, "/api/v1/habits/"+habit.ID, nil, nil), http.StatusNoContent, "delete habit")
	expectStatus(t, c.do(http.MethodGet, "/api/v1/habits/"+habit.ID, nil, nil), http.StatusNotFound, "deleted habit")

	expectStatus(t, c.do(http.MethodPost, "/api/v1/auth/logout", nil, nil), http.StatusNoContent, "logout")
	expectStatus(t, c.do(http.MethodGet, "/api/v1/auth/me", nil, nil), http.StatusUnauthorized, "me after logout")
}

func TestAPI_Scorecard(t *testing.T) {
	srv := newTestServer(t)
	c := newClient(t, srv)
	c.do(http.MethodGet, "/healthz", nil, nil)
	c.do(http.MethodGet, "/api/v1/auth/me", nil, nil)
	expectStatus(t, c.do(http.MethodPost, "/api/v1/auth/register",
		map[string]string{"name": "Ann", "email": "ann@example.com", "password": "atomic-habits"}, nil),
		http.StatusCreated, "register")

	var entry struct{ ID, Rating string }
	expectStatus(t, c.do(http.MethodPost, "/api/v1/scorecard",
		map[string]string{"description": "Check phone", "rating": "negative", "timeOfDay": "07:00"}, &entry),
		http.StatusCreated, "create entry")
	expectStatus(t, c.do(http.MethodPut, "/api/v1/scorecard/"+entry.ID,
		map[string]string{"description": "Check phone", "rating": "neutral"}, &entry),
		http.StatusOK, "update entry")
	if entry.Rating != "neutral" {
		t.Fatalf("rating not updated: %+v", entry)
	}
	expectStatus(t, c.do(http.MethodPost, "/api/v1/scorecard",
		map[string]string{"description": "x", "rating": "great"}, nil),
		http.StatusUnprocessableEntity, "invalid rating")

	var list []struct{ ID string }
	c.do(http.MethodGet, "/api/v1/scorecard", nil, &list)
	if len(list) != 1 {
		t.Fatalf("expected one entry, got %d", len(list))
	}
	expectStatus(t, c.do(http.MethodDelete, "/api/v1/scorecard/"+entry.ID, nil, nil), http.StatusNoContent, "delete")
	expectStatus(t, c.do(http.MethodDelete, "/api/v1/scorecard/"+entry.ID, nil, nil), http.StatusNotFound, "delete again")
}

func TestHealth(t *testing.T) {
	srv := newTestServer(t)
	for _, path := range []string{"/healthz", "/readyz"} {
		res, err := http.Get(srv.URL + path)
		if err != nil {
			t.Fatal(err)
		}
		_ = res.Body.Close()
		expectStatus(t, res.StatusCode, http.StatusOK, path)
	}
}
