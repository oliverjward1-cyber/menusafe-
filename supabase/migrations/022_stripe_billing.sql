ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'core',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_customer ON public.restaurants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON public.restaurants(subscription_status);
