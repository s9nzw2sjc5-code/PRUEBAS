import { calcularRejilla } from "../maquetacion";

const solapan = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  diametro: number,
  separacion: number,
) => Math.hypot(a.x - b.x, a.y - b.y) < diametro + separacion - 1e-6;

const comprobar = (anchoHoja: number, altoHoja: number) => {
  const entrada = {
    anchoHoja,
    altoHoja,
    diametro: 70,
    margen: 5,
    separacion: 2,
  };
  const { posiciones } = calcularRejilla(entrada);
  for (const p of posiciones) {
    expect(p.x).toBeGreaterThanOrEqual(5 - 1e-6);
    expect(p.y).toBeGreaterThanOrEqual(5 - 1e-6);
    expect(p.x + 70).toBeLessThanOrEqual(anchoHoja - 5 + 1e-6);
    expect(p.y + 70).toBeLessThanOrEqual(altoHoja - 5 + 1e-6);
  }
  posiciones.forEach((a, i) =>
    posiciones.slice(i + 1).forEach((b) => {
      expect(solapan(a, b, 70, 2)).toBe(false);
    }),
  );
  return posiciones.length;
};

describe("calcularRejilla", () => {
  it("mete 11 chapas de 58 mm en un A4 al tresbolillo", () => {
    expect(comprobar(210, 297)).toBe(11);
  });

  it("aprovecha el A3 sin salirse ni solapar", () => {
    expect(comprobar(297, 420)).toBeGreaterThanOrEqual(20);
  });

  it("devuelve una hoja vacía si el círculo no cabe", () => {
    expect(
      calcularRejilla({
        anchoHoja: 50,
        altoHoja: 50,
        diametro: 70,
        margen: 5,
        separacion: 2,
      }).posiciones,
    ).toHaveLength(0);
  });
});
