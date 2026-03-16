"""
Test del webhook con una imagen base64 suficientemente grande (>100 chars).
Usa un JPEG pequeño pero válido para pasar la validación.
"""
import requests, base64, time, json

WEBHOOK_URL = 'https://n8n.wilkiedevs.com/webhook/tryon'
BEARER = 'Travis2305**'

# JPEG 10x10 pixels rojo — suficientemente grande para pasar validación
# Generado con: from PIL import Image; img.save(buf, 'JPEG')
JPEG_10X10_B64 = (
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U'
    'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN'
    'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy'
    'MjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAA'
    'AgIBBAMBAAAAAAAAAAAAAQIDBAUREiExQf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEA'
    'AAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCw1nU7GlafJe3LbYo8ZwBkk+gB5NVuq6'
    'xqGr3Hm3tw0rDO1eAq59ADwKKKAP/2Q=='
)

print(f'Imagen base64 length: {len(JPEG_10X10_B64)} chars')

payload = {
    'brand_id': 'wilkie-devs-test',
    'product_id': 'ee5bf4ec-da9b-4cd5-b8da-2484797d0a71',
    'selfie_base64': JPEG_10X10_B64,
    'product_image_url': 'https://minio.wilkiedevs.com/images/products/1773627349562-dca0d866bbf3.jpg',
    'prompt': 'Show the person wearing the product. Photorealistic.',
}

print(f'\nPOST {WEBHOOK_URL}')
print('Esperando respuesta (puede tardar hasta 60s por Gemini)...\n')

start = time.time()
r = requests.post(
    WEBHOOK_URL,
    json=payload,
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {BEARER}',
    },
    timeout=120
)
elapsed = time.time() - start

print(f'Tiempo: {elapsed:.1f}s')
print(f'Status: {r.status_code}')
print(f'Body: {r.text[:500]}')

if r.text.strip():
    try:
        data = r.json()
        print(f'\nParsed JSON:')
        print(json.dumps(data, indent=2)[:400])
        if data.get('imageUrl'):
            print(f'\n>>> imageUrl recibida: {data["imageUrl"]}')
            # Verificar que la imagen es accesible
            img_r = requests.head(data['imageUrl'], timeout=10)
            cl = img_r.headers.get('Content-Length', '0')
            print(f'>>> Imagen HTTP {img_r.status_code}, {cl} bytes')
    except:
        pass
