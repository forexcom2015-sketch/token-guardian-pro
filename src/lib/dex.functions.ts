import { createServerFn } from "@tanstack/react-start";

export type Ativo = "USDT" | "SOL" | "BNB" | "ETH";
const IDS: Record<Ativo, string> = {
  USDT: "tether",
  SOL: "solana",
  BNB: "binancecoin",
  ETH: "ethereum",
};

type Cotacoes = { precos: Record<Ativo, number | null>; atualizadoEm: string };

// Cache no servidor: todos os visitantes dividem a mesma consulta ao CoinGecko (limite baixo da API gratuita)
// e, se o CoinGecko falhar, a última cotação boa continua sendo servida por até 5 minutos.
const TTL_MS = 60_000;
const VELHA_MS = 5 * 60_000;
let cache: { em: number; v: Cotacoes } | null = null;

const preco = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;

/** Cotações públicas em R$ (CoinGecko); null por ativo quando indisponível. */
export const cotacoesBrl = createServerFn({ method: "GET" }).handler(
  async (): Promise<Cotacoes> => {
    if (cache && Date.now() - cache.em < TTL_MS) return cache.v;
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=brl&ids=${Object.values(IDS).join(",")}`;
      const r = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) throw new Error(`status ${r.status}`);
      const j = (await r.json()) as Record<string, { brl?: unknown }>;
      const precos = Object.fromEntries(
        (Object.keys(IDS) as Ativo[]).map((a) => [a, preco(j[IDS[a]]?.brl)]),
      ) as Record<Ativo, number | null>;
      const v = { precos, atualizadoEm: new Date().toISOString() };
      cache = { em: Date.now(), v };
      return v;
    } catch (e) {
      console.error("[dex] cotações indisponíveis", e);
      if (cache && Date.now() - cache.em < VELHA_MS) return cache.v;
      throw new Error("Cotações indisponíveis no momento.");
    }
  },
);
