// Trazados SVG compatibles con las formas de Canva: un solo comando M,
// sin comandos Q y siempre cerrados con Z.

// Constante para aproximar un cuarto de círculo con una curva Bézier cúbica.
const K = 0.5522847498;

const n = (v: number) => Number(v.toFixed(3));

export const trazadoCirculo = (cx: number, cy: number, r: number): string => {
  const k = r * K;
  return [
    `M ${n(cx)} ${n(cy - r)}`,
    `C ${n(cx + k)} ${n(cy - r)} ${n(cx + r)} ${n(cy - k)} ${n(cx + r)} ${n(cy)}`,
    `C ${n(cx + r)} ${n(cy + k)} ${n(cx + k)} ${n(cy + r)} ${n(cx)} ${n(cy + r)}`,
    `C ${n(cx - k)} ${n(cy + r)} ${n(cx - r)} ${n(cy + k)} ${n(cx - r)} ${n(cy)}`,
    `C ${n(cx - r)} ${n(cy - k)} ${n(cx - k)} ${n(cy - r)} ${n(cx)} ${n(cy - r)}`,
    "Z",
  ].join(" ");
};

export const trazadoRectangulo = (
  x: number,
  y: number,
  ancho: number,
  alto: number,
): string =>
  `M ${n(x)} ${n(y)} L ${n(x + ancho)} ${n(y)} L ${n(x + ancho)} ${n(
    y + alto,
  )} L ${n(x)} ${n(y + alto)} Z`;
