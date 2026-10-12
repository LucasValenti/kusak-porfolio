/* KUSAK · comportamiento de la página de inicio */
(function () {
  'use strict';

  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  const WA = 'https://wa.me/5493415000651';
  const K = window.KUSAK || {};
  const gsap = K.gsap, ST = K.ST;
  const conMovimiento = !!gsap && !K.reducido;

  /* ---------- Hora de Rosario ---------- */

  const reloj = $('[data-reloj]');
  if (reloj) {
    const fmt = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Cordoba' });
    const tic = function () {
      const d = new Date();
      reloj.textContent = fmt.format(d);
      reloj.setAttribute('datetime', d.toISOString());
    };
    tic();
    setInterval(tic, 15000);
  }

  /* ---------- Menú en celular ---------- */

  const menu = $('[data-menu]'), nav = $('#nav');
  if (menu && nav) {
    const cerrar = function () { nav.classList.remove('abierta'); menu.setAttribute('aria-expanded', 'false'); };
    menu.addEventListener('click', function () {
      const abrir = !nav.classList.contains('abierta');
      nav.classList.toggle('abierta', abrir);
      menu.setAttribute('aria-expanded', String(abrir));
      if (abrir) { const a = $('a', nav); if (a) a.focus(); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) cerrar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('abierta')) { cerrar(); menu.focus(); } });
  }

  /* ---------- Cabecera: cambia de tinta sobre las zonas claras ---------- */

  const cabecera = $('[data-cabecera]');
  const claras = $$('.tema-claro, .pie, .carta--acento, .carta--hueso, .carta--piedra');
  if (cabecera && 'IntersectionObserver' in window && claras.length) {
    const debajo = new Set();
    const vigia = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) debajo.add(e.target); else debajo.delete(e.target); });
      cabecera.classList.toggle('sobre-claro', debajo.size > 0);
    }, { rootMargin: '0px 0px -94% 0px' });
    claras.forEach(function (el) { vigia.observe(el); });
  }

  /* ---------- Sección activa en la nav ---------- */

  const secciones = $$('[data-seccion]');
  if ('IntersectionObserver' in window && secciones.length) {
    const marcar = function (id) {
      $$('[data-nav]').forEach(function (a) {
        if (a.getAttribute('data-nav') === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    const io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) marcar(e.target.getAttribute('data-seccion')); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secciones.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Titular: la palabra del servicio rueda letra por letra ---------- */

  const rueda = $('[data-rueda]');
  if (rueda && conMovimiento) {
    const palabras = rueda.getAttribute('data-rueda').split('|');
    let i = 0, timer = null, visible = true;
    const armar = function (texto) {
      const span = document.createElement('span');
      span.className = 'hero__palabra';
      texto.split('').forEach(function (c) {
        const l = document.createElement('span');
        l.className = 'letra';
        l.textContent = c === ' ' ? ' ' : c;
        span.appendChild(l);
      });
      return span;
    };
    let actual = armar(palabras[0]);
    rueda.replaceChildren(actual);
    gsap.from(actual.children, { yPercent: 110, duration: 1.4, stagger: 0.03, delay: 0.15 });
    const siguiente = function () {
      i = (i + 1) % palabras.length;
      const vieja = actual, nueva = armar(palabras[i]);
      nueva.style.position = 'absolute';
      nueva.style.left = '0';
      nueva.style.top = '0';
      rueda.style.position = 'relative';
      rueda.appendChild(nueva);
      gsap.to(vieja.children, { yPercent: -110, duration: 0.9, stagger: 0.022, ease: 'expo.inOut' });
      gsap.fromTo(nueva.children, { yPercent: 110 }, {
        yPercent: 0, duration: 0.9, stagger: 0.022, ease: 'expo.inOut', delay: 0.12,
        onComplete: function () { vieja.remove(); nueva.style.position = ''; actual = nueva; }
      });
    };
    const programar = function () { clearInterval(timer); if (visible && !document.hidden) timer = setInterval(siguiente, 2800); };
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; programar(); }).observe(rueda);
    document.addEventListener('visibilitychange', programar);
  }

  /* ---------- Manifiesto, cartas y proceso con el scroll ---------- */

  if (conMovimiento) {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 821px)', function () {
      // Cartas: la de abajo se achica y se apaga cuando la siguiente le pasa por encima
      const cartas = $$('[data-cartas] .carta');
      cartas.forEach(function (carta, k) {
        const prox = cartas[k + 1];
        if (!prox) return;
        const cuerpo = $('.carta__cuerpo', carta);
        gsap.to(carta, {
          scale: 0.92, ease: 'none',
          scrollTrigger: { trigger: prox, start: 'top bottom', end: 'top top+=80', scrub: true }
        });
        gsap.to(cuerpo, {
          '--velo': 0.55, ease: 'none',
          scrollTrigger: { trigger: prox, start: 'top 60%', end: 'top top+=80', scrub: true }
        });
      });

      // Proceso: se fija y cada paso se enciende a su turno
      const proceso = $('[data-proceso]');
      if (proceso) {
        const pasos = $$('.paso-p', proceso);
        const barra = $('[data-proceso-barra]', proceso);
        proceso.classList.add('con-pin');
        ST.create({
          trigger: proceso, start: 'top top+=' + Math.round(parseFloat(getComputedStyle(document.documentElement).fontSize) * 4.25),
          end: '+=' + (pasos.length * 55) + '%', pin: $('.proceso__fijo', proceso), scrub: true,
          onUpdate: function (self) {
            const n = Math.min(pasos.length - 1, Math.floor(self.progress * pasos.length));
            pasos.forEach(function (p, k) { p.classList.toggle('activo', k === n); p.classList.toggle('hecho', k < n); });
            if (barra) barra.style.transform = 'scaleY(' + self.progress.toFixed(4) + ')';
          }
        });
        return function () { proceso.classList.remove('con-pin'); };
      }
    });
  }

  /* ---------- Fondo del inicio: el video del pulso corre solo mientras se ve ---------- */

  const campo = $('[data-campo]');
  if (campo && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { const p = campo.play(); if (p && p.catch) p.catch(function () {}); }
      else campo.pause();
    }).observe(campo);
  }

  /* ---------- Trabajos: un solo video a la vez, para no cargar la placa ----------
     Con mouse: corre mientras el puntero está sobre la obra; si no, queda el póster.
     En táctil: corre solo el video más centrado en pantalla. */

  const videos = $$('[data-video]');
  if (videos.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const reproducir = function (v) {
      if (v.preload === 'none') v.preload = 'auto';
      const p = v.play();
      if (p && p.catch) p.catch(function () {});
    };
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      videos.forEach(function (v) {
        const obra = v.closest('.obra') || v;
        obra.addEventListener('pointerenter', function () { reproducir(v); });
        obra.addEventListener('pointerleave', function () { v.pause(); });
      });
    } else if ('IntersectionObserver' in window) {
      const ratios = new Map();
      const elegir = function () {
        let mejor = null, max = 0.6;
        ratios.forEach(function (r, v) { if (r >= max) { max = r; mejor = v; } });
        videos.forEach(function (v) { if (v === mejor) reproducir(v); else v.pause(); });
      };
      const vigiaVideo = new IntersectionObserver(function (es) {
        es.forEach(function (e) { ratios.set(e.target, e.intersectionRatio); });
        elegir();
      }, { threshold: [0, 0.3, 0.6, 0.8, 1] });
      videos.forEach(function (v) { vigiaVideo.observe(v); });
    }
  }

  /* ---------- Presupuesto: el asistente arma el mensaje y abre WhatsApp ---------- */

  const form = $('[data-quote]');
  if (form) {
    const vista = $('[data-quote-preview]'), estado = $('[data-quote-status]');
    const nombre = $('#q-nombre', form), negocio = $('#q-negocio', form), detalle = $('#q-detalle', form);
    const SERV = {
      web: 'una página web',
      tienda: 'una tienda online',
      sistema: 'un sistema a medida',
      automatizacion: 'una automatización con IA',
      mantenimiento: 'el mantenimiento de mi web o sistema',
      nose: 'mi negocio, pero todavía no sé bien qué necesito'
    };
    const componer = function () {
      const n = nombre.value.trim(), b = negocio.value.trim(), d = detalle.value.trim();
      const elegido = $('input[name="servicio"]:checked', form);
      let msg = 'Hola, Lucas.';
      if (n) msg += ' Soy ' + n + (b ? ', de ' + b : '') + '.';
      else if (b) msg += ' Te escribo por ' + b + '.';
      msg += ' Quiero pedirte un presupuesto para ' + (elegido ? SERV[elegido.value] : 'mi negocio') + '.';
      if (d) msg += '\n\n' + d;
      return msg;
    };
    const actualizar = function () { vista.textContent = componer(); };
    form.addEventListener('input', actualizar);
    form.addEventListener('change', actualizar);

    // Un paso por vez: Atrás, Siguiente y, al final, Abrir en WhatsApp
    const pasos = $$('.paso', form), indice = $$('[data-indice]');
    const atras = $('[data-atras]', form), siguiente = $('[data-siguiente]', form);
    let actual = 0;
    const mostrar = function (i, enfocar) {
      actual = Math.max(0, Math.min(pasos.length - 1, i));
      pasos.forEach(function (p, k) { p.classList.toggle('paso--actual', k === actual); });
      indice.forEach(function (li, k) {
        if (k === actual) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
      });
      form.classList.toggle('asistente--ultimo', actual === pasos.length - 1);
      atras.disabled = actual === 0;
      if (enfocar) {
        const primero = $('input:checked, input, textarea', pasos[actual]);
        if (primero) primero.focus();
      }
      if (ST) ST.refresh();
    };
    form.classList.add('asistente--pasos');
    atras.addEventListener('click', function () { mostrar(actual - 1, true); });
    siguiente.addEventListener('click', function () { mostrar(actual + 1, true); });
    // Enter en un campo de texto avanza en vez de enviar antes de tiempo
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text' && actual < pasos.length - 1) {
        e.preventDefault();
        mostrar(actual + 1, true);
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const url = WA + '?text=' + encodeURIComponent(componer());
      window.open(url, '_blank', 'noopener');
      estado.textContent = 'Listo: se abrió WhatsApp con tu mensaje. Si no lo ves, ';
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'enlace';
      a.textContent = 'abrilo desde acá';
      estado.appendChild(a);
      estado.appendChild(document.createTextNode('.'));
    });

    // Los "Pedir presupuesto" de cada servicio llegan con el servicio ya elegido
    $$('[data-preselect]').forEach(function (enlace) {
      enlace.addEventListener('click', function () {
        const r = $('input[name="servicio"][value="' + enlace.getAttribute('data-preselect') + '"]', form);
        if (r) { r.checked = true; actualizar(); mostrar(1, false); }
      });
    });
    mostrar(0, false);
    actualizar();
  }
})();
