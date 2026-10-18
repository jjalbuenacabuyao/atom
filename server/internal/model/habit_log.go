package model

import (
	"time"

	"github.com/google/uuid"
)

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
