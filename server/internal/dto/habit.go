// Package dto defines the JSON request and response contracts of the HTTP
// API, one file per resource. Request types carry validation rules evaluated
// by Gin's binding layer.
package dto

import (
	"time"

	"atom/internal/habitstats"

	"github.com/google/uuid"
)

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
