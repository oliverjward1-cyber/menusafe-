-- Add kcal_per_100g to ingredients for calorie tracking in recipes
ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS kcal_per_100g DECIMAL(8,2);
