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
  url: string;
  precoUsd: number | null;
  liquidezUsd: number | null;
  fdv: number | null;
  volume24h: number | null;
  compras24h: number;
  vendas24h: number;
  compras1h: number;
  vendas1h: number;
  variacao24h: number | null;
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
  dexId: string;
  url: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
  fdv?: number;
  volume?: { h24?: number };
  txns?: { h24?: { buys: number; sells: number }; h1?: { buys: number; sells: number } };
  priceChange?: { h24?: number };
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
    url: p.url,
    precoUsd: p.priceUsd ? Number(p.priceUsd) : null,
    liquidezUsd: p.liquidity?.usd ?? null,
    fdv: p.fdv ?? null,
    volume24h: p.volume?.h24 ?? null,
    compras24h: p.txns?.h24?.buys ?? 0,
    vendas24h: p.txns?.h24?.sells ?? 0,
    compras1h: p.txns?.h1?.buys ?? 0,
    vendas1h: p.txns?.h1?.sells ?? 0,
    variacao24h: p.priceChange?.h24 ?? null,
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

const sim = (v: unknown) => v === "1" || v === 1;

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
  return Math.round(lista.reduce((s, h) => s + Number(h.percent ?? 0) * fator, 0) * 10) / 10;
}

type GoPlusMapa = Record<string, Record<string, unknown>>;

async function goplusLote(rede: Rede, enderecos: string[]): Promise<GoPlusMapa> {
  if (!enderecos.length) return {};
  const url = rede === "solana"
    ? `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${enderecos.join(",")}`
    : `https://api.gopluslabs.io/api/v1/token_security/${GOPLUS_CHAIN[rede]}?contract_addresses=${enderecos.join(",")}`;
  const r = await getJson<{ result?: GoPlusMapa }>(url);
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
  const renunciado = !owner || /^0x0+$|dead/i.test(owner);
  const taxaNivel = (t: number): Checagem["nivel"] => (isNaN(t) ? "desconhecido" : t > 10 ? "alto" : t > 5 ? "medio" : "baixo");
  const top10 = somaTop10(d["holders"] as Holder[], 100);
  const checagens: Checagem[] = [
    { categoria: "Liquidez e contrato", criterio: "Liquidez travada/queimada", nivel: lp.length ? (lpTravada >= 90 ? "baixo" : lpTravada >= 50 ? "medio" : "alto") : "desconhecido", valor: lp.length ? `${lpTravada}% do LP travado ou queimado` : "Sem dados de LP" },
    { categoria: "Liquidez e contrato", criterio: "Contrato verificado", nivel: sim(d["is_open_source"]) ? "baixo" : "alto", valor: sim(d["is_open_source"]) ? "Código aberto" : "Código não verificado" },
    { categoria: "Liquidez e contrato", criterio: "Honeypot", nivel: sim(d["is_honeypot"]) || sim(d["cannot_sell_all"]) ? "alto" : "baixo", valor: sim(d["is_honeypot"]) ? "Simulação indica honeypot" : "Venda simulada passou" },
    { categoria: "Liquidez e contrato", criterio: "Mint oculto", nivel: sim(d["is_mintable"]) ? "alto" : "baixo", valor: sim(d["is_mintable"]) ? "Dono pode criar tokens" : "Sem função de mint" },
    { categoria: "Liquidez e contrato", criterio: "Blacklist / pausa", nivel: sim(d["is_blacklisted"]) || sim(d["transfer_pausable"]) ? "alto" : "baixo", valor: [sim(d["is_blacklisted"]) && "blacklist", sim(d["transfer_pausable"]) && "pausa de transferências"].filter(Boolean).join(", ") || "Nenhuma" },
    { categoria: "Liquidez e contrato", criterio: "Ownership", nivel: renunciado ? "baixo" : sim(d["hidden_owner"]) || sim(d["can_take_back_ownership"]) ? "alto" : "medio", valor: renunciado ? "Renunciado" : `Dono ativo ${owner.slice(0, 8)}…${sim(d["hidden_owner"]) ? " (dono oculto)" : ""}` },
    { categoria: "Tokenomics", criterio: "Taxa de compra", nivel: taxaNivel(buy), valor: isNaN(buy) ? "?" : `${buy.toFixed(1)}%` },
    { categoria: "Tokenomics", criterio: "Taxa de venda", nivel: taxaNivel(sell), valor: isNaN(sell) ? "?" : `${sell.toFixed(1)}%` },
    { categoria: "Tokenomics", criterio: "Taxa alterável", nivel: sim(d["slippage_modifiable"]) ? "alto" : "baixo", valor: sim(d["slippage_modifiable"]) ? "Dono pode mudar taxas" : "Fixa" },
    { categoria: "Distribuição do supply", criterio: "Top 10 carteiras", nivel: nivelTop10(top10), valor: top10 === null ? "?" : `${top10}% do supply` },
    { categoria: "Distribuição do supply", criterio: "Carteira do criador", nivel: Number(d["creator_percent"] ?? 0) > 0.05 ? "alto" : "baixo", valor: `${(Number(d["creator_percent"] ?? 0) * 100).toFixed(1)}%` },
    { categoria: "Sinais externos", criterio: "Histórico do criador", nivel: sim(d["honeypot_with_same_creator"]) ? "alto" : "baixo", valor: sim(d["honeypot_with_same_creator"]) ? "Criador já lançou honeypot" : "Sem honeypot anterior conhecido" },
  ];
  return { checagens, holders: Number(d["holder_count"] ?? 0) || null, top10, nome: (d["token_name"] as string) ?? null, simbolo: (d["token_symbol"] as string) ?? null };
}

async function segurancaSolana(endereco: string, pre?: GoPlusMapa) {
  const res = pre ?? (await goplusLote("solana", [endereco]));
  const d = res[endereco];
  if (!d) return null;
  const st = (k: string) => sim((d[k] as { status?: string } | undefined)?.status);
  const dex = (d["dex"] as { burn_percent?: number | null; tvl?: string }[] | undefined) ?? [];
  const principal = [...dex].sort((a, b) => Number(b.tvl ?? 0) - Number(a.tvl ?? 0))[0];
  const burn = principal?.burn_percent ?? null;
  const top10 = somaTop10(d["holders"] as Holder[], 100);
  const fee = d["transfer_fee"] as { fee_rate?: { fee_points?: string }[] } | undefined;
  const feePct = fee?.fee_rate?.[0]?.fee_points ? Number(fee.fee_rate[0].fee_points) / 100 : 0;
  const meta = d["metadata"] as { name?: string; symbol?: string } | undefined;
  const checagens: Checagem[] = [
    { categoria: "Liquidez e contrato", criterio: "Liquidez queimada/travada", nivel: burn === null ? "desconhecido" : burn >= 90 ? "baixo" : burn >= 50 ? "medio" : "alto", valor: burn === null ? "Sem dados (curva de bonding ou pool sem registro)" : `${burn}% do LP queimado` },
    { categoria: "Liquidez e contrato", criterio: "Mint authority", nivel: st("mintable") ? "alto" : "baixo", valor: st("mintable") ? "Ativa — podem criar tokens" : "Revogada" },
    { categoria: "Liquidez e contrato", criterio: "Freeze authority", nivel: st("freezable") ? "alto" : "baixo", valor: st("freezable") ? "Ativa — podem congelar carteiras (honeypot)" : "Revogada" },
    { categoria: "Liquidez e contrato", criterio: "Metadata alterável", nivel: st("metadata_mutable") ? "medio" : "baixo", valor: st("metadata_mutable") ? "Pode ser alterada" : "Imutável" },
    { categoria: "Liquidez e contrato", criterio: "Transfer hook / não transferível", nivel: (d["transfer_hook"] as unknown[] | undefined)?.length || sim(d["non_transferable"]) ? "alto" : "baixo", valor: (d["transfer_hook"] as unknown[] | undefined)?.length ? "Possui hook de transferência" : "Nenhum" },
    { categoria: "Tokenomics", criterio: "Taxa de transferência", nivel: feePct > 10 ? "alto" : feePct > 5 ? "medio" : "baixo", valor: `${feePct}%` },
    { categoria: "Distribuição do supply", criterio: "Top 10 carteiras", nivel: nivelTop10(top10), valor: top10 === null ? "?" : `${top10}% do supply` },
  ];
  return { checagens, holders: Number(d["holder_count"] ?? 0) || null, top10, nome: meta?.name ?? null, simbolo: meta?.symbol ?? null };
}

function checagensMercado(p: ParMercado): Checagem[] {
  const liq = p.liquidezUsd ?? 0;
  const razao = p.fdv && liq ? liq / p.fdv : null;
  return [
    p.liquidezUsd === null
      ? { categoria: "Liquidez e contrato", criterio: "Liquidez em USD", nivel: "desconhecido", valor: `Sem pool de liquidez ainda (${p.dex === "pumpfun" ? "na curva de bonding do pump.fun" : "DexScreener não informa"})` }
      : { categoria: "Liquidez e contrato", criterio: "Liquidez em USD", nivel: liq < 10000 ? "alto" : liq < 50000 ? "medio" : "baixo", valor: `$${Math.round(liq).toLocaleString("en-US")}${razao ? ` (${(razao * 100).toFixed(1)}% do FDV)` : ""}` },
    { categoria: "Comportamento on-chain", criterio: "Compras vs vendas (24h)", nivel: p.vendas24h === 0 && p.compras24h > 20 ? "alto" : "baixo", valor: `${p.compras24h} compras / ${p.vendas24h} vendas${p.vendas24h === 0 && p.compras24h > 20 ? " — ninguém vende: possível honeypot" : ""}` },
    { categoria: "Comportamento on-chain", criterio: "Volume vs liquidez", nivel: p.volume24h && liq && p.volume24h / liq > 30 ? "medio" : "baixo", valor: `Volume 24h $${Math.round(p.volume24h ?? 0).toLocaleString("en-US")}` },
  ];
}

export type NotaRisco = { nota: number; nivel: "baixo" | "medio" | "alto"; altos: number; medios: number; desconhecidos: number; alertas: string[]; semSeguranca: boolean };

/** Nota determinística 0-100 (maior = mais arriscado) a partir do checklist. */
export function notaRisco(checagens: Checagem[], semSeguranca: boolean): NotaRisco {
  const conta = (n: Checagem["nivel"]) => checagens.filter((c) => c.nivel === n).length;
  const altos = conta("alto"), medios = conta("medio"), desconhecidos = conta("desconhecido");
  const critico = checagens.some((c) => c.nivel === "alto" && /Honeypot|Freeze|Mint/.test(c.criterio));
  let nota = altos * 15 + medios * 6 + desconhecidos * 4 + (semSeguranca ? 30 : 0) + (critico ? 25 : 0);
  nota = Math.min(100, nota);
  return { nota, nivel: nota >= 50 ? "alto" : nota >= 20 ? "medio" : "baixo", altos, medios, desconhecidos, alertas: checagens.filter((c) => c.nivel === "alto").map((c) => c.criterio).slice(0, 3), semSeguranca };
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
    fontes: [dex && "DexScreener", seg && "GoPlus Security"].filter(Boolean) as string[],
  };
}

type Perfil = { chainId: string; tokenAddress: string; icon?: string; description?: string };

export async function lancamentosRecentes(redes: Rede[]) {
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
