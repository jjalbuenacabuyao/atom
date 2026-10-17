// Package handler wires HTTP routes to application services.
package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"strings"
	"sync"
	"time"

	"atom/internal/apperr"
	"atom/internal/habitstats"
	"atom/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// handlerFunc is a Gin handler that returns an error, letting each endpoint
// focus on the happy path while errors are rendered consistently.
type handlerFunc func(c *gin.Context) error

func wrap(h handlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := h(c); err != nil {
			respondError(c, err)
		}
	}
}

func respondError(c *gin.Context, err error) {
	appErr := apperr.As(err)
	if appErr.Status >= http.StatusInternalServerError {
		// Record the underlying cause for the request logger; never leak it.
		_ = c.Error(err)
	}
	middleware.Abort(c, appErr)
}

var registerValidatorOnce sync.Once

// useJSONFieldNames makes validation errors report JSON field names.
func useJSONFieldNames() {
	registerValidatorOnce.Do(func() {
		if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
			v.RegisterTagNameFunc(func(f reflect.StructField) string {
				name, _, _ := strings.Cut(f.Tag.Get("json"), ",")
				if name == "-" {
					return ""
				}
				return name
			})
		}
	})
}

// bindJSON decodes and validates a JSON request body.
func bindJSON(c *gin.Context, dst any) error {
	err := c.ShouldBindJSON(dst)
	if err == nil {
		return nil
	}
	var (
		verrs     validator.ValidationErrors
		syntaxErr *json.SyntaxError
		typeErr   *json.UnmarshalTypeError
		maxErr    *http.MaxBytesError
	)
	switch {
	case errors.As(err, &verrs):
		fields := make(map[string]string, len(verrs))
		for _, fe := range verrs {
			fields[fe.Field()] = validationMessage(fe)
		}
		return apperr.Validation("Please check the highlighted fields", fields)
	case errors.As(err, &maxErr):
		return &apperr.Error{Status: http.StatusRequestEntityTooLarge, Code: "body_too_large", Message: "Request body is too large"}
	case errors.As(err, &typeErr):
		return apperr.BadRequest(fmt.Sprintf("Invalid value for field %q", typeErr.Field))
	case errors.As(err, &syntaxErr), errors.Is(err, io.EOF), errors.Is(err, io.ErrUnexpectedEOF):
		return apperr.BadRequest("Request body must be valid JSON")
	default:
		return apperr.BadRequest("Invalid request: " + err.Error())
	}
}

func validationMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Enter a valid email address"
	case "min":
		if fe.Kind() == reflect.String {
			return fmt.Sprintf("Must be at least %s characters", fe.Param())
		}
		return fmt.Sprintf("Must be at least %s", fe.Param())
	case "max":
		if fe.Kind() == reflect.String {
			return fmt.Sprintf("Must be at most %s characters", fe.Param())
		}
		return fmt.Sprintf("Must be at most %s", fe.Param())
	case "oneof":
		return "Must be one of: " + fe.Param()
	case "hexcolor":
		return "Must be a hex color such as #6750A4"
	case "datetime":
		return "Must match the format " + fe.Param()
	default:
		return "Invalid value"
	}
}

// idParam parses the ":id" UUID path parameter.
func idParam(c *gin.Context) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return uuid.Nil, apperr.ErrNotFound
	}
	return id, nil
}

// dateParam parses a YYYY-MM-DD path parameter.
func dateParam(c *gin.Context, name string) (time.Time, error) {
	d, err := habitstats.ParseDate(c.Param(name))
	if err != nil {
		return time.Time{}, apperr.BadRequest(err.Error())
	}
	return d, nil
}

// dateQuery parses an optional YYYY-MM-DD query parameter.
func dateQuery(c *gin.Context, name string, fallback time.Time) (time.Time, error) {
	raw := c.Query(name)
	if raw == "" {
		return fallback, nil
	}
	d, err := habitstats.ParseDate(raw)
	if err != nil {
		return time.Time{}, apperr.BadRequest(fmt.Sprintf("%s: %s", name, err.Error()))
	}
	return d, nil
}

// today returns the client's local date from the "today" query parameter.
// Clients send it because only they know the user's time zone; the server's
// UTC date is used as a fallback.
func today(c *gin.Context) (time.Time, error) {
	return dateQuery(c, "today", habitstats.Normalize(time.Now().UTC()))
}
