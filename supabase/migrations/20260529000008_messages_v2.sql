-- Add subject and spam-flag columns to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS subject  text    CHECK (char_length(subject) <= 100);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_spam  boolean NOT NULL DEFAULT false;
