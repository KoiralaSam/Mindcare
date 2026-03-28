package handler

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/KoiralaSam/Mindcare/backend/internal/models/user"
)

// LeaderboardEntryJSON is a public row for streak rankings (no email).
type LeaderboardEntryJSON struct {
	Rank     int    `json:"rank"`
	Nickname string `json:"nickname"`
	Streak   int    `json:"streak"`
}

// LeaderboardResponse is returned by GET /api/leaderboard.
type LeaderboardResponse struct {
	Entries []LeaderboardEntryJSON `json:"entries"`
}

// LeaderboardHandler returns users ordered by streak (highest first).
func LeaderboardHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.Header().Set("Allow", http.MethodGet)
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		limit := 50
		if q := r.URL.Query().Get("limit"); q != "" {
			n, err := strconv.Atoi(q)
			if err != nil || n < 1 {
				http.Error(w, "invalid limit", http.StatusBadRequest)
				return
			}
			if n > 100 {
				n = 100
			}
			limit = n
		}

		rows, err := user.ListStreakLeaderboard(db, limit)
		if err != nil {
			log.Printf("leaderboard: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		out := make([]LeaderboardEntryJSON, len(rows))
		for i := range rows {
			out[i] = LeaderboardEntryJSON{
				Rank:     i + 1,
				Nickname: rows[i].Nickname,
				Streak:   rows[i].Streak,
			}
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(LeaderboardResponse{Entries: out})
	}
}
