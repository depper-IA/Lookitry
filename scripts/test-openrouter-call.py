"""Probar OpenRouter directamente con la API key real para ver el error exacto"""
import requests, json, base64

OPENROUTER_KEY = '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'

# JPEG 10x10 en base64
JPEG_B64 = (
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U'
    'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN'
    'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy'
    'MjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAA'
    'AgIBBAMBAAAAAAAAAAAAAQIDBAUREiExQf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEA'
    'AAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCw1nU7GlafJe3LbYo8ZwBkk+gB5NVuq6'
    'xqGr3Hm3tw0rDO1eAq59ADwKKKAP/2Q=='
)

print('=== Test 1: Con modalities (formato actual del workflow) ===')
payload_with_modalities = {
    "model": "google/gemini-2.5-flash-image",
    "modalities": ["image", "text"],
    "messages": [{
        "role": "user",
        "content": [
            {"type": "text", "text": "Show the person wearing the product."},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{JPEG_B64}"}},
            {"type": "image_url", "image_url": {"url": "https://minio.wilkiedevs.com/images/products/1773627349562-dca0d866bbf3.jpg"}}
        ]
    }],
    "max_tokens": 1024,
    "temperature": 0.3
}

r = requests.post(
    'https://openrouter.ai/api/v1/chat/completions',
    json=payload_with_modalities,
    headers={
        'Authorization': f'Bearer {OPENROUTER_KEY}',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://n8n.wilkiedevs.com',
        'X-Title': 'Virtual Try-On'
    },
    timeout=30
)
print(f'Status: {r.status_code}')
print(f'Response: {r.text[:600]}')

print('\n=== Test 2: Sin modalities (formato estándar OpenRouter) ===')
payload_no_modalities = {
    "model": "google/gemini-2.5-flash-image",
    "messages": [{
        "role": "user",
        "content": [
            {"type": "text", "text": "Show the person wearing the product."},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{JPEG_B64}"}},
            {"type": "image_url", "image_url": {"url": "https://minio.wilkiedevs.com/images/products/1773627349562-dca0d866bbf3.jpg"}}
        ]
    }],
    "max_tokens": 1024,
    "temperature": 0.3
}

r2 = requests.post(
    'https://openrouter.ai/api/v1/chat/completions',
    json=payload_no_modalities,
    headers={
        'Authorization': f'Bearer {OPENROUTER_KEY}',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://n8n.wilkiedevs.com',
        'X-Title': 'Virtual Try-On'
    },
    timeout=30
)
print(f'Status: {r2.status_code}')
print(f'Response: {r2.text[:600]}')
