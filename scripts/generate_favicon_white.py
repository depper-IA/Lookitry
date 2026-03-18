"""
Genera favicon con el logo ORIGINAL naranja+blanco de Lookitry.
Replica los polígonos del SVG usando Pillow.
SVG viewBox: 0 0 255.95 238.82
  - Polígono naranja (#ff5c35): L shape izquierda
  - Polígono blanco (#ffffff): K shape derecha
"""
from PIL import Image, ImageDraw
import os

PUB = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public')

# Puntos originales del SVG (viewBox 255.95 x 238.82)
ORANGE_PTS = [
    (64.86, 4.53), (65.09, 180.12), (140.66, 180.12),
    (173.77, 234.34), (5.78, 234.34), (5.78, 4.53),
]
WHITE_PTS = [
    (79.22, 164.66), (79.22, 131.32), (185.31, 4.64),
    (247.29, 4.48), (170.77, 102.47), (253.38, 234.34),
    (192.80, 234.34), (135.92, 144.81), (121.73, 164.66),
]

SVG_W, SVG_H = 255.95, 238.82

ORANGE = (255, 92, 53, 255)
WHITE  = (255, 255, 255, 255)
BG     = (10, 10, 10, 255)

def scale_pts(pts, target_size, padding_ratio=0.10):
    pad = int(target_size * padding_ratio)
    avail = target_size - 2 * pad
    sx = avail / SVG_W
    sy = avail / SVG_H
    s = min(sx, sy)
    ox = pad + (avail - SVG_W * s) / 2
    oy = pad + (avail - SVG_H * s) / 2
    return [(ox + x * s, oy + y * s) for x, y in pts]

def make_favicon(size: int) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), BG)
    draw = ImageDraw.Draw(canvas)
    draw.polygon(scale_pts(ORANGE_PTS, size), fill=ORANGE)
    draw.polygon(scale_pts(WHITE_PTS, size),  fill=WHITE)
    return canvas

# favicon.ico — 16, 32, 48 multi-size
sizes = [16, 32, 48]
frames = [make_favicon(s) for s in sizes]
frames[0].save(
    os.path.join(PUB, 'favicon.ico'),
    format='ICO',
    sizes=[(s, s) for s in sizes],
    append_images=frames[1:],
)
print(f'favicon.ico generado con tamaños: {sizes}')

# favicon.png — 64x64
make_favicon(64).save(os.path.join(PUB, 'favicon.png'), 'PNG')
print('favicon.png generado (64x64)')

# apple-touch-icon.png — 180x180
make_favicon(180).convert('RGB').save(os.path.join(PUB, 'apple-touch-icon.png'), 'PNG')
print('apple-touch-icon.png generado (180x180)')

print('Listo — logo naranja+blanco sobre fondo oscuro.')
