import type { AnaliseReal } from "@/lib/token-ai.functions";

const KEY = "radar-ia-serie-v1";
export type Ponto = { t: number; nota: number; fonte: "painel" | "analise" | "ia" };
type Mapa = Record<string, Ponto[]>;

export const chaveToken = (rede: string, endereco: string) => `${rede}:${endereco}`;

function ler(): Mapa {
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Mapa; } catch { return {}; }
}

/** Grava a nota do painel de cada token (no máx. 1 ponto por minuto, 120 pontos por token, 300 tokens). */
export function registrarPainel(tokens: { rede: string; endereco: string; risco: { nota: number; semSeguranca: boolean } }[]) {
  const m = ler();
  const agora = Date.now();
  for (const tk of tokens) {
    if (tk.risco.semSeguranca) continue;
    const k = chaveToken(tk.rede, tk.endereco);
    const l = m[k] ?? [];
    const ult = l[l.length - 1];
    if (ult && agora - ult.t < 55_000) continue;
    m[k] = [...l, { t: agora, nota: tk.risco.nota, fonte: "painel" as const }].slice(-120);
  }
  const chaves = Object.keys(m);
  if (chaves.length > 300) {
    chaves.sort((a, b) => (m[a].at(-1)?.t ?? 0) - (m[b].at(-1)?.t ?? 0)).slice(0, chaves.length - 300).forEach((k) => delete m[k]);
  }
  window.localStorage.setItem(KEY, JSON.stringify(m));
}

export function serieToken(rede: string, endereco: string, analises: AnaliseReal[]): Ponto[] {
  const pontos: Ponto[] = [...(ler()[chaveToken(rede, endereco)] ?? [])];
  for (const a of analises) {
    const t = new Date(a.geradoEm).getTime();
    if (a.risco) pontos.push({ t, nota: a.risco.nota, fonte: "analise" });
    if (a.parecer) pontos.push({ t, nota: a.parecer.score, fonte: "ia" });
  }
  return pontos.sort((a, b) => a.t - b.t);
}
