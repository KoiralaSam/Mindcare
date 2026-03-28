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
	ID         int64
	Nickname   string
	Email      string
	Age        sql.NullInt32
	DailyEmber int
	Streak     int
	Avatar     string
	CreatedAt  time.Time
}

var (
	ErrEmailRequired = errors.New("user: email is required")
	ErrNotFound      = errors.New("user: not found")
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

	const q = `
INSERT INTO users (nickname, email, age, daily_ember, streak)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (email) DO UPDATE SET
	nickname = EXCLUDED.nickname,
	age = EXCLUDED.age,
	daily_ember = EXCLUDED.daily_ember,
	streak = EXCLUDED.streak
RETURNING id, created_at, avatar`

	err := db.QueryRow(
		q,
		nick,
		strings.ToLower(email),
		age,
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
SELECT id, nickname, email, age, daily_ember, streak, avatar, created_at
FROM users
WHERE email = $1`

	var u User
	err := db.QueryRow(q, email).Scan(
		&u.ID,
		&u.Nickname,
		&u.Email,
		&u.Age,
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
