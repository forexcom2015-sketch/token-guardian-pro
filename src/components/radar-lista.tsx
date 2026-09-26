import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { NivelPonto } from "@/components/shell";
import { gerarRadar, type CasoRadar } from "@/lib/token-ai.functions";

export function useRadar() {
  const fn = useServerFn(gerarRadar);
  return useMutation({
    mutationFn: (foco?: string) => fn({ data: { foco } }),
  });
}

export function RadarLista({
  casos,
  carregando,
  erro,
  onGerar,
  compacto = false,
}: {
  casos: CasoRadar[];
  carregando: boolean;
  erro?: string | undefined;
  onGerar: () => void;
  compacto?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
          <span className="label-eyebrow">Radar IA · tokens em lançamento</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          A IA monta cenários de lançamento para você treinar a leitura de risco item a item.
        </p>
        <button
          type="button"
          onClick={onGerar}
          disabled={carregando}
          className="mt-3 w-full rounded-lg bg-signal px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {carregando ? "Escaneando…" : "Gerar cenários"}
        </button>
        {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
      </div>

      {casos.length > 0 && (
        <div className="panel overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border px-3 py-2 text-[9px] uppercase tracking-widest text-muted-foreground">
            <span>Token</span>
            <span className="text-center">Score</span>
            <span className="text-center">Risco</span>
          </div>
          {casos.map((c) => (
            <div key={c.simbolo} className="border-b border-border last:border-b-0">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-xs text-card-foreground">{c.nome}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {c.simbolo} · {c.rede}
                  </div>
                </div>
                <span className="font-mono text-xs text-card-foreground">{c.score}</span>
                <span className="mx-auto">
                  <NivelPonto nivel={c.nivel} />
                </span>
              </div>
              {!compacto && (
                <div className="space-y-1.5 px-3 pb-3 text-xs">
                  {c.destaques?.map((d) => (
                    <p key={d} className="flex gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal" />
                      {d}
                    </p>
                  ))}
                  {c.alertas?.map((a) => (
                    <p key={a} className="flex gap-2 text-danger">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-danger" />
                      {a}
                    </p>
                  ))}
                  {c.exercicio && (
                    <p className="mt-2 text-pretty text-muted-foreground">
                      <span className="label-eyebrow mr-2">Exercício</span>
                      {c.exercicio}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="panel p-4">
        <div className="label-eyebrow mb-3">Legenda de risco</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <NivelPonto nivel="baixo" />
            <span className="text-card-foreground">Baixo · seguir com análise</span>
          </div>
          <div className="flex items-center gap-2">
            <NivelPonto nivel="medio" />
            <span className="text-card-foreground">Médio · cautela</span>
          </div>
          <div className="flex items-center gap-2">
            <NivelPonto nivel="alto" />
            <span className="text-card-foreground">Alto · evitar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
