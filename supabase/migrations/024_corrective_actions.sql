-- Corrective actions: auto-generated follow-up tasks from incidents and temperature breaches

CREATE TABLE IF NOT EXISTS public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  due_date DATE,
  source_type TEXT NOT NULL CHECK (source_type IN ('incident', 'temperature', 'audit', 'manual')),
  source_id UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage corrective actions for their restaurant"
  ON public.corrective_actions
  FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX idx_corrective_actions_restaurant ON public.corrective_actions(restaurant_id);
CREATE INDEX idx_corrective_actions_status ON public.corrective_actions(status);
CREATE INDEX idx_corrective_actions_source ON public.corrective_actions(source_type, source_id);
