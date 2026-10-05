import { createServerFn } from "@tanstack/react-start";

export type Ativo = "USDT" | "SOL" | "BNB" | "ETH";
const IDS: Record<Ativo, string> = {
  USDT: "tether",
  SOL: "solana",
  BNB: "binancecoin",
  ETH: "ethereum",
};

type Cotacoes = { precos: Record<Ativo, number | null>; atualizadoEm: string };

// Cache curto no servidor: a cotação do USDT/BRL vem da OKX e é atualizada a cada 5s.
// Binance e CoinGecko permanecem como fontes de fallback; a última cotação boa dura até 5 minutos.
const TTL_MS = 5_000;
const VELHA_MS = 5 * 60_000;
let cache: { em: number; v: Cotacoes } | null = null;

const preco = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Cotações públicas em R$; USDT prioriza OKX, depois Binance e CoinGecko. */
export const cotacoesBrl = createServerFn({ method: "GET" }).handler(
  async (): Promise<Cotacoes> => {
    if (cache && Date.now() - cache.em < TTL_MS) return cache.v;
    try {
      const [okxResult, binanceResult, geckoResult] = await Promise.allSettled([
        fetch("https://www.okx.com/api/v5/market/ticker?instId=USDT-BRL", {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(5_000),
        }),
        fetch("https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL", {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(5_000),
        }),
        fetch(`https://api.coingecko.com/api/v3/simple/price?vs_currencies=brl&ids=${Object.values(IDS).join(",")}`, {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(5_000),
        }),
      ]);

      const okxRes = okxResult.status === "fulfilled" ? okxResult.value : null;
      const binanceRes = binanceResult.status === "fulfilled" ? binanceResult.value : null;
      const geckoRes = geckoResult.status === "fulfilled" ? geckoResult.value : null;
      if (!okxRes?.ok && !binanceRes?.ok && !geckoRes?.ok) {
        throw new Error("fontes de cotação indisponíveis");
      }

      const okx = okxRes?.ok
        ? ((await okxRes.json()) as { code?: string; data?: Array<{ last?: unknown }> })
        : null;
      const binance = binanceRes?.ok
        ? ((await binanceRes.json()) as { price?: unknown })
        : null;
      const gecko = geckoRes?.ok
        ? ((await geckoRes.json()) as Record<string, { brl?: unknown }>)
        : {};

      const precos = Object.fromEntries(
        (Object.keys(IDS) as Ativo[]).map((a) => [
          a,
          a === "USDT"
            ? preco(okx?.data?.[0]?.last) ?? preco(binance?.price) ?? preco(gecko[IDS[a]]?.brl)
            : preco(gecko[IDS[a]]?.brl),
        ]),
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
