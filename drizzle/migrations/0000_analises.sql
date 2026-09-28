CREATE TABLE public.analises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rede text NOT NULL,
  endereco text NOT NULL,
  nome text,
  simbolo text,
  score integer,
  analise jsonb NOT NULL,
  gerado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analises TO authenticated;
GRANT ALL ON public.analises TO service_role;
ALTER TABLE public.analises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.analises FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.analises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.analises FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX analises_user_idx ON public.analises (user_id, gerado_em DESC);