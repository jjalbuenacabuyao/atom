package handler

import (
	"net/http"
	"strconv"

	"atom/internal/apperr"
	"atom/internal/dto"
	"atom/internal/middleware"
	"atom/internal/service"

	"github.com/gin-gonic/gin"
)

// IdentityHandler serves identity endpoints.
type IdentityHandler struct {
	identities *service.Identities
}

func (h *IdentityHandler) list(c *gin.Context) error {
	items, err := h.identities.List(c.Request.Context(), middleware.UserID(c))
	if err != nil {
		return err
	}
	c.JSON(http.StatusOK, items)
	return nil
}

func (h *IdentityHandler) create(c *gin.Context) error {
	var in dto.IdentityInput
	if err := bindJSON(c, &in); err != nil {
		return err
	}
	item, err := h.identities.Create(c.Request.Context(), middleware.UserID(c), in)
	if err != nil {
		return err
	}
	c.JSON(http.StatusCreated, item)
	return nil
}

func (h *IdentityHandler) update(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	var in dto.IdentityInput
	if err := bindJSON(c, &in); err != nil {
		return err
	}
	item, err := h.identities.Update(c.Request.Context(), middleware.UserID(c), id, in)
	if err != nil {
		return err
	}
	c.JSON(http.StatusOK, item)
	return nil
}

func (h *IdentityHandler) delete(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	if err := h.identities.Delete(c.Request.Context(), middleware.UserID(c), id); err != nil {
		return err
	}
	c.Status(http.StatusNoContent)
	return nil
}

// ScorecardHandler serves Habits Scorecard endpoints.
type ScorecardHandler struct {
	scorecard *service.Scorecard
}

func (h *ScorecardHandler) list(c *gin.Context) error {
	items, err := h.scorecard.List(c.Request.Context(), middleware.UserID(c))
	if err != nil {
		return err
	}
	c.JSON(http.StatusOK, items)
	return nil
}

func (h *ScorecardHandler) create(c *gin.Context) error {
	var in dto.ScorecardInput
	if err := bindJSON(c, &in); err != nil {
		return err
	}
	item, err := h.scorecard.Create(c.Request.Context(), middleware.UserID(c), in)
	if err != nil {
		return err
	}
	c.JSON(http.StatusCreated, item)
	return nil
}

func (h *ScorecardHandler) update(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	var in dto.ScorecardInput
	if err := bindJSON(c, &in); err != nil {
		return err
	}
	item, err := h.scorecard.Update(c.Request.Context(), middleware.UserID(c), id, in)
	if err != nil {
		return err
	}
	c.JSON(http.StatusOK, item)
	return nil
}

func (h *ScorecardHandler) delete(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	if err := h.scorecard.Delete(c.Request.Context(), middleware.UserID(c), id); err != nil {
		return err
	}
	c.Status(http.StatusNoContent)
	return nil
}

// DashboardHandler serves the daily overview.
type DashboardHandler struct {
	dashboard *service.Dashboard
}

func (h *DashboardHandler) get(c *gin.Context) error {
	day, err := today(c)
	if err != nil {
		return err
	}
	days := service.DefaultActivityDays
	if raw := c.Query("days"); raw != "" {
		if days, err = strconv.Atoi(raw); err != nil {
			return apperr.BadRequest("days must be a whole number")
		}
	}
	out, err := h.dashboard.Get(c.Request.Context(), middleware.UserID(c), day, days)
	if err != nil {
		return err
	}
	c.JSON(http.StatusOK, out)
	return nil
}
