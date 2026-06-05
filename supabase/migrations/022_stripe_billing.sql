-- Stripe billing columns on restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'paused', 'incomplete')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'core'
    CHECK (plan IN ('core', 'plus', 'multi'));

CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_customer ON public.restaurants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_sub ON public.restaurants(stripe_subscription_id);
