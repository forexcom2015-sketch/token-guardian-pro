import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { SeloRisco } from "@/components/risco";
import { analisarSegurancaPreLancamento, listarLancamentos, type Rede } from "@/lib/token-ai.functions";
import { idade, nomesRede, usd } from "@/lib/historico";

export const Route = createFileRoute("/lancamentos")({
  head: () => ({
    meta: [
      { title: "Pré-lançamentos e segurança — Token Guardian IA" },
      { name: "description", content: "Descubra tokens recém-listados e confira indicadores de segurança com dados do DexScreener, GoPlus Security e blockchain Solana." },
      { property: "og:title", content: "Pré-lançamentos e segurança — Token Guardian IA" },
      { property: "og:description", content: "Origem dos tokens, métricas de mercado e checklist de risco on-chain." },
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
  const [aberto, setAberto] = useState<string | null>(null);
  const tokens = (q.data?.tokens ?? []).filter((t) => filtro === "todas" || t.rede === filtro);

  return (
    <Shell status={<span className="font-mono text-muted-foreground">{q.isFetching ? "atualizando…" : "Atualização a cada 60s"}</span>}>
      <div className="mb-6">
        <div className="label-eyebrow mb-2">Radar de novos ativos</div>
        <h1 className="text-2xl font-semibold">Pré-lançamentos e tokens recém-listados</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Acompanhe tokens que acabaram de aparecer no radar público. Consulte a origem dos dados e abra o checklist de segurança de cada ativo antes de tirar conclusões.
        </p>
      </div>

      <section className="panel mb-6 p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-card-foreground">De onde vêm estes lançamentos?</h2>
        <div className="grid gap-4 text-xs sm:grid-cols-3">
          <div>
            <div className="mb-1 font-medium text-signal">01 · Descoberta</div>
            <p className="text-muted-foreground">DexScreener — endpoints públicos de perfis de tokens recentes e tokens recém-promovidos. São candidatos descobertos pela plataforma, não uma lista oficial de lançamentos futuros.</p>
          </div>
          <div>
            <div className="mb-1 font-medium text-signal">02 · Mercado</div>
            <p className="text-muted-foreground">DexScreener — pares e métricas disponíveis, como liquidez, FDV, volume, idade do par e atividade de compra/venda.</p>
          </div>
          <div>
            <div className="mb-1 font-medium text-signal">03 · Segurança</div>
            <p className="text-muted-foreground">GoPlus Security para indicadores do contrato; na Solana, também consultamos a RPC pública para algumas informações on-chain. Dados ausentes são marcados como desconhecidos.</p>
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-auto text-xs text-muted-foreground">{tokens.length} ativos na lista</span>
        {["todas", ...Object.keys(nomesRede)].map((r) => (
          <button key={r} onClick={() => setFiltro(r)} className={`rounded-md px-3 py-1.5 text-xs ring-1 ring-border ${filtro === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {r === "todas" ? "Todas as redes" : nomesRede[r]}
          </button>
        ))}
        <button onClick={() => q.refetch()} className="rounded-md px-3 py-1.5 text-xs text-signal ring-1 ring-border">Atualizar</button>
      </div>

      {q.isError && <p className="mb-4 text-sm text-danger">Não foi possível carregar os pré-lançamentos agora. Tente atualizar em instantes.</p>}
      {q.isPending && <p className="mb-4 text-sm text-muted-foreground">Buscando tokens recentes e indicadores de mercado…</p>}

      <div className="panel overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>{["Risco", "Token", "Rede", "Idade do par", "Liquidez", "FDV", "Volume 24h", "Compras/vendas 1h", "Var. 24h", "Detalhes"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-3 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tokens.map((t) => {
              const m = t.mercado;
              const id = t.rede + ":" + t.endereco;
              const expandido = aberto === id;
              return (
                <>
                  <tr key={id} className="hover:bg-secondary/40">
                    <td className="whitespace-nowrap px-3 py-3"><SeloRisco risco={t.risco} /></td>
                    <td className="px-3 py-3">
                      <div className="flex min-w-[150px] items-center gap-2">
                        {t.icone && <img src={t.icone} alt="" className="h-7 w-7 rounded-full" loading="lazy" />}
                        <div>
                          <div className="font-medium text-card-foreground">{t.simbolo}</div>
                          <div className="max-w-[180px] truncate text-muted-foreground">{t.nome}</div>
                          <a href={m.url} target="_blank" rel="noreferrer" className="text-[10px] text-signal underline">Ver par no DexScreener</a>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{nomesRede[t.rede]}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono">{idade(m.criadoEm)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono">{usd(m.liquidezUsd)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono">{usd(m.fdv)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono">{usd(m.volume24h)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono">{m.compras1h}/{m.vendas1h}</td>
                    <td className={`whitespace-nowrap px-3 py-3 font-mono ${(m.variacao24h ?? 0) >= 0 ? "text-signal" : "text-danger"}`}>{m.variacao24h ?? "—"}%</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <button onClick={() => setAberto(expandido ? null : id)} className="rounded-md px-3 py-1.5 text-signal ring-1 ring-border">
                        {expandido ? "Fechar" : "Ver segurança"}
                      </button>
                    </td>
                  </tr>
                  {expandido && (
                    <tr key={id + ":security"}>
                      <td colSpan={10} className="bg-secondary/20 p-4">
                        <DetalheSeguranca rede={t.rede} endereco={t.endereco} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {q.isSuccess && !tokens.length && <p className="p-5 text-xs text-muted-foreground">Nenhum token recente encontrado para esta rede neste momento.</p>}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        A pontuação vai de 0 a 100; quanto maior, maior o risco estimado. A lista pode incluir tokens que já começaram a negociar e não garante cobertura completa. Um resultado sem alertas não prova que um token é seguro: confirme endereço, liquidez, contrato, distribuição e fontes independentes. Conteúdo informativo, não é recomendação financeira.
      </p>
    </Shell>
  );
}

function DetalheSeguranca({ rede, endereco }: { rede: Rede; endereco: string }) {
  const fn = useServerFn(analisarSegurancaPreLancamento);
  const q = useQuery({
    queryKey: ["seguranca-pre-lancamento", rede, endereco],
    queryFn: () => fn({ data: { rede, endereco } }),
    staleTime: 60_000,
    retry: false,
  });

  if (q.isPending) return <p className="text-xs text-muted-foreground">Consultando indicadores de segurança…</p>;
  if (q.isError) return <p className="text-xs text-danger">{q.error.message || "Não foi possível consultar o checklist."}</p>;
  const { dados, risco } = q.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto">
          <h3 className="text-sm font-semibold text-card-foreground">Checklist de segurança · {dados.simbolo ?? "Token"}</h3>
          <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{endereco}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Fontes disponíveis: {dados.fontes.join(" + ") || "nenhuma fonte confirmada"} · consultado {new Date(q.data.geradoEm).toLocaleTimeString("pt-BR")}</p>
        </div>
        <div className="rounded-lg border border-border px-4 py-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Risco estimado</div>
          <div className={`mt-1 font-mono text-lg font-semibold ${risco.nivel === "alto" ? "text-danger" : risco.nivel === "medio" ? "text-warn" : "text-signal"}`}>{risco.nota}/100 · {risco.nivel === "alto" ? "Alto" : risco.nivel === "medio" ? "Moderado" : "Baixo"}</div>
          {risco.semSeguranca && <p className="mt-1 text-[10px] text-warn">Cobertura de segurança incompleta</p>}
        </div>
      </div>
      {risco.alertas.length > 0 && (
        <div className="rounded-md border border-danger/30 p-3">
          <div className="mb-1 text-xs font-semibold text-danger">Pontos de atenção</div>
          <p className="text-xs text-muted-foreground">{risco.alertas.join(" · ")}</p>
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {dados.checagens.map((c, i) => (
          <div key={c.criterio + i} className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${c.nivel === "alto" ? "bg-danger" : c.nivel === "medio" ? "bg-warn" : c.nivel === "baixo" ? "bg-signal" : "bg-muted-foreground"}`} />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.categoria}</div>
                <div className="mt-1 text-xs font-medium text-card-foreground">{c.criterio}</div>
                <div className="mt-1 break-words text-xs text-muted-foreground">{c.valor}</div>
                <div className={`mt-2 text-[10px] uppercase tracking-widest ${c.nivel === "alto" ? "text-danger" : c.nivel === "medio" ? "text-warn" : c.nivel === "baixo" ? "text-signal" : "text-muted-foreground"}`}>{c.nivel === "alto" ? "Alto risco" : c.nivel === "medio" ? "Atenção" : c.nivel === "baixo" ? "Sem alerta neste critério" : "Desconhecido"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to="/radar" search={{ rede, endereco }} className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">Abrir análise completa</Link>
        <a href={dados.mercado?.url} target="_blank" rel="noreferrer" className="rounded-md px-4 py-2 text-xs text-signal ring-1 ring-border">Conferir mercado externo</a>
      </div>
    </div>
  );
}
