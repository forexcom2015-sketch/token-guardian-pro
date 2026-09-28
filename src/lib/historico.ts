import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import type { AnaliseReal } from "@/lib/token-ai.functions";
import { useSessao } from "@/hooks/use-sessao";

export type AnaliseSalva = AnaliseReal & { id: string };

export function useHistorico() {
  const { user, pronto } = useSessao();
  const qc = useQueryClient();
  const chave = ["historico", user?.id];
  const q = useQuery({
    queryKey: chave,
    enabled: !!user,
    queryFn: async (): Promise<AnaliseSalva[]> => {
      const { data, error } = await supabase
        .from("analises")
        .select("id, analise")
        .order("gerado_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...(r.analise as unknown as AnaliseReal), id: r.id }));
    },
  });

  const salvar = useCallback(
    async (a: AnaliseReal) => {
      if (!user) return false;
      const { error } = await supabase.from("analises").insert({
        user_id: user.id,
        rede: a.dados.rede,
        endereco: a.dados.endereco,
        nome: a.dados.nome,
        simbolo: a.dados.simbolo,
        score: a.parecer?.score ?? null,
        analise: a as unknown as Json,
        gerado_em: a.geradoEm,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["historico"] });
      return true;
    },
    [user, qc],
  );

  const remover = useCallback(
    async (id: string) => {
      await supabase.from("analises").delete().eq("id", id);
      qc.invalidateQueries({ queryKey: ["historico"] });
    },
    [qc],
  );

  return { itens: q.data ?? [], carregando: !pronto || q.isLoading, logado: !!user, pronto, salvar, remover };
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
  const gecko: Record<string, string> = { solana: "solana", bsc: "bsc", ethereum: "eth", base: "base" };
  return [
    { rotulo: "DexScreener", url: `https://dexscreener.com/${rede}/${endereco}` },
    { rotulo: "GeckoTerminal", url: `https://www.geckoterminal.com/${gecko[rede]}/tokens/${endereco}` },
    { rotulo: "Explorer", url: explorer[rede] ?? "#" },
    { rotulo: "GoPlus", url: `https://gopluslabs.io/token-security/${rede === "solana" ? "solana" : { bsc: 56, ethereum: 1, base: 8453 }[rede]}/${endereco}` },
  ];
}
