import os

p = r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\tryon\TryOnWidget.tsx"

with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update Sidebar Layout to be more premium
c = c.replace(
    'className={`flex font-sans ${isEmbed ? \'min-h-full\' : \'min-h-screen\'}`} style={{ backgroundColor: secondaryColor }}',
    'className={`flex font-sans min-h-screen transition-all duration-700`} style={{ backgroundColor: secondaryColor }}'
)

# 2. Update Sidebar (Modern) styling
c = c.replace(
    'className="w-56 flex-shrink-0 flex flex-col relative z-10 border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.05)] transition-colors duration-500" style={{ backgroundColor: primaryColor }}',
    'className="w-64 flex-shrink-0 flex flex-col relative z-20 border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.1)] backdrop-blur-3xl transition-all duration-700" style={{ backgroundColor: `${primaryColor}CC` }}'
)

# 3. Update Centered (Bold) styling - Hero section
c = c.replace(
    'className="py-10 px-4 flex flex-col items-center gap-3 text-center shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative z-10 rounded-b-3xl transition-colors duration-500" style={{ backgroundColor: primaryColor }}',
    'className="py-16 px-6 flex flex-col items-center gap-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative z-20 rounded-b-[4rem] transition-all duration-700 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}DD)` }}'
)

# 4. Update Bare Layout styling
c = c.replace(
    'className={`flex flex-col font-sans ${isEmbed ? \'min-h-full\' : \'min-h-screen\'}`} style={{ backgroundColor: secondaryColor }}',
    'className={`flex flex-col font-sans min-h-screen transition-all duration-700`} style={{ backgroundColor: secondaryColor }}'
)

# 5. Fix the background issue on the main div of TOP-BAR layout
c = c.replace(
    'className="font-sans transition-colors duration-500" style={{ backgroundColor: secondaryColor }}',
    'className="font-sans min-h-screen transition-colors duration-500" style={{ backgroundColor: secondaryColor }}'
)

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print("Applied Premium UI/UX and fixed background space")
