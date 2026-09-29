import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

async function chamarIA(instrucoes: string, entrada: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("A análise com IA não está configurada.");

  const response = await fetch(GATEWAY, {
    method: "POST",
    signal: AbortSignal.timeout(60000),
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

import type { DadosToken, Rede } from "./onchain.server";
export type { DadosToken, Rede } from "./onchain.server";

const redeSchema = z.enum(["solana", "bsc", "ethereum", "base"]);

export type ParecerIA = {
  resumo: string;
  score: number;
  nivelGeral: "baixo" | "medio" | "alto";
  pontosAtencao: string[];
  proximosPassos: string[];
};

export type AnaliseReal = { dados: DadosToken; parecer: ParecerIA | null; erroIA: string | null; geradoEm: string };

const INSTRUCOES_PARECER = `Você é um analista on-chain de um curso de due diligence de tokens, em português do Brasil.
Você recebe DADOS REAIS coletados agora do DexScreener e do GoPlus, já com um checklist pontuado (baixo/medio/alto/desconhecido).
Não invente números: use só os dados recebidos. Itens "desconhecido" devem virar próximos passos de verificação.
Considere as 5 categorias do curso: Liquidez e contrato, Distribuição do supply, Comportamento on-chain, Tokenomics, Sinais externos (redes sociais e histórico do dev não vêm nos dados: peça verificação manual).
Nunca recomende comprar ou vender.
Responda SOMENTE com JSON: {"resumo":string,"score":number (0-100, maior = mais arriscado),"nivelGeral":"baixo"|"medio"|"alto","pontosAtencao":[string],"proximosPassos":[string]}
Máximo 5 itens em cada lista.`;

export const analisarReal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ rede: redeSchema, endereco: z.string().trim().min(20).max(80) }).parse(data),
  )
  .handler(async ({ data }): Promise<AnaliseReal> => {
    const { coletarDados } = await import("./onchain.server");
    const dados = await coletarDados(data.rede, data.endereco);
    if (!dados.fontes.length) throw new Error("Token não encontrado no DexScreener nem no GoPlus para essa rede.");
    let parecer: ParecerIA | null = null;
    let erroIA: string | null = null;
    try {
      const p = extrairJson<ParecerIA>(await chamarIA(INSTRUCOES_PARECER, JSON.stringify(dados)));
      parecer = {
        resumo: String(p.resumo ?? ""),
        score: Math.max(0, Math.min(100, Math.round(Number(p.score) || 0))),
        nivelGeral: ["baixo", "medio", "alto"].includes(p.nivelGeral) ? p.nivelGeral : "medio",
        pontosAtencao: Array.isArray(p.pontosAtencao) ? p.pontosAtencao.slice(0, 5) : [],
        proximosPassos: Array.isArray(p.proximosPassos) ? p.proximosPassos.slice(0, 5) : [],
      };
    } catch (e) {
      erroIA = e instanceof Error ? e.message : "A IA não respondeu.";
    }
    return { dados, parecer, erroIA, geradoEm: new Date().toISOString() };
  });

export const listarLancamentos = createServerFn({ method: "GET" }).handler(async () => {
  const { lancamentosRecentes } = await import("./onchain.server");
  const redes: Rede[] = ["solana", "bsc", "ethereum", "base"];
  return { tokens: await lancamentosRecentes(redes), atualizadoEm: new Date().toISOString() };
});
