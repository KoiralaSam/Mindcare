package main

import (
	"log"
	"net/http"
	"os"

	"github.com/KoiralaSam/Mindcare/backend/internal/db"
	"github.com/KoiralaSam/Mindcare/backend/internal/handler"
	"github.com/joho/godotenv"
)

func main() {
	for _, p := range []string{"../.env", "../../.env", ".env"} {
		_ = godotenv.Load(p)
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is not set (add it to .env or export it)")
	}

	sqlDB, err := db.NewDB(databaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer sqlDB.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/login", handler.LoginHandler(sqlDB))
	mux.HandleFunc("GET /api/leaderboard", handler.LeaderboardHandler(sqlDB))
	mux.HandleFunc("POST /api/wellness-quiz", handler.WellnessQuizHandler(sqlDB))
	mux.HandleFunc("POST /api/task-complete", handler.TaskCompleteHandler(sqlDB))
	root := withCORS(mux)

	addr := os.Getenv("HTTP_ADDR")
	if addr == "" {
		if port := os.Getenv("PORT"); port != "" {
			addr = ":" + port
		} else {
			addr = ":8080"
		}
	}
	log.Printf("listening on %s ", addr)
	log.Fatal(http.ListenAndServe(addr, root))
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
