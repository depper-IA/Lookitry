import os

paths = {
    'classic': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateClassic.tsx",
    'modern': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateModerno.tsx",
    'editorial': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\TemplateEditorial.tsx",
    'mini': r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing\MiniLanding.tsx"
}

def read_file(p):
    with open(p, 'r', encoding='utf-8') as f: return f.read()
def write_file(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

# 1. CLASSIC
if os.path.exists(paths['classic']):
    c = read_file(paths['classic'])
    # Boutique Verificada
    c = c.replace('· Boutique Verificada', '')
    # Powered By Lookitry AI color
    if 'className="text-gray-900 hover:text-black"' in c:
        pass # ya tiene span interior? Vamos a darselo a todo Lookitry
    c = c.replace(
        '<a href={footerUrl || \'https://pruebalo.wilkiedevs.com\'} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-black">Look<span style={{ color: primaryColor }}>itry</span> AI</a>',
        '<a href={footerUrl || \'https://pruebalo.wilkiedevs.com\'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-opacity" style={{ color: primaryColor }}>Lookitry IA</a>'
    )
    # Puede que haya variaciones en ClassicFooter
    c = c.replace(
        '''<a href={footerUrl || 'https://pruebalo.wilkiedevs.com'} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-black">Look<span className="text-[#FF5C3A]">itry</span> AI</a>''',
        '''<a href={footerUrl || 'https://pruebalo.wilkiedevs.com'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-opacity" style={{ color: primaryColor }}>Lookitry IA</a>'''
    )
    write_file(paths['classic'], c)

# 2. MODERNO
if os.path.exists(paths['modern']):
    c = read_file(paths['modern'])
    # Header glass
    target_header = """    <nav className="sticky top-0 z-50 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 backdrop-blur-3xl gap-4" 
      style={{ 
        backgroundColor: brand.header_color ? `${brand.header_color}66` : 'rgba(15,15,15,0.4)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>"""
    replacement_header = """    <nav className="sticky top-0 z-50 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 gap-4 shadow-xl" 
      style={{ 
        backgroundColor: brand.header_color || '#000000', 
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>"""
    c = c.replace(target_header, replacement_header)
    
    # Boutique Verificada
    c = c.replace('· Boutique Verificada', '')
    
    # Footer Lookitry Link
    # Necesitamos capturar 'Desarrollado por ... Lookitry ...'
    # Como no estoy 100% seguro del snippet, buscaré y reemplazaré manualmente
    c = c.replace('Desarrollado por Lookitry AI', 'Powered by Lookitry IA')
    c = c.replace(
        '<a href={footerUrl || \'https://pruebalo.wilkiedevs.com\'} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">',
        '<a href={footerUrl || \'https://pruebalo.wilkiedevs.com\'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-opacity" style={{ color: primaryColor }}>'
    )
    c = c.replace('Look<span className="text-[var(--secondary)]">itry</span> IA', 'Lookitry IA')
    c = c.replace('Look<span className="text-[#FF5C3A]">itry</span> IA', 'Lookitry IA')
    
    write_file(paths['modern'], c)

# 3. EDITORIAL
if os.path.exists(paths['editorial']):
    c = read_file(paths['editorial'])
    # Secciones bg-gray-900 a widget_bg_color
    # Editorial About
    c = c.replace(
        '<div className="p-8 md:p-16 bg-gray-900 rounded-[2.5rem] md:rounded-[4rem] relative overflow-hidden shadow-2xl">',
        '<div className="p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] relative overflow-hidden shadow-2xl" style={{ backgroundColor: brand.widget_bg_color || \'#0a0a0a\' }}>'
    )
    # Iconos en EditorialInfo
    c = c.replace(
        '<div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-xl">',
        '<div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: brand.widget_bg_color || \'#0a0a0a\' }}>'
    )
    
    # Probador IA header
    target_probador_header = """              <div className="rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] bg-white border border-gray-100">
                <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
                  <span className="font-black text-[10px] uppercase tracking-widest text-[var(--secondary)] flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> Probador IA
                  </span>
                  <span className="text-[8px] opacity-40 font-black">AI POWERED</span>
                </div>
                <div style={{ backgroundColor: brand.widget_bg_color || '#ffffff' }}>"""
    replacement_probador_header = """              <div className="rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] bg-white border border-gray-100">
                <div className="px-6 py-4 bg-white text-gray-900 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> Probador IA
                  </span>
                  <span className="text-[8px] text-gray-300 font-black">AI POWERED</span>
                </div>
                <div className="bg-white">"""
    # Fix widget bg color too: "dejalo en blanco predeterminado que no pueda cambiarse"
    c = c.replace(target_probador_header, replacement_probador_header)
    
    # Boutique Verificada
    c = c.replace('· Boutique Verificada', '')
    
    # Footer Lookitry Link
    c = c.replace(
        '<a href={footerUrl || \'https://pruebalo.wilkiedevs.com\'} target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:underline">Look<span className="text-[var(--secondary)]">itry</span> IA</a>',
        '<a href={footerUrl || \'https://pruebalo.wilkiedevs.com\'} target="_blank" rel="noopener noreferrer" className="font-bold hover:opacity-80 transition-opacity" style={{ color: primary }}>Lookitry IA</a>'
    )
    
    write_file(paths['editorial'], c)

print("Done")
