export type NivelManipulacao = "baixo" | "moderado" | "alto" | "indeterminado";
export type CoberturaManipulacao = "suficiente" | "parcial" | "insuficiente";

export type DadosMercadoManipulacao = {
  liquidezUsd: number | null;
  volume24h: number | null;
  compras24h: number | null;
  vendas24h: number | null;
  compras1h: number | null;
  vendas1h: number | null;
  variacao24h: number | null;
  criadoEm: number | null;
};

export type SinalManipulacao = {
  codigo: string;
  titulo: string;
  nivel: "baixo" | "moderado" | "alto";
  pontos: number;
  evidencia: string;
};

export type AnaliseManipulacao = {
  score: number | null;
  nivel: NivelManipulacao;
  cobertura: CoberturaManipulacao;
  idadeParMinutos: number | null;
  sinais: SinalManipulacao[];
  observacao: string;
  limitacoes: string[];
};

const numeroValido = (v: number | null): v is number => v !== null && Number.isFinite(v) && v >= 0;

/**
 * Heurística explicável para padrões agregados de mercado. Não identifica carteiras
 * nem prova que uma transação foi executada por bot; os dados públicos agregados
 * do DexScreener não incluem o histórico individual necessário para isso.
 */
export function detectarManipulacao(
  mercado: DadosMercadoManipulacao | null,
  agora = Date.now(),
): AnaliseManipulacao {
  const limitacoes = [
    "Compras e vendas são contagens agregadas do par; não revelam se a mesma carteira alternou entre comprar e vender.",
    "Não há agrupamento de carteiras por financiador, análise de transações individuais ou prova direta de uso de bots nesta fonte.",
    "Bots legítimos de arbitragem e market making podem produzir atividade rápida; sinais são indícios, não prova de fraude.",
  ];

  if (!mercado) {
    return {
      score: null,
      nivel: "indeterminado",
      cobertura: "insuficiente",
      idadeParMinutos: null,
      sinais: [],
      observacao: "Não há dados de mercado suficientes para avaliar padrões de negociação.",
      limitacoes,
    };
  }

  const idadeParMinutos = mercado.criadoEm && mercado.criadoEm > 0
    ? Math.max(0, Math.floor((agora - mercado.criadoEm) / 60_000))
    : null;
  const sinais: SinalManipulacao[] = [];
  let score = 0;
  let metricasDisponiveis = 0;

  const adicionar = (sinal: SinalManipulacao) => {
    sinais.push(sinal);
    score += sinal.pontos;
  };

  const liquidez = numeroValido(mercado.liquidezUsd) ? mercado.liquidezUsd : null;
  const volume = numeroValido(mercado.volume24h) ? mercado.volume24h : null;
  const compras1h = numeroValido(mercado.compras1h) ? mercado.compras1h : null;
  const vendas1h = numeroValido(mercado.vendas1h) ? mercado.vendas1h : null;
  const compras24h = numeroValido(mercado.compras24h) ? mercado.compras24h : null;
  const vendas24h = numeroValido(mercado.vendas24h) ? mercado.vendas24h : null;

  if (liquidez !== null) {
    metricasDisponiveis++;
    if (liquidez < 10_000) {
      adicionar({ codigo: "liquidez-muito-baixa", titulo: "Liquidez muito baixa", nivel: "alto", pontos: 18, evidencia: `Liquidez estimada de US$ ${Math.round(liquidez).toLocaleString("pt-BR")}; operações relativamente pequenas podem mover o preço.` });
    } else if (liquidez < 30_000) {
      adicionar({ codigo: "liquidez-baixa", titulo: "Liquidez baixa", nivel: "moderado", pontos: 10, evidencia: `Liquidez estimada de US$ ${Math.round(liquidez).toLocaleString("pt-BR")}.` });
    }
  }

  if (volume !== null && liquidez !== null && liquidez > 0) {
    metricasDisponiveis++;
    const giro = volume / liquidez;
    if (giro >= 10) {
      adicionar({ codigo: "giro-extremo", titulo: "Volume desproporcional à liquidez", nivel: "alto", pontos: 24, evidencia: `Volume de 24 h equivale a ${giro.toFixed(1)}× a liquidez informada.` });
    } else if (giro >= 5) {
      adicionar({ codigo: "giro-elevado", titulo: "Giro elevado em relação à liquidez", nivel: "moderado", pontos: 14, evidencia: `Volume de 24 h equivale a ${giro.toFixed(1)}× a liquidez informada.` });
    }
  }

  if (compras1h !== null && vendas1h !== null) {
    metricasDisponiveis++;
    const total = compras1h + vendas1h;
    const maior = Math.max(compras1h, vendas1h);
    const menor = Math.min(compras1h, vendas1h);
    if (total >= 30 && maior / Math.max(total, 1) >= 0.9) {
      adicionar({ codigo: "desequilibrio-h1", titulo: "Desequilíbrio forte entre compras e vendas", nivel: "alto", pontos: 20, evidencia: `${compras1h} compras e ${vendas1h} vendas na última hora; ${Math.round((maior / total) * 100)}% das operações estão de um lado.` });
    } else if (total >= 20 && menor > 0 && maior / menor >= 4) {
      adicionar({ codigo: "desequilibrio-moderado-h1", titulo: "Fluxo de compra/venda desequilibrado", nivel: "moderado", pontos: 10, evidencia: `${compras1h} compras e ${vendas1h} vendas na última hora.` });
    }
    if (total >= 150) {
      adicionar({ codigo: "frequencia-h1", titulo: "Frequência elevada de operações", nivel: "moderado", pontos: 10, evidencia: `${total} operações agregadas na última hora; isso pode ser atividade automatizada ou negociação legítima.` });
    }
  }

  if (compras24h !== null && vendas24h !== null) {
    metricasDisponiveis++;
    const total = compras24h + vendas24h;
    const maior = Math.max(compras24h, vendas24h);
    if (total >= 100 && maior / Math.max(total, 1) >= 0.92) {
      adicionar({ codigo: "desequilibrio-h24", titulo: "Desequilíbrio persistente no fluxo", nivel: "moderado", pontos: 10, evidencia: `${compras24h} compras e ${vendas24h} vendas em 24 h.` });
    }
  }

  if (mercado.variacao24h !== null && Number.isFinite(mercado.variacao24h) && liquidez !== null) {
    metricasDisponiveis++;
    if (Math.abs(mercado.variacao24h) >= 100 && liquidez < 25_000) {
      adicionar({ codigo: "volatilidade-baixa-liquidez", titulo: "Oscilação extrema com pouca liquidez", nivel: "alto", pontos: 18, evidencia: `Variação de ${mercado.variacao24h.toFixed(1)}% em 24 h com liquidez abaixo de US$ 25 mil.` });
    }
  }

  if (idadeParMinutos !== null && idadeParMinutos <= 60 && compras1h !== null && vendas1h !== null) {
    metricasDisponiveis++;
    const total = compras1h + vendas1h;
    if (total >= 50 && liquidez !== null && liquidez < 50_000) {
      adicionar({ codigo: "lancamento-atividade-intensa", titulo: "Atividade intensa no início do lançamento", nivel: "moderado", pontos: 12, evidencia: `Par com ${idadeParMinutos} minuto(s), ${total} operações na última hora e liquidez abaixo de US$ 50 mil.` });
    }
  }

  const scoreFinal = Math.min(100, score);
  const cobertura: CoberturaManipulacao = metricasDisponiveis >= 4 ? "suficiente" : metricasDisponiveis >= 2 ? "parcial" : "insuficiente";
  const nivel: NivelManipulacao = cobertura === "insuficiente"
    ? "indeterminado"
    : scoreFinal >= 50 ? "alto" : scoreFinal >= 25 ? "moderado" : "baixo";

  return {
    score: cobertura === "insuficiente" ? null : scoreFinal,
    nivel,
    cobertura,
    idadeParMinutos,
    sinais,
    observacao: nivel === "indeterminado"
      ? "Cobertura insuficiente: não é possível avaliar com confiança os padrões de negociação."
      : nivel === "alto"
        ? "Vários indicadores agregados justificam investigação de possível manipulação. Isto não confirma bots ou fraude."
        : nivel === "moderado"
          ? "Foram encontrados sinais de atenção. Verifique as transações individuais antes de concluir que há manipulação."
          : "Os indicadores agregados disponíveis não mostram sinais fortes; isso não garante ausência de bots ou manipulação.",
    limitacoes,
  };
}
