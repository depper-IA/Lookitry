import os

paths = {
    'classic': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateClassic.tsx",
    'modern': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateModerno.tsx",
    'editorial': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateEditorial.tsx",
}

def read_file(p):
    with open(p, 'r', encoding='utf-8') as f: return f.read()
def write_file(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

# 1. TemplateClassic
if os.path.exists(paths['classic']):
    c = read_file(paths['classic'])
    # Boton Ver Productos al color principal
    c = c.replace(
        'className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">Ver Productos</button>',
        'className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all" style={{ backgroundColor: primaryColor }}>Ver Productos</button>'
    )
    # Catálogo Curado
    c = c.replace(
        '<p className="text-[9px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: primaryColor }}>Catálogo Curado</p>',
        '<p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--secondary)] mb-3">Catálogo Curado</p>'
    )
    write_file(paths['classic'], c)

# 2. TemplateModerno
if os.path.exists(paths['modern']):
    c = read_file(paths['modern'])
    # Catálogo Curado
    c = c.replace(
        '<p className="text-[9px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: primaryColor }}>Catálogo Curado</p>',
        '<p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--secondary)] mb-3">Catálogo Curado</p>'
    )
    # Encuéntranos
    c = c.replace(
        '<span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Encuéntranos</span>',
        '<span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--secondary)]">Encuéntranos</span>'
    )
    # Horarios (modern)
    c = c.replace(
        '<span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Horarios</span>',
        '<span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--secondary)]">Horarios</span>'
    )
    write_file(paths['modern'], c)

# 3. TemplateEditorial
if os.path.exists(paths['editorial']):
    c = read_file(paths['editorial'])
    # Ubicación
    c = c.replace(
        '<h4 className="text-[9px] md:text-xs font-black uppercase tracking-[0.3em] text-gray-400">Ubicación</h4>',
        '<h4 className="text-[9px] md:text-xs font-black uppercase tracking-[0.3em] text-[var(--secondary)]">Ubicación</h4>'
    )
    # Disponibilidad
    c = c.replace(
        '<h4 className="text-[9px] md:text-xs font-black uppercase tracking-[0.3em] text-gray-400">Disponibilidad</h4>',
        '<h4 className="text-[9px] md:text-xs font-black uppercase tracking-[0.3em] text-[var(--secondary)]">Disponibilidad</h4>'
    )
    # Nuestra Historia -> No secondary (text-gray-400)
    c = c.replace(
        '<span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-[var(--secondary)]">Nuestra Historia</span>',
        '<span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Nuestra Historia</span>'
    )
    # Slogan -> text-gray-300 instead of var(--secondary)
    c = c.replace(
        '<p className="text-[var(--secondary)] text-[10px] md:text-sm font-black uppercase tracking-[0.4em] mt-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">',
        '<p className="text-gray-300 text-[10px] md:text-sm font-black uppercase tracking-[0.4em] mt-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">'
    )
    write_file(paths['editorial'], c)

print("Done")
