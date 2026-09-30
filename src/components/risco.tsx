import type { NotaRisco } from "@/lib/onchain.server";

const cor = { baixo: "text-signal", medio: "text-warn", alto: "text-danger" } as const;
const rotulo = { baixo: "Menor risco", medio: "Atenção", alto: "Perigo" } as const;

export function SeloRisco({ risco }: { risco: NotaRisco }) {
  return (
    <div className="flex items-center gap-2" title={risco.alertas.join(", ") || "Sem alertas graves"}>
      <span className={`font-mono text-sm font-semibold ${cor[risco.nivel]}`}>{risco.nota}</span>
      <span className={`text-[10px] uppercase tracking-widest ${cor[risco.nivel]}`}>{risco.semSeguranca ? "Sem checagem" : rotulo[risco.nivel]}</span>
    </div>
  );
}
