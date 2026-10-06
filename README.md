# KUSAK · SŌ Studio

Portfolio de Lucas Valenti (Kusak), desarrollo web en Rosario, Argentina.

Sitio publicado: https://kusak.kusak.workers.dev

## Estructura

- `index.html` y `404.html`: las páginas.
- `assets/`: estilos, scripts, fuentes, imágenes, el logo (`marca/`) y los cuadros de Capitán (`capitan/`).
- `herramientas/publicar.py`: arma `dist/` y publica en Cloudflare.
- `herramientas/og/og.html`: fuente de la imagen para redes (`assets/og.png`).
- `herramientas/sol.py`: genera el sol pintado (archivado, sin uso en la página).

HTML, CSS y JS sin framework ni build.

## Publicar

```
python herramientas/publicar.py --subir
```

Arma `dist/` (páginas, `assets/` sin los `.json`, cabeceras de seguridad, robots y sitemap) y lo sube con `wrangler deploy`. `wrangler.jsonc` apunta solo a `dist/`.
