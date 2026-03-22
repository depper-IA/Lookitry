import os
import re

p = r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\tryon\TryOnWidget.tsx"

if os.path.exists(p):
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()

    # Search for how layout is defined. Usually:
    # const layout = config?.brand?.widgetTemplate || config?.brand?.widget_template || 'top-bar';
    # We will search for a line defining `const layout = `
    
    lines = c.split('\n')
    for i, line in enumerate(lines):
        if "const layout =" in line or "const layout=" in line:
            # We change it to:
            # const layout = isEmbed ? 'bare' : (config?.brand?.widgetTemplate || ... );
            # We don't know the exact right side, so let's just replace the line or append to it.
            # But wait! We can just add a new line immediately AFTER:
            # `if (isEmbed) layout = 'bare';`
            pass
            
    # Or simply:
    new_c = re.sub(
        r'(const layout = [^;]+;)',
        r'\g<1>\n  // Force bare layout if embedded to prevent breaking landing page composition\n  const effectiveLayout = isEmbed ? "bare" : layout;',
        c
    )
    
    # And then we need to replace all `if (layout === ` with `if (effectiveLayout === `
    new_c = new_c.replace("layout ===", "effectiveLayout ===")
    new_c = new_c.replace("layout !==", "effectiveLayout !==")
    
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_c)
        
    print("Forced bare mode for embedded")
else:
    print("File not found")
