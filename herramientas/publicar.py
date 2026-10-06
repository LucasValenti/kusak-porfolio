"""Arma la carpeta dist/ que se publica y, con --subir, la sube a Cloudflare (kusak.kusak.workers.dev).

Uso:
    python herramientas/publicar.py                    # solo arma dist/
    python herramientas/publicar.py --subir            # arma y sube
    python herramientas/publicar.py --url https://kusak.com.ar --subir   # con dominio propio

Va a dist/: index.html (con la dirección absoluta para redes y buscadores), 404.html,
assets/ sin los .json de procedencia, _headers (cabeceras de seguridad y caché),
robots.txt y sitemap.xml. El resto del proyecto (notas y archivos internos) no se publica.
"""
import argparse
import datetime
import pathlib
import re
import shutil
import subprocess

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DIST = RAIZ / 'dist'


def armar(url):
    url = url.rstrip('/')
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    # Inicio: dirección absoluta para la imagen de redes, canonical y og:url
    html = (RAIZ / 'index.html').read_text(encoding='utf-8')
    html = html.replace('content="assets/og.png"', 'content="%s/assets/og.png"' % url, 1)
    html = html.replace(
        '  <meta property="og:type" content="website">\n',
        '  <meta property="og:type" content="website">\n'
        '  <meta property="og:url" content="%s/">\n'
        '  <link rel="canonical" href="%s/">\n' % (url, url), 1)
    (DIST / 'index.html').write_text(html, encoding='utf-8')
    shutil.copy2(RAIZ / '404.html', DIST / '404.html')
    shutil.copytree(RAIZ / 'assets', DIST / 'assets', ignore=shutil.ignore_patterns('*.json'))

    # La misma política de la página, más lo que solo se puede poner como cabecera
    csp = re.search(r'http-equiv="Content-Security-Policy" content="([^"]+)"', html).group(1)
    (DIST / '_headers').write_text(
        '/*\n'
        '  Content-Security-Policy: %s; frame-ancestors \'none\'; upgrade-insecure-requests\n'
        '  X-Content-Type-Options: nosniff\n'
        '  X-Frame-Options: DENY\n'
        '  Referrer-Policy: strict-origin-when-cross-origin\n'
        '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()\n'
        '  Cross-Origin-Opener-Policy: same-origin\n'
        '  Strict-Transport-Security: max-age=31536000; includeSubDomains\n'
        '\n'
        '/assets/fonts/*\n'
        '  Cache-Control: public, max-age=31536000, immutable\n'
        '\n'
        '/assets/trabajos/*\n'
        '  Cache-Control: public, max-age=604800\n'
        '\n'
        '/assets/marca/*\n'
        '  Cache-Control: public, max-age=604800\n'
        '\n'
        '/assets/capitan/*\n'
        '  Cache-Control: public, max-age=604800\n' % csp,
        encoding='utf-8')

    (DIST / 'robots.txt').write_text(
        'User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' % url, encoding='utf-8')
    hoy = datetime.date.today().isoformat()
    (DIST / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        '  <url><loc>%s/</loc><lastmod>%s</lastmod></url>\n'
        '</urlset>\n' % (url, hoy), encoding='utf-8')

    peso = sum(f.stat().st_size for f in DIST.rglob('*') if f.is_file())
    print('dist/ listo para %s (%d archivos, %.0f KB)' % (url, sum(1 for f in DIST.rglob('*') if f.is_file()), peso / 1024))


def subir():
    # Cloudflare publica como Worker con archivos estáticos; wrangler.jsonc apunta SOLO a dist/
    subprocess.run('npx --yes wrangler@latest deploy', cwd=RAIZ, shell=True, check=True)


if __name__ == '__main__':
    a = argparse.ArgumentParser(description='Arma dist/ y la sube a Cloudflare Pages.')
    a.add_argument('--url', default='https://kusak.kusak.workers.dev', help='dirección pública final, sin barra al final')
    a.add_argument('--subir', action='store_true', help='subir dist/ a Cloudflare Pages después de armarla')
    args = a.parse_args()
    armar(args.url)
    if args.subir:
        subir()
