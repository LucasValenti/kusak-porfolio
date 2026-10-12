---
nombre: KUSAK · kusak.dev
tipo: interno
stack: estatico
---
# Web KUSAK (kusak.dev)

Portfolio y vitrina de KUSAK en HTML, CSS y JS sin build, publicado en Cloudflare Workers. Vende cuatro líneas: páginas web, sistemas a medida, automatizaciones con IA y mantenimiento.

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
- [x] Dirección A "estructura de juego sin dibujos" elegida entre tres maquetas (`variantes/gamer/`, 2026-10-11)
- [x] Fase 1: colores fríos, Manrope, botones e inicio con menú de selección y cursor (2026-10-11)
- [x] Fase 2: Trabajos como fichas, Tiendas online en caja, Cómo trabajo como ruta, hoja y cierre como cajas de diálogo (2026-10-11)
- [x] Fase 3 de la dirección A: reemplazada por el rediseño de cero (archivada en `variantes/juego-a/`, 2026-10-11)
- [x] Publicado en kusak.dev (2026-10-11)
- [x] Commitear y subir a GitHub los cambios del 2026-10-11
- [x] Borradas las imágenes sin uso (capturas del Club de Boxeo, soles del inicio viejo y `herramientas/sol.py`) (2026-10-11)
- [x] Volver a publicar para que esas imágenes dejen de estar en kusak.dev (2026-10-11)
- [x] Rediseño de cero "Escritorio de los 90": solo KUSAK, logo nuevo, inicio, trabajos, servicios, instalación, asistente de presupuesto, 404, privacidad y og.png (2026-10-11)
- [x] "Escritorio de los 90" archivado en `variantes/escritorio-90/` (2026-10-12)
- [x] Nueva dirección "nivel agencia" (referencia hellohello.is): inicio nuevo, kit de movimiento (`assets/movimiento.js`, GSAP + Lenis en `assets/vendor/`) y campo animado propio (`assets/campo.js`) (2026-10-12)
- [x] Acento elegido: amarillo taxi; selector de prueba sacado (2026-10-12)
- [x] Videos de trabajos con HyperFrames (`videos/trabajos/`, `herramientas/videos-trabajos.py`): GEA y Muebles en loop en la sección Trabajos (2026-10-12)
- [x] 404, privacidad y og.png en el sistema nuevo (2026-10-12)
- [x] Revisión final (ship tras 2 rondas de correcciones) y DESIGN.md nuevo (2026-10-12)
- [x] Commitear y publicar el rediseño (`9189b63`, kusak.dev, 2026-10-12)
- [x] Fondo "Pulso" (líneas que se levantan en picos) y glitch de corte RGB en los botones, elegidos entre cinco fondos y tres glitch (2026-10-12)
- [x] Fondo del inicio pasado a video en loop (render propio en `videos/hero/`): cuesta lo mismo que no tener fondo; se descartaron shader en vivo, Canvas 2D y SVG animado por consumo (2026-10-12)
- [x] Consumo de placa: los videos eran la causa (composición de 309 a 52 ms en el hero y de 620 a 51 ms en Trabajos). Un solo video de trabajo a la vez, todos a 24 fps, sin `will-change` por letra ni desenfoque en la cabecera móvil (2026-10-12)
- [x] Fondo Prisma (cinta de luz táctil, liviana) en lugar del video; cartas de servicio sin espacio muerto en celular; Cómo trabajo compactado en una franja de 4 pasos dentro de Presupuesto; barra que se esconde al bajar y menú de celular a pantalla completa en amarillo (2026-10-12)
- [x] Tipografía Archivo expandida (elegida entre seis), la cinta vibra al tocar y con el scroll, difuminado entre el inicio y lo que sigue, barra del navegador en oscuro (2026-10-12)
- [x] Borradas las fuentes sin uso (Shippori Mincho, Zen Kaku Gothic) y `gea-escritorio-750.webp` (2026-10-12)

## Etapa 2 — Calidad · 15 %
- [x] Auditoría: datos estructurados, security.txt, SŌ accesible y medición opcional
- [x] Volver a auditar después del rediseño del 2026-10-12 → anthropic-skills:auditoria-web (8,1/10)
- [x] Arreglos rápidos de la auditoría: titular partido por palabras, foco en zonas claras, `connect-src 'self'`, pie oculto hasta el final, `aria: 'hidden'`, descripción y canonical
- [ ] SPF `-all` y DMARC `p=reject` en el DNS de Cloudflare [PENDIENTE: confirmar]
- [ ] Cinta de luz diferida al `load` y conteo de clics a WhatsApp desde el worker
- [ ] Preguntas frecuentes con `FAQPage`

## Etapa 3 — Dominio y publicación · 20 %
- [x] kusak.dev en wrangler, y www y workers.dev redirigen al dominio (`wrangler.jsonc`, `worker.js`)
- [x] Search Console verificado por TXT y RUM automático desactivado
- [x] Publicación solo desde `dist/` con `herramientas/publicar.py`

## Etapa 4 — Cuatro líneas de servicio · 15 %
- [x] Web con las 4 líneas, sin Club de Boxeo y con página de privacidad (publicada en kusak.dev el 2026-10-10)
- [x] Commitear los cambios ya publicados (`970a1fb` y `774f890`, 2026-10-10)
- [x] Subir los commits a GitHub (`git push`, 2026-10-11)
- [x] Tiendas online al frente: línea propia arriba de las otras, GEA contada como tienda y primera en el formulario (2026-10-10; reemplaza a "rubro salud", que Lucas descartó)
- [x] Publicar el cambio de tiendas online en kusak.dev (2026-10-11)

## Etapa 5 — Trabajos · 10 %
- [x] Trabajos reales con capturas propias (`assets/trabajos/`)
- [x] Capturas de GEA actualizadas desde el sitio en vivo, más una de 750 px para el inicio en celular (2026-10-11)
- [ ] Sumar stock hogar a Trabajos con capturas de datos de ejemplo → caso-de-estudio
- [ ] Reemplazar la captura de la carpintería que usa fotos de Pinterest

## Etapa 6 — Demo de tienda · 15 %
- [x] `demo-tienda/`: Barranca, tienda ficticia marcada como demo, con grilla, ficha con View Transitions y carrito (2026-10-12)
- [x] 10 fotos de producto generadas para la demo (con permiso); originales y procedencia en `demo-tienda/assets/img/originales/` (no se publican)
- [x] Enlazada desde Trabajos y sumada a `publicar.py` (2026-10-12)

## Continuo · 0 %
- [ ] Revisar que el sitemap pase a "Correcto" en Search Console [PENDIENTE: confirmar]
- [ ] Registro de la marca en el INPI (guía en `docs/marca-inpi/`) [PENDIENTE: confirmar]
- [ ] Recalcular el hash de la CSP cada vez que cambie el script inline del `<head>`
- [ ] Renovación del dominio (automática, vence 2027-10-10)
