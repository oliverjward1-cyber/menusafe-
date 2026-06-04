-- Custom audit questions per restaurant
CREATE TABLE public.audit_questions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  key                 TEXT NOT NULL,
  label               TEXT NOT NULL,
  category            TEXT NOT NULL,
  requires_photo_on_fail BOOLEAN NOT NULL DEFAULT FALSE,
  position            INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom quiz questions per restaurant (already used by quiz page)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  quiz_type     TEXT NOT NULL CHECK (quiz_type IN ('front_of_house', 'kitchen')),
  question      TEXT NOT NULL,
  options       JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_questions_restaurant" ON public.audit_questions
  FOR ALL USING (restaurant_id = public.my_restaurant_id());

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_questions_restaurant" ON public.quiz_questions;
CREATE POLICY "quiz_questions_restaurant" ON public.quiz_questions
  FOR ALL USING (restaurant_id = public.my_restaurant_id());
