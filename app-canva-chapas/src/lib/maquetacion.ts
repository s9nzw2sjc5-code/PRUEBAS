// Calcula cuántos círculos caben en una hoja y dónde va cada uno.
// Todas las medidas están en milímetros.

export type Posicion = { x: number; y: number };

export type Rejilla = {
  // Esquina superior izquierda de cada círculo.
  posiciones: Posicion[];
  disposicion: "cuadricula" | "tresbolillo";
};

type Entrada = {
  anchoHoja: number;
  altoHoja: number;
  diametro: number;
  margen: number;
  separacion: number;
};

const EPS = 1e-6;

const cuadricula = ({
  anchoHoja,
  altoHoja,
  diametro,
  margen,
  separacion,
}: Entrada): Posicion[] => {
  const paso = diametro + separacion;
  const columnas = Math.floor(
    (anchoHoja - 2 * margen + separacion + EPS) / paso,
  );
  const filas = Math.floor((altoHoja - 2 * margen + separacion + EPS) / paso);
  const posiciones: Posicion[] = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      posiciones.push({ x: c * paso, y: f * paso });
    }
  }
  return posiciones;
};

// Filas desplazadas medio círculo (como las naranjas en una caja): suele
// aprovechar mejor el papel.
const tresbolilloFilas = ({
  anchoHoja,
  altoHoja,
  diametro,
  margen,
  separacion,
}: Entrada): Posicion[] => {
  const paso = diametro + separacion;
  const pasoFila = (paso * Math.sqrt(3)) / 2;
  const utilAncho = anchoHoja - 2 * margen;
  const utilAlto = altoHoja - 2 * margen;
  if (utilAlto + EPS < diametro) return [];
  const filas = Math.floor((utilAlto - diametro + EPS) / pasoFila) + 1;
  const posiciones: Posicion[] = [];
  for (let f = 0; f < filas; f++) {
    const desplazamiento = f % 2 === 1 ? paso / 2 : 0;
    const columnas = Math.floor(
      (utilAncho - desplazamiento + separacion + EPS) / paso,
    );
    for (let c = 0; c < columnas; c++) {
      posiciones.push({ x: desplazamiento + c * paso, y: f * pasoFila });
    }
  }
  return posiciones;
};

const tresbolilloColumnas = (e: Entrada): Posicion[] =>
  tresbolilloFilas({ ...e, anchoHoja: e.altoHoja, altoHoja: e.anchoHoja }).map(
    ({ x, y }) => ({ x: y, y: x }),
  );

// Centra el bloque de círculos en la hoja.
const centrar = (
  posiciones: Posicion[],
  { anchoHoja, altoHoja, diametro }: Entrada,
): Posicion[] => {
  if (posiciones.length === 0) return [];
  const maxX = Math.max(...posiciones.map((p) => p.x)) + diametro;
  const maxY = Math.max(...posiciones.map((p) => p.y)) + diametro;
  const dx = (anchoHoja - maxX) / 2;
  const dy = (altoHoja - maxY) / 2;
  return posiciones.map(({ x, y }) => ({ x: x + dx, y: y + dy }));
};

export const calcularRejilla = (entrada: Entrada): Rejilla => {
  const opciones: Rejilla[] = [
    { posiciones: cuadricula(entrada), disposicion: "cuadricula" },
    { posiciones: tresbolilloFilas(entrada), disposicion: "tresbolillo" },
    { posiciones: tresbolilloColumnas(entrada), disposicion: "tresbolillo" },
  ];
  // Gana la que más círculos mete; si empatan, la cuadrícula (más fácil de cortar).
  const mejor = opciones.reduce((a, b) =>
    b.posiciones.length > a.posiciones.length ? b : a,
  );
  return { ...mejor, posiciones: centrar(mejor.posiciones, entrada) };
};
