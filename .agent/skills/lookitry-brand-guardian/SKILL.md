# Lookitry Brand Guardian — Guía Maestral de Branding y Diseño

Manual definitivo para asegurar que Lookitry se mantenga como una plataforma SaaS premium, equilibrando la estética de impacto del sitio público con la funcionalidad del dashboard.

## 1. Identidad Visual por Contextos

### A. Sitio Público y Notificaciones (Premium Dark)
Estilo de alto impacto diseñado para convertir y transmitir exclusividad.
- **Fondo:** `#030303` (Negro total).
- **Acento Primario:** `#FF5C3A` (Naranja vibrante).
- **Capa Superpuesta:** Glassmorphism (Fondo `#141414` con backdrop-blur y borde sutil `#2a2a2a`).
- **Estados de Alerta:** Uso del componente `Alert.tsx` con fondo negro y bordes de estado (Error: `#5a1a1a`, Success: `#1a5a1a`).
- **Logo:** `Look` en Blanco (`text-white`), `itry` en Naranja (`text-[#FF5C3A]`).

### B. Dashboard de Comercio (Pro Identity)
Estilo funcional, limpio y equilibrado para gestión diaria.
- **Negro Base:** `#0a0a0a` (Fondo principal).
- **Negro Card:** `#141414` (Tarjetas y paneles).
- **Crema/Beige:** `#f5f2ee` (Secciones alternativas claras para contraste).
- **Contenedores:** `rounded-3xl` para paneles principales.
- **Sombras:** `shadow-xl shadow-black/5`.

## 2. Tipografía y Micro-Interacciones
- **Títulos:** `Jakarta Plus Sans` (`font-jakarta`). Peso: 600-800. **NUNCA usar cursivas (italic) en títulos.**
- **Cuerpo:** `Instrument Sans` o sistema predeterminado para legibilidad.
- **CTAs:** Botones con `rounded-xl`, padding generoso, y efecto hover con elevación sutil.
- **Case:** Title Case (solo la primera letra en mayúscula) para descripciones. Evitar el uso excesivo de uppercase fuera de títulos pequeños.

## 3. Nomenclatura Oficial (Source of Truth)
- **Marca:** Siempre `Look<span className="text-[#FF5C3A]">itry</span>`.
- **Acciones:**
  - **"Integración"** en lugar de "Embebido".
  - **"Identidad"** en lugar de "Branding" o "Información" de marca.
  - **"Vista Previa"** en lugar de "Preview".

## 4. Estructura de Componentes
- **Cards:** Seguir la estructura de `Card` con bordes redondeados y padding `p-8` (escritorio) / `p-5` (móvil).
- **Inputs:** Bordes `#2a2a2a`, fondo `var(--bg-base)`, focus con anillo naranja `#FF5C3A/40`.
