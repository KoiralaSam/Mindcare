-- Avatar URL derived from user id so ids differing by a multiple of 10 share the same image (0–9).
ALTER TABLE users
    ADD COLUMN avatar TEXT GENERATED ALWAYS AS (
        'https://randomuser.me/api/portraits/lego/'
        || (MOD(id, 10))::text
        || '.jpg'
    ) STORED;
