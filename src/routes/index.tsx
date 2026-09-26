import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { Trilha } from "@/components/trilha";
import { RadarLista, useRadar } from "@/components/radar-lista";
import { useProgresso } from "@/hooks/use-progresso";
import { modulos } from "@/data/course";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Radar.IA — Curso de análise de tokens com IA" },
      { name: "description", content: "Aprenda a analisar tokens em lançamento: liquidez, contrato, distribuição, tokenomics e sinais externos, com IA para treino." },
      { property: "og:title", content: "Radar.IA — Curso de análise de tokens com IA" },
      { property: "og:description", content: "Curso interativo para identificar rugs e honeypots antes de comprar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { pctGeral, porModulo } = useProgresso();
  const radar = useRadar();
  const proximo = modulos.find((m) => (porModulo.find((p) => p.id === m.id)?.pct ?? 0) < 100) ?? modulos[0]!;
  return (
    <Shell status={<span className="font-mono text-muted-foreground">{pctGeral}% concluído</span>}>
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <Trilha pctGeral={pctGeral} porModulo={porModulo} />
        <div className="space-y-8">
          <section className="panel p-6">
            <div className="label-eyebrow mb-2">Curso interativo</div>
            <h1 className="text-2xl font-semibold text-card-foreground">Análise de tokens em lançamento</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Cinco módulos para separar projetos sérios de rugs e honeypots: liquidez e contrato, distribuição, tokenomics e sinais externos. Use o Radar IA para treinar com cenários e analisar contratos.
            </p>
            <div className="mt-5 flex gap-3">
              <Link to="/modulo/$id" params={{ id: proximo.id }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Continuar: {proximo.titulo}
              </Link>
              <Link to="/radar" className="rounded-md border border-border px-4 py-2 text-sm text-card-foreground">
                Abrir Radar IA
              </Link>
            </div>
          </section>
          <RadarLista
            compacto
            casos={radar.data?.casos ?? []}
            carregando={radar.isPending}
            erro={radar.error?.message}
            onGerar={() => radar.mutate(undefined)}
          />
        </div>
      </div>
    </Shell>
  );
}
