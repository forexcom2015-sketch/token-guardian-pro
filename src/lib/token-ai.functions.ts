import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/** Persistent, atomic limits stored in Postgres; never falls back to process memory. */
async function limitarUso(acao: "analise-ia" | "checklist-seguranca", limite: number, janelaSegundos: number) {
  const request = getRequest();
  // Cloudflare sets this header at the edge. Do not trust arbitrary forwarded-IP headers.
  const ip = request?.headers.get("cf-connecting-ip")?.trim();
  const origem = ip && ip.length <= 64 ? ip : "origem-nao-identificada";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${acao}:${origem}`));
  const chave = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consumir_limite_requisicoes", {
    p_chave: chave,
    p_limite: limite,
    p_janela_segundos: janelaSegundos,
  });
  if (error || typeof data !== "boolean") {
    console.error("[RateLimit] Não foi possível verificar o limite de requisições.", error?.message);
    throw new Error("Serviço temporariamente indisponível para proteger os recursos. Tente novamente.");
  }
  if (!data) throw new Error("Limite de consultas atingido. Aguarde antes de tentar novamente.");
}

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

import type { DadosToken, NotaRisco, Rede } from "./onchain.server";
import { entradaTokenSchema } from "./enderecos";
import { detectarManipulacao, type AnaliseManipulacao } from "./manipulacao";
export type { DadosToken, Rede } from "./onchain.server";

export type ParecerIA = {
  resumo: string;
  pontosAtencao: string[];
  proximosPassos: string[];
};

export type AnaliseReal = { dados: DadosToken; risco: NotaRisco; manipulacao: AnaliseManipulacao; parecer: ParecerIA | null; erroIA: string | null; geradoEm: string };

const INSTRUCOES_PARECER = `Você é um analista on-chain de um curso de due diligence de tokens, em português do Brasil.
Você recebe DADOS REAIS coletados agora do DexScreener e do GoPlus, já com um checklist pontuado (baixo/medio/alto/desconhecido).
Não invente números: use só os dados recebidos. Itens "desconhecido" devem virar próximos passos de verificação.
Considere as 5 categorias do curso: Liquidez e contrato, Distribuição do supply, Comportamento on-chain, Tokenomics, Sinais externos (redes sociais e histórico do dev não vêm nos dados: peça verificação manual).
O score e o nível de risco do contrato oficiais já foram calculados de forma determinística pelo sistema; NÃO recalcule, substitua ou invente outro score. Há também um detector separado de padrões agregados de negociação: explique seus sinais sem afirmar que eles provam bots, fraude ou wash trading. Dados agregados não permitem identificar a mesma carteira em compras e vendas nem relacionar carteiras por financiador.
Nunca recomende comprar ou vender.
Responda SOMENTE com JSON: {"resumo":string,"pontosAtencao":[string],"proximosPassos":[string]}
Máximo 5 itens em cada lista.`;

export const analisarReal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    entradaTokenSchema.parse(data),
  )
  .handler(async ({ data }): Promise<AnaliseReal> => {
    await limitarUso("analise-ia", 10, 60 * 60);
    const { coletarDados, notaRisco } = await import("./onchain.server");
    const dados = await coletarDados(data.rede, data.endereco);
    if (!dados.fontes.length) throw new Error("Token não encontrado nas fontes públicas disponíveis para essa rede.");
    const risco = notaRisco(dados.checagens, !dados.fontes.some((f) => f === "GoPlus Security" || f === "Solana RPC"));
    let parecer: ParecerIA | null = null;
    let erroIA: string | null = null;
    try {
      const p = extrairJson<ParecerIA>(await chamarIA(INSTRUCOES_PARECER, JSON.stringify({ ...dados, detectorManipulacao: manipulacao })));
      parecer = {
        resumo: String(p.resumo ?? ""),
        pontosAtencao: Array.isArray(p.pontosAtencao) ? p.pontosAtencao.slice(0, 5) : [],
        proximosPassos: Array.isArray(p.proximosPassos) ? p.proximosPassos.slice(0, 5) : [],
      };
    } catch (e) {
      erroIA = e instanceof Error ? e.message : "A IA não respondeu.";
    }
    return { dados, risco, manipulacao, parecer, erroIA, geradoEm: new Date().toISOString() };
  });

export const listarLancamentos = createServerFn({ method: "GET" }).handler(async () => {
  const { lancamentosRecentes } = await import("./onchain.server");
  const redes: Rede[] = ["solana", "bsc", "ethereum", "base"];
  return { tokens: await lancamentosRecentes(redes), atualizadoEm: new Date().toISOString() };
});

/** Checklist de segurança sob demanda, sem chamada à IA nem consumo de créditos de IA. */
export const analisarSegurancaPreLancamento = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    entradaTokenSchema.parse(data),
  )
  .handler(async ({ data }) => {
    await limitarUso("checklist-seguranca", 30, 10 * 60);
    const { coletarDados, notaRisco } = await import("./onchain.server");
    const dados = await coletarDados(data.rede, data.endereco);
    if (!dados.fontes.length) throw new Error("Não foi possível obter dados de mercado ou segurança para esse token.");
    const risco = notaRisco(dados.checagens, !dados.fontes.some((f) => f === "GoPlus Security" || f === "Solana RPC"));
    return { dados, risco, geradoEm: new Date().toISOString() };
  });

export const listarDesempenho = createServerFn({ method: "GET" }).handler(async () => {
  const { rankingDesempenho } = await import("./onchain.server");
  return rankingDesempenho();
});
