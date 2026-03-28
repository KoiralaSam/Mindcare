package handler

import (
	"encoding/json"
	"net/http"
	"strings"
)

type WellnessQuizResponse struct {
	TotalQuestions int               `json:"total_questions"`
	Answers        map[string]string `json:"answers"`
}

// WellnessQuizHandler handles POST /api/wellness-quiz.
// The body must be a JSON object where each key is a question
// and each value is the corresponding answer.
func WellnessQuizHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		dec := json.NewDecoder(r.Body)
		dec.DisallowUnknownFields()

		var answers map[string]string
		if err := dec.Decode(&answers); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body; expected object of question: answer")
			return
		}

		if len(answers) == 0 {
			writeError(w, http.StatusBadRequest, "at least one quiz answer is required")
			return
		}

		for question, answer := range answers {
			if strings.TrimSpace(question) == "" {
				writeError(w, http.StatusBadRequest, "question keys cannot be empty")
				return
			}
			if strings.TrimSpace(answer) == "" {
				writeError(w, http.StatusBadRequest, "answer values cannot be empty")
				return
			}
		}

		writeJSON(w, http.StatusOK, WellnessQuizResponse{
			TotalQuestions: len(answers),
			Answers:        answers,
		})
	}
}
