import os
import re

fpath = r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\app\dashboard\mi-pagina\components\DesignTab.tsx"

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# REEMPLAZO 1: Identidad Visual
# Queremos quitar la parte de Color Principal y Color Secundario, y agrupar Tipografía y Nombre Header
identidad = """        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="space-y-2">
            <label className={labelStyle}>Color Principal</label>
            <div className="flex items-center gap-3 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-color)]">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent" />
              <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 bg-transparent border-0 text-sm font-mono text-[var(--text-primary)] outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelStyle}>Color Secundario</label>
            <div className="flex items-center gap-3 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-color)]">
              <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent" />
              <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 bg-transparent border-0 text-sm font-mono text-[var(--text-primary)] outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelStyle}>Tipografía del Sitio</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'font-jakarta', name: 'Jakarta', desc: 'SaaS / Moderna', class: 'font-jakarta' },
                { id: 'font-playfair', name: 'Playfair', desc: 'Lujo / Elegante', class: 'font-playfair' },
                { id: 'font-tech', name: 'Tech', desc: 'Código / Geek', class: 'font-tech' },
                { id: 'font-syne', name: 'Syne', desc: 'Artística / Bold', class: 'font-syne' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLandingFont(f.id)}
                  className={`px-4 py-2 rounded-xl border transition-all text-left group border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]`}
                  style={landingFont === f.id ? { borderColor: primaryColor, backgroundColor: `${primaryColor}1a`, color: primaryColor } : {}}
                >
                  <span className={`block text-xs font-bold ${f.class}`}>{f.name}</span>
                  <span className="text-[8px] opacity-60 uppercase font-black tracking-tighter">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label className={labelStyle}>Fondo Sección Probador</label>
            <div className="flex items-center gap-3 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-color)]">
              <input type="color" value={widgetBgColor || '#0a0a0a'} onChange={e => setWidgetBgColor(e.target.value)} className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent" />
              <input type="text" value={widgetBgColor} onChange={e => setWidgetBgColor(e.target.value)} placeholder="#0a0a0a" className="flex-1 bg-transparent border-0 text-sm font-mono text-[var(--text-primary)] outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-4 px-2 pt-6">
            <button 
              onClick={() => setShowBrandName(!showBrandName)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all w-full ${showBrandName ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 text-[var(--text-primary)]' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}
            >
              {showBrandName ? <Eye className="w-4 h-4 text-[#FF5C3A]" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-widest">Nombre en Header</span>
            </button>
          </div>
        </div>"""

identidad_nueva = """        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-color)]">
          <div className="space-y-4">
            <label className={labelStyle}>Tipografía del Sitio</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'font-jakarta', name: 'Jakarta', desc: 'SaaS / Moderna', class: 'font-jakarta' },
                { id: 'font-playfair', name: 'Playfair', desc: 'Lujo / Elegante', class: 'font-playfair' },
                { id: 'font-tech', name: 'Tech', desc: 'Código / Geek', class: 'font-tech' },
                { id: 'font-syne', name: 'Syne', desc: 'Artística / Bold', class: 'font-syne' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLandingFont(f.id)}
                  className={`px-4 py-2 rounded-xl border transition-all text-left group border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]`}
                  style={landingFont === f.id ? { borderColor: primaryColor, backgroundColor: `${primaryColor}1a`, color: primaryColor } : {}}
                >
                  <span className={`block text-xs font-bold ${f.class}`}>{f.name}</span>
                  <span className="text-[8px] opacity-60 uppercase font-black tracking-tighter">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className={labelStyle}>Ajustes de visibilidad</label>
            <button 
              onClick={() => setShowBrandName(!showBrandName)}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all w-full ${showBrandName ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 text-[var(--text-primary)]' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}
            >
              {showBrandName ? <Eye className="w-5 h-5 text-[#FF5C3A]" /> : <EyeOff className="w-5 h-5" />}
              <span className="text-sm font-bold uppercase tracking-widest">Mostrar nombre en Header</span>
            </button>
          </div>
        </div>"""

if identidad in content:
    content = content.replace(identidad, identidad_nueva)

# REEMPLAZO 2: Hero y portada (quitar Color de Respaldo)
hero = """        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className={labelStyle}>Oscurecer Imagen</label>
              <span className="text-[10px] font-bold text-[#FF5C3A]">{Math.round(coverOverlayOpacity * 100)}%</span>
            </div>
            <input 
              type="range" min={0} max={1} step={0.05} 
              value={coverOverlayOpacity} 
              onChange={e => setCoverOverlayOpacity(parseFloat(e.target.value))} 
              className="w-full h-1.5 rounded-full cursor-pointer accent-[#FF5C3A] appearance-none bg-[var(--bg-input)] border border-[var(--border-color)]" 
            />
          </div>
          <div className="space-y-2">
            <label className={labelStyle}>Fondo de Respaldo</label>
            <div className="flex items-center gap-3 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-color)]">
              <input type="color" value={coverBgColor || '#0a0a0a'} onChange={e => setCoverBgColor(e.target.value)} className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent" />
              <input type="text" value={coverBgColor} onChange={e => setCoverBgColor(e.target.value)} placeholder="#0a0a0a" className="flex-1 bg-transparent border-0 text-sm font-mono text-[var(--text-primary)] outline-none" />
            </div>
          </div>
        </div>"""

hero_nuevo = """        <div className="pt-2 border-t border-[var(--border-color)]">
          <div className="space-y-3 pt-4">
            <div className="flex justify-between items-end">
              <label className={labelStyle}>Oscurecer Imagen</label>
              <span className="text-[10px] font-bold text-[#FF5C3A]">{Math.round(coverOverlayOpacity * 100)}%</span>
            </div>
            <input 
              type="range" min={0} max={1} step={0.05} 
              value={coverOverlayOpacity} 
              onChange={e => setCoverOverlayOpacity(parseFloat(e.target.value))} 
              className="w-full h-1.5 rounded-full cursor-pointer accent-[#FF5C3A] appearance-none bg-[var(--bg-input)] border border-[var(--border-color)]" 
            />
          </div>
        </div>"""

if hero in content:
    content = content.replace(hero, hero_nuevo)

# REEMPLAZO 3: Insertar nueva sección de paleta de Colores
# Insertamos justo después de {/* 1. Identidad Visual */}
section_colors = """
      {/* 1.5. Paleta de Colores */}
      <section className={sectionStyle}>
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">Paleta de Colores</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest">Esquema unificado y estética</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
          <div className="space-y-2">
            <label className={labelStyle}>Acnto Primario</label>
            <div className="flex items-center gap-3 bg-[var(--bg-input)] p-1.5 rounded-2xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent flex-shrink-0" />
              <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 min-w-0 bg-transparent border-0 text-xs font-mono font-bold text-[var(--text-primary)] outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelStyle}>Acento Secun...</label>
            <div className="flex items-center gap-3 bg-[var(--bg-input)] p-1.5 rounded-2xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow">
              <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent flex-shrink-0" />
              <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 min-w-0 bg-transparent border-0 text-xs font-mono font-bold text-[var(--text-primary)] outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelStyle}>Fte / Probador</label>
            <div className="flex items-center gap-3 bg-[var(--bg-input)] p-1.5 rounded-2xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow">
              <input type="color" value={widgetBgColor || '#0a0a0a'} onChange={e => setWidgetBgColor(e.target.value)} className="w-8 h-8 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent flex-shrink-0" />
              <input type="text" value={widgetBgColor} onChange={e => setWidgetBgColor(e.target.value)} placeholder="#0a0a0a" className="flex-1 min-w-0 bg-transparent border-0 text-xs font-mono font-bold text-[var(--text-primary)] outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelStyle}>Fte / Respaldo</label>
            <div className="flex items-center gap-3 bg-[var(--bg-input)] p-1.5 rounded-2xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow">
              <input type="color" value={coverBgColor || '#0a0a0a'} onChange={e => setCoverBgColor(e.target.value)} className="w-8 h-8 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent flex-shrink-0" />
              <input type="text" value={coverBgColor} onChange={e => setCoverBgColor(e.target.value)} placeholder="#0a0a0a" className="flex-1 min-w-0 bg-transparent border-0 text-xs font-mono font-bold text-[var(--text-primary)] outline-none" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Hero y Portada */}"""

if "{/* 2. Hero y Portada */}" in content:
    content = content.replace("{/* 2. Hero y Portada */}", section_colors)

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)
