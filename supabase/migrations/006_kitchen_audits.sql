-- Kitchen audit tables
CREATE TABLE public.kitchen_audits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  completed_by    TEXT NOT NULL,
  score           INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'green' CHECK (status IN ('green', 'amber', 'red')),
  notes           TEXT,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.kitchen_audit_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id    UUID NOT NULL REFERENCES public.kitchen_audits(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  answer      TEXT NOT NULL CHECK (answer IN ('pass', 'fail', 'na')),
  notes       TEXT,
  photo_url   TEXT
);

ALTER TABLE public.kitchen_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_audit_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audits_restaurant" ON public.kitchen_audits
  FOR ALL USING (restaurant_id = public.my_restaurant_id());

CREATE POLICY "audits_public_insert" ON public.kitchen_audits
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "audit_answers_restaurant" ON public.kitchen_audit_answers
  FOR ALL USING (
    audit_id IN (SELECT id FROM public.kitchen_audits WHERE restaurant_id = public.my_restaurant_id())
  );

CREATE POLICY "audit_answers_public_insert" ON public.kitchen_audit_answers
  FOR INSERT WITH CHECK (TRUE);
