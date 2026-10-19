// Sube a Canva las fotos elegidas desde el ordenador.
import type { ImageMimeType, QueuedImage } from "@canva/asset";
import { upload } from "@canva/asset";

export const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp"];

// Canva acepta data URLs de hasta 10 MB (en caracteres).
const MAX_DATA_URL = 10 * 1024 * 1024;
const LADO_MINIATURA = 400;

const leerComoDataUrl = (archivo: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result as string);
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(archivo);
  });

const cargarImagen = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });

const redibujar = (
  img: HTMLImageElement,
  escala: number,
  tipo: "image/jpeg" | "image/png",
): string => {
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.max(1, Math.round(img.naturalWidth * escala));
  lienzo.height = Math.max(1, Math.round(img.naturalHeight * escala));
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("El navegador no permite procesar la imagen");
  ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
  return lienzo.toDataURL(tipo, 0.92);
};

export const subirFoto = async (archivo: File): Promise<QueuedImage> => {
  let url = await leerComoDataUrl(archivo);
  let mimeType = archivo.type as ImageMimeType;
  const img = await cargarImagen(url);
  let ancho = img.naturalWidth;
  let alto = img.naturalHeight;

  // Las fotos muy pesadas se convierten a JPEG y se reducen hasta que caben.
  let escala = 1;
  while (url.length > MAX_DATA_URL && escala > 0.1) {
    url = redibujar(img, escala, "image/jpeg");
    mimeType = "image/jpeg";
    ancho = Math.round(img.naturalWidth * escala);
    alto = Math.round(img.naturalHeight * escala);
    escala *= 0.8;
  }

  const escalaMiniatura = Math.min(
    1,
    LADO_MINIATURA / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const thumbnailUrl = redibujar(img, escalaMiniatura, "image/jpeg");

  return upload({
    type: "image",
    mimeType,
    url,
    thumbnailUrl,
    width: ancho,
    height: alto,
    aiDisclosure: "none",
  });
};
