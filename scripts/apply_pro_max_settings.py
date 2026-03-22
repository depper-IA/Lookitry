import os
import re

p = r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\dashboard\SettingsForm.tsx"

if os.path.exists(p):
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()

    # 1. Update Grid to 12 cols and implement 3-pane layout (Tabs, Form, Preview)
    # The parent container starts at: <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
    c = c.replace(
        '<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">',
        '<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">'
    )

    # 2. Add the vertical Tabs list before the form
    tabs_html = """
      {/* --- Navegación Delineada Premium --- */}
      <div className="lg:col-span-3 border-r border-gray-100 pr-0 lg:pr-6 pb-6 lg:pb-0 overflow-x-auto lg:overflow-visible">
        <nav className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
          {tabs.map(t => {
            const isProLocked = t.id === 'pro' && !isPro;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (isProLocked) { setShowUpgradeModal(true); return; }
                  setActiveTab(t.id);
                }}
                className={`w-full text-left px-5 py-4 rounded-3xl flex items-center gap-3 transition-all duration-300 outline-none ${active ? 'bg-[var(--bg-card)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#FF5C3A]/20 scale-[1.02]' : 'hover:bg-[var(--bg-hover)]' }`}
              >
                <span className={`block text-xs font-black uppercase tracking-widest italic ${active ? 'text-[#FF5C3A]' : 'text-[var(--text-secondary)]'}`}>
                  {isProLocked ? (
                    <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg> Pro</span>
                  ) : t.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
"""

    # Replace the old form container and tabs
    target_form_start = """      {/* Formulario — 3 cols */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="flex gap-1 border p-1 rounded-lg">
              {tabs.map(t => (
                <button key={t.id} type="button"
                  onClick={() => {
                    if (t.id === 'pro' && !isPro) {
                      setShowUpgradeModal(true);
                      return;
                    }
                    setActiveTab(t.id);
                  }}
                  style={activeTab === t.id
                    ? { background: '#FF5C3A', color: '#ffffff' }
                    : { color: 'var(--text-muted)' }}
                  className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === t.id ? 'shadow' : 'hover:opacity-80'}`}>
                  {t.id === 'pro' && !isPro ? (
                    <span className="flex items-center justify-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Pro
                    </span>
                  ) : t.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody>"""

    c = c.replace(target_form_start, tabs_html + """
      {/* Formulario — 5 cols */}
      <div className="lg:col-span-5">
        <section className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
""")

    # Wrap the end of the form area
    c = c.replace(
        """          </CardBody>
        </Card>
      </div>""",
        """        </section>
      </div>"""
    )
    
    # 3. Update Preview to 4 cols and style it rounded
    c = c.replace(
        """      {/* Preview — 2 cols */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>""",
        """      {/* Preview — 4 cols */}
      <div className="lg:col-span-4 space-y-5">
        <section className="p-6 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
          <div className="border-b border-[var(--border-color)] pb-4 mb-4">"""
    )
    
    c = c.replace(
        """          </CardHeader>
          <CardBody>""",
        """          </div>"""
    )
    
    c = c.replace(
        "        </Card>",
        "        </section>"
    )

    # Convert generic layouts to aesthetic layout in Tabs content (e.g. padding and headers)
    # General Tab Start
    c = c.replace(
        "{activeTab === 'general' && (\n                <div className=\"space-y-4\">",
        "{activeTab === 'general' && (\n                <div className=\"space-y-8\">\n                  <div className=\"flex items-center gap-3 border-b border-[var(--border-color)] pb-5\">\n                    <div className=\"w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center\"><svg className=\"w-5 h-5 text-[#FF5C3A]\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z\"/></svg></div>\n                    <div><h3 className=\"text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight\">General</h3><p className=\"text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest\">Datos Básicos</p></div>\n                  </div>"
    )

    # Appearance Tab Start
    c = c.replace(
        "{activeTab === 'appearance' && (\n                <div className=\"space-y-5\">",
        "{activeTab === 'appearance' && (\n                <div className=\"space-y-8\">\n                  <div className=\"flex items-center gap-3 border-b border-[var(--border-color)] pb-5\">\n                    <div className=\"w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center\"><svg className=\"w-5 h-5 text-[#FF5C3A]\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" d=\"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01\"/></svg></div>\n                    <div><h3 className=\"text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight\">Paleta Visual</h3><p className=\"text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest\">Esquema unificado</p></div>\n                  </div>"
    )
    
    # Pro Tab Start
    c = c.replace(
        "{activeTab === 'pro' && (\n                <div className=\"space-y-4\">",
        "{activeTab === 'pro' && (\n                <div className=\"space-y-8\">\n                  <div className=\"flex items-center gap-3 border-b border-[var(--border-color)] pb-5\">\n                    <div className=\"w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center\"><svg className=\"w-5 h-5 text-[#FF5C3A]\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z\"/></svg></div>\n                    <div><h3 className=\"text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight\">Opciones Pro</h3><p className=\"text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest\">Exclusivo Widget</p></div>\n                  </div>"
    )

    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)
        
    print("Re-structured Settings Form")
else:
    print("File missing:", p)
