package repository

import (
	"context"
	"errors"
	"strings"

	"atom/internal/apperr"
	"atom/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Users persists user accounts.
type Users struct{ db *gorm.DB }

// NewUsers returns a user repository.
func NewUsers(db *gorm.DB) *Users { return &Users{db: db} }

// Create inserts a new user, returning ErrEmailTaken on a duplicate email.
func (r *Users) Create(ctx context.Context, u *model.User) error {
	err := r.db.WithContext(ctx).Create(u).Error
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return apperr.ErrEmailTaken
	}
	return err
}

// FindByEmail looks up a user by case-insensitive email.
func (r *Users) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	var u model.User
	err := r.db.WithContext(ctx).Where("lower(email) = ?", strings.ToLower(email)).Take(&u).Error
	return &u, translate(err)
}

// FindByID looks up a user by primary key.
func (r *Users) FindByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var u model.User
	err := r.db.WithContext(ctx).Take(&u, "id = ?", id).Error
	return &u, translate(err)
}
