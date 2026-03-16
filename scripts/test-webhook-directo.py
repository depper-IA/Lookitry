"""Probar el webhook de n8n directamente para ver qué error devuelve"""
import requests, json

WEBHOOK_URL = 'https://n8n.wilkiedevs.com/webhook/tryon'
BEARER = 'Travis2305**'

# PNG 1x1 en base64
PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=='

payload = {
    'brand_id': 'test-brand-id',
    'product_id': 'test-product-id',
    'selfie_base64': PNG_B64,
    'product_image_url': 'https://minio.wilkiedevs.com/images/products/test.jpg',
    'prompt': 'Test prompt',
}

print(f'POST {WEBHOOK_URL}')
print(f'Authorization: Bearer {BEARER}')
print()

r = requests.post(
    WEBHOOK_URL,
    json=payload,
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {BEARER}',
    },
    timeout=30
)

print(f'Status: {r.status_code}')
print(f'Headers: {dict(r.headers)}')
print(f'Body: {r.text[:600]}')
