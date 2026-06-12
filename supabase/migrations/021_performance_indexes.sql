-- Performance indexes for frequently queried columns

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_restaurant_id ON public.profiles(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipes_restaurant_id ON public.recipes(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredients_restaurant_id ON public.ingredients(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON public.recipe_ingredients(ingredient_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menus_restaurant_id ON public.menus(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_recipes_menu_id ON public.menu_recipes(menu_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_recipes_recipe_id ON public.menu_recipes(recipe_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_temperature_logs_restaurant_id ON public.temperature_logs(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_temperature_logs_logged_at ON public.temperature_logs(logged_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_temperature_logs_check_type ON public.temperature_logs(check_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cleaning_logs_restaurant_id ON public.cleaning_logs(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cleaning_logs_completed_at ON public.cleaning_logs(completed_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cleaning_tasks_restaurant_id ON public.cleaning_tasks(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cleaning_tasks_active ON public.cleaning_tasks(restaurant_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delivery_records_restaurant_id ON public.delivery_records(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delivery_records_delivered_at ON public.delivery_records(delivered_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_restaurant_id ON public.incidents(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_resolved ON public.incidents(restaurant_id, resolved);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_occurred_at ON public.incidents(occurred_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kitchen_audits_restaurant_id ON public.kitchen_audits(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_quiz_attempts_restaurant_id ON public.staff_quiz_attempts(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allergen_module_completions_restaurant_id ON public.allergen_module_completions(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_restaurant_id ON public.invites(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_email ON public.invites(email);
