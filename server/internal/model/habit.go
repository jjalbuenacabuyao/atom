// Package model defines the GORM persistence models, one per file.
package model

import (
	"time"

	"github.com/google/uuid"
)

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
