import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

async function chamarIA(instrucoes: string, entrada: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("A análise com IA não está configurada.");

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      input: [
        { role: "system", content: instrucoes },
        { role: "user", content: entrada },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const detalhe = await response.text().catch(() => "");
    if (response.status === 429) throw new Error("Muitas análises seguidas. Tente de novo em instantes.");
    if (response.status === 402)
      throw new Error("Os créditos de IA do projeto acabaram. Adicione créditos para continuar.");
    throw new Error(`A IA não respondeu (${response.status}). ${detalhe.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let texto = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const linhas = buffer.split("\n");
    buffer = linhas.pop() ?? "";
    for (const linha of linhas) {
      if (!linha.startsWith("data:")) continue;
      const payload = linha.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evento = JSON.parse(payload) as { type?: string; delta?: string };
        if (evento.type === "response.output_text.delta" && typeof evento.delta === "string") {
          texto += evento.delta;
        }
      } catch {
        /* evento parcial ignorado */
      }
    }
  }

  return texto;
}

function extrairJson<T>(texto: string): T {
  const limpo = texto.replace(/```json/gi, "").replace(/```/g, "").trim();
  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (inicio === -1 || fim === -1) throw new Error("A IA devolveu uma resposta fora do formato esperado.");
  return JSON.parse(limpo.slice(inicio, fim + 1)) as T;
}

export type ItemAnalise = {
  categoria: string;
  criterio: string;
  nivel: "baixo" | "medio" | "alto" | "desconhecido";
  leitura: string;
  comoVerificar: string;
};

export type AnaliseToken = {
  resumo: string;
  score: number;
  nivelGeral: "baixo" | "medio" | "alto";
  itens: ItemAnalise[];
  perguntasAbertas: string[];
};

const INSTRUCOES_ANALISE = `Você é um analista on-chain que ensina due diligence de tokens em lançamento, em português do Brasil.
Você NÃO tem acesso a dados on-chain ao vivo. Trabalhe apenas com o que o usuário informou e, para o que faltar, use nível "desconhecido" e explique exatamente como verificar.
Avalie sempre estas cinco categorias: "Liquidez e contrato", "Distribuição do supply", "Comportamento on-chain", "Tokenomics", "Sinais externos".
Nunca recomende comprar ou vender. Fale de risco e verificação.
Responda SOMENTE com JSON válido neste formato:
{"resumo":string,"score":number (0-100, quanto maior mais arriscado),"nivelGeral":"baixo"|"medio"|"alto","itens":[{"categoria":string,"criterio":string,"nivel":"baixo"|"medio"|"alto"|"desconhecido","leitura":string,"comoVerificar":string}],"perguntasAbertas":[string]}
Gere de 8 a 12 itens cobrindo as cinco categorias.`;

export const analisarToken = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        endereco: z.string().min(3).max(120),
        rede: z.string().min(2).max(40),
        observacoes: z.string().max(2000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<AnaliseToken> => {
    const entrada = [
      `Endereço do contrato: ${data.endereco}`,
      `Rede: ${data.rede}`,
      data.observacoes?.trim()
        ? `Dados que o aluno já levantou: ${data.observacoes.trim()}`
        : "O aluno ainda não levantou dados on-chain.",
    ].join("\n");

    const texto = await chamarIA(INSTRUCOES_ANALISE, entrada);
    const analise = extrairJson<AnaliseToken>(texto);
    return {
      ...analise,
      score: Math.max(0, Math.min(100, Math.round(analise.score))),
      itens: Array.isArray(analise.itens) ? analise.itens : [],
      perguntasAbertas: Array.isArray(analise.perguntasAbertas) ? analise.perguntasAbertas : [],
    };
  });

export type CasoRadar = {
  nome: string;
  simbolo: string;
  rede: string;
  score: number;
  nivel: "baixo" | "medio" | "alto";
  destaques: string[];
  alertas: string[];
  exercicio: string;
};

const INSTRUCOES_RADAR = `Você monta cenários de treino para um curso de análise de tokens, em português do Brasil.
Crie casos FICTÍCIOS e realistas de tokens recém-lançados (não use projetos reais e deixe claro que são simulações no exercício).
Varie o nível de risco entre os casos. Cada caso deve cruzar liquidez/contrato, distribuição, comportamento on-chain, tokenomics e sinais externos.
Responda SOMENTE com JSON válido:
{"casos":[{"nome":string,"simbolo":string,"rede":string,"score":number (0-100, maior = mais arriscado),"nivel":"baixo"|"medio"|"alto","destaques":[string],"alertas":[string],"exercicio":string}]}
Gere exatamente 4 casos.`;

export const gerarRadar = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ foco: z.string().max(200).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }): Promise<{ casos: CasoRadar[] }> => {
    const texto = await chamarIA(
      INSTRUCOES_RADAR,
      data.foco?.trim()
        ? `Foque os cenários em: ${data.foco.trim()}`
        : "Gere cenários variados de lançamentos recentes em DEX.",
    );
    const resultado = extrairJson<{ casos: CasoRadar[] }>(texto);
    return { casos: Array.isArray(resultado.casos) ? resultado.casos.slice(0, 4) : [] };
  });
