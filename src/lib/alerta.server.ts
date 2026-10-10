import type { Rede } from "./onchain.server";

type TokenRegistravel = {
  rede: Rede;
  endereco: string;
  nome: string;
  simbolo: string;
  risco: { nota: number };
  mercado: { liquidezUsd: number | null; criadoEm: number | null };
};

const normalizar = (rede: Rede, endereco: string) => (rede === "solana" ? endereco : endereco.toLowerCase());

/** Registra/atualiza tokens elegíveis. A função SQL ignora atualizações com menos de 5 min. */
export async function registrarAlertas(tokens: TokenRegistravel[]): Promise<void> {
  if (!tokens.length) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const payload = tokens.slice(0, 100).map((t) => ({
    rede: t.rede,
    endereco: normalizar(t.rede, t.endereco),
    simbolo: t.simbolo,
    nome: t.nome,
    nota: t.risco.nota,
    liquidez_usd: t.mercado.liquidezUsd,
    par_criado_em: t.mercado.criadoEm ? new Date(t.mercado.criadoEm).toISOString() : null,
  }));
  const { error } = await supabaseAdmin.rpc("registrar_alertas", { p_alertas: payload });
  if (error) throw new Error(error.message);
}

export async function lerHistoricoAlertas(limite = 50) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("alertas_seguranca")
    .select("rede, endereco, simbolo, nome, nota, liquidez_usd, par_criado_em, first_seen_at, last_seen_at")
    .order("last_seen_at", { ascending: false })
    .limit(Math.min(Math.max(1, limite), 100));
  if (error) throw new Error(error.message);
  return data ?? [];
}
