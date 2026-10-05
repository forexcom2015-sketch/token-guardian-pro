import { createServerFn } from "@tanstack/react-start";

export type Ativo = "USDT" | "SOL" | "BNB" | "ETH";
const IDS: Record<Ativo, string> = { USDT: "tether", SOL: "solana", BNB: "binancecoin", ETH: "ethereum" };

/** Public BRL quotes from CoinGecko; returns null per asset when unavailable. */
export const cotacoesBrl = createServerFn({ method: "GET" }).handler(async () => {
  const url = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=brl&ids=${Object.values(IDS).join(",")}`;
  const r = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`Cotações indisponíveis (${r.status}).`);
  const j = (await r.json()) as Record<string, { brl?: number }>;
  const precos = Object.fromEntries(
    (Object.keys(IDS) as Ativo[]).map((a) => [a, j[IDS[a]]?.brl ?? null]),
  ) as Record<Ativo, number | null>;
  return { precos, atualizadoEm: new Date().toISOString() };
});
