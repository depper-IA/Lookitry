#!/usr/bin/env python3
"""
GCP Vertex AI Image Generator para Lookitry
============================================
Usa Service Account para generar imágenes profesionales
con tracking de budget.

Uso:
    python3 gcp_image_generator.py "prompt de imagen" [1024x1024]

Budget:
    - Crédito total: $5.00
    - Costo 1024x1024: ~$0.035
    - Máximo recomendado: 100 imágenes
"""

import requests
import json
import jwt
import time
import base64
import os
import sys
from datetime import datetime

# Configuración
SA_CREDENTIALS = '/home/travis/Lookitry/Lookitry/google/permiso-abril.json'
LOG_FILE = '/home/travis/Lookitry/Lookitry/Lookitry_Brain_Vault/Cerebro/Logs/gcp_usage_log.md'
OUTPUT_DIR = '/home/travis/Lookitry/Lookitry/google/generated_images'

# Budget config
TOTAL_BUDGET = 5.00
COST_PER_IMAGE = {
    '512x512': 0.015,
    '768x768': 0.025,
    '1024x1024': 0.035,
    '2048x2048': 0.065
}

def load_service_account():
    """Carga credenciales del Service Account"""
    with open(SA_CREDENTIALS, 'r') as f:
        return json.load(f)

def get_access_token(sa_data):
    """Obtiene access token via JWT"""
    claims = {
        "iss": sa_data['client_email'],
        "sub": sa_data['client_email'],
        "aud": "https://oauth2.googleapis.com/token",
        "scope": "https://www.googleapis.com/auth/cloud-platform",
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600
    }
    
    token = jwt.encode(claims, sa_data['private_key'], algorithm="RS256")
    
    response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": token}
    )
    
    if response.status_code != 200:
        raise Exception(f"Token error: {response.text}")
    
    return response.json()['access_token']

def estimate_cost(size):
    """Estima costo según tamaño"""
    return COST_PER_IMAGE.get(size, 0.035)

def generate_image(prompt, size='1024x1024', access_token=None):
    """Genera imagen usando Vertex AI Imagen 3.0"""
    
    # Si no hay token, obtenerlo
    if access_token is None:
        sa_data = load_service_account()
        access_token = get_access_token(sa_data)
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    # Mapear tamaño a aspect ratio
    aspect_map = {
        '512x512': '1:1',
        '768x768': '1:1',
        '1024x1024': '1:1',
        '2048x2048': '2:1'
    }
    
    data = {
        "instances": [{
            "prompt": prompt
        }],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": aspect_map.get(size, '1:1')
        }
    }
    
    response = requests.post(
        'https://aiplatform.googleapis.com/v1/projects/lookitry-67844/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict',
        headers=headers,
        json=data
    )
    
    if response.status_code != 200:
        raise Exception(f"Generation error: {response.text}")
    
    result = response.json()
    
    if 'predictions' not in result:
        raise Exception(f"No predictions in response: {result}")
    
    img_data = result['predictions'][0]['bytesBase64Encoded']
    return base64.b64decode(img_data), estimate_cost(size)

def save_image(image_bytes, description, cost):
    """Guarda imagen y actualiza logs"""
    # Crear nombre de archivo con timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_desc = ''.join(c for c in description[:30] if c.isalnum() or c in ' -_').strip()
    filename = f"lookitry_{timestamp}_{safe_desc}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    # Crear directorio si no existe
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Guardar imagen
    with open(filepath, 'wb') as f:
        f.write(image_bytes)
    
    # Calcular credit remaining
    remaining = TOTAL_BUDGET - cost
    
    # Actualizar log
    log_entry = f"""
### {datetime.now().strftime('%Y-%m-%d %H:%M')}

| Descripción | Tamaño | Costo | Remaining |
|-------------|--------|-------|-----------|
| {description[:50]}... | {size} | ${cost:.3f} | ${remaining:.3f} |
"""
    
    with open(LOG_FILE, 'a') as f:
        f.write(log_entry)
    
    return filepath, remaining

def check_budget():
    """Verifica si hay budget disponible"""
    # Leer log para ver cuánto se ha gastado
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r') as f:
            content = f.read()
        
        # Buscar último remaining
        lines = content.split('\n')
        for line in reversed(lines):
            if 'Remaining' in line and '$' in line:
                try:
                    remaining = float(line.split('$')[-1].split()[0])
                    return remaining > 0.50  # Mínimo $0.50 para continuar
                except:
                    pass
    
    return True  # Si no hay log, asumimos que hay budget

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 gcp_image_generator.py 'prompt' [tamaño]")
        print("Tamaños: 512x512, 768x768, 1024x1024, 2048x2048")
        sys.exit(1)
    
    prompt = sys.argv[1]
    size = sys.argv[2] if len(sys.argv) > 2 else '1024x1024'
    
    # Verificar budget
    if not check_budget():
        print("⚠️ Budget bajo ($0.50 o menos). No se puede generar.")
        sys.exit(1)
    
    print(f"🎨 Generando imagen: {prompt[:50]}...")
    print(f"📐 Tamaño: {size}")
    
    try:
        # Obtener access token
        sa_data = load_service_account()
        access_token = get_access_token(sa_data)
        
        # Generar imagen
        image_bytes, cost = generate_image(prompt, size, access_token)
        
        # Guardar y loguear
        filepath, remaining = save_image(image_bytes, prompt, cost)
        
        print(f"✅ Imagen guardada: {filepath}")
        print(f"💰 Costo: ${cost:.3f}")
        print(f"💵 Crédito remaining: ${remaining:.3f}")
        
        # Alertar si budget bajo
        if remaining < 1.00:
            print("⚠️ ALERTA: Crédito menor a $1.00")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
