// Package apperr defines transport-agnostic application errors that handlers
// translate into HTTP responses.
package apperr

import (
	"errors"
	"net/http"
)

// Error is an application error with a stable machine-readable code.
type Error struct {
	Status  int               `json:"-"`
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
	cause   error
}

func (e *Error) Error() string {
	if e.cause != nil {
		return e.Message + ": " + e.cause.Error()
	}
	return e.Message
}

func (e *Error) Unwrap() error { return e.cause }

// Common application errors.
var (
	ErrNotFound           = &Error{Status: http.StatusNotFound, Code: "not_found", Message: "Resource not found"}
	ErrUnauthorized       = &Error{Status: http.StatusUnauthorized, Code: "unauthorized", Message: "Authentication required"}
	ErrInvalidCredentials = &Error{Status: http.StatusUnauthorized, Code: "invalid_credentials", Message: "Invalid email or password"}
	ErrEmailTaken         = &Error{Status: http.StatusConflict, Code: "email_taken", Message: "An account with this email already exists"}
	ErrForbidden          = &Error{Status: http.StatusForbidden, Code: "forbidden", Message: "You do not have access to this resource"}
	ErrTooManyRequests    = &Error{Status: http.StatusTooManyRequests, Code: "rate_limited", Message: "Too many requests, please slow down"}
	ErrInternal           = &Error{Status: http.StatusInternalServerError, Code: "internal", Message: "Something went wrong"}
)

// Validation returns a 422 error carrying per-field messages.
func Validation(message string, fields map[string]string) *Error {
	return &Error{Status: http.StatusUnprocessableEntity, Code: "validation_failed", Message: message, Fields: fields}
}

// BadRequest returns a 400 error with the given message.
func BadRequest(message string) *Error {
	return &Error{Status: http.StatusBadRequest, Code: "bad_request", Message: message}
}

// As extracts an *Error from err, falling back to ErrInternal.
func As(err error) *Error {
	if e, ok := errors.AsType[*Error](err); ok {
		return e
	}
	return ErrInternal
}
