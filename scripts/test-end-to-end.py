"""
Test end-to-end: simula exactamente lo que hace el frontend.
Sube una selfie real al endpoint /generate y verifica que devuelve imageUrl.
"""
import requests, base64, struct, zlib, json, time

BACKEND = 'https://api.pruebalo.wilkiedevs.com'
BRAND_SLUG = 'wilkie-devs'
PRODUCT_ID = 'ee5bf4ec-da9b-4cd5-b8da-2484797d0a71'

def make_png(width=100, height=150):
    """PNG válido de persona (rectángulo naranja simulando selfie)"""
    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    raw = b''
    for _ in range(height):
        raw += b'\x00' + b'\xff\xcc\x99' * width
    idat = zlib.compress(raw)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', idat)
    png += chunk(b'IEND', b'')
    return png

print('=== Test End-to-End Virtual Try-On ===\n')

# 1. Verificar que el backend responde
print('1. Health check...')
r = requests.get(f'{BACKEND}/health', timeout=10)
print(f'   Status: {r.status_code} — {r.json()}')

# 2. Verificar config pública de la marca
print(f'\n2. Config marca "{BRAND_SLUG}"...')
r = requests.get(f'{BACKEND}/api/pruebalo/{BRAND_SLUG}', timeout=10)
print(f'   Status: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print(f'   Marca: {data["brand"]["name"]}')
    print(f'   Productos: {len(data["products"])}')
    for p in data['products']:
        marker = ' <-- USANDO ESTE' if p['id'] == PRODUCT_ID else ''
        print(f'   - {p["name"]} ({p["id"][:8]}...){marker}')

# 3. Generar try-on
print(f'\n3. Generando try-on (puede tardar 30-60s)...')
png_bytes = make_png(100, 150)
print(f'   Selfie PNG: {len(png_bytes)} bytes')

start = time.time()
r = requests.post(
    f'{BACKEND}/api/pruebalo/{BRAND_SLUG}/generate',
    files={'selfie': ('selfie.png', png_bytes, 'image/png')},
    data={'productId': PRODUCT_ID},
    timeout=120
)
elapsed = time.time() - start
print(f'   Status: {r.status_code} ({elapsed:.1f}s)')

if r.status_code == 200:
    data = r.json()
    print(f'\n   EXITO:')
    print(f'   imageUrl: {data.get("imageUrl", "N/A")}')
    print(f'   generationId: {data.get("generationId", "N/A")}')
    print(f'   processingTime: {data.get("processingTime", "N/A")}ms')
    
    # Verificar que la imagen es accesible
    img_url = data.get('imageUrl')
    if img_url:
        print(f'\n4. Verificando acceso a imagen generada...')
        r2 = requests.head(img_url, timeout=10)
        print(f'   Status: {r2.status_code}')
        ct = r2.headers.get('Content-Type', 'N/A')
        print(f'   Content-Type: {ct}')
        if r2.status_code == 200:
            print('   IMAGEN ACCESIBLE PUBLICAMENTE')
        else:
            print('   ADVERTENCIA: imagen no accesible')
else:
    print(f'\n   ERROR:')
    try:
        err = r.json()
        print(f'   {json.dumps(err, indent=2)[:500]}')
    except:
        print(f'   {r.text[:500]}')
