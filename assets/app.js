/* Comportamiento de la página: las capturas que se recorren, el menú y el presupuesto que arma el mensaje de
   WhatsApp. Con movimiento reducido, todo queda quieto y encendido. */
(function () {
  'use strict';

  const WA = 'https://wa.me/5493415000651';
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = function (s, c) { return (c || document).querySelector(s); };
  const $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  const raiz = document.documentElement;
  const alCambiar = function (mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else mq.addListener(fn); };
  const acotar = function (v) { return Math.min(1, Math.max(0, v)); };

  /* ---------- Trabajos: el sitio entero pasa por la vidriera con el scroll ---------- */

  const ventanas = $$('[data-recorrido]');
  // Con movimiento reducido no hay recorrido: la captura se desplaza a mano, también con teclado
  const manual = function () {
    ventanas.forEach(function (v) {
      if (quieto.matches) {
        v.tabIndex = 0;
        v.setAttribute('role', 'region');
        v.setAttribute('aria-label', 'Captura del sitio. Usá las flechas para recorrerla.');
      } else {
        v.removeAttribute('tabindex');
        v.removeAttribute('role');
        v.removeAttribute('aria-label');
      }
    });
  };
  manual();
  alCambiar(quieto, manual);
  // Donde el navegador sabe animar con el scroll (CSS animation-timeline), lo hace el CSS
  // fuera del hilo principal; este código queda como respaldo para los demás.
  const recorreCSS = !!(window.CSS && CSS.supports('animation-timeline', 'view()'));
  const enVista = new Set();
  function recorrer() {
    if (quieto.matches) return;
    const vh = window.innerHeight;
    enVista.forEach(function (v) {
      const img = $('img', v);
      if (!img || !img.naturalWidth) return;
      const r = v.getBoundingClientRect();
      const p = acotar((vh - r.top) / (vh + r.height));
      const q = acotar((p - .12) / .76);
      const s = q * q * (3 - 2 * q);
      const y = Math.max(0, Math.round((r.width * img.naturalHeight / img.naturalWidth - r.height) * s));
      img.style.transform = 'translate3d(0,' + -y + 'px,0)';
    });
  }
  if (!recorreCSS && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) enVista.add(e.target); else enVista.delete(e.target); });
      recorrer();
    }, { rootMargin: '15% 0px' });
    ventanas.forEach(function (v) {
      io.observe(v);
      $('img', v).addEventListener('load', recorrer);
    });
    let rp = false;
    window.addEventListener('scroll', function () {
      if (rp || !enVista.size) return;
      rp = true;
      requestAnimationFrame(function () { rp = false; recorrer(); });
    }, { passive: true });
    window.addEventListener('resize', recorrer);
    // Si se activa el movimiento reducido con la página abierta, las capturas vuelven arriba y quedan quietas
    alCambiar(quieto, function () {
      if (quieto.matches) ventanas.forEach(function (v) { $('img', v).style.transform = ''; });
      else recorrer();
    });
  }

  /* ---------- Posición en la barra y menú ---------- */

  const barra = $('[data-barra]');
  if (barra) {
    const tramos = $$('[data-tramo]', barra);
    const secciones = ['inicio', 'trabajos', 'servicios', 'como-trabajo', 'presupuesto'].map(function (id) { return document.getElementById(id); });
    const marcar = function (i) {
      tramos.forEach(function (t) {
        if (+t.getAttribute('data-tramo') === i && i > 0) t.setAttribute('aria-current', 'true');
        else t.removeAttribute('aria-current');
      });
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) marcar(secciones.indexOf(e.target)); });
      }, { rootMargin: '-40% 0px -55% 0px' });
      secciones.forEach(function (s) { if (s) io.observe(s); });
    }

    const botonMenu = $('.barra__menu', barra), nav = $('#navegacion', barra);
    const abierto = function () { return botonMenu.getAttribute('aria-expanded') === 'true'; };
    const abrirMenu = function (si) {
      botonMenu.setAttribute('aria-expanded', String(si));
      barra.classList.toggle('menu-abierto', si);
    };
    botonMenu.addEventListener('click', function () { abrirMenu(!abierto()); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) abrirMenu(false); });
    // Escape cierra y devuelve el foco al botón si estaba en el menú
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !abierto()) return;
      const dentro = nav.contains(document.activeElement);
      abrirMenu(false);
      if (dentro) botonMenu.focus();
    });
    // También se cierra si el foco o un toque salen de la barra
    barra.addEventListener('focusout', function (e) {
      if (abierto() && e.relatedTarget && !barra.contains(e.relatedTarget)) abrirMenu(false);
    });
    document.addEventListener('click', function (e) {
      if (abierto() && !barra.contains(e.target)) abrirMenu(false);
    });
  }

  /* ---------- Presupuesto: arma el mensaje en el cartel LED y abre WhatsApp ---------- */

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
    const chat = $('.chat');
    const actualizar = function () {
      vista.textContent = componer();
      // Un mensaje cambiado vuelve a estar sin enviar
      if (chat) chat.classList.remove('chat--enviado');
    };
    form.addEventListener('input', actualizar);
    form.addEventListener('change', actualizar);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const url = WA + '?text=' + encodeURIComponent(componer());
      window.open(url, '_blank', 'noopener');
      // La burbuja "se envía": sube, los tildes se vuelven celestes y Capitán salta
      if (chat) {
        chat.classList.remove('chat--enviado');
        void chat.offsetWidth;
        chat.classList.add('chat--enviado');
      }
      estado.textContent = 'Listo: se abrió WhatsApp con tu mensaje. Si no lo ves, ';
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'abrilo desde acá';
      estado.appendChild(a);
      estado.appendChild(document.createTextNode('.'));
    });
    $$('[data-preselect]').forEach(function (enlace) {
      enlace.addEventListener('click', function () {
        const r = $('input[name="servicio"][value="' + enlace.getAttribute('data-preselect') + '"]', form);
        if (r) { r.checked = true; actualizar(); }
      });
    });
    actualizar();
  }

  /* ---------- Inicio: la captura crece de tarjeta a pantalla completa ---------- */
  // Versión en JS plano de ScrollExpandMedia (21st.dev), con sticky en lugar de frenar
  // la rueda. Por cuadro solo cambian el recorte (clip-path) y transforms.
  const inicio = $('[data-expande]');
  if (inicio) {
    const escena = $('.inicio__escena', inicio);
    const media = $('[data-expande-media]', inicio);
    const img = $('img', media);
    const caso = $('[data-expande-caso]', inicio);
    const izq = $$('[data-izq]', inicio);
    const der = $$('[data-der]', inicio);
    const suave = function (t) { return 1 - Math.pow(1 - t, 2); };
    let W = 0, H = 0, w0 = 0, h0 = 0, tope = 0, celu = false, pedido = false;

    const medir = function () {
      const vw = escena.clientWidth;
      const vh = escena.clientHeight;
      celu = vw <= 760;
      tope = parseFloat(getComputedStyle(escena).top) || 0;
      W = Math.min(vw * (celu ? 1 : 0.95), 1560);
      H = Math.min(vh * (celu ? 0.82 : 0.86), 940);
      w0 = celu ? 236 : 300;
      h0 = celu ? 300 : 380;
      media.style.width = W + 'px';
      media.style.height = H + 'px';
    };
    const pintar = function () {
      pedido = false;
      const r = inicio.getBoundingClientRect();
      const p = acotar((tope - r.top) / Math.max(1, r.height - escena.clientHeight));
      const e = suave(acotar(p / 0.7));
      const c = acotar((p - 0.72) / 0.18);
      const w = w0 + (W - w0) * e;
      const h = h0 + (H - h0) * e;
      const y = (H - h) / 2;
      media.style.clipPath = 'inset(' + y.toFixed(1) + 'px ' + ((W - w) / 2).toFixed(1) + 'px round ' + (16 * (1 - e)).toFixed(1) + 'px)';
      img.style.transform = 'translateY(' + y.toFixed(1) + 'px) scale(' + (w / W).toFixed(4) + ')';
      const corre = e * (celu ? 110 : 100);
      izq.forEach(function (n) { n.style.transform = 'translateX(' + (-corre).toFixed(2) + 'vw)'; });
      der.forEach(function (n) { n.style.transform = 'translateX(' + corre.toFixed(2) + 'vw)'; });
      inicio.style.setProperty('--e', e.toFixed(3));
      inicio.style.setProperty('--c', c.toFixed(3));
      // Mientras el caso no se ve, su botón no recibe foco
      caso.style.visibility = c > 0.05 ? 'visible' : 'hidden';
    };
    const pedir = function () { if (!pedido) { pedido = true; requestAnimationFrame(pintar); } };
    const alRedimensionar = function () { medir(); pintar(); };

    const activar = function () {
      if (quieto.matches) {
        inicio.classList.remove('inicio--expande');
        [media, img, caso].concat(izq, der).forEach(function (n) { n.removeAttribute('style'); });
        inicio.removeAttribute('style');
        window.removeEventListener('scroll', pedir);
        window.removeEventListener('resize', alRedimensionar);
        return;
      }
      inicio.classList.add('inicio--expande');
      alRedimensionar();
      window.addEventListener('scroll', pedir, { passive: true });
      window.addEventListener('resize', alRedimensionar);
    };
    activar();
    alCambiar(quieto, activar);
  }

  /* ---------- Cómo trabajo: la escalera se dibuja y cada numeral se estampa ---------- */
  const escalera = $('.pasos__lista');
  if (escalera && !quieto.matches && 'IntersectionObserver' in window) {
    escalera.classList.add('pasos__lista--espera');
    const vigia = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      escalera.classList.add('pasos__lista--arma');
      vigia.disconnect();
    }, { rootMargin: '0px 0px -20% 0px' });
    vigia.observe(escalera);
  }

  // La hora de la burbuja del chat es la del visitante
  const hora = $('[data-hora]');
  if (hora) {
    const d = new Date();
    hora.textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }
})();
