#!/usr/bin/env python3
"""
Lookitry Social OS - Slideshow Generator
========================================
Genera carousels/slideshows multi-slide para Instagram y otras plataformas.

Uso:
    python3 generator.py create --theme inauguracion --slides 5
    python3 generator.py add-text --slide 1 --text "Tu caption"
    python3 generator.py render --output carousel.png
"""

import os
import sys
import json
import base64
import requests
import jwt
import time
from datetime import datetime
from typing import List, Optional
from PIL import Image, ImageDraw, ImageFont

# Config paths
BASE_PATH = '/home/travis/Lookitry/Lookitry/social-os'
OUTPUT_PATH = f'{BASE_PATH}/slideshows/output'
RAW_IMAGES_PATH = f'{BASE_PATH}/images/raw'
PROCESSED_IMAGES_PATH = f'{BASE_PATH}/images/processed'
HOOKS_PATH = f'{BASE_PATH}/hooks/hook_library.json'
GCP_CREDS = '/home/travis/Lookitry/Lookitry/google/permiso-abril.json'

# Brand colors
BRAND_ORANGE = '#FF5C3A'
BRAND_BLACK = '#111111'
BRAND_WHITE = '#FFFFFF'

class SlideshowGenerator:
    def __init__(self):
        self.slides: List[dict] = []
        self.theme: str = ''
        self.captions: List[str] = []
        self.gcp_token = None
        
    # =====================================================
    # GCP VERTEX AI - Image Generation
    # =====================================================
    
    def get_gcp_token(self):
        """Obtiene access token de GCP"""
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
        
        self.gcp_token = response.json()['access_token']
        return self.gcp_token
    
    def generate_slide_image(self, prompt: str, slide_num: int, aspect_ratio: str = '1:1') -> str:
        """Genera una imagen para un slide usando GCP Vertex AI"""
        
        if not self.gcp_token:
            self.get_gcp_token()
        
        # Enhance prompt with brand styling
        enhanced_prompt = f"""
        {prompt}
        
        Style: Modern minimalist, professional advertisement
        Colors: Orange (#FF5C3A) and black dominant
        Quality: High-end product photography, sleek design
        """
        
        headers = {
            'Authorization': f'Bearer {self.gcp_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            "instances": [{"prompt": enhanced_prompt}],
            "parameters": {
                "sampleCount": 1,
                "aspectRatio": aspect_ratio
            }
        }
        
        response = requests.post(
            'https://aiplatform.googleapis.com/v1/projects/lookitry-67844/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict',
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            raise Exception(f"GCP Error: {response.text}")
        
        result = response.json()
        img_data = result['predictions'][0]['bytesBase64Encoded']
        img_bytes = base64.b64decode(img_data)
        
        # Save image
        os.makedirs(RAW_IMAGES_PATH, exist_ok=True)
        filename = f"slide_{self.theme}_{slide_num}_{datetime.now().strftime('%H%M%S')}.png"
        filepath = os.path.join(RAW_IMAGES_PATH, filename)
        
        with open(filepath, 'wb') as f:
            f.write(img_bytes)
        
        return filepath
    
    # =====================================================
    # Slide Creation
    # =====================================================
    
    def create_slides(self, theme: str, num_slides: int = 5, 
                     slide_prompts: List[str] = None,
                     captions: List[str] = None) -> List[str]:
        """Crea múltiples slides para un carousel"""
        
        self.theme = theme
        self.slides = []
        self.captions = captions or []
        
        # Default prompts por tema
        default_prompts = {
            'inauguracion': [
                "Grand opening celebration for Lookitry AI virtual try-on platform, modern tech office, orange and black branding, excitement atmosphere",
                "Fashion model using smartphone with virtual clothing overlay, AI technology demonstration, sleek modern design",
                "Ecommerce fashion store interface showing virtual fitting room, clothing products on screen",
                "Team celebrating Lookitry launch with confetti, startup energy, professional photography",
                "Close-up of smartphone showing virtual try-on feature, satisfied customer"
            ],
            'producto': [
                "Professional product shot of virtual try-on interface on mobile phone, fashion clothing display",
                "Fashion model trying virtual clothes, AI visualization overlay, modern aesthetic",
                "Ecommerce checkout with virtual fitting room feature highlighted, seamless shopping experience",
                "Close-up of clothing details being selected in virtual try-on app, premium feel",
                "Lifestyle shot of person confidently shopping online with virtual fitting technology"
            ],
            'educativo': [
                "Educational infographic style image about virtual fitting technology benefits, clean modern design",
                "Comparison diagram showing traditional online shopping vs virtual try-on experience",
                "Statistics visualization about fashion e-commerce returns reduction, professional chart design",
                "Step-by-step process of virtual fitting room usage, clean instructional graphics",
                "Customer satisfaction concept with fashion technology, warm approachable imagery"
            ],
            'testimonial': [
                "Happy satisfied customer with shopping bags, fashion e-commerce context, warm lighting",
                "Professional portrait of confident fashion-conscious person, modern minimalist background",
                "Close-up of positive emotional reaction to finding perfect fit virtually, authentic feel",
                "Lifestyle image of person enjoying online shopping experience at home, comfortable setting",
                "Group of diverse people celebrating good shopping decisions, inclusive representation"
            ]
        }
        
        prompts = slide_prompts or default_prompts.get(theme, default_prompts['inauguracion'])
        
        print(f"🎨 Generando {num_slides} slides para tema: {theme}")
        
        for i in range(num_slides):
            prompt = prompts[i] if i < len(prompts) else prompts[-1]
            
            print(f"  Slide {i+1}/{num_slides}...")
            try:
                img_path = self.generate_slide_image(prompt, i+1)
                self.slides.append({
                    'number': i + 1,
                    'prompt': prompt,
                    'image_path': img_path,
                    'caption': self.captions[i] if i < len(self.captions) else ''
                })
                print(f"    ✅ Guardado: {img_path}")
            except Exception as e:
                print(f"    ❌ Error: {e}")
        
        return [s['image_path'] for s in self.slides]
    
    # =====================================================
    # Text Overlay
    # =====================================================
    
    def add_text_overlay(self, slide_num: int, text: str, 
                         position: str = 'bottom',
                         font_size: int = 48) -> str:
        """Añade texto a una slide"""
        
        if slide_num > len(self.slides):
            raise Exception(f"Slide {slide_num} no existe")
        
        slide = self.slides[slide_num - 1]
        img_path = slide['image_path']
        
        # Load image
        img = Image.open(img_path)
        draw = ImageDraw.Draw(img)
        
        # Try to load font (fallback to default)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        # Calculate text position
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        img_width, img_height = img.size
        
        if position == 'bottom':
            x = (img_width - text_width) // 2
            y = img_height - text_height - 50
        elif position == 'top':
            x = (img_width - text_width) // 2
            y = 30
        elif position == 'center':
            x = (img_width - text_width) // 2
            y = (img_height - text_height) // 2
        else:
            x, y = position
        
        # Draw text with shadow for readability
        shadow_offset = 3
        draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill='black')
        draw.text((x, y), text, font=font, fill='white')
        
        # Save processed image
        os.makedirs(PROCESSED_IMAGES_PATH, exist_ok=True)
        output_name = f"processed_{os.path.basename(img_path)}"
        output_path = os.path.join(PROCESSED_IMAGES_PATH, output_name)
        img.save(output_path)
        
        self.slides[slide_num - 1]['processed_path'] = output_path
        self.slides[slide_num - 1]['caption'] = text
        
        return output_path
    
    # =====================================================
    # Render Output
    # =====================================================
    
    def render_carousel(self, output_name: str = None, 
                       add_text: bool = True,
                       captions: List[str] = None) -> List[str]:
        """Renderiza el carousel completo"""
        
        if not output_name:
            output_name = f"carousel_{self.theme}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        os.makedirs(OUTPUT_PATH, exist_ok=True)
        output_files = []
        
        for i, slide in enumerate(self.slides):
            # Use processed image if available, otherwise original
            img_path = slide.get('processed_path', slide['image_path'])
            
            # Add caption overlay if provided
            if add_text and captions and i < len(captions):
                self.add_text_overlay(i + 1, captions[i])
                img_path = slide.get('processed_path', img_path)
            
            # Copy to output
            output_file = f"{OUTPUT_PATH}/{output_name}_slide{i+1}.png"
            os.system(f"cp '{img_path}' '{output_file}'")
            output_files.append(output_file)
            
            print(f"  ✅ Slide {i+1}: {output_file}")
        
        # Save metadata
        metadata = {
            'theme': self.theme,
            'created_at': datetime.now().isoformat(),
            'slides': self.slides,
            'captions': captions or self.captions,
            'output_files': output_files
        }
        
        meta_file = f"{OUTPUT_PATH}/{output_name}_metadata.json"
        with open(meta_file, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        print(f"\n📦 Carousel guardado en: {OUTPUT_PATH}")
        print(f"📋 Metadata: {meta_file}")
        
        return output_files
    
    # =====================================================
    # Utility
    # =====================================================
    
    def get_hooks_for_theme(self, theme: str) -> List[dict]:
        """Obtiene hooks apropiados para el tema"""
        with open(HOOKS_PATH, 'r') as f:
            hooks_data = json.load(f)
        
        # Filter hooks by relevance to theme
        return hooks_data['hooks'][:5]  # Return top 5
    
    def generate_caption_with_hook(self, hook_type: str, content: str) -> str:
        """Genera caption completo usando un hook"""
        hooks_path = f'{BASE_PATH}/hooks/hook_library.json'
        with open(hooks_path, 'r') as f:
            hooks_data = json.load(f)
        
        # Find hook template
        hook = None
        for h in hooks_data['hooks']:
            if h['type'] == hook_type:
                hook = h
                break
        
        if not hook:
            return content
        
        # Generate caption
        caption = f"**{hook['template']}**\n\n{content}\n\n"
        caption += "#Lookitry #ProbadorVirtual #ModaOnline #FashionTech #Ecommerce\n"
        caption += "👇 Link en bio para probarlo gratis"
        
        return caption


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Lookitry Slideshow Generator')
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # create command
    create_parser = subparsers.add_parser('create', help='Create new slideshow')
    create_parser.add_argument('--theme', default='inauguracion', 
                               choices=['inauguracion', 'producto', 'educativo', 'testimonial'])
    create_parser.add_argument('--slides', type=int, default=5)
    create_parser.add_argument('--captions', nargs='*', help='Captions for each slide')
    
    # add-text command
    text_parser = subparsers.add_parser('add-text', help='Add text to slide')
    text_parser.add_argument('--slide', type=int, required=True)
    text_parser.add_argument('--text', required=True)
    text_parser.add_argument('--position', default='bottom')
    
    # render command
    render_parser = subparsers.add_parser('render', help='Render slideshow')
    render_parser.add_argument('--name', help='Output name')
    render_parser.add_argument('--captions', nargs='*', help='Captions')
    render_parser.add_argument('--no-text', action='store_true', help='Skip text overlay')
    
    args = parser.parse_args()
    
    if args.command == 'create':
        gen = SlideshowGenerator()
        slides = gen.create_slides(args.theme, args.slides, captions=args.captions)
        print(f"\n✅ {len(slides)} slides generadas!")
        
    elif args.command == 'add-text':
        gen = SlideshowGenerator()
        result = gen.add_text_overlay(args.slide, args.text, args.position)
        print(f"✅ Texto añadido: {result}")
        
    elif args.command == 'render':
        gen = SlideshowGenerator()
        # Need to recreate slides from metadata or pass them
        print("⚠️ Usa 'create' primero, luego 'render'")
        
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
