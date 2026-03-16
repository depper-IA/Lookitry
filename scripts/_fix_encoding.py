"""
Corrige caracteres corruptos (Latin-1 mal interpretados como UTF-8) en MiniLanding.tsx
"""
import re

path = 'frontend/src/components/mini-landing/MiniLanding.tsx'

with open(path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Mapa de reemplazos: caracter corrupto -> correcto
replacements = {
    '¿Tienes dudas? Escr\ufffdenos': '¿Tienes dudas? Escribenos',
    'Pru\ufffdebalo': 'Pruebalo',
    'Pru\ufffdbalo': 'Pruebalo',
    'Pru\ufffdalo': 'Pruebalo',
    'valoraci\ufffd\ufffdn': 'valoracion',
    'valoraci\ufffd n': 'valoracion',
    'satisfacci\ufffd\ufffdn': 'satisfaccion',
    'satisfacci\ufffd n': 'satisfaccion',
    'Laura, Mar\ufffd\ufffda': 'Laura, Maria',
    'Laura, Mar\ufffd a': 'Laura, Maria',
    'm\ufffd\ufffds': 'mas',
    'm\ufffd s': 'mas',
    'rese\ufffd\ufffds': 'resenas',
    'rese\ufffd s': 'resenas',
    'Colecci\ufffd\ufffdn': 'Coleccion',
    'Colecci\ufffd n': 'Coleccion',
    'prob\ufffd\ufffdrtela': 'probartela',
    'prob\ufffd rtela': 'probartela',
    'Pru\ufffd\ufffdebatelo': 'Pruebatelo',
    'Pru\ufffd ebatelo': 'Pruebatelo',
    'Mi\ufffd\ufffdrcoles': 'Miercoles',
    'Mi\ufffd rcoles': 'Miercoles',
    'S\ufffd\ufffdado': 'Sabado',
    'S\ufffd bado': 'Sabado',
    'Env\ufffd\ufffds nacionales': 'Envios nacionales',
    'Env\ufffd s nacionales': 'Envios nacionales',
    'Env\ufffd\ufffds a todo el pa\ufffd\ufffds': 'Envios a todo el pais',
    'Env\ufffd s a todo el pa\ufffd s': 'Envios a todo el pais',
    'pa\ufffd\ufffds': 'pais',
    'pa\ufffd s': 'pais',
    'atenci\ufffd\ufffdn': 'atencion',
    'atenci\ufffd n': 'atencion',
    'Horario de atenci\ufffd\ufffdn': 'Horario de atencion',
    'P\ufffd\ufffdgina no encontrada': 'Pagina no encontrada',
    'P\ufffd gina no encontrada': 'Pagina no encontrada',
    'Escr\ufffd\ufffdenos': 'Escribenos',
    'Escr\ufffd benos': 'Escribenos',
    '\ufffd Env\ufffd\ufffds nacionales': ' - Envios nacionales',
    '\ufffd Env\ufffd s nacionales': ' - Envios nacionales',
    'Impulsado por Pru\ufffd\ufffdalo AI': 'Impulsado por Pruebalo AI',
    'Impulsado por Pru\ufffd alo AI': 'Impulsado por Pruebalo AI',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Reemplazo generico de cualquier caracter de reemplazo Unicode restante seguido de patron
# Limpiar cualquier \ufffd restante que sea caracter de reemplazo
content = re.sub(r'\ufffd+', '', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Encoding corregido.")

# Verificar que no quedan caracteres corruptos
remaining = [(i+1, line) for i, line in enumerate(content.split('\n')) if '\ufffd' in line]
if remaining:
    print(f"ADVERTENCIA: {len(remaining)} lineas aun tienen caracteres corruptos:")
    for ln, line in remaining[:10]:
        print(f"  L{ln}: {line[:100]}")
else:
    print("OK: No quedan caracteres corruptos.")
