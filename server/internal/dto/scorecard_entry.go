package dto

import (
	"github.com/google/uuid"
)

// ScorecardInput creates or updates a scorecard entry.
type ScorecardInput struct {
	Description string `json:"description" binding:"required,max=200"`
	Rating      string `json:"rating" binding:"required,oneof=positive negative neutral"`
	TimeOfDay   string `json:"timeOfDay" binding:"omitempty,datetime=15:04"`
}

// ScorecardEntry is a line on the Habits Scorecard.
type ScorecardEntry struct {
	ID          uuid.UUID `json:"id"`
	Description string    `json:"description"`
	Rating      string    `json:"rating"`
	TimeOfDay   string    `json:"timeOfDay"`
	Position    int       `json:"position"`
}
