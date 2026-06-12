-- Add optional service window to menus (e.g. 12:00–15:00 for lunch)
ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS service_start TIME,   -- e.g. 12:00
  ADD COLUMN IF NOT EXISTS service_end   TIME;   -- e.g. 15:00
