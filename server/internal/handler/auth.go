package handler

import (
	"net/http"

	"atom/internal/dto"
	"atom/internal/middleware"
	"atom/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthHandler serves registration, login and session endpoints.
type AuthHandler struct {
	auth         *service.Auth
	cookieSecure bool
}

func (h *AuthHandler) register(c *gin.Context) error {
	var req dto.RegisterRequest
	if err := bindJSON(c, &req); err != nil {
		return err
	}
	u, err := h.auth.Register(c.Request.Context(), req)
	if err != nil {
		return err
	}
	if err := h.startSession(c, u.ID); err != nil {
		return err
	}
	c.JSON(http.StatusCreated, service.ToUserDTO(u))
	return nil
}

func (h *AuthHandler) login(c *gin.Context) error {
	var req dto.LoginRequest
	if err := bindJSON(c, &req); err != nil {
		return err
	}
	u, err := h.auth.Login(c.Request.Context(), req)
	if err != nil {
		return err
	}
	if err := h.startSession(c, u.ID); err != nil {
		return err
	}
	c.JSON(http.StatusOK, service.ToUserDTO(u))
	return nil
}

func (h *AuthHandler) logout(c *gin.Context) error {
	middleware.ClearSession(c, h.cookieSecure)
	c.Status(http.StatusNoContent)
	return nil
}

func (h *AuthHandler) me(c *gin.Context) error {
	u, err := h.auth.Me(c.Request.Context(), middleware.UserID(c))
	if err != nil {
		return err
	}
	c.JSON(http.StatusOK, service.ToUserDTO(u))
	return nil
}

// startSession issues a session token for the user and sets it as a cookie.
func (h *AuthHandler) startSession(c *gin.Context, userID uuid.UUID) error {
	token, err := h.auth.IssueToken(userID)
	if err != nil {
		return err
	}
	middleware.SetSession(c, token, h.auth.TTL(), h.cookieSecure)
	return nil
}
