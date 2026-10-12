"""Pasa los renders de videos/trabajos a versiones livianas para la web.

Por cada trabajo deja en assets/trabajos/: <nombre>.mp4 (H.264), <nombre>.webm (VP9)
y <nombre>-poster.webp (primer cuadro). Uso: python herramientas/videos-trabajos.py [nombre ...]
(sin nombres, todos los renders)
"""
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'videos' / 'trabajos' / 'renders'
DESTINO = RAIZ / 'assets' / 'trabajos'
ESCALA = 'fps=24,scale=1200:-2:flags=lanczos'


def correr(*args):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *args], check=True)


for render in sorted(ORIGEN.glob('*.mp4')):
    nombre = render.stem
    if sys.argv[1:] and nombre not in sys.argv[1:]:
        continue
    correr('-i', str(render), '-vf', ESCALA, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27',
           '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(DESTINO / f'{nombre}.mp4'))
    correr('-i', str(render), '-vf', ESCALA, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0',
           '-row-mt', '1', '-an', str(DESTINO / f'{nombre}.webm'))
    correr('-i', str(render), '-vf', ESCALA, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '80',
           str(DESTINO / f'{nombre}-poster.webp'))
    for ext in ('mp4', 'webm'):
        print(nombre, ext, round((DESTINO / f'{nombre}.{ext}').stat().st_size / 1024), 'KB')
