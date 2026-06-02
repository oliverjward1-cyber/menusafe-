-- May contain allergens per recipe (chef-declared cross-contamination warnings)
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS may_contain_allergens TEXT[] DEFAULT '{}';

-- Allergen change alerts: created when an ingredient's allergens change
CREATE TABLE IF NOT EXISTS public.allergen_alerts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
  ingredient_name TEXT NOT NULL,
  changed_allergens TEXT NOT NULL,  -- human-readable description of what changed
  dismissed     BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.allergen_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant members can manage their allergen alerts"
  ON public.allergen_alerts FOR ALL
  USING (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  ));
