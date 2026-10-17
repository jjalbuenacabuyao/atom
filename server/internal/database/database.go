// Package database manages the PostgreSQL connection pool and schema
// migrations.
package database

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"time"

	"github.com/pressly/goose/v3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

//go:embed migrations/*.sql
var migrations embed.FS

// Open connects to PostgreSQL through GORM and configures the connection pool.
func Open(ctx context.Context, dsn string, log *slog.Logger) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.NewSlogLogger(log, logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			ParameterizedQueries:      true,
		}),
		// Cache prepared statements for faster repeated queries.
		PrepareStmt: true,
		// Map driver errors (e.g. unique violations) to gorm.ErrDuplicatedKey etc.
		TranslateError: true,
		NowFunc:        func() time.Time { return time.Now().UTC() },
	})
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("access sql.DB: %w", err)
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(pingCtx); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}
	return db, nil
}

// Migrate applies all pending versioned SQL migrations. Versioned migrations
// are used instead of GORM's AutoMigrate so schema changes are explicit,
// reviewable and reversible.
func Migrate(ctx context.Context, db *gorm.DB, log *slog.Logger) error {
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("access sql.DB: %w", err)
	}
	fsys, err := fs.Sub(migrations, "migrations")
	if err != nil {
		return fmt.Errorf("load migrations: %w", err)
	}
	provider, err := goose.NewProvider(goose.DialectPostgres, sqlDB, fsys)
	if err != nil {
		return fmt.Errorf("create migration provider: %w", err)
	}
	results, err := provider.Up(ctx)
	if err != nil {
		return fmt.Errorf("apply migrations: %w", err)
	}
	for _, r := range results {
		log.Info("applied migration", "version", r.Source.Version, "file", r.Source.Path, "duration", r.Duration)
	}
	return nil
}
