import type { Ponto } from "@/lib/serie";

const cores = { painel: "var(--color-signal)", analise: "var(--color-warn)", ia: "var(--color-primary)" } as const;
const nomes = { painel: "Painel (a cada minuto)", analise: "Checklist no Radar", ia: "Nota da IA" } as const;

export function GraficoRisco({ pontos }: { pontos: Ponto[] }) {
  if (pontos.length === 0) return <p className="text-xs text-muted-foreground">Ainda sem pontuações para este token.</p>;
  const W = 640, H = 200, P = 28;
  const t0 = pontos[0]!.t, t1 = Math.max(pontos[pontos.length - 1]!.t, t0 + 60_000);
  const x = (t: number) => P + ((t - t0) / (t1 - t0)) * (W - 2 * P);
  const y = (n: number) => H - P - (n / 100) * (H - 2 * P);
  const fontes = (["painel", "analise", "ia"] as const).filter((f) => pontos.some((p) => p.fonte === f));
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Pontuação de risco ao longo do tempo">
        {[0, 20, 50, 100].map((n) => (
          <g key={n}>
            <line x1={P} x2={W - P} y1={y(n)} y2={y(n)} stroke="var(--color-border)" strokeDasharray="3 4" />
            <text x={4} y={y(n) + 3} fontSize="9" fill="var(--color-muted-foreground)">{n}</text>
          </g>
        ))}
        {fontes.map((f) => {
          const ps = pontos.filter((p) => p.fonte === f);
          return (
            <g key={f}>
              {ps.length > 1 && <polyline fill="none" stroke={cores[f]} strokeWidth="1.5" points={ps.map((p) => `${x(p.t)},${y(p.nota)}`).join(" ")} />}
              {ps.map((p, i) => <circle key={i} cx={x(p.t)} cy={y(p.nota)} r="2.5" fill={cores[f]}><title>{`${new Date(p.t).toLocaleString("pt-BR")} · ${p.nota}`}</title></circle>)}
            </g>
          );
        })}
        <text x={P} y={H - 8} fontSize="9" fill="var(--color-muted-foreground)">{new Date(t0).toLocaleString("pt-BR")}</text>
        <text x={W - P} y={H - 8} fontSize="9" textAnchor="end" fill="var(--color-muted-foreground)">{new Date(t1).toLocaleString("pt-BR")}</text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        {fontes.map((f) => <span key={f} className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: cores[f] }} />{nomes[f]}</span>)}
        <span>Maior = mais arriscado</span>
      </div>
    </div>
  );
}
