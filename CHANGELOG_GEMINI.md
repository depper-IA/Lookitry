# Registro de Cambios — Lookitry (IA Gemini)

Este archivo documenta las mejoras técnicas, correcciones y tareas pendientes realizadas por la IA para mantener la continuidad del desarrollo.

---

## 21 de Marzo, 2026 — Tipografías Dinámicas y Redes Sociales Pro

### ✅ Cambios Aplicados
1. **Sistema de Tipografías Dinámicas:**
   - **Nuevas Fuentes:** Integradas 4 familias de fuentes profesionales: Jakarta, Inter, Montserrat y Playfair Display.
   - **Selector en Editor:** Añadido un selector visual en la pestaña de Identidad Visual para cambiar la tipografía de toda la mini-landing.
   - **Aplicación en Templates:** Los tres templates (Clásico, Editorial, Moderno) ahora responden dinámicamente a la fuente seleccionada.
2. **Ampliación de Redes Sociales:**
   - **YouTube y X (Twitter):** Añadido soporte completo para estas plataformas en el editor y en todos los templates.
   - **Iconografía Premium:** Creados nuevos componentes de iconos SVG en `shared.tsx` para YouTube y X.
3. **Correcciones de Estabilidad:**
   - **Shared Components:** Limpieza profunda de `shared.tsx`, eliminando duplicados y corrigiendo el error de renderizado de `WhatsAppIcon`.
   - **Sincronización Total:** Verificado que todos los campos de personalización (horarios, reseñas, ubicación) se muestren correctamente en todas las plantillas.
4. **Base de Datos:**
   - Preparado el campo `landing_font` en el backend y creado script de migración para Supabase.

### ⏳ Tareas en Proceso / Pendientes
- **Ejecución SQL:** Pendiente ejecutar `ALTER TABLE brands ADD COLUMN landing_font TEXT DEFAULT 'font-jakarta';` en el panel de Supabase.
- **Pruebas de PayPal:** Verificar el flujo completo de checkout con PayPal en producción.
- **Breadcrumbs en Legales:** Aplicar y verificar físicamente la persistencia de breadcrumbs en `terminos` y `politicas-privacidad`.

---

## 19 de Marzo, 2026

### ✅ Cambios Aplicados
1. **Restauración de Landing Principal:** 
   - Se fusionó el diseño y copy original de `templates-webs/LandingClient.tsx` con la lógica dinámica de precios.
   - La landing vuelve a tener la identidad visual de Lookitry pero con datos de base de datos.
2. **Mejora del Panel Admin Pricing:**
   - Implementada la edición de **Días de Trial** y **Límite de Generaciones**.
   - Sincronizados los cálculos de ROI para que usen costos y metas reales de la base de datos.
   - Añadido **Cálculo Automático de Descuentos** en los planes Básico y Pro (al cambiar precio original vs actual).
3. **Corrección Multimoneda en Planes:**
   - La página `/planes` ahora responde correctamente al selector COP/USD.
   - Todos los precios, totales y comparativas se formatean dinámicamente.
4. **Navegación (Breadcrumbs):**
   - Creado componente reutilizable `src/components/ui/Breadcrumbs.tsx`.
   - Añadidos breadcrumbs a la página de **Sobre Nosotros**.

---
*Nota para la IA: Antes de empezar, lee este archivo y actualízalo al finalizar cada tarea.*
