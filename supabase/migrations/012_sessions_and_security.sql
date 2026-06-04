-- Add plan to restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'core' CHECK (plan IN ('core', 'plus', 'multi'));

-- Login events table (IP, geolocation, device)
CREATE TABLE public.login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  ip_address TEXT,
  city TEXT,
  country TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  device_hint TEXT,
  suspicious BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active sessions table
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  session_key TEXT NOT NULL,
  ip_address TEXT,
  city TEXT,
  device_hint TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, session_key)
);

-- RLS
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_login_events" ON public.login_events FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own_sessions" ON public.user_sessions FOR ALL USING (user_id = auth.uid());
