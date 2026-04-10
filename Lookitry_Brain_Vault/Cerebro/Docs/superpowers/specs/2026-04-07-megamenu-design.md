# Diseño Mega Menu — LandingNav

**Fecha:** 2026-04-07
**Status:** Pre-aprobación
**Autor:** Sammy + brainstorming

---

## Concepto

**Nombre:** "Clean Cards with Animated Accent"

Mega menu minimalista donde las tarjetas de producto tienen un detalle de accent que aparece en hover — una línea lateral animada. El diseño es limpio, profesional y con personalidad Lookitry.

---

## Estructura Visual

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  PRODUCTOS              EMPRESA              CTA               │
│  ─────────────         ─────────────         ─────────────    │
│                                                               │
│  ┌─────────────────┐   ┌─────────────────┐                    │
│  │ Mini-Landing Pro│   │ Blog            │                    │
│  │                  │   │                  │                    │
│  │ Tu tienda online │   │                  │                    │
│  │ pro sin código.  │   │                  │                    │
│  └─────────────────┘   └─────────────────┘                    │
│                                                               │
│  ┌─────────────────┐   ┌─────────────────┐                    │
│  │ WooCommerce     │   │ Sobre Nosotros  │                    │
│  │                  │   │                  │                    │
│  │ Automatiza tu   │   │                  │                    │
│  │ probador virtual │   │                  │                    │
│  └─────────────────┘   └─────────────────┘                    │
│                                                               │
│  ┌─────────────────┐   ┌─────────────────┐                    │
│  │ API Developer   │   │ Contacto        │                    │
│  │                  │   │                  │                    │
│  │ IA nativa en tu │   │                  │                    │
│  │ propia app      │   │                  │                    │
│  └─────────────────┘   └─────────────────┘                    │
│                                                               │
│                    [ Explorar todo → ]                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Componentes

### 1. Card de Producto

**Estructura:**
- Sin íconos en cajas de color
- Título en bold, descripción en regular
- Línea lateral `#FF5C3A` que aparece desde top en hover (4px width, 100% height)
- Background sutil en hover: `#FF5C3A/5`

**Estados:**
- Default: texto negro/white, sin línea
- Hover: línea accent aparece, título cambia a accent, bg sutil

**Animaciones:**
- Línea: height 0→100% en 200ms ease-out
- Título color: 150ms transition
- Background: 150ms transition

### 2. Card de Empresa (Links)

**Estructura:**
- Texto + flecha a la derecha
- Línea inferior que se expande en hover

**Estados:**
- Default: texto secondary (`#999`)
- Hover: texto accent, línea expande, flecha mueve derecha 4px

**Animaciones:**
- Línea: width 0→100% en 200ms ease-out
- Flecha: translateX 0→4px en 150ms
- Texto color: 150ms transition

### 3. CTA Section

**Estructura:**
- Botón "Explorar todo →" centrado
- Sin recuadro con gradiente
- Solo texto + flecha

**Estados:**
- Default: texto `#999`, sin decoración
- Hover: texto `#FF5C3A`, flecha mueve derecha

**Animaciones:**
- Flecha: translateX 0→6px en 200ms ease-out
- Texto color: 150ms transition

### 4. Header del Mega Menu

**Estructura:**
- "PRODUCTOS" y "EMPRESA" como headers en text-[10px] uppercase tracking-[0.2em] text-[#999]
- Una línea sutil `#black/5` o `#white/5` debajo de cada header

---

## Animaciones de Entrada

**Mega menu abre:**
1. Container fade-in: 150ms
2. Cards stagger: cada card con delay de 50ms (ej: card 1=0ms, card 2=50ms, card 3=100ms...)
3. Cada card: opacity 0→1 + translateY -8px→0 en 200ms ease-out

**Mega menu cierra:**
- Fade-out rápido: 100ms

---

## Personalidad Lookitry

- **Accent:** `#FF5C3A` — usado SOLO en hover interactions
- **Fondos:** Transparente, no gradient boxes
- **Tipografía:** Plus Jakarta Sans para títulos, DM Sans para descripciones
- **Íconos:** Solo lucide-react para UI (chevron, arrow-right)
- **Prohibido:** `#333`–`#555` en textos, emojis en UI

---

## Mobile

- Mantener estructura actual del mobile menu
- Aplicar las mismas animaciones de hover donde aplique
- Cards siguen siendo clean, sin iconos redundantes

---

## Cambios del Código Actual

### Remover:
- Iconos en cajas de color (`bgColor` de productos)
- Columna 3 con gradiente e imagen
- Labels "Productos" y "Empresa" como secciones separadas

### Agregar:
- Línea lateral accent en hover (pseudo-elemento)
- Animaciones stagger en entrada
- CTA con animación de flecha

### Mantener:
- 2 columnas: Productos | Empresa
- Click outside cierra
- Hover abre
- ARIA labels
- Dark mode support

---

## Implementación Sugerida

**Archivo:** `LandingNav.tsx`

**Nuevo estilo de cards:**
```tsx
// Card producto
<div className="relative group p-4 rounded-xl transition-all hover:bg-[#FF5C3A]/5">
  {/* Línea accent lateral */}
  <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#FF5C3A] origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-200 ease-out" />
  
  <h3 className="text-[12px] font-bold text-[#0a0a0a] dark:text-white group-hover:text-[#FF5C3A] transition-colors duration-150">
    {product.title}
  </h3>
  <p className="text-[11px] font-medium text-[#999]">
    {product.desc}
  </p>
</div>
```

**Animación stagger en mega menu:**
```tsx
// Aplicar delay basado en index
className={`animate-in fade-in slide-in-from-top-2 duration-200 ${
  index === 0 ? 'delay-0' : index === 1 ? 'delay-50' : 'delay-100'
}`}
```

---

## Checklist de Calidad

- [ ] Funciona en mobile
- [ ] Dark mode correcto
- [ ] Animaciones suaves (60fps)
- [ ] Accesibilidad: focus states visibles
- [ ] Sin console logs
- [ ] Optional chaining donde aplique
- [ ] Performance: no animaciones en scroll
