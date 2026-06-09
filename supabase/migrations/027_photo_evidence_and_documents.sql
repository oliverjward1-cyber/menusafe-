-- Photo evidence on incidents and temperature logs
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.temperature_logs
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Document storage
CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('haccp', 'training', 'insurance', 'supplier', 'certificates', 'general')),
  file_url      TEXT NOT NULL,
  file_size     INTEGER,
  mime_type     TEXT,
  uploaded_by   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_restaurant_rls" ON public.documents
  FOR ALL USING (
    restaurant_id IN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid())
  );
