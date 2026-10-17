package habitstats

import (
	"testing"
	"time"
)

func date(t *testing.T, s string) time.Time {
	t.Helper()
	d, err := ParseDate(s)
	if err != nil {
		t.Fatal(err)
	}
	return d
}

func doneSet(t *testing.T, dates ...string) map[time.Time]bool {
	t.Helper()
	m := make(map[time.Time]bool, len(dates))
	for _, s := range dates {
		m[date(t, s)] = true
	}
	return m
}

func TestParseDate(t *testing.T) {
	if _, err := ParseDate("2026-02-30"); err == nil {
		t.Error("expected error for invalid date")
	}
	if _, err := ParseDate("17/10/2026"); err == nil {
		t.Error("expected error for wrong layout")
	}
	got := date(t, "2026-10-17")
	if got.Location() != time.UTC || got.Hour() != 0 {
		t.Errorf("expected UTC midnight, got %v", got)
	}
}

func TestIsScheduled(t *testing.T) {
	// 2026-10-17 is a Saturday (bit 6); 2026-10-18 is a Sunday (bit 0).
	weekends := int16(1<<0 | 1<<6)
	if !IsScheduled(weekends, date(t, "2026-10-17")) {
		t.Error("Saturday should be scheduled")
	}
	if !IsScheduled(weekends, date(t, "2026-10-18")) {
		t.Error("Sunday should be scheduled")
	}
	if IsScheduled(weekends, date(t, "2026-10-19")) {
		t.Error("Monday should not be scheduled")
	}
}

func TestCompute(t *testing.T) {
	const today = "2026-10-17" // Saturday
	weekdays := int16(0b0111110)

	tests := []struct {
		name  string
		start string
		mask  int16
		done  []string
		want  Stats
	}{
		{
			name:  "no history",
			start: today,
			mask:  AllDays,
			want:  Stats{ScheduledToday: true, Compound: 1},
		},
		{
			name:  "pending today keeps streak from yesterday",
			start: "2026-10-10",
			mask:  AllDays,
			done:  []string{"2026-10-14", "2026-10-15", "2026-10-16"},
			want: Stats{
				CurrentStreak: 3, LongestStreak: 3, TotalVotes: 3, ScheduledToday: true,
				CompletionRate: 0.429, Compound: 1.03,
			},
		},
		{
			name:  "completed today extends streak",
			start: "2026-10-15",
			mask:  AllDays,
			done:  []string{"2026-10-15", "2026-10-16", today},
			want: Stats{
				CurrentStreak: 3, LongestStreak: 3, TotalVotes: 3, ScheduledToday: true,
				CompletedToday: true, CompletionRate: 1, Compound: 1.03,
			},
		},
		{
			name:  "missed yesterday triggers never miss twice",
			start: "2026-10-12",
			mask:  AllDays,
			done:  []string{"2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"},
			want: Stats{
				CurrentStreak: 0, LongestStreak: 4, TotalVotes: 4, ScheduledToday: true,
				MissedLast: true, NeverMissTwice: true, CompletionRate: 0.8, Compound: 1.04,
			},
		},
		{
			name:  "unscheduled days do not break streak",
			start: "2026-10-05",
			mask:  weekdays,
			// Mon..Fri of the week of Oct 12; today (Sat) is unscheduled.
			done: []string{"2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"},
			want: Stats{
				CurrentStreak: 5, LongestStreak: 5, TotalVotes: 5, ScheduledToday: false,
				CompletionRate: 0.5, Compound: 1.05,
			},
		},
		{
			name:  "today before start",
			start: "2026-10-20",
			mask:  AllDays,
			want:  Stats{ScheduledToday: true, Compound: 1},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := Compute(date(t, tc.start), tc.mask, doneSet(t, tc.done...), date(t, today))
			if got != tc.want {
				t.Errorf("Compute() =\n  %+v\nwant\n  %+v", got, tc.want)
			}
		})
	}
}
