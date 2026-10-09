import type { Rede } from "./onchain.server";

export type NivelAtividadeCarteiras = "baixo" | "moderado" | "alto" | "indeterminado";

export type EvidenciaCarteira = {
  endereco: string;
  operacoes: number;
  compras: number;
  vendas: number;
  primeiraOperacao: string | null;
  ultimaOperacao: string | null;
  operacoesEmMinuto: number;
};

export type AnaliseTransacoes = {
  fonte: string;
  poolAddress: string | null;
  analisadoEm: string;
  cobertura: "suficiente" | "parcial" | "insuficiente";
  nivel: NivelAtividadeCarteiras;
  score: number | null;
  transacoesAmostradas: number;
  carteirasUnicas: number;
  carteirasRepetidas: number;
  carteirasCompraramEVenderam: number;
  carteirasAltaFrequencia: number;
  percentualOperacoesDeCarteirasRepetidas: number | null;
  evidencias: EvidenciaCarteira[];
  observacao: string;
  limitacoes: string[];
};

type Trade = {
  attributes?: {
    tx_from_address?: string | null;
    kind?: string | null;
    block_timestamp?: string | null;
    volume_in_usd?: string | number | null;
    tx_hash?: string | null;
  };
};

const NETWORK: Record<Rede, string> = {
  solana: "solana",
  bsc: "bsc",
  ethereum: "eth",
  base: "base",
};

const CACHE_MS = 60_000;
const cache = new Map<string, { expires: number; result: AnaliseTransacoes }>();

const limitacoes = [
  "A amostra pública de trades não garante cobrir todas as operações do lançamento.",
  "O endereço de origem da transação pode ser um agregador, roteador ou executor, e não necessariamente a pessoa que controla os fundos.",
  "Esta fonte não informa de forma confiável quem financiou cada carteira; não atribui controle comum nem prova o uso de bots.",
  "Negociação repetida pode ser arbitragem ou market making legítimos; sinais são indícios para investigação.",
];

function indisponivel(poolAddress: string | null, motivo: string): AnaliseTransacoes {
  return {
    fonte: "GeckoTerminal Public API",
    poolAddress,
    analisadoEm: new Date().toISOString(),
    cobertura: "insuficiente",
    nivel: "indeterminado",
    score: null,
    transacoesAmostradas: 0,
    carteirasUnicas: 0,
    carteirasRepetidas: 0,
    carteirasCompraramEVenderam: 0,
    carteirasAltaFrequencia: 0,
    percentualOperacoesDeCarteirasRepetidas: null,
    evidencias: [],
    observacao: motivo,
    limitacoes,
  };
}

/**
 * Examina a amostra de trades do pool via API pública. A análise é heurística:
 * não tenta atribuir identidade real, financiamento comum ou intenção fraudulenta.
 */
export async function analisarTransacoesPool(rede: Rede, poolAddress: string | null): Promise<AnaliseTransacoes> {
  if (!poolAddress || !/^[a-zA-Z0-9]{20,100}$/.test(poolAddress)) {
    return indisponivel(poolAddress, "A fonte de mercado não informou um endereço de pool válido para consultar as transações individuais.");
  }

  const key = `${rede}:${poolAddress.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;

  const url = `https://api.geckoterminal.com/api/v2/networks/${NETWORK[rede]}/pools/${encodeURIComponent(poolAddress)}/trades?page=1&limit=300`;
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json;version=20230302" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      const result = indisponivel(poolAddress, response.status === 429
        ? "A API pública de transações atingiu o limite temporário de consultas. Tente novamente mais tarde."
        : `A API pública de transações não respondeu com sucesso (HTTP ${response.status}).`);
      if (response.status !== 429) cache.set(key, { expires: Date.now() + 15_000, result });
      return result;
    }

    const payload = await response.json() as { data?: Trade[] };
    const trades = (payload.data ?? []).map((trade) => {
      const a = trade.attributes ?? {};
      const address = a.tx_from_address?.trim().toLowerCase() ?? "";
      const kind = a.kind?.toLowerCase() ?? "";
      const time = a.block_timestamp ? Date.parse(a.block_timestamp) : NaN;
      return {
        address,
        kind,
        time: Number.isFinite(time) ? time : null,
      };
    }).filter((t) => t.address && (t.kind === "buy" || t.kind === "sell"));

    if (trades.length === 0) {
      const result = indisponivel(poolAddress, "A fonte não retornou trades com endereço de origem e tipo de operação legíveis; não é possível classificar o comportamento das carteiras.");
      cache.set(key, { expires: Date.now() + 30_000, result });
      return result;
    }

    const byWallet = new Map<string, { buys: number; sells: number; times: number[] }>();
    for (const trade of trades) {
      const wallet = byWallet.get(trade.address) ?? { buys: 0, sells: 0, times: [] };
      if (trade.kind === "buy") wallet.buys++;
      if (trade.kind === "sell") wallet.sells++;
      if (trade.time !== null) wallet.times.push(trade.time);
      byWallet.set(trade.address, wallet);
    }

    const evidence = [...byWallet.entries()].map(([address, wallet]) => {
      const times = wallet.times.sort((a, b) => a - b);
      let maxInMinute = 0;
      let left = 0;
      for (let right = 0; right < times.length; right++) {
        while (times[right]! - times[left]! > 60_000) left++;
        maxInMinute = Math.max(maxInMinute, right - left + 1);
      }
      return {
        endereco: address,
        operacoes: wallet.buys + wallet.sells,
        compras: wallet.buys,
        vendas: wallet.sells,
        primeiraOperacao: times.length ? new Date(times[0]!).toISOString() : null,
        ultimaOperacao: times.length ? new Date(times[times.length - 1]!).toISOString() : null,
        operacoesEmMinuto: maxInMinute,
      };
    }).sort((a, b) => b.operacoes - a.operacoes);

    const repeated = evidence.filter((w) => w.operacoes >= 3);
    const roundTrips = evidence.filter((w) => w.compras > 0 && w.vendas > 0);
    const highFrequency = evidence.filter((w) => w.operacoesEmMinuto >= 3);
    const repeatedOperations = repeated.reduce((sum, w) => sum + w.operacoes, 0);
    const repeatPct = Math.round((repeatedOperations / trades.length) * 1000) / 10;
    let score = 0;
    if (repeated.length >= 3 && repeated.length / evidence.length >= 0.1) score += 20;
    else if (repeated.length >= 2) score += 10;
    if (roundTrips.length >= 3 && roundTrips.length / evidence.length >= 0.1) score += 25;
    else if (roundTrips.length >= 1) score += 10;
    if (highFrequency.length >= 3) score += 25;
    else if (highFrequency.length >= 1) score += 10;
    if (repeatPct >= 60) score += 20;
    else if (repeatPct >= 35) score += 10;
    score = Math.min(100, score);

    const coverage: AnaliseTransacoes["cobertura"] = trades.length >= 30 && evidence.length >= 10 ? "suficiente" : trades.length >= 5 ? "parcial" : "insuficiente";
    const level: NivelAtividadeCarteiras = coverage === "insuficiente"
      ? "indeterminado"
      : score >= 50 ? "alto" : score >= 25 ? "moderado" : "baixo";

    const result: AnaliseTransacoes = {
      fonte: "GeckoTerminal Public API",
      poolAddress,
      analisadoEm: new Date().toISOString(),
      cobertura: coverage,
      nivel: level,
      score: coverage === "insuficiente" ? null : score,
      transacoesAmostradas: trades.length,
      carteirasUnicas: evidence.length,
      carteirasRepetidas: repeated.length,
      carteirasCompraramEVenderam: roundTrips.length,
      carteirasAltaFrequencia: highFrequency.length,
      percentualOperacoesDeCarteirasRepetidas: repeatPct,
      evidencias: evidence.slice(0, 10),
      observacao: coverage === "insuficiente"
        ? "A amostra de transações é pequena para classificar o comportamento das carteiras."
        : level === "alto"
          ? "A amostra contém vários padrões de repetição, compra/venda pela mesma origem ou alta frequência. Investigue as transações; isso não comprova bots ou manipulação."
          : level === "moderado"
            ? "Há padrões de repetição que merecem investigação, mas podem ter explicações legítimas."
            : "A amostra não mostrou concentração forte de padrões repetidos; isso não garante ausência de manipulação.",
      limitacoes,
    };
    cache.set(key, { expires: Date.now() + CACHE_MS, result });
    return result;
  } catch {
    return indisponivel(poolAddress, "Não foi possível consultar a API pública de trades neste momento. A análise agregada de mercado continua disponível.");
  }
}
