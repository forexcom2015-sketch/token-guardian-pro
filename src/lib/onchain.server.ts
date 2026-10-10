export type Rede = "solana" | "bsc" | "ethereum" | "base";

export const GOPLUS_CHAIN: Record<Exclude<Rede, "solana">, string> = {
  bsc: "56",
  ethereum: "1",
  base: "8453",
};

export type Checagem = {
  categoria: string;
  criterio: string;
  nivel: "baixo" | "medio" | "alto" | "desconhecido";
  valor: string;
};

export type ParMercado = {
  dex: string;
  parAddress: string | null;
  url: string;
  precoUsd: number | null;
  liquidezUsd: number | null;
  fdv: number | null;
  volume24h: number | null;
  compras24h: number | null;
  vendas24h: number | null;
  compras1h: number | null;
  vendas1h: number | null;
  variacao24h: number | null;
  variacao1h: number | null;
  variacao5m: number | null;
  criadoEm: number | null;
};

export type DadosToken = {
  rede: Rede;
  endereco: string;
  nome: string | null;
  simbolo: string | null;
  mercado: ParMercado | null;
  holders: number | null;
  top10Pct: number | null;
  checagens: Checagem[];
  fontes: string[];
};

type DexPair = {
  pairAddress?: string;
  dexId: string;
  url: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
  fdv?: number;
  volume?: { h24?: number };
  txns?: { h24?: { buys: number; sells: number }; h1?: { buys: number; sells: number } };
  priceChange?: { h24?: number; h1?: number; m5?: number };
  pairCreatedAt?: number;
};

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function paraPar(p: DexPair): ParMercado {
  return {
    dex: p.dexId,
    parAddress: p.pairAddress ?? null,
    url: p.url,
    precoUsd: p.priceUsd ? Number(p.priceUsd) : null,
    liquidezUsd: p.liquidity?.usd ?? null,
    fdv: p.fdv ?? null,
    volume24h: p.volume?.h24 ?? null,
    compras24h: p.txns?.h24?.buys ?? null,
    vendas24h: p.txns?.h24?.sells ?? null,
    compras1h: p.txns?.h1?.buys ?? null,
    vendas1h: p.txns?.h1?.sells ?? null,
    variacao24h: p.priceChange?.h24 ?? null,
    variacao1h: p.priceChange?.h1 ?? null,
    variacao5m: p.priceChange?.m5 ?? null,
    criadoEm: p.pairCreatedAt ?? null,
  };
}

export async function paresDex(rede: Rede, enderecos: string[]): Promise<Map<string, { par: ParMercado; nome: string; simbolo: string }>> {
  const mapa = new Map<string, { par: ParMercado; nome: string; simbolo: string }>();
  if (!enderecos.length) return mapa;
  const pares = await getJson<DexPair[]>(`https://api.dexscreener.com/tokens/v1/${rede}/${enderecos.slice(0, 30).join(",")}`);
  for (const p of pares ?? []) {
    const chave = p.baseToken.address.toLowerCase();
    const atual = mapa.get(chave);
    if (!atual || (p.liquidity?.usd ?? 0) > (atual.par.liquidezUsd ?? 0)) {
      mapa.set(chave, { par: paraPar(p), nome: p.baseToken.name, simbolo: p.baseToken.symbol });
    }
  }
  return mapa;
}

const sinal = (v: unknown): boolean | null => {
  if (v === "1" || v === 1 || v === true) return true;
  if (v === "0" || v === 0 || v === false) return false;
  return null;
};

function nivelTop10(pct: number | null): Checagem["nivel"] {
  if (pct === null) return "desconhecido";
  if (pct > 50) return "alto";
  if (pct > 25) return "medio";
  return "baixo";
}

type Holder = { percent?: string | number; is_locked?: number; address?: string; account?: string; tag?: string };

function somaTop10(holders: Holder[] | undefined, fator: number): number | null {
  if (!holders?.length) return null;
  const ignorar = /dead|0x0000000000000000000000000000000000000000/i;
  const lista = holders
    .filter((h) => !ignorar.test(h.address ?? h.account ?? "") && !h.is_locked)
    .slice(0, 10);
  if (!lista.length) return null;

  const percentuais = lista.map((h) => {
    const bruto = h.percent;
    if (bruto === undefined || bruto === null || (typeof bruto === "string" && bruto.trim() === "")) {
      return null;
    }
    const percentual = Number(bruto);
    return Number.isFinite(percentual) && percentual >= 0 ? percentual : null;
  });
  if (percentuais.some((percentual) => percentual === null)) return null;

  return Math.round(percentuais.reduce<number>((s, percentual) => s + percentual! * fator, 0) * 10) / 10;
}

type GoPlusMapa = Record<string, Record<string, unknown>>;

// Cache por token (10 min) — evita repetir checagens e o limite de requisições do GoPlus.
const cacheGoplus = new Map<string, { em: number; dado: Record<string, unknown> }>();
const TTL_GOPLUS = 10 * 60_000;
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function goplusSolanaUm(endereco: string): Promise<Record<string, unknown> | null> {
  const k = `solana:${endereco}`;
  const c = cacheGoplus.get(k);
  if (c && Date.now() - c.em < TTL_GOPLUS) return c.dado;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const r = await getJson<{ code?: number; result?: GoPlusMapa }>(
      `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${endereco}`,
    );
    const res = r?.result ?? {};
    const dado = res[endereco] ?? res[endereco.toLowerCase()] ?? Object.values(res)[0];
    if (dado) {
      cacheGoplus.set(k, { em: Date.now(), dado });
      return dado;
    }
    await espera(800 * (tentativa + 1));
  }
  return null;
}

async function goplusLote(rede: Rede, enderecos: string[]): Promise<GoPlusMapa> {
  if (!enderecos.length) return {};
  if (rede === "solana") {
    // O endpoint de Solana responde um token por chamada: fila com 3 em paralelo.
    const saida: GoPlusMapa = {};
    const fila = [...enderecos];
    await Promise.all(
      Array.from({ length: 3 }, async () => {
        for (let e = fila.shift(); e; e = fila.shift()) {
          const d = await goplusSolanaUm(e);
          if (d) saida[e] = d;
        }
      }),
    );
    return saida;
  }
  const r = await getJson<{ result?: GoPlusMapa }>(
    `https://api.gopluslabs.io/api/v1/token_security/${GOPLUS_CHAIN[rede]}?contract_addresses=${enderecos.join(",")}`,
  );
  return r?.result ?? {};
}

async function segurancaEvm(rede: Exclude<Rede, "solana">, endereco: string, pre?: GoPlusMapa) {
  const res = pre ?? (await goplusLote(rede, [endereco]));
  const d = res[endereco.toLowerCase()];
  if (!d) return null;
  const buy = Number(d["buy_tax"] ?? NaN) * 100;
  const sell = Number(d["sell_tax"] ?? NaN) * 100;
  const lp = (d["lp_holders"] as Holder[] | undefined) ?? [];
  const lpTravada = Math.round(lp.filter((h) => h.is_locked || /dead|0x0000/i.test(h.address ?? "")).reduce((s, h) => s + Number(h.percent ?? 0), 0) * 1000) / 10;
  const owner = String(d["owner_address"] ?? "");
  const renunciado = /^0x0+$|dead/i.test(owner);
  const taxaNivel = (t: number): Checagem["nivel"] => (isNaN(t) ? "desconhecido" : t > 10 ? "alto" : t > 5 ? "medio" : "baixo");
  const top10 = somaTop10(d["holders"] as Holder[], 100);
  const checagens: Checagem[] = [
    { categoria: "Liquidez e contrato", criterio: "Liquidez travada/queimada", nivel: lp.length ? (lpTravada >= 90 ? "baixo" : lpTravada >= 50 ? "medio" : "alto") : "desconhecido", valor: lp.length ? `${lpTravada}% do LP travado ou queimado` : "Sem dados de LP" },
    (() => {
      const v = sinal(d["is_open_source"]);
      return { categoria: "Liquidez e contrato", criterio: "Contrato verificado", nivel: v === null ? "desconhecido" : v ? "baixo" : "alto", valor: v === null ? "Sem informação" : v ? "Código aberto" : "Código não verificado" };
    })(),
    (() => {
      const h = sinal(d["is_honeypot"]);
      const s = sinal(d["cannot_sell_all"]);
      const nivel = h === true || s === true ? "alto" : h === false && s === false ? "baixo" : "desconhecido";
      const valor = h === true ? "Simulação indica honeypot" : s === true ? "Venda parcialmente bloqueada" : h === false && s === false ? "Venda simulada passou" : "Sem informação suficiente";
      return { categoria: "Liquidez e contrato", criterio: "Honeypot", nivel, valor };
    })(),
    (() => {
      const v = sinal(d["is_mintable"]);
      return { categoria: "Liquidez e contrato", criterio: "Mint oculto", nivel: v === null ? "desconhecido" : v ? "alto" : "baixo", valor: v === null ? "Sem informação" : v ? "Dono pode criar tokens" : "Sem função de mint" };
    })(),
    (() => {
      const b = sinal(d["is_blacklisted"]);
      const p = sinal(d["transfer_pausable"]);
      const nivel = b === true || p === true ? "alto" : b === false && p === false ? "baixo" : "desconhecido";
      const valor = [b === true && "blacklist", p === true && "pausa de transferências"].filter(Boolean).join(", ") || (b === false && p === false ? "Nenhuma" : "Sem informação suficiente");
      return { categoria: "Liquidez e contrato", criterio: "Blacklist / pausa", nivel, valor };
    })(),
    (() => {
      const hidden = sinal(d["hidden_owner"]);
      const takeover = sinal(d["can_take_back_ownership"]);
      const nivel = !owner ? "desconhecido" : /^0x0+$|dead/i.test(owner) ? "baixo" : hidden === true || takeover === true ? "alto" : hidden === false && takeover === false ? "medio" : "desconhecido";
      const valor = !owner ? "Sem informação do proprietário" : /^0x0+$|dead/i.test(owner) ? "Renunciado" : `Dono ativo ${owner.slice(0, 8)}…${hidden === true ? " (dono oculto)" : ""}`;
      return { categoria: "Liquidez e contrato", criterio: "Ownership", nivel, valor };
    })(),
    { categoria: "Tokenomics", criterio: "Taxa de compra", nivel: taxaNivel(buy), valor: isNaN(buy) ? "Sem informação" : `${buy.toFixed(1)}%` },
    { categoria: "Tokenomics", criterio: "Taxa de venda", nivel: taxaNivel(sell), valor: isNaN(sell) ? "Sem informação" : `${sell.toFixed(1)}%` },
    (() => {
      const v = sinal(d["slippage_modifiable"]);
      return { categoria: "Tokenomics", criterio: "Taxa alterável", nivel: v === null ? "desconhecido" : v ? "alto" : "baixo", valor: v === null ? "Sem informação" : v ? "Dono pode mudar taxas" : "Fixa" };
    })(),
    { categoria: "Distribuição do supply", criterio: "Concentração das 10 maiores contas", nivel: nivelTop10(top10), valor: top10 === null ? "Sem informação" : `${top10}% do supply` },
    (() => {
      const bruto = d["creator_percent"];
      const informado = bruto !== null && bruto !== undefined && !(typeof bruto === "string" && bruto.trim() === "");
      const numero = informado ? Number(bruto) : NaN;
      const v = Number.isFinite(numero) && numero >= 0 ? numero : null;
      return { categoria: "Distribuição do supply", criterio: "Carteira do criador", nivel: v === null ? "desconhecido" : v > 0.05 ? "alto" : "baixo", valor: v === null ? "Sem informação" : `${(v * 100).toFixed(1)}%` };
    })(),
    (() => {
      const v = sinal(d["honeypot_with_same_creator"]);
      return { categoria: "Sinais externos", criterio: "Histórico do criador", nivel: v === null ? "desconhecido" : v ? "alto" : "baixo", valor: v === null ? "Sem informação" : v ? "Criador já lançou honeypot" : "Sem honeypot anterior conhecido" };
    })(),
  ];
  return { checagens, holders: Number(d["holder_count"] ?? 0) || null, top10, nome: (d["token_name"] as string) ?? null, simbolo: (d["token_symbol"] as string) ?? null, fonte: "GoPlus Security" };
}

// RPC público da Solana: lê o mint direto na blockchain quando o GoPlus não cobre o token.
const cacheRpc = new Map<string, { em: number; dado: { mintAtivo: boolean | null; freezeAtivo: boolean | null; top10Pct: number | null; supply: number | null } }>();

async function solanaRpc(metodo: string, params: unknown[]): Promise<unknown> {
  try {
    const r = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: metodo, params }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    return ((await r.json()) as { result?: unknown }).result ?? null;
  } catch {
    return null;
  }
}

async function solanaOnChain(mint: string) {
  const c = cacheRpc.get(mint);
  if (c && Date.now() - c.em < TTL_GOPLUS) return c.dado;
  const [info, maiores] = await Promise.all([
    solanaRpc("getAccountInfo", [mint, { encoding: "jsonParsed" }]),
    solanaRpc("getTokenLargestAccounts", [mint]),
  ]);
  const parsed = (info as { value?: { data?: { parsed?: { info?: { mintAuthority?: string | null; freezeAuthority?: string | null; supply?: string; decimals?: number } } } } } | null)?.value?.data?.parsed?.info;
  const contas = ((maiores as { value?: { amount?: string; uiAmount?: number }[] } | null)?.value ?? []).filter((a) => Number(a.amount ?? 0) > 0);
  const supply = Number(parsed?.supply ?? 0);
  const top10Pct = supply > 0 && contas.length ? Math.round((contas.slice(0, 10).reduce((s, a) => s + Number(a.amount ?? 0), 0) / supply) * 1000) / 10 : null;
  const dado = {
    mintAtivo: parsed ? parsed.mintAuthority != null : null,
    freezeAtivo: parsed ? parsed.freezeAuthority != null : null,
    top10Pct,
    supply: supply || null,
  };
  cacheRpc.set(mint, { em: Date.now(), dado });
  return dado;
}

async function segurancaSolana(endereco: string, pre?: GoPlusMapa) {
  const res = pre ?? (await goplusLote("solana", [endereco]));
  const d = res[endereco];
  const onchain = await solanaOnChain(endereco);
  if (!d) {
    // GoPlus sem dados: pontua mesmo assim com o que a blockchain informa.
    if (onchain.mintAtivo === null && onchain.top10Pct === null) return null;
    const checagens: Checagem[] = [
      { categoria: "Liquidez e contrato", criterio: "Liquidez queimada/travada", nivel: "desconhecido", valor: "Sem dados (curva de bonding ou pool sem registro)" },
      { categoria: "Liquidez e contrato", criterio: "Mint authority", nivel: onchain.mintAtivo === null ? "desconhecido" : onchain.mintAtivo ? "alto" : "baixo", valor: onchain.mintAtivo === null ? "?" : onchain.mintAtivo ? "Ativa — podem criar tokens" : "Revogada" },
      { categoria: "Liquidez e contrato", criterio: "Freeze authority", nivel: onchain.freezeAtivo === null ? "desconhecido" : onchain.freezeAtivo ? "alto" : "baixo", valor: onchain.freezeAtivo === null ? "?" : onchain.freezeAtivo ? "Ativa — podem congelar carteiras (honeypot)" : "Revogada" },
      { categoria: "Distribuição do supply", criterio: "Top 10 carteiras", nivel: nivelTop10(onchain.top10Pct), valor: onchain.top10Pct === null ? "?" : `${onchain.top10Pct}% do supply` },
    ];
    return { checagens, holders: null, top10: onchain.top10Pct, nome: null, simbolo: null, fonte: "Solana RPC" };
  }
  const st = (k: string): boolean | null => sinal((d[k] as { status?: string } | undefined)?.status);
  const dex = (d["dex"] as { burn_percent?: number | null; tvl?: string }[] | undefined) ?? [];
  const principal = [...dex].sort((a, b) => Number(b.tvl ?? 0) - Number(a.tvl ?? 0))[0];
  const burn = principal?.burn_percent ?? null;
  const top10 = somaTop10(d["holders"] as Holder[], 100);
  const fee = d["transfer_fee"] as { fee_rate?: { fee_points?: string }[] } | undefined;
  const feePct = fee?.fee_rate?.[0]?.fee_points !== undefined ? Number(fee.fee_rate[0].fee_points) / 100 : null;
  const meta = d["metadata"] as { name?: string; symbol?: string } | undefined;
  const checagens: Checagem[] = [
    { categoria: "Liquidez e contrato", criterio: "Liquidez queimada/travada", nivel: burn === null ? "desconhecido" : burn >= 90 ? "baixo" : burn >= 50 ? "medio" : "alto", valor: burn === null ? "Sem dados (curva de bonding ou pool sem registro)" : `${burn}% do LP queimado` },
    { categoria: "Liquidez e contrato", criterio: "Mint authority", nivel: st("mintable") === null ? "desconhecido" : st("mintable") ? "alto" : "baixo", valor: st("mintable") === null ? "Sem informação" : st("mintable") ? "Ativa — podem criar tokens" : "Revogada" },
    { categoria: "Liquidez e contrato", criterio: "Freeze authority", nivel: st("freezable") === null ? "desconhecido" : st("freezable") ? "alto" : "baixo", valor: st("freezable") === null ? "Sem informação" : st("freezable") ? "Ativa — podem congelar carteiras" : "Revogada" },
    { categoria: "Liquidez e contrato", criterio: "Metadata alterável", nivel: st("metadata_mutable") === null ? "desconhecido" : st("metadata_mutable") ? "medio" : "baixo", valor: st("metadata_mutable") === null ? "Sem informação" : st("metadata_mutable") ? "Pode ser alterada" : "Imutável" },
    { categoria: "Liquidez e contrato", criterio: "Transfer hook / não transferível", nivel: ((d["transfer_hook"] as unknown[] | undefined)?.length || sinal(d["non_transferable"]) === true) ? "alto" : (sinal(d["non_transferable"]) === false && !(d["transfer_hook"] as unknown[] | undefined)?.length) ? "baixo" : "desconhecido", valor: (d["transfer_hook"] as unknown[] | undefined)?.length ? "Possui hook de transferência" : sinal(d["non_transferable"]) === true ? "Não transferível" : sinal(d["non_transferable"]) === false ? "Nenhum" : "Sem informação" },
    { categoria: "Tokenomics", criterio: "Taxa de transferência", nivel: feePct === null || Number.isNaN(feePct) ? "desconhecido" : feePct > 10 ? "alto" : feePct > 5 ? "medio" : "baixo", valor: feePct === null || Number.isNaN(feePct) ? "Sem informação" : `${feePct}%` },
    { categoria: "Distribuição do supply", criterio: "Concentração das 10 maiores contas", nivel: nivelTop10(top10), valor: top10 === null ? "Sem informação" : `${top10}% do supply` },
  ];
  return { checagens, holders: Number(d["holder_count"] ?? 0) || null, top10, nome: meta?.name ?? null, simbolo: meta?.symbol ?? null, fonte: "GoPlus Security" };
}

function checagensMercado(p: ParMercado): Checagem[] {
  const liq = p.liquidezUsd ?? 0;
  const razao = p.fdv && liq ? liq / p.fdv : null;
  return [
    p.liquidezUsd === null
      ? { categoria: "Liquidez e contrato", criterio: "Liquidez em USD", nivel: "desconhecido", valor: `Sem pool de liquidez ainda (${p.dex === "pumpfun" ? "na curva de bonding do pump.fun" : "DexScreener não informa"})` }
      : { categoria: "Liquidez e contrato", criterio: "Liquidez em USD", nivel: liq < 10000 ? "alto" : liq < 50000 ? "medio" : "baixo", valor: `$${Math.round(liq).toLocaleString("en-US")}${razao ? ` (${(razao * 100).toFixed(1)}% do FDV)` : ""}` },
    { categoria: "Comportamento on-chain", criterio: "Compras vs vendas (24h)", nivel: p.compras24h === null || p.vendas24h === null ? "desconhecido" : p.vendas24h === 0 && p.compras24h > 20 ? "medio" : "baixo", valor: p.compras24h === null || p.vendas24h === null ? "Sem dados de transações" : `${p.compras24h} compras / ${p.vendas24h} vendas${p.vendas24h === 0 && p.compras24h > 20 ? " — ausência de vendas observadas; verificar capacidade de venda" : ""}` },
    { categoria: "Comportamento on-chain", criterio: "Volume vs liquidez", nivel: p.volume24h === null || !liq ? "desconhecido" : p.volume24h / liq > 30 ? "medio" : "baixo", valor: p.volume24h === null ? "Sem dados de volume" : `Volume 24h ${Math.round(p.volume24h).toLocaleString("en-US")}` },
  ];
}

export type ItemNota = { criterio: string; categoria: string; valor: string; nivel: Checagem["nivel"]; pontos: number };
export type NotaRisco = { nota: number; nivel: "baixo" | "medio" | "alto"; altos: number; medios: number; desconhecidos: number; alertas: string[]; semSeguranca: boolean; cobertura: "completa" | "parcial" | "insuficiente"; itens: ItemNota[] };

const PONTOS: Record<Checagem["nivel"], number> = { alto: 15, medio: 6, desconhecido: 4, baixo: 0 };

/** Nota determinística 0-100 (maior = mais arriscado) a partir do checklist. */
export function notaRisco(checagens: Checagem[], semSeguranca: boolean): NotaRisco {
  const conta = (n: Checagem["nivel"]) => checagens.filter((c) => c.nivel === n).length;
  const altos = conta("alto"), medios = conta("medio"), desconhecidos = conta("desconhecido");
  const critico = checagens.some((c) => c.nivel === "alto" && /Honeypot|Freeze|Mint/i.test(c.criterio));
  const semDadosDeChecklist = checagens.length === 0;
  const semSegurancaEfetiva = semSeguranca || semDadosDeChecklist;
  let nota = altos * 15 + medios * 6 + desconhecidos * 4 + (semSegurancaEfetiva ? 50 : 0) + (critico ? 25 : 0);
  nota = Math.min(100, nota);
  const itens: ItemNota[] = checagens.map((c) => ({ criterio: c.criterio, categoria: c.categoria, valor: c.valor, nivel: c.nivel, pontos: PONTOS[c.nivel] }));
  if (critico) itens.push({ criterio: "Sinal crítico (honeypot/freeze/mint)", categoria: "Liquidez e contrato", valor: "Agravante aplicado à nota", nivel: "alto", pontos: 25 });
  if (semSegurancaEfetiva) itens.push({ criterio: "Sem checagem de segurança", categoria: "Liquidez e contrato", valor: semDadosDeChecklist ? "Nenhuma verificação disponível" : "Fonte de segurança não retornou dados", nivel: "desconhecido", pontos: 50 });
  const proporcaoDesconhecida = checagens.length ? desconhecidos / checagens.length : 1;
  const cobertura: NotaRisco["cobertura"] =
    semSegurancaEfetiva
      ? "insuficiente"
      : desconhecidos >= 3 || proporcaoDesconhecida >= 0.25
        ? "parcial"
        : "completa";
  return { nota, nivel: nota >= 50 ? "alto" : nota >= 20 ? "medio" : "baixo", altos, medios, desconhecidos, alertas: checagens.filter((c) => c.nivel === "alto").map((c) => c.criterio).slice(0, 3), semSeguranca: semSegurancaEfetiva, cobertura, itens };
}

export async function coletarDados(rede: Rede, endereco: string): Promise<DadosToken> {
  const [pares, seg] = await Promise.all([
    paresDex(rede, [endereco]),
    rede === "solana" ? segurancaSolana(endereco) : segurancaEvm(rede, endereco),
  ]);
  const dex = pares.get(endereco.toLowerCase());
  const checagens = [...(seg?.checagens ?? []), ...(dex ? checagensMercado(dex.par) : [])];
  return {
    rede,
    endereco,
    nome: dex?.nome ?? seg?.nome ?? null,
    simbolo: dex?.simbolo ?? seg?.simbolo ?? null,
    mercado: dex?.par ?? null,
    holders: seg?.holders ?? null,
    top10Pct: seg?.top10 ?? null,
    checagens,
    fontes: [dex && "DexScreener", seg?.fonte].filter(Boolean) as string[],
  };
}

type Perfil = { chainId: string; tokenAddress: string; icon?: string; description?: string };

let cacheLista: { em: number; chave: string; p: ReturnType<typeof lancamentosSemCache> } | null = null;

export function lancamentosRecentes(redes: Rede[]) {
  const chave = redes.join(",");
  if (cacheLista && cacheLista.chave === chave && Date.now() - cacheLista.em < 45_000) return cacheLista.p;
  const p = lancamentosSemCache(redes);
  cacheLista = { em: Date.now(), chave, p };
  p.catch(() => { cacheLista = null; });
  return p;
}

async function lancamentosSemCache(redes: Rede[]) {
  const [perfis, boosts] = await Promise.all([
    getJson<Perfil[]>("https://api.dexscreener.com/token-profiles/latest/v1"),
    getJson<Perfil[]>("https://api.dexscreener.com/token-boosts/latest/v1"),
  ]);
  const vistos = new Set<string>();
  const porRede = new Map<Rede, Perfil[]>();
  for (const p of [...(perfis ?? []), ...(boosts ?? [])]) {
    const rede = p.chainId as Rede;
    if (!redes.includes(rede)) continue;
    const k = `${rede}:${p.tokenAddress}`;
    if (vistos.has(k)) continue;
    vistos.add(k);
    porRede.set(rede, [...(porRede.get(rede) ?? []), p]);
  }
  const resultado: { rede: Rede; endereco: string; nome: string; simbolo: string; icone: string | null; descricao: string | null; mercado: ParMercado; risco: NotaRisco }[] = [];
  await Promise.all(
    [...porRede.entries()].map(async ([rede, lista]) => {
      const ends = lista.map((l) => l.tokenAddress).slice(0, 30);
      const [pares, gp] = await Promise.all([paresDex(rede, ends), goplusLote(rede, ends)]);
      for (const l of lista) {
        const d = pares.get(l.tokenAddress.toLowerCase());
        if (!d) continue;
        const seg = rede === "solana" ? await segurancaSolana(l.tokenAddress, gp) : await segurancaEvm(rede, l.tokenAddress, gp);
        const risco = notaRisco([...(seg?.checagens ?? []), ...checagensMercado(d.par)], !seg);
        resultado.push({ rede, endereco: l.tokenAddress, nome: d.nome, simbolo: d.simbolo, icone: l.icon ?? null, descricao: l.description ?? null, mercado: d.par, risco });
      }
    }),
  );
  return resultado
    .sort((a, b) => (b.mercado.criadoEm ?? 0) - (a.mercado.criadoEm ?? 0))
    .slice(0, 30)
    .sort((a, b) => a.risco.nota - b.risco.nota || (b.mercado.liquidezUsd ?? 0) - (a.mercado.liquidezUsd ?? 0));
}


export type TokenDesempenho = {
  rede: Rede;
  endereco: string;
  nome: string;
  simbolo: string;
  icone: string | null;
  mercado: ParMercado;
  desempenho24h: number | null;
  idadeHoras: number | null;
};

let cacheDesempenho: { em: number; resultado: TokenDesempenho[] } | null = null;

/**
 * Ranking dos candidatos recentes identificados nos feeds públicos do DexScreener.
 * A variação percentual é a janela móvel de 24h informada pelo DexScreener,
 * não o retorno acumulado desde o lançamento.
 */
export async function rankingDesempenho(): Promise<{ tokens: TokenDesempenho[]; atualizadoEm: string; cobertura: string }> {
  if (cacheDesempenho && Date.now() - cacheDesempenho.em < 60_000) {
    return { tokens: cacheDesempenho.resultado, atualizadoEm: new Date(cacheDesempenho.em).toISOString(), cobertura: "Perfis recentes e tokens promovidos disponíveis nos feeds públicos do DexScreener; não representa todos os pares criados." };
  }
  const redes: Rede[] = ["solana", "bsc", "ethereum", "base"];
  const [perfis, boosts] = await Promise.all([
    getJson<Perfil[]>("https://api.dexscreener.com/token-profiles/latest/v1"),
    getJson<Perfil[]>("https://api.dexscreener.com/token-boosts/latest/v1"),
  ]);
  const unicos = new Map<string, Perfil>();
  for (const p of [...(perfis ?? []), ...(boosts ?? [])]) {
    if (!redes.includes(p.chainId as Rede) || !p.tokenAddress) continue;
    unicos.set(`${p.chainId}:${p.tokenAddress.toLowerCase()}`, p);
  }
  const porRede = new Map<Rede, Perfil[]>();
  for (const p of unicos.values()) {
    const rede = p.chainId as Rede;
    porRede.set(rede, [...(porRede.get(rede) ?? []), p]);
  }
  const resultado: TokenDesempenho[] = [];
  await Promise.all([...porRede.entries()].map(async ([rede, lista]) => {
    const mapa = await paresDex(rede, lista.slice(0, 30).map((p) => p.tokenAddress));
    for (const p of lista.slice(0, 30)) {
      const token = mapa.get(p.tokenAddress.toLowerCase());
      if (!token || token.par.criadoEm === null) continue;
      const idadeHoras = (Date.now() - token.par.criadoEm) / 3_600_000;
      if (idadeHoras < 0 || idadeHoras > 7 * 24) continue;
      resultado.push({
        rede,
        endereco: p.tokenAddress,
        nome: token.nome,
        simbolo: token.simbolo,
        icone: p.icon ?? null,
        mercado: token.par,
        desempenho24h: token.par.variacao24h,
        idadeHoras: Math.floor(idadeHoras),
      });
    }
  }));
  resultado.sort((a, b) => (b.desempenho24h ?? -Infinity) - (a.desempenho24h ?? -Infinity));
  cacheDesempenho = { em: Date.now(), resultado };
  return { tokens: resultado, atualizadoEm: new Date().toISOString(), cobertura: "Perfis recentes e tokens promovidos disponíveis nos feeds públicos do DexScreener; não representa todos os pares criados." };
}
