import os
import re

paths = {
    'mi_pagina': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\app\dashboard\mi-pagina\page.tsx",
    'classic': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateClassic.tsx",
    'modern': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateModerno.tsx",
    'editorial': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateEditorial.tsx",
    'design_tab': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\app\dashboard\mi-pagina\components\DesignTab.tsx",
    'layout': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\dashboard\DashboardLayout.tsx",
    'tryon': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\tryon\TryOnWidget.tsx"
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
        "setSecondaryColor(b.secondary_color || b.primary_color || '#ffffff');",
        "setSecondaryColor(b.social_links?._landing_secondary || b.primary_color || '#ffffff');"
    )
    
    # Reemplazar la inyección en payload
    # El diccionario social_links se arma antes del payload
    # Buscamos: x: x.trim(), };
    # Y le agregamos _landing_secondary: secondaryColor,
    # Cuidado que puede haber variaciones de whitespace
    c = re.sub(
        r'(x:\s*x\.trim\(\),)(\s*\})',
        r'\1\n        _landing_secondary: secondaryColor,\2',
        c
    )
    
    # Eliminamos el secondary_color del payload
    c = re.sub(r'secondary_color:\s*secondaryColor,', '// secondary_color removed from landing payload', c)
    
    write_file(paths['mi_pagina'], c)

# 2. Templates
for tpl in ['classic', 'modern', 'editorial']:
    if os.path.exists(paths[tpl]):
        c = read_file(paths[tpl])
        # Reemplazar const secondary = (brand as any).secondary_color || primary;
        # Y en moderno: const secondary = (brand as any).secondary_color || primary;
        # En editorial tal vez sea const secondary = (brand as any).secondary_color || primaryColor;
        c = re.sub(
            r'const secondary = \(brand as any\)\.secondary_color \|\| primary(Color)?;',
            r'const secondary = brand.social_links?._landing_secondary || primary\g<1>;',
            c
        )
        write_file(paths[tpl], c)

# 3. DashboardLayout -> Rename tab
if os.path.exists(paths['layout']):
    c = read_file(paths['layout'])
    c = c.replace(
        "{ name: 'Configuración',  href: '/dashboard/settings',     icon: SettingsIcon },",
        "{ name: 'Widget Probador',  href: '/dashboard/settings',     icon: SettingsIcon },"
    )
    write_file(paths['layout'], c)

# 4. TryOnWidget -> Restore styles
if os.path.exists(paths['tryon']):
    c = read_file(paths['tryon'])
    # generating
    c = c.replace(
        '<div className="flex flex-col" >',
        '<div className="flex flex-col" style={{ backgroundColor: secondaryColor }}>'
    )
    c = c.replace(
        '<div className="flex flex-col">',
        '<div className="flex flex-col" style={{ backgroundColor: secondaryColor }}>'
    )
    
    # sidebar
    c = c.replace(
        '<div className={`flex font-sans ${isEmbed ? \'min-h-full\' : \'min-h-screen\'}`} >',
        '<div className={`flex font-sans ${isEmbed ? \'min-h-full\' : \'min-h-screen\'}`} style={{ backgroundColor: secondaryColor }}>'
    )
    c = c.replace(
        '<div className={`flex font-sans ${isEmbed ? \'min-h-full\' : \'min-h-screen\'}`}>',
        '<div className={`flex font-sans ${isEmbed ? \'min-h-full\' : \'min-h-screen\'}`} style={{ backgroundColor: secondaryColor }}>'
    )
    
    # centered (bold)
    c = c.replace(
        '<div className={`flex flex-col font-sans ${isEmbed ? \'min-h-full\' : \'min-h-screen\'}`} >',
        '<div className={`flex flex-col font-sans ${isEmbed ? \'min-h-full\' : \'min-h-screen\'}`} style={{ backgroundColor: secondaryColor }}>'
    )
    c = c.replace(
        '<div className={`flex flex-col font-sans ${isEmbed ? \'min-h-full\' : \'min-h-screen\'}`}>',
        '<div className={`flex flex-col font-sans ${isEmbed ? \'min-h-full\' : \'min-h-screen\'}`} style={{ backgroundColor: secondaryColor }}>'
    )
    write_file(paths['tryon'], c)

print("Decoupling done")
