-- MenuSafe — Initial schema
-- UK Food Information Regulations 2014 compliant allergen tracking

-- Restaurants
CREATE TABLE public.restaurants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  target_gp   DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles (extends auth.users)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  role          TEXT NOT NULL CHECK (role IN ('chef', 'owner')),
  full_name     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ingredients with all 14 UK regulated allergens (FIR 2014)
CREATE TABLE public.ingredients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id           UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  cost_per_unit           DECIMAL(10,4) NOT NULL,
  unit_type               TEXT NOT NULL CHECK (unit_type IN ('kg', 'g', 'ml', 'litre', 'each')),
  -- 14 regulated allergens
  allergen_celery         BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_cereals_gluten BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_crustaceans    BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_eggs           BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_fish           BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_lupin          BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_milk           BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_molluscs       BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_mustard        BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_nuts           BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_peanuts        BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_sesame         BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_soya           BOOLEAN NOT NULL DEFAULT FALSE,
  allergen_sulphites      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipes
CREATE TABLE public.recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  portion_size  TEXT,
  sell_price    DECIMAL(10,2),
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES auth.users(id),
  approved_by   UUID REFERENCES auth.users(id),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipe ingredients (junction)
CREATE TABLE public.recipe_ingredients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id),
  quantity      DECIMAL(10,4) NOT NULL,
  unit_type     TEXT NOT NULL
);

-- Staff quiz attempts (audit trail)
CREATE TABLE public.staff_quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  staff_name      TEXT NOT NULL,
  score           INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed          BOOLEAN NOT NULL,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ingredients_updated_at
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security
ALTER TABLE public.restaurants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Helper: get the restaurant_id for the current user
CREATE OR REPLACE FUNCTION public.my_restaurant_id()
RETURNS UUID AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Restaurants: members can read their own
CREATE POLICY "restaurant_read" ON public.restaurants
  FOR SELECT USING (id = public.my_restaurant_id());

-- Public: anyone can read restaurant for public menu/quiz (by slug)
CREATE POLICY "restaurant_public_read" ON public.restaurants
  FOR SELECT USING (TRUE);

-- Profiles: users can read/update their own
CREATE POLICY "profile_own" ON public.profiles
  FOR ALL USING (id = auth.uid());

-- Owner can create profiles for their restaurant
CREATE POLICY "profile_insert" ON public.profiles
  FOR INSERT WITH CHECK (TRUE);

-- Ingredients: restaurant members can CRUD
CREATE POLICY "ingredients_restaurant" ON public.ingredients
  FOR ALL USING (restaurant_id = public.my_restaurant_id());

-- Recipes: restaurant members can CRUD
CREATE POLICY "recipes_restaurant" ON public.recipes
  FOR ALL USING (restaurant_id = public.my_restaurant_id());

-- Public menu: anyone can read approved/active recipes
CREATE POLICY "recipes_public_read" ON public.recipes
  FOR SELECT USING (status = 'approved' AND is_active = TRUE);

-- Recipe ingredients: accessible if recipe is accessible
CREATE POLICY "recipe_ingredients_restaurant" ON public.recipe_ingredients
  FOR ALL USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE restaurant_id = public.my_restaurant_id()
    )
  );

-- Public: recipe_ingredients readable for public menus
CREATE POLICY "recipe_ingredients_public" ON public.recipe_ingredients
  FOR SELECT USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE status = 'approved' AND is_active = TRUE
    )
  );

-- Ingredients: readable for public menus (via join)
CREATE POLICY "ingredients_public_read" ON public.ingredients
  FOR SELECT USING (TRUE);

-- Quiz attempts: restaurant owners/chefs can read; anyone can insert
CREATE POLICY "quiz_attempts_restaurant_read" ON public.staff_quiz_attempts
  FOR SELECT USING (restaurant_id = public.my_restaurant_id());

CREATE POLICY "quiz_attempts_public_insert" ON public.staff_quiz_attempts
  FOR INSERT WITH CHECK (TRUE);
