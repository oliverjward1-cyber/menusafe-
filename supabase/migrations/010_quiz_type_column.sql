ALTER TABLE public.staff_quiz_attempts
ADD COLUMN IF NOT EXISTS quiz_type TEXT NOT NULL DEFAULT 'front_of_house'
CHECK (quiz_type IN ('front_of_house', 'kitchen'));
