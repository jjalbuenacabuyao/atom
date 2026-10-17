package repository

import (
	"context"

	"atom/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Scorecard persists Habits Scorecard entries.
type Scorecard struct{ db *gorm.DB }

// NewScorecard returns a scorecard repository.
func NewScorecard(db *gorm.DB) *Scorecard { return &Scorecard{db: db} }

// List returns the user's scorecard in order.
func (r *Scorecard) List(ctx context.Context, userID uuid.UUID) ([]model.ScorecardEntry, error) {
	var out []model.ScorecardEntry
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("position, created_at").Find(&out).Error
	return out, err
}

// Create appends an entry to the end of the user's scorecard.
func (r *Scorecard) Create(ctx context.Context, e *model.ScorecardEntry) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var maxPos *int
		if err := tx.Model(&model.ScorecardEntry{}).Where("user_id = ?", e.UserID).
			Select("MAX(position)").Scan(&maxPos).Error; err != nil {
			return err
		}
		if maxPos != nil {
			e.Position = *maxPos + 1
		}
		return tx.Create(e).Error
	})
}

// Update saves the editable fields of an entry.
func (r *Scorecard) Update(ctx context.Context, e *model.ScorecardEntry) error {
	tx := r.db.WithContext(ctx).Model(e).Where("user_id = ?", e.UserID).
		Select("Description", "Rating", "TimeOfDay").Updates(e)
	return requireAffected(tx)
}

// Get returns one entry owned by the user.
func (r *Scorecard) Get(ctx context.Context, userID, id uuid.UUID) (*model.ScorecardEntry, error) {
	var e model.ScorecardEntry
	err := r.db.WithContext(ctx).Where("user_id = ? AND id = ?", userID, id).Take(&e).Error
	return &e, translate(err)
}

// Delete removes an entry.
func (r *Scorecard) Delete(ctx context.Context, userID, id uuid.UUID) error {
	tx := r.db.WithContext(ctx).Where("user_id = ? AND id = ?", userID, id).Delete(&model.ScorecardEntry{})
	return requireAffected(tx)
}
