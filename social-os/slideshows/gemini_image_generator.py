#!/usr/bin/env python3
"""
Generador de imágenes para carousels usando Gemini 2.5 Flash
Usa la API de Gemini directamente
"""

import os
import sys
import json
import requests
from pathlib import Path

# Configuración
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AQ.Ab8RN6JoJQFIjOtwy8vMTGFInAEC5NSCjRc0Nx5UqEXaJ2cJ0A")
OUTPUT_DIR = Path(__file__).parent / "output"
TEMPLATES_DIR = Path(__file__).parent / "templates"

class GeminiImageGenerator:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
        
    def generate_image(self, prompt: str, output_path: str, size: str = "1:1") -> bool:
        """Genera una imagen usando Gemini 2.5 Flash"""
        
        # Mejorar el prompt para formato correcto
        if size == "1:1":
            aspect = "1024x1024"
        elif size == "9:16":
            aspect = "896x1856"
        else:
            aspect = "1024x1024"
        
        enhanced_prompt = f"""{prompt}

Requirements:
- Aspect ratio: {aspect}
- Professional photography style
- Modern, clean aesthetic
- High quality, detailed
- Vibrant colors matching brand (#FF5C3A)
- Dark background preferred (#111111)
- Do NOT include any text or logos in the image
- Fashion/clothing context
- Realistic, photorealistic style
- NO cartoon, anime, or illustrated style
"""
        
        url = f"{self.base_url}?key={self.api_key}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": enhanced_prompt
                }]
            }],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"]
            }
        }
        
        try:
            print(f"Generando imagen con Gemini 2.5 Flash...")
            print(f"Prompt: {prompt[:100]}...")
            
            response = requests.post(url, json=payload, timeout=120)
            
            if response.status_code != 200:
                print(f"Error HTTP: {response.status_code}")
                print(response.text)
                return False
            
            result = response.json()
            
            # Buscar la imagen en la respuesta
            if "candidates" in result:
                for candidate in result["candidates"]:
                    if "content" in candidate:
                        for part in candidate["content"]["parts"]:
                            if "image" in part:
                                # Decodificar imagen base64
                                import base64
                                image_data = base64.b64decode(part["image"])
                                
                                with open(output_path, "wb") as f:
                                    f.write(image_data)
                                
                                print(f"✅ Imagen guardada: {output_path}")
                                return True
            
            print("No se encontró imagen en la respuesta")
            print(json.dumps(result, indent=2)[:500])
            return False
            
        except Exception as e:
            print(f"Error: {e}")
            return False

def generate_carousel_gemini(template: str, platform: str = "instagram"):
    """Genera carousel completo usando Gemini 2.5 Flash"""
    
    # Cargar template
    template_file = TEMPLATES_DIR / f"{template}.json"
    if not template_file.exists():
        print(f"Template no encontrado: {template}")
        return False
    
    with open(template_file) as f:
        data = json.load(f)
    
    slides = data.get("slides", [])
    
    # Crear directorio de salida
    import datetime
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    output_subdir = OUTPUT_DIR / f"{template}_{timestamp}_{platform}"
    output_subdir.mkdir(parents=True, exist_ok=True)
    
    generator = GeminiImageGenerator()
    
    # Determinar formato
    size = "1:1" if platform == "instagram" else "9:16"
    
    # Generar cada slide
    generated_files = []
    for i, slide in enumerate(slides, 1):
        prompt = slide.get("image_prompt", "")
        output_path = output_subdir / f"slide{i}_gemini.png"
        
        print(f"\n--- Slide {i}/{len(slides)} ---")
        
        if generator.generate_image(prompt, str(output_path), size):
            generated_files.append(str(output_path))
        else:
            print(f"❌ Falló slide {i}")
    
    if generated_files:
        # Generar caption
        caption = data.get("caption", "").replace("{brand}", "Lookitry")
        
        # Guardar metadata
        metadata = {
            "template": template,
            "platform": platform,
            "timestamp": timestamp,
            "slides": generated_files,
            "caption": caption,
            "model": "gemini-2.0-flash-exp"
        }
        
        with open(output_subdir / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\n✅ Carousel completado: {output_subdir}")
        print(f"📸 {len(generated_files)} slides generadas")
        print(f"📝 Caption: {caption[:100]}...")
        
        return True
    
    return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python gemini_image_generator.py <template> [platform]")
        print("Ejemplo: python gemini_image_generator.py inauguracion instagram")
        sys.exit(1)
    
    template = sys.argv[1]
    platform = sys.argv[2] if len(sys.argv) > 2 else "instagram"
    
    success = generate_carousel_gemini(template, platform)
    sys.exit(0 if success else 1)
