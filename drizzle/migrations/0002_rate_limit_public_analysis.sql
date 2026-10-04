-- Persistent atomic rate limits for public, resource-intensive server functions.
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key_hash text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits >= 1)
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limit_buckets FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rate_limit_buckets TO service_role;

CREATE OR REPLACE FUNCTION public.consumir_limite_requisicoes(
  p_chave text,
  p_limite integer,
  p_janela_segundos integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_hits integer;
BEGIN
  IF p_chave IS NULL OR length(p_chave) <> 64
     OR p_limite < 1 OR p_limite > 1000
     OR p_janela_segundos < 1 OR p_janela_segundos > 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  INSERT INTO public.rate_limit_buckets (key_hash, window_started_at, hits)
  VALUES (p_chave, clock_timestamp(), 1)
  ON CONFLICT (key_hash) DO UPDATE
  SET
    hits = CASE
      WHEN public.rate_limit_buckets.window_started_at <= clock_timestamp() - make_interval(secs => p_janela_segundos) THEN 1
      ELSE public.rate_limit_buckets.hits + 1
    END,
    window_started_at = CASE
      WHEN public.rate_limit_buckets.window_started_at <= clock_timestamp() - make_interval(secs => p_janela_segundos) THEN clock_timestamp()
      ELSE public.rate_limit_buckets.window_started_at
    END
  RETURNING hits INTO v_hits;

  DELETE FROM public.rate_limit_buckets
  WHERE window_started_at < clock_timestamp() - interval '2 days';

  RETURN v_hits <= p_limite;
END;
$$;

REVOKE ALL ON FUNCTION public.consumir_limite_requisicoes(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_limite_requisicoes(text, integer, integer) TO service_role;
