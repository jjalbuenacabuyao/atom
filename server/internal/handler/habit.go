package handler

import (
	"net/http"
	"strconv"

	"atom/internal/dto"
	"atom/internal/middleware"
	"atom/internal/service"

	"github.com/gin-gonic/gin"
)

// HabitHandler serves habit and check-in endpoints.
type HabitHandler struct {
	habits *service.Habits
}

func (h *HabitHandler) list(c *gin.Context) error {
	day, err := today(c)
	if err != nil {
		return err
	}
	includeArchived, _ := strconv.ParseBool(c.Query("archived"))
	habits, err := h.habits.List(c.Request.Context(), middleware.UserID(c), day, includeArchived)
	if err != nil {
		return err
	}
	c.JSON(http.StatusOK, habits)
	return nil
}

func (h *HabitHandler) get(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	day, err := today(c)
	if err != nil {
		return err
	}
	habit, err := h.habits.Get(c.Request.Context(), middleware.UserID(c), id, day)
	if err != nil {
		return err
	}
	c.JSON(http.StatusOK, habit)
	return nil
}

func (h *HabitHandler) create(c *gin.Context) error {
	var in dto.HabitInput
	if err := bindJSON(c, &in); err != nil {
		return err
	}
	day, err := today(c)
	if err != nil {
		return err
	}
	habit, err := h.habits.Create(c.Request.Context(), middleware.UserID(c), in, day)
	if err != nil {
		return err
	}
	c.JSON(http.StatusCreated, habit)
	return nil
}

func (h *HabitHandler) update(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	var in dto.HabitInput
	if err := bindJSON(c, &in); err != nil {
		return err
	}
	day, err := today(c)
	if err != nil {
		return err
	}
	habit, err := h.habits.Update(c.Request.Context(), middleware.UserID(c), id, in, day)
	if err != nil {
		return err
	}
	c.JSON(http.StatusOK, habit)
	return nil
}

func (h *HabitHandler) archive(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	if err := h.habits.Archive(c.Request.Context(), middleware.UserID(c), id); err != nil {
		return err
	}
	c.Status(http.StatusNoContent)
	return nil
}

func (h *HabitHandler) restore(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	if err := h.habits.Restore(c.Request.Context(), middleware.UserID(c), id); err != nil {
		return err
	}
	c.Status(http.StatusNoContent)
	return nil
}

func (h *HabitHandler) delete(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	if err := h.habits.Delete(c.Request.Context(), middleware.UserID(c), id); err != nil {
		return err
	}
	c.Status(http.StatusNoContent)
	return nil
}

func (h *HabitHandler) reorder(c *gin.Context) error {
	var req dto.ReorderRequest
	if err := bindJSON(c, &req); err != nil {
		return err
	}
	if err := h.habits.Reorder(c.Request.Context(), middleware.UserID(c), req.IDs); err != nil {
		return err
	}
	c.Status(http.StatusNoContent)
	return nil
}

func (h *HabitHandler) logs(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	day, err := today(c)
	if err != nil {
		return err
	}
	to, err := dateQuery(c, "to", day)
	if err != nil {
		return err
	}
	from, err := dateQuery(c, "from", to.AddDate(-1, 0, 0))
	if err != nil {
		return err
	}
	logs, err := h.habits.Logs(c.Request.Context(), middleware.UserID(c), id, from, to)
	if err != nil {
		return err
	}
	c.JSON(http.StatusOK, logs)
	return nil
}

func (h *HabitHandler) check(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	date, err := dateParam(c, "date")
	if err != nil {
		return err
	}
	var in dto.LogInput
	if c.Request.ContentLength > 0 {
		if err := bindJSON(c, &in); err != nil {
			return err
		}
	}
	if err := h.habits.Check(c.Request.Context(), middleware.UserID(c), id, date, in); err != nil {
		return err
	}
	c.Status(http.StatusNoContent)
	return nil
}

func (h *HabitHandler) uncheck(c *gin.Context) error {
	id, err := idParam(c)
	if err != nil {
		return err
	}
	date, err := dateParam(c, "date")
	if err != nil {
		return err
	}
	if err := h.habits.Uncheck(c.Request.Context(), middleware.UserID(c), id, date); err != nil {
		return err
	}
	c.Status(http.StatusNoContent)
	return nil
}
