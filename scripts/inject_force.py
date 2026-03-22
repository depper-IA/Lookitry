import os

p = r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\tryon\TryOnWidget.tsx"

with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Provide forceLayout in TryOnWidgetProps
c = c.replace(
    "  initialProductId?: string | null;\n}",
    "  initialProductId?: string | null;\n  forceLayout?: 'top-bar' | 'sidebar' | 'centered' | 'bare';\n}"
)

# 2. Update function signature
c = c.replace(
    "export function TryOnWidget({ brandSlug, isEmbed = false, initialProductId = null }: TryOnWidgetProps) {",
    "export function TryOnWidget({ brandSlug, isEmbed = false, initialProductId = null, forceLayout }: TryOnWidgetProps) {"
)

# 3. Update effectiveLayout calculation
c = c.replace(
    "const effectiveLayout = isEmbed ? 'bare' : selectedLayout;",
    "const effectiveLayout = forceLayout || selectedLayout;"
)

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print("Injected forceLayout to TryOnWidget")
