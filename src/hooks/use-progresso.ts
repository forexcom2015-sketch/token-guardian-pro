import { useCallback, useEffect, useState } from "react";
import { modulos, totalItens } from "@/data/course";

const STORAGE_KEY = "radar-ia-progresso-v1";

type Progresso = Record<string, boolean>;

function ler(): Progresso {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Progresso;
  } catch {
    return {};
  }
}

export function useProgresso() {
  const [progresso, setProgresso] = useState<Progresso>({});
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setProgresso(ler());
    setPronto(true);
  }, []);

  const marcar = useCallback((chave: string, valor: boolean) => {
    setProgresso((atual) => {
      const proximo = { ...atual, [chave]: valor };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(proximo));
      } catch {
        /* ignora */
      }
      return proximo;
    });
  }, []);

  const feitos = Object.values(progresso).filter(Boolean).length;

  const porModulo = modulos.map((m) => {
    const total = m.licoes.length + m.quiz.length;
    const concluidos =
      m.licoes.filter((l) => progresso[`${m.id}:${l.id}`]).length +
      m.quiz.filter((q) => progresso[`${m.id}:quiz:${q.id}`]).length;
    return { id: m.id, total, concluidos, pct: Math.round((concluidos / total) * 100) };
  });

  return {
    pronto,
    progresso,
    marcar,
    pctGeral: pronto ? Math.round((feitos / totalItens) * 100) : 0,
    porModulo,
  };
}
