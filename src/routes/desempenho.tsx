import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { listarDesempenho, type Rede } from "@/lib/token-ai.functions";
import { idade, nomesRede, usd } from "@/lib/historico";

type Janela = "24h" | "48h" | "7d";

export const Route = createFileRoute("/desempenho")({
  head: () => ({
    meta: [
      { title: "Top desempenho de novos tokens — Token Guardian IA" },
      { name: "description", content: "Ranking dos tokens recentes com maior variação de preço em 24 horas, entre lançamentos das últimas 24h, 48h e 7 dias." },
      { property: "og:title", content: "Top desempenho de novos tokens" },
      { property: "og:description", content: "Compare tokens recém-lançados por faixa de idade e desempenho de mercado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Desempenho,
});

function Desempenho() {
  const fn = useServerFn(listarDesempenho);
  const q = useQuery({ queryKey: ["ranking-desempenho"], queryFn: () => fn(), refetchInterval: 60_000 });
  const [janela, setJanela] = useState<Janela>("7d");
  const [rede, setRede] = useState<string>("todas");
  const tokens = (q.data?.tokens ?? [])
    .filter((t) => t.idadeHoras !== null && t.idadeHoras <= (janela === "24h" ? 24 : janela === "48h" ? 48 : 168))
    .filter((t) => rede === "todas" || t.rede === rede)
    .sort((a, b) => (b.desempenho24h ?? -Infinity) - (a.desempenho24h ?? -Infinity))
    .slice(0, 10);

  return (
    <Shell status={<span className="font-mono text-muted-foreground">{q.isFetching ? "atualizando…" : q.data ? `Atualizado ${new Date(q.data.atualizadoEm).toLocaleTimeString("pt-BR")}` : "Dados ao vivo"}</span>}>
      <div className="mb-6">
        <div className="label-eyebrow mb-2">Performance de mercado</div>
        <h1 className="text-2xl font-semibold">Top 10 · tokens recém-lançados</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Veja quais tokens recentes lideram a variação de preço informada pelo mercado. O ranking é atualizado automaticamente a cada minuto.
        </p>
      </div>

      <section className="panel mb-5 p-4">
        <div className="mb-3 text-xs font-semibold text-card-foreground">Escolha a janela de lançamento</div>
        <div className="flex flex-wrap gap-2">
          {([
            ["24h", "Lançados nas últimas 24h"],
            ["48h", "Lançados nas últimas 48h"],
            ["7d", "Últimos 7 dias"],
          ] as [Janela, string][]).map(([value, label]) => (
            <button key={value} onClick={() => setJanela(value)} className={`rounded-md px-3 py-2 text-xs ring-1 ring-border ${janela === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-muted-foreground">Rede:</span>
          {["todas", ...Object.keys(nomesRede)].map((r) => (
            <button key={r} onClick={() => setRede(r)} className={`rounded-md px-3 py-1.5 text-xs ring-1 ring-border ${rede === r ? "bg-secondary text-card-foreground" : "text-muted-foreground"}`}>
              {r === "todas" ? "Todas" : nomesRede[r]}
            </button>
          ))}
          <button onClick={() => q.refetch()} className="ml-auto rounded-md px-3 py-1.5 text-xs text-signal ring-1 ring-border">Atualizar</button>
        </div>
      </section>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-sm font-semibold">{janela === "24h" ? "Destaques das últimas 24 horas" : janela === "48h" ? "Destaques dos últimos 2 dias" : "Lista de tokens da última semana"}</h2>
        <span className="text-xs text-muted-foreground">Top {tokens.length} por variação de preço em 24h</span>
      </div>

      {q.isPending && <p className="py-8 text-sm text-muted-foreground">Consultando tokens recentes e preços de mercado…</p>}
      {q.isError && <p className="py-4 text-sm text-danger">Não foi possível consultar o ranking agora. Tente novamente em instantes.</p>}
      {q.isSuccess && tokens.length === 0 && (
        <div className="panel p-6 text-sm text-muted-foreground">Não encontramos pares elegíveis nessa janela nos feeds públicos atuais. Tente outra janela ou rede.</div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tokens.map((t, i) => (
          <article key={t.rede + ":" + t.endereco} className="panel flex min-w-0 flex-col gap-3 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-sm text-muted-foreground">#{i + 1}</div>
              {t.icone && <img src={t.icone} alt="" className="h-9 w-9 shrink-0 rounded-full" loading="lazy" />}
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-card-foreground">{t.simbolo}</div>
                <div className="truncate text-xs text-muted-foreground">{t.nome}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{nomesRede[t.rede]} · lançado há {idade(t.mercado.criadoEm)}</div>
              </div>
              <div className={`shrink-0 rounded-md px-2 py-1 font-mono text-sm font-semibold ${t.desempenho24h === null ? "text-muted-foreground" : t.desempenho24h >= 0 ? "text-signal" : "text-danger"}`}>
                {t.desempenho24h === null ? "N/D" : `${t.desempenho24h > 0 ? "+" : ""}${t.desempenho24h.toFixed(2)}%`}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-y border-border py-3 text-[11px]">
              <div><div className="text-muted-foreground">Liquidez</div><div className="mt-1 font-mono">{usd(t.mercado.liquidezUsd)}</div></div>
              <div><div className="text-muted-foreground">Volume 24h</div><div className="mt-1 font-mono">{usd(t.mercado.volume24h)}</div></div>
              <div><div className="text-muted-foreground">FDV</div><div className="mt-1 font-mono">{usd(t.mercado.fdv)}</div></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <a href={t.mercado.url} target="_blank" rel="noreferrer" className="text-[11px] text-signal hover:underline">Ver mercado ↗</a>
              <Link to="/radar" search={{ rede: t.rede as Rede, endereco: t.endereco }} className="rounded-md bg-primary px-3 py-2 text-[11px] font-medium text-primary-foreground">Analisar segurança</Link>
            </div>
          </article>
        ))}
      </div>

      {q.data && (
        <div className="mt-5 rounded-md border border-border p-3 text-[11px] leading-relaxed text-muted-foreground">
          <div className="mb-1 font-medium text-card-foreground">Como ler este ranking</div>
          <p>O período de 24h, 48h ou 7 dias define a idade máxima do par, não o período de retorno mostrado. A coluna de desempenho é a variação móvel de preço nas últimas 24 horas reportada pelo DexScreener; não é o ganho acumulado desde o lançamento.</p>
          <p className="mt-2">{q.data.cobertura} Portanto, esta é uma lista dos candidatos disponíveis nessas fontes, não um histórico completo de todos os tokens criados na semana. Tokens promovidos podem ter visibilidade adicional, e variações extremas podem refletir baixa liquidez ou negociação irregular. Não é recomendação financeira.</p>
        </div>
      )}
    </Shell>
  );
}
