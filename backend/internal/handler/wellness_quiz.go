package handler

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	neturl "net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/KoiralaSam/Mindcare/backend/internal/models/user"
)

// EmbersPerQuiz is added to users.daily_ember when a wellness quiz is submitted with a valid email.
const EmbersPerQuiz = 10

type WellnessQuizRequest struct {
	Email   string            `json:"email"`
	Age     int               `json:"age"`
	Gender  string            `json:"gender"`
	Answers map[string]string `json:"answers"`
}

type WellnessQuizResponse struct {
	Prediction     any            `json:"prediction"`
	PredictionCode int            `json:"prediction_code"`
	TargetColumn   string         `json:"target_column"`
	Features       map[string]any `json:"features"`
	FrontendResult FrontendResult `json:"frontend_result"`
	DailyEmber     *int           `json:"daily_ember,omitempty"`
	Streak         *int           `json:"streak,omitempty"`
}

type FrontendResult struct {
	Zone        string `json:"zone"`
	Title       string `json:"title"`
	Description string `json:"description"`
	AgeGroup    string `json:"age_group"`
	Gender      string `json:"gender"`
	Tasks       []Task `json:"tasks"`
}

type Task struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	URL         string `json:"url,omitempty"`
	ImageURL    string `json:"image_url,omitempty"`
}

type mlPredictRequest struct {
	Features map[string]any `json:"features"`
}

type mlPredictResponse struct {
	Prediction     any    `json:"prediction"`
	PredictionCode int    `json:"prediction_code"`
	TargetColumn   string `json:"target_column"`
}

type groqChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type groqChatRequest struct {
	Model          string            `json:"model"`
	Messages       []groqChatMessage `json:"messages"`
	Temperature    float64           `json:"temperature"`
	ResponseFormat map[string]string `json:"response_format,omitempty"`
}

type groqChatResponse struct {
	Choices []struct {
		Message groqChatMessage `json:"message"`
	} `json:"choices"`
}

type generatedTasksPayload struct {
	Tasks []Task `json:"tasks"`
}

var youtubeIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{6,}$`)

var mediaFallbackImagePool = []string{
	"https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1280&q=80", // hike
	"https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1280&q=80", // journaling
	"https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&w=1280&q=80", // tea + calm
	"https://images.unsplash.com/photo-1485727749690-d091e8284ef3?auto=format&fit=crop&w=1280&q=80", // nature walk
	"https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1280&q=80", // workout
	"https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1280&q=80", // yoga
	"https://images.unsplash.com/photo-1434596922112-19c563067271?auto=format&fit=crop&w=1280&q=80", // breathing outdoors
	"https://images.unsplash.com/photo-1506252374453-ef5237291d83?auto=format&fit=crop&w=1280&q=80", // stretching
}

var topicVideoCatalog = map[string][]string{
	"breathing": {
		"https://www.youtube.com/watch?v=inpok4MKVLM",
		"https://www.youtube.com/watch?v=nmFUDkj1Aq0",
	},
	"physical": {
		"https://www.youtube.com/watch?v=8jPQjjsBbIc",
		"https://www.youtube.com/watch?v=hnpQrMqDoqE",
	},
	"reflection": {
		"https://www.youtube.com/watch?v=DxIDKZHW3-E",
		"https://www.youtube.com/watch?v=WWloIAQpMcQ",
	},
	"social": {
		"https://www.youtube.com/watch?v=RcGyVTAoXEU",
		"https://www.youtube.com/watch?v=iCvmsMzlF7o",
	},
	"general": {
		"https://www.youtube.com/watch?v=DxIDKZHW3-E",
		"https://www.youtube.com/watch?v=iCvmsMzlF7o",
		"https://www.youtube.com/watch?v=WWloIAQpMcQ",
		"https://www.youtube.com/watch?v=RcGyVTAoXEU",
	},
}

func normalizeJSONInt(v any) int {
	switch t := v.(type) {
	case nil:
		return 0
	case float64:
		return int(t)
	case float32:
		return int(t)
	case int:
		return t
	case int64:
		return int(t)
	case json.Number:
		i, err := t.Int64()
		if err != nil {
			return 0
		}
		return int(i)
	case string:
		n, err := strconv.Atoi(strings.TrimSpace(t))
		if err != nil {
			return 0
		}
		return n
	default:
		return 0
	}
}

func anyAnswerToString(v any) string {
	if v == nil {
		return ""
	}
	switch t := v.(type) {
	case string:
		return t
	case float64:
		if t == float64(int64(t)) {
			return strconv.FormatInt(int64(t), 10)
		}
		return strconv.FormatFloat(t, 'f', -1, 64)
	case json.Number:
		return t.String()
	case bool:
		if t {
			return "1"
		}
		return "0"
	default:
		return strings.TrimSpace(fmt.Sprint(t))
	}
}

// parseWellnessAnswers accepts:
//   - JSON object: { "Q1": "1 3", ... } (string or numeric values per key)
//   - JSON array: [ {"question":"Q1","answer":"1 3"}, ... ]
func parseWellnessAnswers(raw json.RawMessage) (map[string]string, error) {
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 {
		return nil, fmt.Errorf("answers are required")
	}

	var asStr map[string]string
	if err := json.Unmarshal(raw, &asStr); err == nil && len(asStr) > 0 {
		return asStr, nil
	}

	var asAny map[string]any
	if err := json.Unmarshal(raw, &asAny); err == nil && len(asAny) > 0 {
		out := make(map[string]string, len(asAny))
		for k, v := range asAny {
			out[k] = anyAnswerToString(v)
		}
		return out, nil
	}

	var arr []map[string]any
	if err := json.Unmarshal(raw, &arr); err == nil && len(arr) > 0 {
		out := make(map[string]string)
		for _, item := range arr {
			q := strings.TrimSpace(anyAnswerToString(item["question"]))
			if q == "" {
				q = strings.TrimSpace(anyAnswerToString(item["Question"]))
			}
			if q == "" {
				continue
			}
			var a any
			if v, ok := item["answer"]; ok {
				a = v
			} else {
				a = item["Answer"]
			}
			out[q] = anyAnswerToString(a)
		}
		if len(out) > 0 {
			return out, nil
		}
	}

	return nil, fmt.Errorf("answers must be an object mapping question id to answer, or an array of objects with question and answer fields")
}

// decodeWellnessQuizRequest decodes POST /api/wellness-quiz bodies without unmarshaling `answers`
// into json.RawMessage via a struct (Go 1.25+ can reject valid client payloads with opaque errors).
// Top-level keys are read from map[string]json.RawMessage; `answers` is passed to parseWellnessAnswers.
//
// Client-visible 400 messages from this path:
//   - Here: json.Unmarshal(body, &fields) failure → "invalid JSON body: …" (malformed JSON or root not an object).
//   - parseWellnessAnswers: "answers are required" or the long "answers must be an object…" message.
//
// WellnessQuizHandler adds: "age is required", "gender is required", "answers are required".
//
// There is no literal "invalid JSON body; expected object of question: answer" in this codebase; the
// current prefix uses a colon ("invalid JSON body: …"). If you still see a semicolon variant, the
// process answering :8080 is likely an old build or a different gateway—check the log line below.
func decodeWellnessQuizRequest(body []byte) (WellnessQuizRequest, error) {
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(body, &fields); err != nil {
		log.Printf("wellness-quiz: top-level JSON unmarshal failed: %v", err)
		return WellnessQuizRequest{}, fmt.Errorf("invalid JSON body: %v", err)
	}

	var req WellnessQuizRequest

	if raw, ok := fields["email"]; ok && len(bytes.TrimSpace(raw)) > 0 && string(bytes.TrimSpace(raw)) != "null" {
		if err := json.Unmarshal(raw, &req.Email); err != nil || strings.TrimSpace(req.Email) == "" {
			var v any
			if json.Unmarshal(raw, &v) == nil {
				req.Email = strings.TrimSpace(fmt.Sprint(v))
			}
		}
	}

	if raw, ok := fields["age"]; ok && len(bytes.TrimSpace(raw)) > 0 {
		var ageAny any
		if json.Unmarshal(raw, &ageAny) == nil {
			req.Age = normalizeJSONInt(ageAny)
		}
	}

	if raw, ok := fields["gender"]; ok && len(bytes.TrimSpace(raw)) > 0 && string(bytes.TrimSpace(raw)) != "null" {
		if err := json.Unmarshal(raw, &req.Gender); err != nil || strings.TrimSpace(req.Gender) == "" {
			var v any
			if json.Unmarshal(raw, &v) == nil {
				req.Gender = strings.TrimSpace(fmt.Sprint(v))
			}
		}
	}

	rawAns, hasAnswers := fields["answers"]
	if !hasAnswers {
		rawAns = nil
	}
	answers, err := parseWellnessAnswers(rawAns)
	if err != nil {
		return WellnessQuizRequest{}, err
	}
	req.Answers = answers

	return req, nil
}

func WellnessQuizHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			writeError(w, http.StatusBadRequest, "could not read request body")
			return
		}

		req, err := decodeWellnessQuizRequest(body)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		if req.Age <= 0 {
			writeError(w, http.StatusBadRequest, "age is required")
			return
		}
		if strings.TrimSpace(req.Gender) == "" {
			writeError(w, http.StatusBadRequest, "gender is required")
			return
		}
		if len(req.Answers) == 0 {
			writeError(w, http.StatusBadRequest, "answers are required")
			return
		}

		features := mapAnswersToMLFeatures(req.Answers)
		features["Age"] = req.Age
		features["Gender"] = normalizeGender(req.Gender)

		pred, err := predictWithMLService(features)
		if err != nil {
			pred = fallbackPrediction(req.Answers)
		}

		label := strings.ToLower(strings.TrimSpace(fmt.Sprintf("%v", pred.Prediction)))
		resp := WellnessQuizResponse{
			Prediction:     pred.Prediction,
			PredictionCode: pred.PredictionCode,
			TargetColumn:   pred.TargetColumn,
			Features:       features,
			FrontendResult: frontendResultForPrediction(label, req.Age, normalizeGender(req.Gender)),
		}

		email := strings.TrimSpace(strings.ToLower(req.Email))
		if email != "" && db != nil {
			if ember, streak, err := user.AddDailyEmberWithStreakRollover(db, email, EmbersPerQuiz); err == nil {
				resp.DailyEmber = &ember
				resp.Streak = &streak
			}
		}

		if payload, err := json.Marshal(resp); err != nil {
			log.Printf("wellness-quiz: marshal response: %v", err)
		} else {
			log.Printf("wellness-quiz: response email=%q json=%s", email, string(payload))
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func predictWithMLService(features map[string]any) (mlPredictResponse, error) {
	baseURL := strings.TrimSpace(os.Getenv("ML_SERVICE_URL"))
	if baseURL == "" {
		baseURL = "http://127.0.0.1:8000"
	}
	url := strings.TrimRight(baseURL, "/") + "/predict"

	body, _ := json.Marshal(mlPredictRequest{Features: features})
	client := &http.Client{Timeout: 8 * time.Second}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return mlPredictResponse{}, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return mlPredictResponse{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return mlPredictResponse{}, fmt.Errorf("ml status %d", resp.StatusCode)
	}

	var out mlPredictResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return mlPredictResponse{}, err
	}
	return out, nil
}

func fallbackPrediction(answers map[string]string) mlPredictResponse {
	label := predictLabelFromAnswers(answers)
	return mlPredictResponse{
		Prediction:     label,
		PredictionCode: predictionCode(label),
		TargetColumn:   "pace_state",
	}
}

func frontendResultForPrediction(label string, age int, gender string) FrontendResult {
	group := ageGroup(age)
	tasks := defaultTasksForGroup(group)
	if generated, err := generateTasksWithGroq(label, group, gender); err == nil && len(generated) > 0 {
		tasks = generated
	} else if err != nil {
		log.Printf("wellness-quiz: groq task generation failed, using defaults: %v", err)
	}
	tasks = ensurePhysicalTaskImages(tasks)

	out := FrontendResult{
		AgeGroup: group,
		Gender:   gender,
		Tasks:    tasks,
	}

	switch label {
	case "burnout_risk":
		out.Zone = "Red Zone"
		out.Title = "Red Zone - Burnout Risk"
		out.Description = "Your current response pattern suggests a high level of emotional strain that may already be affecting focus, sleep, energy, or daily functioning. This is an important signal to reduce non-essential pressure immediately, simplify your commitments for the day, and use support early rather than waiting for symptoms to intensify."
	case "overworked":
		out.Zone = "Orange Zone"
		out.Title = "Orange Zone - Struggling"
		out.Description = "Your responses indicate meaningful stress pressure and emotional overload that may be interfering with your normal rhythm. You are likely still in a recoverable range, but this is the right time to stabilize with short, practical actions and reduce unnecessary cognitive load before stress escalates."
	case "underworked":
		out.Zone = "Yellow Zone"
		out.Title = "Yellow Zone - Under Strain"
		out.Description = "You show early signs of emotional strain, such as reduced momentum, lower motivation, or uneven emotional energy. This stage usually responds well to small consistent habits, so focusing on simple routines now can prevent a deeper decline and help you rebuild steadiness quickly."
	case "balanced":
		out.Zone = "Green Zone"
		out.Title = "Green Zone - Doing Well"
		out.Description = "You appear emotionally stable in this check-in, with no major warning patterns detected. This is a good point to protect what is already working by maintaining healthy routines, clear boundaries, and intentional recovery time so short-term stress does not accumulate over time."
	default:
		out.Zone = "Blue Zone"
		out.Title = "Blue Zone - Mixed Signals"
		out.Description = "Your responses are mixed, which can happen when stress, mood, and energy are fluctuating across different parts of life. This result is not a failure; it means more signal is needed. Track a few daily stress points and retake the check-in soon to improve clarity and direction."
	}
	return out
}

func mapAnswersToMLFeatures(answers map[string]string) map[string]any {
	features := map[string]any{}
	for question, answer := range answers {
		switch questionToFeatureKey(question) {
		case "Country":
			features["Country"] = normalizeCountry(answer)
		case "family_history":
			features["family_history"] = normalizeYesNo(answer)
		case "work_interference":
			features["work_interference"] = normalizeWorkInterference(answer)
		case "remote_work":
			features["remote_work"] = normalizeYesNo(answer)
		}
	}
	return features
}

func predictLabelFromAnswers(answers map[string]string) string {
	var total float64
	var count int
	for question, answer := range answers {
		score, max, ok := parseLikertAnswer(answer)
		if !ok {
			continue
		}
		v := float64(score) / float64(max)
		if isPositiveQuestion(question) {
			v = 1.0 - v
		}
		total += v
		count++
	}
	if count == 0 {
		return "inconsistent"
	}
	avg := total / float64(count)
	switch {
	case avg >= 0.75:
		return "burnout_risk"
	case avg >= 0.55:
		return "overworked"
	case avg >= 0.35:
		return "underworked"
	case avg >= 0.20:
		return "inconsistent"
	default:
		return "balanced"
	}
}

func parseLikertAnswer(answer string) (int, int, bool) {
	parts := strings.Fields(strings.TrimSpace(answer))
	if len(parts) == 0 {
		return 0, 0, false
	}
	score, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, 0, false
	}
	max := 3
	if len(parts) >= 2 {
		if m, err := strconv.Atoi(parts[1]); err == nil && m >= 1 {
			max = m
		}
	}
	lower := strings.ToLower(answer)
	if max == 3 && (strings.Contains(lower, "all of the time") || strings.Contains(lower, "most of the time") || strings.Contains(lower, "at no time")) {
		max = 5
	}
	if score < 0 {
		score = 0
	}
	if score > max {
		score = max
	}
	return score, max, true
}

func predictionCode(label string) int {
	switch label {
	case "balanced":
		return 0
	case "inconsistent":
		return 1
	case "underworked":
		return 2
	case "overworked":
		return 3
	case "burnout_risk":
		return 4
	default:
		return -1
	}
}

func isPositiveQuestion(question string) bool {
	n := normalizeKey(question)
	// Mindcare check-in uses ids Q1..Q13 from the frontend; invert score for "higher is better" items.
	if strings.HasPrefix(n, "q5") || strings.HasPrefix(n, "q6") || strings.HasPrefix(n, "q7") || strings.HasPrefix(n, "q8") {
		return true
	}
	if strings.HasPrefix(n, "q12") {
		return true
	}
	return strings.Contains(n, "calm") || strings.Contains(n, "balanced") || strings.Contains(n, "energy") || strings.Contains(n, "hopeful")
}

func questionToFeatureKey(question string) string {
	switch normalizeKey(question) {
	case "country", "location", "where_are_you_from", "your_country":
		return "Country"
	case "family_history", "family_history_of_mental_illness", "family_mental_health_history":
		return "family_history"
	case "work_interference", "does_mental_health_interfere_with_work", "mental_health_interferes_with_work":
		return "work_interference"
	case "remote_work", "do_you_work_remotely", "work_remotely":
		return "remote_work"
	default:
		return ""
	}
}

func ageGroup(age int) string {
	switch {
	case age < 20:
		return "teen"
	case age <= 35:
		return "young_adult"
	case age <= 55:
		return "adult"
	default:
		return "senior"
	}
}

func ageGroupVideo(group string) string {
	switch group {
	case "teen":
		return "https://www.youtube.com/watch?v=WWloIAQpMcQ"
	case "adult":
		return "https://www.youtube.com/watch?v=RcGyVTAoXEU"
	case "senior":
		return "https://www.youtube.com/watch?v=inpok4MKVLM"
	default:
		return "https://www.youtube.com/watch?v=DxIDKZHW3-E"
	}
}

func ageGroupVideoSecondary(group string) string {
	switch group {
	case "teen":
		return "https://www.youtube.com/watch?v=hnpQrMqDoqE"
	case "adult":
		return "https://www.youtube.com/watch?v=8jPQjjsBbIc"
	case "senior":
		return "https://www.youtube.com/watch?v=nmFUDkj1Aq0"
	default:
		return "https://www.youtube.com/watch?v=iCvmsMzlF7o"
	}
}

func defaultTasksForGroup(group string) []Task {
	return []Task{
		{Title: "Read and reflect on your result", Description: "Read the full result summary slowly and identify one sentence that closely matches how you have been feeling in the last few days. This helps you move from a general result to a personal insight you can act on today."},
		{Title: "Take a short breathing reset", Description: "Set a timer for 2 minutes and take slow breaths with a longer exhale than inhale. Focus only on your breath to lower immediate stress activation and settle your body before your next task."},
		{
			Title:       "Do one physical grounding activity",
			Description: "Take a 10-15 minute walk, light stretch, or gentle body movement. Physical movement reduces emotional overload and helps your mind regain clarity and focus.",
			ImageURL:    physicalTaskImageURL(),
		},
		{Title: "Reach out to one trusted person", Description: "Send a simple check-in message to someone you trust and let them know how your day has been. Social contact, even brief, can reduce emotional isolation and improve resilience."},
		{Title: "Watch a practical wellbeing video", Description: "Watch this short age-group matched video and note one tip you can apply in the next 24 hours.", URL: ageGroupVideo(group)},
		{Title: "Watch a second support video", Description: "Watch this additional video for reinforcement and pick one small coping strategy that feels realistic for your current routine.", URL: ageGroupVideoSecondary(group)},
	}
}

func generateTasksWithGroq(label string, group string, gender string) ([]Task, error) {
	key := strings.TrimSpace(os.Getenv("GROQ_API_KEY"))
	if key == "" {
		return nil, fmt.Errorf("GROQ_API_KEY is not set")
	}

	model := strings.TrimSpace(os.Getenv("GROQ_MODEL"))
	if model == "" {
		model = "llama-3.1-8b-instant"
	}

	prompt := fmt.Sprintf(
		"Generate EXACTLY 6 concise, supportive mental wellbeing tasks for zone '%s', age group '%s', gender '%s'. "+
			"Return ONLY valid JSON object with this exact schema: "+
			"{\"tasks\":[{\"title\":\"...\",\"description\":\"...\",\"url\":\"\",\"image_url\":\"\"}]} . "+
			"Hard rules: "+
			"(1) Every task must include at least one media field: either a working public YouTube URL in 'url' OR a direct HTTPS image URL in 'image_url'. "+
			"(2) At least 2 tasks must use YouTube links, and each YouTube URL must be valid/playable. "+
			"(3) Image URLs must be diverse and not repeated; avoid similar images. "+
			"(4) Include at least one physical movement task (walk/stretch/exercise/yoga). "+
			"(5) Keep language non-diagnostic and actionable. "+
			"(6) No markdown, no prose, no code fences.",
		label,
		group,
		gender,
	)

	reqBody := groqChatRequest{
		Model: model,
		Messages: []groqChatMessage{
			{Role: "system", Content: "You are a wellness task generator. Output strict JSON only."},
			{Role: "user", Content: prompt},
		},
		Temperature:    0.4,
		ResponseFormat: map[string]string{"type": "json_object"},
	}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+key)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		data, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return nil, fmt.Errorf("groq status %d: %s", resp.StatusCode, strings.TrimSpace(string(data)))
	}

	var out groqChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	if len(out.Choices) == 0 {
		return nil, fmt.Errorf("groq returned no choices")
	}

	content := strings.TrimSpace(out.Choices[0].Message.Content)
	if content == "" {
		return nil, fmt.Errorf("groq returned empty content")
	}

	var parsed generatedTasksPayload
	if err := json.Unmarshal([]byte(content), &parsed); err != nil {
		return nil, fmt.Errorf("groq output parse error: %w", err)
	}

	tasks := sanitizeTasks(parsed.Tasks)
	tasks = ensureTaskMediaConstraints(tasks)
	if len(tasks) == 0 {
		return nil, fmt.Errorf("groq returned no usable tasks")
	}
	return tasks, nil
}

func sanitizeTasks(tasks []Task) []Task {
	out := make([]Task, 0, len(tasks))
	for _, t := range tasks {
		title := strings.TrimSpace(t.Title)
		desc := strings.TrimSpace(t.Description)
		if title == "" || desc == "" {
			continue
		}
		out = append(out, Task{
			Title:       title,
			Description: desc,
			URL:         strings.TrimSpace(t.URL),
			// Keep image source controlled by backend fallback pool for reliability.
			ImageURL: "",
		})
	}
	if len(out) > 6 {
		out = out[:6]
	}
	return out
}

func ensurePhysicalTaskImages(tasks []Task) []Task {
	out := make([]Task, len(tasks))
	copy(out, tasks)
	for i := range out {
		if strings.TrimSpace(out[i].ImageURL) != "" {
			continue
		}
		if isPhysicalTask(out[i]) {
			out[i].ImageURL = physicalTaskImageURL()
		}
	}
	return out
}

func ensureTaskMediaConstraints(tasks []Task) []Task {
	out := make([]Task, len(tasks))
	copy(out, tasks)

	usedImages := map[string]struct{}{}
	for i := range out {
		rawURL := strings.TrimSpace(out[i].URL)
		normalizedURL, ok := normalizeYouTubeTaskURL(out[i].URL)
		if ok {
			out[i].URL = normalizedURL
		} else {
			out[i].URL = ""
		}
		// If model requested a video task, replace with topic-specific known-good YouTube URL.
		if rawURL != "" {
			out[i].URL = topicSpecificVideoURL(out[i], i)
		}

		img := strings.TrimSpace(out[i].ImageURL)
		if img != "" {
			if _, exists := usedImages[img]; exists {
				img = ""
			} else {
				usedImages[img] = struct{}{}
			}
		}

		// Physical tasks should always show an image when no valid video URL exists.
		if out[i].URL == "" && img == "" && isPhysicalTask(out[i]) {
			img = nextUniqueImage(i, usedImages)
			usedImages[img] = struct{}{}
		}

		// Hard guarantee: every task must have either YouTube URL or image.
		if out[i].URL == "" && img == "" {
			img = nextUniqueImage(i, usedImages)
			usedImages[img] = struct{}{}
		}

		out[i].ImageURL = img
	}

	// Ensure at least two topic-specific known-good YouTube links.
	videoCount := 0
	for i := range out {
		if out[i].URL != "" {
			videoCount++
		}
	}
	for _, i := range videoCandidateOrder(out) {
		if videoCount >= 2 {
			break
		}
		if out[i].URL != "" {
			continue
		}
		out[i].URL = topicSpecificVideoURL(out[i], i)
		out[i].ImageURL = ""
		videoCount++
	}

	return out
}

func normalizeYouTubeTaskURL(raw string) (string, bool) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return "", false
	}
	u, err := neturl.Parse(s)
	if err != nil || u.Host == "" {
		return "", false
	}

	host := strings.ToLower(strings.TrimPrefix(u.Hostname(), "www."))
	extractID := func(v string) (string, bool) {
		v = strings.TrimSpace(v)
		if !youtubeIDPattern.MatchString(v) {
			return "", false
		}
		return v, true
	}

	var id string
	switch host {
	case "youtu.be":
		first := strings.Trim(strings.Split(strings.TrimPrefix(u.Path, "/"), "/")[0], " ")
		if v, ok := extractID(first); ok {
			id = v
		}
	case "youtube.com", "m.youtube.com", "youtube-nocookie.com":
		if v, ok := extractID(u.Query().Get("v")); ok {
			id = v
			break
		}
		p := strings.TrimPrefix(strings.TrimSpace(u.Path), "/")
		parts := strings.Split(p, "/")
		if len(parts) >= 2 {
			switch parts[0] {
			case "embed", "shorts", "live":
				if v, ok := extractID(parts[1]); ok {
					id = v
				}
			}
		}
	default:
		return "", false
	}

	if id == "" {
		return "", false
	}
	return "https://www.youtube.com/watch?v=" + id, true
}

func nextUniqueImage(seed int, used map[string]struct{}) string {
	if len(mediaFallbackImagePool) == 0 {
		return physicalTaskImageURL()
	}
	for i := 0; i < len(mediaFallbackImagePool); i++ {
		idx := (seed + i) % len(mediaFallbackImagePool)
		candidate := mediaFallbackImagePool[idx]
		if _, exists := used[candidate]; exists {
			continue
		}
		return candidate
	}
	// If all are used, cycle with seed to keep deterministic behavior.
	return mediaFallbackImagePool[seed%len(mediaFallbackImagePool)]
}

func topicSpecificVideoURL(task Task, seed int) string {
	topic := taskTopic(task)
	videos := topicVideoCatalog[topic]
	if len(videos) == 0 {
		videos = topicVideoCatalog["general"]
	}
	if len(videos) == 0 {
		return ""
	}
	return videos[seed%len(videos)]
}

func taskTopic(task Task) string {
	text := strings.ToLower(strings.TrimSpace(task.Title + " " + task.Description))
	switch {
	case strings.Contains(text, "breath"), strings.Contains(text, "calm"), strings.Contains(text, "meditat"):
		return "breathing"
	case strings.Contains(text, "walk"), strings.Contains(text, "stretch"), strings.Contains(text, "physical"), strings.Contains(text, "exercise"), strings.Contains(text, "movement"), strings.Contains(text, "workout"), strings.Contains(text, "yoga"):
		return "physical"
	case strings.Contains(text, "reflect"), strings.Contains(text, "journal"), strings.Contains(text, "write"), strings.Contains(text, "result"):
		return "reflection"
	case strings.Contains(text, "trusted"), strings.Contains(text, "friend"), strings.Contains(text, "family"), strings.Contains(text, "reach out"), strings.Contains(text, "talk"):
		return "social"
	default:
		return "general"
	}
}

func videoCandidateOrder(tasks []Task) []int {
	indices := make([]int, 0, len(tasks))
	high := make([]int, 0, len(tasks))
	med := make([]int, 0, len(tasks))
	low := make([]int, 0, len(tasks))
	for i := range tasks {
		score := taskVideoSuitability(tasks[i])
		switch {
		case score >= 3:
			high = append(high, i)
		case score == 2:
			med = append(med, i)
		default:
			low = append(low, i)
		}
	}
	indices = append(indices, high...)
	indices = append(indices, med...)
	indices = append(indices, low...)
	return indices
}

func taskVideoSuitability(task Task) int {
	text := strings.ToLower(strings.TrimSpace(task.Title + " " + task.Description))
	switch {
	case strings.Contains(text, "watch"), strings.Contains(text, "video"), strings.Contains(text, "guided"):
		return 3
	case strings.Contains(text, "breath"), strings.Contains(text, "stretch"), strings.Contains(text, "meditat"), strings.Contains(text, "exercise"), strings.Contains(text, "yoga"):
		return 2
	default:
		return 1
	}
}

func isPhysicalTask(task Task) bool {
	text := strings.ToLower(strings.TrimSpace(task.Title + " " + task.Description))
	return strings.Contains(text, "physical") ||
		strings.Contains(text, "walk") ||
		strings.Contains(text, "stretch") ||
		strings.Contains(text, "exercise") ||
		strings.Contains(text, "movement") ||
		strings.Contains(text, "workout") ||
		strings.Contains(text, "yoga")
}

func physicalTaskImageURL() string {
	return "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1280&q=80"
}

func normalizeKey(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	prevUnderscore := false
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			prevUnderscore = false
			continue
		}
		if !prevUnderscore {
			b.WriteByte('_')
			prevUnderscore = true
		}
	}
	return strings.Trim(b.String(), "_")
}

func normalizeYesNo(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "yes", "y", "true", "1":
		return "Yes"
	default:
		return "No"
	}
}

func normalizeGender(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "female", "f":
		return "Female"
	case "male", "m":
		return "Male"
	default:
		return "Other"
	}
}

func normalizeCountry(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "uk", "united kingdom":
		return "UK"
	case "canada":
		return "Canada"
	case "india":
		return "India"
	case "nepal":
		return "Nepal"
	default:
		return "US"
	}
}

func normalizeWorkInterference(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "never":
		return "Never"
	case "rarely":
		return "Rarely"
	case "often":
		return "Often"
	default:
		return "Sometimes"
	}
}
