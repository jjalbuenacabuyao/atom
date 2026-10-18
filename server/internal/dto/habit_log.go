package dto

// LogInput records a habit completion.
type LogInput struct {
	Note string `json:"note" binding:"max=500"`
}

// HabitLog is a single completion.
type HabitLog struct {
	Date string `json:"date"`
	Note string `json:"note"`
}
