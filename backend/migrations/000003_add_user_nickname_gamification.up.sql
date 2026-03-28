ALTER TABLE users
    ADD COLUMN nickname TEXT NOT NULL DEFAULT '',
    ADD COLUMN daily_ember INTEGER NOT NULL DEFAULT 0
        CONSTRAINT users_daily_ember_non_negative CHECK (daily_ember >= 0),
    ADD COLUMN streak INTEGER NOT NULL DEFAULT 0
        CONSTRAINT users_streak_non_negative CHECK (streak >= 0);
