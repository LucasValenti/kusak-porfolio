/* KUSAK · campo del inicio: "Pulso"
   Un fragment shader propio: líneas horizontales finas que se levantan en picos, como una señal,
   y se encienden en el color de acento donde pasa el mouse. Sin librerías.
   Para cuidar la placa de video: densidad 1, 30 cuadros por segundo con el mouse quieto (60 cuando se
   mueve) y 30 fijos si el equipo no llega. Se pausa fuera de pantalla y con la pestaña oculta;
   con movimiento reducido dibuja un solo cuadro. */
(function () {
  'use strict';

  const canvas = document.querySelector('[data-campo]');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uT;uniform vec2 uM;uniform float uMf;uniform vec3 uA;uniform float uN;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;float t=uT*.25;vec2 m=uM/uRes;',
    ' float lineas=0.,brillo=0.;',
    // Solo las líneas que pueden pasar por este píxel: los picos suben como mucho ~0,12 de alto
    ' float k0=floor((uv.y-.12)*uN-.5);',
    ' for(int j=0;j<10;j++){',
    '  float k=k0+float(j);if(k<0.||k>=uN)continue;',
    '  float base=(k+.5)/uN;',
    // Envolvente: una montaña fija hacia la derecha y otra que sigue al mouse
    '  float cerca=exp(-pow((uv.x-m.x)*6.,2.))*exp(-pow((base-m.y)*5.,2.))*uMf;',
    '  float env=exp(-pow((uv.x-.66)*3.2,2.))*.9+cerca*.7;',
    '  vec2 q=vec2(uv.x*6.+k*.37,k*.21+t);',
    '  float off=env*(n(q)*.7+n(q*2.3+4.1)*.3-.35)*.11;',
    '  float dy=abs(uv.y-(base+off))*uRes.y;',
    '  float l=1.-smoothstep(.6,1.6,dy);',
    '  lineas=max(lineas,l*(.45+env*.6));',
    '  brillo=max(brillo,l*cerca);',
    ' }',
    // El encendido se apaga en la franja de abajo, donde hay texto chico
    ' brillo*=smoothstep(.3,.62,uv.y);',
    // y las líneas bajan de intensidad ahí, para que la bajada y las etiquetas se lean limpias
    ' lineas*=mix(.5,1.,smoothstep(.22,.55,uv.y));',
    ' vec3 base=vec3(.051,.051,.047);',
    ' vec3 tinta=mix(vec3(.36,.354,.336),uA,clamp(brillo*1.8,0.,1.));',
    ' gl_FragColor=vec4(mix(base,tinta,clamp(lineas,0.,1.)),1.);',
    '}'
  ].join('\n');

  const compilar = function (tipo, src) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compilar(gl.VERTEX_SHADER, VERT), fs = compilar(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'p');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['uRes', 'uT', 'uM', 'uMf', 'uA', 'uN'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

  // El color de acento sale del CSS
  const probe = document.createElement('span');
  probe.style.color = 'var(--acento)';
  document.body.appendChild(probe);
  const c = (getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) || [255, 210, 31]).map(Number);
  probe.remove();
  gl.uniform3f(U.uA, c[0] / 255, c[1] / 255, c[2] / 255);

  let dpr = 1;
  const medir = function () {
    const ancho = canvas.clientWidth, alto = canvas.clientHeight;
    // Densidad 1 siempre: las líneas de 1 px se ven igual y en pantallas retina son 4 veces menos píxeles
    dpr = 1;
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uN, ancho < 700 ? 30 : 46);
  };
  medir();

  // Mouse suavizado: los picos llegan con retardo, no saltan
  let mx = canvas.width * 0.7, my = canvas.height * 0.6, tx = mx, ty = my, fuerza = 0, fuerzaObj = 0.35;
  let ultimoMov = -1e9;
  window.addEventListener('pointermove', function (e) {
    ultimoMov = performance.now();
    const r = canvas.getBoundingClientRect();
    tx = (e.clientX - r.left) * dpr;
    ty = (r.bottom - e.clientY) * dpr;
    fuerzaObj = 1;
  }, { passive: true });

  const t0 = performance.now();
  const dibujar = function (ahora) {
    mx += (tx - mx) * 0.07; my += (ty - my) * 0.07;
    fuerza += (fuerzaObj - fuerza) * 0.04;
    gl.uniform1f(U.uT, (ahora - t0) / 1000 + 20);
    gl.uniform2f(U.uM, mx, my);
    gl.uniform1f(U.uMf, fuerza);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let corriendo = false, visible = true, raf = 0;
  // 60 cuadros por segundo mientras el mouse se mueve, 30 cuando está quieto; si el equipo no llega
  // (cuadros de más de 24 ms en promedio), queda en 30 para siempre
  let anterior = 0, lento = false, muestras = 0, suma = 0;
  const bucle = function (ahora) {
    raf = requestAnimationFrame(bucle);
    const movil = !lento && ahora - ultimoMov < 1500;
    if (!movil && ahora - anterior < 31) return;
    // Solo se mide mientras se apunta a 60: ahí un promedio alto quiere decir que el equipo no llega
    if (movil && anterior && ahora - anterior < 200 && muestras < 90) {
      suma += ahora - anterior; muestras++;
      if (muestras === 90 && suma / muestras > 24) lento = true;
    }
    anterior = ahora;
    dibujar(ahora);
  };
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

  dibujar(t0);
  decidir();
})();
