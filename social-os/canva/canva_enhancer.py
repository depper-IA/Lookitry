#!/usr/bin/env python3
"""
Lookitry Social OS - Canva Integration (Fallback)
=================================================
Mejora imágenes usando Canva API.

NOTA: Canva Apps SDK corre dentro de Canva (iframe).
Para uso automático, necesitamos usar Canva Connect API.

Docs: https://www.canva.dev/docs/apps/

Prerrequisitos:
- Cuenta Canva Pro
- Crear una App en https://www.canva.com/developers
- Obtener API credentials

Usage:
    python3 canva_enhancer.py enhance --input image.png --text "Lookitry"
"""

import os
import sys
import json
import requests
from typing import Optional

# Paths
BASE_PATH = '/home/travis/Lookitry/Lookitry/social-os'
CANVA_CONFIG = f'{BASE_PATH}/canva/config.json'
OUTPUT_PATH = f'{BASE_PATH}/images/canva_enhanced'

# Brand elements
LOGO_PATH = '/home/travis/Lookitry/Lookitry/Content/Graphics/lookitry_logo_real.png'
BRAND_COLORS = {
    'primary': '#FF5C3A',    # Orange
    'secondary': '#111111',   # Black
    'white': '#FFFFFF'
}

class CanvaEnhancer:
    """
    Enhancer de imágenes usando Canva.
    
    Métodos disponibles:
    1. Canva Apps SDK (requiere usuario manualmente)
    2. Canva Connect API (automatizado, requiere OAuth)
    3. Template-based (pre-diseñar templates)
    """
    
    def __init__(self, api_client_id: str = None, api_client_secret: str = None):
        self.client_id = api_client_id or os.getenv('CANVA_CLIENT_ID')
        self.client_secret = api_client_secret or os.getenv('CANVA_CLIENT_SECRET')
        self.access_token = None
        self.base_url = 'https://api.canva.com/rest/v1'
        
        if self.client_id and self.client_secret:
            self.authenticate()
    
    def authenticate(self) -> bool:
        """Autentica con Canva Connect API usando OAuth2"""
        
        if not self.client_id or not self.client_secret:
            print("⚠️ No Canva credentials - usando modo fallback")
            return False
        
        # OAuth2 client credentials flow
        token_url = 'https://api.canva.com/rest/v1/oauth/token'
        
        response = requests.post(
            token_url,
            auth=(self.client_id, self.client_secret),
            data={
                'grant_type': 'client_credentials',
                'scope': 'design:content:read design:content:write asset:read asset:write'
            }
        )
        
        if response.status_code == 200:
            self.access_token = response.json().get('access_token')
            print("✅ Canva autenticado")
            return True
        else:
            print(f"❌ Error autenticando Canva: {response.text}")
            return False
    
    def upload_asset(self, file_path: str) -> Optional[dict]:
        """Sube una imagen como asset a Canva"""
        
        if not self.access_token:
            print("⚠️ No autenticado con Canva")
            return None
        
        headers = {
            'Authorization': f'Bearer {self.access_token}'
        }
        
        with open(file_path, 'rb') as f:
            files = {'asset': (os.path.basename(file_path), f, 'image/png')}
            data = {'name': os.path.basename(file_path)}
            
            response = requests.post(
                f'{self.base_url}/assets',
                headers=headers,
                files=files,
                data=data
            )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error subiendo asset: {response.text}")
            return None
    
    def create_design_from_template(self, template_id: str, title: str) -> Optional[dict]:
        """Crea un nuevo design basado en template"""
        
        if not self.access_token:
            return None
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'asset_type': 'presentation',
            'title': title
        }
        
        # Crear design
        response = requests.post(
            f'{self.base_url}/designs',
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            return response.json()
        
        print(f"❌ Error creando design: {response.text}")
        return None
    
    def add_element(self, design_id: str, element: dict) -> Optional[dict]:
        """Añade un elemento al design"""
        
        if not self.access_token:
            return None
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f'{self.base_url}/designs/{design_id}/elements',
            headers=headers,
            json=element
        )
        
        if response.status_code == 200:
            return response.json()
        
        return None
    
    def export_design(self, design_id: str, format: str = 'png') -> Optional[str]:
        """Exporta el design y retorna URL de descarga"""
        
        if not self.access_token:
            return None
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        # Iniciar exportación
        export_payload = {
            'format': format,
            'design_id': design_id
        }
        
        response = requests.post(
            f'{self.base_url}/exports',
            headers=headers,
            json=export_payload
        )
        
        if response.status_code != 200:
            print(f"❌ Error iniciando exportación: {response.text}")
            return None
        
        job_id = response.json().get('job', {}).get('id')
        
        # Esperar resultado (poll)
        for _ in range(30):
            result = requests.get(
                f'{self.base_url}/exports/{job_id}',
                headers=headers
            )
            
            if result.status_code == 200:
                job = result.json().get('job', {})
                status = job.get('status')
                
                if status == 'success':
                    urls = job.get('urls', [])
                    return urls[0] if urls else None
                elif status == 'failed':
                    return None
            
            import time
            time.sleep(2)
        
        return None


# =====================================================
# Fallback: Mejorar con Pillow (sin Canva)
# =====================================================

def enhance_with_pillow(input_path: str, output_path: str, 
                       text: str = None, add_logo: bool = True) -> bool:
    """
    Mejora imagen con Pillow (cuando Canva no está disponible).
    
    Args:
        input_path: Imagen original
        output_path: Donde guardar
        text: Texto a añadir
        add_logo: Si añadir logo de marca
    """
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    
    img = Image.open(input_path).convert('RGBA')
    width, height = img.size
    
    # Mejorar colores ligeramente
    # ... (efectos de mejora)
    
    # Añadir borde de marca
    draw = ImageDraw.Draw(img)
    border_color = (255, 92, 58, 255)  # Orange
    border_width = 8
    
    # Marco exterior
    draw.rectangle(
        [border_width//2, border_width//2, width - border_width//2, height - border_width//2],
        outline=border_color,
        width=border_width
    )
    
    # Añadir logo
    if add_logo and os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGBA')
        
        # Escalar logo al 8% del ancho
        max_logo_width = int(width * 0.08)
        logo_ratio = logo.height / logo.width
        new_width = max_logo_width
        new_height = int(new_width * logo_ratio)
        
        logo = logo.resize((new_width, new_height), Image.LANCZOS)
        
        # Posición: esquina inferior derecha
        padding = 20
        x = width - new_width - padding
        y = height - new_height - padding
        
        img.paste(logo, (x, y), logo)
    
    # Añadir texto si se proporciona
    if text:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
        except:
            font = ImageFont.load_default()
        
        # Overlay de fondo para texto
        text_height = 100
        overlay = Image.new('RGBA', (width, text_height), (0, 0, 0, 180))
        img.paste(overlay, (0, 0))
        
        draw = ImageDraw.Draw(img)
        
        # Texto centrado
        bbox = draw.textbbox((0, 0), text[:30], font=font)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) // 2
        
        draw.text((x, 30), text[:30], font=font, fill=(255, 255, 255, 255))
    
    # Guardar
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.convert('RGB').save(output_path, 'PNG')
    
    return True


# =====================================================
# Main CLI
# =====================================================

def cmd_enhance(args):
    """Mejora una imagen"""
    
    if args.use_canva and args.canva_client_id:
        # Usar Canva
        enhancer = CanvaEnhancer(
            api_client_id=args.canva_client_id,
            api_client_secret=args.canva_client_secret
        )
        
        if enhancer.access_token:
            print(f"🎨 Mejorando con Canva...")
            # Subir imagen
            asset = enhancer.upload_asset(args.input)
            
            if asset:
                print(f"✅ Asset subido: {asset.get('id')}")
            else:
                print("⚠️ Canva no disponible, usando Pillow fallback")
        else:
            print("⚠️ Canva no configurado, usando Pillow fallback")
    
    # Fallback a Pillow
    output = args.output or f"{OUTPUT_PATH}/{os.path.basename(args.input)}"
    
    print(f"🎨 Mejorando imagen con Pillow...")
    
    success = enhance_with_pillow(
        input_path=args.input,
        output_path=output,
        text=args.text,
        add_logo=not args.no_logo
    )
    
    if success:
        print(f"✅ Imagen mejorada: {output}")
    else:
        print("❌ Error mejorando imagen")


def cmd_setup(args):
    """Configura credenciales de Canva"""
    
    print("🔧 Configurando Canva...")
    
    client_id = input("Client ID: ").strip()
    client_secret = input("Client Secret: ").strip()
    
    config = {
        'client_id': client_id,
        'client_secret': client_secret,
        'scopes': 'design:content:read design:content:write asset:read asset:write'
    }
    
    os.makedirs(os.path.dirname(CANVA_CONFIG), exist_ok=True)
    
    with open(CANVA_CONFIG, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"✅ Config guardado en {CANVA_CONFIG}")
    print("\n📝 Para usar, ejecuta con:")
    print(f"   python3 canva_enhancer.py enhance --input imagen.png --use-canva")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Canva Enhancer para Lookitry Social OS')
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # enhance
    enhance_parser = subparsers.add_parser('enhance', help='Enhance an image')
    enhance_parser.add_argument('--input', required=True, help='Input image path')
    enhance_parser.add_argument('--output', help='Output path')
    enhance_parser.add_argument('--text', help='Text to add')
    enhance_parser.add_argument('--no-logo', action='store_true', help='Skip logo')
    enhance_parser.add_argument('--use-canva', action='store_true', help='Use Canva API')
    enhance_parser.add_argument('--canva-client-id', help='Canva Client ID')
    enhance_parser.add_argument('--canva-client-secret', help='Canva Client Secret')
    
    # setup
    subparsers.add_parser('setup', help='Setup Canva credentials')
    
    args = parser.parse_args()
    
    if args.command == 'enhance':
        cmd_enhance(args)
    elif args.command == 'setup':
        cmd_setup(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()