---
nombre: KUSAK · kusak.dev
tipo: interno
stack: estatico
---
# Web KUSAK (kusak.dev)

Portfolio y vitrina de KUSAK / SŌ Studio en HTML, CSS y JS sin build, publicado en Cloudflare Workers. Vende cuatro líneas: páginas web, sistemas a medida, automatizaciones con IA y mantenimiento.

## Etapa 1 — Diseño y marca · 25 %
- [x] Brief visual con las decisiones de Lucas (`docs/design-brief.md`, `DESIGN.md`)
- [x] Primera versión del portfolio
- [x] Barra con índice y sellito, y hoja de pantalla completa en el celular (`docs/handoff-barra.md`)
- [x] Inicio en el celular con el sello firmando el titular
- [x] Dirección más seria: inicio de la variante B (la captura de GEA crece con el scroll) y todo el pixel art afuera, también en la 404 (2026-10-11)
- [x] `assets/og.png` nuevo: titular y tienda de GEA, sin Capitán (2026-10-11)
- [x] Borrados `pixel.js`, `capitan.js`, `assets/capitan/` y la fuente DotGothic (2026-10-11)
- [x] Controles con la forma del sello 創 (esquinas desparejas, doble marco y tinta gastada); en Cómo trabajo, sellos redondos que se estampan mientras la escalera se dibuja (2026-10-11)
- [x] `DESIGN.md` pasado a la dirección actual (2026-10-11)
- [x] Publicado en kusak.dev (2026-10-11)
- [x] Commitear y subir a GitHub los cambios del 2026-10-11
- [x] Borradas las imágenes sin uso (capturas del Club de Boxeo, soles del inicio viejo y `herramientas/sol.py`) (2026-10-11)
- [x] Volver a publicar para que esas imágenes dejen de estar en kusak.dev (2026-10-11)

## Etapa 2 — Calidad · 15 %
- [x] Auditoría: datos estructurados, security.txt, SŌ accesible y medición opcional
- [ ] Volver a auditar después de los cambios del 2026-10-10 → anthropic-skills:auditoria-web

## Etapa 3 — Dominio y publicación · 20 %
- [x] kusak.dev en wrangler, y www y workers.dev redirigen al dominio (`wrangler.jsonc`, `worker.js`)
- [x] Search Console verificado por TXT y RUM automático desactivado
- [x] Publicación solo desde `dist/` con `herramientas/publicar.py`

## Etapa 4 — Cuatro líneas de servicio · 25 %
- [x] Web con las 4 líneas, sin Club de Boxeo y con página de privacidad (publicada en kusak.dev el 2026-10-10)
- [x] Commitear los cambios ya publicados (`970a1fb` y `774f890`, 2026-10-10)
- [x] Subir los commits a GitHub (`git push`, 2026-10-11)
- [x] Tiendas online al frente: línea propia arriba de las otras, GEA contada como tienda y primera en el formulario (2026-10-10; reemplaza a "rubro salud", que Lucas descartó)
- [x] Publicar el cambio de tiendas online en kusak.dev (2026-10-11)

## Etapa 5 — Trabajos · 15 %
- [x] Trabajos reales con capturas propias (`assets/trabajos/`)
- [x] Capturas de GEA actualizadas desde el sitio en vivo, más una de 750 px para el inicio en celular (2026-10-11)
- [ ] Sumar stock hogar a Trabajos con capturas de datos de ejemplo → caso-de-estudio
- [ ] Reemplazar la captura de la carpintería que usa fotos de Pinterest

## Continuo · 0 %
- [ ] Revisar que el sitemap pase a "Correcto" en Search Console [PENDIENTE: confirmar]
- [ ] Registro de la marca en el INPI (guía en `docs/marca-inpi/`) [PENDIENTE: confirmar]
- [ ] Recalcular el hash de la CSP cada vez que cambie el script inline del `<head>`
- [ ] Renovación del dominio (automática, vence 2027-10-10)
