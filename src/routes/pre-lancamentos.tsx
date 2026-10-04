import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { listarPoolsPreLancamento, listarVendasPreLancamento } from "@/lib/pre-lancamentos.functions";

export const Route = createFileRoute("/pre-lancamentos")({
  head: () => ({
    meta: [
      { title: "Pré-lançamentos — Token Guardian IA" },
      { name: "description", content: "Descoberta de pools novas e acompanhamento de tokens antes da negociação." },
      { property: "og:title", content: "Pré-lançamentos — Token Guardian IA" },
      { property: "og:description", content: "Pools novas, curvas de bonding e vendas de tokens em áreas separadas." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PreLancamentos,
});

type Categoria = "pools" | "bonding" | "vendas";

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
  const carregar = useServerFn(listarPoolsPreLancamento);
  const carregarVendas = useServerFn(listarVendasPreLancamento);
  const [categoria, setCategoria] = useState<Categoria>("pools");
  const [rede, setRede] = useState("todas");
  const [minLiquidez, setMinLiquidez] = useState("0");
  const consultaVendas = useQuery({
    queryKey: ["pre-lancamentos", "cryptorank-public-sales"],
    queryFn: () => carregarVendas(),
    enabled: categoria === "vendas",
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
    retry: 1,
  });
  const consulta = useQuery({
    queryKey: ["pre-lancamentos", "geckoterminal-new-pools"],
    queryFn: () => carregar(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
  const pools = consulta.data?.pools ?? [];
  const filtradas = useMemo(() => pools.filter((p) =>
    (rede === "todas" || p.rede === rede) &&
    (p.liquidezUsd ?? 0) >= Number(minLiquidez)
  ), [pools, rede, minLiquidez]);

  return (
    <Shell status={<span className="font-mono text-muted-foreground">{consulta.isFetching ? "atualizando…" : "Feed · atualização a cada 60s"}</span>}>
      <div className="mb-6">
        <div className="label-eyebrow mb-2">Descoberta antecipada</div>
        <h1 className="text-2xl font-semibold">Pré-lançamentos</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Três estágios diferentes, apresentados separadamente: pools recém-criadas, tokens ainda em curvas de bonding e vendas antes do TGE. Uma pool nova já pode ter negociação e não é, por si só, um pré-lançamento.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <button onClick={() => setCategoria("pools")} className={`rounded-lg border p-4 text-left transition-colors ${categoria === "pools" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"}`}>
          <div className="text-xs font-medium text-muted-foreground">ESTÁGIO 1</div>
          <div className="mt-1 font-semibold text-card-foreground">Pools novas</div>
          <p className="mt-1 text-xs text-muted-foreground">Liquidez detectada · GeckoTerminal</p>
        </button>
        <button onClick={() => setCategoria("bonding")} className={`rounded-lg border p-4 text-left transition-colors ${categoria === "bonding" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"}`}>
          <div className="text-xs font-medium text-muted-foreground">ESTÁGIO 2</div>
          <div className="mt-1 font-semibold text-card-foreground">Curva de bonding</div>
          <p className="mt-1 text-xs text-muted-foreground">Antes da pool · integração futura</p>
        </button>
        <button onClick={() => setCategoria("vendas")} className={`rounded-lg border p-4 text-left transition-colors ${categoria === "vendas" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"}`}>
          <div className="text-xs font-medium text-muted-foreground">ESTÁGIO 3</div>
          <div className="mt-1 font-semibold text-card-foreground">Vendas de tokens</div>
          <p className="mt-1 text-xs text-muted-foreground">ICO, IDO, IEO e presales</p>
        </button>
      </div>

      {categoria === "pools" && (
        <>
          <section className="panel mb-5 p-4 sm:p-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="mr-auto">
                <h2 className="font-semibold text-card-foreground">Pools recém-criadas</h2>
                <p className="mt-1 text-xs text-muted-foreground">Fonte: GeckoTerminal · endpoint público de novas pools · cache no servidor de 45 segundos.</p>
              </div>
              <button onClick={() => consulta.refetch()} className="rounded-md border border-border px-3 py-2 text-xs text-card-foreground">Atualizar agora</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Rede
                <select value={rede} onChange={(e) => setRede(e.target.value)} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-card-foreground">
                  <option value="todas">Todas as redes</option>
                  {Array.from(new Set(pools.map((p) => p.rede))).sort().map((r) => <option key={r} value={r}>{nomeRede[r] ?? r}</option>)}
                </select>
              </label>
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
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>{filtradas.length} pools no filtro</span>
              <span>·</span>
              <span>Última resposta: {consulta.data ? dataHora(consulta.data.atualizadoEm) : "aguardando"}</span>
            </div>
          </section>

          {consulta.isError && <p className="mb-4 rounded-md border border-danger/30 p-3 text-sm text-danger">Não foi possível carregar o feed. Verifique novamente em instantes.</p>}
          {consulta.data?.aviso && <p className="mb-4 rounded-md border border-border p-3 text-sm text-muted-foreground">{consulta.data.aviso}</p>}
          {consulta.isPending && <p className="mb-4 text-sm text-muted-foreground">Consultando novas pools no GeckoTerminal…</p>}

          <div className="grid gap-3">
            {filtradas.map((p) => (
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
                  <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Compras / vendas 24h</div><div className="mt-1 font-mono text-sm">{p.compras24h ?? "—"} / {p.vendas24h ?? "—"}</div></div>
                </div>
                <div className="mt-3 break-all text-[10px] text-muted-foreground">Pool: {p.enderecoPool}</div>
                <div className="mt-2 text-[11px] text-muted-foreground">Criada em: {dataHora(p.criadoEm)} · FDV: {moeda(p.fdvUsd)}</div>
              </article>
            ))}
          </div>
          {consulta.isSuccess && filtradas.length === 0 && <p className="panel p-5 text-sm text-muted-foreground">Nenhuma pool corresponde aos filtros neste retorno da API. Isso não significa que não existam outras pools novas: o feed é paginado e limitado.</p>}
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">O feed público pode retornar apenas uma página de resultados e está sujeito a limites compartilhados por IP. Liquidez, volume e idade não comprovam legitimidade; valide o contrato e a distribuição antes de qualquer decisão.</p>
        </>
      )}

      {categoria === "bonding" && (
        <section className="panel max-w-4xl p-5 sm:p-6">
          <div className="text-xs font-medium text-muted-foreground">ESTÁGIO 2 · ANTES DA POOL</div>
          <h2 className="mt-2 font-semibold text-card-foreground">Tokens em curva de bonding</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Este feed ainda não está conectado. Para identificar tokens antes da criação da pool, a próxima integração será uma fonte própria de launchpads, como Solana Tracker ou Moralis para Solana. Essa categoria não será preenchida com pools já negociáveis.</p>
          <div className="mt-4 rounded-md border border-border p-3 text-xs text-muted-foreground">Campos planejados: launchpad, endereço do token, progresso da curva, capitalização estimada, eventos de graduação, rede e link da fonte.</div>
        </section>
      )}

      {categoria === "vendas" && (
        <section className="max-w-5xl">
          <div className="panel mb-4 p-5 sm:p-6">
            <div className="text-xs font-medium text-muted-foreground">ESTÁGIO 3 · ANTES DO TGE</div>
            <div className="mt-2 flex flex-wrap items-start gap-3">
              <div className="mr-auto">
                <h2 className="font-semibold text-card-foreground">ICO, IDO, IEO e presales</h2>
                <p className="mt-1 text-sm text-muted-foreground">Fonte: CryptoRank · calendário de vendas públicas · atualização a cada 5 minutos.</p>
              </div>
              <button onClick={() => consultaVendas.refetch()} className="rounded-md border border-border px-3 py-2 text-xs text-card-foreground">Atualizar agora</button>
            </div>
            {consultaVendas.data?.aviso && <p className="mt-4 rounded-md border border-border p-3 text-sm text-muted-foreground">{consultaVendas.data.aviso}</p>}
            {consultaVendas.isPending && <p className="mt-4 text-sm text-muted-foreground">Consultando o calendário de vendas…</p>}
            {consultaVendas.isError && <p className="mt-4 text-sm text-danger">Não foi possível carregar o calendário agora.</p>}
            {consultaVendas.data?.configurado && <p className="mt-3 text-xs text-muted-foreground">Última resposta: {dataHora(consultaVendas.data.atualizadoEm)} · {consultaVendas.data.vendas.length} registros retornados.</p>}
          </div>
          <div className="grid gap-3">
            {(consultaVendas.data?.vendas ?? []).map((v) => (
              <article key={v.id} className="panel p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="mr-auto min-w-0">
                    <div className="font-semibold text-card-foreground">{v.projeto}{v.simbolo ? ` (${v.simbolo})` : ""}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{v.tipo ?? "Venda pública"}{v.launchpad ? ` · Launchpad: ${v.launchpad}` : ""}{v.status ? ` · ${v.status}` : ""}</div>
                  </div>
                  {v.url && <a href={v.url} target="_blank" rel="noreferrer" className="rounded-md border border-border px-3 py-2 text-xs text-signal underline">Abrir fonte</a>}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Início</div><div className="mt-1 text-sm">{dataHora(v.inicio)}</div></div>
                  <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Fim</div><div className="mt-1 text-sm">{dataHora(v.fim)}</div></div>
                  <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Preço divulgado</div><div className="mt-1 font-mono text-sm">{v.preco ?? "—"}</div></div>
                </div>
              </article>
            ))}
          </div>
          {consultaVendas.data?.configurado && consultaVendas.isSuccess && consultaVendas.data.vendas.length === 0 && !consultaVendas.data.aviso && <p className="panel p-5 text-sm text-muted-foreground">A fonte não retornou vendas futuras para este filtro.</p>}
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">As datas e os preços dependem da cobertura e do plano da fonte. Confirme os detalhes no projeto ou launchpad oficial; a presença no calendário não representa recomendação de investimento.</p>
        </section>
      )}
    </Shell>
  );
}
