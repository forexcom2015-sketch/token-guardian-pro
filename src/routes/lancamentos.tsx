import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { listarLancamentos } from "@/lib/token-ai.functions";
import { idade, nomesRede, usd } from "@/lib/historico";

export const Route = createFileRoute("/lancamentos")({
  head: () => ({
    meta: [
      { title: "Lançamentos ativos — Radar.IA" },
      { name: "description", content: "Tokens novos em Solana, BSC, Ethereum e Base direto do DexScreener, prontos para análise no Radar IA." },
      { property: "og:title", content: "Lançamentos ativos — Radar.IA" },
      { property: "og:description", content: "Veja tokens recém-lançados antes de analisar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lancamentos,
});

function Lancamentos() {
  const fn = useServerFn(listarLancamentos);
  const q = useQuery({ queryKey: ["lancamentos"], queryFn: () => fn(), refetchInterval: 60_000 });
  const [filtro, setFiltro] = useState<string>("todas");
  const tokens = (q.data?.tokens ?? []).filter((t) => filtro === "todas" || t.rede === filtro);

  return (
    <Shell status={<span className="font-mono text-muted-foreground">{q.isFetching ? "atualizando…" : "DexScreener · 60s"}</span>}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold">Lançamentos ativos</h1>
        {["todas", ...Object.keys(nomesRede)].map((r) => (
          <button key={r} onClick={() => setFiltro(r)} className={`rounded-md px-3 py-1 text-xs ring-1 ring-border ${filtro === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {r === "todas" ? "Todas" : nomesRede[r]}
          </button>
        ))}
        <button onClick={() => q.refetch()} className="rounded-md px-3 py-1 text-xs text-signal ring-1 ring-border">Atualizar</button>
      </div>
      {q.isError && <p className="text-sm text-danger">Não foi possível carregar os lançamentos agora.</p>}
      {q.isPending && <p className="text-sm text-muted-foreground">Carregando tokens novos…</p>}
      <div className="panel overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>{["Token", "Rede", "Idade", "Liquidez", "FDV", "Vol 24h", "Compras/Vendas 1h", "Var 24h", ""].map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tokens.map((t) => {
              const m = t.mercado;
              return (
                <tr key={t.rede + t.endereco} className="hover:bg-secondary/40">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {t.icone && <img src={t.icone} alt="" className="h-6 w-6 rounded-full" loading="lazy" />}
                      <div>
                        <div className="font-medium text-card-foreground">{t.simbolo}</div>
                        <div className="max-w-[180px] truncate text-muted-foreground">{t.nome}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{nomesRede[t.rede]}</td>
                  <td className="px-3 py-2 font-mono">{idade(m.criadoEm)}</td>
                  <td className="px-3 py-2 font-mono">{usd(m.liquidezUsd)}</td>
                  <td className="px-3 py-2 font-mono">{usd(m.fdv)}</td>
                  <td className="px-3 py-2 font-mono">{usd(m.volume24h)}</td>
                  <td className="px-3 py-2 font-mono">{m.compras1h}/{m.vendas1h}</td>
                  <td className={`px-3 py-2 font-mono ${(m.variacao24h ?? 0) >= 0 ? "text-signal" : "text-danger"}`}>{m.variacao24h ?? "—"}%</td>
                  <td className="px-3 py-2 text-right">
                    <Link to="/radar" search={{ rede: t.rede, endereco: t.endereco }} className="rounded-md bg-primary px-3 py-1 text-primary-foreground">Analisar</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {q.isSuccess && !tokens.length && <p className="p-4 text-xs text-muted-foreground">Nenhum token novo nessa rede agora.</p>}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">Tokens novos são os de maior risco. Lista informativa, não é recomendação.</p>
    </Shell>
  );
}
