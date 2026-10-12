/* KUSAK · campo del inicio
   Un fragment shader propio: ruido que fluye, tramado en puntos como un impreso nocturno,
   que se enciende con el color de acento alrededor del mouse. Sin librerías.
   Se pausa fuera de pantalla y con la pestaña oculta; con movimiento reducido dibuja un solo cuadro. */
(function () {
  'use strict';

  const canvas = document.querySelector('[data-campo]');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return;

  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Dos pasadas: el ruido se calcula una vez por celda en una textura chica,
  // y la segunda pasada solo dibuja el punto de cada celda. Así cuesta poco hasta en celulares.
  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG_CAMPO = [
    'precision mediump float;',
    'uniform vec2 uGrid;uniform float uT;uniform vec2 uM;uniform float uMf;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int k=0;k<5;k++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uGrid.y;',
    ' float t=uT*.045;',
    ' vec2 q=vec2(fbm(uv*1.6+t),fbm(uv*1.6-t+3.1));',
    ' float f=fbm(uv*1.4+q*1.8+vec2(t*.6,-t*.3));',
    ' float d=distance(uv,uM/uGrid.y);',
    ' float halo=exp(-d*d*9.)*uMf;',
    // El halo se apaga en la franja de abajo, donde hay texto chico
    ' halo*=smoothstep(.3,.62,gl_FragCoord.y/uGrid.y);',
    ' float v=smoothstep(.38,.92,f)+halo*.55;',
    ' v*=1.-.5*clamp(gl_FragCoord.y/uGrid.y,0.,1.);',
    ' gl_FragColor=vec4(v,clamp(halo*1.4,0.,1.),0.,1.);',
    '}'
  ].join('\n');
  const FRAG_PUNTOS = [
    'precision mediump float;',
    'uniform sampler2D uTex;uniform vec2 uGrid;uniform float uCel;uniform vec3 uA;',
    'void main(){',
    ' vec2 frag=gl_FragCoord.xy;',
    ' vec2 celda=floor(frag/uCel);',
    ' vec4 s=texture2D(uTex,(celda+.5)/uGrid);',
    ' float r=length(frag-(celda+.5)*uCel)/(uCel*.5);',
    ' float punto=1.-smoothstep(s.r*.95,s.r*.95+.12,r);',
    ' vec3 base=vec3(.051,.051,.047);',
    ' vec3 tinta=mix(vec3(.30,.295,.28),uA,s.g);',
    ' gl_FragColor=vec4(mix(base,tinta,punto*.9),1.);',
    '}'
  ].join('\n');

  const compilar = function (tipo, src) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const programa = function (frag) {
    const vs = compilar(gl.VERTEX_SHADER, VERT), fs = compilar(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'p');
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  };
  const pCampo = programa(FRAG_CAMPO), pPuntos = programa(FRAG_PUNTOS);
  if (!pCampo || !pPuntos) return;

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const ubic = function (p, nombres) {
    const o = {};
    nombres.forEach(function (k) { o[k] = gl.getUniformLocation(p, k); });
    return o;
  };
  const UC = ubic(pCampo, ['uGrid', 'uT', 'uM', 'uMf']);
  const UP = ubic(pPuntos, ['uTex', 'uGrid', 'uCel', 'uA']);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer();

  // El color de acento sale del CSS, así el campo sigue al acento elegido
  let acento = [1, 0.82, 0.12];
  const leerAcento = function () {
    const probe = document.createElement('span');
    probe.style.color = 'var(--acento)';
    document.body.appendChild(probe);
    const m = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) || [255, 210, 31];
    probe.remove();
    acento = [m[0] / 255, m[1] / 255, m[2] / 255];
  };
  leerAcento();

  let dpr = 1, ancho = 0, alto = 0, cel = 9, gw = 1, gh = 1;
  const medir = function () {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    ancho = canvas.clientWidth; alto = canvas.clientHeight;
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    cel = Math.round((ancho < 700 ? 7 : 9) * dpr);
    gw = Math.ceil(canvas.width / cel); gh = Math.ceil(canvas.height / cel);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gw, gh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  medir();

  // Mouse suavizado: el halo llega con retardo, no salta
  let mx = canvas.width * 0.7, my = canvas.height * 0.45, tx = mx, ty = my, fuerza = 0, fuerzaObj = 0.35;
  window.addEventListener('pointermove', function (e) {
    const r = canvas.getBoundingClientRect();
    tx = (e.clientX - r.left) * dpr;
    ty = (r.bottom - e.clientY) * dpr;
    fuerzaObj = 1;
  }, { passive: true });

  const t0 = performance.now();
  const dibujar = function (ahora) {
    mx += (tx - mx) * 0.07; my += (ty - my) * 0.07;
    fuerza += (fuerzaObj - fuerza) * 0.04;
    // Pasada 1: el campo, una muestra por celda
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, gw, gh);
    gl.useProgram(pCampo);
    gl.uniform2f(UC.uGrid, gw, gh);
    gl.uniform1f(UC.uT, (ahora - t0) / 1000);
    gl.uniform2f(UC.uM, mx / cel, my / cel);
    gl.uniform1f(UC.uMf, fuerza);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Pasada 2: un punto por celda, del tamaño que pide el campo
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(pPuntos);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(UP.uTex, 0);
    gl.uniform2f(UP.uGrid, gw, gh);
    gl.uniform1f(UP.uCel, cel);
    gl.uniform3f(UP.uA, acento[0], acento[1], acento[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let corriendo = false, visible = true, raf = 0;
  const bucle = function (ahora) { dibujar(ahora); raf = requestAnimationFrame(bucle); };
  const decidir = function () {
    const debe = !reducido && visible && !document.hidden;
    if (debe && !corriendo) { corriendo = true; raf = requestAnimationFrame(bucle); }
    else if (!debe && corriendo) { corriendo = false; cancelAnimationFrame(raf); }
  };

  let rt = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { medir(); if (!corriendo) dibujar(performance.now()); }, 150);
  });
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; decidir(); }).observe(canvas);
  document.addEventListener('visibilitychange', decidir);

  dibujar(t0 + 12000);
  decidir();
})();
