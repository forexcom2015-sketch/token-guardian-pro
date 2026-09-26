import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { RadarLista, useRadar } from "@/components/radar-lista";
import { Analisador } from "@/components/analisador";

export const Route = createFileRoute("/radar")({
  head: () => ({
    meta: [
      { title: "Radar IA — análise de tokens com inteligência artificial" },
      { name: "description", content: "Cole os dados de um token e receba a análise item a item, ou gere cenários de lançamento para treinar." },
      { property: "og:title", content: "Radar IA — análise de tokens" },
      { property: "og:description", content: "IA que analisa contratos e sugere cenários de tokens em lançamento para treino." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Radar,
});

function Radar() {
  const radar = useRadar();
  return (
    <Shell status={<span className="text-signal">IA ativa</span>}>
      <div className="grid gap-8 lg:grid-cols-2">
        <Analisador />
        <RadarLista
          casos={radar.data?.casos ?? []}
          carregando={radar.isPending}
          erro={radar.error?.message}
          onGerar={() => radar.mutate(undefined)}
        />
      </div>
      <p className="mt-8 text-[11px] text-muted-foreground">Conteúdo educacional. Não é recomendação de investimento.</p>
    </Shell>
  );
}
