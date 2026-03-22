import os
import re

DIR = r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\mini-landing"
FILES = ["TemplateClassic.tsx", "TemplateEditorial.tsx", "TemplateModerno.tsx", "shared.tsx"]

def patch():
    for fname in FILES:
        fpath = os.path.join(DIR, fname)
        if not os.path.exists(fpath): continue
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract 'secondary' variable from brand
        content = content.replace("const primary = brand.primary_color || '#FF5C3A';", "const primary = brand.primary_color || '#111111';\n  const secondary = (brand as any).secondary_color || primary;")

        # Inject CSS vars in root div for Templates
        if "Template" in fname:
            # We add a style tag or inline style to root div
            content = re.sub(
                r'(<div className={`min-h-[^`]+`)( {0,1}style={{\s*backgroundColor.*?}})?',
                r'\1 style={{ backgroundColor: brand.widget_bg_color || "#fcfcfc", "--primary": primary, "--secondary": secondary, "--secondary-10": secondary + "1a", "--secondary-20": secondary + "33", "--secondary-05": secondary + "0d" } as React.CSSProperties}',
                content,
                count=1
            )

        # Replace Tailwind classes
        content = content.replace("text-[#FF5C3A]", "text-[var(--secondary)]")
        content = content.replace("bg-[#FF5C3A]/10", "bg-[var(--secondary-10)]")
        content = content.replace("bg-[#FF5C3A]/5", "bg-[var(--secondary-05)]")
        content = content.replace("bg-[#FF5C3A]", "bg-[var(--secondary)]")
        content = content.replace("border-[#FF5C3A]/20", "border-[var(--secondary-20)]")
        content = content.replace("border-[#FF5C3A]", "border-[var(--secondary)]")
        content = content.replace("shadow-[#FF5C3A]/20", "shadow-[var(--secondary-20)]")
        content = content.replace("shadow-[#FF5C3A]/10", "shadow-[var(--secondary-10)]")
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)

patch()
