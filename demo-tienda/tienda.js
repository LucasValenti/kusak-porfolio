/* Barranca · demo de tienda: ficha de producto con View Transitions, carrito y paralaje */
(function () {
  'use strict';

  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  const K = window.KUSAK || {};
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pesos = function (n) { return '$ ' + Number(n).toLocaleString('es-AR'); };

  // Con un diálogo abierto el scroll suave se frena, así la página de atrás no se mueve
  const frenar = function (si) { if (K.lenis) { if (si) K.lenis.stop(); else K.lenis.start(); } };

  // Cambia el DOM dentro de una View Transition cuando el navegador la soporta
  const transicion = function (cambio) {
    if (document.startViewTransition && !reducido) return document.startViewTransition(cambio);
    cambio();
    return null;
  };

  /* ---------- Carrito ---------- */

  const carrito = new Map();
  const dlgCarrito = $('[data-carrito]');
  const lista = $('[data-lista]'), vacio = $('[data-vacio]'), total = $('[data-total]');
  const cuenta = $('[data-cuenta]'), botonCarrito = $('[data-abrir-carrito]');
  const aviso = $('[data-aviso]');
  let avisoT = 0;

  const datos = function (li) {
    return { slug: li.dataset.slug, nombre: li.dataset.nombre, precio: Number(li.dataset.precio), variante: li.dataset.variante, desc: li.dataset.desc };
  };

  const pintar = function () {
    let n = 0, suma = 0;
    lista.replaceChildren();
    carrito.forEach(function (item) {
      n += item.cant;
      suma += item.cant * item.precio;
      const li = document.createElement('li');
      li.className = 'carrito__item';
      const img = document.createElement('img');
      img.src = 'assets/img/' + item.slug + '-540.webp';
      img.width = 72; img.height = 96; img.alt = '';
      const txt = document.createElement('div');
      const p = document.createElement('p');
      p.textContent = item.nombre;
      const small = document.createElement('small');
      small.textContent = item.variante;
      p.appendChild(small);
      const cant = document.createElement('div');
      cant.className = 'carrito__cant';
      const menos = document.createElement('button');
      menos.type = 'button'; menos.textContent = '−'; menos.setAttribute('aria-label', 'Uno menos de ' + item.nombre);
      const num = document.createElement('span'); num.textContent = item.cant;
      const mas = document.createElement('button');
      mas.type = 'button'; mas.textContent = '+'; mas.setAttribute('aria-label', 'Uno más de ' + item.nombre);
      menos.addEventListener('click', function () { cambiar(item.slug, -1); });
      mas.addEventListener('click', function () { cambiar(item.slug, 1); });
      cant.append(menos, num, mas);
      txt.append(p, cant);
      const precio = document.createElement('strong');
      precio.textContent = pesos(item.cant * item.precio);
      li.append(img, txt, precio);
      lista.appendChild(li);
    });
    vacio.hidden = n > 0;
    total.textContent = pesos(suma);
    cuenta.textContent = n;
  };

  const cambiar = function (slug, delta) {
    const item = carrito.get(slug);
    if (!item) return;
    item.cant += delta;
    if (item.cant <= 0) carrito.delete(slug);
    pintar();
  };

  const agregar = function (d, cant) {
    const item = carrito.get(d.slug) || Object.assign({ cant: 0 }, d);
    item.cant += cant;
    carrito.set(d.slug, item);
    pintar();
    botonCarrito.classList.remove('salta');
    void botonCarrito.offsetWidth;
    botonCarrito.classList.add('salta');
    aviso.textContent = d.nombre + (cant > 1 ? ' × ' + cant : '') + ' en el carrito';
    aviso.classList.add('visible');
    clearTimeout(avisoT);
    avisoT = setTimeout(function () { aviso.classList.remove('visible'); }, 2200);
  };

  botonCarrito.addEventListener('click', function () {
    $('[data-estado]').textContent = '';
    dlgCarrito.showModal();
    frenar(true);
  });

  $('[data-finalizar]').addEventListener('click', function () {
    const estado = $('[data-estado]');
    estado.textContent = carrito.size
      ? 'Esto es una demo: acá seguiría el pago con Mercado Pago o el pedido por WhatsApp. No se cobra nada.'
      : 'Agregá algún producto para probar el carrito.';
  });

  /* ---------- Ficha de producto ---------- */

  const ficha = $('[data-ficha]');
  const fImg = $('[data-ficha-img]'), fNom = $('[data-ficha-nombre]'), fPre = $('[data-ficha-precio]');
  const fVar = $('[data-ficha-variante]'), fDesc = $('[data-ficha-desc]'), fCant = $('[data-cantidad]');
  let actual = null, origen = null, cant = 1;

  const abrirFicha = function (li) {
    actual = datos(li);
    origen = $('.producto__abrir img', li);
    cant = 1;
    fCant.textContent = cant;
    origen.style.viewTransitionName = 'foto-producto';
    const t = transicion(function () {
      origen.style.viewTransitionName = '';
      fImg.src = 'assets/img/' + actual.slug + '-900.webp';
      fImg.alt = actual.nombre + ', ' + actual.variante.toLowerCase();
      fImg.style.viewTransitionName = 'foto-producto';
      fNom.textContent = actual.nombre;
      fPre.textContent = pesos(actual.precio);
      fVar.textContent = actual.variante;
      fDesc.textContent = actual.desc;
      ficha.showModal();
    });
    frenar(true);
    if (t) t.finished.finally(function () { fImg.style.viewTransitionName = ''; });
  };

  const cerrarFicha = function () {
    if (!ficha.open) return;
    fImg.style.viewTransitionName = 'foto-producto';
    const t = transicion(function () {
      fImg.style.viewTransitionName = '';
      ficha.close();
      if (origen) origen.style.viewTransitionName = 'foto-producto';
    });
    const limpiar = function () { if (origen) origen.style.viewTransitionName = ''; };
    if (t) t.finished.finally(limpiar); else limpiar();
  };

  $$('.producto').forEach(function (li) {
    $('.producto__abrir', li).addEventListener('click', function () { abrirFicha(li); });
    $('[data-agregar]', li).addEventListener('click', function () { agregar(datos(li), 1); });
  });
  $('[data-menos]', ficha).addEventListener('click', function () { cant = Math.max(1, cant - 1); fCant.textContent = cant; });
  $('[data-mas]', ficha).addEventListener('click', function () { cant = Math.min(9, cant + 1); fCant.textContent = cant; });
  $('[data-ficha-agregar]', ficha).addEventListener('click', function () {
    agregar(actual, cant);
    cerrarFicha();
  });

  // Cerrar: botón, Escape (cancel) o clic afuera de la caja
  [ficha, dlgCarrito].forEach(function (dlg) {
    $('[data-cerrar]', dlg).addEventListener('click', function () { if (dlg === ficha) cerrarFicha(); else dlg.close(); });
    dlg.addEventListener('cancel', function (e) { if (dlg === ficha) { e.preventDefault(); cerrarFicha(); } });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) { if (dlg === ficha) cerrarFicha(); else dlg.close(); } });
    dlg.addEventListener('close', function () { frenar(false); });
  });

  pintar();

  /* ---------- Movimiento: portada y foto del taller ---------- */

  if (K.gsap && !reducido) {
    const gsap = K.gsap;
    gsap.from('[data-hero-foto]', { scale: 1.12, duration: 2.2, ease: 'expo.out' });
    gsap.to('[data-hero-foto]', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.t-hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.fromTo('[data-paralaje]', { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.t-taller', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('.grilla').forEach(function (g) {
      gsap.from($$('.producto', g), { y: 60, opacity: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: g, start: 'top 85%', once: true } });
    });
  }
})();
