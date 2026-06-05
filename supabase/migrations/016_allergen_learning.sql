-- Allergen module completions (per user, per module)
CREATE TABLE IF NOT EXISTS public.allergen_module_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_slug TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_slug)
);
ALTER TABLE public.allergen_module_completions ENABLE ROW LEVEL SECURITY;
-- Users can only see and write their own completions
CREATE POLICY "own_completions" ON public.allergen_module_completions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
