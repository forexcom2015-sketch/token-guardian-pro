import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import {
  listarLancamentosPreLancamento,
  listarPoolsPreLancamento,
  listarTokensRecentesPreLancamento,
} from "@/lib/pre-lancamentos.functions";

export const Route = createFileRoute("/pre-lancamentos")({
  head: () => ({
    meta: [
      { title: "Radar de Lançamentos — Token Guardian IA" },
      { name: "description", content: "Radar público de tokens e pools recém-detectados, sem dependência de API paga." },
      { property: "og:title", content: "Radar de Lançamentos — Token Guardian IA" },
      { property: "og:description", content: "GeckoTerminal, DEX Screener e Pump.fun em um único radar de descoberta." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PreLancamentos,
});

type Categoria = "radar" | "pools" | "tokens";

const nomeRede: Record<string, string> = {
  solana: "Solana",
  eth: "Ethereum",
  bsc: "BNB Chain",
  base: "Base",
  polygon_pos: "Polygon",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  avalanche: "Avalanche",
};

function moeda(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return v < 0.01
    ? v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 8 })
    : v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function dataHora(v: string | null): string {
  if (!v) return "Não informada";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "Não informada" : d.toLocaleString("pt-BR");
}

function idade(v: string | null): string {
  if (!v) return "—";
  const ms = Date.now() - new Date(v).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const minutos = Math.floor(ms / 60_000);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 48) return `${horas} h`;
  return `${Math.floor(horas / 24)} dias`;
}

function PreLancamentos() {
  const carregarRadar = useServerFn(listarLancamentosPreLancamento);
  const carregarPools = useServerFn(listarPoolsPreLancamento);
  const carregarTokens = useServerFn(listarTokensRecentesPreLancamento);
  const [categoria, setCategoria] = useState<Categoria>("radar");
  const [rede, setRede] = useState("todas");
  const [minLiquidez, setMinLiquidez] = useState("0");

  const radar = useQuery({
    queryKey: ["lancamentos", "radar-publico"],
    queryFn: () => carregarRadar(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });

  const pools = useQuery({
    queryKey: ["lancamentos", "geckoterminal"],
    queryFn: () => carregarPools(),
    enabled: categoria === "pools",
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });

  const tokens = useQuery({
    queryKey: ["lancamentos", "tokens-publicos"],
    queryFn: () => carregarTokens(),
    enabled: categoria === "tokens",
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });

  const poolsFiltradas = useMemo(() => (pools.data?.pools ?? []).filter((p) =>
    (rede === "todas" || p.rede === rede) &&
    (p.liquidezUsd ?? 0) >= Number(minLiquidez)
  ), [pools.data?.pools, rede, minLiquidez]);

  const radarItens = useMemo(() => (radar.data?.lancamentos ?? []).filter((item) =>
    rede === "todas" || item.rede === rede
  ), [radar.data?.lancamentos, rede]);

  return (
    <Shell status={<span className="font-mono text-muted-foreground">{radar.isFetching ? "atualizando…" : "Radar · atualização a cada 60s"}</span>}>
      <div className="mb-6">
        <div className="label-eyebrow mb-2">Inteligência de descoberta</div>
        <h1 className="text-2xl font-semibold">Radar de Lançamentos</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Descoberta automática baseada em fontes públicas: pools recém-criadas no GeckoTerminal, tokens indexados pelo DEX Screener e tokens recém-criados no Pump.fun. Sem CryptoRank, Moralis ou chave de API obrigatória.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <button onClick={() => setCategoria("radar")} className={`rounded-lg border p-4 text-left transition-colors ${categoria === "radar" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"}`}>
          <div className="text-xs font-medium text-muted-foreground">VISÃO GERAL</div>
          <div className="mt-1 font-semibold text-card-foreground">Radar consolidado</div>
          <p className="mt-1 text-xs text-muted-foreground">Cruza todas as fontes públicas</p>
        </button>
        <button onClick={() => setCategoria("pools")} className={`rounded-lg border p-4 text-left transition-colors ${categoria === "pools" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"}`}>
          <div className="text-xs font-medium text-muted-foreground">ON-CHAIN</div>
          <div className="mt-1 font-semibold text-card-foreground">Pools novas</div>
          <p className="mt-1 text-xs text-muted-foreground">GeckoTerminal · liquidez e volume</p>
        </button>
        <button onClick={() => setCategoria("tokens")} className={`rounded-lg border p-4 text-left transition-colors ${categoria === "tokens" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"}`}>
          <div className="text-xs font-medium text-muted-foreground">DESCOBERTA</div>
          <div className="mt-1 font-semibold text-card-foreground">Tokens recentes</div>
          <p className="mt-1 text-xs text-muted-foreground">DEX Screener + Pump.fun</p>
        </button>
      </div>

      {(categoria === "radar" || categoria === "pools") && (
        <section className="panel mb-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="mr-auto">
              <h2 className="font-semibold text-card-foreground">{categoria === "radar" ? "Radar consolidado" : "Pools recém-criadas"}</h2>
              <p className="mt-1 text-xs text-muted-foreground">Dados públicos, com cache no servidor para reduzir chamadas e respeitar limites das fontes.</p>
            </div>
            <button onClick={() => categoria === "radar" ? radar.refetch() : pools.refetch()} className="rounded-md border border-border px-3 py-2 text-xs text-card-foreground">Atualizar agora</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Rede
              <select value={rede} onChange={(e) => setRede(e.target.value)} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-card-foreground">
                <option value="todas">Todas as redes</option>
                {Array.from(new Set((pools.data?.pools ?? []).map((p) => p.rede))).sort().map((r) => <option key={r} value={r}>{nomeRede[r] ?? r}</option>)}
              </select>
            </label>
            {categoria === "pools" && (
              <label className="text-xs text-muted-foreground">
                Liquidez mínima
                <select value={minLiquidez} onChange={(e) => setMinLiquidez(e.target.value)} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-card-foreground">
                  <option value="0">Sem mínimo</option>
                  <option value="1000">US$ 1.000</option>
                  <option value="5000">US$ 5.000</option>
                  <option value="10000">US$ 10.000</option>
                  <option value="50000">US$ 50.000</option>
                  <option value="100000">US$ 100.000</option>
                </select>
              </label>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{categoria === "radar" ? radarItens.length : poolsFiltradas.length} registros</span>
            <span>·</span>
            <span>Última resposta: {dataHora(categoria === "radar" ? radar.data?.atualizadoEm ?? null : pools.data?.atualizadoEm ?? null)}</span>
          </div>
        </section>
      )}

      {(radar.isError || pools.isError || tokens.isError) && (
        <p className="mb-4 rounded-md border border-danger/30 p-3 text-sm text-danger">Não foi possível carregar uma das fontes públicas. Tente novamente em instantes.</p>
      )}

      {(radar.data?.aviso || pools.data?.aviso || tokens.data?.aviso) && (
        <p className="mb-4 rounded-md border border-border p-3 text-sm text-muted-foreground">{radar.data?.aviso ?? pools.data?.aviso ?? tokens.data?.aviso}</p>
      )}

      {categoria === "radar" && (
        <div className="grid gap-3">
          {radarItens.map((item) => (
            <article key={item.id} className="panel p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="mr-auto min-w-0">
                  <div className="font-semibold text-card-foreground">{item.projeto}{item.simbolo ? ` (${item.simbolo})` : ""}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{nomeRede[item.rede] ?? item.rede} · {item.estagio} · {idade(item.criadoEm)}</div>
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" className="rounded-md border border-border px-3 py-2 text-xs text-signal underline">Abrir fonte</a>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">{item.sinal}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Liquidez</div><div className="mt-1 font-mono text-sm">{moeda(item.liquidezUsd)}</div></div>
                <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Volume 24h</div><div className="mt-1 font-mono text-sm">{moeda(item.volume24hUsd)}</div></div>
                <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">FDV</div><div className="mt-1 font-mono text-sm">{moeda(item.fdvUsd)}</div></div>
              </div>
              <div className="mt-3 break-all text-[10px] text-muted-foreground">Contrato / pool: {item.endereco}</div>
            </article>
          ))}
          {radar.isSuccess && radarItens.length === 0 && <p className="panel p-5 text-sm text-muted-foreground">Nenhum lançamento detectado para o filtro atual.</p>}
        </div>
      )}

      {categoria === "pools" && (
        <div className="grid gap-3">
          {poolsFiltradas.map((p) => (
            <article key={p.rede + ":" + p.enderecoPool} className="panel p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="mr-auto min-w-0">
                  <div className="font-semibold text-card-foreground">{p.nome}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{nomeRede[p.rede] ?? p.rede} · {idade(p.criadoEm)} · Base: {p.tokenBase} / Quote: {p.tokenQuote}</div>
                </div>
                <a href={p.url} target="_blank" rel="noreferrer" className="rounded-md border border-border px-3 py-2 text-xs text-signal underline">Abrir fonte</a>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Preço base</div><div className="mt-1 font-mono text-sm">{moeda(p.precoUsd)}</div></div>
                <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Liquidez</div><div className="mt-1 font-mono text-sm">{moeda(p.liquidezUsd)}</div></div>
                <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Volume 24h</div><div className="mt-1 font-mono text-sm">{moeda(p.volume24hUsd)}</div></div>
                <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Compras / vendas</div><div className="mt-1 font-mono text-sm">{p.compras24h ?? "—"} / {p.vendas24h ?? "—"}</div></div>
              </div>
              <div className="mt-3 break-all text-[10px] text-muted-foreground">Pool: {p.enderecoPool}</div>
              <div className="mt-2 text-[11px] text-muted-foreground">Criada em: {dataHora(p.criadoEm)} · FDV: {moeda(p.fdvUsd)}</div>
            </article>
          ))}
          {pools.isSuccess && poolsFiltradas.length === 0 && <p className="panel p-5 text-sm text-muted-foreground">Nenhuma pool corresponde aos filtros no retorno atual.</p>}
        </div>
      )}

      {categoria === "tokens" && (
        <section className="max-w-5xl">
          <div className="panel mb-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-start gap-3">
              <div className="mr-auto">
                <div className="text-xs font-medium text-muted-foreground">FONTES PÚBLICAS</div>
                <h2 className="mt-1 font-semibold text-card-foreground">Tokens recém-detectados</h2>
                <p className="mt-1 text-sm text-muted-foreground">DEX Screener indexa dados diretamente das blockchains que acompanha; Pump.fun fornece um feed público de tokens recém-criados. citeturn2search3turn2search5</p>
              </div>
              <button onClick={() => tokens.refetch()} className="rounded-md border border-border px-3 py-2 text-xs text-card-foreground">Atualizar agora</button>
            </div>
          </div>
          <div className="grid gap-3">
            {(tokens.data?.tokens ?? []).map((t) => (
              <article key={t.id} className="panel p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="mr-auto min-w-0">
                    <div className="font-semibold text-card-foreground">{t.nome}{t.simbolo ? ` (${t.simbolo})` : ""}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{nomeRede[t.rede] ?? t.rede} · {idade(t.criadoEm)} · {t.fonte}</div>
                  </div>
                  <a href={t.url} target="_blank" rel="noreferrer" className="rounded-md border border-border px-3 py-2 text-xs text-signal underline">Abrir fonte</a>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Preço USD</div><div className="mt-1 font-mono text-sm">{moeda(t.precoUsd)}</div></div>
                  <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Liquidez</div><div className="mt-1 font-mono text-sm">{moeda(t.liquidezUsd)}</div></div>
                  <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Volume 24h</div><div className="mt-1 font-mono text-sm">{moeda(t.volume24hUsd)}</div></div>
                  <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">FDV / Market Cap</div><div className="mt-1 font-mono text-sm">{moeda(t.fdvUsd ?? t.marketCapUsd)}</div></div>
                </div>
                <div className="mt-3 break-all text-[10px] text-muted-foreground">Contrato: {t.endereco}</div>
              </article>
            ))}
          </div>
          {tokens.isSuccess && (tokens.data?.tokens ?? []).length === 0 && <p className="panel p-5 text-sm text-muted-foreground">Nenhum token recente retornado pelas fontes públicas.</p>}
        </section>
      )}

      <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
        O radar indica descoberta e atividade pública; não comprova legitimidade, segurança ou potencial de investimento. As APIs públicas possuem limites de requisição e podem mudar. O módulo usa cache e degradação graciosa quando uma fonte fica indisponível. citeturn0search0turn2search0
      </p>
    </Shell>
  );
}
