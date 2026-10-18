package dto

import (
	"time"

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
