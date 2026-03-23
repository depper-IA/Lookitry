"""
Genera og-image.png (1200x630) para Lookitry.
Diseño: izquierda texto + stats + CTA, derecha logo real con glow.
Basado en el diseño HTML proporcionado.
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

W, H = 1200, 630
PUB = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public')
OUT = os.path.join(PUB, 'og-image.png')

# ── Canvas base ───────────────────────────────────────────────────────────────
img = Image.new('RGBA', (W, H), (10, 10, 10, 255))
draw = ImageDraw.Draw(img)

# ── Degradado radial derecha (glow naranja) ───────────────────────────────────
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
cx, cy = int(W * 0.85), H // 2
for r in range(320, 0, -1):
    alpha = int(46 * (1 - r / 320) ** 1.8)
    gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(235, 75, 40, alpha))
img = Image.alpha_composite(img, glow)
draw = ImageDraw.Draw(img)

# ── Líneas decorativas diagonales ────────────────────────────────────────────
for x_start, alpha in [(580, 30), (560, 15), (650, 10), (750, 5), (850, 5)]:
    draw.line([(x_start, 0), (x_start + 200, H)], fill=(235, 75, 40, alpha), width=1)

# ── Divisor vertical naranja ──────────────────────────────────────────────────
div_x = 640
for y in range(H):
    t = y / H
    if t < 0.1:
        a = int(76 * (t / 0.1))
    elif t > 0.9:
        a = int(76 * ((1 - t) / 0.1))
    else:
        a = 76
    draw.point((div_x, y), fill=(235, 75, 40, a))

# ── Fuentes ───────────────────────────────────────────────────────────────────
def load_font(name, size):
    for f in [name, name.lower(), 'arial.ttf', 'DejaVuSans.ttf']:
        try:
            return ImageFont.truetype(f, size)
        except:
            pass
    return ImageFont.load_default()

f_logo    = load_font('arialbd.ttf', 26)
f_badge   = load_font('arial.ttf', 13)
f_h1a     = load_font('arialbd.ttf', 54)
f_h1b     = load_font('arialbd.ttf', 54)
f_sub     = load_font('arial.ttf', 19)
f_stat_n  = load_font('arialbd.ttf', 24)
f_stat_l  = load_font('arial.ttf', 13)
f_cta     = load_font('arialbd.ttf', 17)
f_url     = load_font('arial.ttf', 14)

# ── ZONA IZQUIERDA (0–640) ────────────────────────────────────────────────────
PAD = 64

# Logo wordmark (texto)
draw.text((PAD, 52), 'Lookitry', font=f_logo, fill=(255, 255, 255, 255))

# Badge
badge_text = 'Probador virtual con IA'
bw = draw.textlength(badge_text, font=f_badge) + 32
draw.rounded_rectangle([PAD, 108, PAD + bw, 108 + 32], radius=16,
                        fill=(235, 75, 40, 38), outline=(235, 75, 40, 115))
draw.ellipse([PAD + 12, 108 + 13, PAD + 18, 108 + 19], fill=(235, 75, 40, 255))
draw.text((PAD + 24, 108 + 8), badge_text, font=f_badge, fill=(235, 75, 40, 255))

# Headline
draw.text((PAD, 158), 'Tus clientes se prueban', font=f_h1a, fill=(255, 255, 255, 255))
draw.text((PAD, 218), 'la ropa ', font=f_h1b, fill=(255, 255, 255, 255))
offset_x = PAD + int(draw.textlength('la ropa ', font=f_h1b))
draw.text((offset_x, 218), 'antes de comprar.', font=f_h1b, fill=(235, 75, 40, 255))

# Subtítulo
draw.text((PAD, 296), 'Intégralo en tu tienda en 10 minutos.', font=f_sub, fill=(255, 255, 255, 128))
draw.text((PAD, 322), 'Sin apps, sin desarrollo. Para tiendas en Latam.', font=f_sub, fill=(255, 255, 255, 128))

# Stats
stats = [('+ 120', 'Marcas activas'), ('18K', 'Generaciones / mes'), ('4.8 ★', 'Satisfacción')]
sx = PAD
for i, (num, label) in enumerate(stats):
    if i > 0:
        draw.rectangle([sx, 368, sx + 1, 410], fill=(255, 255, 255, 25))
        sx += 16
    draw.text((sx, 368), num, font=f_stat_n, fill=(255, 255, 255, 255))
    draw.text((sx, 398), label, font=f_stat_l, fill=(255, 255, 255, 89))
    sx += int(draw.textlength(num, font=f_stat_n)) + 32

# CTA button
cta_text = 'Empezar gratis — 7 días'
cta_w = int(draw.textlength(cta_text, font=f_cta)) + 48
draw.rounded_rectangle([PAD, 448, PAD + cta_w, 448 + 46], radius=23, fill=(235, 75, 40, 255))
draw.text((PAD + 24, 448 + 13), cta_text, font=f_cta, fill=(255, 255, 255, 255))
# Flecha
ax = PAD + cta_w - 34
draw.ellipse([ax, 448 + 11, ax + 24, 448 + 35], fill=(255, 255, 255, 51))
draw.text((ax + 6, 448 + 13), '→', font=f_badge, fill=(255, 255, 255, 255))

# URL
draw.text((PAD, 560), 'lookitry.com', font=f_url, fill=(255, 255, 255, 64))

# ── ZONA DERECHA: logo real ───────────────────────────────────────────────────
logo_src = Image.open(os.path.join(PUB, 'logo-light.png')).convert('RGBA')
lw, lh = logo_src.size

# Versión grande y muy tenue (fondo)
bg_size = 360
ratio = bg_size / max(lw, lh)
logo_bg = logo_src.resize((int(lw * ratio), int(lh * ratio)), Image.LANCZOS)
r, g, b, a = logo_bg.split()
a = a.point(lambda p: int(p * 0.10))
logo_bg = Image.merge('RGBA', (r, g, b, a))
bx = div_x + (W - div_x - logo_bg.width) // 2 - 10
by = (H - logo_bg.height) // 2
img.paste(logo_bg, (bx, by), logo_bg)

# Versión principal visible
main_size = 210
ratio2 = main_size / max(lw, lh)
logo_main = logo_src.resize((int(lw * ratio2), int(lh * ratio2)), Image.LANCZOS)
# Convertir a blanco puro
px = logo_main.load()
for y in range(logo_main.height):
    for x in range(logo_main.width):
        rv, gv, bv, av = px[x, y]
        px[x, y] = (255, 255, 255, av) if av > 10 else (0, 0, 0, 0)
r2, g2, b2, a2 = logo_main.split()
a2 = a2.point(lambda p: int(p * 0.88))
logo_main = Image.merge('RGBA', (r2, g2, b2, a2))
mx = div_x + (W - div_x - logo_main.width) // 2
my = (H - logo_main.height) // 2
img.paste(logo_main, (mx, my), logo_main)

# ── Float cards ───────────────────────────────────────────────────────────────
def float_card(x, y, label, value, accent):
    cw, ch = 190, 58
    draw.rounded_rectangle([x, y, x + cw, y + ch], radius=14,
                            fill=(18, 18, 18, 242), outline=(255, 255, 255, 23))
    # Icono
    draw.rounded_rectangle([x + 10, y + 12, x + 44, y + 46], radius=8,
                            fill=(*accent, 46), outline=(*accent, 76))
    # Texto
    draw.text((x + 54, y + 10), label, font=f_stat_l, fill=(255, 255, 255, 102))
    draw.text((x + 54, y + 28), value, font=load_font('arialbd.ttf', 15), fill=(255, 255, 255, 230))

float_card(div_x - 30, 80,  'Conversión',   '+34% en ventas', (235, 75, 40))
float_card(div_x - 10, 490, 'Setup en',     '10 minutos',     (40, 200, 100))
float_card(W - 210,    280, 'Devoluciones', '−28%',           (80, 130, 255))

# ── Guardar ───────────────────────────────────────────────────────────────────
img.convert('RGB').save(OUT, 'PNG', optimize=True)
print(f'og-image.png generada: {W}x{H}px → {OUT}')
