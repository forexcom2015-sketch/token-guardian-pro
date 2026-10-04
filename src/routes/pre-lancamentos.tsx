import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/pre-lancamentos")({
  head: () => ({
    meta: [
      { title: "Pré-lançamentos — Token Guardian IA" },
      { name: "description", content: "Acompanhe a preparação para monitorar futuros lançamentos de tokens e entenda quais fontes precisam ser integradas." },
      { property: "og:title", content: "Pré-lançamentos — Token Guardian IA" },
      { property: "og:description", content: "Área separada para ativos antes do início da negociação." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PreLancamentos,
});

function PreLancamentos() {
  return (
    <Shell status={<span className="text-muted-foreground">Monitoramento pré-lançamento</span>}>
      <div className="mb-6">
        <div className="label-eyebrow mb-2">Antes da negociação</div>
        <h1 className="text-2xl font-semibold">Pré-lançamentos</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Esta área é separada dos tokens que já estão negociando. Um pré-lançamento precisa ser confirmado por uma fonte que anuncie o lançamento antes de existir um par de mercado verificável.
        </p>
      </div>

      <section className="panel max-w-4xl p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-signal">◎</div>
          <div>
            <h2 className="font-semibold text-card-foreground">Feed de pré-lançamentos ainda não conectado</h2>
            <p className="mt-1 text-xs text-muted-foreground">Sem anúncios futuros confirmados nesta versão</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          As fontes atualmente integradas ao sistema — perfis recentes, tokens promovidos e pares do DexScreener — ajudam a descobrir ativos que já podem estar no mercado. Elas não são suficientes para afirmar com segurança que um token ainda não foi lançado. Para evitar misturar categorias ou exibir datas inventadas, esta página não transforma esses ativos em falsos pré-lançamentos.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border p-3">
            <div className="text-xs font-medium text-card-foreground">1. Descoberta</div>
            <p className="mt-1 text-xs text-muted-foreground">Integrar fontes de anúncios oficiais, launchpads e calendários de lançamento.</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs font-medium text-card-foreground">2. Validação</div>
            <p className="mt-1 text-xs text-muted-foreground">Guardar rede, contrato quando publicado, horário previsto e link da fonte.</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs font-medium text-card-foreground">3. Acompanhamento</div>
            <p className="mt-1 text-xs text-muted-foreground">Mover para lançamentos somente após detectar um par negociável e validar os dados.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/lancamentos" className="rounded-md bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground">Ver tokens já lançados</Link>
          <Link to="/desempenho" className="rounded-md border border-border px-4 py-2.5 text-xs text-card-foreground">Ver Top desempenho</Link>
        </div>
      </section>
      <p className="mt-4 max-w-4xl text-[11px] leading-relaxed text-muted-foreground">
        Próximo passo técnico: conectar fontes específicas de launchpads e anúncios oficiais por rede, registrar a URL de origem e o horário da última verificação. Um anúncio não garante que o lançamento ocorrerá nem que o contrato será legítimo.
      </p>
    </Shell>
  );
}
