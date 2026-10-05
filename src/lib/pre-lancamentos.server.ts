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

let cachePools: { em: number; pools: PoolRecente[] } | null = null;
const TTL_POOLS = 45_000;

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

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/** Fonte pública GeckoTerminal: pools recém-criadas, sem API key. */
export async function listarPoolsNovas(): Promise<{ pools: PoolRecente[]; atualizadoEm: string; fonte: string; aviso: string | null }> {
  if (cachePools && Date.now() - cachePools.em < TTL_POOLS) {
    return { pools: cachePools.pools, atualizadoEm: new Date(cachePools.em).toISOString(), fonte: "GeckoTerminal", aviso: null };
  }

  try {
    const body = (await getJson("https://api.geckoterminal.com/api/v2/networks/new_pools")) as GeckoResponse;
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

    cachePools = { em: Date.now(), pools };
    return { pools, atualizadoEm: new Date().toISOString(), fonte: "GeckoTerminal", aviso: null };
  } catch {
    return {
      pools: cachePools?.pools ?? [],
      atualizadoEm: cachePools ? new Date(cachePools.em).toISOString() : new Date().toISOString(),
      fonte: "GeckoTerminal",
      aviso: "Não foi possível conectar ao feed público de pools. Exibindo cache, se disponível.",
    };
  }
}

export type TokenRecente = {
  id: string;
  rede: string;
  endereco: string;
  nome: string;
  simbolo: string | null;
  precoUsd: number | null;
  liquidezUsd: number | null;
  volume24hUsd: number | null;
  fdvUsd: number | null;
  marketCapUsd: number | null;
  criadoEm: string | null;
  compras24h: number | null;
  vendas24h: number | null;
  url: string;
  fonte: string;
};

type DexProfile = {
  url?: string;
  chainId?: string;
  tokenAddress?: string;
  description?: string | null;
  links?: Array<{ type?: string; label?: string; url?: string }>;
};

type DexPair = {
  chainId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string | null;
  txns?: Record<string, { buys?: number; sells?: number }>;
  volume?: Record<string, number>;
  liquidity?: { usd?: number | null };
  fdv?: number | null;
  marketCap?: number | null;
  pairCreatedAt?: number | null;
};

type PumpCoin = {
  mint?: string;
  name?: string;
  symbol?: string;
  usd_market_cap?: number;
  market_cap?: number;
  marketCap?: number;
  created_timestamp?: number;
  createdAt?: string;
  king_of_the_hill_timestamp?: number | null;
};

let cacheTokens: { em: number; tokens: TokenRecente[] } | null = null;
const TTL_TOKENS = 30_000;

function idadeMs(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const d = typeof v === "number" ? new Date(v < 2_000_000_000_000 ? v * 1000 : v) : new Date(v);
  const ms = Date.now() - d.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function paresMetricas(pair: DexPair) {
  const h24 = pair.txns?.h24;
  return {
    precoUsd: numero(pair.priceUsd),
    liquidezUsd: numero(pair.liquidity?.usd),
    volume24hUsd: numero(pair.volume?.h24),
    fdvUsd: numero(pair.fdv),
    marketCapUsd: numero(pair.marketCap),
    compras24h: numero(h24?.buys),
    vendas24h: numero(h24?.sells),
    criadoEm: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : null,
  };
}

/** Agrega perfis públicos do DEX Screener e os enriquece com dados públicos de pares. */
export async function listarTokensPublicos(): Promise<{ tokens: TokenRecente[]; atualizadoEm: string; fontes: string[]; aviso: string | null }> {
  if (cacheTokens && Date.now() - cacheTokens.em < TTL_TOKENS) {
    return { tokens: cacheTokens.tokens, atualizadoEm: new Date(cacheTokens.em).toISOString(), fontes: ["DEX Screener", "Pump.fun"], aviso: null };
  }

  const avisos: string[] = [];
  const porChave = new Map<string, TokenRecente>();

  try {
    const perfis = (await getJson("https://api.dexscreener.com/token-profiles/latest/v1")) as DexProfile[];
    const perfisValidos = Array.isArray(perfis) ? perfis.filter((p) => p.chainId && p.tokenAddress) : [];

    const grupos = new Map<string, string[]>();
    for (const p of perfisValidos.slice(0, 30)) {
      const atual = grupos.get(p.chainId!) ?? [];
      if (atual.length < 30) atual.push(p.tokenAddress!);
      grupos.set(p.chainId!, atual);
    }

    for (const [chainId, addresses] of grupos) {
      try {
        const pares = (await getJson(`https://api.dexscreener.com/tokens/v1/${encodeURIComponent(chainId)}/${addresses.map(encodeURIComponent).join(",")}`)) as DexPair[];
        for (const pair of Array.isArray(pares) ? pares : []) {
          const address = pair.baseToken?.address;
          if (!address) continue;
          const chave = `${chainId}:${address}`;
          const metricas = paresMetricas(pair);
          const anterior = porChave.get(chave);
          if (!anterior || (metricas.liquidezUsd ?? 0) > (anterior.liquidezUsd ?? 0)) {
            porChave.set(chave, {
              id: chave,
              rede: chainId,
              endereco: address,
              nome: pair.baseToken?.name ?? "Token sem nome",
              simbolo: pair.baseToken?.symbol ?? null,
              ...metricas,
              url: pair.url ?? `https://dexscreener.com/${encodeURIComponent(chainId)}/${encodeURIComponent(pair.pairAddress ?? "")}`,
              fonte: "DEX Screener",
            });
          }
        }
      } catch {
        avisos.push(`Não foi possível enriquecer tokens da rede ${chainId}.`);
      }
    }
  } catch {
    avisos.push("DEX Screener indisponível no momento.");
  }

  try {
    const coins = (await getJson("https://frontend-api-v3.pump.fun/coins/latest?offset=0&limit=30&includeNsfw=false")) as PumpCoin[] | { data?: PumpCoin[] };
    const lista = Array.isArray(coins) ? coins : (Array.isArray(coins.data) ? coins.data : []);
    for (const coin of lista) {
      if (!coin.mint) continue;
      const criado = coin.created_timestamp ?? coin.createdAt ?? null;
      porChave.set(`solana:${coin.mint}`, {
        id: `solana:${coin.mint}`,
        rede: "solana",
        endereco: coin.mint,
        nome: coin.name ?? "Token Pump.fun",
        simbolo: coin.symbol ?? null,
        precoUsd: null,
        liquidezUsd: null,
        volume24hUsd: null,
        fdvUsd: numero(coin.usd_market_cap ?? coin.market_cap ?? coin.marketCap),
        marketCapUsd: numero(coin.usd_market_cap ?? coin.market_cap ?? coin.marketCap),
        criadoEm: typeof criado === "number" ? new Date(criado < 2_000_000_000_000 ? criado * 1000 : criado).toISOString() : criado,
        compras24h: null,
        vendas24h: null,
        url: `https://pump.fun/coin/${encodeURIComponent(coin.mint)}`,
        fonte: "Pump.fun",
      });
    }
  } catch {
    avisos.push("Feed público do Pump.fun indisponível no momento.");
  }

  const tokens = [...porChave.values()]
    .filter((token) => {
      const ms = idadeMs(token.criadoEm);
      return ms === null || ms >= 0;
    })
    .sort((a, b) => (b.criadoEm ?? "").localeCompare(a.criadoEm ?? ""));

  cacheTokens = { em: Date.now(), tokens };
  return {
    tokens,
    atualizadoEm: new Date().toISOString(),
    fontes: ["DEX Screener", "Pump.fun"],
    aviso: avisos.length ? avisos.join(" ") : null,
  };
}

export type LancamentoPublico = {
  id: string;
  projeto: string;
  simbolo: string | null;
  rede: string;
  endereco: string;
  estagio: "token-recente" | "pool-recente" | "sinal-publico";
  liquidezUsd: number | null;
  volume24hUsd: number | null;
  fdvUsd: number | null;
  criadoEm: string | null;
  fonte: string;
  url: string;
  sinal: string;
};

let cacheLancamentos: { em: number; lancamentos: LancamentoPublico[] } | null = null;
const TTL_LANCAMENTOS = 45_000;

/**
 * Radar consolidado sem API key: cruza pools novas do GeckoTerminal com tokens
 * recém-descobertos do DEX Screener/Pump.fun. Não chama CryptoRank nem Moralis.
 */
export async function listarLancamentosPublicos(): Promise<{
  lancamentos: LancamentoPublico[];
  atualizadoEm: string;
  fontes: string[];
  aviso: string | null;
}> {
  if (cacheLancamentos && Date.now() - cacheLancamentos.em < TTL_LANCAMENTOS) {
    return { lancamentos: cacheLancamentos.lancamentos, atualizadoEm: new Date(cacheLancamentos.em).toISOString(), fontes: ["GeckoTerminal", "DEX Screener", "Pump.fun"], aviso: null };
  }

  const [poolsResult, tokensResult] = await Promise.all([listarPoolsNovas(), listarTokensPublicos()]);
  const lancamentos: LancamentoPublico[] = [];

  for (const pool of poolsResult.pools) {
    lancamentos.push({
      id: `pool:${pool.rede}:${pool.enderecoPool}`,
      projeto: pool.nome,
      simbolo: pool.tokenBase === "—" ? null : pool.tokenBase,
      rede: pool.rede,
      endereco: pool.enderecoPool,
      estagio: "pool-recente",
      liquidezUsd: pool.liquidezUsd,
      volume24hUsd: pool.volume24hUsd,
      fdvUsd: pool.fdvUsd,
      criadoEm: pool.criadoEm,
      fonte: "GeckoTerminal",
      url: pool.url,
      sinal: "Pool recém-criada com liquidez detectada",
    });
  }

  for (const token of tokensResult.tokens) {
    const idade = idadeMs(token.criadoEm);
    const sinal = idade !== null && idade < 24 * 60 * 60 * 1000
      ? "Token detectado recentemente"
      : "Token público recentemente indexado";
    lancamentos.push({
      id: `token:${token.id}`,
      projeto: token.nome,
      simbolo: token.simbolo,
      rede: token.rede,
      endereco: token.endereco,
      estagio: "token-recente",
      liquidezUsd: token.liquidezUsd,
      volume24hUsd: token.volume24hUsd,
      fdvUsd: token.fdvUsd,
      criadoEm: token.criadoEm,
      fonte: token.fonte,
      url: token.url,
      sinal,
    });
  }

  const deduplicados = new Map<string, LancamentoPublico>();
  for (const item of lancamentos) {
    const chave = `${item.rede}:${item.endereco}`;
    const anterior = deduplicados.get(chave);
    if (!anterior || item.estagio === "pool-recente") deduplicados.set(chave, item);
  }

  const resultado = [...deduplicados.values()]
    .sort((a, b) => (b.criadoEm ?? "").localeCompare(a.criadoEm ?? ""))
    .slice(0, 100);

  cacheLancamentos = { em: Date.now(), lancamentos: resultado };

  return {
    lancamentos: resultado,
    atualizadoEm: new Date().toISOString(),
    fontes: ["GeckoTerminal", "DEX Screener", "Pump.fun"],
    aviso: [poolsResult.aviso, tokensResult.aviso].filter(Boolean).join(" ") || null,
  };
}

/** Mantém a função antiga apenas como compatibilidade interna; agora usa fontes públicas. */
export async function listarVendasPublicas() {
  const resultado = await listarLancamentosPublicos();
  return {
    vendas: resultado.lancamentos.map((item) => ({
      id: item.id,
      projeto: item.projeto,
      simbolo: item.simbolo,
      tipo: item.estagio,
      status: item.sinal,
      inicio: item.criadoEm,
      fim: null,
      preco: null,
      launchpad: item.fonte,
      url: item.url,
    })),
    atualizadoEm: resultado.atualizadoEm,
    fonte: resultado.fontes.join(" + "),
    configurado: true,
    aviso: resultado.aviso,
  };
}

export type TokenBonding = {
  address: string;
  nome: string;
  simbolo: string | null;
  marketCapUsd: number | null;
  liquidezUsd: number | null;
  precoUsd: number | null;
  volume24hUsd: number | null;
  progressoCurva: number | null;
  criadoEm: string | null;
  url: string;
};

export async function listarTokensBonding() {
  const tokens = await listarTokensPublicos();
  return {
    tokens: tokens.tokens.filter((t) => t.fonte === "Pump.fun").map((t) => ({
      address: t.endereco,
      nome: t.nome,
      simbolo: t.simbolo,
      marketCapUsd: t.marketCapUsd,
      liquidezUsd: t.liquidezUsd,
      precoUsd: t.precoUsd,
      volume24hUsd: t.volume24hUsd,
      progressoCurva: null,
      criadoEm: t.criadoEm,
      url: t.url,
    })),
    atualizadoEm: tokens.atualizadoEm,
    fonte: "Pump.fun public feed",
    configurado: true,
    aviso: tokens.aviso,
  };
}
