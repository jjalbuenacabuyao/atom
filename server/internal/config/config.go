// Package config loads application configuration from the environment,
// following the twelve-factor app methodology.
package config

import (
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"
)

// Environment names.
const (
	EnvDevelopment = "development"
	EnvProduction  = "production"
	EnvTest        = "test"
)

// Config holds all runtime configuration for the API server.
type Config struct {
	Env             string
	Port            int
	DatabaseURL     string
	JWTSecret       string
	SessionTTL      time.Duration
	CookieSecure    bool
	AllowedOrigins  []string
	TrustedProxies  []string
	MigrateOnStart  bool
	LogLevel        slog.Level
	ShutdownTimeout time.Duration
}

// IsProduction reports whether the server runs in production mode.
func (c Config) IsProduction() bool { return c.Env == EnvProduction }

// Load reads configuration from environment variables, applying sensible
// defaults for local development and validating required values.
func Load() (Config, error) {
	cfg := Config{
		Env:             getString("APP_ENV", EnvDevelopment),
		DatabaseURL:     getString("DATABASE_URL", "postgres://atom:atom@localhost:5432/atom?sslmode=disable"),
		JWTSecret:       os.Getenv("JWT_SECRET"),
		AllowedOrigins:  getList("ALLOWED_ORIGINS"),
		TrustedProxies:  getList("TRUSTED_PROXIES"),
		ShutdownTimeout: 10 * time.Second,
	}

	var errs []error
	var err error
	if cfg.Port, err = getInt("PORT", 8080); err != nil {
		errs = append(errs, err)
	}
	if cfg.SessionTTL, err = getDuration("SESSION_TTL", 7*24*time.Hour); err != nil {
		errs = append(errs, err)
	}
	if cfg.CookieSecure, err = getBool("COOKIE_SECURE", cfg.Env == EnvProduction); err != nil {
		errs = append(errs, err)
	}
	if cfg.MigrateOnStart, err = getBool("MIGRATE_ON_START", true); err != nil {
		errs = append(errs, err)
	}
	if err = cfg.LogLevel.UnmarshalText([]byte(getString("LOG_LEVEL", "info"))); err != nil {
		errs = append(errs, fmt.Errorf("LOG_LEVEL: %w", err))
	}

	switch cfg.Env {
	case EnvDevelopment, EnvTest:
		if cfg.JWTSecret == "" {
			cfg.JWTSecret = "insecure-development-secret-change-me-please"
		}
	case EnvProduction:
		if len(cfg.JWTSecret) < 32 {
			errs = append(errs, errors.New("JWT_SECRET must be at least 32 characters in production"))
		}
	default:
		errs = append(errs, fmt.Errorf("APP_ENV must be one of %s, %s, %s", EnvDevelopment, EnvProduction, EnvTest))
	}

	return cfg, errors.Join(errs...)
}

func getString(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func getList(key string) []string {
	raw := os.Getenv(key)
	if raw == "" {
		return nil
	}
	var out []string
	for part := range strings.SplitSeq(raw, ",") {
		if p := strings.TrimSpace(part); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func getInt(key string, fallback int) (int, error) {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback, nil
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", key, err)
	}
	return n, nil
}

func getBool(key string, fallback bool) (bool, error) {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback, nil
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return false, fmt.Errorf("%s: %w", key, err)
	}
	return b, nil
}

func getDuration(key string, fallback time.Duration) (time.Duration, error) {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback, nil
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", key, err)
	}
	return d, nil
}
