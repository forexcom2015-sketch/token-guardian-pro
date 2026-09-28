import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { cotacoesAoVivo, type Cotacao } from "@/lib/cotacao.functions";
import type { Rede } from "@/lib/token-ai.functions";

export const INTERVALO_MS = 20_000;

export function useCotacoes(itens: { rede: Rede; endereco: string }[]) {
  const fn = useServerFn(cotacoesAoVivo);
  const chave = itens.map((i) => i.endereco).sort().join(",");
  return useQuery({
    queryKey: ["cotacoes", chave],
    enabled: itens.length > 0,
    queryFn: () => fn({ data: { itens: itens.slice(0, 60) } }),
    refetchInterval: INTERVALO_MS,
  });
}

// Marca o valor quando ele muda para o usuário perceber a atualização.
export function useMudou(valor: number | null | undefined) {
  const ant = useRef(valor);
  const [dir, setDir] = useState<"sobe" | "desce" | null>(null);
  useEffect(() => {
    if (ant.current != null && valor != null && valor !== ant.current) {
      setDir(valor > ant.current ? "sobe" : "desce");
      const t = setTimeout(() => setDir(null), 2500);
      ant.current = valor;
      return () => clearTimeout(t);
    }
    ant.current = valor;
  }, [valor]);
  return dir;
}

export function ValorVivo({ valor, texto }: { valor: number | null | undefined; texto: string }) {
  const dir = useMudou(valor);
  const cor = dir === "sobe" ? "text-signal" : dir === "desce" ? "text-danger" : "text-card-foreground";
  return <span className={`font-mono transition-colors ${cor}`}>{texto}{dir === "sobe" ? " ▲" : dir === "desce" ? " ▼" : ""}</span>;
}

export function pct(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
}

export type { Cotacao };
