// Package dto defines the JSON request and response contracts of the HTTP
// API. Request types carry validation rules evaluated by Gin's binding layer.
package dto

import (
	"time"

	"atom/internal/habitstats"

	"github.com/google/uuid"
)

// RegisterRequest creates a new account.
type RegisterRequest struct {
	Name     string `json:"name" binding:"required,max=80"`
	Email    string `json:"email" binding:"required,email,max=254"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}

// LoginRequest authenticates an existing account.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// User is the public representation of an account.
type User struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"createdAt"`
}

// IdentityInput creates or updates an identity.
type IdentityInput struct {
	Statement   string `json:"statement" binding:"required,max=160"`
	Description string `json:"description" binding:"max=1000"`
}

// Identity is an identity statement with the votes cast for it.
type Identity struct {
	ID          uuid.UUID `json:"id"`
	Statement   string    `json:"statement"`
	Description string    `json:"description"`
	Votes       int       `json:"votes"`
	HabitCount  int       `json:"habitCount"`
	CreatedAt   time.Time `json:"createdAt"`
}

// IdentityRef is a compact identity embedded in other resources.
type IdentityRef struct {
	ID        uuid.UUID `json:"id"`
	Statement string    `json:"statement"`
}

// HabitInput creates or updates a habit.
type HabitInput struct {
	Name           string     `json:"name" binding:"required,max=120"`
	Kind           string     `json:"kind" binding:"required,oneof=build break"`
	IdentityID     *uuid.UUID `json:"identityId"`
	CueTime        string     `json:"cueTime" binding:"omitempty,datetime=15:04"`
	CueLocation    string     `json:"cueLocation" binding:"max=200"`
	StackAfter     string     `json:"stackAfter" binding:"max=200"`
	ObviousNote    string     `json:"obviousNote" binding:"max=1000"`
	AttractiveNote string     `json:"attractiveNote" binding:"max=1000"`
	EasyNote       string     `json:"easyNote" binding:"max=1000"`
	SatisfyingNote string     `json:"satisfyingNote" binding:"max=1000"`
	ScheduleDays   int16      `json:"scheduleDays" binding:"required,min=1,max=127"`
	Color          string     `json:"color" binding:"required,hexcolor"`
	Icon           string     `json:"icon" binding:"required,max=40"`
	StartDate      string     `json:"startDate" binding:"omitempty,datetime=2006-01-02"`
}

// Habit is a habit together with its computed progress.
type Habit struct {
	ID             uuid.UUID        `json:"id"`
	Name           string           `json:"name"`
	Kind           string           `json:"kind"`
	Identity       *IdentityRef     `json:"identity"`
	CueTime        string           `json:"cueTime"`
	CueLocation    string           `json:"cueLocation"`
	StackAfter     string           `json:"stackAfter"`
	ObviousNote    string           `json:"obviousNote"`
	AttractiveNote string           `json:"attractiveNote"`
	EasyNote       string           `json:"easyNote"`
	SatisfyingNote string           `json:"satisfyingNote"`
	ScheduleDays   int16            `json:"scheduleDays"`
	Color          string           `json:"color"`
	Icon           string           `json:"icon"`
	Position       int              `json:"position"`
	StartDate      string           `json:"startDate"`
	ArchivedAt     *time.Time       `json:"archivedAt"`
	CreatedAt      time.Time        `json:"createdAt"`
	Stats          habitstats.Stats `json:"stats"`
}

// ReorderRequest sets the display order of habits.
type ReorderRequest struct {
	IDs []uuid.UUID `json:"ids" binding:"required,min=1,max=500"`
}

// LogInput records a habit completion.
type LogInput struct {
	Note string `json:"note" binding:"max=500"`
}

// HabitLog is a single completion.
type HabitLog struct {
	Date string `json:"date"`
	Note string `json:"note"`
}

// DayCount is the number of completions on a date.
type DayCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// Dashboard summarises the user's progress for a day.
type Dashboard struct {
	Date           string     `json:"date"`
	Habits         []Habit    `json:"habits"`
	ScheduledCount int        `json:"scheduledCount"`
	CompletedCount int        `json:"completedCount"`
	TotalVotes     int        `json:"totalVotes"`
	BestStreak     int        `json:"bestStreak"`
	Identities     []Identity `json:"identities"`
	Activity       []DayCount `json:"activity"`
}

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
