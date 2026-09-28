import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Cotacao = {
  endereco: string;
  precoUsd: number | null;
  volume24h: number | null;
  liquidezUsd: number | null;
  variacao1h: number | null;
  variacao24h: number | null;
  pool: string | null;
};

const REDE_GECKO: Record<string, string> = { solana: "solana", bsc: "bsc", ethereum: "eth", base: "base" };

const num = (v: unknown) => (v == null || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);

type GeckoPool = {
  attributes: {
    address: string;
    reserve_in_usd?: string;
    base_token_price_usd?: string;
    volume_usd?: { h24?: string };
    price_change_percentage?: { h1?: string; h24?: string };
  };
  relationships?: { base_token?: { data?: { id?: string } } };
};

// Preço e liquidez ao vivo das pools no GeckoTerminal (agrega Raydium, PancakeSwap, Uniswap etc.).
export const cotacoesAoVivo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        itens: z
          .array(z.object({ rede: z.enum(["solana", "bsc", "ethereum", "base"]), endereco: z.string().min(20).max(80) }))
          .max(60),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<Record<string, Cotacao>> => {
    const porRede = new Map<string, string[]>();
    for (const i of data.itens) {
      const l = porRede.get(i.rede) ?? [];
      if (!l.includes(i.endereco)) l.push(i.endereco);
      porRede.set(i.rede, l);
    }
    const saida: Record<string, Cotacao> = {};
    await Promise.all(
      [...porRede].flatMap(([rede, ends]) =>
        ends.map(async (endereco) => {
          try {
            const r = await fetch(
              `https://api.geckoterminal.com/api/v2/networks/${REDE_GECKO[rede]}/tokens/${endereco}/pools?page=1`,
              { headers: { accept: "application/json" } },
            );
            if (!r.ok) return;
            const j = (await r.json()) as { data?: GeckoPool[] };
            const pools = j.data ?? [];
            if (!pools.length) return;
            const liquidez = pools.reduce((s, p) => s + (num(p.attributes.reserve_in_usd) ?? 0), 0);
            const volume = pools.reduce((s, p) => s + (num(p.attributes.volume_usd?.h24) ?? 0), 0);
            const top = pools[0]!;
            const ehBase = top.relationships?.base_token?.data?.id?.toLowerCase().endsWith(endereco.toLowerCase());
            saida[endereco] = {
              endereco,
              precoUsd: ehBase === false ? null : num(top.attributes.base_token_price_usd),
              volume24h: volume,
              liquidezUsd: liquidez,
              variacao1h: num(top.attributes.price_change_percentage?.h1),
              variacao24h: num(top.attributes.price_change_percentage?.h24),
              pool: top.attributes.address,
            };
          } catch {
            /* sem dados */
          }
        }),
      ),
    );
    return saida;
  });
