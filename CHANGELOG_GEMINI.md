# Registro de Cambios — Lookitry (IA Gemini)

Este archivo documenta las mejoras técnicas, correcciones y tareas pendientes realizadas por la IA para mantener la continuidad del desarrollo.

---

## 21 de Marzo, 2026 — Sincronización de Plantillas y Widget IA

### ✅ Cambios Aplicados
1. **Corrección de Plantilla Clásica (`TemplateClassic.tsx`):**
   - **Carga de Widget:** Solucionado el problema donde el widget no cargaba el producto seleccionado. Ahora pasa correctamente el `activeProduct.id` al `TryOnWidget`.
   - **Horarios de Atención:** Añadida una nueva sección dinámica en el footer que muestra los horarios de la marca (`schedule`) recuperados de la base de datos.
   - **Sección de Pasos:** Implementada una sección visual de "Pasos 1, 2, 3" para guiar al usuario en la experiencia de prueba virtual.
2. **Mejoras en `TryOnWidget.tsx`:**
   - **Pre-selección de Producto:** Añadida la prop `initialProductId` para permitir que el widget inicialice con un producto específico cuando se abre desde una mini-landing.
3. **Identidad de Marca (Branding):**
   - **Footer Unificado:** Actualizado el componente `LandingFooter` en `shared.tsx` para usar estrictamente el formato JSX: `Look<span className="text-[#FF5C3A]">itry</span>`.
   - **Sincronización de Colores:** Verificado el uso del color `#FF5C3A` en todas las llamadas a la acción (CTAs) y acentos de las plantillas.
4. **Verificación de Plantillas:**
   - Confirmada la integridad de las plantillas **Editorial** y **Moderno**, asegurando que el flujo de selección de productos y apertura del widget sea fluido y consistente con la previsualización del editor.

### ⏳ Tareas en Proceso / Pendientes
- **Pruebas de PayPal:** Verificar el flujo completo de checkout con PayPal en producción.
- **Breadcrumbs en Legales:** Aplicar y verificar físicamente la persistencia de breadcrumbs en `terminos` y `politicas-privacidad`.
- **TRM Automática:** Implementar el fetch automático desde un servicio externo.

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
