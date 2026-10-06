# Sol pintado a pincel (sumi-e) sobre transparente, para el inicio
# Uso: python herramientas/sol.py  (necesita numpy y Pillow)
import os
import numpy as np
from PIL import Image, ImageFilter
DESTINO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'inicio') + os.sep
rng = np.random.default_rng(7)
N = 1100
def campo(h, w, sigma=0):
    a = rng.random((h, w)).astype(np.float32)
    im = Image.fromarray((a * 255).astype(np.uint8)).resize((N, N), Image.BICUBIC)
    if sigma: im = im.filter(ImageFilter.GaussianBlur(sigma))
    return np.asarray(im).astype(np.float32) / 255
y, x = np.mgrid[0:N, 0:N].astype(np.float32)
cx, cy, R = N * .5, N * .5, N * .40
dx, dy = x - cx, y - cy
r = np.hypot(dx, dy); th = np.arctan2(dy, dx)
# Borde irregular: ondas lentas + temblor fino
borde = np.zeros_like(r)
for k, amp in [(2, .010), (3, .008), (5, .006), (9, .004), (17, .003), (31, .002)]:
    borde += amp * np.sin(k * th + rng.random() * 6.28)
# Vetas del pincel, horizontales
veta = .55 * campo(140, 6, 1.5) + .30 * campo(420, 14, .8) + .15 * campo(900, 40)
# El pincel sale por la derecha: borde seco y deshilachado de ese lado
salida = np.clip(dx / R, 0, 1) ** 3
radio = R * (1 + borde + salida * (veta - .5) * .22)
dentro = np.clip((radio - r) / 2.2, 0, 1)
seco = np.clip((veta - .30 - (1 - salida) * .6) * 4, 0, 1)   # huecos de pincel seco
alfa = dentro * (.80 + .20 * veta) * (1 - .38 * salida * (1 - seco))
# Grano del papel
grano = campo(N // 2, N // 2)
alfa *= .90 + .10 * grano
# Sangrado suave de la tinta alrededor
sangra = np.asarray(Image.fromarray((dentro * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
alfa = np.maximum(alfa, sangra * .16)
# Color: bermellón con zonas más cargadas donde se superpone el pincel
claro = np.array([196, 78, 56], np.float32); hondo = np.array([158, 54, 40], np.float32)
t = np.clip((veta - .35) * 1.6, 0, 1)[..., None]
rgb = claro * (1 - t) + hondo * t
img = np.dstack([rgb, alfa[..., None] * 255]).clip(0, 255).astype(np.uint8)
Image.fromarray(img, 'RGBA').save(DESTINO + 'sol.webp', quality=82, method=6)
Image.fromarray(img, 'RGBA').resize((560, 560), Image.LANCZOS).save(DESTINO + 'sol-chico.webp', quality=82, method=6)
