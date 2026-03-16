"""
Test completo del flujo de generación — replica exactamente lo que hace el frontend:
- FormData con 'productId' y 'selfie' (archivo)
"""
import requests, json, sys, io

BACKEND = 'https://api.pruebalo.wilkiedevs.com'

# PNG 1x1 pixel rojo — imagen mínima válida
PNG_BYTES = bytes([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
    0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
    0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC,0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
    0x44,0xAE,0x42,0x60,0x82
])

print('=== TEST FLUJO COMPLETO (multipart/form-data) ===\n')

# --- Login admin ---
r = requests.post(
    f'{BACKEND}/api/admin/auth/login',
    json={'email': 'info.samwilkie@gmail.com', 'password': 'Travis2305*'},
    timeout=10
)
if r.status_code != 200:
    print(f'Error login: {r.text[:200]}')
    sys.exit(1)
token = r.json().get('token')
print('Login admin OK')

# --- Buscar marca con productos ---
r = requests.get(
    f'{BACKEND}/api/admin/brands',
    headers={'Authorization': f'Bearer {token}'},
    timeout=10
)
brands = r.json() if isinstance(r.json(), list) else r.json().get('brands', r.json().get('data', []))
brands_con_productos = [
    b for b in brands
    if isinstance(b, dict) and b.get('stats', {}).get('productsCount', 0) > 0
]

slug = brands_con_productos[0].get('slug')
print(f'Usando marca: {brands_con_productos[0].get("name")} (slug: {slug})')

# --- Obtener productos ---
r = requests.get(f'{BACKEND}/api/pruebalo/{slug}', timeout=10)
if r.status_code != 200:
    print(f'Error config: {r.text[:200]}')
    sys.exit(1)
products = r.json().get('products', [])
product_id = products[0].get('id')
print(f'Producto: {products[0].get("name")} (ID: {product_id})')

# --- Generar (multipart igual que el frontend) ---
print(f'\nLlamando a /api/pruebalo/{slug}/generate...')
print('(puede tardar hasta 60s por la IA)')

files = {'selfie': ('selfie.png', io.BytesIO(PNG_BYTES), 'image/png')}
data  = {'productId': product_id}

r = requests.post(
    f'{BACKEND}/api/pruebalo/{slug}/generate',
    files=files,
    data=data,
    timeout=120
)
print(f'Status: {r.status_code}')

if r.status_code != 200:
    print(f'Error: {r.text[:500]}')
    sys.exit(1)

result = r.json()
print(f'Success: {result.get("success")}')
image_url = result.get('imageUrl') or result.get('image_url')
print(f'imageUrl: {image_url}')

if not image_url:
    print(f'Respuesta completa: {json.dumps(result, indent=2)[:600]}')
    sys.exit(1)

# --- Verificar imagen ---
print(f'\nVerificando imagen...')
img_r = requests.head(image_url, timeout=15)
print(f'HTTP: {img_r.status_code}')
cl_raw = img_r.headers.get('Content-Length', '0')
cl = int(cl_raw) if cl_raw.isdigit() else 0
ct = img_r.headers.get('Content-Type', 'N/A')
print(f'Content-Type:   {ct}')
print(f'Content-Length: {cl} bytes')

if img_r.status_code == 200 and cl > 1000:
    print(f'\n>>> EXITO: imagen generada y accesible ({cl} bytes) <<<')
elif img_r.status_code == 200 and cl == 0:
    print(f'\n>>> FALLO: imagen tiene 0 bytes — el fix en n8n no funcionó <<<')
else:
    print(f'\n>>> FALLO: HTTP {img_r.status_code}, {cl} bytes <<<')
