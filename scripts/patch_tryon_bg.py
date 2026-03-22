import os
import re

tryon_path = r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\tryon\TryOnWidget.tsx"
editorial_path = r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateEditorial.tsx"

# 1. Limpiar backgroundColor: secondaryColor de TryOnWidget.tsx
if os.path.exists(tryon_path):
    with open(tryon_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Eliminar literal 'style={{ backgroundColor: secondaryColor }}' o ', backgroundColor: secondaryColor' 
    # De los divs contenedores layout
    # Para ser más amplios, podemos usar regex
    content = re.sub(r'style=\{\{\s*backgroundColor:\s*secondaryColor\s*\}\}', '', content)
    # Por si acaso estuviera interpolado o junto con otra cosa, solo borramos esa coincidencia exacta que añadí
    # En mis llamadas replace usé exactamente: `style={{ backgroundColor: secondaryColor }}`
    
    with open(tryon_path, 'w', encoding='utf-8') as f:
        f.write(content)

# 2. Corregir la pestaña en TemplateEditorial
if os.path.exists(editorial_path):
    with open(editorial_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    target = """                <div className="px-6 py-4 bg-white text-gray-900 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> Probador IA
                  </span>
                  <span className="text-[8px] text-gray-300 font-black">AI POWERED</span>
                </div>"""
    
    replacement = """                <div className="px-6 py-4 text-white flex justify-between items-center" style={{ backgroundColor: primary }}>
                  <span className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> Probador IA
                  </span>
                  <span className="text-[8px] font-black opacity-60">AI POWERED</span>
                </div>"""
    
    content = content.replace(target, replacement)
    
    with open(editorial_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Widgets patched")
