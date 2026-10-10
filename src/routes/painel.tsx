import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/shell";
import { SeloRisco } from "@/components/risco";
import { AlertaSeguranca } from "@/components/alerta-seguranca";
import { listarLancamentos } from "@/lib/token-ai.functions";
import { idade, linksToken, nomesRede, usd } from "@/lib/historico";

const corNivel = { baixo: "text-signal", medio: "text-warn", alto: "text-danger", desconhecido: "text-muted-foreground" } as const;

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel de risco — Radar.IA" },
      { name: "description", content: "Ranking ao vivo dos tokens em lançamento, ordenado do menor para o maior risco, atualizado a cada minuto." },
      { property: "og:title", content: "Painel de risco — Radar.IA" },
      { property: "og:description", content: "Ranking de lançamentos por risco, com dados do DexScreener e GoPlus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Painel,
});

function Painel() {
  const fn = useServerFn(listarLancamentos);
  const q = useQuery({ queryKey: ["lancamentos"], queryFn: () => fn(), refetchInterval: 60_000 });
  const tokens = q.data?.tokens ?? [];
  const n = (nv: string) => tokens.filter((t) => t.risco.nivel === nv).length;

  return (
    <Shell status={<span className="font-mono text-muted-foreground">{q.isFetching ? "atualizando…" : q.data ? `atualizado ${new Date(q.data.atualizadoEm).toLocaleTimeString("pt-BR")}` : "…"}</span>}>
      <div className="mb-6 flex flex-wrap items-end gap-6">
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold">Painel de risco</h1>
          <p className="text-xs text-muted-foreground">Atualiza a cada minuto. Nota 0–100: quanto menor, menos sinais de risco.</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-signal">{n("baixo")} menor risco</span>
          <span className="text-warn">{n("medio")} atenção</span>
          <span className="text-danger">{n("alto")} perigo</span>
        </div>
      </div>
      <AlertaSeguranca tokens={tokens} />
      {q.isError && <p className="text-sm text-danger">Não foi possível carregar agora.</p>}
      {q.isPending && <p className="text-sm text-muted-foreground">Coletando lançamentos e checagens de segurança…</p>}
      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tokens.map((t, i) => (
          <li key={t.rede + t.endereco} className="panel flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
              {t.icone && <img src={t.icone} alt="" className="h-7 w-7 rounded-full" loading="lazy" />}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-card-foreground">{t.simbolo} <span className="text-xs text-muted-foreground">· {nomesRede[t.rede]}</span></div>
                <div className="truncate text-[11px] text-muted-foreground">{t.nome}</div>
              </div>
              <SeloRisco risco={t.risco} />
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-muted-foreground">
              <span>Liq {usd(t.mercado.liquidezUsd)}</span>
              <span>Vol {usd(t.mercado.volume24h)}</span>
              <span>{idade(t.mercado.criadoEm)}</span>
            </div>
            <div className="flex items-baseline gap-3 font-mono text-[11px]">
              <span className="text-sm text-card-foreground">{t.mercado.precoUsd !== null ? `$${t.mercado.precoUsd < 0.01 ? t.mercado.precoUsd.toExponential(2) : t.mercado.precoUsd.toLocaleString("en-US", { maximumFractionDigits: 4 })}` : "—"}</span>
              {([["5m", t.mercado.variacao5m], ["1h", t.mercado.variacao1h], ["24h", t.mercado.variacao24h]] as const).map(([rotulo, v]) => (
                <span key={rotulo} className={v === null ? "text-muted-foreground" : v >= 0 ? "text-signal" : "text-danger"}>
                  {rotulo} {v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t.risco.alertas.length ? <span className="text-danger">Alertas: {t.risco.alertas.join(", ")}</span> : "Sem alertas graves"}
              {t.risco.desconhecidos > 0 && ` · ${t.risco.desconhecidos} itens sem dados`}
            </div>
            <details className="group text-[11px]">
              <summary className="cursor-pointer select-none text-muted-foreground hover:text-card-foreground">
                Nota {t.risco.nota}/100 — ver o que cada item contribui
              </summary>
              <ul className="mt-2 grid gap-1 border-t border-border pt-2">
                {[...t.risco.itens].sort((a, b) => b.pontos - a.pontos).map((item) => (
                  <li key={item.criterio} className="flex items-baseline gap-2">
                    <span className={`w-8 shrink-0 text-right font-mono ${item.pontos > 0 ? corNivel[item.nivel] : "text-muted-foreground"}`}>+{item.pontos}</span>
                    <span className="min-w-0">
                      <span className="text-card-foreground">{item.criterio}</span>
                      <span className="text-muted-foreground"> · {item.valor}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
            <div className="flex gap-3 text-[11px]">
              {linksToken(t.rede, t.endereco).map((l) => <a key={l.rotulo} href={l.url} target="_blank" rel="noreferrer" className="text-signal hover:underline">{l.rotulo}</a>)}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[11px] text-muted-foreground">Nota calculada só com dados reais do checklist. Não é recomendação de compra ou venda.</p>
    </Shell>
  );
}
