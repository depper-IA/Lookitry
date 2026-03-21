# Registro de Cambios — Lookitry (IA Gemini)

Este archivo documenta las mejoras técnicas, correcciones y tareas pendientes realizadas por la IA para mantener la continuidad del desarrollo.

---

## 21 de Marzo, 2026 — Refinamiento Premium del Template Clásico

### ✅ Cambios Aplicados
1. **Optimización de Escala Visual (Template Clásico):**
   - **Textos Equilibrados:** Reducción de los tamaños de fuente en Hero y títulos de sección (máximo `text-5xl` y `text-4xl`) para un look más institucional y sofisticado.
   - **Descripciones Legibles:** Ajuste de las descripciones a `text-sm` para mejorar la densidad de información y el balance visual.
2. **Sincronización de Mockups (Selector):**
   - **Wireframe Actualizado:** Rediseñado el icono visual del Template Clásico en el editor para reflejar su estructura real de Header, Hero lateral y pasos informativos.
3. **Mejoras de Integridad:**
   - **Fix Responsive:** Asegurado el comportamiento fluido de los contenedores en todos los breakpoints, eliminando desbordamientos de texto.
   - **Sincronización Real-Time:** Verificado que todos los cambios en fuentes y colores se apliquen instantáneamente en el previsualizador sin latencia.

### ⏳ Tareas en Proceso / Pendientes
- **Ejecución SQL:** Pendiente ejecutar `ALTER TABLE brands ADD COLUMN landing_font TEXT DEFAULT 'font-jakarta';` en Supabase.
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
