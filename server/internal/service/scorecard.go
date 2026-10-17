package service

import (
	"context"
	"strings"

	"atom/internal/apperr"
	"atom/internal/dto"
	"atom/internal/model"

	"github.com/google/uuid"
)

// ScorecardStore is the persistence required by Scorecard.
type ScorecardStore interface {
	List(ctx context.Context, userID uuid.UUID) ([]model.ScorecardEntry, error)
	Get(ctx context.Context, userID, id uuid.UUID) (*model.ScorecardEntry, error)
	Create(ctx context.Context, e *model.ScorecardEntry) error
	Update(ctx context.Context, e *model.ScorecardEntry) error
	Delete(ctx context.Context, userID, id uuid.UUID) error
}

// Scorecard manages the Habits Scorecard, the first step to behaviour change:
// becoming aware of your current habits.
type Scorecard struct{ store ScorecardStore }

// NewScorecard returns a Scorecard service.
func NewScorecard(store ScorecardStore) *Scorecard { return &Scorecard{store: store} }

// List returns the user's scorecard.
func (s *Scorecard) List(ctx context.Context, userID uuid.UUID) ([]dto.ScorecardEntry, error) {
	entries, err := s.store.List(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]dto.ScorecardEntry, len(entries))
	for i := range entries {
		out[i] = toScorecardDTO(&entries[i])
	}
	return out, nil
}

// Create appends an entry.
func (s *Scorecard) Create(ctx context.Context, userID uuid.UUID, in dto.ScorecardInput) (dto.ScorecardEntry, error) {
	e := &model.ScorecardEntry{UserID: userID}
	if err := applyScorecard(e, in); err != nil {
		return dto.ScorecardEntry{}, err
	}
	if err := s.store.Create(ctx, e); err != nil {
		return dto.ScorecardEntry{}, err
	}
	return toScorecardDTO(e), nil
}

// Update edits an entry.
func (s *Scorecard) Update(ctx context.Context, userID, id uuid.UUID, in dto.ScorecardInput) (dto.ScorecardEntry, error) {
	e, err := s.store.Get(ctx, userID, id)
	if err != nil {
		return dto.ScorecardEntry{}, err
	}
	if err := applyScorecard(e, in); err != nil {
		return dto.ScorecardEntry{}, err
	}
	if err := s.store.Update(ctx, e); err != nil {
		return dto.ScorecardEntry{}, err
	}
	return toScorecardDTO(e), nil
}

// Delete removes an entry.
func (s *Scorecard) Delete(ctx context.Context, userID, id uuid.UUID) error {
	return s.store.Delete(ctx, userID, id)
}

func applyScorecard(e *model.ScorecardEntry, in dto.ScorecardInput) error {
	desc := strings.TrimSpace(in.Description)
	if desc == "" {
		return apperr.Validation("Please check the highlighted fields", map[string]string{"description": "Description is required"})
	}
	e.Description = desc
	e.Rating = model.Rating(in.Rating)
	e.TimeOfDay = in.TimeOfDay
	return nil
}

func toScorecardDTO(e *model.ScorecardEntry) dto.ScorecardEntry {
	return dto.ScorecardEntry{
		ID:          e.ID,
		Description: e.Description,
		Rating:      string(e.Rating),
		TimeOfDay:   e.TimeOfDay,
		Position:    e.Position,
	}
}
