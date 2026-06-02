-- Menus: a named collection of recipes (e.g. "Summer Menu", "Lunch Menu")
CREATE TABLE IF NOT EXISTS public.menus (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  daypart       TEXT DEFAULT 'all-day',  -- all-day | lunch | dinner | brunch | specials
  is_published  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Junction table linking recipes to menus
CREATE TABLE IF NOT EXISTS public.menu_recipes (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id   UUID REFERENCES public.menus(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(menu_id, recipe_id)
);

-- RLS
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant members can manage their menus"
  ON public.menus FOR ALL
  USING (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Restaurant members can manage their menu_recipes"
  ON public.menu_recipes FOR ALL
  USING (menu_id IN (
    SELECT m.id FROM public.menus m
    JOIN public.profiles p ON p.restaurant_id = m.restaurant_id
    WHERE p.id = auth.uid()
  ));

-- Public read for published menus (customer-facing)
CREATE POLICY "Public can read published menus"
  ON public.menus FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can read menu_recipes for published menus"
  ON public.menu_recipes FOR SELECT
  USING (menu_id IN (SELECT id FROM public.menus WHERE is_published = true));
