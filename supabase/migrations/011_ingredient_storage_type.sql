ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS storage_type TEXT NOT NULL DEFAULT 'ambient'
  CHECK (storage_type IN ('chilled', 'ambient', 'frozen'));
