"""Buscar el ID exacto del modelo Gemini con generación de imágenes en OpenRouter"""
import requests, json

r = requests.get('https://openrouter.ai/api/v1/models', timeout=15)
models = r.json().get('data', [])

print(f'Total modelos: {len(models)}\n')
print('Modelos Google con output de imagen:')
for m in models:
    model_id = m.get('id', '')
    output_modalities = m.get('architecture', {}).get('output_modalities', [])
    if 'google' in model_id.lower() and 'image' in output_modalities:
        print(f'  ID: {model_id}')
        print(f'  Nombre: {m.get("name")}')
        print(f'  Input: {m.get("architecture", {}).get("input_modalities")}')
        print(f'  Output: {output_modalities}')
        print()
