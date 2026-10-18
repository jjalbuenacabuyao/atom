package model

import (
	"time"

	"github.com/google/uuid"
)

// Rating classifies a habit on the Habits Scorecard.
type Rating string

// Scorecard ratings.
const (
	RatingPositive Rating = "positive"
	RatingNegative Rating = "negative"
	RatingNeutral  Rating = "neutral"
)

// ScorecardEntry is a line on the user's Habits Scorecard.
type ScorecardEntry struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index"`
	Description string    `gorm:"not null"`
	Rating      Rating    `gorm:"not null"`
	TimeOfDay   string    `gorm:"not null;default:''"`
	Position    int       `gorm:"not null;default:0"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
