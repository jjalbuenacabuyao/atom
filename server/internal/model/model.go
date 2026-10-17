// Package model defines the GORM persistence models.
package model

import (
	"time"

	"github.com/google/uuid"
)

// User is an account holder.
type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email        string    `gorm:"not null"`
	Name         string    `gorm:"not null"`
	PasswordHash string    `gorm:"not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Identity is a statement about who the user wants to become
// ("I am a reader"). Habits cast votes for identities.
type Identity struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index"`
	Statement   string    `gorm:"not null"`
	Description string    `gorm:"not null;default:''"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// TableName overrides GORM's default pluralisation ("identitys").
func (Identity) TableName() string { return "identities" }

// HabitKind distinguishes habits to build from habits to break.
type HabitKind string

// Habit kinds.
const (
	HabitKindBuild HabitKind = "build"
	HabitKindBreak HabitKind = "break"
)

// Habit is a behaviour the user wants to build or break, designed around the
// Four Laws of Behavior Change.
type Habit struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID         uuid.UUID  `gorm:"type:uuid;not null;index"`
	IdentityID     *uuid.UUID `gorm:"type:uuid"`
	Name           string     `gorm:"not null"`
	Kind           HabitKind  `gorm:"not null;default:build"`
	CueTime        string     `gorm:"not null;default:''"`
	CueLocation    string     `gorm:"not null;default:''"`
	StackAfter     string     `gorm:"not null;default:''"`
	ObviousNote    string     `gorm:"not null;default:''"`
	AttractiveNote string     `gorm:"not null;default:''"`
	EasyNote       string     `gorm:"not null;default:''"`
	SatisfyingNote string     `gorm:"not null;default:''"`
	ScheduleDays   int16      `gorm:"not null;default:127"`
	Color          string     `gorm:"not null"`
	Icon           string     `gorm:"not null"`
	Position       int        `gorm:"not null;default:0"`
	StartDate      time.Time  `gorm:"type:date;not null"`
	ArchivedAt     *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time

	Identity *Identity `gorm:"foreignKey:IdentityID"`
}

// HabitLog records that a habit was completed (a "vote" was cast) on a date.
// For habits to break, a log means the user successfully resisted that day.
type HabitLog struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	HabitID   uuid.UUID `gorm:"type:uuid;not null"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"`
	Date      time.Time `gorm:"type:date;not null"`
	Note      string    `gorm:"not null;default:''"`
	CreatedAt time.Time
}

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
