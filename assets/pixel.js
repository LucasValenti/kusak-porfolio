/* Pixel art de la página: Capitán (el perro, en tiras de cuadros), la guirnalda
   de faroles de matsuri, la rama de sakura y los pétalos que caen. Todo se dibuja a baja resolución en
   canvas y el CSS lo agranda con image-rendering: pixelated. Con movimiento
   reducido, los pétalos quedan quietos y los faroles no titilan.
   El Capitán que camina por la página está en capitan.js. */
(function () {
  'use strict';

  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function pintar(ctx, filas, pal, x0, y0) {
    for (let y = 0; y < filas.length; y++) {
      const f = filas[y];
      for (let x = 0; x < f.length; x++) {
        const c = pal[f[x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x0 + x, y0 + y, 1, 1);
      }
    }
  }

  /* ---------- Capitán de frente: tira de cuadros ---------- */
  // Tira de 8 cuadros de 20x34: respira y mueve la cola. Hoy solo lo usa la 404.
  const FR_ANCHO = 20, FR_ALTO = 34, FR_CUADROS = 8;
  const perros = $$('[data-perro-fijo]').map(function (c) { c.width = FR_ANCHO; c.height = FR_ALTO; return c; });
  const frente = new Image();
  if (perros.length) frente.src = new URL('capitan/frente.png', document.currentScript.src).href;
  function dibujarFrente(c, n) {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(frente, n * FR_ANCHO, 0, FR_ANCHO, c.height, 0, 0, FR_ANCHO, c.height);
  }
  frente.addEventListener('load', function () {
    perros.forEach(function (c) { dibujarFrente(c, 0); });
    // Solo se anima el que está a la vista; con movimiento reducido queda quieto
    const vistos = new Set();
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) { if (e.isIntersecting) vistos.add(e.target); else vistos.delete(e.target); });
      });
      perros.forEach(function (c) { io.observe(c); });
    }
    let n = 0;
    setInterval(function () {
      if (quieto.matches || document.hidden || !vistos.size) return;
      n = (n + 1) % FR_CUADROS;
      vistos.forEach(function (c) { dibujarFrente(c, n); });
    }, 140);
  });

  /* ---------- Guirnalda de faroles (chōchin) y banderines ---------- */

  const FAROL = [
    '....Y....',
    '..KKKKK..',
    '.RRRRRRR.',
    'RLLRRRRRD',
    'DDDDDDDDD',
    'RLLRRRRRD',
    'RLRRRRRRD',
    'DDDDDDDDD',
    'RLLRRRRRD',
    'RLRRRRRRD',
    'DDDDDDDDD',
    '.RRRRRRD.',
    '..KKKKK..',
    '....Y....',
    '...YYY...',
    '....Y....'
  ];
  const FAROL_CHICO = [
    '..Y..',
    '.KKK.',
    'RLRRD',
    'DDDDD',
    'RLRRD',
    'DDDDD',
    '.RRD.',
    '.KKK.',
    '..Y..'
  ];
  const BANDERIN = ['BBBBB', '.BBB.', '..B..'];
  const PAL_DIA = { K: '#151923', R: '#c8432f', D: '#8f2a1e', L: '#e8775f', Y: '#d9a441', B: '#263b59', C: '#c8432f' };
  const PAL_NOCHE = { K: '#0b0d12', R: '#f0634a', D: '#c8432f', L: '#ffd2a8', Y: '#ffd27a', B: '#e8b44f', C: '#f0634a' };
  const PAL_TENUE = { K: '#0b0d12', R: '#b94a38', D: '#8f2a1e', L: '#e6a07e', Y: '#d9a441', B: '#e8b44f', C: '#b94a38' };

  /* Halo de luz de un farol: anillos de pixel con tramado de ajedrez, de naranja a nada */
  function halo(ctx, cx, cy, R, fuerte) {
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const t = Math.sqrt(dx * dx + dy * dy) / R;
        if (t > 1) continue;
        const par = ((cx + dx + cy + dy) & 1) === 0;
        let a = t < .45 ? .26 : (t < .72 ? (par ? .16 : .08) : (par ? .07 : 0));
        if (!fuerte) a *= .5;
        if (!a) continue;
        ctx.fillStyle = 'rgba(255,168,92,' + a + ')';
        ctx.fillRect(cx + dx, cy + dy, 1, 1);
      }
    }
  }

  function dibujarGuirnalda(canvas, tenue) {
    const noche = canvas.getAttribute('data-guirnalda') === 'noche';
    const escala = window.innerWidth < 760 ? 3 : 4;
    const w = Math.max(40, Math.round(canvas.clientWidth / escala));
    const h = 24;
    if (canvas.width !== w) canvas.width = w;
    canvas.height = h;
    canvas.style.height = (h * escala) + 'px';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    const tramo = w < 100 ? 26 : 38;
    const n = Math.max(2, Math.round(w / tramo));
    const paso = w / n;
    const y = function (x) { const t = (x % paso) / paso * 2 - 1; return Math.round(1 + 4 * (1 - t * t)); };
    ctx.fillStyle = noche ? '#3a4050' : '#151923';
    for (let x = 0; x < w; x++) ctx.fillRect(x, y(x), 1, 1);
    const pal = noche ? PAL_NOCHE : PAL_DIA;
    if (noche) {
      for (let i = 0; i < n; i++) {
        const cx = Math.round(i * paso + paso / 2);
        if (i % 2) halo(ctx, cx, 8, 7, tenue !== i);
        else halo(ctx, cx, 12, 11, tenue !== i);
      }
      ctx.fillStyle = '#3a4050';
      for (let x = 0; x < w; x++) ctx.fillRect(x, y(x), 1, 1);
    }
    for (let i = 0; i < n; i++) {
      // Dos banderines a cada lado del farol
      [.2, .8].forEach(function (f) {
        const x = Math.round(i * paso + paso * f);
        pintar(ctx, BANDERIN, pal, x - 2, y(x) + 1);
      });
      const cx = Math.round(i * paso + paso / 2);
      const p = (tenue === i) ? PAL_TENUE : pal;
      if (i % 2) pintar(ctx, FAROL_CHICO, p, cx - 2, 4);
      else pintar(ctx, FAROL, p, cx - 4, 4);
    }
    canvas._faroles = n;
  }
  const guirnaldas = $$('[data-guirnalda]');
  guirnaldas.forEach(function (c) { dibujarGuirnalda(c); });

  // De noche, un farol baja y sube de brillo de a poco, como una llama
  const nocturnas = guirnaldas.filter(function (c) { return c.getAttribute('data-guirnalda') === 'noche'; });
  const vistas = new Set();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) vistas.add(e.target); else vistas.delete(e.target); });
    });
    nocturnas.forEach(function (c) { io.observe(c); });
  }
  setInterval(function () {
    if (quieto.matches || document.hidden || !vistas.size) return;
    vistas.forEach(function (c) {
      dibujarGuirnalda(c, Math.floor(Math.random() * (c._faroles || 1)));
      setTimeout(function () { dibujarGuirnalda(c); }, 500);
    });
  }, 2200);

  /* ---------- Sakura: flor, pétalos y la rama del inicio ---------- */

  const FLOR = ['.PPP.', 'PLpPP', 'PpCpP', 'PPpPP', '.PPP.'];
  const PETALO = [['.PP.', 'PPPp', 'PPPp', '.pp.'], ['.PP.', 'PPPP', 'pPPp', '..p.']];
  const PETALO_CHICO = [['Pp', 'pp'], ['pP', 'pp']];
  const PALS = [
    { P: '#f4b6c2', p: '#e48aa0', C: '#c25a72', L: '#fde0e6' },
    { P: '#f9cdd5', p: '#f0a3b4', C: '#d17389', L: '#ffffff' }
  ];

  function linea(ctx, x0, y0, x1, y1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
    }
  }
  function dibujarRama(canvas) {
    canvas.width = 72;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4a2e1a';
    [[71, 1, 48, 13], [48, 13, 27, 19], [27, 19, 8, 38], [48, 13, 55, 29], [27, 19, 35, 35], [57, 6, 62, 17]].forEach(function (s) {
      linea(ctx, s[0], s[1], s[2], s[3]);
      linea(ctx, s[0], s[1] + 1, s[2], s[3] + 1);
    });
    ctx.fillStyle = '#e48aa0';
    [[66, 16], [56, 31], [37, 36], [11, 42], [18, 24]].forEach(function (b) { ctx.fillRect(b[0], b[1], 2, 2); });
    [[63, 6], [53, 10], [42, 14], [31, 17], [22, 24], [13, 33], [58, 25], [36, 31], [9, 39]].forEach(function (f, i) {
      pintar(ctx, FLOR, PALS[i % 2], f[0] - 2, f[1] - 2);
    });
  }
  $$('[data-rama]').forEach(dibujarRama);

  /* ---------- Pétalos que caen ---------- */

  function lluvia(canvas) {
    const escala = 3;
    let w = 0, h = 0, petalos = [], visible = false, cuadroId = 0, ultimo = 0;
    const ctx = canvas.getContext('2d');
    function medir() {
      w = Math.max(20, Math.round(canvas.clientWidth / escala));
      h = Math.max(20, Math.round(canvas.clientHeight / escala));
      canvas.width = w;
      canvas.height = h;
      const cantidad = Math.max(6, Math.min(26, Math.round(w * h / 2600)));
      petalos = [];
      for (let i = 0; i < cantidad; i++) {
        const r = Math.random();
        petalos.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: .12 + Math.random() * .22, vy: .18 + Math.random() * .3,
          fase: Math.random() * 6.28, pal: PALS[i % 2],
          tipo: r < .12 ? 0 : (r < .55 ? 1 : 2)
        });
      }
    }
    function dibujar(t) {
      ctx.clearRect(0, 0, w, h);
      petalos.forEach(function (p) {
        const x = Math.round(p.x), y = Math.round(p.y);
        const f = Math.floor((t || 0) / 420 + p.fase) % 2;
        if (p.tipo === 0) pintar(ctx, FLOR, p.pal, x, y);
        else pintar(ctx, p.tipo === 1 ? PETALO[f] : PETALO_CHICO[f], p.pal, x, y);
      });
    }
    function paso(t) {
      cuadroId = 0;
      if (!visible || quieto.matches) return;
      const dt = Math.min(3, (t - (ultimo || t)) / 16.7);
      ultimo = t;
      petalos.forEach(function (p) {
        p.x += (p.vx + Math.sin(t * .0015 + p.fase) * .15) * dt;
        p.y += p.vy * dt;
        if (p.y > h + 4) { p.y = -5; p.x = Math.random() * w - 8; }
        if (p.x > w + 4) p.x = -5;
      });
      dibujar(t);
      cuadroId = requestAnimationFrame(paso);
    }
    function arrancar() {
      if (cuadroId || quieto.matches || !visible || document.hidden) return;
      ultimo = 0;
      cuadroId = requestAnimationFrame(paso);
    }
    medir();
    dibujar(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        arrancar();
      }).observe(canvas);
    }
    document.addEventListener('visibilitychange', arrancar);
    quieto.addEventListener && quieto.addEventListener('change', function () { dibujar(0); arrancar(); });
    return medir;
  }
  const remedir = $$('[data-petalos]').map(lluvia);

  let espera = 0;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(function () {
      guirnaldas.forEach(function (c) { dibujarGuirnalda(c); });
      remedir.forEach(function (m) { m(); });
    }, 150);
  });
})();
