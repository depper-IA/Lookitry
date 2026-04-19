#!/usr/bin/env python3
"""
Lookitry Social OS - TikTok Content Generator
============================================
Genera contenido completo para TikTok: carousel con marca + música.

Uso:
    python3 create_tiktok_content.py inauguracion
    python3 create_tiktok_content.py inauguracion --music-style energetic
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
MUSIC_PATH = f'{BASE_PATH}/music/output'
GCP_CREDS = '/home/travis/Lookitry/Lookitry/google/permiso-abril.json'
LOGO_PATH = '/home/travis/Lookitry/Lookitry/Content/Graphics/lookitry_logo_real.png'
SONAUTO_API_KEY = 'sksonauto_wrlgeFuh0RI9Ajb7I8yMfg132qj_PBIFJn55_hWP74IrnJid'

# Brand colors
ORANGE = (255, 92, 58)   # #FF5C3A
BLACK = (17, 17, 17)      # #111111
WHITE = (255, 255, 255)   # #FFFFFF

def log(msg, emoji="✅"):
    print(f"{emoji} {msg}")

# =====================================================
# SonAuto Music Generator
# =====================================================

def generate_music(prompt: str, tags: list) -> dict:
    """Genera música con SonAuto"""
    
    log("🎵 Generando música con SonAuto...")
    
    headers = {
        'Authorization': f'Bearer {SONAUTO_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'prompt': prompt,
        'tags': tags,
        'num_songs': 1
    }
    
    try:
        # Iniciar generación
        response = requests.post(
            'https://api.sonauto.ai/v1/generations',
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            log(f"❌ Error SonAuto: {response.text[:200]}", "❌")
            return None
        
        task_id = response.json().get('task_id')
        log(f"   Task ID: {task_id}")
        
        # Esperar resultado
        log("   Esperando generación (30-60s)...")
        for i in range(20):
            time.sleep(5)
            status_resp = requests.get(
                f'https://api.sonauto.ai/v1/generations/status/{task_id}',
                headers=headers
            )
            status = status_resp.text.strip('"')
            print(f"   Status: {status}")
            
            if status == 'SUCCESS':
                break
            elif status == 'FAILURE':
                log("   ❌ Generación fallida", "❌")
                return None
        
        # Obtener resultado
        result_resp = requests.get(
            f'https://api.sonauto.ai/v1/generations/{task_id}',
            headers=headers
        )
        
        result = result_resp.json()
        song_url = result.get('song_paths', [None])[0]
        
        # Descargar
        if song_url:
            os.makedirs(MUSIC_PATH, exist_ok=True)
            song_filename = f"tiktok_music_{task_id}.ogg"
            song_path = os.path.join(MUSIC_PATH, song_filename)
            
            song_resp = requests.get(song_url, timeout=60)
            with open(song_path, 'wb') as f:
                f.write(song_resp.content)
            
            log(f"   ✅ Música guardada: {song_path}")
            
            return {
                'task_id': task_id,
                'song_url': song_url,
                'song_path': song_path,
                'lyrics': result.get('lyrics', ''),
                'tags': tags
            }
        
    except Exception as e:
        log(f"   ❌ Error: {e}", "❌")
    
    return None

# =====================================================
# GCP Image Generator
# =====================================================

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

def generate_image(prompt: str, token: str, aspect_ratio: str = '9:16') -> bytes:
    """Genera imagen con GCP Vertex AI"""
    
    enhanced_prompt = f"""
    {prompt}
    
    Style: Professional advertisement, minimalist modern design
    Colors: Orange (#FF5C3A) and black dominant
    Quality: High-end product photography style, clean aesthetic
    Brand: Lookitry virtual try-on technology
    Vertical format for mobile/social media
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

# =====================================================
# Brand Overlay
# =====================================================

def add_brand_overlay(img_path: str, caption: str, slide_num: int = 1) -> str:
    """Añade elementos de marca a la imagen"""
    
    img = Image.open(img_path).convert('RGB')
    draw = ImageDraw.Draw(img)
    img_width, img_height = img.size
    
    # Borde naranja
    border_width = 6
    draw.rectangle(
        [0, 0, img_width-1, img_height-1],
        outline=ORANGE,
        width=border_width
    )
    
    # Logo watermark
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGBA')
        max_logo_width = int(img_width * 0.10)
        logo_ratio = logo.height / logo.width
        new_logo_width = max_logo_width
        new_logo_height = int(new_logo_width * logo_ratio)
        logo = logo.resize((new_logo_width, new_logo_height), Image.LANCZOS)
        
        padding = 15
        x = img_width - new_logo_width - padding
        y = img_height - new_logo_height - padding
        
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        img.paste(logo, (x, y), logo)
    
    # Text overlay para slides principales
    if slide_num <= 3 and len(caption) < 80:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 42)
        except:
            font = ImageFont.load_default()
        
        # Overlay naranja semi-transparente
        overlay_height = 100
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rectangle([0, 0, img_width, overlay_height], fill=(255, 92, 58, 220))
        img = Image.alpha_composite(img.convert('RGBA'), overlay)
        
        # Texto
        draw = ImageDraw.Draw(img)
        bbox = draw.textbbox((0, 0), caption[:40], font=font)
        text_width = bbox[2] - bbox[0]
        x = (img_width - text_width) // 2
        draw.text((x, 28), caption[:40], font=font, fill='white')
    
    img = img.convert('RGB')
    return img

# =====================================================
# Main Generator
# =====================================================

def create_tiktok_content(template_name: str, music_style: str = 'energetic') -> dict:
    """Genera contenido completo para TikTok"""
    
    # Cargar templates
    with open(TEMPLATES_PATH, 'r') as f:
        templates = json.load(f)['templates']
    
    if template_name not in templates:
        raise Exception(f"Template '{template_name}' no encontrado")
    
    template = templates[template_name]
    tiktok_config = template.get('tiktok', {})
    prompts = template['prompts']
    captions = tiktok_config.get('captions', prompts)[:len(prompts)]
    
    log(f"🎬 Generando contenido TikTok: {template['name']}")
    log(f"📱 Estilo música: {music_style}")
    
    # Crear directorios
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    os.makedirs(IMAGES_PATH, exist_ok=True)
    
    content_id = f"tiktok_{template_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    tiktok_output = f"{OUTPUT_PATH}/{content_id}"
    os.makedirs(tiktok_output, exist_ok=True)
    
    # 1. Generar música
    music_styles = {
        'energetic': {'tags': ['electronic', 'dance', '2020s'], 'prompt': 'An energetic upbeat electronic dance track for TikTok content'},
        'chill': {'tags': ['chill', 'ambient', 'relaxation'], 'prompt': 'A chill relaxed ambient track for social media'},
        'trending': {'tags': ['electronic', 'pop', '2020s'], 'prompt': 'A trending viral TikTok track, energetic and catchy'},
        'fashion': {'tags': ['electronic', 'dance', '2020s'], 'prompt': 'A fashion-forward electronic track, luxury vibes'}
    }
    
    style_config = music_styles.get(music_style, music_styles['energetic'])
    music_result = generate_music(style_config['prompt'], style_config['tags'])
    
    # 2. Generar slides
    log("🎨 Generando slides...")
    token = get_gcp_token()
    
    slides = []
    for i, (prompt, caption) in enumerate(zip(prompts, captions)):
        log(f"   Slide {i+1}/{len(prompts)}")
        
        try:
            # Generar imagen
            img_bytes = generate_image(prompt, token, '9:16')
            
            # Guardar raw
            raw_path = f"{IMAGES_PATH}/{content_id}_slide{i+1}.png"
            with open(raw_path, 'wb') as f:
                f.write(img_bytes)
            
            # Añadir marca
            img = add_brand_overlay(raw_path, caption, i+1)
            
            # Guardar final
            final_path = f"{tiktok_output}/slide{i+1}.png"
            img.save(final_path, 'PNG', quality=95)
            
            slides.append({
                'number': i + 1,
                'raw': raw_path,
                'final': final_path,
                'caption': caption
            })
            
            log(f"   ✅ Slide {i+1} guardado")
            
        except Exception as e:
            log(f"   ❌ Error: {e}", "❌")
    
    # 3. Generar caption completo
    full_caption = '\n\n'.join(captions)
    full_caption += f"\n\n{template.get('hashtags', '#Lookitry #TikTok')}"
    full_caption += "\n\n🎵 Sound: Generated with SonAuto AI"
    
    # Resultado
    result = {
        'content_id': content_id,
        'template': template_name,
        'music_style': music_style,
        'slides': slides,
        'music': music_result,
        'caption': full_caption,
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # Guardar metadata
    meta_path = f"{tiktok_output}/metadata.json"
    with open(meta_path, 'w') as f:
        json.dump(result, f, indent=2, default=str)
    
    log(f"\n{'='*50}")
    log(f"🎉 CONTENIDO TIKTOK COMPLETO!")
    log(f"{'='*50}")
    log(f"📁 Output: {tiktok_output}")
    log(f"🎵 Música: {music_result.get('song_path') if music_result else 'N/A'}")
    log(f"📸 Slides: {len(slides)}")
    
    return result

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 create_tiktok_content.py <template> [music-style]")
        print("\nTemplates:")
        print("  - inauguracion")
        print("  - educativo")
        print("  - producto")
        print("  - testimonial")
        print("  - cta")
        print("\nMusic styles:")
        print("  - energetic (default)")
        print("  - chill")
        print("  - trending")
        print("  - fashion")
        sys.exit(1)
    
    template = sys.argv[1].lower()
    music_style = sys.argv[2].lower() if len(sys.argv) > 2 else 'energetic'
    
    try:
        result = create_tiktok_content(template, music_style)
        
        print("\n" + "="*60)
        print("📋 CAPTION TIKTOK:")
        print("="*60)
        print(result['caption'][:800])
        
        print("\n📁 ARCHIVOS:")
        print(f"   Output: {result['slides'][0]['final'].rsplit('/', 1)[0]}/")
        if result.get('music'):
            print(f"   Música: {result['music'].get('song_path')}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
