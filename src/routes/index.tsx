import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Token Guardian IA — análise pública de risco cripto" },
      { name: "description", content: "Analise tokens em lançamento com dados de mercado, indicadores on-chain e checklist de risco assistido por IA." },
      { property: "og:title", content: "Token Guardian IA" },
      { property: "og:description", content: "Análise pública de tokens, liquidez e riscos on-chain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  return (
    <Shell status={<span className="text-signal">Acesso público · sem login</span>}>
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="panel relative overflow-hidden p-8 md:p-12">
          <div className="label-eyebrow mb-3">Inteligência on-chain · análise de risco</div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-card-foreground md:text-5xl">
            Entenda os riscos de um token <span className="text-signal">antes de negociar.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Consulte indicadores de liquidez, contrato, atividade de mercado e sinais de segurança em uma única análise. Acesse gratuitamente, sem criar conta.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/radar" className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Analisar um token</Link>
            <Link to="/lancamentos" className="rounded-md border border-border px-5 py-3 text-sm text-card-foreground">Explorar pré-lançamentos</Link>
            <Link to="/desempenho" className="rounded-md border border-border px-5 py-3 text-sm text-card-foreground">Top desempenho</Link>
            <Link to="/painel" className="rounded-md border border-border px-5 py-3 text-sm text-card-foreground">Ver painel de risco</Link>
          </div>
          <p className="mt-6 text-[11px] text-muted-foreground">Os indicadores ajudam na investigação, mas não garantem segurança nem eliminam o risco de perda.</p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <article className="panel p-5">
            <div className="label-eyebrow mb-2">01 · Mercado</div>
            <h2 className="font-medium text-card-foreground">Liquidez e atividade</h2>
            <p className="mt-2 text-sm text-muted-foreground">Consulte volume, idade do par, variação e relação entre compras e vendas.</p>
          </article>
          <article className="panel p-5">
            <div className="label-eyebrow mb-2">02 · Segurança</div>
            <h2 className="font-medium text-card-foreground">Sinais on-chain</h2>
            <p className="mt-2 text-sm text-muted-foreground">Reúna indicadores de contrato, permissões, concentração e possíveis restrições.</p>
          </article>
          <article className="panel p-5">
            <div className="label-eyebrow mb-2">03 · Inteligência</div>
            <h2 className="font-medium text-card-foreground">Checklist explicado</h2>
            <p className="mt-2 text-sm text-muted-foreground">Veja os fatores que contribuíram para a pontuação e os dados que não puderam ser verificados.</p>
          </article>
        </section>
      </div>
    </Shell>
  );
}
