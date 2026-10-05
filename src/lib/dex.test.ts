import { describe, expect, it } from "vitest";
import { calcularCompra, cotacaoValida, lerReais } from "./dex-calculo";
import { linkWhatsapp, montarMensagem, numeroWhatsappValido } from "./dex-whatsapp";

describe("lerReais", () => {
  it("interpreta formatos comuns de valor em reais", () => {
    expect(lerReais("100")).toBe(100);
    expect(lerReais("100,50")).toBe(100.5);
    expect(lerReais("R$ 1.234,56")).toBe(1234.56);
    expect(lerReais("1.000")).toBe(1000);
    expect(lerReais("100.50")).toBe(100.5);
  });
  it("rejeita lixo, vazio e valores negativos", () => {
    for (const x of ["", " ", "abc", "-5", "1,2,3", "1e3", "10 20", "0x10"])
      expect(lerReais(x), x).toBeNaN();
  });
});

describe("cotacaoValida", () => {
  it("aceita só números finitos dentro da faixa de sanidade", () => {
    expect(cotacaoValida(5.4)).toBe(5.4);
    for (const x of [0, -1, 0.5, 1000, NaN, Infinity, "5", null, undefined])
      expect(cotacaoValida(x), String(x)).toBeNull();
  });
});

describe("calcularCompra (taxa de 3% descontada do valor pago)", () => {
  it("R$ 100 a R$ 5,00: paga 100, taxa 3, converte 97, recebe 19,40 USDT", () => {
    expect(calcularCompra(100, 5)).toEqual({
      pagoCent: 10000,
      taxaCent: 300,
      liquidoCent: 9700,
      usdtCent: 1940,
    });
  });

  it("arredonda a taxa ao centavo (meio para cima) e o USDT sempre para baixo", () => {
    // 3% de R$ 10,50 = 0,315 → 0,32
    expect(calcularCompra(10.5, 5)?.taxaCent).toBe(32);
    // 97,00 / 5,43 = 17,8637… → 17,86 (nunca 17,87)
    expect(calcularCompra(100, 5.43)?.usdtCent).toBe(1786);
  });

  it("pago = taxa + convertido, e o USDT entregue nunca vale mais que o valor convertido", () => {
    for (const reais of [10, 10.01, 33.33, 99.99, 250.75, 1234.56, 99999.99]) {
      for (const preco of [4.9, 5.43, 5.4321, 6.01]) {
        const c = calcularCompra(reais, preco)!;
        expect(c.taxaCent + c.liquidoCent).toBe(c.pagoCent);
        expect((c.usdtCent / 100) * preco).toBeLessThanOrEqual(c.liquidoCent / 100 + 1e-9);
      }
    }
  });

  it("respeita mínimo e máximo e exige cotação válida", () => {
    expect(calcularCompra(9.99, 5)).toBeNull();
    expect(calcularCompra(10, 5)).not.toBeNull();
    expect(calcularCompra(10_000_001, 5)).toBeNull();
    expect(calcularCompra(NaN, 5)).toBeNull();
    expect(calcularCompra(100, null)).toBeNull();
    expect(calcularCompra(100, 0)).toBeNull();
  });
});

describe("WhatsApp", () => {
  const compra = calcularCompra(100, 5)!;
  const carteira = "0x" + "ab".repeat(20);

  it("valida o número de atendimento (só dígitos, 10 a 15)", () => {
    expect(numeroWhatsappValido("5584999999999")).toBe(true);
    for (const n of ["", "123", "+5584999999999", "55 84 99999 9999", "55849999999991234"])
      expect(numeroWhatsappValido(n), n).toBe(false);
  });

  it("sem número configurado não gera link", () => {
    expect(linkWhatsapp("", "oi")).toBeNull();
  });

  it("a mensagem traz valor, taxa, cotação, quanto recebe, rede e carteira válida", () => {
    const m = montarMensagem({ compra, precoUsdtBrl: 5, rede: "BNB Chain (BEP-20)", carteira });
    expect(m).toContain("R$");
    expect(m).toContain("Taxa (3%)");
    expect(m).toContain("19,40 USDT");
    expect(m).toContain("BNB Chain (BEP-20)");
    expect(m).toContain(carteira);
  });

  it("carteira inválida ou ausente não entra na mensagem", () => {
    expect(
      montarMensagem({ compra, precoUsdtBrl: 5, rede: "Base", carteira: "0x123" }),
    ).not.toContain("Carteira:");
    expect(montarMensagem({ compra, precoUsdtBrl: 5, rede: "Base", carteira: null })).not.toContain(
      "Carteira:",
    );
  });

  it("o link usa wa.me com o texto codificado (sem quebrar a URL)", () => {
    const link = linkWhatsapp(
      "5584999999999",
      montarMensagem({ compra, precoUsdtBrl: 5, rede: "Base", carteira }),
    )!;
    expect(link.startsWith("https://wa.me/5584999999999?text=")).toBe(true);
    expect(link).not.toMatch(/\s/);
    expect(decodeURIComponent(link.split("?text=")[1]!)).toContain("Quero comprar USDT");
  });
});