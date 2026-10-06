/* Capitán, el perro de Lucas: la única vez que aparece en la página. Cuando dejás
   el inicio llega caminando a la esquina de abajo a la derecha y se sienta; ahí se queda, sin
   tapar nada. En cada sección da un saltito para avisar que tiene algo para decir,
   y su globo solo se abre cuando lo tocás. Ningún globo se cierra solo: se cierra
   con Chau, con Escape o tocándolo de nuevo. Con movimiento reducido no se anima. */
(function () {
  'use strict';

  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Cuadros de pixel en una tira de 48x40: 0-7 camina hacia la derecha,
     8-14 se sienta (el 14 es el perro ya sentado). */
  const ANCHO = 48, ALTO = 40, CAMINA = 8, SENTADO = 14;
  const tira = new Image();
  tira.src = new URL('capitan/paseo.png', document.currentScript.src).href;

  /* ---------- Capitán acompañante: una frase por sección ---------- */

  const PASOS = [
    { id: 'inicio' },
    { id: 'trabajos', texto: 'Estas webs las hizo Lucas. Podés recorrerlas con el scroll.', ir: '#servicios', boton: 'Ver servicios' },
    { id: 'proximo', texto: '¿Ves el hueco? Ahí puede ir tu página.', ir: '#servicios', boton: 'Ver servicios' },
    { id: 'servicios', texto: 'Elegí lo que necesita tu negocio.', ir: '#como-trabajo', boton: 'Cómo trabaja' },
    { id: 'como-trabajo', texto: 'Así trabaja Lucas, en cuatro pasos.', ir: '#presupuesto', boton: 'Pedir presupuesto' },
    { id: 'presupuesto', texto: 'Completá la hoja y se arma tu mensaje.', ir: '#contacto', boton: 'Ir al final' }
  ].filter(function (p) { return document.getElementById(p.id); });

  let despedido = false;
  try { despedido = sessionStorage.getItem('capitan-chau') === '1'; } catch (err) { /* sin storage */ }
  if (despedido || PASOS.length < 2) return;

  const guia = document.createElement('aside');
  guia.className = 'guia';
  guia.hidden = true;
  guia.setAttribute('aria-label', 'Capitán, el perro que te guía');
  guia.innerHTML =
    '<div class="guia__andar">' +
    '<div class="guia__globo" hidden>' +
      '<p class="guia__texto"></p>' +
      '<div class="guia__acciones"><a class="boton boton--accion boton--mini guia__ir" href="#"></a><button type="button" class="guia__chau">Chau</button></div>' +
    '</div>' +
    '<button type="button" class="guia__perro" aria-expanded="false" aria-label="Capitán: ¿qué sigue?"><canvas width="48" height="40"></canvas></button>' +
    '</div>';
  document.body.appendChild(guia);

  const caja = guia.querySelector('.guia__globo');
  const texto = guia.querySelector('.guia__texto');
  const ir = guia.querySelector('.guia__ir');
  const boton2 = guia.querySelector('.guia__perro');
  const lienzo = boton2.querySelector('canvas');
  const ctx = lienzo.getContext('2d');
  function cuadro(n) {
    if (!tira.complete || !tira.naturalWidth) return;
    ctx.clearRect(0, 0, ANCHO, ALTO);
    ctx.drawImage(tira, n * ANCHO, 0, ANCHO, ALTO, 0, 0, ANCHO, ALTO);
  }
  tira.addEventListener('load', function () { cuadro(SENTADO); });
  cuadro(SENTADO);

  // Al hablar da dos saltitos (el CSS hace el salto)
  let saltos = 0;
  function hablar(ms) {
    if (quieto.matches) return;
    clearTimeout(saltos);
    guia.classList.add('guia--habla');
    saltos = setTimeout(function () { guia.classList.remove('guia--habla'); }, ms);
  }
  let actual = '', paso = null, presentado = false, llego = false;

  function abrir(si) {
    caja.hidden = !si;
    boton2.setAttribute('aria-expanded', si ? 'true' : 'false');
  }

  // La primera vez que se abre, se presenta antes de comentar la sección
  function rellenar() {
    texto.textContent = (presentado ? '' : '¡Guau! Soy Capitán, el perro de Lucas. ') + paso.texto;
    ir.textContent = paso.boton;
    ir.href = paso.ir;
  }

  /* La primera vez llega caminando desde el borde (el CSS lo desplaza) y se sienta.
     Después se queda quieto en su esquina. */
  let reloj = 0;
  function llegar() {
    llego = true;
    if (quieto.matches) { cuadro(SENTADO); return; }
    guia.classList.add('guia--llega');
    let n = 0;
    reloj = setInterval(function () {
      if (n < CAMINA) { cuadro(n++); return; }
      if (n < SENTADO) { cuadro(++n); return; }
      clearInterval(reloj);
      guia.classList.remove('guia--llega');
    }, 100);
  }

  function ubicar() {
    // Gana la última sección de la lista que cruza el centro de la pantalla
    const linea = window.innerHeight * .45;
    let p = PASOS[0];
    PASOS.forEach(function (q) {
      const r = document.getElementById(q.id).getBoundingClientRect();
      if (r.top <= linea && r.bottom > linea) p = q;
    });
    if (p.id === actual) return;
    actual = p.id;
    // En el inicio y en el cierre no hace falta: ahí ya están las acciones a la vista
    if (!p.texto) { guia.hidden = true; abrir(false); return; }
    paso = p;
    guia.hidden = false;
    if (!llego) { llegar(); return; }
    rellenar();
    // Sin abrir el globo, avisa con un saltito que tiene algo para esta sección
    hablar(720);
  }

  // Se recalcula solo cuando una sección cruza la línea del 45 % de la pantalla
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(ubicar, { rootMargin: '-45% 0px -55% 0px' });
    PASOS.forEach(function (q) { io.observe(document.getElementById(q.id)); });
  }
  ubicar();

  // Al mandar el presupuesto, festeja con un saltito
  const hoja = document.querySelector('form[data-quote]');
  if (hoja) hoja.addEventListener('submit', function () { hablar(720); });

  boton2.addEventListener('click', function () {
    if (caja.hidden) { rellenar(); abrir(true); presentado = true; } else abrir(false);
  });
  guia.addEventListener('keydown', function (e) { if (e.key === 'Escape') { abrir(false); boton2.focus(); } });
  ir.addEventListener('click', function () { abrir(false); });
  guia.querySelector('.guia__chau').addEventListener('click', function () {
    guia.remove();
    try { sessionStorage.setItem('capitan-chau', '1'); } catch (err) { /* sin storage */ }
  });
})();
