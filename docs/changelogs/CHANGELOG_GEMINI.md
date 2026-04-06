# Actualización Documentación Widget (2026-04-06)

## Resumen
Aclaración de la arquitectura del widget: **script (`widget.js`) es el método principal**, iframe (`/embed/[brandSlug]`) es **legacy** y solo para fallback/integraciones específicas.

## Archivos Modificados
- `PRD.md` — Actualizado descripción de Widget Embebido
- `README.md` — Corregido método de integración a widget script
- `docs/SHOPIFY_INTEGRATION.md` — Método 3 marcado como legacy
- `docs/WIDGET_GUIDE.md` — **NUEVO** documento con guía técnica completa del widget

## Detalle de Cambios
- Widget script (`/widget.js`) es el método principal y recomendado
- Embed iframe (`/embed/[brandSlug]`) es legacy: fallback cuando script falla + integraciones específicas de cliente
- Plugin WooCommerce usa script primero, iframe como fallback

---

# Lookitry System Stability & Admin Stats Emergency Fix (2026-03-31)

This entry documents the successful resolution of a critical Error 500 in the administrative statistics panel and the subsequent emergency recovery from file corruption ("mojibake") that occurred during automated code editing.

## Critical Fixes: Admin Stats (Error 500)
- **Backend (`AdminService.ts`)**:
  - Implemented **Defensive Coding** in `getConversionStats` to safely handle missing or null `social_links`.
  - Added robust checks for `payment.brands` in the `getPayments` query to prevent runtime crashes from orphan payment records.
  - Temporarily removed the `reference` column from conversion statistics query to prevent a 500 error if the database migration wasn't fully propagated.
- **Frontend (`AdminConversionPage`, `AdminDashboard`)**:
  - Added **Frontend Hardening** via optional chaining (`?.`) and fallback default objects (e.g., empty arrays `[]`) for all statistical charts and lists.
  - Ensured the dashboard remains operational even if specific segments of the statistics API return null or malformed data.

## Emergency Restoration
- **Hard Reset**: Reverted the Lookitry repository (local and remote) to the last stable state (`fee8e63`) to purge structural code corruption from the previous session.
- **System Synchronization**: Executed a full `--no-cache` deployment to ensure the production VPS is clean and free of leftover mojibake fragments.

## Code Integrity & Blindage
- **Encoding Management**: Enforced UTF-8 encoding for all terminal operations to prevent future character corruption.
- **Atomic Edits**: Transitioned to synchronous, verified file editing to ensure buffer cleanliness during automated code modifications.
