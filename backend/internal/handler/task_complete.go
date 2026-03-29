package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/KoiralaSam/Mindcare/backend/internal/models/user"
)

// EmbersPerTaskComplete is added to daily_ember when a task is marked complete (with rollover at 100).
const EmbersPerTaskComplete = 5

type TaskCompleteRequest struct {
	Email string `json:"email"`
}

type TaskCompleteResponse struct {
	DailyEmber int `json:"daily_ember"`
	Streak     int `json:"streak"`
}

// TaskCompleteHandler adds embers for a completed daily task (authenticated by email in body).
func TaskCompleteHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		var req TaskCompleteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		email := strings.TrimSpace(strings.ToLower(req.Email))
		if email == "" {
			writeError(w, http.StatusBadRequest, "email is required")
			return
		}
		ember, streak, err := user.AddDailyEmberWithStreakRollover(db, email, EmbersPerTaskComplete)
		if err != nil {
			if errors.Is(err, user.ErrNotFound) {
				writeError(w, http.StatusNotFound, "user not found")
				return
			}
			log.Printf("task-complete: %v", err)
			writeError(w, http.StatusInternalServerError, "could not update embers")
			return
		}
		writeJSON(w, http.StatusOK, TaskCompleteResponse{DailyEmber: ember, Streak: streak})
	}
}
