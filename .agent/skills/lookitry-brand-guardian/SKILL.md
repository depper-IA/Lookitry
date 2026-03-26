name: lookitry-brand-guardian
description: Manual de identidad visual y equilibrio empresarial para Lookitry. Garantiza el uso correcto de tipografías, colores, terminología y jerarquía visual en todos los dashboards.

# Lookitry Brand Guardian Skill

Esta skill actúa como el filtro de calidad definitivo para asegurar que Lookitry se mantenga como una plataforma SaaS premium.

## 1. Identidad Visual (Design Tokens)

### Tipografía
- **Títulos y Marca:** `Plus Jakarta Sans` (`font-jakarta`). Peso: 600-800. **NUNCA usar cursivas (italic) en títulos.**
- **Cuerpo y UI:** `DM Sans` (`font-dm-sans`). Peso: 300-500.
- **Formato de Texto:** Usar siempre *Sentence case* (solo la primera letra en mayúscula) para descripciones y labels. Evitar el uso excesivo de `uppercase`.

### Colores de Marca
- **Naranja Lookitry:** `#FF5C3A` (Accent, CTAs, Ítem activo).
- **Negro Base:** `#0a0a0a` (Fondo principal).
- **Negro Card:** `#141414` (Tarjetas y paneles).
- **Crema/Beige:** `#f5f2ee` (Secciones alternativas claras).
- **Estados:** Info (`#3b82f6`), Warning (`#f59e0b`), Error (`#ef4444`), Success (`#10b981`).

### Componentes de UI
- **Bordes:** `rounded-3xl` para contenedores principales, `rounded-xl` para inputs y botones.
- **Padding:** `p-8` en escritorio, `p-5` en móviles.
- **Sombras:** `shadow-xl shadow-black/5` para un efecto sutil pero profundo.

## 2. Nomenclatura Oficial (Source of Truth)

### Escritura del Nombre
- Siempre: `Look<span className="text-[#FF5C3A]">itry</span>`.
- Prohibido: "LOOKITRY", "Mostrador", "Virtual Try On".

### Widget Templates (Probador)
1. **Minimal Canvas** (`id: bare`) - Sin distracciones.
2. **Top Stream** (`id: minimal`) - Navegación superior.
3. **Side Panel** (`id: modern`) - Layout vertical.
4. **Hero Impact** (`id: bold`) - Foco total.

### Landing Templates (Mini-página)
1. **Classic**
2. **Editorial**
3. **Probador**
4. **Moderno**

## 3. Terminología Empresarial
- Usar **"Integración"** o **"Integrado"** en lugar de "Embebido".
- Usar **"Identidad"** en lugar de "Información" para el branding de la marca.
- Usar **"Vista Previa"** en lugar de "Preview".

## 4. Equilibrio Visual
- No saturar la interfaz con colores de acento. El naranja `#FF5C3A` debe ser la joya, no el fondo.
- Mantener espacios en blanco (aire) generosos para que la interfaz se sienta costosa.
