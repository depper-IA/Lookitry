#!/usr/bin/env python3
"""
Lookitry Social OS - Brand Carousel Creator
==========================================
Genera carousels completos con marca: imágenes + logo + colores.

Uso:
    python3 create_brand_carousel.py inauguracion instagram
    python3 create_brand_carousel.py inauguracion tiktok
    python3 create_brand_carousel.py inauguracion both
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
TEMPLATES_PATH = f'{BASE_PATH}/slideshows/templates_tiktok.json'
OUTPUT_PATH = f'{BASE_PATH}/slideshows/output'
IMAGES_PATH = f'{BASE_PATH}/images/raw'
BRAND_PATH = f'{BASE_PATH}/images/brand'
GCP_CREDS = '/home/travis/Lookitry/Lookitry/google/permiso-abril.json'
LOGO_PATH = '/home/travis/Lookitry/Lookitry/Content/Graphics/lookitry_logo_real.png'

# Brand colors
ORANGE = (255, 92, 58)   # #FF5C3A
BLACK = (17, 17, 17)      # #111111
WHITE = (255, 255, 255)   # #FFFFFF

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

def generate_image(prompt: str, token: str, aspect_ratio: str = '1:1') -> bytes:
    """Genera imagen con GCP Vertex AI"""
    
    enhanced_prompt = f"""
    {prompt}
    
    Style: Professional advertisement, minimalist modern design
    Colors: Orange (#FF5C3A) and black dominant
    Quality: High-end product photography style, clean aesthetic
    Brand: Lookitry virtual try-on technology
    """
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        "instances": [{"prompt": enhanced_prompt}],
        "parameters": {"sampleCount": 1, "aspectRatio": aspect_ratio}
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

def add_brand_overlay(img_path: str, caption: str, platform: str) -> str:
    """
    Añade elementos de marca a la imagen:
    - Borde naranja
    - Logo watermark
    - Texto overlay (para algunos slides)
    """
    
    img = Image.open(img_path).convert('RGB')
    draw = ImageDraw.Draw(img)
    img_width, img_height = img.size
    
    # 1. Borde de marca (naranja)
    border_width = 8
    draw.rectangle(
        [0, 0, img_width-1, img_height-1],
        outline=ORANGE,
        width=border_width
    )
    
    # 2. Logo watermark (bottom-right)
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGBA')
        
        # Resize logo (12% del ancho)
        max_logo_width = int(img_width * 0.12)
        logo_ratio = logo.height / logo.width
        new_logo_width = max_logo_width
        new_logo_height = int(new_logo_width * logo_ratio)
        logo = logo.resize((new_logo_width, new_logo_height), Image.LANCZOS)
        
        # Position (bottom-right with padding)
        padding = 20
        x = img_width - new_logo_width - padding
        y = img_height - new_logo_height - padding
        
        # Paste with transparency
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        img.paste(logo, (x, y), logo)
    
    # 3. Text overlay para primer slide (solo si caption corto)
    if len(caption) < 100 and platform == 'instagram':
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
        except:
            font = ImageFont.load_default()
        
        # Semi-transparent overlay at top
        overlay_height = 120
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rectangle([0, 0, img_width, overlay_height], fill=(255, 92, 58, 200))
        img = Image.alpha_composite(img.convert('RGBA'), overlay)
        
        # Text
        draw = ImageDraw.Draw(img)
        bbox = draw.textbbox((0, 0), caption[:50], font=font)
        text_width = bbox[2] - bbox[0]
        x = (img_width - text_width) // 2
        draw.text((x, 35), caption[:50], font=font, fill='white')
    
    # Convert back to RGB for saving
    img = img.convert('RGB')
    
    return img

def create_brand_carousel(template_name: str, platform: str = 'both') -> dict:
    """Crea un carousel completo con marca para Instagram y/o TikTok"""
    
    # Load templates
    with open(TEMPLATES_PATH, 'r') as f:
        templates_data = json.load(f)
    
    templates = templates_data['templates']
    brand_colors = templates_data['brand_colors']
    
    if template_name not in templates:
        raise Exception(f"Template '{template_name}' no encontrado")
    
    template = templates[template_name]
    
    log(f"🎨 Creando carousel: {template['name']}")
    log(f"📋 Descripción: {template['description']}")
    
    # Platforms to generate
    platforms = ['instagram', 'tiktok'] if platform == 'both' else [platform]
    
    # Get GCP token
    log("🔑 Conectando con GCP Vertex AI...")
    token = get_gcp_token()
    log("✅ Token obtenido")
    
    # Create directories
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    os.makedirs(IMAGES_PATH, exist_ok=True)
    os.makedirs(BRAND_PATH, exist_ok=True)
    
    carousel_id = f"{template_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    results = {}
    
    for plat in platforms:
        log(f"\n{'='*50}")
        log(f"📱 Generando para: {plat.upper()}")
        log(f"{'='*50}")
        
        plat_config = template.get(plat, {})
        aspect_ratio = plat_config.get('aspect_ratio', '1:1')
        # Get platform-specific captions or fall back to top-level captions
        captions = plat_config.get('captions', template.get('captions', []))
        prompts = template['prompts']
        
        # Fallback if no captions
        if not captions:
            captions = [f"Slide {i+1}" for i in range(len(prompts))]
        
        slides = []
        plat_output = f"{OUTPUT_PATH}/{carousel_id}_{plat}"
        os.makedirs(plat_output, exist_ok=True)
        
        for i, (prompt, caption) in enumerate(zip(prompts, captions)):
            log(f"\n🎬 Slide {i+1}/{len(prompts)}")
            log(f"   📝 Caption: {caption[:50]}...")
            
            try:
                # Generate image
                img_bytes = generate_image(prompt, token, aspect_ratio)
                
                # Save raw
                raw_path = f"{IMAGES_PATH}/{carousel_id}_{plat}_slide{i+1}.png"
                with open(raw_path, 'wb') as f:
                    f.write(img_bytes)
                
                # Add brand overlay
                img = add_brand_overlay(raw_path, caption, plat)
                
                # Save branded
                branded_path = f"{plat_output}/slide{i+1}_branded.png"
                img.save(branded_path, 'PNG', quality=95)
                
                slides.append({
                    'number': i + 1,
                    'raw': raw_path,
                    'branded': branded_path,
                    'caption': caption
                })
                
                log(f"   ✅ Slide {i+1} guardado")
                
            except Exception as e:
                log(f"   ❌ Error: {e}", "❌")
        
        # Generate full caption
        full_caption = '\n\n'.join(captions)
        full_caption += f"\n\n{template['hashtags']}"
        
        if plat == 'tiktok':
            full_caption += "\n\n🎵 Usa un sonido trending de TikTok"
        
        results[plat] = {
            'carousel_id': f"{carousel_id}_{plat}",
            'platform': plat,
            'slides': slides,
            'caption': full_caption,
            'aspect_ratio': aspect_ratio,
            'output_dir': plat_output
        }
        
        log(f"\n✅ {plat.upper()} - {len(slides)} slides generadas!")
    
    # Save metadata
    meta_path = f"{OUTPUT_PATH}/{carousel_id}_metadata.json"
    with open(meta_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    log(f"\n{'='*50}")
    log(f"🎉 CAROUSEL COMPLETO CREADO!")
    log(f"{'='*50}")
    log(f"ID: {carousel_id}")
    log(f"Platforms: {', '.join(platforms)}")
    log(f"Metadata: {meta_path}")
    
    return results

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 create_brand_carousel.py <template> [platform]")
        print("\nTemplates:")
        print("  - inauguracion")
        print("  - educativo")
        print("  - producto")
        print("  - testimonial")
        print("  - cta")
        print("\nPlatform:")
        print("  - instagram (default)")
        print("  - tiktok")
        print("  - both")
        sys.exit(1)
    
    template = sys.argv[1].lower()
    platform = sys.argv[2].lower() if len(sys.argv) > 2 else 'both'
    
    try:
        results = create_brand_carousel(template, platform)
        
        print("\n" + "="*60)
        print("📋 CAPTIONS GENERADOS:")
        print("="*60)
        
        for plat, data in results.items():
            print(f"\n📱 {plat.upper()}:")
            print("-"*50)
            print(data['caption'][:500] + "..." if len(data['caption']) > 500 else data['caption'])
            
            print(f"\n📁 Archivos: {data['output_dir']}/")
            for slide in data['slides']:
                print(f"   Slide {slide['number']}: {slide['branded']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
