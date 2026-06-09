-- Add contact details to staff profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT,
  ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;
