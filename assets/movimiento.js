/* KUSAK · kit de movimiento
   Declarativo: cada elemento pide su animación con data-anim y este archivo la ejecuta.
   - lines     texto que entra línea por línea desde una máscara
   - chars     letras que suben en cascada (para titulares cortos)
   - fade      los hijos entran en cascada desde abajo
   - encender  palabras que pasan de apagadas a encendidas con el scroll
   Además: scroll suave (Lenis), imán en [data-iman], cursor con texto en [data-cursor].
   Todo el contenido es visible sin JS; con movimiento reducido no corre nada de esto. */
(function () {
  'use strict';

  const raiz = document.documentElement;
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  const KUSAK = window.KUSAK = window.KUSAK || {};
  KUSAK.reducido = reducido.matches;
  KUSAK.mouse = mouse.matches;

  if (!window.gsap || reducido.matches) {
    KUSAK.listo = true;
    document.dispatchEvent(new CustomEvent('kusak:movimiento'));
    return;
  }

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger, window.SplitText);
  const ST = window.ScrollTrigger;
  const EXPO = 'expo.out';
  gsap.defaults({ ease: EXPO, duration: 1.2 });

  /* ---------- Scroll suave ---------- */

  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, anchors: { offset: 0 } });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    KUSAK.lenis = lenis;
    // Los enlaces internos viajan con la misma curva que el resto
    document.addEventListener('click', function (e) {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const destino = document.querySelector(id);
      if (!destino) return;
      e.preventDefault();
      lenis.scrollTo(destino, { duration: 1.4, easing: function (x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); } });
      history.replaceState(null, '', id);
      if (destino.tabIndex < 0 && !/^(A|BUTTON|INPUT|TEXTAREA|SELECT)$/.test(destino.tagName)) destino.setAttribute('tabindex', '-1');
      destino.focus({ preventScroll: true });
    });
  }

  /* ---------- Texto ---------- */

  const alEntrar = function (el, desde, extra) {
    return gsap.from(desde, Object.assign({
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    }, extra));
  };

  const animar = {
    lines: function (el) {
      // Sin etiqueta: un párrafo no puede llevar aria-label, y las líneas conservan el texto tal cual
      const s = window.SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'linea', autoSplit: true, aria: 'none',
        onSplit: function (self) {
          return alEntrar(el, self.lines, { yPercent: 105, duration: 1.3, stagger: 0.09 });
        } });
      return s;
    },
    chars: function (el) {
      // Si el texto ya está oculto para lectores de pantalla, SplitText no le agrega etiqueta propia.
      // Palabras primero y letras adentro: así el renglón corta entre palabras y nunca a mitad de una
      const s = window.SplitText.create(el, { type: 'words,chars', wordsClass: 'palabra-entera', charsClass: 'letra', aria: el.closest('[aria-hidden="true"]') ? 'none' : 'auto' });
      return gsap.from(s.chars, { yPercent: 110, duration: 1.4, stagger: 0.035, delay: Number(el.dataset.delay || 0) });
    },
    fade: function (el) {
      const hijos = el.children.length ? el.children : [el];
      return alEntrar(el, hijos, { y: 40, opacity: 0, duration: 1.2, stagger: 0.08 });
    },
    encender: function (el) {
      const s = window.SplitText.create(el, { type: 'words', wordsClass: 'palabra' });
      const palabras = s.words.filter(function (w) { return !w.closest('.tenue'); });
      return gsap.fromTo(palabras, { opacity: 0.16 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: true }
      });
    }
  };

  const iniciarTexto = function () {
    document.querySelectorAll('[data-anim]').forEach(function (el) {
      const tipo = el.getAttribute('data-anim');
      if (animar[tipo]) animar[tipo](el);
    });
  };
  // SplitText mide con la fuente real: esperar a que cargue evita cortes de línea falsos
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(iniciarTexto);
  else window.addEventListener('load', iniciarTexto);

  /* ---------- Imán ---------- */

  if (mouse.matches) {
    document.querySelectorAll('[data-iman]').forEach(function (el) {
      const x = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const y = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', function (e) {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.25);
        y((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', function () { x(0); y(0); });
    });
  }

  /* ---------- Cursor ---------- */

  const cursor = document.querySelector('[data-cursor-el]');
  if (cursor && mouse.matches) {
    const txt = cursor.querySelector('.cursor__txt');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3.out' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) {
      cx(e.clientX); cy(e.clientY);
      cursor.classList.add('visible');
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.classList.remove('visible'); });
    document.addEventListener('pointerover', function (e) {
      const con = e.target.closest('[data-cursor]');
      if (con) { txt.textContent = con.getAttribute('data-cursor'); cursor.classList.add('grande'); }
    });
    document.addEventListener('pointerout', function (e) {
      const con = e.target.closest('[data-cursor]');
      if (con && !con.contains(e.relatedTarget)) cursor.classList.remove('grande');
    });
  }

  KUSAK.gsap = gsap;
  KUSAK.ST = ST;
  KUSAK.listo = true;
  document.dispatchEvent(new CustomEvent('kusak:movimiento'));
})();
