/* KUSAK · fondo del inicio: "Prisma"
   Una cinta de luz que ondula en el tercio de abajo: núcleo blanco cálido, bordes amarillos
   y un eco gris, que se dobla hacia el dedo o el mouse. Muy liviano a propósito:
   - pocas operaciones por píxel (tres senos y tres divisiones);
   - se dibuja a media resolución: la luz es difusa, así que no se nota;
   - 30 cuadros por segundo en reposo y 60 mientras se toca;
   - se pausa fuera de pantalla y con la pestaña oculta; con movimiento reducido, un solo cuadro. */
(function () {
  'use strict';

  const canvas = document.querySelector('[data-campo]');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ESCALA = 0.5;

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uT;uniform vec2 uM;uniform float uF;uniform vec3 uA;',
    'void main(){',
    ' float lado=min(uRes.x,uRes.y);',
    ' vec2 p=(gl_FragCoord.xy*2.-uRes)/lado;',
    ' vec2 m=(uM*2.-uRes)/lado;',
    // Altura: en el tercio de abajo, con la pantalla horizontal o vertical
    // y la ondulación es más baja en pantallas horizontales, para no pisar la bajada ni los botones
    ' float vertical=step(uRes.x,uRes.y);',
    ' float bajo=mix(-.84,-.72*uRes.y/lado,vertical);',
    ' float amp=mix(.17,.32,vertical);',
    ' float t=uT*.35;float d=length(p)*.06;',
    ' float y1=bajo-sin((p.x*(1.+d)+t)*1.1)*amp;',
    ' float y2=bajo-sin((p.x+t)*1.1)*amp;',
    ' float y3=bajo-sin((p.x*(1.-d*1.6)+t-.25)*1.1)*amp*1.12;',
    // La cinta se dobla hacia el dedo mientras se toca
    // y solo si el dedo está cerca de la cinta: lejos, no la arrastra encima del texto
    ' float tira=uF*exp(-pow((p.x-m.x)*2.2,2.))*.7*smoothstep(.75,.2,abs(m.y-bajo));',
    ' y1+=(m.y-y1)*tira;y2+=(m.y-y2)*tira;y3+=(m.y-y3)*tira*.6;',
    ' float a=.03/abs(p.y-y1),b=.022/abs(p.y-y2),g=.02/abs(p.y-y3);',
    ' vec3 c=uA*min(a,1.6)+vec3(1.,.96,.86)*min(b,1.4)*.7+vec3(.55,.54,.5)*min(g,1.2)*.5;',
    ' gl_FragColor=vec4(vec3(.051,.051,.047)+c*.85,1.);',
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
  ['uRes', 'uT', 'uM', 'uF', 'uA'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

  // El amarillo sale del CSS
  const probe = document.createElement('span');
  probe.style.color = 'var(--acento)';
  document.body.appendChild(probe);
  const c = (getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) || [255, 210, 31]).map(Number);
  probe.remove();
  gl.uniform3f(U.uA, c[0] / 255, c[1] / 255, c[2] / 255);

  const medir = function () {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ESCALA));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * ESCALA));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
  };
  medir();

  // Dedo o mouse: posición suavizada y una fuerza que se apaga sola
  let mx = canvas.width * 0.6, my = canvas.height * 0.2, tx = mx, ty = my, fuerza = 0, objetivo = 0, ultimo = -1e9;
  const apuntar = function (e) {
    const r = canvas.getBoundingClientRect();
    if (e.clientY > r.bottom) return;
    tx = (e.clientX - r.left) * ESCALA;
    ty = (r.bottom - e.clientY) * ESCALA;
    objetivo = 1;
    ultimo = performance.now();
  };
  window.addEventListener('pointermove', apuntar, { passive: true });
  window.addEventListener('pointerdown', apuntar, { passive: true });

  const t0 = performance.now();
  const dibujar = function (ahora) {
    if (ahora - ultimo > 1200) objetivo = 0;
    mx += (tx - mx) * 0.12; my += (ty - my) * 0.12;
    fuerza += (objetivo - fuerza) * 0.06;
    gl.uniform1f(U.uT, (ahora - t0) / 1000);
    gl.uniform2f(U.uM, mx, my);
    gl.uniform1f(U.uF, fuerza);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let corriendo = false, visible = true, raf = 0, anterior = 0;
  const bucle = function (ahora) {
    raf = requestAnimationFrame(bucle);
    const vivo = ahora - ultimo < 2500;
    if (!vivo && ahora - anterior < 31) return;   // 30 fps en reposo, 60 al tocar
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

  dibujar(t0 + 3000);
  decidir();
})();
