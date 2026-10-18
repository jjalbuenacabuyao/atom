package model

import (
	"time"

	"github.com/google/uuid"
)

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
