#!/usr/bin/env python3
"""
Lookitry Social OS - Rebecca's Carousel Creator
================================================
Script simplificado para que Rebecca genere carousels rápido.

Uso:
    python3 rebecca_carousel.py inauguracion
    python3 rebecca_carousel.py educativo
    python3 rebecca_carousel.py producto
"""

import os
import sys
import json
import base64
import requests
import jwt
import time
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# Paths
BASE_PATH = '/home/travis/Lookitry/Lookitry/social-os'
TEMPLATES_PATH = f'{BASE_PATH}/slideshows/templates.json'
OUTPUT_PATH = f'{BASE_PATH}/slideshows/output'
IMAGES_PATH = f'{BASE_PATH}/images/raw'
GCP_CREDS = '/home/travis/Lookitry/Lookitry/google/permiso-abril.json'

# Colors
ORANGE = '#FF5C3A'
BLACK = '#111111'
WHITE = '#FFFFFF'

def log(msg, emoji="✅"):
    print(f"{emoji} {msg}")

def get_gcp_token():
    """Obtiene token de GCP"""
    with open(GCP_CREDS, 'r') as f:
        sa_data = json.load(f)
    
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
    
    return response.json()['access_token']

def generate_image(prompt: str, token: str) -> bytes:
    """Genera imagen con GCP Vertex AI"""
    
    enhanced_prompt = f"""
    {prompt}
    
    Style: Professional advertisement, minimalist modern design
    Colors: Orange (#FF5C3A) and black dominant
    Quality: High-end product photography style, clean aesthetic
    """
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        "instances": [{"prompt": enhanced_prompt}],
        "parameters": {"sampleCount": 1, "aspectRatio": "1:1"}
    }
    
    response = requests.post(
        'https://aiplatform.googleapis.com/v1/projects/lookitry-67844/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict',
        headers=headers,
        json=data
    )
    
    if response.status_code != 200:
        raise Exception(f"GCP Error: {response.text[:200]}")
    
    result = response.json()
    return base64.b64decode(result['predictions'][0]['bytesBase64Encoded'])

def add_text_to_image(img_path: str, text: str, position: str = 'top') -> str:
    """Añade texto overlay a una imagen"""
    
    img = Image.open(img_path)
    draw = ImageDraw.Draw(img)
    
    # Font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 40)
    except:
        font = ImageFont.load_default()
        font_small = font
    
    img_width, img_height = img.size
    
    if position == 'top':
        # Semi-transparent overlay at top
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_height = 180
        overlay_draw.rectangle([(0, 0), (img_width, overlay_height)], fill=(0, 0, 0, 180))
        img = Image.alpha_composite(img.convert('RGBA'), overlay)
        img = img.convert('RGB')
        draw = ImageDraw.Draw(img)
        
        # Text
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        x = (img_width - text_width) // 2
        draw.text((x, 50), text, font=font, fill='white')
    
    elif position == 'bottom':
        # Bottom overlay
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_height = 200
        overlay_draw.rectangle([(0, img_height - overlay_height), (img_width, img_height)], fill=(0, 0, 0, 200))
        img = Image.alpha_composite(img.convert('RGBA'), overlay)
        img = img.convert('RGB')
        draw = ImageDraw.Draw(img)
        
        bbox = draw.textbbox((0, 0), text, font=font_small)
        text_width = bbox[2] - bbox[0]
        x = (img_width - text_width) // 2
        draw.text((x, img_height - 120), text, font=font_small, fill='white')
    
    # Save
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    output = f"{OUTPUT_PATH}/slide_{datetime.now().strftime('%H%M%S')}.png"
    img.save(output)
    
    return output

def create_carousel(template_name: str) -> dict:
    """Crea un carousel completo"""
    
    # Load template
    with open(TEMPLATES_PATH, 'r') as f:
        templates = json.load(f)['templates']
    
    if template_name not in templates:
        raise Exception(f"Template '{template_name}' no encontrado. Disponibles: {list(templates.keys())}")
    
    template = templates[template_name]
    
    log(f"Creando carousel: {template['name']}")
    log(f"Descripción: {template['description']}")
    
    # Get GCP token
    log("Conectando con GCP Vertex AI...")
    token = get_gcp_token()
    log("Token obtenido ✅")
    
    # Create directories
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    os.makedirs(IMAGES_PATH, exist_ok=True)
    
    slides = []
    carousel_id = f"{template_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    for i, (prompt, caption) in enumerate(zip(template['prompts'], template['captions'])):
        log(f"\n🎨 Slide {i+1}/{len(template['prompts'])}")
        log(f"   Prompt: {prompt[:60]}...")
        
        try:
            # Generate image
            img_bytes = generate_image(prompt, token)
            
            # Save raw image
            img_path = f"{IMAGES_PATH}/{carousel_id}_slide{i+1}.png"
            with open(img_path, 'wb') as f:
                f.write(img_bytes)
            
            # Add text overlay
            position = 'top' if i == 0 else 'bottom'
            final_path = add_text_to_image(img_path, caption, position)
            
            slides.append({
                'number': i + 1,
                'raw_image': img_path,
                'final_image': final_path,
                'caption': caption,
                'prompt': prompt
            })
            
            log(f"   ✅ Slide {i+1} creado")
            
        except Exception as e:
            log(f"   ❌ Error: {e}", "❌")
    
    # Generate full caption
    full_caption = '\n\n'.join(template['captions'])
    full_caption += f"\n\n{template['hashtags']}"
    full_caption += "\n\n👉 Link en bio para probarlo gratis"
    
    result = {
        'carousel_id': carousel_id,
        'template': template_name,
        'name': template['name'],
        'slides': slides,
        'caption': full_caption,
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # Save metadata
    meta_path = f"{OUTPUT_PATH}/{carousel_id}_meta.json"
    with open(meta_path, 'w') as f:
        json.dump(result, f, indent=2, default=str)
    
    log(f"\n{'='*50}")
    log(f"✅ CAROUSEL CREADO!")
    log(f"{'='*50}")
    log(f"ID: {carousel_id}")
    log(f"Slides: {len(slides)}")
    log(f"Output: {OUTPUT_PATH}")
    log(f"Metadata: {meta_path}")
    
    return result

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 rebecca_carousel.py <template>")
        print("\nTemplates disponibles:")
        print("  - inauguracion  : Post de lanzamiento")
        print("  - educativo     : Contenido educativo")
        print("  - producto      : Showcase de producto")
        print("  - testimonial   : Social proof")
        print("  - cta           : Llamado a la acción")
        sys.exit(1)
    
    template = sys.argv[1].lower()
    
    try:
        result = create_carousel(template)
        
        print("\n📋 CAPTION COMPLETO:")
        print("-" * 50)
        print(result['caption'])
        print("-" * 50)
        
        print("\n📁 ARCHIVOS GENERADOS:")
        for slide in result['slides']:
            print(f"  Slide {slide['number']}: {slide['final_image']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
