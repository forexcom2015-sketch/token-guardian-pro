-- Restrict persisted analysis history to the authenticated owner.
-- Apply through the Supabase migration workflow after confirming public.analises exists.
ALTER TABLE public.analises ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.analises FROM anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.analises TO authenticated;
GRANT ALL ON TABLE public.analises TO service_role;

DROP POLICY IF EXISTS "Users can read their own analyses" ON public.analises;
CREATE POLICY "Users can read their own analyses"
  ON public.analises
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own analyses" ON public.analises;
CREATE POLICY "Users can insert their own analyses"
  ON public.analises
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.analises;
CREATE POLICY "Users can delete their own analyses"
  ON public.analises
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
