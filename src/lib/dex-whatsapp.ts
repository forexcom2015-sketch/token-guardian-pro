import { TAXA_COMPRA_BPS } from "./dex-config";
import type { Compra } from "./dex-calculo";

const brl = (cent: number) =>
  (cent / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const usdt = (cent: number) =>
  (cent / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CARTEIRA_EVM = /^0x[a-fA-F0-9]{40}$/;
const NUMERO_WHATSAPP = /^\d{10,15}$/;

export function numeroWhatsappValido(numero: string): boolean {
  return NUMERO_WHATSAPP.test(numero);
}

export type DadosPedido = {
  compra: Compra;
  /** Cotação de referência (R$ por 1 USDT) usada no cálculo. */
  precoUsdtBrl: number;
  /** Nome legível da rede escolhida, ex.: "BNB Chain (BEP-20)". */
  rede: string;
  /** Carteira EVM conectada (opcional); só entra na mensagem se for um endereço válido. */
  carteira?: string | null;
};

/** Texto pré-preenchido que abre a conversa no WhatsApp. O valor final é sempre confirmado no atendimento. */
export function montarMensagem({ compra, precoUsdtBrl, rede, carteira }: DadosPedido): string {
  const linhas = [
    "Olá! Quero comprar USDT pelo Token Guardian.",
    "",
    `Valor a pagar (Pix): ${brl(compra.pagoCent)}`,
    `Taxa (${TAXA_COMPRA_BPS / 100}%): ${brl(compra.taxaCent)}`,
    `Cotação de referência: 1 USDT = ${precoUsdtBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    `Receberei aproximadamente: ${usdt(compra.usdtCent)} USDT`,
    `Rede: ${rede}`,
  ];
  if (carteira && CARTEIRA_EVM.test(carteira)) linhas.push(`Carteira: ${carteira}`);
  linhas.push("", "Podem confirmar o valor final e como pagar?");
  return linhas.join("\n");
}

/** Link wa.me com a mensagem; null se o número de atendimento não estiver configurado/for inválido. */
export function linkWhatsapp(numero: string, mensagem: string): string | null {
  if (!numeroWhatsappValido(numero)) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
import { TAXA_COMPRA_BPS } from "./dex-config";
import type { Compra } from "./dex-calculo";

const brl = (cent: number) =>
  (cent / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const usdt = (cent: number) =>
  (cent / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CARTEIRA_EVM = /^0x[a-fA-F0-9]{40}$/;
const NUMERO_WHATSAPP = /^\d{10,15}$/;

export function numeroWhatsappValido(numero: string): boolean {
  return NUMERO_WHATSAPP.test(numero);
}

export type DadosPedido = {
  compra: Compra;
  /** Cotação de referência (R$ por 1 USDT) usada no cálculo. */
  precoUsdtBrl: number;
  /** Nome legível da rede escolhida, ex.: "BNB Chain (BEP-20)". */
  rede: string;
  /** Carteira EVM conectada (opcional); só entra na mensagem se for um endereço válido. */
  carteira?: string | null;
};

/** Texto pré-preenchido que abre a conversa no WhatsApp. O valor final é sempre confirmado no atendimento. */
export function montarMensagem({ compra, precoUsdtBrl, rede, carteira }: DadosPedido): string {
  const linhas = [
    "Olá! Quero comprar USDT pelo Token Guardian.",
    "",
    `Valor a pagar (Pix): ${brl(compra.pagoCent)}`,
    `Taxa (${TAXA_COMPRA_BPS / 100}%): ${brl(compra.taxaCent)}`,
    `Cotação de referência: 1 USDT = ${precoUsdtBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    `Receberei aproximadamente: ${usdt(compra.usdtCent)} USDT`,
    `Rede: ${rede}`,
  ];
  if (carteira && CARTEIRA_EVM.test(carteira)) linhas.push(`Carteira: ${carteira}`);
  linhas.push("", "Podem confirmar o valor final e como pagar?");
  return linhas.join("\n");
}

/** Link wa.me com a mensagem; null se o número de atendimento não estiver configurado/for inválido. */
export function linkWhatsapp(numero: string, mensagem: string): string | null {
  if (!numeroWhatsappValido(numero)) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
import type { Compra } from "./dex-calculo";

const brl = (cent: number) =>
  (cent / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const usdt = (cent: number) =>
  (cent / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CARTEIRA_EVM = /^0x[a-fA-F0-9]{40}$/;
const NUMERO_WHATSAPP = /^\d{10,15}$/;

export function numeroWhatsappValido(numero: string): boolean {
  return NUMERO_WHATSAPP.test(numero);
}

export type DadosPedido = {
  compra: Compra;
  /** Cotação de referência (R$ por 1 USDT) usada no cálculo. */
  precoUsdtBrl: number;
  /** Nome legível da rede escolhida, ex.: "BNB Chain (BEP-20)". */
  rede: string;
  /** Carteira EVM conectada (opcional); só entra na mensagem se for um endereço válido. */
  carteira?: string | null;
};

/** Texto pré-preenchido que abre a conversa no WhatsApp. O valor final é sempre confirmado no atendimento. */
export function montarMensagem({ compra, precoUsdtBrl, rede, carteira }: DadosPedido): string {
  const linhas = [
    "Olá! Quero comprar USDT pelo Token Guardian.",
    "",
    `Valor a pagar (Pix): ${brl(compra.pagoCent)}`,
    `Taxa (${TAXA_COMPRA_BPS / 100}%): ${brl(compra.taxaCent)}`,
    `Cotação de referência: 1 USDT = ${precoUsdtBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    `Receberei aproximadamente: ${usdt(compra.usdtCent)} USDT`,
    `Rede: ${rede}`,
  ];
  if (carteira && CARTEIRA_EVM.test(carteira)) linhas.push(`Carteira: ${carteira}`);
  linhas.push("", "Podem confirmar o valor final e como pagar?");
  return linhas.join("\n");
}

/** Link wa.me com a mensagem; null se o número de atendimento não estiver configurado/for inválido. */
export function linkWhatsapp(numero: string, mensagem: string): string | null {
  if (!numeroWhatsappValido(numero)) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
import { TAXA_COMPRA_BPS } from "./dex-config";
