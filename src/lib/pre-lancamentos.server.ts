export type PoolRecente = {
  rede: string;
  enderecoPool: string;
  nome: string;
  tokenBase: string;
  tokenQuote: string;
  precoUsd: number | null;
  liquidezUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number | null;
  compras24h: number | null;
  vendas24h: number | null;
  criadoEm: string | null;
  url: string;
};

type GeckoPool = {
  id?: string;
  attributes?: {
    address?: string;
    name?: string;
    base_token_price_usd?: string | null;
    reserve_in_usd?: string | null;
    fdv_usd?: string | null;
    volume_usd?: { h24?: string | null };
    transactions?: { h24?: { buys?: number; sells?: number } };
    pool_created_at?: string | null;
  };
  relationships?: {
    network?: { data?: { id?: string } };
    base_token?: { data?: { id?: string } };
    quote_token?: { data?: { id?: string } };
  };
};

type GeckoResponse = { data?: GeckoPool[] };

let cache: { em: number; pools: PoolRecente[] } | null = null;
const TTL = 45_000;

function numero(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function tokenId(id?: string): string {
  if (!id) return "—";
  const partes = id.split("_");
  return partes.length > 1 ? partes.slice(1).join("_") : id;
}

/**
 * Feed público GeckoTerminal de pools novas. Cache curto para reduzir chamadas
 * e não exceder desnecessariamente os limites compartilhados da API.
 */
export async function listarPoolsNovas(): Promise<{ pools: PoolRecente[]; atualizadoEm: string; fonte: string; aviso: string | null }> {
  if (cache && Date.now() - cache.em < TTL) {
    return {
      pools: cache.pools,
      atualizadoEm: new Date(cache.em).toISOString(),
      fonte: "GeckoTerminal",
      aviso: null,
    };
  }

  try {
    const response = await fetch("https://api.geckoterminal.com/api/v2/networks/new_pools", {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      return {
        pools: cache?.pools ?? [],
        atualizadoEm: cache ? new Date(cache.em).toISOString() : new Date().toISOString(),
        fonte: "GeckoTerminal",
        aviso: response.status === 429
          ? "Limite temporário da API atingido. Exibindo dados em cache, se disponíveis."
          : `A fonte respondeu com status ${response.status}. Tente novamente mais tarde.`,
      };
    }

    const body = (await response.json()) as GeckoResponse;
    const pools = (body.data ?? []).map((item): PoolRecente | null => {
      const a = item.attributes;
      const rede = item.relationships?.network?.data?.id;
      const enderecoPool = a?.address;
      if (!a || !rede || !enderecoPool) return null;
      return {
        rede,
        enderecoPool,
        nome: a.name ?? "Pool sem nome",
        tokenBase: tokenId(item.relationships?.base_token?.data?.id),
        tokenQuote: tokenId(item.relationships?.quote_token?.data?.id),
        precoUsd: numero(a.base_token_price_usd),
        liquidezUsd: numero(a.reserve_in_usd),
        fdvUsd: numero(a.fdv_usd),
        volume24hUsd: numero(a.volume_usd?.h24),
        compras24h: numero(a.transactions?.h24?.buys),
        vendas24h: numero(a.transactions?.h24?.sells),
        criadoEm: a.pool_created_at ?? null,
        url: `https://www.geckoterminal.com/${encodeURIComponent(rede)}/pools/${encodeURIComponent(enderecoPool)}`,
      };
    }).filter((p): p is PoolRecente => p !== null);

    cache = { em: Date.now(), pools };
    return { pools, atualizadoEm: new Date().toISOString(), fonte: "GeckoTerminal", aviso: null };
  } catch {
    return {
      pools: cache?.pools ?? [],
      atualizadoEm: cache ? new Date(cache.em).toISOString() : new Date().toISOString(),
      fonte: "GeckoTerminal",
      aviso: "Não foi possível conectar ao GeckoTerminal agora. Tente novamente em instantes.",
    };
  }
}
