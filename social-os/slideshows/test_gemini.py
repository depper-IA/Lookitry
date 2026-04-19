#!/usr/bin/env python3
"""Test Gemini 2.5 Flash image generation"""

import os
import sys
import json
import base64
import requests
from pathlib import Path
from datetime import datetime

GEMINI_API_KEY = "AQ.Ab8RN6JoJQFIjOtwy8vMTGFInAEC5NSCjRc0Nx5UqEXaJ2cJ0A"
OUTPUT_DIR = Path("/home/travis/Lookitry/Lookitry/social-os/slideshows/output")

# Prompts optimizados para Gemini (fotografía profesional de moda)
PROMPTS = [
    "Professional fashion photography of modern clothing store interior with digital holographic display showing virtual clothes, dark sophisticated atmosphere, luxury retail, photorealistic",
    "Close-up professional photography of woman looking frustrated at fitting room mirror, soft natural lighting, candid emotional fashion shot, realistic editorial style", 
    "Futuristic fashion photography showing elegant woman using smartphone with augmented reality clothing overlay, modern minimalist background, professional studio lighting",
    "Clean modern flat lay photography of professional fashion accessories on dark surface, minimal elegant composition, luxury product photography style",
    "Elegant fashion boutique exterior at night with warm golden lighting, modern sophisticated storefront, luxury shopping atmosphere, professional architectural photography"
]

def generate_with_gemini(prompt, output_path):
    """Genera imagen usando Gemini 2.5 Flash"""
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [{
                "text": f"{prompt}\n\nRequirements: Professional fashion photography style, photorealistic, high quality, dark background preferred, NO text or logos in image"
            }]
        }],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"]
        }
    }
    
    print(f"Generando: {prompt[:60]}...")
    
    try:
        response = requests.post(url, json=payload, timeout=180)
        
        if response.status_code != 200:
            print(f"Error HTTP {response.status_code}: {response.text[:200]}")
            return False
        
        result = response.json()
        
        # Buscar imagen en respuesta
        if "candidates" in result:
            for candidate in result["candidates"]:
                if "content" in candidate:
                    for part in candidate["content"]["parts"]:
                        if "image" in part:
                            image_data = base64.b64decode(part["image"])
                            with open(output_path, "wb") as f:
                                f.write(image_data)
                            size = os.path.getsize(output_path)
                            print(f"✅ Guardado: {output_path} ({size} bytes)")
                            return True
        
        print(f"Respuesta: {json.dumps(result, indent=2)[:300]}")
        return False
        
    except Exception as e:
        print(f"Exception: {e}")
        return False

# Crear directorio con timestamp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
output_subdir = OUTPUT_DIR / f"inauguracion_gemini_{timestamp}"
output_subdir.mkdir(parents=True, exist_ok=True)

print(f"=== Generando carousel con Gemini 2.5 Flash ===")
print(f"Output: {output_subdir}\n")

generated = []
for i, prompt in enumerate(PROMPTS, 1):
    output_path = output_subdir / f"slide{i}.png"
    print(f"\n--- Slide {i}/5 ---")
    if generate_with_gemini(prompt, str(output_path)):
        generated.append(str(output_path))

print(f"\n=== RESULTADO ===")
print(f"Generadas: {len(generated)}/5 slides")

if generated:
    # Enviar primera slide como preview
    print(f"\nEnviando preview...")
    
# Guardar caption
caption = """🎉 ¡LOOKITRY YA ESTÁ AQUÍ!

Imagina que tus clientes pueden probarse la ropa ANTES de comprar 🛍️

Sin devoluciones. Sin dudas. Solo ventas.

🌟 Reduce devoluciones hasta un 40%

¿Puedes ser de las primeras marcas en usarlo?

#Lookitry #Inauguración #ProbadorVirtual #ModaTech"""

with open(output_subdir / "caption.txt", "w") as f:
    f.write(caption)

print(f"\n✅ carousel guardado en: {output_subdir}")
