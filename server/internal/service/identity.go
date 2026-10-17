package service

import (
	"context"
	"strings"

	"atom/internal/apperr"
	"atom/internal/dto"
	"atom/internal/model"

	"github.com/google/uuid"
)

// IdentityStore is the persistence required by Identities.
type IdentityStore interface {
	IdentityGetter
	List(ctx context.Context, userID uuid.UUID) ([]model.Identity, error)
	Create(ctx context.Context, i *model.Identity) error
	Update(ctx context.Context, i *model.Identity) error
	Delete(ctx context.Context, userID, id uuid.UUID) error
	VoteCounts(ctx context.Context, userID uuid.UUID) (map[uuid.UUID]int, error)
}

// HabitLister lists habits, used to count habits per identity.
type HabitLister interface {
	List(ctx context.Context, userID uuid.UUID, includeArchived bool) ([]model.Habit, error)
}

// Identities manages identity statements: "the most effective way to change
// your habits is to focus not on what you want to achieve, but on who you
// wish to become."
type Identities struct {
	identities IdentityStore
	habits     HabitLister
}

// NewIdentities returns an Identities service.
func NewIdentities(identities IdentityStore, habits HabitLister) *Identities {
	return &Identities{identities: identities, habits: habits}
}

// List returns identities with the votes cast for each.
func (s *Identities) List(ctx context.Context, userID uuid.UUID) ([]dto.Identity, error) {
	items, err := s.identities.List(ctx, userID)
	if err != nil {
		return nil, err
	}
	votes, err := s.identities.VoteCounts(ctx, userID)
	if err != nil {
		return nil, err
	}
	habits, err := s.habits.List(ctx, userID, false)
	if err != nil {
		return nil, err
	}
	habitCounts := make(map[uuid.UUID]int)
	for _, h := range habits {
		if h.IdentityID != nil {
			habitCounts[*h.IdentityID]++
		}
	}
	out := make([]dto.Identity, len(items))
	for i, it := range items {
		out[i] = toIdentityDTO(&it)
		out[i].Votes = votes[it.ID]
		out[i].HabitCount = habitCounts[it.ID]
	}
	return out, nil
}

// Create adds an identity.
func (s *Identities) Create(ctx context.Context, userID uuid.UUID, in dto.IdentityInput) (dto.Identity, error) {
	i := &model.Identity{UserID: userID}
	if err := applyIdentity(i, in); err != nil {
		return dto.Identity{}, err
	}
	if err := s.identities.Create(ctx, i); err != nil {
		return dto.Identity{}, err
	}
	return toIdentityDTO(i), nil
}

// Update edits an identity.
func (s *Identities) Update(ctx context.Context, userID, id uuid.UUID, in dto.IdentityInput) (dto.Identity, error) {
	i, err := s.identities.Get(ctx, userID, id)
	if err != nil {
		return dto.Identity{}, err
	}
	if err := applyIdentity(i, in); err != nil {
		return dto.Identity{}, err
	}
	if err := s.identities.Update(ctx, i); err != nil {
		return dto.Identity{}, err
	}
	return toIdentityDTO(i), nil
}

// Delete removes an identity. Linked habits are kept but detached.
func (s *Identities) Delete(ctx context.Context, userID, id uuid.UUID) error {
	return s.identities.Delete(ctx, userID, id)
}

func applyIdentity(i *model.Identity, in dto.IdentityInput) error {
	statement := strings.TrimSpace(in.Statement)
	if statement == "" {
		return apperr.Validation("Please check the highlighted fields", map[string]string{"statement": "Statement is required"})
	}
	i.Statement = statement
	i.Description = strings.TrimSpace(in.Description)
	return nil
}

func toIdentityDTO(i *model.Identity) dto.Identity {
	return dto.Identity{ID: i.ID, Statement: i.Statement, Description: i.Description, CreatedAt: i.CreatedAt}
}
