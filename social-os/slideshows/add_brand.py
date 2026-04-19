#!/usr/bin/env python3
"""
Lookitry Social OS - Brand Overlay
===================================
Añade logo y colores de marca a las imágenes generadas.

Brand Guidelines:
- Primary Color: #FF5C3A (Orange)
- Secondary Color: #111111 (Black)
- Text Color: #FFFFFF (White)
- Logo: Content/Graphics/lookitry_logo_real.png
"""

import os
from PIL import Image, ImageDraw, ImageFont

# Paths
LOGO_PATH = '/home/travis/Lookitry/Lookitry/Content/Graphics/lookitry_logo_real.png'
OUTPUT_PATH = '/home/travis/Lookitry/Lookitry/social-os/images/brand_overlay'

# Brand colors
BRAND_ORANGE = (255, 92, 58)  # #FF5C3A
BRAND_BLACK = (17, 17, 17)     # #111111
BRAND_WHITE = (255, 255, 255)  # #FFFFFF


def add_logo_watermark(image_path: str, output_path: str = None, 
                       position: str = 'bottom-right',
                       opacity: int = 200) -> str:
    """
    Añade watermark del logo de Lookitry a una imagen.
    
    Args:
        image_path: Ruta de la imagen original
        output_path: Ruta de salida (None = sobreescribe)
        position: 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'center'
        opacity: 0-255 (transparencia)
    
    Returns:
        Ruta de la imagen procesada
    """
    
    if output_path is None:
        output_path = image_path
    
    # Abrir imagen
    img = Image.open(image_path).convert('RGBA')
    logo = Image.open(LOGO_PATH).convert('RGBA')
    
    # Resize logo (15% del ancho de la imagen, pero max 200px)
    img_width, img_height = img.size
    max_logo_width = min(int(img_width * 0.15), 200)
    logo_ratio = logo.height / logo.width
    new_logo_width = max_logo_width
    new_logo_height = int(new_logo_width * logo_ratio)
    logo = logo.resize((new_logo_width, new_logo_height), Image.LANCZOS)
    
    # Aplicar opacidad
    alpha = logo.split()[3]
    alpha = alpha.point(lambda p: p * opacity // 255)
    logo.putalpha(alpha)
    
    # Calcular posición
    padding = 20
    
    if position == 'bottom-right':
        x = img_width - new_logo_width - padding
        y = img_height - new_logo_height - padding
    elif position == 'bottom-left':
        x = padding
        y = img_height - new_logo_height - padding
    elif position == 'top-right':
        x = img_width - new_logo_width - padding
        y = padding
    elif position == 'top-left':
        x = padding
        y = padding
    elif position == 'center':
        x = (img_width - new_logo_width) // 2
        y = (img_height - new_logo_height) // 2
    else:
        x = img_width - new_logo_width - padding
        y = img_height - new_logo_height - padding
    
    # Crear imagen resultado
    result = Image.new('RGBA', img.size, (0, 0, 0, 0))
    result.paste(img, (0, 0))
    result.paste(logo, (x, y), logo)
    
    # Guardar
    if output_path.endswith('.png'):
        result.save(output_path, 'PNG')
    else:
        result.save(output_path, 'JPEG', quality=95)
    
    return output_path


def add_brand_border(image_path: str, output_path: str = None,
                     color: tuple = BRAND_ORANGE,
                     width: int = 8) -> str:
    """
    Añade borde de color de marca.
    """
    
    if output_path is None:
        output_path = image_path
    
    img = Image.open(image_path).convert('RGB')
    draw = ImageDraw.Draw(img)
    
    width_img, height_img = img.size
    
    # Dibujar borde
    draw.rectangle([0, 0, width_img-1, height_img-1], outline=color, width=width)
    
    img.save(output_path)
    return output_path


def add_brand_gradient(image_path: str, output_path: str = None,
                       position: str = 'bottom',
                       color: tuple = BRAND_ORANGE) -> str:
    """
    Añade gradiente de color de marca (para text overlay).
    """
    
    if output_path is None:
        output_path = image_path
    
    img = Image.open(image_path).convert('RGBA')
    draw = ImageDraw.Draw(img)
    
    width_img, height_img = img.size
    gradient_height = int(height_img * 0.25)
    
    if position == 'bottom':
        # Gradiente desde transparente a color sólido
        for y in range(gradient_height):
            opacity = int((y / gradient_height) * 220)
            draw.rectangle([0, height_img - gradient_height + y, width_img, height_img - gradient_height + y + 1],
                          fill=(*color, opacity))
    
    img.save(output_path)
    return output_path


def add_logo_and_process(input_path: str, output_path: str = None) -> str:
    """
    Procesa una imagen con todos los elementos de marca:
    1. Añade borde de marca
    2. Añade logo watermark
    """
    
    if output_path is None:
        # Crear nombre nuevo
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_branded{ext}"
    
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    
    # Step 1: Añadir borde
    temp_path = f"{OUTPUT_PATH}/temp_border.png"
    add_brand_border(input_path, temp_path, BRAND_ORANGE, 6)
    
    # Step 2: Añadir logo
    result = add_logo_watermark(temp_path, output_path, 'bottom-right', 230)
    
    # Limpiar temp
    if os.path.exists(temp_path):
        os.remove(temp_path)
    
    return result


def process_carousel(input_dir: str, output_dir: str = None) -> list:
    """
    Procesa todas las imágenes de un carousel.
    """
    
    if output_dir is None:
        output_dir = input_dir
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Supported extensions
    extensions = ('.png', '.jpg', '.jpeg')
    
    processed = []
    for filename in sorted(os.listdir(input_dir)):
        if filename.lower().endswith(extensions):
            input_path = os.path.join(input_dir, filename)
            output_filename = f"branded_{filename}"
            output_path = os.path.join(output_dir, output_filename)
            
            try:
                result = add_logo_and_process(input_path, output_path)
                processed.append(result)
                print(f"✅ {filename} → branded_{filename}")
            except Exception as e:
                print(f"❌ Error con {filename}: {e}")
    
    return processed


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Lookitry Brand Overlay')
    parser.add_argument('--input', required=True, help='Input image or directory')
    parser.add_argument('--output', help='Output path (optional)')
    parser.add_argument('--logo-only', action='store_true', help='Only add logo')
    parser.add_argument('--border-only', action='store_true', help='Only add border')
    
    args = parser.parse_args()
    
    if os.path.isdir(args.input):
        results = process_carousel(args.input, args.output)
        print(f"\n✅ Procesadas {len(results)} imágenes")
    else:
        if args.logo_only:
            result = add_logo_watermark(args.input, args.output)
        elif args.border_only:
            result = add_brand_border(args.input, args.output)
        else:
            result = add_logo_and_process(args.input, args.output)
        print(f"✅ Procesado: {result}")


if __name__ == '__main__':
    main()
