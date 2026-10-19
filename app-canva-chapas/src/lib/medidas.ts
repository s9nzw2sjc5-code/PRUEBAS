// Canva mide los diseños en píxeles a 96 ppp (un A4 son 794 × 1123 px).
const PX_POR_MM = 96 / 25.4;

export const mmAPx = (mm: number): number => mm * PX_POR_MM;

export type Hoja = "A4" | "A3";

export const HOJAS: Record<Hoja, { anchoMm: number; altoMm: number }> = {
  A4: { anchoMm: 210, altoMm: 297 },
  A3: { anchoMm: 297, altoMm: 420 },
};

export type ConfigChapa = {
  // Círculo de papel que se recorta (incluye lo que se dobla por detrás).
  corteMm: number;
  // Parte que se ve por delante una vez montada la chapa.
  caraMm: number;
  // Zona donde conviene dejar textos y caras para que no se curven.
  seguraMm: number;
};

// Valores habituales para chapas de 58 mm. Cada máquina varía un poco, por
// eso se pueden cambiar desde la app.
export const CHAPA_58: ConfigChapa = {
  corteMm: 70,
  caraMm: 58,
  seguraMm: 50,
};

export type ConfigTaza = {
  anchoMm: number;
  altoMm: number;
  margenSeguroMm: number;
};

export const TAZA_ESTANDAR: ConfigTaza = {
  anchoMm: 200,
  altoMm: 95,
  margenSeguroMm: 5,
};

export type ConfigHoja = {
  margenMm: number;
  separacionMm: number;
};

export const HOJA_POR_DEFECTO: ConfigHoja = {
  margenMm: 5,
  separacionMm: 2,
};
