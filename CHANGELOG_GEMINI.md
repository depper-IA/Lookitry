# Registro de Cambios — Lookitry (IA Gemini)

Este archivo documenta las mejoras técnicas, correcciones y tareas pendientes realizadas por la IA para mantener la continuidad del desarrollo.

---

## 21 de Marzo, 2026 — Corrección de Errores y Ajustes de Diseño Finales

### ✅ Cambios Aplicados
1. **Corrección Crítica en `layout.tsx`:**
   - Solucionado el error de referencia donde se intentaban usar variables de fuente eliminadas (`inter`, `montserrat`). Ahora utiliza correctamente `spaceMono` y `syne`.
2. **Integridad de Fuentes:**
   - Verificado que las nuevas fuentes (Jakarta, Playfair, Space Mono y Syne) estén correctamente inyectadas en el HTML global.
3. **Sincronización de Base de Datos:**
   - Recordatorio: Ejecutar los comandos SQL para `landing_font` y `widget_bg_color` en Supabase para habilitar el guardado persistente.

### ⏳ Tareas en Proceso / Pendientes
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
