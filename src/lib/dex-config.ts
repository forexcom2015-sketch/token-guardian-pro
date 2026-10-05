 * Regras de negócio da DEX (compra de USDT com Pix, atendida pelo WhatsApp).
 * Para mudar taxa, valor mínimo ou o número de atendimento, edite só este arquivo.
 */

/** Taxa cobrada na compra, em pontos-base (300 = 3%). Descontada do valor pago. */
export const TAXA_COMPRA_BPS = 300;

/** Valor mínimo por compra, em reais. */
export const VALOR_MINIMO_BRL = 10;

/** Teto de sanidade do campo de valor (evita números absurdos/overflow), em reais. */
export const VALOR_MAXIMO_BRL = 10_000_000;

/** Faixa aceita para a cotação USDT/BRL; fora dela a cotação é tratada como indisponível. */
export const COTACAO_USDT_MIN_BRL = 1;
export const COTACAO_USDT_MAX_BRL = 50;

/**
 * Número oficial do atendimento no WhatsApp: só dígitos, com código do país e DDD
 * (ex.: "5584999999999"). Vazio = botão de compra desativado.
 */
export const WHATSAPP_NUMERO = "5584999461648";
/**
