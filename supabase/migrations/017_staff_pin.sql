-- Add staff PIN to restaurants table
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS staff_pin TEXT;
