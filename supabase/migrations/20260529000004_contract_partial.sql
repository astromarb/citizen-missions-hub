-- Track partial contract completions
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS partial boolean NOT NULL DEFAULT false;
