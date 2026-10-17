// Package repository implements data access on top of GORM. Every query is
// scoped to the owning user and carries the request context so that
// cancellations and deadlines propagate to the database.
package repository

import (
	"errors"

	"atom/internal/apperr"

	"gorm.io/gorm"
)

// translate maps GORM errors onto application errors.
func translate(err error) error {
	switch {
	case err == nil:
		return nil
	case errors.Is(err, gorm.ErrRecordNotFound):
		return apperr.ErrNotFound
	default:
		return err
	}
}

// requireAffected returns ErrNotFound when a write touched no rows, which
// happens when the record does not exist or belongs to another user.
func requireAffected(tx *gorm.DB) error {
	if tx.Error != nil {
		return translate(tx.Error)
	}
	if tx.RowsAffected == 0 {
		return apperr.ErrNotFound
	}
	return nil
}
