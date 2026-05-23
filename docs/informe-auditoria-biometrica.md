# Informe Técnico de Auditoría de Datos Biométricos

## Lookitry — Cumplimiento Ley 1581 de 2012, Art. 10-C

**Versión:** 1.0
**Fecha:** 2026-05-22
**Elaborado por:** Equipo técnico Lookitry
**Clasificación:** Confidencial — Solo para consumo interno y autoridades regulatorias

---

## 1. Resumen Ejecutivo

Lookitry opera un probador virtual con IA (try-on) que procesa imágenes faciales (selfies) de usuarios finales como dato biométrico sensible bajo el Artículo 5 de la Ley 1581 de 2012. Este informe documenta el estado del sistema al 22 de mayo de 2026, las medidas de cumplimiento implementadas y las políticas de retención vigentes.

**Resultado global: ✅ SUSTANCIALMENTE CONFORME**

Las acciones correctivas identificadas en la auditoría fueron implementadas durante la misma fecha de este informe. Quedan pendientes tareas menores de verificación en entorno de producción.

---

## 2. Marco Legal Aplicable

| Norma | Aplicación en Lookitry |
|---|---|
| Ley 1581 de 2012, Art. 5 | Las selfies son datos biométricos clasificados como **DATO SENSIBLE** |
| Ley 1581 de 2012, Art. 10-C | Los datos biométricos deben eliminarse automáticamente tras su procesamiento |
| Decreto 1377 de 2013 | Responsable debe implementar medidas técnicas de seguridad |
| Ley 1581, Art. 10-B | Imagen generada por IA = contenido **sintético**, **NO** dato biométrico |

**Exención voluntaria:** Lookitry opera como persona natural (NIT 700.403.166-3) y está exenta de inscripción en el RNBD al no superar los 100.000 UVT en activos. No obstante, cumple voluntariamente con todos los principios y obligaciones de la Ley 1581.

---

## 3. Inventario de Datos Biométricos

### 3.1 Datos identificados como biométricos

| Dato | Clasificación | Ubicación en sistema | Sensible |
|---|---|---|---|
| Selfie (imagen facial del usuario) | Dato biométrico / Sensible | MinIO (temporal) + GCS (temporal) | ✅ Sí |
| Máscara SAM2 generada de la selfie | Subproducto biométrico | MinIO + GCS (temporal) | ✅ Sí |
| Hash de deduplicación de selfie | Metadato biométrico (referencia) | Generations.selfie_url_anonymized (hash opaco) | Parcial |
| IP del usuario que sube la selfie | Datos personales | biometric_consents.user_ip | ⚠️ Menor |
| User-Agent del navegador | Datos personales menores | biometric_consents.user_agent | ⚠️ Menor |

### 3.2 Datos NO clasificados como biométricos

| Dato | Justificación legal |
|---|---|
| Imagen generada por try-on (result_image_url) | Contenido **sintético creado por IA** — no es captura facial del usuario. No sujeto a Art. 10-C. Retención: 48h. |

### 3.3 Modelo de responsabilidad

Lookitry actúa como **encargado del tratamiento** en nombre de las marcas suscritas. Las marcas son **responsables** frente a sus usuarios finales y garantizan a Lookitry el consentimiento biométrico previo.

---

## 4. Flujo de Eliminación de Datos Biométricos

### 4.1 Flujo completo (pipeline de generación)

```
1. Usuario final sube selfie ──→ Supabase: generations (status=PENDING)
2. Consentimiento capturado ──→ biometric_consents (BIOMETRIC + TERMS)
3. Pipeline inicia procesamiento
4. Selfie subida a MinIO + GCS (privado, sin public:true)
5. SAM2 genera máscara de la selfie
6. IA generativa (Vertex o n8n) produce imagen try-on
7. ✅ SUCCESS:
   a. result_image_url almacenado en generations
   b. cleanupBiometricData() llamado INLINE:
      - Selfie eliminada de MinIO
      - Selfie eliminada de GCS
      - Máscara SAM2 eliminada de MinIO
      - Máscara SAM2 eliminada de GCS
      - selfie_url en DB → [ELIMINADO-{hash}]
      - selfie_url_anonymized → hash opaco SHA-256
      - selfie_deleted_at → timestamp UTC
      - Log en biometric_cleanup_log
   c. ✅ TIEMPO TOTAL DE ELIMINACIÓN: segundos a minutos post-generación
8. ❌ FAILED:
   a. status → FAILED en generations
   b. cleanupBiometricData() llamado (mismo proceso de eliminación)
   c. error_message guardado para RAG
```

### 4.2 Tiempo de retención real

- **Selfie original:** 0 segundos (eliminación inline tras generación exitosa o fallida)
- **Máscara SAM2:** 0 segundos (eliminación simultánea con selfie)
- **Resultado try-on:** 48 horas (contenido sintético, luego purge automático)
- **Metadatos de consentimiento:** Retención indefinida (auditoría legal)

### 4.3 Verificación de eliminación

Cada eliminación genera un registro en `biometric_cleanup_log` con:
- `generation_id`
- `selfie_path` y `mask_path` (paths eliminados)
- `minio_deleted` y `gcs_deleted` (confirmación de cada storage)
- `selfie_url_anonymized` (hash para trazabilidad sin exposición)
- `cleanup_error` (si algo falló, se registra sin bloquear)
- `deleted_at` (timestamp UTC)

---

## 5. Sistema de Consentimiento Diferenciado

### 5.1 Tabla `biometric_consents`

Creada el 2026-05-22 para separar legalmente los dos tipos de consentimiento:

| Campo | Descripción |
|---|---|
| `generation_id` | FK a generations — une consentimiento con procesamiento |
| `consent_type` | `TERMS` = aceptación de T&C generales · `BIOMETRIC` = consentimiento biométrico expreso (Art. 10-C) |
| `user_ip` | IP del usuario en el momento del consentimiento |
| `user_agent` | Navegador/dispositivo |
| `client_fingerprint` | Hash de sesión para verificación de identidad |
| `product_id` / `brand_id` | Producto y marca involucrados |
| `biometric_purpose` | Descripción del propósito del tratamiento (Art. 10-C) |

**Constraint:** `(generation_id, consent_type)` es UNIQUE — máximo 2 registros por generación.

### 5.2 Soft validation en pipeline

Antes de procesar cada selfie, el pipeline ejecuta `hasBiometricConsent(generationId)`. Si no existe un registro `BIOMETRIC`, se emite un warning log:

```
[TryOnPipeline] ⚠️ generation {id}: Sin consentimiento BIOMETRIC registrado (Art. 10-C)
```

Este warning no bloquea el pipeline (soft validation) pero deja evidencia audit trail para investigación posterior.

---

## 6. Políticas de Retención

### 6.1 Retención por categoría de dato

| Dato | Retención | Base legal |
|---|---|---|
| Selfie (dato biométrico) | Eliminación inmediata (segundos post-generación) | Art. 10-C Ley 1581 |
| Máscara SAM2 (subproducto biométrico) | Eliminación inmediata (simultánea con selfie) | Art. 10-C Ley 1581 |
| Imagen generada try-on | 48 horas desde generación | Art. 10-B Términos y Condiciones |
| Hash selfie (anonimizado) | Indefinida (auditoría legal) | Art. 10-C + interés legítimo |
| Registro de consentimiento | Indefinida (auditoría legal) | Ley 1581 |
| Registro de cleanup log | 12 meses | Retención de auditoría |
| prompt_used | Indefinida (RAG de mejoras) | Interés legítimo |
| error_message | Indefinida (RAG de errores) | Interés legítimo |

### 6.2 Purga automática de resultados (48h)

Job programado en `scheduler.ts` — cada 6 horas:
- Consulta: `generations` con `status='SUCCESS'`, `result_image_url` válido, `result_image_deleted_at IS NULL`, `generated_at < (now - 48h)`
- Acción por cada resultado expirado:
  1. Elimina imagen de GCS
  2. Actualiza `result_image_url = '[EXPIRADO]'`
  3. Setea `result_image_deleted_at`
  4. Log en stdout del scheduler

**Verificación:** El panel de marca muestra "Resultado expirado tras 48h" con icono de reloj cuando `resultImageUrl === '[EXPIRADO]'`.

---

## 7. Seguridad de la Base de Datos

### 7.1 Row Level Security (RLS)

| Tabla | RLS | Policies |
|---|---|---|
| `generations` | ✅ Habilitado | 2 policies (service_role) |
| `generation_consents` | ✅ Habilitado | 2 policies (service_role) |
| `biometric_consents` | ✅ Habilitado | 3 policies (service_role) |
| `biometric_cleanup_log` | ✅ Habilitado | 2 policies (service_role) |
| `sales_patterns` | ✅ Habilitado | 3 policies |
| `ticket_messages` | ✅ Habilitado | 3 policies |

### 7.2 Acceso a storage

- **GCS:** Todos los objetos subidos como **privados** (`public: false`, `cacheControl: 'private, max-age=0'`)
- **Acceso temporal:** Solo mediante **signed URLs** con TTL:
  - Selfie: 15 minutos
  - Máscara SAM2: 5 minutos
- **No existen objetos públicos** en el bucket GCS de producción

### 7.3 Roles y API Keys

| Rol | Uso | Permisos |
|---|---|---|
| `anon` | Frontend (público) | Solo datos autorizados por RLS |
| `authenticated` | Usuarios logueados | RLS basada en brand/user |
| `service_role` | Backend (este sistema) | Sin restricciones RLS |
| `postgres` | Superusuario DB | Administración directa |

La API key `service_role` tiene acceso total a todas las tablas. Se almacena en `backend/.env` (SUPABASE_SERVICE_KEY) y nunca debe exponerse públicamente.

---

## 8. Exportación de Datos y Cumplimiento

### 8.1 Reglas de exportación

Las exportaciones (CSV, PDF, Excel, reportes) **NO DEBEN** incluir:

- `selfie_url` (dato biométrico)
- `selfie_path` (ruta de storage)
- Campos de `biometric_consents` en contexto que revele identidad facial

**Permitido en exportaciones:**

```
generation_id | brand_id | product_id | status | generated_at
processing_time | engine_used | prompt_used | error_message | result_image_url
```

### 8.2 Responsible use clause

Las marcas que usan Lookitry no pueden utilizar las imágenes generadas (resultados try-on) para:
- Deepfakes o suplantación de identidad
- Fraude de identidad
- Fines ilegales

Esta restricción está documentada en los Términos y Condiciones, Artículo 10-B.

---

## 9. Estado de Cumplimiento por Requisito

| Requisito | Estado | Evidencia |
|---|---|---|
| Consentimiento expreso biométrico | ✅ Implementado | `biometric_consents` con `consent_type='BIOMETRIC'` |
| Eliminación inmediata de selfie | ✅ Implementado | `cleanupBiometricData()` llamado inline post-generación |
| Eliminación en FAILED también | ✅ Implementado | `cleanupBiometricData()` en bloque catch del pipeline |
| Logging de cada eliminación | ✅ Implementado | Registro en `biometric_cleanup_log` |
| Anonimización de selfie_url en DB | ✅ Implementado | `selfie_url_anonymized` con hash SHA-256 |
| Storage privado (no public) | ✅ Implementado | GCS: `public: false`, MinIO: acceso privado |
| Signed URLs con TTL | ✅ Implementado | Selfie: 15min, Mask: 5min |
| Purga 48h de resultados | ✅ Implementado | `purgeExpiredResultImages()` en scheduler |
| Panel de marca sin selfie | ✅ Implementado | Solo `resultImageUrl` |
| Admin sin selfie real | ✅ Implementado | Placeholder legal con escudo verde |
| Términos actualizados | ✅ Implementado | Art. 10-B (imágenes generadas) y Art. 11 (retención) |
| Política de Privacidad actualizada | ✅ Implementado | Secciones 2, 6 y 7 |
| RLS en todas las tablas | ✅ Implementado | biometric_consents, biometric_cleanup_log, y 2 tablas más fijadas |
| Consentimiento BIOMETRIC vs TERMS | ✅ Implementado | 3 sitios de captura en pruebalo.controller.ts |
| Soft validation en pipeline | ✅ Implementado | `hasBiometricConsent()` con warning log |
| Campo engine_used | ✅ Implementado | generations.engine_used = 'vertex' | 'n8n' |
| Tablas agent eliminadas | ✅ Implementado | `agent_delegations`, `agent_activities`, `agent_sessions` |
| NDA n8n documentado | ✅ Implementado | Política de Privacidad sección 6 |

---

## 10. Hallazgos y Acciones Correctivas

### 10.1 Hallazgos de la auditoría (todos resueltos el 2026-05-22)

| # | Hallazgo | Gravedad | Acción | Estado |
|---|---|---|---|---|
| H-01 | `biometric_consents` y `biometric_cleanup_log` no existían en DB | 🔴 Crítica | Aplicar migración SQL | ✅ Resuelto |
| H-02 | `generations` sin columnas `engine_used`, `selfie_url_anonymized`, `selfie_deleted_at`, `result_image_deleted_at` | 🔴 Crítica | ALTER TABLE | ✅ Resuelto |
| H-03 | `sales_patterns` y `ticket_messages` sin RLS | 🔴 Alta | Agregar RLS + policies | ✅ Resuelto |
| H-04 | `generation_consents` existente sin policies RLS | 🟡 Media | Agregar policies | ✅ Resuelto |
| H-05 | Código `pruebalo.controller.ts` usaba consentimiento único genérico (no diferenciado) | 🟡 Media | Separar TERMS + BIOMETRIC en 3 sitios | ✅ Resuelto |
| H-06 | Pipeline no tenía soft validation de consentimiento biométrico | 🟡 Media | Agregar `hasBiometricConsent()` con warning | ✅ Resuelto |
| H-07 | No existía función de purge de resultados expirados | 🟡 Media | Crear `purgeExpiredResultImages()` + scheduler | ✅ Resuelto |
| H-08 | `sales_patterns` y `ticket_messages` no existían en DB (código huérfano) | 🟡 Media | Crear tablas faltantes | ✅ Resuelto |
| H-09 | Tablas agent (agent_delegations, agent_activities, agent_sessions) sin uso en código | 🟢 Baja | Eliminar tablas + servicios + routes | ✅ Resuelto |
| H-10 | Frontend no mostraba "Resultado expirado" tras purge 48h | 🟡 Media | Agregar badge + overlay en brand dashboard | ✅ Resuelto |

### 10.2 Tareas pendientes

| # | Tarea | Prioridad | Notas |
|---|---|---|---|
| P-01 | Test local del pipeline completo con signed URLs | ⏱️ Media | Requiere entorno local con GCS configurado |
| P-02 | Verificar que `purgeExpiredResultImages()` se ejecuta correctamente en producción | ⏱️ Media | Revisar logs del scheduler post-deploy |
| P-03 | Rotación de `SUPABASE_ACCESS_TOKEN` y `SUPABASE_SERVICE_KEY` | 🔴 Alta | Rotar cada 90 días. Último cambio: 2026-05-22 |
| P-04 | Eliminar role `cli_login_postgres` (expiró 2026-04-13) | 🟡 Baja | Verificar si se usa antes de eliminar |

---

## 11. Información de Contacto

| Rol | Contacto |
|---|---|
| Responsable del tratamiento | Samuel Wilkie — NIT 700.403.166-3 |
| Email | info@lookitry.com |
| WhatsApp | +57 310 543 6281 |
| Sitio web | lookitry.com |

Para ejercer derechos ARCO o presentar quejas ante la SIC: www.sic.gov.co

---

## 12. Historial de Cambios

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-05-22 | Versión inicial — auditoría completa y acciones correctivas |

---

*Este documento fue generado como parte de la auditoría técnica de cumplimiento de Lookitry y debe mantenerse actualizado ante cualquier cambio significativo en el procesamiento de datos biométricos.*