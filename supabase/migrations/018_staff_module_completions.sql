CREATE TABLE IF NOT EXISTS public.staff_module_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  module_slug TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id, staff_name, module_slug)
);

ALTER TABLE public.staff_module_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant members can view staff completions"
  ON public.staff_module_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.restaurant_id = staff_module_completions.restaurant_id
    )
  );
