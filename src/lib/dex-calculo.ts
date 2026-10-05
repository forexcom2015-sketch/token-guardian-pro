import {
  COTACAO_USDT_MAX_BRL,
  COTACAO_USDT_MIN_BRL,
  TAXA_COMPRA_BPS,
  VALOR_MAXIMO_BRL,
  VALOR_MINIMO_BRL,
} from "./dex-config";

export type Compra = {
  /** Quanto o comprador paga (centavos de R$). */
  pagoCent: number;
  /** Taxa da plataforma (centavos de R$), arredondada ao centavo. */
  taxaCent: number;
  /** Valor que de fato é convertido em USDT (centavos de R$). */
  liquidoCent: number;
  /** USDT que o comprador recebe, em centavos de USDT (sempre arredondado para baixo). */
  usdtCent: number;
};

/**
 * Lê um valor em reais digitado pelo usuário. Aceita "100", "100,50", "1.234,56", "1.000" (milhar),
 * "100.50" (ponto decimal) e prefixo "R$". Retorna NaN se não der para interpretar.
 */
export function lerReais(texto: string): number {
  const limpo = texto.replace(/R\$/gi, "").trim(); // espaço no meio do número ("10 20") é inválido
  if (!limpo) return NaN;
  let normal: string;
  if (limpo.includes(",")) normal = limpo.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) normal = limpo.replace(/\./g, "");
  else normal = limpo;
  if (!/^\d+(\.\d+)?$/.test(normal)) return NaN;
  return Number(normal);
}

/** Cotação válida (número finito dentro da faixa de sanidade) ou null. */
export function cotacaoValida(preco: unknown): number | null {
  return typeof preco === "number" &&
    Number.isFinite(preco) &&
    preco >= COTACAO_USDT_MIN_BRL &&
    preco <= COTACAO_USDT_MAX_BRL
    ? preco
    : null;
}

/**
 * Calcula a compra: paga R$ X → taxa (X × TAXA, arredondada ao centavo, meio para cima) →
 * o restante é convertido pela cotação, arredondando o USDT para BAIXO (nunca prometer mais do que será entregue).
 * Retorna null se o valor ou a cotação forem inválidos ou o valor estiver fora dos limites.
 */
export function calcularCompra(reaisPagos: number, precoUsdtBrl: number | null): Compra | null {
  if (
    !Number.isFinite(reaisPagos) ||
    reaisPagos < VALOR_MINIMO_BRL ||
    reaisPagos > VALOR_MAXIMO_BRL
  )
    return null;
  const preco = cotacaoValida(precoUsdtBrl);
  if (preco === null) return null;
  const pagoCent = Math.round(reaisPagos * 100);
  const taxaCent = Math.floor((pagoCent * TAXA_COMPRA_BPS + 5000) / 10_000);
  const liquidoCent = pagoCent - taxaCent;
  const usdtCent = Math.floor(liquidoCent / preco + 1e-9);
  return { pagoCent, taxaCent, liquidoCent, usdtCent };
}
import {
  COTACAO_USDT_MAX_BRL,
  COTACAO_USDT_MIN_BRL,
  TAXA_COMPRA_BPS,
  VALOR_MAXIMO_BRL,
  VALOR_MINIMO_BRL,
} from "./dex-config";

export type Compra = {
  /** Quanto o comprador paga (centavos de R$). */
  pagoCent: number;
  /** Taxa da plataforma (centavos de R$), arredondada ao centavo. */
  taxaCent: number;
  /** Valor que de fato é convertido em USDT (centavos de R$). */
  liquidoCent: number;
  /** USDT que o comprador recebe, em centavos de USDT (sempre arredondado para baixo). */
  usdtCent: number;
};

/**
 * Lê um valor em reais digitado pelo usuário. Aceita "100", "100,50", "1.234,56", "1.000" (milhar),
 * "100.50" (ponto decimal) e prefixo "R$". Retorna NaN se não der para interpretar.
 */
export function lerReais(texto: string): number {
  const limpo = texto.replace(/R\$/gi, "").trim(); // espaço no meio do número ("10 20") é inválido
  if (!limpo) return NaN;
  let normal: string;
  if (limpo.includes(",")) normal = limpo.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) normal = limpo.replace(/\./g, "");
  else normal = limpo;
  if (!/^\d+(\.\d+)?$/.test(normal)) return NaN;
  return Number(normal);
}

/** Cotação válida (número finito dentro da faixa de sanidade) ou null. */
export function cotacaoValida(preco: unknown): number | null {
  return typeof preco === "number" &&
    Number.isFinite(preco) &&
    preco >= COTACAO_USDT_MIN_BRL &&
    preco <= COTACAO_USDT_MAX_BRL
    ? preco
    : null;
}

/**
 * Calcula a compra: paga R$ X → taxa (X × TAXA, arredondada ao centavo, meio para cima) →
 * o restante é convertido pela cotação, arredondando o USDT para BAIXO (nunca prometer mais do que será entregue).
 * Retorna null se o valor ou a cotação forem inválidos ou o valor estiver fora dos limites.
 */
export function calcularCompra(reaisPagos: number, precoUsdtBrl: number | null): Compra | null {
  if (
    !Number.isFinite(reaisPagos) ||
    reaisPagos < VALOR_MINIMO_BRL ||
    reaisPagos > VALOR_MAXIMO_BRL
  )
    return null;
  const preco = cotacaoValida(precoUsdtBrl);
  if (preco === null) return null;
  const pagoCent = Math.round(reaisPagos * 100);
  const taxaCent = Math.floor((pagoCent * TAXA_COMPRA_BPS + 5000) / 10_000);
  const liquidoCent = pagoCent - taxaCent;
  const usdtCent = Math.floor(liquidoCent / preco + 1e-9);
  return { pagoCent, taxaCent, liquidoCent, usdtCent };
}
  COTACAO_USDT_MAX_BRL,
  COTACAO_USDT_MIN_BRL,
  TAXA_COMPRA_BPS,
  VALOR_MAXIMO_BRL,
  VALOR_MINIMO_BRL,
} from "./dex-config";

export type Compra = {
  /** Quanto o comprador paga (centavos de R$). */
  pagoCent: number;
  /** Taxa da plataforma (centavos de R$), arredondada ao centavo. */
  taxaCent: number;
  /** Valor que de fato é convertido em USDT (centavos de R$). */
  liquidoCent: number;
  /** USDT que o comprador recebe, em centavos de USDT (sempre arredondado para baixo). */
  usdtCent: number;
};

/**
 * Lê um valor em reais digitado pelo usuário. Aceita "100", "100,50", "1.234,56", "1.000" (milhar),
 * "100.50" (ponto decimal) e prefixo "R$". Retorna NaN se não der para interpretar.
 */
export function lerReais(texto: string): number {
  const limpo = texto.replace(/R\$/gi, "").trim(); // espaço no meio do número ("10 20") é inválido
  if (!limpo) return NaN;
  let normal: string;
  if (limpo.includes(",")) normal = limpo.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) normal = limpo.replace(/\./g, "");
  else normal = limpo;
  if (!/^\d+(\.\d+)?$/.test(normal)) return NaN;
  return Number(normal);
}

/** Cotação válida (número finito dentro da faixa de sanidade) ou null. */
export function cotacaoValida(preco: unknown): number | null {
  return typeof preco === "number" &&
    Number.isFinite(preco) &&
    preco >= COTACAO_USDT_MIN_BRL &&
    preco <= COTACAO_USDT_MAX_BRL
    ? preco
    : null;
}

/**
 * Calcula a compra: paga R$ X → taxa (X × TAXA, arredondada ao centavo, meio para cima) →
 * o restante é convertido pela cotação, arredondando o USDT para BAIXO (nunca prometer mais do que será entregue).
 * Retorna null se o valor ou a cotação forem inválidos ou o valor estiver fora dos limites.
 */
export function calcularCompra(reaisPagos: number, precoUsdtBrl: number | null): Compra | null {
  if (
    !Number.isFinite(reaisPagos) ||
    reaisPagos < VALOR_MINIMO_BRL ||
    reaisPagos > VALOR_MAXIMO_BRL
  )
    return null;
  const preco = cotacaoValida(precoUsdtBrl);
  if (preco === null) return null;
  const pagoCent = Math.round(reaisPagos * 100);
  const taxaCent = Math.floor((pagoCent * TAXA_COMPRA_BPS + 5000) / 10_000);
  const liquidoCent = pagoCent - taxaCent;
  const usdtCent = Math.floor(liquidoCent / preco + 1e-9);
  return { pagoCent, taxaCent, liquidoCent, usdtCent };
}
import {
