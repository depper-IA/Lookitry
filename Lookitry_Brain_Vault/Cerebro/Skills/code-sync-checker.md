# Skill: Code Sync Checker

**Última actualización:** 28 de Abril 2026
**Agentes:** TODOS los agentes (Pixel, Kira, Nadia, Marlo, Zephyr, Lina, Cipher, Leo, Rebecca)

---

## Propósito

Evitar duplicación de código y funcionalidades. Antes de crear cualquier función, componente, endpoint o lógica, SIEMPRE verificar si ya existe en el codebase.

---

## Protocolo de Verificación (OBLIGATORIO)

### Paso 1: Búsqueda Exhaustiva

Antes de escribir código, buscar:

```bash
# Patrones de búsqueda por tipo
```

**Para componentes/UI:**
- Buscar por nombre del componente: `grep -r "ComponentName" --include="*.tsx"`
- Buscar por funcionalidad: `grep -r "onSubmit\|handleClick\|fetchData" --include="*.tsx"`

**Para endpoints/API:**
- Buscar por ruta: `grep -r "/api/leads" --include="*.ts"`
- Buscar por nombre de función: `grep -r "getLeads\|createLead" --include="*.ts"`

**Para servicios/backend:**
- Buscar por nombre: `grep -r "leadService\|LeadService" --include="*.ts"`
- Buscar por método: `grep -r "findByEmail\|updateStatus" --include="*.ts"`

**Para hooks/utilidades:**
- Buscar por nombre: `grep -r "useWhatsApp\|useAuth" --include="*.ts"`
- Buscar por patrón: `grep -r "localStorage\|sessionStorage" --include="*.tsx"`

### Paso 2: Análisis de Duplicados

Si encuentras código similar:

| Escenario | Acción |
|-----------|--------|
| **Código IDENTICO** (misma función, mismo nombre) | USAR el existente, no crear nuevo |
| **Código SIMILAR** (misma intención, implementación diferente) | Comparar ambas, quedarse con la MEJOR implementación |
| **Código RELATED** (misma funcionalidad, diferentes casos de uso) | Considerar extraer lógica compartida o coexistir si son casos distintos |

### Paso 3: Decisión

```
¿Existe código para esta funcionalidad?
    │
    ├── NO → Crear nuevo, siguiendo convenciones del proyecto
    │
    └── SÍ → ¿La nueva implementación es MEJOR?
                │
                ├── NO → Usar existente, no crear duplicado
                │
                └── SÍ → Reemplazar:
                           1. Borrar código antiguo
                           2. Implementar nuevo
                           3. Verificar que todos los imports/calls usen el nuevo
                           4. Commit con mensaje: "refactor: replace [old] with improved [new]"
```

---

## Criterios para "Mejor"

Una implementación es MEJOR si:

- ✅ Más eficiente (menos queries, mejor caching)
- ✅ Más segura (mejor validación, sanitización)
- ✅ Más mantenible (mejor typed, documentado)
- ✅ Más moderna (usa APIs/código más reciente del proyecto)
- ✅ Menos dependencias externas
- ✅ Consistente con el estilo del proyecto

NO es mejor simplemente porque:
- ❌ Es más nuevo
- ❌ Usa una librería diferente que "es mejor según internet"
- ❌ Es más corto (puede ser menos legible)

---

## Ejemplos Prácticos

### Ejemplo 1: Crear función de validación de email

**ANTES de crear:**
```bash
grep -r "email.*valid\|validateEmail\|isValidEmail" --include="*.ts"
```

**Resultado:** Encuentra `utils/validation.ts` con `isValidEmail()` ya existente

**Decisión:** Usar la existente, no crear nueva

---

### Ejemplo 2: Crear endpoint para leads

**ANTES de crear:**
```bash
grep -r "leads/public\|/api/leads" --include="*.ts"
```

**Resultado:** Encuentra `leadsPublic.routes.ts` con `POST /api/leads/public`

**Decisión:** El endpoint ya existe. Verificar si cubre el caso. Si sí, no crear nuevo.

---

### Ejemplo 3: Crear hook de WhatsApp

**ANTES de crear:**
```bash
grep -r "useWhatsApp\|whatsapp.*hook" --include="*.ts" --include="*.tsx"
```

**Resultado:** No existe hook dedicado, pero hay `fetchPublicPaymentSettings()` que ya devuelve el WhatsApp

**Decisión:** Crear hook simple que use `fetchPublicPaymentSettings()` en lugar de duplicar lógica

---

## Checklist en Cada Implementación

- [ ] Busqué si existe código similar (grep/búsqueda)
- [ ] Documenté qué encontré y por qué creé nuevo o usé existente
- [ ] Si reemplacé código, borré el antiguo completamente
- [ ] Si creé nuevo, verifiqué que no haya duplicados de funcionalidad
- [ ] Commit refleja el cambio: "feat: add X" vs "refactor: replace Y with X"

---

## Archivo de Tracking de Duplicados

Para proyectos grandes, mantener registro de funcionalidades duplicadas encontradas:

**Ubicación:** `Cerebro/Estado/duplicates-log.md`

Formato:
```markdown
## Duplicados Encontrados

| Fecha | Fonction | Ubicación Original | Ubicación Duplicate | Resolución |
|-------|----------|-------------------|---------------------|------------|
| 2026-04-28 | isValidEmail | utils/validation.ts | lib/validators.ts | Mantener utils/validation.ts |
```

---

## Integración con Skills

Esta skill se complementa con:

- **refactor**: Para guiar el reemplazo de código duplicado
- **verification-loop**: Para verificar que el reemplazo no rompe nada

---

_Last updated: 2026-04-28_
