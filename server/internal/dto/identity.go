package dto

import (
	"time"

	"github.com/google/uuid"
)

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
