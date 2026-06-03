-- Add declared_allergens to recipes for pre-populating from existing allergen sheets
-- before ingredients are added. Used as a fallback in allergen matrix and public menu.
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS declared_allergens text[] DEFAULT '{}';
