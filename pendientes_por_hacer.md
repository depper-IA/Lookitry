# Pendientes Por Hacer

## Frontend

### Revertir limpieza temporal de warnings vía ESLint
- Reactivar `@next/next/no-img-element` en `frontend/.eslintrc.json` cuando se complete la migración real de imágenes.
- Reactivar `react-hooks/exhaustive-deps` en `frontend/.eslintrc.json` cuando se corrijan dependencias de hooks en el código.

### Migración real de imágenes
- Reemplazar usos legacy de `<img>` por `next/image` en páginas y componentes públicos/admin donde convenga.
- Revisar casos donde `<img>` debe permanecer por compatibilidad técnica y documentarlos explícitamente.

### Corrección real de hooks
- Corregir `useEffect` y `useCallback` con dependencias faltantes o expresiones complejas en frontend.
- Priorizar pantallas críticas: admin, dashboard, checkout y componentes compartidos.

### Criterio para la próxima tarea
- No dejar la desactivación de reglas como solución permanente.
- Ir retirando esta deuda por lotes pequeños hasta poder reactivar ambas reglas sin romper el build.
