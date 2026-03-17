#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Patch TemplateEditorial y TemplateProbador para preview mode."""

FILE = 'frontend/src/components/mini-landing/MiniLanding.tsx'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ── TemplateEditorial ──
OLD_EDITORIAL_RETURN = (
    '  return (\n'
    '    <div className="min-h-screen flex flex-col" style={{ backgroundColor: \'#f7f5f2\', color: \'#0a0a0a\' }}>\n'
    '      {!brand.has_landing_page && <ActivationModal primaryColor={primary} />}\n'
    '      <EditorialHeader brand={brand} />\n'
)
NEW_EDITORIAL_RETURN = (
    '  const [previewMode, setPreviewMode] = useState(false);\n'
    '  const showModal = !brand.has_landing_page && !previewMode;\n'
    '\n'
    '  useEffect(() => {\n'
    '    if (!previewMode) return;\n'
    '    const handleScroll = () => {\n'
    '      const scrolled = window.scrollY + window.innerHeight;\n'
    '      const total = document.documentElement.scrollHeight;\n'
    '      if (scrolled >= total - 40) setPreviewMode(false);\n'
    '    };\n'
    '    window.addEventListener(\'scroll\', handleScroll, { passive: true });\n'
    '    return () => window.removeEventListener(\'scroll\', handleScroll);\n'
    '  }, [previewMode]);\n'
    '\n'
    '  return (\n'
    '    <div className="min-h-screen flex flex-col" style={{ backgroundColor: \'#f7f5f2\', color: \'#0a0a0a\' }}>\n'
    '      {showModal && (\n'
    '        <ActivationModal\n'
    '          primaryColor={primary}\n'
    '          brandName={brand.name}\n'
    '          modalTitle={brand.modal_title}\n'
    '          modalDescription={brand.modal_description}\n'
    '          modalFeatures={brand.modal_features}\n'
    '          onPreview={() => setPreviewMode(true)}\n'
    '        />\n'
    '      )}\n'
    '      {previewMode && (\n'
    '        <PreviewBanner primaryColor={primary} onExpired={() => setPreviewMode(false)} />\n'
    '      )}\n'
    '      <div style={previewMode ? { paddingTop: \'40px\' } : {}}>\n'
    '      <EditorialHeader brand={brand} />\n'
)

if OLD_EDITORIAL_RETURN in content:
    content = content.replace(OLD_EDITORIAL_RETURN, NEW_EDITORIAL_RETURN)
    print('TemplateEditorial return actualizado OK')
else:
    print('ERROR: TemplateEditorial return no encontrado')

# Cerrar el div extra en TemplateEditorial (antes de LandingFooter)
OLD_EDITORIAL_CLOSE = (
    '      <LandingFooter primaryColor={primary} />\n'
    '      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}\n'
    '    </div>\n'
    '  );\n'
    '}\n'
    '\n'
    '// ----------------------------------------------------------------------------\n'
    '// TEMPLATE PROBADOR (Single Col)\n'
)
NEW_EDITORIAL_CLOSE = (
    '      <LandingFooter primaryColor={primary} />\n'
    '      </div>\n'
    '      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}\n'
    '    </div>\n'
    '  );\n'
    '}\n'
    '\n'
    '// ----------------------------------------------------------------------------\n'
    '// TEMPLATE PROBADOR (Single Col)\n'
)
if OLD_EDITORIAL_CLOSE in content:
    content = content.replace(OLD_EDITORIAL_CLOSE, NEW_EDITORIAL_CLOSE)
    print('TemplateEditorial close actualizado OK')
else:
    print('ERROR: TemplateEditorial close no encontrado')

# ── TemplateProbador ──
OLD_PROBADOR_RETURN = (
    '      {!brand.has_landing_page && <ActivationModal primaryColor={primary} />}\n'
    '      <ProbadorNav brand={brand} />\n'
)
NEW_PROBADOR_RETURN = (
    '  const [previewMode, setPreviewMode] = useState(false);\n'
    '  const showModal = !brand.has_landing_page && !previewMode;\n'
    '\n'
    '  useEffect(() => {\n'
    '    if (!previewMode) return;\n'
    '    const handleScroll = () => {\n'
    '      const scrolled = window.scrollY + window.innerHeight;\n'
    '      const total = document.documentElement.scrollHeight;\n'
    '      if (scrolled >= total - 40) setPreviewMode(false);\n'
    '    };\n'
    '    window.addEventListener(\'scroll\', handleScroll, { passive: true });\n'
    '    return () => window.removeEventListener(\'scroll\', handleScroll);\n'
    '  }, [previewMode]);\n'
    '\n'
    '      {showModal && (\n'
    '        <ActivationModal\n'
    '          primaryColor={primary}\n'
    '          brandName={brand.name}\n'
    '          modalTitle={brand.modal_title}\n'
    '          modalDescription={brand.modal_description}\n'
    '          modalFeatures={brand.modal_features}\n'
    '          onPreview={() => setPreviewMode(true)}\n'
    '        />\n'
    '      )}\n'
    '      {previewMode && (\n'
    '        <PreviewBanner primaryColor={primary} onExpired={() => setPreviewMode(false)} />\n'
    '      )}\n'
    '      <div style={previewMode ? { paddingTop: \'40px\' } : {}}>\n'
    '      <ProbadorNav brand={brand} />\n'
)
if OLD_PROBADOR_RETURN in content:
    content = content.replace(OLD_PROBADOR_RETURN, NEW_PROBADOR_RETURN)
    print('TemplateProbador return actualizado OK')
else:
    print('ERROR: TemplateProbador return no encontrado')

# Cerrar el div extra en TemplateProbador
OLD_PROBADOR_CLOSE = (
    '      <LandingFooter primaryColor={primary} />\n'
    '      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}\n'
    '    </div>\n'
    '  );\n'
    '}\n'
    '\n'
    '// ----------------------------------------------------------------------------\n'
    '// COMPONENTE PRINCIPAL\n'
)
NEW_PROBADOR_CLOSE = (
    '      <LandingFooter primaryColor={primary} />\n'
    '      </div>\n'
    '      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}\n'
    '    </div>\n'
    '  );\n'
    '}\n'
    '\n'
    '// ----------------------------------------------------------------------------\n'
    '// COMPONENTE PRINCIPAL\n'
)
if OLD_PROBADOR_CLOSE in content:
    content = content.replace(OLD_PROBADOR_CLOSE, NEW_PROBADOR_CLOSE)
    print('TemplateProbador close actualizado OK')
else:
    print('ERROR: TemplateProbador close no encontrado')

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)
print('Archivo guardado')
