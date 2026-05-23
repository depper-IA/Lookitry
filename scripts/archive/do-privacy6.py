with open('frontend/src/app/politicas-privacidad/page.tsx', 'rb') as f:
    content = f.read()

# File stores template literals with actual \n as 2-byte escape (backslash + n)
# The repr shows \\n which means Python sees a single \n char
# But hex shows 5c 6e = that's literal \ + n bytes

# Pattern 1: retention section - add 48h entry
# Bytes: "minutos).\n\xe2\x80\x94 Datos de cuenta activa"
old1 = b'minutos).\\n\xe2\x80\x94 Datos de cuenta activa'
new1 = b'minutos).\\n\xe2\x80\x94 Im\xc3\xa1genes generadas (resultados try-on): 48 horas; contenido sint\xc3\xa9tico de IA, no sujetas a restricciones de datos biom\xc3\xa9tricos.\\n\xe2\x80\x94 Datos de cuenta activa'

if old1 in content:
    content = content.replace(old1, new1, 1)
    print('1. Added 48h generated images retention')
else:
    print('1. NOT FOUND - showing hex')
    idx = content.find(b'minutos)')
    if idx >= 0:
        print(content[idx:idx+80].hex())

# Pattern 2: section 2 - add generated images clarification
# Bytes: "inteligencia artificial.\n\nDatos de navegaci"
old2 = b'inteligencia artificial.\\n\\nDatos de navegaci\xc3\xb3n (todos los usuarios):'
new2 = b'inteligencia artificial.\\n\xe2\x80\x94 Las im\xc3\xa1genes generadas por el probador virtual (resultados try-on) son contenido sint\xc3\xa9tico creado por IA y NO son datos biom\xc3\xa9tricos; retenci\xc3\xb3n de 48 horas.\\n\\nDatos de navegaci\xc3\xb3n (todos los usuarios):'

if old2 in content:
    content = content.replace(old2, new2, 1)
    print('2. Added generated images clarification')
else:
    print('2. NOT FOUND - showing hex')
    idx = content.find(b'inteligencia artificial')
    if idx >= 0:
        print(content[idx:idx+80].hex())

with open('frontend/src/app/politicas-privacidad/page.tsx', 'wb') as f:
    f.write(content)

print('Done')