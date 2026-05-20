# Design Spec: Try-On Upload Screen + Generation Loader UX

**Fecha:** 2026-05-20
**Alcance:** `SelfieUploader.tsx` + `GenerationLoader.tsx` — todas las plantillas
**Referencia:** Google Shopping Virtual Try-On (upload screen + loader minimalista)
**Idioma UI:** Español neutro (tuteo). Sin voseo. Sin emojis.

---

## Contexto

El widget actual tiene dos problemas de UX:

1. **Upload screen**: dos botones (camara/galeria) fragmentan la decision. Los tips estan enfocados en cara ("Foto frontal", "Cara visible") — incorrecto para try-on de ropa completa. Sin guia visual de pose.
2. **Loader**: demasiado ruido visual (barra de progreso falsa, porcentaje, 6 mensajes rotativos, badge "IA LOOKITRY ACTIVE", doble anillo). Genera ansiedad, no confianza.

---

## Cambios

### 1. `SelfieUploader.tsx`

**Layout (top to bottom):**

```
[ chips row ]
[ imagen guia / preview de selfie ]
[ boton primario: Subir foto ]
[ link secundario: Tomar foto con camara ]  <- solo si hasCamera
[ disclaimer legal ]
```

**Chips row:**
- 4 chips pill: "Cuerpo completo", "Buena iluminacion", "Solo tu", "Sin manos en los bolsillos"
- `flex flex-wrap gap-2 justify-center`
- Cada chip: `rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide`
- Background: `rgba(255,255,255,0.08)`, border: `1px solid rgba(255,255,255,0.12)`
- Checkmark SVG inline coloreado con `primaryColor`

**Imagen guia:**
- Asset: `/public/rebecca_probador.png` (ya existe, sin costo extra)
- `max-h-[60vh] object-contain mx-auto` — cuerpo completo visible
- Cuando `currentPreview` existe: reemplaza la imagen guia con la foto del usuario
- Comportamiento de preview (hover/reset button): sin cambios vs actual

**Boton primario:**
- Texto: "Subir foto"
- Full-width, dispara `inputRef` (galeria)
- Sin icono

**Link secundario (camara):**
- Solo renderiza si `showCamera === true`
- Texto: "Tomar foto con camara"
- Link de texto bajo el boton primario, sin boton separado

**Disclaimer legal (al fondo):**
- Texto: "Solo sube una foto tuya. Aplican nuestra [Politica de Uso] y [Politica de Privacidad]. Las imagenes generadas por IA pueden incluir errores."
- `Politica de Uso` → `/politica-de-uso` (target blank, noopener)
- `Politica de Privacidad` → `/politicas-privacidad` (target blank, noopener)
- `text-[9px] text-center opacity-50`

**Lo que NO cambia:**
- Logica de drag & drop (misma, solo UI del drop overlay)
- `ImageEditor` flow
- Validacion y compresion de imagen
- `compressing` state y su UI de Loader2

---

### 2. `GenerationLoader.tsx`

**Layout:**

```
[ orb gradiente animado ]
[ mensaje rotativo ]
[ separador sutil ]
[ disclaimer estatico ]
```

**Orb — animacion CSS puro (GPU):**
```css
@keyframes orb-breathe {
  0%, 100% { transform: scale(1);    opacity: 0.85; }
  50%       { transform: scale(1.1); opacity: 1;    }
}
@keyframes orb-glow {
  0%, 100% { box-shadow: 0 0 24px 6px {primaryColor}40; }
  50%       { box-shadow: 0 0 48px 18px {primaryColor}65; }
}
```
- Tamaño: `w-20 h-20`, `border-radius: 50%`
- Background: `linear-gradient(135deg, primaryColor, primaryColor + "90")`
- Ambas animaciones: `2.5s ease-in-out infinite`
- Sin icono dentro del orb

**Mensajes rotativos:**
```ts
const DEFAULT_MESSAGES = [
  'Creando tu look...',
  'Aplicando la prenda...',
  'Casi listo...',
];
```
- Intervalo: 3500ms (sin cambios)
- Fade via `AnimatePresence` existente

**Disclaimer estatico:**
- Texto: "Las imagenes generadas por IA pueden incluir errores. El ajuste y apariencia no seran exactos."
- `text-[9px] text-center opacity-40`

**Estado eliminado:**
- `progress`, `prevMsgIndex` — removidos
- `setProgress` interval — removido
- Badge "IA LOOKITRY ACTIVE" — removido
- Doble anillo CSS — removido

**Props interface sin cambios:** `productName`, `primaryColor`, `messages`, `textColor`, `mutedColor`

---

## Alcance de templates

Ambos componentes son compartidos. El cambio impacta automaticamente:
- `TemplateBare`
- `TemplateLandingEmbed`
- `TemplateShowcase`
- `TemplateModernSidebar`
- `TemplateBoldProStudio`

Sin cambios en logica de `TryOnWidget.tsx` ni en ningun template.

---

## Fuera de alcance

- Logica de generacion, polling, cache
- `ImageEditor.tsx`
- `LegalDisclaimerModal.tsx`
- Templates individuales
- Backend / API routes
