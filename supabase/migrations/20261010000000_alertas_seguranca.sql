create table if not exists public.alertas_seguranca (
  rede text not null check (rede in ('solana','bsc','ethereum','base')),
  endereco text not null,
  simbolo text,
  nome text,
  nota integer not null check (nota between 0 and 100),
  liquidez_usd numeric,
  par_criado_em timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (rede, endereco)
);

alter table public.alertas_seguranca enable row level security;
revoke all on table public.alertas_seguranca from anon, authenticated;

create or replace function public.registrar_alertas(p_alertas jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_alertas is null or jsonb_typeof(p_alertas) is distinct from 'array' then
    raise exception 'payload inválido';
  end if;
  if jsonb_array_length(p_alertas) > 100 then
    raise exception 'payload excede 100 alertas';
  end if;

  insert into public.alertas_seguranca (rede, endereco, simbolo, nome, nota, liquidez_usd, par_criado_em)
  select
    a->>'rede',
    a->>'endereco',
    a->>'simbolo',
    a->>'nome',
    (a->>'nota')::integer,
    nullif(a->>'liquidez_usd', '')::numeric,
    nullif(a->>'par_criado_em', '')::timestamptz
  from jsonb_array_elements(p_alertas) as a
  on conflict (rede, endereco) do update set
    simbolo = excluded.simbolo,
    nome = excluded.nome,
    nota = excluded.nota,
    liquidez_usd = excluded.liquidez_usd,
    last_seen_at = now()
  where public.alertas_seguranca.last_seen_at < now() - interval '5 minutes';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.registrar_alertas(jsonb) from public, anon, authenticated;
grant execute on function public.registrar_alertas(jsonb) to service_role;
