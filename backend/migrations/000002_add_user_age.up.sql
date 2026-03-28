ALTER TABLE users
    ADD COLUMN age SMALLINT
    CONSTRAINT users_age_valid_range CHECK (age IS NULL OR (age >= 0 AND age <= 150));
