import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { useProgresso } from "@/hooks/use-progresso";
import { modulos } from "@/data/course";

export const Route = createFileRoute("/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos — Radar.IA" },
      { name: "description", content: "Todos os módulos do curso de análise de tokens: liquidez, contrato, supply, tokenomics e sinais externos." },
      { property: "og:title", content: "Módulos — Radar.IA" },
      { property: "og:description", content: "Veja os 5 módulos do curso e seu progresso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Modulos,
});

function Modulos() {
  const { pctGeral, porModulo } = useProgresso();
  return (
    <Shell status={<span className="font-mono text-muted-foreground">{pctGeral}% concluído</span>}>
      <h1 className="mb-6 text-2xl font-semibold">Módulos</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modulos.map((m) => {
          const pct = porModulo.find((p) => p.id === m.id)?.pct ?? 0;
          return (
            <Link key={m.id} to="/modulo/$id" params={{ id: m.id }} className="panel block p-5 hover:bg-secondary/60">
              <div className="font-mono text-xs text-signal">{m.numero}</div>
              <div className="mt-1 font-medium text-card-foreground">{m.titulo}</div>
              <p className="mt-2 text-xs text-muted-foreground">{m.resumo}</p>
              <div className="mt-4 h-1 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-signal" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">{pct}%</div>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
