#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Patch templates para usar preview mode con banner y rebloqueo por scroll."""

FILE = 'frontend/src/components/mini-landing/MiniLanding.tsx'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Actualizar BrandData interface para incluir campos del modal ──
OLD_INTERFACE = (
    '  has_landing_page?: boolean;\n'
    '  city_display?: string | null;\n'
)
NEW_INTERFACE = (
    '  has_landing_page?: boolean;\n'
    '  modal_title?: string | null;\n'
    '  modal_description?: string | null;\n'
    '  modal_features?: string[] | null;\n'
    '  city_display?: string | null;\n'
)
if OLD_INTERFACE in content:
    content = content.replace(OLD_INTERFACE, NEW_INTERFACE)
    print('Interface BrandData actualizada OK')
else:
    print('WARN: Interface no encontrada')

# ── 2. Reemplazar TemplateClassic para usar preview state ──
OLD_CLASSIC = (
    'function TemplateClassic({ brandSlug, brand, products }: { brandSlug: string; brand: BrandData; products: ProductData[] }) {\n'
    '  const primary = brand.primary_color || \'#FF5C3A\';\n'
    '  const scrollToTryOn = () => document.getElementById(\'tryon-section\')?.scrollIntoView({ behavior: \'smooth\' });\n'
    '  return (\n'
    '    <div className="min-h-screen bg-white flex flex-col">\n'
    '      {!brand.has_landing_page && <ActivationModal primaryColor={primary} />}\n'
    '      <ClassicHero brand={brand} onScrollDown={scrollToTryOn} />\n'
    '      <ClassicHowItWorks primaryColor={primary} />\n'
    '      <ClassicProducts products={products} primaryColor={primary} ctaText={brand.cta_button_text} onProductClick={scrollToTryOn} />\n'
    '      <ClassicTryOn brandSlug={brandSlug} primaryColor={primary} />\n'
    '      <ClassicSocial brand={brand} />\n'
    '      <ClassicContact brand={brand} primaryColor={primary} />\n'
    '      <LandingFooter primaryColor={primary} />\n'
    '      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}\n'
    '    </div>\n'
    '  );\n'
    '}'
)
NEW_CLASSIC = (
    'function TemplateClassic({ brandSlug, brand, products }: { brandSlug: string; brand: BrandData; products: ProductData[] }) {\n'
    '  const primary = brand.primary_color || \'#FF5C3A\';\n'
    '  const scrollToTryOn = () => document.getElementById(\'tryon-section\')?.scrollIntoView({ behavior: \'smooth\' });\n'
    '  const [previewMode, setPreviewMode] = useState(false);\n'
    '  const showModal = !brand.has_landing_page && !previewMode;\n'
    '\n'
    '  // Rebloqueo al llegar al final del scroll\n'
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
    '    <div className="min-h-screen bg-white flex flex-col">\n'
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
    '        <ClassicHero brand={brand} onScrollDown={scrollToTryOn} />\n'
    '        <ClassicHowItWorks primaryColor={primary} />\n'
    '        <ClassicProducts products={products} primaryColor={primary} ctaText={brand.cta_button_text} onProductClick={scrollToTryOn} />\n'
    '        <ClassicTryOn brandSlug={brandSlug} primaryColor={primary} />\n'
    '        <ClassicSocial brand={brand} />\n'
    '        <ClassicContact brand={brand} primaryColor={primary} />\n'
    '        <LandingFooter primaryColor={primary} />\n'
    '      </div>\n'
    '      {brand.whatsapp_contact && <WhatsAppFAB phone={brand.whatsapp_contact} message={brand.whatsapp_message} />}\n'
    '    </div>\n'
    '  );\n'
    '}'
)
if OLD_CLASSIC in content:
    content = content.replace(OLD_CLASSIC, NEW_CLASSIC)
    print('TemplateClassic actualizado OK')
else:
    print('ERROR: TemplateClassic no encontrado')
    idx = content.find('function TemplateClassic')
    print(f'Posicion: {idx}')

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)
print('Guardado parcial OK')
