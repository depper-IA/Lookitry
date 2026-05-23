# SDD: Auditoría y Remediación de Almacenamiento de Datos Biométricos

**Change:** biometric-storage-audit  
**Status:** active  
**Started:** 2026-05-22  
**Type:** compliance / legal  

---

## 1. Contexto y Problema

### 1.1 Origen

Los **Términos y Condiciones** (Art. 10-C, Art. 11) establecen compromisos legales sobre datos biométricos (selfies faciales) bajo la **Ley 1581 de 2012 (Colombia)**:

> *"Las imágenes faciales (selfies) procesadas a través del probador virtual constituyen datos biométricos y son clasificadas como datos sensibles [...] su tratamiento exige consentimiento explícito, diferenciado e independiente del contrato de servicio."*

Compromisos declarados en los Términos:
- ✅ Eliminar la imagen original **de forma automática** una vez completado el procesamiento
- ✅ No asociar las imágenes a datos personales identificables permanentes
- ✅ No compartir las imágenes con terceros, salvo proveedores tecnológicos indispensables
- ✅ No almacenar fotografías de rostros más allá del tiempo necesario para procesar la generación

### 1.2 Hallazgos de la Auditoría (Códigoreal)

La auditoría del código fuente reveló:

| # | Problema | Severidad | Referencia |
|---|----------|-----------|------------|
| P1 | **La selfie NUNCA se elimina.** El scheduler llama `cleanupTempSelfies({} as any)` sin paths → falla validación 400 → nunca se ejecuta. No hay código inline de eliminación post-procesamiento. | 🔴 CRÍTICA | `scheduler.ts:56`, `pruebalo.controller.ts` |
| P2 | `generations.selfie_url` se almacena **permanentemente** en Supabase — sin TTL, sin anonimización | 🔴 CRÍTICA | `generations.service.ts`, `supabase-schema.sql` |
| P3 | Las selfies se suben a **GCS con `public: true`** — cualquier persona con la URL puede acceder | 🔴 CRÍTICA | `upload.service.ts:uploadToGCS()` |
| P4 | Las **selfies reales se muestran en el panel admin** (`<img src={selfie_url}>`) — esto es una exposición innecesaria post-procesamiento | 🔴 CRÍTICA | `generations/page.tsx` (modal detail) |
| P5 | Las máscaras SAM (`mask_*.png`) se guardan en MinIO y **nunca se eliminan** | 🟡 MEDIA | `vertex-ai.service.ts` |
| P6 | La tabla `generation_consents` existe pero solo captura `terms_accepted` — **no cubre el consentimiento biométrico diferenciado** que exige el Art. 10-C | 🟠 ALTA | `generation-consents.service.ts` |
| P7 | n8n accede a la selfie desde URL pública de GCS — no hay NDA/contrato documentado con n8n | 🟠 ALTA | `n8n.client.ts` |

### 1.3 Flujo Actual Confirmado (sin código de eliminación)

```
Usuario sube selfie
  │ base64 → POST /api/upload/selfie
  ▼
MinIO: temp/selfie-*.jpg          ← SE QUEDA PARA SIEMPRE
GCS: lookitry-vertex/ (public=true) ← EXPOSICIÓN PÚBLICA
  │
  ▼
generations.selfie_url = URL real  ← PERMANENTE EN SUPABASE
  │
  ▼
n8n / Vertex AI                   ← TERCEROS ACCEDEN DESDE GCS PÚBLICO
  │
  ▼
result try-on guardado            ← PERMANENTE (OK, 48h planeado)
  │
  ▼
  ✗ NADA SE ELIMINA ✗

Panel admin muestra selfie_url real
```

---

## 2. Propuesta (Proposal)

### 2.1 Estrategia de Cumplimiento

**3 capas:**
1. **Eliminación inmediata de biométricos**: El pipeline de try-on elimina la selfie EN EL ACTO — no hay scheduler, no hay espera. Si falla, se loguea pero no bloquea.
2. **Anonimización + Restricción de acceso**: Reemplazar `selfie_url` por hash opaco en `generations` tras éxito. Quitar `public: true` en GCS.
3. **Preservación inteligente de metadata**: Guardar todo lo útil (trazabilidad, RAG, analytics) sin guardar los datos biométricos.

### 2.2 Decisiones Clave

| Pregunta | Decisión | Justificación |
|---------|----------|---------------|
| ¿Cuándo se elimina la selfie? | **Inmediatamente tras procesar** (pipeline inline, no scheduler) | Términos dicen "tras la generación" — no dice "48h" |
| ¿Se guarda la imagen generada? | **Sí, 48h** | Legal si se declara. Útil para marca (thumbnail) |
| ¿Qué se muestra en panel admin? | **Thumbnail seguro** — imagen opaca o placeholder, NO la selfie real | La selfie real no debe ser visible post-procesamiento |
| ¿Consentimiento biométrico? | **Sí, separado de términos** — tabla `generation_consents` con tipo diferenciado | Ley 1581 + Art. 10-C |
| ¿Metadata a preservar? | **Todos los campos operativos** excepto la selfie real | RAG, analytics, trazabilidad, debugging |
| ¿Máscaras SAM? | **Eliminación inmediata** post-generación | Son biométricos parciales |

---

## 3. Spec

### 3.1 Eliminación Inmediata de Selfie Post-Procesamiento

**HU-1**: Inmediatamente tras obtener el resultado del try-on (vertex o n8n), el pipeline debe eliminar la selfie de MinIO, GCS y reemplazar `selfie_url` en `generations` por un hash opaco.

**HU-2**: La eliminación debe ser **inline en el pipeline**, no diferida por scheduler. Si la eliminación falla, se loguea en `biometric_cleanup_log` pero no bloquea el retorno al usuario ni genera error.

**HU-3**: El pipeline debe registrar en `biometric_cleanup_log`: timestamp, storage backend (MINIO/GCS), path eliminado, resultado (éxito/error).

**HU-4**: Las máscaras SAM (`mask_*.png`) deben eliminarse inmediatamente tras completar o fallar la generación.

**HU-5**: El panel admin NO debe mostrar la selfie real del usuario. Debe mostrar un placeholder, thumbnail opaco, o la imagen generada únicamente.

**Criterios de aceptación:**
- [x] La selfie se elimina de MinIO y GCS antes de retornar la respuesta al usuario
- [x] `generations.selfie_url` se reemplaza por hash opaco tras SUCCESS
- [ ] `generations.selfie_url` se elimina tras FAILED (no se guarda para debugging permanente)
- [x] Las máscaras SAM se eliminan tras el pipeline
- [x] El panel admin muestra placeholder/thumbnail, no la selfie real
- [x] Los fallos de eliminación se loguean sin bloquear el flujo

### 3.2 Restricción de Acceso a Storage (GCS)

**HU-6**: Las selfies en GCS NO deben tener `public: true`. GCS debe usar signed URLs con TTL de 15 minutos para que el proveedor de IA acceda.

**HU-7**: El bucket GCS `lookitry-vertex` no debe tener objetos con ACL pública.

**HU-8**: Objetos públicos existentes en GCS deben purgarse en un script one-time.

**Criterios de aceptación:**
- [x] Nuevas subidas a GCS no usan `public: true`
- [x] Vertex AI / n8n acceden a selfies via signed URL temporal
- [x] No hay objetos en GCS con ACL pública tras la remediación (bucket GCS nunca implementado — N/A)

### 3.3 Consentimiento Biométrico Diferenciado

**HU-9**: El sistema debe registrar consentimiento biométrico diferenciado del consentimiento de términos generales. La tabla `generation_consents` debe distinguir entre `CONSENT_TERMS` y `CONSENT_BIOMETRIC`.

**HU-10**: El consentimiento biométrico debe capturar: brand_id, fingerprint (hash del browser/sesión), IP, user-agent, timestamp, product_id, consent_type.

**HU-11**: El pipeline de try-on debe validar que existe consentimiento biométrico antes de procesar (soft validation — warn but don't block, para no romper funcionalidad existente si la marca aún no actualizó su widget).

**Criterios de aceptación:**
- [ ] `generation_consents.consent_type` distingue `BIOMETRIC` vs `TERMS`
- [ ] Cada generación tiene registro de consentimiento biométrico
- [ ] Las generaciones sin consentimiento biométrico se marcan en logs pero no fallan automáticamente

### 3.4 Metadata de Generación (Data Preservation)

**HU-12**: Tras anonimizar la selfie, el sistema debe preservar en `generations` toda la metadata operativa necesaria para: trazabilidad legal, alimentación de RAG, analytics, debugging de errores.

**HU-13**: Campos a preservar en `generations` tras la generación:

| Campo | Preservar | Razón |
|-------|-----------|-------|
| `id` | ✅ Siempre | Trazabilidad, linkage a consent y feedback |
| `brand_id` | ✅ Siempre | Facturación, analytics |
| `product_id` | ✅ Siempre | Analytics, RAG por producto |
| `generated_at` | ✅ Siempre | Trazabilidad temporal |
| `status` | ✅ Siempre | Operativo |
| `result_image_url` | ✅ 48h | Marca necesita ver resultado, luego se purga |
| `result_image_fingerprint` | ✅ Permanente | Hash opaco del resultado para dedup |
| `processing_time` | ✅ Permanente | Analytics de performance |
| `prompt_used` | ✅ Permanente | **RAG — crítica para mejora de prompts** |
| `error_message` | ✅ Permanente (failed) | Debugging, RAG |
| `input_fingerprint` | ✅ Permanente | Dedup, anti-abuso |
| `client_fingerprint` | ✅ Permanente | Anti-abuso, límites por usuario |
| `selfie_url` | ⚠️ Solo hash opaco post-SUCCESS | **NO la imagen, solo hash para auditoría** |
| `selfie_deleted_at` | ✅ Siempre (success) | Trazabilidad de eliminación |
| `engine_used` (nuevo) | ✅ Permanente | Analytics, debugging |
| `mask_url` | ❌ Eliminado inline | No guardar máscaras |

**HU-14**: La imagen generada (`result_image_url`) se guarda 48h y se elimina automáticamente. Las marcas pueden ver el thumbnail en su panel durante ese periodo.

**HU-15**: El panel de la marca muestra la **imagen generada** (resultado del try-on) como thumbnail durante 48h. NO debe mostrar la selfie del usuario final.

**Criterios de aceptación:**
- [ ] Todos los campos de metadata operativa se preservan tras anonimizar
- [ ] `prompt_used` está disponible para RAG (alimentación de vectores o logs estructurados)
- [x] El panel de marca muestra el resultado del try-on, no la selfie del usuario final
- [x] Los registros de generaciones exitosas mantienen `result_image_url` por 48h

### 3.5 Purgado de Resultados de Generación

**HU-16**: El sistema debe eliminar automáticamente `result_image_url` de `generations` y los archivos en MinIO/GCS tras 48h de la generación.

**HU-17**: Los registros de `generations` se mantienen permanentemente (son metadata, no datos biométricos).

**Criterios de aceptación:**
- [ ] Scheduler diario elimina `result_image_url` y archivos de resultados > 48h
- [ ] El panel de marca muestra "resultado no disponible" tras las 48h
- [ ] Los logs de purgado se registran en `biometric_cleanup_log`

---

## 4. Diseño (Design)

### 4.1 Pipeline de Try-On — Flujo Modificado

```
1. Validar consentimiento biométrico (generation_consents)
   ├── SI existe → continuar
   └── NO existe → loguear warning, continuar (soft validation)
2. Subir selfie → temp/ (MinIO) + GCS (signed URL 15min)
3. Registrar generación en generations (selfie_url = URL real, status = PENDING)
4. Generar máscara SAM (si está configurado)
5. Ejecutar try-on (Vertex/n8n)
   ├── ÉXITO:
   │   a. Guardar result_image_url
   │   b. Guardar consentimiento biométrico (BIOMETRIC)
   │   c. [ELIMINAR selfie de GCS y MinIO INMEDIATAMENTE]
   │   d. [ANONIMIZAR selfie_url en generations → hash opaco]
   │   e. Loguear eliminación en biometric_cleanup_log
   │   f. Retornar resultado al usuario
   └── ERROR:
       a. Marcar FAILED
       b. [ELIMINAR selfie inmediatamente] (no guardar para debug permanente)
       c. Loguear en biometric_cleanup_log
       d. Retornar error al usuario
7. [ELIMINAR máscara SAM] (inmediatamente tras try-on)
8. Loguear en biometric_cleanup_log (máscara eliminada)
```

### 4.2 Anonimización de selfie_url

```typescript
// Hash opaco para auditoría sin vincular dato biométrico → identidad
import crypto from 'crypto';

function anonymizeSelfieUrl(generationId: string, brandId: string): string {
  // Hash irreversible — solo se puede verificar que un selfie_url pertenece
  // a una generación específica si se tiene la clave + generation_id
  const hmac = crypto.createHmac('sha256', process.env.SELFIE_AUDIT_SECRET || 'audit-secret');
  hmac.update(`${generationId}:${brandId}`);
  return `ANONYMIZED_${hmac.digest('hex').slice(0, 16)}`;
}
```

El hash permite responder a la SIC: "esta generación usó datos biométricos" sin poder recuperar la imagen real.

### 4.3 Nueva Tabla: biometric_cleanup_log

```sql
CREATE TABLE biometric_cleanup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid, -- null si es limpieza de scheduler
  cleanup_type text NOT NULL, -- 'SELFIE' | 'MASK' | 'RESULT_IMAGE'
  storage_backend text NOT NULL, -- 'MINIO' | 'GCS' | 'BOTH'
  path text NOT NULL,
  file_size_bytes integer,
  file_age_minutes numeric,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL,
  error_message text
);

CREATE INDEX idx_cleanup_log_date ON biometric_cleanup_log(deleted_at DESC);
CREATE INDEX idx_cleanup_log_generation ON biometric_cleanup_log(generation_id) WHERE generation_id IS NOT NULL;
```

### 4.4 Consentimiento Biométrico — Extensión de generation_consents

```sql
-- Extender la tabla existente con consent_type diferenciado
ALTER TABLE generation_consents ADD COLUMN IF NOT EXISTS consent_type text NOT NULL DEFAULT 'TERMS';
ALTER TABLE generation_consents ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES brands(id);
ALTER TABLE generation_consents ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id);

-- RLS: marcas solo ven sus propios consentimientos
CREATE POLICY "brands_see_own_consents" ON generation_consents
  FOR SELECT USING (
    (brand_id)::text = ((current_setting('request.jwt.claims', true))::json ->> 'brandId')
  );
```

Tipos de consentimiento:
- `TERMS`: acepta términos y condiciones generales (ya existe)
- `BIOMETRIC`: acepta procesamiento de datos biométricos (nuevo)

### 4.5 Scheduler Modificado

```typescript
// scheduler.ts — reemplazar job de 03:00

// Tarea 1: Purge resultados de generación > 48h
cron.schedule('0 4 * * *', async () => {
  await purgeExpiredResultImages(); // 4am — fuera de peak
});

// Tarea 2: Cleanup de archivos huerfanos en temp/ (fallback al inline)
cron.schedule('0 5 * * *', async () => {
  await cleanupOrphanedTempFiles({ olderThanHours: 24 }); // solo huerfanos
});
```

### 4.6 Panel Admin — Sin Selfie Real

```typescript
// generations/page.tsx — modal detail

// ANTES (CRÍTICO):
<img src={selectedGeneration.selfie_url} alt="Selfie" />

// DESPUÉS:
{selectedGeneration.selfie_url?.startsWith('ANONYMIZED_') ? (
  <div className="w-full h-40 flex items-center justify-center rounded-lg bg-[var(--bg-base)]">
    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
      Selfie eliminada tras procesamiento (dato biométrico — Ley 1581)
    </p>
  </div>
) : (
  <div className="w-full h-40 flex items-center justify-center rounded-lg bg-[var(--bg-base)]">
    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Imagen no disponible</p>
  </div>
)}
```

### 4.7 Panel de Marca — Thumbnail del Resultado

```typescript
// Dashboard de la marca — historial de generaciones
// MUESTRA: result_image_url (thumbnail del try-on) por 48h
// NO MUESTRA: selfie_url (dato biométrico eliminado)

// ANTES:
<img src={gen.selfie_url} />  // ← VIOLA CUMPLIMIENTO
<img src={gen.result_url} />

// DESPUÉS:
<img src={gen.result_url} alt="Resultado try-on" />
// Sin selfie — punto. La marca no necesita ver la selfie del cliente final.
```

---

## 5. Tareas (Tasks)

### Fase 1: Corrección Crítica — Eliminación Inline de Selfies

- [x] **T-1.1**: Crear tabla `biometric_cleanup_log` en Supabase
- [x] **T-1.2**: Crear función `deleteSelfieFromStorage(selfieUrl)` en `upload.service.ts` — elimina de MinIO y GCS
- [x] **T-1.3**: Crear función `anonymizeSelfieUrl(generationId, brandId)` para hash opaco
- [x] **T-1.4**: Modificar `tryon.controller.ts` → `executeTryOnPipeline()`: agregar pasos de eliminación inline (antes del return)
- [x] **T-1.5**: Modificar `tryon.controller.ts`: eliminar máscara SAM inline tras generación
- [x] **T-1.6**: Modificar `generations.service.ts` → `updateGeneration()`: reemplazar `selfie_url` por hash opaco tras SUCCESS
- [x] **T-1.7**: Modificar `tryon.controller.ts`: eliminar `selfie_url` tras FAILED (no guardar para debug)
  - ✓ `cleanupBiometricData()` llamada en el bloque catch tras `updateGeneration(..., status: 'FAILED')`
- [x] **T-1.8**: Agregar logging en `biometric_cleanup_log` en cada eliminación
- [ ] **T-1.9**: Test del pipeline completo localmente

### Fase 2: Panel Admin y Marca — Sin Exposición de Selfies

- [x] **T-2.1**: Modificar `admin/generations/page.tsx` — modal detail: mostrar placeholder legal en vez de `selfie_url`
  - Texto: "Selfie eliminada tras procesamiento — dato biométrico — Ley 1581 de 2012"
  - Badge de cumplimiento legal con ícono de escudo
  - No mostrar ninguna imagen en la sección "Selfie" del modal
- [x] **T-2.2**: Verificar que `result_image_url` funcione en admin — confirmado: solo muestra imagen generada (no biométrico)
  - — Admin modal: label actualizado: "(imagen sintética - no biométrico)" + comentario Ley 1581
- [x] **T-2.3**: Panel de marca (`dashboard/generations`): verificado — solo muestra `resultImageUrl`, nunca selfie del usuario final
- [x] **T-2.4**: Documentar en los comentarios del código que el panel de generaciones de marca es Conforme con Ley 1581
  - ✓ Comentario en `generations.controller.ts`: Ley 1581 Art. 10-C compliance

### Fase 3: Consentimiento Biométrico Diferenciado

- [x] **T-3.1**: Migrar tabla `generation_consents`: agregar `consent_type`, `brand_id`, `product_id`
  - ✅ Nueva tabla `biometric_consents` en migración `20260522_add_biometric_consents.sql`
- [x] **T-3.2**: Modificar `generation-consents.service.ts`: separar creación de TERMS vs BIOMETRIC
  - ✅ `createTermsConsent()` + `createBiometricConsent()` + `hasBiometricConsent()` + `getConsentStatsByBrand()`
- [x] **T-3.3**: Modificar `pruebalo.controller.ts`: guardar consentimiento BIOMETRIC junto con TERMS
  - ✅ 3 sitios actualizados: reuso (~line 612), main flow (~line 1018), dedup (~line 1133)
- [x] **T-3.4**: Agregar soft validation en pipeline (warning log si no hay BIOMETRIC consent)
  - ✅ `hasBiometricConsent()` called en `executeTryOnPipeline()` antes del procesamiento

### Fase 4: Restricción de Acceso a Storage (GCS)

- [x] **T-4.1**: Modificar `upload.service.ts` → `uploadToGCS()`: quitar `public: true`
- [x] **T-4.2**: Agregar función `generateSignedUrl()` en `upload.service.ts` (TTL 15min)
- [x] **T-4.3**: Modificar pipeline para generar signed URLs antes de llamar Vertex AI / n8n
- [x] **T-4.4**: Modificar `n8n.client.ts`: pasar signed URL en vez de URL pública
- [x] **T-4.5**: N/A — bucket GCS nunca se implementó completamente, no hay objetos públicos existentes que purgar

### Fase 5: Purga de Resultados de Generación (48h)

- [x] **T-5.1**: Crear función `purgeExpiredResultImages()` en `generations.service.ts`
  - ✅ `purgeExpiredResultImages(limit)`: consulta > 48h, elimina de GCS, marca `[EXPIRADO]`
- [x] **T-5.2**: Modificar scheduler → agregar job `0 */6 * * *` para purge de resultados > 48h
  - ✅ Cada 6 horas; log con cantidad de resultados purgados
- [x] **T-5.4**: Panel de marca: mostrar "resultado no disponible" si `result_image_url` fue purgado
  - ✅ Card: `gen.resultImageUrl === '[EXPIRADO]'` badge con Clock icon
  - ✅ Lightbox: overlay con mensaje "Resultado expirado tras 48h"
  - ✅ `resultImageDeletedAt` propagado desde controller → service → frontend

### Fase 6: Metadata para RAG y Analytics

- [x] **T-6.1**: Verificar que `prompt_used` se guarde en todas las generaciones (SUCCESS y FAILED) — confirmado en código
- [x] **T-6.2**: Agregar campo `engine_used` ('vertex' | 'n8n') en `generations`
  - ✓ En schema `supabase-schema.sql` + DTO + updateGeneration en ambos paths (vertex + n8n)
- [x] **T-6.3**: Verificar que `error_message` se guarde completo en FAILED (para RAG de errores) — confirmado en código
- [x] **T-6.4**: Agregar campo `selfie_deleted_at` en `generations` (timestamp de anonimización) — en schema y código

### Fase 7: Verificación y Documentación Legal

- [x] **T-7.1**: Actualizar Art. 10-C y Art. 11 de Términos y Condiciones — eliminar immediate, imagenes generadas 48h, contenido sintetico
- [x] **T-7.2**: Generar informe técnico de auditoría para compliance interno
  - Archivo: `docs/informe-auditoria-biometrica.md`
- [x] **T-7.3**: Verificar Política de Privacidad — privacidad (secciones 2, 6, 7) y política-de-uso actualizadas con: 48h para imágenes generadas, diferenciación sintético/no-biométrico, n8n como encargado del tratamiento, consentimiento biométrico diferenciado
- [x] **T-7.4**: Documentar el NDA o acuerdo de procesamiento de datos con n8n
  - Referencia en Política de Privacidad sección 6: n8n como proveedor de automatización bajo acuerdo de procesamiento Ley 1581 Art. 10-C

### Fase 7: Monitor de Actividad en Tiempo Real

- [x] **T-7.5**: Crear endpoint `GET /api/admin/realtime/stats` — Redis counters para actividad en vivo
- [x] **T-7.6**: Crear widget `RealtimeActivity` en admin dashboard con polling cada 5s
- [x] **T-7.7**: Mostrar: total generadores activos, actividad por marca, mini chart 2h
- [x] **T-7.8**: Extender `generation-concurrency.service.ts` con `getGlobalActiveCount()`, `getBrandsWithActiveGenerations()`, `getActivityHistory()`

---

## 6. Riesgos

| Riesgo | Prob | Impacto | Mitigación |
|--------|------|---------|------------|
| Eliminación inline falla y la selfie queda expuesta | Media | Alta | Logging detallado + scheduler de cleanup como fallback; si falla GCS pero MinIO se borra → OK (mitigar exposición parcial) |
| Vertex AI no puede acceder a selfies si GCS es privado | Alta | Alta | Usar signed URLs — Vertex AI tiene service account con acceso; n8n recibe signed URL temporal |
| Breaking change: admin que depende de ver selfie_url | Media | Baja | Mostrar placeholder con mensaje legal — no es un feature críticos |
| n8n no puede recibir signed URLs (formato headers) | Baja | Media | n8n puede usar URL con auth query param; documentar como caso especial |
| Consentimiento biométrico no se captura (widget antiguo) | Media | Media | Soft validation — warn but don't block — para no romper funcionalidad de marcas que aún no actualizaron |

---

## 7. No-Goals

- No modificar el algoritmo de generación de try-on
- No cambiar el flujo de autenticación de marcas
- No implementar cifrado en reposo en MinIO (infra)
- No cambiar la lógica de dedup basada en `input_fingerprint`
- No crearGDPR compliance completo (scope: Ley 1581 Colombia)
- No guardar las máscaras SAM por más de 2h (ya no aplica — se eliminan inline)
- No implementar realtime con WebSockets ni Supabase Realtime (usa polling simple via Redis)

---

## 8. Notas de Diseño

**¿Por qué eliminación inline y no scheduler?**

Los Términos dicen "eliminada automáticamente **tras la generación**". Un scheduler a las 03:00 no cumple ese compromiso — la selfie queda expuesta desde que se sube (momento 0) hasta las 03:00 del día siguiente (23+ horas). La eliminación inline garantiza que el dato biométrico está en.storage solo durante el procesamiento activo (segundos a minutos).

**¿Por qué 48h para la imagen generada?**

La imagen generada (try-on result) NO es un dato biométrico — es una imagen sintética producida por IA. 48h es un período razonable para que la marca pueda ver el resultado, reportar feedback, y que el sistema tenga margen para procesar. Legal y comercialmente defensable.

**¿Por qué guardar `result_image_url` 48h si luego se borra?**

El panel de la marca necesita ver el resultado del try-on para:
1. Verificar calidad del resultado
2. Reportar feedback de errores
3. Analytics de engagement

Sin guardar el resultado, el sistema pierde valor para la marca. 48h es un balance entre utilidad operativa y minimización de datos.


**Sobre las imágenes generadas (resultados try-on):**


Las imágenes generadas por IA (resultados try-on) **NO son datos biométricos** bajo la Ley 1581 de 2012. Son contenido sintético — una representación algorítmica, no una captura del usuario real. Por lo tanto:

- No aplica el Art. 10-C de eliminación inmediata
- Pueden retenerse 48h sin conflicto legal
- Su uso comercial está cubierto por los Términos y Condiciones aceptados por la marca

**Cláusula de uso responsable (resultados generados):**


Las marcas aceptan mediante los Términos y Condiciones:
> "Las imágenes generadas por IA son contenido sintético. La marca se compromete a no utilizar los resultados para suplantar identidades, crear material engañoso, deepfakes, fraude de identidad, o cualquier propósito contrario a la ley colombiana. El mal uso de los resultados es responsabilidad exclusiva de la marca."

Esta cláusula protege a Lookitry ante uso indebido de las imágenes generadas por terceros. Se implementa como checkbox obligatorio en el onboarding de marcas y está documentada en los Términos y Condiciones.


**Regla de exportación de datos:**


Cualquier exportación de datos de generaciones (CSV, PDF, Excel, reportes) **solo puede incluir metadata operativa**. Queda **estrictamente prohibido** incluir:
- `selfie_url` o cualquier referencia URL a la selfie del usuario
- Datos biométricos, hashes de anonimización, o campos derivados de la selfie
- Direcciones IP del usuario final por generación individual

Campos permitidos en exports: `generation_id`, `brand_id`, `product_id`, `status`, `generated_at`, `processing_time`, `engine_used`, `prompt_used`, `error_message`, `result_image_url` (solo URL, no archivo)

Esta regla se aplica a cualquier endpoint, script, o función que genere reportes o exports de generaciones, tanto para admins como para marcas.