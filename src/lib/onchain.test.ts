import { describe, expect, it } from "vitest";
import { notaRisco, type Checagem } from "./onchain.server";

const checagem = (
  nivel: Checagem["nivel"],
  criterio = "Teste",
): Checagem => ({
  categoria: "Teste",
  criterio,
  nivel,
  valor: "valor",
});

describe("notaRisco", () => {
  it("treats an empty checklist as insufficient data, not as zero risk", () => {
    const risco = notaRisco([], false);

    expect(risco.nota).toBe(50);
    expect(risco.nivel).toBe("alto");
    expect(risco.cobertura).toBe("insuficiente");
    expect(risco.desconhecidos).toBe(0);
    expect(risco.semSeguranca).toBe(true);
  });

  it("scores high, medium and unknown signals deterministically", () => {
    const risco = notaRisco(
      [
        checagem("alto", "Blacklist"),
        checagem("medio", "Liquidez"),
        checagem("desconhecido", "Ownership"),
        checagem("baixo", "LP"),
        checagem("baixo", "Contrato"),
        checagem("baixo", "Taxa de compra"),
        checagem("baixo", "Taxa de venda"),
      ],
      false,
    );

    expect(risco.nota).toBe(25);
    expect(risco.nivel).toBe("medio");
    expect(risco.altos).toBe(1);
    expect(risco.medios).toBe(1);
    expect(risco.desconhecidos).toBe(1);
    expect(risco.cobertura).toBe("completa");
  });

  it("applies the critical-signal aggravator case-insensitively", () => {
    const risco = notaRisco([checagem("alto", "honeypot")], false);

    expect(risco.nota).toBe(40);
    expect(risco.nivel).toBe("medio");
    expect(risco.alertas).toEqual(["Honeypot"]);
    expect(risco.itens.at(-1)?.criterio).toBe("Sinal crítico (honeypot/freeze/mint)");
  });

  it("marks security coverage as insufficient when the security source is unavailable", () => {
    const risco = notaRisco([checagem("baixo")], true);

    expect(risco.nota).toBe(50);
    expect(risco.nivel).toBe("alto");
    expect(risco.semSeguranca).toBe(true);
    expect(risco.cobertura).toBe("insuficiente");
    expect(risco.itens.at(-1)?.criterio).toBe("Sem checagem de segurança");
  });

  it("marks coverage as partial when multiple signals are unknown", () => {
    const risco = notaRisco(
      [
        checagem("desconhecido", "A"),
        checagem("desconhecido", "B"),
        checagem("desconhecido", "C"),
      ],
      false,
    );

    expect(risco.cobertura).toBe("parcial");
    expect(risco.nota).toBe(12);
  });

  it("marks coverage partial when at least a quarter of checks are unknown", () => {
    const risco = notaRisco(
      [
        checagem("baixo", "A"),
        checagem("baixo", "B"),
        checagem("baixo", "C"),
        checagem("desconhecido", "D"),
      ],
      false,
    );

    expect(risco.desconhecidos).toBe(1);
    expect(risco.cobertura).toBe("parcial");
  });

  it("caps the deterministic score at 100", () => {
    const risco = notaRisco(
      Array.from({ length: 20 }, () => checagem("alto")),
      false,
    );

    expect(risco.nota).toBe(100);
    expect(risco.nivel).toBe("alto");
  });
});
