package repository

import (
	"context"

	"atom/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Identities persists identity statements.
type Identities struct{ db *gorm.DB }

// NewIdentities returns an identity repository.
func NewIdentities(db *gorm.DB) *Identities { return &Identities{db: db} }

// List returns all identities for a user, oldest first.
func (r *Identities) List(ctx context.Context, userID uuid.UUID) ([]model.Identity, error) {
	var out []model.Identity
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at").Find(&out).Error
	return out, err
}

// Get returns one identity owned by the user.
func (r *Identities) Get(ctx context.Context, userID, id uuid.UUID) (*model.Identity, error) {
	var i model.Identity
	err := r.db.WithContext(ctx).Where("user_id = ? AND id = ?", userID, id).Take(&i).Error
	return &i, translate(err)
}

// Create inserts a new identity.
func (r *Identities) Create(ctx context.Context, i *model.Identity) error {
	return r.db.WithContext(ctx).Create(i).Error
}

// Update saves the editable fields of an identity.
func (r *Identities) Update(ctx context.Context, i *model.Identity) error {
	tx := r.db.WithContext(ctx).Model(i).Where("user_id = ?", i.UserID).
		Select("Statement", "Description").Updates(i)
	return requireAffected(tx)
}

// Delete removes an identity; linked habits are detached by the FK.
func (r *Identities) Delete(ctx context.Context, userID, id uuid.UUID) error {
	tx := r.db.WithContext(ctx).Where("user_id = ? AND id = ?", userID, id).Delete(&model.Identity{})
	return requireAffected(tx)
}

// VoteCounts returns the number of habit logs ("votes") cast for each of the
// user's identities.
func (r *Identities) VoteCounts(ctx context.Context, userID uuid.UUID) (map[uuid.UUID]int, error) {
	var rows []struct {
		IdentityID uuid.UUID
		Votes      int
	}
	err := r.db.WithContext(ctx).
		Table("habit_logs AS l").
		Select("h.identity_id, COUNT(*) AS votes").
		Joins("JOIN habits h ON h.id = l.habit_id").
		Where("l.user_id = ? AND h.identity_id IS NOT NULL", userID).
		Group("h.identity_id").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]int, len(rows))
	for _, row := range rows {
		out[row.IdentityID] = row.Votes
	}
	return out, nil
}
