"""
Intenta recuperar la imagen del producto 'Life Kombucha - Lulo' desde el VPS
(si aún existe en disco de WordPress) y subirla a MinIO.
Si no existe, marca el producto con image_url = null para que el admin la suba.
"""
import paramiko, json, base64, hashlib, hmac, datetime, urllib.request

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'

PRODUCT_ID = 'a1a567a9-c6ed-4eef-9e44-594c14446a89'
WP_PATH = '/var/www/html/wp-content/uploads/tryon/product-2026-03-12T22-49-00-346Z.jpg'

MINIO_ENDPOINT = 'minio.wilkiedevs.com'
MINIO_BUCKET = 'images'
MINIO_ACCESS = 'Wilkiedevs'
MINIO_SECRET = 'Travis2305*'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out, err

# 1. Verificar si el archivo existe en el VPS
out, err = run(f'ls -la {WP_PATH} 2>/dev/null || echo "NOT_FOUND"')
print('Archivo en VPS:', out.strip())

if 'NOT_FOUND' in out or not out.strip():
    print('\nArchivo no encontrado en VPS.')
    print('El producto Life Kombucha - Lulo necesita que el admin suba una nueva imagen.')
    print(f'Product ID: {PRODUCT_ID}')
    client.close()
    exit(0)

# 2. Leer el archivo y subirlo a MinIO via el endpoint del backend
print('\nArchivo encontrado. Leyendo...')
sftp = client.open_sftp()
with sftp.open(WP_PATH, 'rb') as f:
    img_data = f.read()
sftp.close()

print(f'Tamaño: {len(img_data)} bytes')

# Subir a MinIO via el endpoint del backend con N8N_BEARER_TOKEN
img_b64 = base64.b64encode(img_data).decode()
payload = json.dumps({
    'image_base64': img_b64,
    'filename': 'life-kombucha-lulo.jpg',
    'temporary': False
}).encode()

req = urllib.request.Request(
    'https://api.pruebalo.wilkiedevs.com/api/upload/selfie',
    data=payload,
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer Travis2305**'
    },
    method='POST'
)
try:
    resp = urllib.request.urlopen(req, timeout=30)
    result = json.loads(resp.read())
    print('Upload result:', result)
    if result.get('url'):
        print(f'\nNueva URL MinIO: {result["url"]}')
        print(f'Actualizar en Supabase:')
        print(f"UPDATE products SET image_url = '{result['url']}' WHERE id = '{PRODUCT_ID}';")
except Exception as e:
    print('Error al subir:', e)

client.close()
