package service

import (
	"context"
	"strings"
	"time"

	"atom/internal/apperr"
	"atom/internal/dto"
	"atom/internal/habitstats"
	"atom/internal/model"

	"github.com/google/uuid"
)

// HabitStore is the persistence required by Habits.
type HabitStore interface {
	List(ctx context.Context, userID uuid.UUID, includeArchived bool) ([]model.Habit, error)
	Get(ctx context.Context, userID, id uuid.UUID) (*model.Habit, error)
	Create(ctx context.Context, h *model.Habit) error
	Update(ctx context.Context, h *model.Habit) error
	SetArchived(ctx context.Context, userID, id uuid.UUID, archivedAt *time.Time) error
	Delete(ctx context.Context, userID, id uuid.UUID) error
	Reorder(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) error
	LogDates(ctx context.Context, userID uuid.UUID, habitIDs []uuid.UUID) (map[uuid.UUID]map[time.Time]bool, error)
	ListLogs(ctx context.Context, userID, habitID uuid.UUID, from, to time.Time) ([]model.HabitLog, error)
	UpsertLog(ctx context.Context, l *model.HabitLog) error
	DeleteLog(ctx context.Context, userID, habitID uuid.UUID, date time.Time) error
	DailyCounts(ctx context.Context, userID uuid.UUID, from, to time.Time) (map[time.Time]int, error)
}

// IdentityGetter looks up a single identity, used to validate ownership.
type IdentityGetter interface {
	Get(ctx context.Context, userID, id uuid.UUID) (*model.Identity, error)
}

// Habits implements habit management and progress tracking.
type Habits struct {
	habits     HabitStore
	identities IdentityGetter
	now        func() time.Time
}

// NewHabits returns a Habits service.
func NewHabits(habits HabitStore, identities IdentityGetter) *Habits {
	return &Habits{habits: habits, identities: identities, now: time.Now}
}

// List returns the user's habits with stats computed as of today.
func (s *Habits) List(ctx context.Context, userID uuid.UUID, today time.Time, includeArchived bool) ([]dto.Habit, error) {
	habits, err := s.habits.List(ctx, userID, includeArchived)
	if err != nil {
		return nil, err
	}
	return s.withStats(ctx, userID, habits, today)
}

// Get returns a single habit with stats.
func (s *Habits) Get(ctx context.Context, userID, id uuid.UUID, today time.Time) (dto.Habit, error) {
	h, err := s.habits.Get(ctx, userID, id)
	if err != nil {
		return dto.Habit{}, err
	}
	out, err := s.withStats(ctx, userID, []model.Habit{*h}, today)
	if err != nil {
		return dto.Habit{}, err
	}
	return out[0], nil
}

// Create adds a new habit.
func (s *Habits) Create(ctx context.Context, userID uuid.UUID, in dto.HabitInput, today time.Time) (dto.Habit, error) {
	h := &model.Habit{UserID: userID}
	if err := s.apply(ctx, h, in, today); err != nil {
		return dto.Habit{}, err
	}
	if err := s.habits.Create(ctx, h); err != nil {
		return dto.Habit{}, err
	}
	return s.Get(ctx, userID, h.ID, today)
}

// Update replaces the editable fields of a habit.
func (s *Habits) Update(ctx context.Context, userID, id uuid.UUID, in dto.HabitInput, today time.Time) (dto.Habit, error) {
	h, err := s.habits.Get(ctx, userID, id)
	if err != nil {
		return dto.Habit{}, err
	}
	if err := s.apply(ctx, h, in, today); err != nil {
		return dto.Habit{}, err
	}
	if err := s.habits.Update(ctx, h); err != nil {
		return dto.Habit{}, err
	}
	return s.Get(ctx, userID, id, today)
}

// Archive hides a habit from daily tracking while keeping its history.
func (s *Habits) Archive(ctx context.Context, userID, id uuid.UUID) error {
	now := s.now().UTC()
	return s.habits.SetArchived(ctx, userID, id, &now)
}

// Restore brings an archived habit back into daily tracking.
func (s *Habits) Restore(ctx context.Context, userID, id uuid.UUID) error {
	return s.habits.SetArchived(ctx, userID, id, nil)
}

// Delete permanently removes a habit and its history.
func (s *Habits) Delete(ctx context.Context, userID, id uuid.UUID) error {
	return s.habits.Delete(ctx, userID, id)
}

// Reorder sets the display order of the user's habits.
func (s *Habits) Reorder(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) error {
	return s.habits.Reorder(ctx, userID, ids)
}

// Check records a completion ("casts a vote") for a habit on a date.
func (s *Habits) Check(ctx context.Context, userID, habitID uuid.UUID, date time.Time, in dto.LogInput) error {
	h, err := s.habits.Get(ctx, userID, habitID)
	if err != nil {
		return err
	}
	if h.ArchivedAt != nil {
		return apperr.BadRequest("Archived habits cannot be checked in")
	}
	if date.Before(habitstats.Normalize(h.StartDate)) {
		return apperr.BadRequest("Date is before the habit's start date")
	}
	// Allow one day of slack for users in time zones ahead of UTC.
	if date.After(habitstats.Normalize(s.now().UTC()).AddDate(0, 0, 1)) {
		return apperr.BadRequest("Cannot check in a habit for a future date")
	}
	return s.habits.UpsertLog(ctx, &model.HabitLog{
		HabitID: habitID,
		UserID:  userID,
		Date:    date,
		Note:    strings.TrimSpace(in.Note),
	})
}

// Uncheck removes the completion for a habit on a date.
func (s *Habits) Uncheck(ctx context.Context, userID, habitID uuid.UUID, date time.Time) error {
	return s.habits.DeleteLog(ctx, userID, habitID, date)
}

// Logs returns a habit's completions in [from, to].
func (s *Habits) Logs(ctx context.Context, userID, habitID uuid.UUID, from, to time.Time) ([]dto.HabitLog, error) {
	if to.Before(from) {
		return nil, apperr.BadRequest("'from' must not be after 'to'")
	}
	if to.Sub(from) > 3*366*24*time.Hour {
		return nil, apperr.BadRequest("Date range may span at most three years")
	}
	if _, err := s.habits.Get(ctx, userID, habitID); err != nil {
		return nil, err
	}
	logs, err := s.habits.ListLogs(ctx, userID, habitID, from, to)
	if err != nil {
		return nil, err
	}
	out := make([]dto.HabitLog, len(logs))
	for i, l := range logs {
		out[i] = dto.HabitLog{Date: l.Date.Format(habitstats.DateLayout), Note: l.Note}
	}
	return out, nil
}

// Activity returns the number of completions per day over the trailing
// number of days ending today, including days without completions.
func (s *Habits) Activity(ctx context.Context, userID uuid.UUID, today time.Time, days int) ([]dto.DayCount, error) {
	from := today.AddDate(0, 0, -(days - 1))
	counts, err := s.habits.DailyCounts(ctx, userID, from, today)
	if err != nil {
		return nil, err
	}
	out := make([]dto.DayCount, 0, days)
	for d := from; !d.After(today); d = d.AddDate(0, 0, 1) {
		out = append(out, dto.DayCount{Date: d.Format(habitstats.DateLayout), Count: counts[d]})
	}
	return out, nil
}

func (s *Habits) apply(ctx context.Context, h *model.Habit, in dto.HabitInput, today time.Time) error {
	if in.IdentityID != nil {
		if _, err := s.identities.Get(ctx, h.UserID, *in.IdentityID); err != nil {
			return apperr.Validation("Please check the highlighted fields", map[string]string{"identityId": "Unknown identity"})
		}
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return apperr.Validation("Please check the highlighted fields", map[string]string{"name": "Name is required"})
	}

	start := today
	if in.StartDate != "" {
		d, err := habitstats.ParseDate(in.StartDate)
		if err != nil {
			return apperr.Validation("Please check the highlighted fields", map[string]string{"startDate": err.Error()})
		}
		start = d
	} else if !h.StartDate.IsZero() {
		start = h.StartDate
	}

	h.IdentityID = in.IdentityID
	h.Name = name
	h.Kind = model.HabitKind(in.Kind)
	h.CueTime = in.CueTime
	h.CueLocation = strings.TrimSpace(in.CueLocation)
	h.StackAfter = strings.TrimSpace(in.StackAfter)
	h.ObviousNote = strings.TrimSpace(in.ObviousNote)
	h.AttractiveNote = strings.TrimSpace(in.AttractiveNote)
	h.EasyNote = strings.TrimSpace(in.EasyNote)
	h.SatisfyingNote = strings.TrimSpace(in.SatisfyingNote)
	h.ScheduleDays = in.ScheduleDays
	h.Color = strings.ToUpper(in.Color)
	h.Icon = in.Icon
	h.StartDate = start
	return nil
}

func (s *Habits) withStats(ctx context.Context, userID uuid.UUID, habits []model.Habit, today time.Time) ([]dto.Habit, error) {
	ids := make([]uuid.UUID, len(habits))
	for i, h := range habits {
		ids[i] = h.ID
	}
	logs, err := s.habits.LogDates(ctx, userID, ids)
	if err != nil {
		return nil, err
	}
	out := make([]dto.Habit, len(habits))
	for i := range habits {
		h := &habits[i]
		out[i] = toHabitDTO(h, habitstats.Compute(h.StartDate, h.ScheduleDays, logs[h.ID], today))
	}
	return out, nil
}

func toHabitDTO(h *model.Habit, stats habitstats.Stats) dto.Habit {
	out := dto.Habit{
		ID:             h.ID,
		Name:           h.Name,
		Kind:           string(h.Kind),
		CueTime:        h.CueTime,
		CueLocation:    h.CueLocation,
		StackAfter:     h.StackAfter,
		ObviousNote:    h.ObviousNote,
		AttractiveNote: h.AttractiveNote,
		EasyNote:       h.EasyNote,
		SatisfyingNote: h.SatisfyingNote,
		ScheduleDays:   h.ScheduleDays,
		Color:          h.Color,
		Icon:           h.Icon,
		Position:       h.Position,
		StartDate:      h.StartDate.Format(habitstats.DateLayout),
		ArchivedAt:     h.ArchivedAt,
		CreatedAt:      h.CreatedAt,
		Stats:          stats,
	}
	if h.Identity != nil {
		out.Identity = &dto.IdentityRef{ID: h.Identity.ID, Statement: h.Identity.Statement}
	}
	return out
}
