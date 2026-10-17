// Package habitstats contains the pure, storage-agnostic logic for computing
// habit streaks and progress metrics.
package habitstats

import (
	"fmt"
	"math"
	"time"
)

// DateLayout is the ISO-8601 calendar date format used across the API.
const DateLayout = time.DateOnly

// AllDays is the schedule mask for a habit performed every day.
const AllDays int16 = 0b1111111

// completionWindowDays is the trailing window used for the completion rate.
const completionWindowDays = 30

// ParseDate parses a YYYY-MM-DD string into a UTC midnight time.
func ParseDate(s string) (time.Time, error) {
	t, err := time.ParseInLocation(DateLayout, s, time.UTC)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid date %q: expected YYYY-MM-DD", s)
	}
	return t, nil
}

// Normalize truncates t to a UTC calendar date, discarding the time component.
func Normalize(t time.Time) time.Time {
	y, m, d := t.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

// IsScheduled reports whether a habit with the given weekday mask is due on
// date. Bit 0 is Sunday through bit 6 for Saturday.
func IsScheduled(mask int16, date time.Time) bool {
	return mask&(1<<uint(date.Weekday())) != 0
}

// Stats summarises progress on a single habit as of a given day.
type Stats struct {
	CurrentStreak  int     `json:"currentStreak"`
	LongestStreak  int     `json:"longestStreak"`
	TotalVotes     int     `json:"totalVotes"`
	CompletionRate float64 `json:"completionRate"`
	ScheduledToday bool    `json:"scheduledToday"`
	CompletedToday bool    `json:"completedToday"`
	// MissedLast is true when the most recent scheduled day before today was
	// missed. Combined with an incomplete today, this triggers the
	// "never miss twice" reminder.
	MissedLast     bool `json:"missedLast"`
	NeverMissTwice bool `json:"neverMissTwice"`
	// Compound is 1.01^votes: the "1% better every day" growth factor.
	Compound float64 `json:"compound"`
}

// Compute derives Stats for a habit that started on start, is scheduled on the
// weekdays in mask, and was completed on each day in done. Today is the
// user's current local date. A habit that is pending today does not break the
// current streak until the day is over.
func Compute(start time.Time, mask int16, done map[time.Time]bool, today time.Time) Stats {
	start, today = Normalize(start), Normalize(today)
	if mask == 0 {
		mask = AllDays
	}

	s := Stats{
		TotalVotes:     len(done),
		ScheduledToday: IsScheduled(mask, today),
		CompletedToday: done[today],
	}
	s.Compound = math.Round(math.Pow(1.01, float64(s.TotalVotes))*100) / 100

	if today.Before(start) {
		return s
	}

	// Longest streak: walk forward from the start date.
	run := 0
	for d := start; !d.After(today); d = d.AddDate(0, 0, 1) {
		switch {
		case done[d]:
			run++
			s.LongestStreak = max(s.LongestStreak, run)
		case IsScheduled(mask, d) && !d.Equal(today):
			run = 0
		}
	}

	// Current streak: walk backward from today (or yesterday if today is
	// still pending).
	d := today
	if !done[d] {
		d = d.AddDate(0, 0, -1)
	}
	for ; !d.Before(start); d = d.AddDate(0, 0, -1) {
		if done[d] {
			s.CurrentStreak++
			continue
		}
		if IsScheduled(mask, d) {
			break
		}
	}

	// Never miss twice: was the previous scheduled day missed?
	for d := today.AddDate(0, 0, -1); !d.Before(start); d = d.AddDate(0, 0, -1) {
		if IsScheduled(mask, d) {
			s.MissedLast = !done[d]
			break
		}
	}
	s.NeverMissTwice = s.MissedLast && s.ScheduledToday && !s.CompletedToday

	// Completion rate across scheduled days in the trailing window. Today only
	// counts once it has been completed, so a pending day does not lower it.
	windowStart := today.AddDate(0, 0, -(completionWindowDays - 1))
	if windowStart.Before(start) {
		windowStart = start
	}
	scheduled, completed := 0, 0
	for d := windowStart; !d.After(today); d = d.AddDate(0, 0, 1) {
		if !IsScheduled(mask, d) || (d.Equal(today) && !done[d]) {
			continue
		}
		scheduled++
		if done[d] {
			completed++
		}
	}
	if scheduled > 0 {
		s.CompletionRate = math.Round(float64(completed)/float64(scheduled)*1000) / 1000
	}
	return s
}
