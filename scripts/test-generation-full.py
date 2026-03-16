"""
Test completo de generación: llama al endpoint /api/pruebalo/:slug/generate
y verifica que la imagen resultante sea accesible y tenga contenido real.
"""
import requests, json, base64, os, sys

BACKEND = 'https://api.pruebalo.wilkiedevs.com'

# 1. Obtener un slug válido desde Supabase
import urllib.request, urllib.parse

SUPABASE_URL = 'https://vkdooutklowctuudjnkl.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzI5NzMsImV4cCI6MjA0ODQwODk3M30.Ry_0QLXQ3IQKZ3IQKZ3IQKZ3IQKZ3IQKZ3IQKZ3IQ'

# Obtener una marca activa con slug
print('=== TEST DE GENERACION COMPLETO ===\n')

# Primero obtener config de una marca
try:
    r = requests.get(
        f'{SUPABASE_URL}/rest/v1/brands?select=id,slug,name,plan&is_active=eq.true&limit=3',
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}'
        },
        timeout=10
    )
    brands = r.json()
    print(f'Marcas activas encontradas: {len(brands)}')
    for b in brands:
        print(f'  - {b.get("name")} | slug: {b.get("slug")} | plan: {b.get("plan")}')
except Exception as e:
    print(f'Error obteniendo marcas: {e}')
    brands = []

if not brands:
    print('\nNo se encontraron marcas. Usando slug hardcodeado...')
    slug = 'wilkiedevs'
else:
    slug = brands[0].get('slug', 'wilkiedevs')

print(f'\nUsando slug: {slug}')

# 2. Obtener config del probador
print(f'\n--- Paso 1: GET /api/pruebalo/{slug} ---')
try:
    r = requests.get(f'{BACKEND}/api/pruebalo/{slug}', timeout=10)
    print(f'Status: {r.status_code}')
    if r.status_code == 200:
        config = r.json()
        print(f'Marca: {config.get("brand", {}).get("name")}')
        products = config.get('products', [])
        print(f'Productos: {len(products)}')
        if products:
            product = products[0]
            print(f'Primer producto: {product.get("name")} (ID: {product.get("id")})')
            product_id = product.get('id')
        else:
            print('No hay productos — abortando')
            sys.exit(1)
    else:
        print(f'Error: {r.text[:200]}')
        sys.exit(1)
except Exception as e:
    print(f'Error: {e}')
    sys.exit(1)

# 3. Crear una selfie de prueba (imagen 1x1 pixel en base64)
# Imagen PNG 1x1 pixel rojo
PNG_1X1 = (
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8'
    'z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=='
)

print(f'\n--- Paso 2: POST /api/pruebalo/{slug}/generate ---')
payload = {
    'product_id': product_id,
    'selfie_base64': PNG_1X1,
}

try:
    r = requests.post(
        f'{BACKEND}/api/pruebalo/{slug}/generate',
        json=payload,
        timeout=120  # puede tardar por la IA
    )
    print(f'Status: {r.status_code}')
    
    if r.status_code == 200:
        result = r.json()
        print(f'Success: {result.get("success")}')
        image_url = result.get('imageUrl') or result.get('image_url')
        print(f'imageUrl: {image_url}')
        
        if image_url:
            # 4. Verificar que la imagen es accesible y tiene contenido
            print(f'\n--- Paso 3: Verificar imagen generada ---')
            img_r = requests.head(image_url, timeout=10)
            print(f'Status imagen: {img_r.status_code}')
            content_length = img_r.headers.get('Content-Length', 'N/A')
            content_type = img_r.headers.get('Content-Type', 'N/A')
            print(f'Content-Length: {content_length}')
            print(f'Content-Type: {content_type}')
            
            if img_r.status_code == 200:
                cl = int(content_length) if content_length != 'N/A' else 0
                if cl > 1000:
                    print(f'\n✓ EXITO: Imagen generada correctamente ({cl} bytes)')
                elif cl == 0:
                    print(f'\n✗ FALLO: Imagen tiene 0 bytes — el fix no funcionó')
                else:
                    print(f'\n? Imagen muy pequeña ({cl} bytes) — puede ser error')
            else:
                print(f'\n✗ Imagen no accesible (HTTP {img_r.status_code})')
        else:
            print('\n✗ No se recibió imageUrl en la respuesta')
            print(f'Respuesta completa: {json.dumps(result, indent=2)[:500]}')
    else:
        print(f'Error respuesta: {r.text[:500]}')
        
except Exception as e:
    print(f'Error: {e}')
