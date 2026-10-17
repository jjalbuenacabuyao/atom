package repository

import (
	"context"
	"time"

	"atom/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Habits persists habits and their completion logs.
type Habits struct{ db *gorm.DB }

// NewHabits returns a habit repository.
func NewHabits(db *gorm.DB) *Habits { return &Habits{db: db} }

// editableHabitFields lists the columns a user may change after creation.
var editableHabitFields = []string{
	"IdentityID", "Name", "Kind", "CueTime", "CueLocation", "StackAfter",
	"ObviousNote", "AttractiveNote", "EasyNote", "SatisfyingNote",
	"ScheduleDays", "Color", "Icon", "StartDate",
}

// List returns the user's habits ordered by position. Archived habits are
// included only when requested.
func (r *Habits) List(ctx context.Context, userID uuid.UUID, includeArchived bool) ([]model.Habit, error) {
	q := r.db.WithContext(ctx).Preload("Identity").Where("user_id = ?", userID)
	if !includeArchived {
		q = q.Where("archived_at IS NULL")
	}
	var out []model.Habit
	err := q.Order("position, created_at").Find(&out).Error
	return out, err
}

// Get returns one habit owned by the user.
func (r *Habits) Get(ctx context.Context, userID, id uuid.UUID) (*model.Habit, error) {
	var h model.Habit
	err := r.db.WithContext(ctx).Preload("Identity").
		Where("user_id = ? AND id = ?", userID, id).Take(&h).Error
	return &h, translate(err)
}

// Create inserts a habit at the end of the user's list.
func (r *Habits) Create(ctx context.Context, h *model.Habit) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var maxPos *int
		if err := tx.Model(&model.Habit{}).Where("user_id = ?", h.UserID).
			Select("MAX(position)").Scan(&maxPos).Error; err != nil {
			return err
		}
		if maxPos != nil {
			h.Position = *maxPos + 1
		}
		return tx.Omit("Identity").Create(h).Error
	})
}

// Update saves the editable fields of a habit.
func (r *Habits) Update(ctx context.Context, h *model.Habit) error {
	tx := r.db.WithContext(ctx).Model(h).Where("user_id = ?", h.UserID).
		Select(editableHabitFields).Omit("Identity").Updates(h)
	return requireAffected(tx)
}

// SetArchived archives or restores a habit.
func (r *Habits) SetArchived(ctx context.Context, userID, id uuid.UUID, archivedAt *time.Time) error {
	tx := r.db.WithContext(ctx).Model(&model.Habit{}).
		Where("user_id = ? AND id = ?", userID, id).
		Update("archived_at", archivedAt)
	return requireAffected(tx)
}

// Delete permanently removes a habit and, via cascade, its logs.
func (r *Habits) Delete(ctx context.Context, userID, id uuid.UUID) error {
	tx := r.db.WithContext(ctx).Where("user_id = ? AND id = ?", userID, id).Delete(&model.Habit{})
	return requireAffected(tx)
}

// Reorder assigns positions following the order of ids.
func (r *Habits) Reorder(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for i, id := range ids {
			res := tx.Model(&model.Habit{}).Where("user_id = ? AND id = ?", userID, id).Update("position", i)
			if err := requireAffected(res); err != nil {
				return err
			}
		}
		return nil
	})
}

// LogDates returns completion dates grouped by habit for the given habits.
func (r *Habits) LogDates(ctx context.Context, userID uuid.UUID, habitIDs []uuid.UUID) (map[uuid.UUID]map[time.Time]bool, error) {
	out := make(map[uuid.UUID]map[time.Time]bool, len(habitIDs))
	if len(habitIDs) == 0 {
		return out, nil
	}
	var rows []struct {
		HabitID uuid.UUID
		Date    time.Time
	}
	err := r.db.WithContext(ctx).Model(&model.HabitLog{}).
		Select("habit_id, date").
		Where("user_id = ? AND habit_id IN ?", userID, habitIDs).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		set, ok := out[row.HabitID]
		if !ok {
			set = make(map[time.Time]bool)
			out[row.HabitID] = set
		}
		set[row.Date.UTC()] = true
	}
	return out, nil
}

// ListLogs returns a habit's logs within [from, to], newest first.
func (r *Habits) ListLogs(ctx context.Context, userID, habitID uuid.UUID, from, to time.Time) ([]model.HabitLog, error) {
	var out []model.HabitLog
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND habit_id = ? AND date BETWEEN ? AND ?", userID, habitID, from, to).
		Order("date DESC").Find(&out).Error
	return out, err
}

// UpsertLog records a completion, updating the note if one already exists.
func (r *Habits) UpsertLog(ctx context.Context, l *model.HabitLog) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "habit_id"}, {Name: "date"}},
		DoUpdates: clause.AssignmentColumns([]string{"note"}),
	}).Create(l).Error
}

// DeleteLog removes the completion for a habit on a date.
func (r *Habits) DeleteLog(ctx context.Context, userID, habitID uuid.UUID, date time.Time) error {
	tx := r.db.WithContext(ctx).
		Where("user_id = ? AND habit_id = ? AND date = ?", userID, habitID, date).
		Delete(&model.HabitLog{})
	return requireAffected(tx)
}

// DailyCounts returns the number of completions per day in [from, to].
func (r *Habits) DailyCounts(ctx context.Context, userID uuid.UUID, from, to time.Time) (map[time.Time]int, error) {
	var rows []struct {
		Date  time.Time
		Count int
	}
	err := r.db.WithContext(ctx).Model(&model.HabitLog{}).
		Select("date, COUNT(*) AS count").
		Where("user_id = ? AND date BETWEEN ? AND ?", userID, from, to).
		Group("date").Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make(map[time.Time]int, len(rows))
	for _, row := range rows {
		out[row.Date.UTC()] = row.Count
	}
	return out, nil
}
