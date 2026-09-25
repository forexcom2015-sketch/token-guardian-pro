import { useState } from "react";
import type { Modulo } from "@/data/course";

type Props = {
  modulo: Modulo;
  progresso: Record<string, boolean>;
  marcar: (chave: string, valor: boolean) => void;
};

export function ModuloPainel({ modulo, progresso, marcar }: Props) {
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const concluidosLicao = modulo.licoes.filter((l) => progresso[`${modulo.id}:${l.id}`]).length;

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="label-eyebrow mb-2">
          Módulo {modulo.numero} · {concluidosLicao === modulo.licoes.length ? "revisão" : "em andamento"}
        </div>
        <h1 className="text-balance text-2xl font-semibold leading-tight text-card-foreground">
          {modulo.titulo}
        </h1>
        <p className="mt-2 max-w-[48ch] text-pretty text-sm text-muted-foreground">{modulo.resumo}</p>
      </div>

      <div className="panel space-y-3 bg-card/70 p-4">
        <div className="label-eyebrow">Lições e checklist</div>
        {modulo.licoes.map((licao) => {
          const chave = `${modulo.id}:${licao.id}`;
          const feito = Boolean(progresso[chave]);
          return (
            <label
              key={licao.id}
              className="-mx-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
            >
              <input
                type="checkbox"
                checked={feito}
                onChange={(e) => marcar(chave, e.target.checked)}
                className="mt-1 h-3.5 w-3.5 shrink-0 accent-[var(--signal)]"
              />
              <span className="min-w-0">
                <span
                  className={`block text-xs font-medium ${feito ? "text-signal" : "text-card-foreground"}`}
                >
                  {licao.titulo}
                </span>
                <span className="mt-1 block text-pretty text-xs leading-relaxed text-muted-foreground">
                  {licao.texto}
                </span>
                <span className="mt-1.5 flex items-start gap-2 text-[11px] text-danger">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                  {licao.sinalRuim}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {modulo.quiz.map((q, i) => {
        const chave = `${modulo.id}:quiz:${q.id}`;
        const escolha = respostas[q.id];
        const respondido = escolha !== undefined;
        const acertou = escolha === q.correta;
        return (
          <div key={q.id} className="panel bg-card/70 p-4">
            <div className="label-eyebrow mb-3">
              Quiz · {i + 1} de {modulo.quiz.length}
            </div>
            <p className="text-pretty text-sm text-card-foreground">{q.pergunta}</p>
            <div className="mt-3 space-y-2">
              {q.alternativas.map((alt, idx) => {
                const marcada = escolha === idx;
                const correta = respondido && idx === q.correta;
                const errada = marcada && !acertou;
                return (
                  <button
                    key={alt}
                    type="button"
                    onClick={() => {
                      setRespostas((r) => ({ ...r, [q.id]: idx }));
                      if (idx === q.correta) marcar(chave, true);
                    }}
                    className={`w-full rounded-lg p-3 text-left text-xs transition-colors ring-1 ${
                      correta
                        ? "bg-signal/10 text-signal ring-signal/40"
                        : errada
                          ? "bg-danger/10 text-danger ring-danger/40"
                          : "text-card-foreground ring-border hover:ring-signal/40"
                    }`}
                  >
                    {alt}
                  </button>
                );
              })}
            </div>
            {respondido && (
              <p className="mt-3 text-xs text-muted-foreground">
                {acertou ? "Correto. " : "Reveja: "}
                {q.explicacao}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
