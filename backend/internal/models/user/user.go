package user

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/goombaio/namegenerator"
)

// User is a player profile with gamification fields.
// DailyEmber tracks progress toward finishing today’s daily objective (e.g. points or percent scaled by your app).
type User struct {
	ID         int64          `json:"id"`
	Nickname   string         `json:"nickname"`
	Email      string         `json:"email"`
	Age        sql.NullInt32  `json:"age"`
	Gender     sql.NullString `json:"gender"`
	DailyEmber int            `json:"daily_ember"`
	Streak     int            `json:"streak"`
	Avatar     string         `json:"avatar"`
	CreatedAt  time.Time      `json:"created_at"`
}

var (
	ErrEmailRequired   = errors.New("user: email is required")
	ErrNotFound        = errors.New("user: not found")
	ErrNothingToUpdate = errors.New("user: neither streak nor daily ember provided to update")
)

// Save inserts a new user or updates an existing row matched by email.
func (u *User) Save(db *sql.DB) error {
	email := strings.TrimSpace(u.Email)
	if email == "" {
		return ErrEmailRequired
	}

	nick := strings.TrimSpace(u.Nickname)
	if nick == "" {
		gen := namegenerator.NewNameGenerator(time.Now().UTC().UnixNano())
		nick = gen.Generate()
	}
	u.Nickname = nick

	var age any
	if u.Age.Valid {
		age = u.Age.Int32
	}
	var gender any
	if u.Gender.Valid {
		gender = u.Gender.String
	}

	const q = `
INSERT INTO users (nickname, email, age, gender, daily_ember, streak)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (email) DO UPDATE SET
	nickname = EXCLUDED.nickname,
	age = EXCLUDED.age,
	gender = EXCLUDED.gender,
	daily_ember = EXCLUDED.daily_ember,
	streak = EXCLUDED.streak
RETURNING id, created_at, avatar`

	err := db.QueryRow(
		q,
		nick,
		strings.ToLower(email),
		age,
		gender,
		u.DailyEmber,
		u.Streak,
	).Scan(&u.ID, &u.CreatedAt, &u.Avatar)
	if err != nil {
		return fmt.Errorf("user save: %w", err)
	}
	return nil
}

// GetByEmail returns the user with the given email, or ErrNotFound.
func GetByEmail(db *sql.DB, email string) (*User, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return nil, ErrEmailRequired
	}

	const q = `
SELECT id, nickname, email, age, gender, daily_ember, streak, avatar, created_at
FROM users
WHERE email = $1`

	var u User
	err := db.QueryRow(q, email).Scan(
		&u.ID,
		&u.Nickname,
		&u.Email,
		&u.Age,
		&u.Gender,
		&u.DailyEmber,
		&u.Streak,
		&u.Avatar,
		&u.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("user by email: %w", err)
	}
	return &u, nil
}

// AddDailyEmber increments daily_ember by delta for the user with the given email and returns the new total.
func AddDailyEmber(db *sql.DB, email string, delta int) (int, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return 0, ErrEmailRequired
	}
	if delta <= 0 {
		return 0, fmt.Errorf("user: delta must be positive")
	}
	const q = `UPDATE users SET daily_ember = daily_ember + $1 WHERE email = $2 RETURNING daily_ember`
	var n int
	err := db.QueryRow(q, delta, email).Scan(&n)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, ErrNotFound
	}
	if err != nil {
		return 0, fmt.Errorf("add daily ember: %w", err)
	}
	return n, nil
}

// AddDailyEmberWithStreakRollover adds delta to daily_ember; every full 100 embers adds 1 to streak
// and rolls the remainder into daily_ember (0–99).
func AddDailyEmberWithStreakRollover(db *sql.DB, email string, delta int) (dailyEmber int, streak int, err error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return 0, 0, ErrEmailRequired
	}
	if delta <= 0 {
		return 0, 0, fmt.Errorf("user: delta must be positive")
	}
	const q = `
UPDATE users SET
	streak = streak + (daily_ember + $1) / 100,
	daily_ember = (daily_ember + $1) % 100
WHERE email = $2
RETURNING daily_ember, streak`
	err = db.QueryRow(q, delta, email).Scan(&dailyEmber, &streak)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, 0, ErrNotFound
	}
	if err != nil {
		return 0, 0, fmt.Errorf("add daily ember rollover: %w", err)
	}
	return dailyEmber, streak, nil
}

// UpdateStreakAndEmber updates daily_ember and/or streak for the row matching Email.
// Pass nil for a pointer to skip that column; 0 is valid when the pointer is non-nil.
// Returns ErrNothingToUpdate if both arguments are nil.
func (u *User) UpdateStreakAndEmber(db *sql.DB, dailyEmber *int, streak *int) error {
	email := strings.TrimSpace(strings.ToLower(u.Email))
	if email == "" {
		return ErrEmailRequired
	}
	if dailyEmber == nil && streak == nil {
		return ErrNothingToUpdate
	}

	var parts []string
	var args []any
	n := 1
	if dailyEmber != nil {
		parts = append(parts, fmt.Sprintf("daily_ember = $%d", n))
		args = append(args, *dailyEmber)
		n++
	}
	if streak != nil {
		parts = append(parts, fmt.Sprintf("streak = $%d", n))
		args = append(args, *streak)
		n++
	}
	args = append(args, email)
	q := fmt.Sprintf("UPDATE users SET %s WHERE email = $%d", strings.Join(parts, ", "), n)

	res, err := db.Exec(q, args...)
	if err != nil {
		return fmt.Errorf("user update streak/ember: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("user update streak/ember: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// StreakLeaderboardRow is a nickname + streak for public rankings (no PII).
type StreakLeaderboardRow struct {
	Nickname string
	Streak   int
}

// ListStreakLeaderboard returns up to limit users ordered by streak descending, then nickname.
func ListStreakLeaderboard(db *sql.DB, limit int) ([]StreakLeaderboardRow, error) {
	if limit < 1 {
		limit = 1
	}
	if limit > 100 {
		limit = 100
	}
	const q = `
SELECT nickname, streak
FROM users
ORDER BY streak DESC, nickname ASC
LIMIT $1`
	rows, err := db.Query(q, limit)
	if err != nil {
		return nil, fmt.Errorf("streak leaderboard: %w", err)
	}
	defer rows.Close()

	var out []StreakLeaderboardRow
	for rows.Next() {
		var r StreakLeaderboardRow
		if err := rows.Scan(&r.Nickname, &r.Streak); err != nil {
			return nil, fmt.Errorf("streak leaderboard scan: %w", err)
		}
		out = append(out, r)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("streak leaderboard rows: %w", err)
	}
	if out == nil {
		out = []StreakLeaderboardRow{}
	}
	return out, nil
}
