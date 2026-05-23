with open('frontend/src/app/politicas-privacidad/page.tsx', 'rb') as f:
    content = f.read()

# Exact bytes for section 7 retention section
old1 = (
    b'eliminaci\xc3\xb3n autom\xc3\xa1tica inmediata tras la generaci\xc3\xb3n del resultado (minutos).\n'
    b'\xe2\x80\x94 Datos de cuenta activa: mientras la cuenta permanezca activa.\n'
    b'\xe2\x80\x94 Datos de cuenta cancelada: 90 d\xc3\xadas calendario'
)

new1 = (
    b'eliminaci\xc3\xb3n autom\xc3\xa1tica inmediata tras la generaci\xc3\xb3n del resultado (minutos).\n'
    b'\xe2\x80\x94 Im\xc3\xa1genes generadas (resultados try-on): 48 horas; contenido sint\xc3\xa9tico de IA, no sujetas a restricciones de datos biom\xc3\xa9tricos.\n'
    b'\xe2\x80\x94 Datos de cuenta activa: mientras la cuenta permanezca activa.\n'
    b'\xe2\x80\x94 Datos de cuenta cancelada: 90 d\xc3\xadas calendario'
)

if old1 in content:
    content = content.replace(old1, new1, 1)
    print('1. Added 48h generated images retention')
else:
    print('1. NOT FOUND')

# Add clarification about generated images in section 2 (Type B)
# After "NO se utilizan para entrenar modelos de inteligencia artificial."
old2 = (
    b'NO se utilizan para entrenar modelos de inteligencia artificial.\n'
    b'\n'
    b'\n'
    b'Datos de navegaci\xc3\xb3n (todos los usuarios):'
)

new2 = (
    b'NO se utilizan para entrenar modelos de inteligencia artificial.\n'
    b'\xe2\x80\x94 Las im\xc3\xa1genes generadas por el probador virtual (resultados try-on) son contenido sint\xc3\xa9tico creado por IA y NO son datos biom\xc3\xa9tricos; se retienen 48 horas para uso operativo de la marca.\n'
    b'\n'
    b'\n'
    b'Datos de navegaci\xc3\xb3n (todos los usuarios):'
)

if old2 in content:
    content = content.replace(old2, new2, 1)
    print('2. Added generated images clarification')
else:
    print('2. NOT FOUND')

with open('frontend/src/app/politicas-privacidad/page.tsx', 'wb') as f:
    f.write(content)

print('Done')