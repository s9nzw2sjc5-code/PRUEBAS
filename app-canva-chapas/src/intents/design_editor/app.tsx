import { useFeatureSupport } from "@canva/app-hooks";
import {
  Accordion,
  AccordionItem,
  Alert,
  Button,
  Columns,
  Column,
  FileInput,
  FileInputItem,
  FormField,
  NumberInput,
  Rows,
  SegmentedControl,
  Switch,
  Text,
  Title,
} from "@canva/app-ui-kit";
import type { QueuedImage } from "@canva/asset";
import { addPage } from "@canva/design";
import { CanvaError } from "@canva/error";
import { useState } from "react";
import * as styles from "styles/components.css";
import { subirFoto, TIPOS_ACEPTADOS } from "../../lib/imagenes";
import type {
  ConfigChapa,
  ConfigHoja,
  ConfigTaza,
  Hoja,
} from "../../lib/medidas";
import { CHAPA_58, HOJA_POR_DEFECTO, TAZA_ESTANDAR } from "../../lib/medidas";
import type { Pagina } from "../../lib/paginas";
import {
  huecosPorHoja,
  paginasDeChapas,
  paginasDeTazas,
} from "../../lib/paginas";

type Producto = "chapas" | "tazas";

// Canva permite añadir como máximo 3 páginas por segundo.
const PAUSA_ENTRE_PAGINAS_MS = 400;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const errorDeMedidas = (
  producto: Producto,
  chapa: ConfigChapa,
  taza: ConfigTaza,
  huecos: number,
): string | undefined => {
  if (producto === "chapas") {
    if (!(chapa.seguraMm > 0 && chapa.caraMm > 0 && chapa.corteMm > 0)) {
      return "Todas las medidas tienen que ser mayores que 0.";
    }
    if (chapa.caraMm >= chapa.corteMm) {
      return "La cara visible tiene que ser menor que el círculo de corte.";
    }
    if (chapa.seguraMm >= chapa.caraMm) {
      return "La zona segura tiene que ser menor que la cara visible.";
    }
    if (huecos === 0) {
      return "Con estas medidas no cabe ninguna chapa en la hoja.";
    }
  } else if (!(taza.anchoMm >= 20 && taza.altoMm >= 20)) {
    return "La taza tiene que medir al menos 20 × 20 mm.";
  }
  return undefined;
};

export const App = () => {
  const isSupported = useFeatureSupport();
  const puedeAnadirPaginas = isSupported(addPage);

  const [producto, setProducto] = useState<Producto>("chapas");
  const [hoja, setHoja] = useState<Hoja>("A4");
  const [chapa, setChapa] = useState<ConfigChapa>(CHAPA_58);
  const [ajustes, setAjustes] = useState<ConfigHoja>(HOJA_POR_DEFECTO);
  const [taza, setTaza] = useState<ConfigTaza>(TAZA_ESTANDAR);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [lineaDeCorte, setLineaDeCorte] = useState(true);
  const [guias, setGuias] = useState(true);
  const [repetirFoto, setRepetirFoto] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [progreso, setProgreso] = useState<string>();
  const [error, setError] = useState<string>();
  const [hecho, setHecho] = useState<string>();

  const huecos = huecosPorHoja(hoja, chapa, ajustes);
  const errorMedidas = errorDeMedidas(producto, chapa, taza, huecos);
  const repetir = producto === "chapas" && repetirFoto && archivos.length > 0;
  const numPaginas =
    producto === "tazas"
      ? Math.max(1, archivos.length)
      : repetir
        ? 1
        : Math.max(1, Math.ceil(archivos.length / Math.max(1, huecos)));

  const crear = async () => {
    setTrabajando(true);
    setError(undefined);
    setHecho(undefined);
    try {
      const subidas: QueuedImage[] = [];
      const aSubir = repetir ? archivos.slice(0, 1) : archivos;
      for (const [i, archivo] of aSubir.entries()) {
        setProgreso(`Subiendo foto ${i + 1} de ${aSubir.length}…`);
        subidas.push(await subirFoto(archivo));
      }
      const fotos = subidas.map((s) => s.ref);

      const paginas: Pagina[] =
        producto === "chapas"
          ? paginasDeChapas({
              hoja,
              chapa,
              ajustes,
              fotos,
              lineaDeCorte,
              guias,
              repetirFoto: repetir,
            })
          : paginasDeTazas({ taza, fotos, guias });

      for (const [i, pagina] of paginas.entries()) {
        setProgreso(`Creando página ${i + 1} de ${paginas.length}…`);
        if (i > 0) await esperar(PAUSA_ENTRE_PAGINAS_MS);
        await addPage({
          title: pagina.titulo,
          dimensions: pagina.dimensiones,
          elements: pagina.elementos,
        });
      }

      setProgreso("Terminando de subir las fotos…");
      await Promise.all(subidas.map((s) => s.whenUploaded()));
      setHecho(
        paginas.length === 1
          ? "Listo: se ha añadido 1 página al diseño."
          : `Listo: se han añadido ${paginas.length} páginas al diseño.`,
      );
    } catch (e) {
      if (e instanceof CanvaError && e.code === "quota_exceeded") {
        setError(
          "El diseño ya tiene el máximo de páginas. Borra alguna o usa un diseño nuevo.",
        );
      } else {
        setError(
          e instanceof Error
            ? e.message
            : "Algo ha fallado. Inténtalo otra vez.",
        );
      }
    } finally {
      setTrabajando(false);
      setProgreso(undefined);
    }
  };

  const campoMm = (
    etiqueta: string,
    valor: number,
    cambiar: (v: number) => void,
    descripcion?: string,
  ) => (
    <FormField
      label={etiqueta}
      description={descripcion}
      value={valor}
      control={(props) => (
        <NumberInput
          {...props}
          min={0}
          step={0.5}
          disabled={trabajando}
          onChange={(v) => cambiar(v ?? 0)}
        />
      )}
    />
  );

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Title size="small">Chapas y tazas</Title>
        <Text size="small">
          Crea hojas listas para imprimir con tus fotos recortadas en la forma
          del producto.
        </Text>

        <SegmentedControl<Producto>
          value={producto}
          onChange={setProducto}
          disabled={trabajando}
          options={[
            { label: "Chapas", value: "chapas" },
            { label: "Tazas", value: "tazas" },
          ]}
        />

        {producto === "chapas" ? (
          <Rows spacing="1.5u">
            <FormField<Hoja>
              label="Hoja"
              value={hoja}
              control={() => (
                <SegmentedControl<Hoja>
                  value={hoja}
                  onChange={setHoja}
                  disabled={trabajando}
                  options={[
                    { label: "A4", value: "A4" },
                    { label: "A3", value: "A3" },
                  ]}
                />
              )}
            />
            <Text size="small">
              Caben <strong>{huecos}</strong> chapas de {chapa.caraMm} mm en
              cada hoja {hoja}.
            </Text>
            <Accordion>
              <AccordionItem title="Medidas de la chapa y la hoja">
                <Rows spacing="1.5u">
                  {campoMm(
                    "Círculo de corte (mm)",
                    chapa.corteMm,
                    (v) => setChapa({ ...chapa, corteMm: v }),
                    "Lo que recortas del papel, con la parte que se dobla.",
                  )}
                  {campoMm("Cara visible (mm)", chapa.caraMm, (v) =>
                    setChapa({ ...chapa, caraMm: v }),
                  )}
                  {campoMm(
                    "Zona segura (mm)",
                    chapa.seguraMm,
                    (v) => setChapa({ ...chapa, seguraMm: v }),
                    "Deja dentro los textos y las caras.",
                  )}
                  <Columns spacing="1u">
                    <Column>
                      {campoMm("Margen de hoja (mm)", ajustes.margenMm, (v) =>
                        setAjustes({ ...ajustes, margenMm: v }),
                      )}
                    </Column>
                    <Column>
                      {campoMm("Separación (mm)", ajustes.separacionMm, (v) =>
                        setAjustes({ ...ajustes, separacionMm: v }),
                      )}
                    </Column>
                  </Columns>
                </Rows>
              </AccordionItem>
            </Accordion>
          </Rows>
        ) : (
          <Columns spacing="1u">
            <Column>
              {campoMm("Ancho (mm)", taza.anchoMm, (v) =>
                setTaza({ ...taza, anchoMm: v }),
              )}
            </Column>
            <Column>
              {campoMm("Alto (mm)", taza.altoMm, (v) =>
                setTaza({ ...taza, altoMm: v }),
              )}
            </Column>
          </Columns>
        )}

        <FormField
          label="Fotos"
          description={
            producto === "chapas"
              ? "Cada foto va a una chapa. Si sobran huecos, quedan vacíos para arrastrar imágenes desde Canva."
              : "Se crea una página de taza por cada foto."
          }
          control={(props) => (
            <FileInput
              {...props}
              multiple
              stretchButton
              disabled={trabajando}
              accept={TIPOS_ACEPTADOS}
              onDropAcceptedFiles={(nuevos) =>
                setArchivos((previos) => [...previos, ...nuevos])
              }
            />
          )}
        />
        {archivos.length > 0 && (
          <Rows spacing="0.5u">
            {archivos.map((archivo, i) => (
              <FileInputItem
                key={`${archivo.name}-${i}`}
                label={archivo.name}
                disabled={trabajando}
                onDeleteClick={() =>
                  setArchivos((previos) => previos.filter((_, j) => j !== i))
                }
              />
            ))}
          </Rows>
        )}

        {producto === "chapas" && (
          <>
            <Switch
              label="Repetir la primera foto en toda la hoja"
              value={repetirFoto}
              onChange={setRepetirFoto}
              disabled={trabajando || archivos.length === 0}
            />
            <Switch
              label="Línea de corte"
              description="Un contorno fino alrededor de cada círculo para recortar."
              value={lineaDeCorte}
              onChange={setLineaDeCorte}
              disabled={trabajando}
            />
          </>
        )}
        <Switch
          label="Guías de color"
          description={
            producto === "chapas"
              ? "Rosa: cara visible. Azul: zona segura."
              : "Azul: margen seguro. Rosa: centro del diseño."
          }
          value={guias}
          onChange={setGuias}
          disabled={trabajando}
        />
        {guias && (
          <Alert tone="info">
            Las guías van agrupadas en cada página: selecciona el grupo y
            bórralo antes de imprimir.
          </Alert>
        )}

        {errorMedidas && <Alert tone="warn">{errorMedidas}</Alert>}
        {!puedeAnadirPaginas && (
          <Alert tone="warn">
            Este tipo de diseño no permite añadir páginas. Abre un diseño normal
            (por ejemplo, uno en blanco tamaño A4).
          </Alert>
        )}

        <Button
          variant="primary"
          stretch
          loading={trabajando}
          disabled={!puedeAnadirPaginas || Boolean(errorMedidas)}
          onClick={crear}
        >
          {numPaginas === 1 ? "Crear 1 página" : `Crear ${numPaginas} páginas`}
        </Button>
        {progreso && <Text size="small">{progreso}</Text>}
        {error && <Alert tone="critical">{error}</Alert>}
        {hecho && <Alert tone="positive">{hecho}</Alert>}
      </Rows>
    </div>
  );
};
