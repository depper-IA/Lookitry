"""
Probar OpenRouter con un PNG limpio generado en Python.
El PNG tiene base64 válido sin caracteres problemáticos.
"""
import requests, json, struct, zlib, base64

def make_png(width=50, height=50):
    """Genera un PNG válido de color sólido"""
    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)
    
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    raw = b''
    for _ in range(height):
        raw += b'\x00' + b'\xff\x80\x00' * width  # naranja
    
    idat = zlib.compress(raw)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', idat)
    png += chunk(b'IEND', b'')
    return png

png_bytes = make_png(50, 50)
png_b64 = base64.b64encode(png_bytes).decode('ascii')
print(f'PNG generado: {len(png_bytes)} bytes, base64: {len(png_b64)} chars')
print(f'Primeros 50 chars: {png_b64[:50]}')

# Verificar que no tiene caracteres problemáticos
import re
if re.match(r'^[A-Za-z0-9+/=]+$', png_b64):
    print('Base64 válido (solo chars permitidos)')
else:
    print('ADVERTENCIA: base64 tiene chars no estándar')

OPENROUTER_KEY = '***REMOVED-SECRET***'

print('\n=== Llamando a OpenRouter con PNG válido ===')
payload = {
    "model": "google/gemini-2.5-flash-image",
    "messages": [{
        "role": "user",
        "content": [
            {"type": "text", "text": "Show the person wearing the product. Photorealistic virtual try-on."},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{png_b64}"}},
            {"type": "image_url", "image_url": {"url": "https://minio.wilkiedevs.com/images/products/1773627349562-dca0d866bbf3.jpg"}}
        ]
    }],
    "max_tokens": 2048,
    "temperature": 0.3
}

r = requests.post(
    'https://openrouter.ai/api/v1/chat/completions',
    json=payload,
    headers={
        'Authorization': f'Bearer {OPENROUTER_KEY}',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://n8n.wilkiedevs.com',
        'X-Title': 'Virtual Try-On'
    },
    timeout=60
)
print(f'Status: {r.status_code}')

if r.status_code == 200:
    data = r.json()
    choices = data.get('choices', [])
    if choices:
        msg = choices[0].get('message', {})
        content = msg.get('content')
        images = msg.get('images', [])
        print(f'Content type: {type(content)}')
        print(f'Images count: {len(images)}')
        if images:
            img_url = images[0].get('image_url', {}).get('url', '')
            print(f'Imagen generada (primeros 100 chars): {img_url[:100]}')
            print('EXITO: OpenRouter generó imagen correctamente')
        elif content:
            print(f'Content (primeros 200): {str(content)[:200]}')
else:
    print(f'Error: {r.text[:800]}')
