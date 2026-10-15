"""Genera la app instalable (docs/) a partir de brote-sentir.html.

Uso: python3 tools/build_app.py
GitHub Pages publica la carpeta docs/ de la rama brote-sentir.
"""
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "docs"
VERSION = "5"  # súbela cuando cambie la app para renovar la caché sin conexión

HEAD = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Aprende a identificar y expresar tus emociones, poco a poco y tocando.">
<meta name="theme-color" content="#F6F3FC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#14121E" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Brote Sentir">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
"""

PIE = """
<script>
if ("serviceWorker" in navigator && location.protocol === "https:") {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
</script>
</body>
</html>
"""

MANIFEST = """{
  "name": "Brote Sentir",
  "short_name": "Brote Sentir",
  "description": "Aprende a identificar y expresar tus emociones, poco a poco y tocando.",
  "lang": "es",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#F6F3FC",
  "theme_color": "#F6F3FC",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}
  ]
}
"""

SW = """// Caché sin conexión: muestra lo guardado al instante y lo actualiza en segundo plano
const CACHE = "brote-sentir-v%s";
const BASE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const guardado = await c.match(e.request, {ignoreSearch: true});
    const red = fetch(e.request).then(r => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }).catch(() => guardado);
    return guardado || red;
  }));
});
"""


def icono(lado):
    from PIL import Image, ImageDraw
    g = 1024
    im = Image.new("RGB", (g, g))
    px = im.load()
    for y in range(g):  # degradado verde de arriba abajo
        t = y / g
        c = tuple(int(a + (b - a) * t) for a, b in zip((155, 227, 191), (79, 196, 135)))
        for x in range(g):
            px[x, y] = c
    d = ImageDraw.Draw(im)
    # todo el dibujo dentro de la zona segura (80 % central) para iconos adaptables
    d.line([(512, 690), (500, 560), (518, 440), (512, 330)], fill=(46, 158, 99), width=34, joint="curve")
    d.ellipse([340, 400, 520, 500], fill=(56, 176, 116))
    d.ellipse([504, 470, 690, 570], fill=(37, 140, 88))
    for i, col in enumerate([(255, 191, 60), (255, 158, 196)] * 3):
        import math
        a = i * math.pi / 3
        cx, cy = 512 + math.cos(a) * 48, 300 + math.sin(a) * 48
        d.ellipse([cx - 40, cy - 40, cx + 40, cy + 40], fill=col)
    d.ellipse([478, 266, 546, 334], fill=(240, 106, 85))
    d.rounded_rectangle([330, 660, 694, 724], radius=32, fill=(140, 128, 235))
    d.polygon([(362, 720), (662, 720), (628, 860), (396, 860)], fill=(91, 75, 219))
    return im.resize((lado, lado), Image.LANCZOS)


def main():
    SALIDA.mkdir(exist_ok=True)
    pagina = (RAIZ / "brote-sentir.html").read_text(encoding="utf-8")
    (SALIDA / "index.html").write_text(HEAD + pagina + PIE, encoding="utf-8")
    (SALIDA / "manifest.webmanifest").write_text(MANIFEST, encoding="utf-8")
    (SALIDA / "sw.js").write_text(SW % VERSION, encoding="utf-8")
    (SALIDA / ".nojekyll").write_text("", encoding="utf-8")
    for nombre, lado in [("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)]:
        if not (SALIDA / nombre).exists():
            icono(lado).save(SALIDA / nombre, optimize=True)
    print("App generada en", SALIDA)


if __name__ == "__main__":
    main()
