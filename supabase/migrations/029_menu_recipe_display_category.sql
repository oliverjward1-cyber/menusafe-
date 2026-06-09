-- Per-menu course override: lets a dish appear under a different course on this menu
-- without changing the recipe's global category
ALTER TABLE public.menu_recipes
  ADD COLUMN IF NOT EXISTS display_category TEXT;
