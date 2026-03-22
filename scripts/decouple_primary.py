import os
import re

paths = {
    'mi_pagina': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\app\dashboard\mi-pagina\page.tsx",
    'classic': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateClassic.tsx",
    'modern': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateModerno.tsx",
    'editorial': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateEditorial.tsx"
}

def read_file(p):
    with open(p, 'r', encoding='utf-8') as f: return f.read()
def write_file(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

# 1. mi-pagina/page.tsx
if os.path.exists(paths['mi_pagina']):
    c = read_file(paths['mi_pagina'])
    
    # Reemplazar la asignación en loadData
    c = c.replace(
        "setPrimaryColor(b.primary_color || '#111111');",
        "setPrimaryColor(b.social_links?._landing_primary || b.primary_color || '#111111');"
    )
    
    # Inject _landing_primary
    c = re.sub(
        r'(_landing_secondary:\s*secondaryColor,)',
        r'\1\n        _landing_primary: primaryColor,',
        c
    )
    
    # Eliminamos el primary_color del payload
    c = re.sub(r'primary_color:\s*primaryColor,', '// primary_color removed from landing payload', c)
    
    write_file(paths['mi_pagina'], c)

# 2. Templates
for tpl in ['classic', 'modern', 'editorial']:
    if os.path.exists(paths[tpl]):
        c = read_file(paths[tpl])
        c = c.replace(
            "const primary = brand.primary_color || '#111111';",
            "const primary = brand.social_links?._landing_primary || brand.primary_color || '#111111';"
        )
        write_file(paths[tpl], c)

print("Decoupling of Primary Color completed")
