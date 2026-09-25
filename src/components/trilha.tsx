import { Link } from "@tanstack/react-router";
import { modulos } from "@/data/course";

type ProgressoModulo = { id: string; pct: number };

export function Trilha({
  pctGeral,
  porModulo,
  ativo,
}: {
  pctGeral: number;
  porModulo: ProgressoModulo[];
  ativo?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="label-eyebrow mb-1">Trilha de módulos</div>

      <div className="panel p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-xs font-medium text-card-foreground">Progresso geral</span>
          <span className="font-mono text-lg text-card-foreground">
            {pctGeral}
            <span className="text-sm text-muted-foreground">%</span>
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-signal transition-all duration-500"
            style={{ width: `${pctGeral}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {modulos.map((m) => {
          const pct = porModulo.find((p) => p.id === m.id)?.pct ?? 0;
          const selecionado = ativo === m.id;
          return (
            <Link
              key={m.id}
              to="/modulo/$id"
              params={{ id: m.id }}
              className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                selecionado
                  ? "bg-signal/5 ring-1 ring-signal/20"
                  : "panel hover:bg-secondary/60"
              }`}
            >
              <span
                className={`w-6 font-mono text-xs ${selecionado ? "text-signal" : "text-muted-foreground"}`}
              >
                {m.numero}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-xs ${
                    selecionado ? "font-medium text-signal" : "text-card-foreground"
                  }`}
                >
                  {m.titulo}
                </div>
                <div className="mt-1.5 h-0.5 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-signal transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span
                className={`font-mono text-[10px] ${pct > 0 ? "text-signal" : "text-muted-foreground"}`}
              >
                {pct}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
