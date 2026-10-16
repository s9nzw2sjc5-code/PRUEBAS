import type { ImageRef, ShapeElementAtPoint } from "@canva/design";
import { CHAPA_58, HOJA_POR_DEFECTO, TAZA_ESTANDAR } from "../medidas";
import { paginasDeChapas, paginasDeTazas } from "../paginas";

const foto = (n: number) => `foto-${n}` as ImageRef;
const fotos = (cantidad: number) =>
  Array.from({ length: cantidad }, (_, i) => foto(i));

const base = {
  hoja: "A4" as const,
  chapa: CHAPA_58,
  ajustes: HOJA_POR_DEFECTO,
  lineaDeCorte: true,
  guias: true,
  repetirFoto: false,
};

describe("paginasDeChapas", () => {
  it("reparte las fotos en varias hojas A4", () => {
    const paginas = paginasDeChapas({ ...base, fotos: fotos(13) });
    expect(paginas).toHaveLength(2);
    expect(paginas[0]?.dimensiones.width).toBeCloseTo(793.7, 0);
    expect(paginas[0]?.dimensiones.height).toBeCloseTo(1122.5, 0);

    const recortes = paginas[1]?.elementos.filter(
      (e): e is ShapeElementAtPoint => e.type === "shape",
    );
    expect(recortes).toHaveLength(11);
    // Hoja 2: dos fotos y el resto huecos vacíos donde arrastrar imágenes.
    const conFoto = recortes?.filter((r) => r.paths[0]?.fill.asset);
    expect(conFoto?.map((r) => r.paths[0]?.fill.asset?.ref)).toEqual([
      foto(11),
      foto(12),
    ]);
    expect(recortes?.every((r) => r.paths[0]?.fill.dropTarget)).toBe(true);
  });

  it("agrupa las guías en un solo elemento por hoja", () => {
    const [pagina] = paginasDeChapas({ ...base, fotos: fotos(1) });
    const grupos = pagina?.elementos.filter((e) => e.type === "group");
    expect(grupos).toHaveLength(1);
    const grupo = grupos?.[0];
    expect(grupo?.type === "group" && grupo.children).toHaveLength(22);
  });

  it("repite una foto en toda la hoja", () => {
    const paginas = paginasDeChapas({
      ...base,
      fotos: fotos(3),
      repetirFoto: true,
      guias: false,
    });
    expect(paginas).toHaveLength(1);
    const refs = paginas[0]?.elementos.map(
      (e) => e.type === "shape" && e.paths[0]?.fill.asset?.ref,
    );
    expect(new Set(refs)).toEqual(new Set([foto(0)]));
  });

  it("sin fotos crea una hoja de marcos vacíos", () => {
    const paginas = paginasDeChapas({ ...base, fotos: [], guias: false });
    expect(paginas).toHaveLength(1);
    expect(paginas[0]?.elementos).toHaveLength(11);
  });

  it("respeta los límites de los trazados de Canva", () => {
    const [pagina] = paginasDeChapas({ ...base, fotos: fotos(1) });
    for (const e of pagina?.elementos ?? []) {
      const formas = e.type === "group" ? e.children : [e];
      for (const f of formas) {
        if (f.type !== "shape") continue;
        for (const p of f.paths) {
          expect(p.d.match(/M/g)).toHaveLength(1);
          expect(p.d).not.toMatch(/Q/);
          expect(p.d.trim().endsWith("Z")).toBe(true);
        }
      }
    }
  });
});

describe("paginasDeTazas", () => {
  it("crea una página de 20 × 9,5 cm por foto", () => {
    const paginas = paginasDeTazas({
      taza: TAZA_ESTANDAR,
      fotos: fotos(2),
      guias: true,
    });
    expect(paginas).toHaveLength(2);
    expect(paginas[0]?.dimensiones.width).toBeCloseTo(755.9, 0);
    expect(paginas[0]?.dimensiones.height).toBeCloseTo(359.1, 0);
    expect(paginas[0]?.titulo).toBe("Taza 20 × 9,5 cm (1/2)");
  });
});
