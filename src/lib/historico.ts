import { useCallback, useEffect, useState } from "react";
import type { AnaliseReal } from "@/lib/token-ai.functions";

const KEY = "radar-ia-historico-v1";

function ler(): AnaliseReal[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as AnaliseReal[];
  } catch {
    return [];
  }
}

export function useHistorico() {
  const [itens, setItens] = useState<AnaliseReal[]>([]);
  useEffect(() => setItens(ler()), []);

  const salvar = useCallback((a: AnaliseReal) => {
    const lista = [a, ...ler()].slice(0, 100);
    window.localStorage.setItem(KEY, JSON.stringify(lista));
    setItens(lista);
  }, []);

  const remover = useCallback((geradoEm: string) => {
    const lista = ler().filter((i) => i.geradoEm !== geradoEm);
    window.localStorage.setItem(KEY, JSON.stringify(lista));
    setItens(lista);
  }, []);

  return { itens, salvar, remover };
}

export const nomesRede: Record<string, string> = { solana: "Solana", bsc: "BSC", ethereum: "Ethereum", base: "Base" };

export function usd(v: number | null | undefined) {
  if (v == null) return "—";
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(v < 1 ? 6 : 2)}`;
}

export function idade(ts: number | null | undefined) {
  if (!ts) return "—";
  const min = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 1440)} d`;
}

export function linksToken(rede: string, endereco: string) {
  const explorer: Record<string, string> = {
    solana: `https://solscan.io/token/${endereco}`,
    bsc: `https://bscscan.com/token/${endereco}`,
    ethereum: `https://etherscan.io/token/${endereco}`,
    base: `https://basescan.org/token/${endereco}`,
  };
  return [
    { rotulo: "DexScreener", url: `https://dexscreener.com/${rede}/${endereco}` },
    { rotulo: "Explorer", url: explorer[rede] ?? "#" },
    { rotulo: "GoPlus", url: `https://gopluslabs.io/token-security/${rede === "solana" ? "solana" : { bsc: 56, ethereum: 1, base: 8453 }[rede]}/${endereco}` },
  ];
}
