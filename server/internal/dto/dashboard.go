package dto

// DayCount is the number of completions on a date.
type DayCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// Dashboard summarises the user's progress for a day.
type Dashboard struct {
	Date           string     `json:"date"`
	Habits         []Habit    `json:"habits"`
	ScheduledCount int        `json:"scheduledCount"`
	CompletedCount int        `json:"completedCount"`
	TotalVotes     int        `json:"totalVotes"`
	BestStreak     int        `json:"bestStreak"`
	Identities     []Identity `json:"identities"`
	Activity       []DayCount `json:"activity"`
}
