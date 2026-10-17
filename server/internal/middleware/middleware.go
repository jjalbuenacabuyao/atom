// Package middleware provides Gin middleware for observability, security and
// authentication.
package middleware

import (
	"log/slog"
	"net/http"
	"time"

	"atom/internal/apperr"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	requestIDHeader = "X-Request-ID"
	requestIDKey    = "requestID"
	maxBodyBytes    = 1 << 20 // 1 MiB
)

// RequestID propagates an incoming X-Request-ID header or generates one.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader(requestIDHeader)
		if id == "" || len(id) > 64 {
			id = uuid.NewString()
		}
		c.Set(requestIDKey, id)
		c.Header(requestIDHeader, id)
		c.Next()
	}
}

// GetRequestID returns the request ID assigned by RequestID.
func GetRequestID(c *gin.Context) string { return c.GetString(requestIDKey) }

// Logger emits one structured log line per request.
func Logger(log *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		status := c.Writer.Status()
		attrs := []slog.Attr{
			slog.String("method", c.Request.Method),
			slog.String("path", c.Request.URL.Path),
			slog.String("route", c.FullPath()),
			slog.Int("status", status),
			slog.Duration("latency", time.Since(start)),
			slog.String("client_ip", c.ClientIP()),
			slog.String("request_id", GetRequestID(c)),
		}
		if len(c.Errors) > 0 {
			attrs = append(attrs, slog.String("errors", c.Errors.String()))
		}
		level := slog.LevelInfo
		switch {
		case status >= http.StatusInternalServerError:
			level = slog.LevelError
		case status >= http.StatusBadRequest:
			level = slog.LevelWarn
		}
		log.LogAttrs(c.Request.Context(), level, "http request", attrs...)
	}
}

// Recovery converts panics into a JSON 500 response and logs the panic.
func Recovery(log *slog.Logger) gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		log.ErrorContext(c.Request.Context(), "panic recovered",
			"panic", recovered, "request_id", GetRequestID(c))
		Abort(c, apperr.ErrInternal)
	})
}

// SecurityHeaders sets conservative security headers on every response.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.Writer.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		h.Set("Cross-Origin-Opener-Policy", "same-origin")
		h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		h.Set("Cache-Control", "no-store")
		c.Next()
	}
}

// BodyLimit caps the size of request bodies.
func BodyLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBodyBytes)
		c.Next()
	}
}

// Abort writes an application error as JSON and stops the handler chain.
func Abort(c *gin.Context, err *apperr.Error) {
	c.AbortWithStatusJSON(err.Status, gin.H{"error": err})
}
