// Convierte las medidas de chapas y tazas en páginas de Canva: formas rellenas
// con la foto (la "máscara de recorte") más un grupo de guías que se borra
// antes de imprimir.
import type {
  ElementAtPoint,
  Fill,
  ImageRef,
  ShapeElementAtPoint,
} from "@canva/design";
import { trazadoCirculo, trazadoRectangulo } from "./formas";
import { calcularRejilla } from "./maquetacion";
import type { ConfigChapa, ConfigHoja, ConfigTaza, Hoja } from "./medidas";
import { HOJAS, mmAPx } from "./medidas";

export type Pagina = {
  titulo: string;
  dimensiones: { width: number; height: number };
  elementos: ElementAtPoint[];
};

const COLOR_HUECO = "#e4e4ea";
const COLOR_CORTE = "#000000";
const COLOR_CARA = "#e6007e";
const COLOR_SEGURA = "#0096d6";
const GROSOR_CORTE = 1;
const GROSOR_GUIA = 1.5;

// Con foto, la forma la recorta; sin foto queda un hueco gris donde se puede
// arrastrar una imagen desde Canva, igual que en un marco.
const relleno = (foto: ImageRef | undefined): Fill =>
  foto
    ? { dropTarget: true, asset: { type: "image", ref: foto } }
    : { dropTarget: true, color: COLOR_HUECO };

const circulo = (
  izquierda: number,
  arriba: number,
  diametro: number,
  fill: Fill,
  stroke?: { weight: number; color: string },
): ShapeElementAtPoint => ({
  type: "shape",
  top: arriba,
  left: izquierda,
  width: diametro,
  height: diametro,
  viewBox: { top: 0, left: 0, width: diametro, height: diametro },
  paths: [
    {
      d: trazadoCirculo(diametro / 2, diametro / 2, diametro / 2),
      fill,
      stroke: stroke && { ...stroke, strokeAlign: "inset" },
    },
  ],
});

const rectangulo = (
  izquierda: number,
  arriba: number,
  ancho: number,
  alto: number,
  fill: Fill,
  stroke?: { weight: number; color: string },
): ShapeElementAtPoint => ({
  type: "shape",
  top: arriba,
  left: izquierda,
  width: ancho,
  height: alto,
  viewBox: { top: 0, left: 0, width: ancho, height: alto },
  paths: [
    {
      d: trazadoRectangulo(0, 0, ancho, alto),
      fill,
      stroke: stroke && { ...stroke, strokeAlign: "inset" },
    },
  ],
});

// Canva exige al menos dos elementos para formar un grupo.
const grupoDeGuias = (guias: ShapeElementAtPoint[]): ElementAtPoint[] => {
  if (guias.length < 2) return guias;
  const izquierda = Math.min(...guias.map((g) => g.left));
  const arriba = Math.min(...guias.map((g) => g.top));
  const derecha = Math.max(...guias.map((g) => g.left + anchoDe(g)));
  const abajo = Math.max(...guias.map((g) => g.top + altoDe(g)));
  return [
    {
      type: "group",
      top: arriba,
      left: izquierda,
      width: derecha - izquierda,
      height: abajo - arriba,
      children: guias.map((g) => ({
        ...g,
        top: g.top - arriba,
        left: g.left - izquierda,
      })),
    },
  ];
};

const anchoDe = (e: ShapeElementAtPoint) =>
  typeof e.width === "number" ? e.width : 0;
const altoDe = (e: ShapeElementAtPoint) =>
  typeof e.height === "number" ? e.height : 0;

export const huecosPorHoja = (
  hoja: Hoja,
  chapa: ConfigChapa,
  ajustes: ConfigHoja,
): number =>
  calcularRejilla({
    anchoHoja: HOJAS[hoja].anchoMm,
    altoHoja: HOJAS[hoja].altoMm,
    diametro: chapa.corteMm,
    margen: ajustes.margenMm,
    separacion: ajustes.separacionMm,
  }).posiciones.length;

export const paginasDeChapas = ({
  hoja,
  chapa,
  ajustes,
  fotos,
  lineaDeCorte,
  guias,
  repetirFoto,
}: {
  hoja: Hoja;
  chapa: ConfigChapa;
  ajustes: ConfigHoja;
  fotos: ImageRef[];
  lineaDeCorte: boolean;
  guias: boolean;
  // Una sola foto repetida en todos los huecos de la hoja.
  repetirFoto: boolean;
}): Pagina[] => {
  const { anchoMm, altoMm } = HOJAS[hoja];
  const { posiciones } = calcularRejilla({
    anchoHoja: anchoMm,
    altoHoja: altoMm,
    diametro: chapa.corteMm,
    margen: ajustes.margenMm,
    separacion: ajustes.separacionMm,
  });
  const porHoja = posiciones.length;
  if (porHoja === 0) return [];

  const repetida = repetirFoto ? fotos[0] : undefined;
  const totalHojas = repetida
    ? 1
    : Math.max(1, Math.ceil(fotos.length / porHoja));
  const corte = mmAPx(chapa.corteMm);
  const cara = mmAPx(chapa.caraMm);
  const segura = mmAPx(chapa.seguraMm);

  const paginas: Pagina[] = [];
  for (let h = 0; h < totalHojas; h++) {
    const fotosHoja = repetida
      ? posiciones.map(() => repetida)
      : fotos.slice(h * porHoja, (h + 1) * porHoja);
    const recortes: ElementAtPoint[] = [];
    const lineasGuia: ShapeElementAtPoint[] = [];
    posiciones.forEach((p, i) => {
      const x = mmAPx(p.x);
      const y = mmAPx(p.y);
      recortes.push(
        circulo(
          x,
          y,
          corte,
          relleno(fotosHoja[i]),
          lineaDeCorte
            ? { weight: GROSOR_CORTE, color: COLOR_CORTE }
            : undefined,
        ),
      );
      if (guias) {
        const sinRelleno: Fill = { dropTarget: false };
        lineasGuia.push(
          circulo(
            x + (corte - cara) / 2,
            y + (corte - cara) / 2,
            cara,
            sinRelleno,
            { weight: GROSOR_GUIA, color: COLOR_CARA },
          ),
          circulo(
            x + (corte - segura) / 2,
            y + (corte - segura) / 2,
            segura,
            sinRelleno,
            { weight: GROSOR_GUIA, color: COLOR_SEGURA },
          ),
        );
      }
    });
    paginas.push({
      titulo: `Chapas ${chapa.caraMm} mm · ${hoja}${
        totalHojas > 1 ? ` (${h + 1}/${totalHojas})` : ""
      }`,
      dimensiones: { width: mmAPx(anchoMm), height: mmAPx(altoMm) },
      elementos: [...recortes, ...grupoDeGuias(lineasGuia)],
    });
  }
  return paginas;
};

// Medidas con coma decimal, como se escriben en español.
const cm = (mm: number) => String(mm / 10).replace(".", ",");

export const paginasDeTazas = ({
  taza,
  fotos,
  guias,
}: {
  taza: ConfigTaza;
  fotos: ImageRef[];
  guias: boolean;
}): Pagina[] => {
  const ancho = mmAPx(taza.anchoMm);
  const alto = mmAPx(taza.altoMm);
  const margen = mmAPx(taza.margenSeguroMm);
  const lista: (ImageRef | undefined)[] =
    fotos.length > 0 ? fotos : [undefined];

  return lista.map((foto, i) => {
    const elementos: ElementAtPoint[] = [
      rectangulo(0, 0, ancho, alto, relleno(foto)),
    ];
    if (guias) {
      const sinRelleno: Fill = { dropTarget: false };
      elementos.push(
        ...grupoDeGuias([
          rectangulo(
            margen,
            margen,
            ancho - 2 * margen,
            alto - 2 * margen,
            sinRelleno,
            { weight: GROSOR_GUIA, color: COLOR_SEGURA },
          ),
          // Centro del diseño: la cara de la taza contraria al asa.
          rectangulo(ancho / 2 - 0.75, 0, 1.5, alto, {
            dropTarget: false,
            color: COLOR_CARA,
          }),
        ]),
      );
    }
    return {
      titulo: `Taza ${cm(taza.anchoMm)} × ${cm(taza.altoMm)} cm${
        lista.length > 1 ? ` (${i + 1}/${lista.length})` : ""
      }`,
      dimensiones: { width: ancho, height: alto },
      elementos,
    };
  });
};
