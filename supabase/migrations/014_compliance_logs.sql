-- Temperature logs (twice-daily)
CREATE TABLE IF NOT EXISTS public.temperature_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  location TEXT NOT NULL,          -- e.g. "Walk-in fridge", "Freezer 1", "Hot hold"
  temperature NUMERIC(5,1) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'C' CHECK (unit IN ('C', 'F')),
  check_type TEXT NOT NULL DEFAULT 'am' CHECK (check_type IN ('am', 'pm', 'spot')),
  recorded_by TEXT NOT NULL,
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.temperature_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurant_rls" ON public.temperature_logs
  USING (restaurant_id IN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));

-- Cleaning schedule tasks
CREATE TABLE IF NOT EXISTS public.cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,              -- e.g. "Deep clean fryers", "Wipe down pass"
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  area TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cleaning_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurant_rls" ON public.cleaning_tasks
  USING (restaurant_id IN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));

-- Cleaning sign-offs
CREATE TABLE IF NOT EXISTS public.cleaning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.cleaning_tasks(id) ON DELETE SET NULL,
  task_name TEXT NOT NULL,
  signed_by TEXT NOT NULL,
  notes TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cleaning_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurant_rls" ON public.cleaning_logs
  USING (restaurant_id IN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));

-- Delivery records
CREATE TABLE IF NOT EXISTS public.delivery_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  supplier TEXT NOT NULL,
  items TEXT NOT NULL,             -- free-text description
  temperature NUMERIC(5,1),
  temp_acceptable BOOLEAN,
  condition TEXT NOT NULL DEFAULT 'acceptable' CHECK (condition IN ('acceptable', 'rejected', 'borderline')),
  batch_codes TEXT,
  received_by TEXT NOT NULL,
  notes TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurant_rls" ON public.delivery_records
  USING (restaurant_id IN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));

-- Seed default cleaning tasks function (called per restaurant on setup)
-- Restaurants can customise after creation
