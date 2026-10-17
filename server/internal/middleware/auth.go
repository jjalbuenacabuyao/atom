package middleware

import (
	"crypto/rand"
	"crypto/subtle"
	"net/http"
	"sync"
	"time"

	"atom/internal/apperr"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/time/rate"
)

const (
	// SessionCookie holds the signed session token. It is HttpOnly so it is
	// never exposed to JavaScript.
	SessionCookie = "atom_session"
	// CSRFCookie carries the CSRF token for the double-submit cookie pattern
	// that Angular's HttpClient supports out of the box.
	CSRFCookie = "XSRF-TOKEN"
	// CSRFHeader is the header in which clients echo the CSRF token.
	CSRFHeader = "X-XSRF-TOKEN"

	userIDKey = "userID"
)

// TokenParser validates session tokens.
type TokenParser interface {
	ParseToken(token string) (uuid.UUID, error)
}

// RequireAuth rejects requests without a valid session cookie and stores the
// authenticated user ID in the context.
func RequireAuth(tokens TokenParser) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie(SessionCookie)
		if err != nil || token == "" {
			Abort(c, apperr.ErrUnauthorized)
			return
		}
		userID, err := tokens.ParseToken(token)
		if err != nil {
			Abort(c, apperr.ErrUnauthorized)
			return
		}
		c.Set(userIDKey, userID)
		c.Next()
	}
}

// UserID returns the authenticated user's ID. It must only be called from
// handlers behind RequireAuth.
func UserID(c *gin.Context) uuid.UUID {
	return c.MustGet(userIDKey).(uuid.UUID)
}

// CSRF issues a CSRF token cookie and verifies that state-changing requests
// echo it back in the X-XSRF-TOKEN header.
func CSRF(secure bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Cookie(CSRFCookie)
		if err != nil || cookie == "" {
			cookie = rand.Text()
			//nolint:gosec // The SPA must read this cookie; Secure is configurable for local HTTP.
			http.SetCookie(c.Writer, &http.Cookie{
				Name:     CSRFCookie,
				Value:    cookie,
				Path:     "/",
				Secure:   secure,
				HttpOnly: false, // must be readable by the SPA
				SameSite: http.SameSiteStrictMode,
			})
		}

		switch c.Request.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			c.Next()
			return
		}
		header := c.GetHeader(CSRFHeader)
		if header == "" || subtle.ConstantTimeCompare([]byte(header), []byte(cookie)) != 1 {
			Abort(c, &apperr.Error{Status: http.StatusForbidden, Code: "csrf_invalid", Message: "Invalid or missing CSRF token"})
			return
		}
		c.Next()
	}
}

// RateLimit applies a per-client-IP token bucket allowing r requests per
// second with the given burst. Idle clients are evicted periodically.
func RateLimit(r rate.Limit, burst int) gin.HandlerFunc {
	type client struct {
		limiter  *rate.Limiter
		lastSeen time.Time
	}
	var (
		mu      sync.Mutex
		clients = make(map[string]*client)
		lastGC  = time.Now()
	)
	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()

		mu.Lock()
		if now.Sub(lastGC) > time.Minute {
			for k, v := range clients {
				if now.Sub(v.lastSeen) > 10*time.Minute {
					delete(clients, k)
				}
			}
			lastGC = now
		}
		cl, ok := clients[ip]
		if !ok {
			cl = &client{limiter: rate.NewLimiter(r, burst)}
			clients[ip] = cl
		}
		cl.lastSeen = now
		allowed := cl.limiter.Allow()
		mu.Unlock()

		if !allowed {
			c.Header("Retry-After", "60")
			Abort(c, apperr.ErrTooManyRequests)
			return
		}
		c.Next()
	}
}

// SetSession writes the session cookie.
func SetSession(c *gin.Context, token string, ttl time.Duration, secure bool) {
	//nolint:gosec // HttpOnly + SameSite are set; Secure is configurable for local HTTP.
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     SessionCookie,
		Value:    token,
		Path:     "/api",
		MaxAge:   int(ttl.Seconds()),
		Secure:   secure,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

// ClearSession removes the session cookie.
func ClearSession(c *gin.Context, secure bool) {
	//nolint:gosec // HttpOnly + SameSite are set; Secure is configurable for local HTTP.
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     SessionCookie,
		Value:    "",
		Path:     "/api",
		MaxAge:   -1,
		Secure:   secure,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}
