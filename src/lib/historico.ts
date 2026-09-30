import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { AnaliseReal } from "@/lib/token-ai.functions";

const KEY = "radar-ia-historico-v1";

function ler(): AnaliseReal[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as AnaliseReal[];
  } catch {
    return [];
  }
}

export function useUsuario() {
  const [user, setUser] = useState<User | null>(null);
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setPronto(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, pronto };
}

/** Histórico: no banco quando logado (persiste entre sessões), senão neste navegador. */
export function useHistorico() {
  const { user, pronto } = useUsuario();
  const [itens, setItens] = useState<AnaliseReal[]>([]);

  const carregar = useCallback(async () => {
    if (!user) return setItens(ler());
    const { data } = await supabase.from("analises").select("analise").order("gerado_em", { ascending: false }).limit(200);
    setItens((data ?? []).map((r) => r.analise as unknown as AnaliseReal));
  }, [user]);

  useEffect(() => { if (pronto) void carregar(); }, [pronto, carregar]);

  // Ao entrar, envia as análises locais para o banco.
  useEffect(() => {
    if (!user) return;
    const locais = ler();
    if (!locais.length) return;
    void supabase.from("analises").insert(locais.map((a) => linha(a, user.id))).then(({ error }) => {
      if (!error) { window.localStorage.removeItem(KEY); void carregar(); }
    });
  }, [user, carregar]);

  const salvar = useCallback(async (a: AnaliseReal) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("analises").insert(linha(a, data.user.id));
      setItens((l) => [a, ...l]);
      return;
    }
    const lista = [a, ...ler()].slice(0, 100);
    window.localStorage.setItem(KEY, JSON.stringify(lista));
    setItens(lista);
  }, []);

  const remover = useCallback(async (geradoEm: string) => {
    if (user) {
      await supabase.from("analises").delete().eq("gerado_em", geradoEm);
      setItens((l) => l.filter((i) => i.geradoEm !== geradoEm));
      return;
    }
    const lista = ler().filter((i) => i.geradoEm !== geradoEm);
    window.localStorage.setItem(KEY, JSON.stringify(lista));
    setItens(lista);
  }, [user]);

  return { itens, salvar, remover, logado: !!user };
}

function linha(a: AnaliseReal, userId: string) {
  return {
    user_id: userId,
    rede: a.dados.rede,
    endereco: a.dados.endereco,
    nome: a.dados.nome,
    simbolo: a.dados.simbolo,
    score: a.parecer?.score ?? null,
    analise: a as unknown as Json,
    gerado_em: a.geradoEm,
  };
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
