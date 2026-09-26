import { createFileRoute, notFound } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { Trilha } from "@/components/trilha";
import { ModuloPainel } from "@/components/modulo-painel";
import { useProgresso } from "@/hooks/use-progresso";
import { modulos } from "@/data/course";

export const Route = createFileRoute("/modulo/$id")({
  loader: ({ params }) => {
    const modulo = modulos.find((m) => m.id === params.id);
    if (!modulo) throw notFound();
    return { modulo };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Módulo não encontrado" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.modulo.titulo} — Radar.IA`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.modulo.resumo },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.modulo.resumo },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: PaginaModulo,
});

function PaginaModulo() {
  const { modulo } = Route.useLoaderData();
  const { pctGeral, porModulo, progresso, marcar } = useProgresso();
  return (
    <Shell status={<span className="font-mono text-muted-foreground">{pctGeral}% concluído</span>}>
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <Trilha pctGeral={pctGeral} porModulo={porModulo} ativo={modulo.id} />
        <ModuloPainel key={modulo.id} modulo={modulo} progresso={progresso} marcar={marcar} />
      </div>
    </Shell>
  );
}
