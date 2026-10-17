package service

import (
	"context"
	"time"

	"atom/internal/dto"
	"atom/internal/habitstats"

	"github.com/google/uuid"
)

// Activity history bounds for the dashboard, in days.
const (
	DefaultActivityDays = 7 * 26
	MinActivityDays     = 7
	MaxActivityDays     = 7 * 53
)

// Dashboard aggregates the user's daily overview.
type Dashboard struct {
	habits     *Habits
	identities *Identities
}

// NewDashboard returns a Dashboard service.
func NewDashboard(habits *Habits, identities *Identities) *Dashboard {
	return &Dashboard{habits: habits, identities: identities}
}

// Get builds the dashboard for the user's local date today, including the
// given number of days of activity history (clamped to the allowed range).
func (s *Dashboard) Get(ctx context.Context, userID uuid.UUID, today time.Time, days int) (dto.Dashboard, error) {
	days = min(max(days, MinActivityDays), MaxActivityDays)
	habits, err := s.habits.List(ctx, userID, today, false)
	if err != nil {
		return dto.Dashboard{}, err
	}
	identities, err := s.identities.List(ctx, userID)
	if err != nil {
		return dto.Dashboard{}, err
	}
	activity, err := s.habits.Activity(ctx, userID, today, days)
	if err != nil {
		return dto.Dashboard{}, err
	}

	out := dto.Dashboard{
		Date:       today.Format(habitstats.DateLayout),
		Habits:     habits,
		Identities: identities,
		Activity:   activity,
	}
	for _, h := range habits {
		out.TotalVotes += h.Stats.TotalVotes
		out.BestStreak = max(out.BestStreak, h.Stats.CurrentStreak)
		if h.Stats.ScheduledToday {
			out.ScheduledCount++
			if h.Stats.CompletedToday {
				out.CompletedCount++
			}
		}
	}
	return out, nil
}
