-- Add corrective_action to temperature_logs
ALTER TABLE public.temperature_logs
  ADD COLUMN IF NOT EXISTS corrective_action TEXT;

-- Add assessment_type to staff_quiz_attempts (human-readable label)
ALTER TABLE public.staff_quiz_attempts
  ADD COLUMN IF NOT EXISTS assessment_type TEXT NOT NULL DEFAULT 'Allergen Knowledge';

-- HACCP plans
CREATE TABLE IF NOT EXISTS public.haccp_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  last_reviewed_date DATE NOT NULL,
  reviewed_by TEXT NOT NULL,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.haccp_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurant_rls" ON public.haccp_plans
  USING (restaurant_id IN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));

-- Probe calibration logs
CREATE TABLE IF NOT EXISTS public.probe_calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  calibrated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ice_point NUMERIC(5,2) NOT NULL,     -- pass if -1 to +1
  boiling_point NUMERIC(5,2) NOT NULL, -- pass if 99 to 101
  recorded_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.probe_calibrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurant_rls" ON public.probe_calibrations
  USING (restaurant_id IN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));
