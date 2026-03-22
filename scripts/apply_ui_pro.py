import os
import re

p = r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\tryon\TryOnWidget.tsx"

if os.path.exists(p):
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()

    # --- 1. Top-Bar (Minimal) ---
    c = c.replace(
        '<div className="font-sans" >',
        '<div className="font-sans transition-colors duration-500" style={{ backgroundColor: secondaryColor }}>'
    )
    # Products grid hover animation in minimal (which uses FriendlyProductSelector usually? Wait, Minimal uses FriendlyProductSelector!)
    # Actually, in Minimal, selectedProduct button:
    c = c.replace(
        'shadow-xl hover:opacity-90 active:scale-95 transition-all text-sm md:text-base',
        'shadow-[0_8px_20px_rgb(0,0,0,0.1)] hover:shadow-[0_12px_25px_rgb(0,0,0,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-sm md:text-base'
    )

    # --- 2. Sidebar (Modern) ---
    # Sidebar container
    c = c.replace(
        'className="w-56 flex-shrink-0 flex flex-col" style={{ backgroundColor: primaryColor }}',
        'className="w-56 flex-shrink-0 flex flex-col relative z-10 border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.05)] transition-colors duration-500" style={{ backgroundColor: primaryColor }}'
    )
    # Sidebar product button
    c = c.replace(
        "className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${selectedProduct?.id === p.id ? 'bg-white/25 ring-1 ring-white/50' : 'bg-white/10 hover:bg-white/20'}`}",
        "className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left cursor-pointer transition-all duration-300 ${selectedProduct?.id === p.id ? 'bg-white/20 shadow-inner translate-x-1' : 'bg-white/5 hover:bg-white/15'}`}"
    )
    # Generate button in sidebar
    c = c.replace(
        'shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center',
        'shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center'
    )
    # Main area top bar in sidebar
    c = c.replace(
        'className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between"',
        'className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10"'
    )
    # Empty select state in sidebar
    c = c.replace(
        'mt-4 p-5 bg-white rounded-2xl border-2 border-dashed border-gray-200',
        'mt-4 p-8 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-200 transition-all duration-300 hover:border-gray-300'
    )

    # --- 3. Centered (Bold) ---
    # Hero header
    c = c.replace(
        'className="py-7 px-4 flex flex-col items-center gap-2 text-center" style={{ backgroundColor: primaryColor }}',
        'className="py-10 px-4 flex flex-col items-center gap-3 text-center shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative z-10 rounded-b-3xl transition-colors duration-500" style={{ backgroundColor: primaryColor }}'
    )
    # Products grid in centered
    c = c.replace(
        "className={`rounded-2xl overflow-hidden border-2 transition-all text-left bg-white ${sel ? 'shadow-lg scale-[1.03]' : 'border-gray-200 hover:border-gray-300'}`}",
        "className={`rounded-3xl overflow-hidden border-2 transition-all duration-300 ease-out cursor-pointer bg-white ${sel ? 'shadow-[0_8px_30px_rgba(0,0,0,0.12)] scale-[1.03] ring-4 ring-white/50' : 'border-transparent shadow-sm hover:shadow-lg hover:-translate-y-1'}`}"
    )
    # empty state centered
    c = c.replace(
        'className="p-5 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center"',
        'className="p-8 bg-white/60 backdrop-blur-md rounded-3xl border-2 border-dashed border-gray-200 text-center hover:border-gray-300 transition-all duration-300"'
    )

    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)
    print("UI Pro Max Applied")
else:
    print("File not found")
