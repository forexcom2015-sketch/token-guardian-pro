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


export type VendaPublica = {
  id: string;
  projeto: string;
  simbolo: string | null;
  tipo: string | null;
  status: string | null;
  inicio: string | null;
  fim: string | null;
  preco: string | null;
  launchpad: string | null;
  url: string | null;
};

type RegistroGenerico = Record<string, unknown>;
let cacheVendas: { em: number; vendas: VendaPublica[] } | null = null;
const TTL_VENDAS = 5 * 60_000;

function textoCampo(obj: RegistroGenerico, chaves: string[]): string | null {
  for (const chave of chaves) {
    const valor = obj[chave];
    if (typeof valor === "string" || typeof valor === "number") {
      const texto = String(valor).trim();
      if (texto) return texto;
    }
  }
  return null;
}

function registrosVenda(payload: unknown): RegistroGenerico[] {
  if (!payload || typeof payload !== "object") return [];
  const raiz = payload as RegistroGenerico;
  const dados = Array.isArray(raiz["data"]) ? raiz["data"] : [];
  const saida: RegistroGenerico[] = [];
  for (const item of dados) {
    if (!item || typeof item !== "object") continue;
    const projeto = item as RegistroGenerico;
    const vendasAninhadas = projeto["publicSales"] ?? projeto["public_sales"] ?? projeto["crowdsales"] ?? projeto["sales"];
    if (Array.isArray(vendasAninhadas)) {
      for (const venda of vendasAninhadas) {
        if (venda && typeof venda === "object") {
          saida.push({ ...projeto, ...(venda as RegistroGenerico), _projeto: projeto });
        }
      }
    } else {
      saida.push(projeto);
    }
  }
  return saida;
}

/** Calendário oficial CryptoRank. A chave é lida apenas no servidor e nunca enviada ao navegador. */
export async function listarVendasPublicas(): Promise<{
  vendas: VendaPublica[];
  atualizadoEm: string;
  fonte: string;
  configurado: boolean;
  aviso: string | null;
}> {
  const apiKey = process.env["CRYPTORANK_API_KEY"];
  if (!apiKey) {
    return {
      vendas: cacheVendas?.vendas ?? [],
      atualizadoEm: cacheVendas ? new Date(cacheVendas.em).toISOString() : new Date().toISOString(),
      fonte: "CryptoRank",
      configurado: false,
      aviso: "Integração não configurada: adicione CRYPTORANK_API_KEY como segredo do servidor/Cloudflare para habilitar o calendário.",
    };
  }
  if (cacheVendas && Date.now() - cacheVendas.em < TTL_VENDAS) {
    return { vendas: cacheVendas.vendas, atualizadoEm: new Date(cacheVendas.em).toISOString(), fonte: "CryptoRank", configurado: true, aviso: null };
  }

  try {
    const response = await fetch("https://api.cryptorank.io/v2/currencies/public-sales?crowdsaleStatus=upcoming&sortBy=startDate&sortDirection=ASC&limit=100", {
      headers: { accept: "application/json", "X-Api-Key": apiKey },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      const aviso = response.status === 401 || response.status === 403
        ? "A CryptoRank recusou a chave ou o plano não permite acessar vendas públicas."
        : response.status === 429
          ? "Limite de requisições da CryptoRank atingido. Tente novamente mais tarde."
          : `A CryptoRank respondeu com status ${response.status}.`;
      return { vendas: cacheVendas?.vendas ?? [], atualizadoEm: cacheVendas ? new Date(cacheVendas.em).toISOString() : new Date().toISOString(), fonte: "CryptoRank", configurado: true, aviso };
    }

    const payload: unknown = await response.json();
    const vendas = registrosVenda(payload).map((item, index): VendaPublica | null => {
      const pai = item["_projeto"] && typeof item["_projeto"] === "object" ? item["_projeto"] as RegistroGenerico : item;
      const projeto = textoCampo(item, ["name", "projectName", "project_name", "currencyName"]) ??
        textoCampo(pai, ["name", "projectName", "project_name", "currencyName"]);
      if (!projeto) return null;
      const slug = textoCampo(item, ["slug", "key", "currencyKey"]) ?? textoCampo(pai, ["slug", "key", "currencyKey"]);
      const status = textoCampo(item, ["status", "crowdsaleStatus", "crowdsale_status"]);
      const tipo = textoCampo(item, ["saleType", "sale_type", "type", "roundType"]);
      return {
        id: textoCampo(item, ["id", "saleId", "sale_id"]) ?? `${slug ?? projeto}-${index}`,
        projeto,
        simbolo: textoCampo(item, ["symbol", "ticker"]) ?? textoCampo(pai, ["symbol", "ticker"]),
        tipo,
        status,
        inicio: textoCampo(item, ["startDate", "start_date", "startTime", "start"]),
        fim: textoCampo(item, ["endDate", "end_date", "endTime", "end"]),
        preco: textoCampo(item, ["tokenPrice", "token_price", "price"]),
        launchpad: textoCampo(item, ["launchpadName", "launchpad_name", "launchpad"]),
        url: slug ? `https://cryptorank.io/price/${encodeURIComponent(slug)}` : "https://cryptorank.io/",
      };
    }).filter((v): v is VendaPublica => v !== null);

    cacheVendas = { em: Date.now(), vendas };
    return { vendas, atualizadoEm: new Date().toISOString(), fonte: "CryptoRank", configurado: true, aviso: null };
  } catch {
    return { vendas: cacheVendas?.vendas ?? [], atualizadoEm: cacheVendas ? new Date(cacheVendas.em).toISOString() : new Date().toISOString(), fonte: "CryptoRank", configurado: true, aviso: "Não foi possível conectar à CryptoRank agora." };
  }
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

/**
 * A Moralis encerrou em 31/07/2026 os endpoints REST de descoberta de tokens
 * Solana por launchpad (new/bonding/graduated). Não chamar o endpoint antigo:
 * uma API key comum não reativa essas rotas. A substituição documentada é o
 * template Token Bonding Status em Data Feeds, que exige pipeline e destino de
 * dados próprios. Mantemos a interface explícita até integrar essa nova fonte.
 */
export async function listarTokensBonding(): Promise<{
  tokens: TokenBonding[];
  atualizadoEm: string;
  fonte: string;
  configurado: boolean;
  aviso: string | null;
}> {
  return {
    tokens: [],
    atualizadoEm: new Date().toISOString(),
    fonte: "Moralis Data Feeds · Pump.fun",
    configurado: false,
    aviso: "A Moralis encerrou os endpoints REST de descoberta de bonding em 31/07/2026. Adicionar apenas MORALIS_API_KEY não resolve: é necessário integrar o template Token Bonding Status via Data Feeds e armazenar os eventos em uma base de dados. A aba permanece indisponível até essa integração.",
  };
}
