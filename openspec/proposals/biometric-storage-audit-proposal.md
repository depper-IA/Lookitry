# Proposal: Auditoría y Remediación de Almacenamiento de Datos Biométricos

**Project:** Lookitry  
**Change:** biometric-storage-audit  
**Date:** 2026-05-22  
**Author:** el Gentleman orchestrator  
**Status:** draft  

---

## Problem Statement

Los Términos y Condiciones (Art. 10-C, Ley 1581 de 2012) declaran que las selfies son **datos biométricos sensibles** con compromisos específicos:

> *"Eliminar la imagen original de forma automática una vez completado el procesamiento"*

**Auditoría del código real reveló:**

| # | Problema | Severidad |
|---|----------|-----------|
| P1 | **La selfie NUNCA se elimina.** No hay código inline de eliminación post-procesamiento. El scheduler falla por pasar `{}` vacío. | 🔴 CRÍTICA |
| P2 | `generations.selfie_url` es **permanente** en Supabase — sin TTL ni anonimización. | 🔴 CRÍTICA |
| P3 | Las selfies se suben a GCS con `public: true` — exposición pública. | 🔴 CRÍTICA |
| P4 | El panel admin muestra la selfie real del usuario final post-procesamiento. | 🔴 CRÍTICA |
| P5 | Las máscaras SAM nunca se eliminan. | 🟡 MEDIA |
| P6 | `generation_consents` existe pero no cubre consentimiento biométrico diferenciado. | 🟠 ALTA |

---

## Scope

**In Scope:**
- Eliminación inline (en el act) de selfies tras procesamiento de try-on
- Anonimización post-proceso de `generations.selfie_url` (hash opaco)
- Restricción de acceso a GCS (quitar `public: true`, usar signed URLs)
- Eliminación inline de máscaras SAM
- Consentimiento biométrico diferenciado en `generation_consents`
- Metadata de generación para RAG y analytics
- Purga de `result_image_url` tras 48h (imagen generada, no biométrica)
- Panel admin: sin exposición de selfie real; panel de marca: solo thumbnail de resultado
- Actualización de Términos y Política de Privacidad

**Out of Scope:**
- Cambio del algoritmo de generación try-on
- Modificación del flujo de autenticación de marcas
- Cifrado en reposo en MinIO (infra)
- GDPR compliance (scope: Ley 1581 Colombia)

---

## Proposed Solution

**Eliminación inmediata (inline, no scheduler):**

```
Pipeline try-on:
1. Subir selfie → MinIO + GCS (signed URL)
2. Generar máscara SAM
3. Ejecutar try-on (Vertex/n8n)
4a. ÉXITO:
    - Guardar result_image_url
    - [ELIMINAR selfie de MinIO y GCS INMEDIATAMENTE]
    - [ANONIMIZAR selfie_url en generations → hash opaco]
    - [ELIMINAR máscara SAM]
    - Loguear en biometric_cleanup_log
    - Retornar resultado
4b. ERROR:
    - [ELIMINAR selfie inmediatamente]
    - [ELIMINAR máscara SAM]
    - Loggear y retornar error
```

**Preservación de metadata:**

Todos los campos operativos se mantienen excepto la selfie real:
- `id`, `brand_id`, `product_id`, `generated_at`, `status` → siempre
- `prompt_used` → **crítico para RAG**
- `result_image_url` → 48h (para marca), luego se purga
- `processing_time`, `engine_used`, `error_message` → siempre
- `selfie_url` → solo hash opaco post-SUCCESS
- `selfie_deleted_at` → timestamp de eliminación (trazabilidad)

**Decisiones clave:**

| Pregunta | Decisión |
|---------|----------|
| ¿Cuándo se elimina la selfie? | **Inmediatamente tras procesar** (pipeline inline, no scheduler) |
| ¿Se guarda imagen generada? | **Sí, 48h** (no es biométrico — es dato sintético IA) |
| ¿Qué muestra panel admin? | **Placeholder legal**, NO la selfie real |
| ¿Qué muestra panel marca? | **Thumbnail del resultado** (try-on), NO la selfie del usuario final |
| ¿Consentimiento biométrico? | **Sí, diferenciado** — tipo `BIOMETRIC` en `generation_consents` |
| ¿Máscaras SAM? | **Eliminación inline** post-generación |
| ¿Purga de resultados? | **Scheduler diario** elimina `result_image_url` > 48h |

---

## Success Criteria

- [ ] La selfie se elimina de MinIO y GCS **antes de retornar** la respuesta al usuario
- [ ] `generations.selfie_url` no contiene URL resoluble tras SUCCESS
- [ ] GCS `lookitry-vertex` no tiene objetos con ACL pública
- [ ] Panel admin muestra placeholder legal, no la selfie real
- [ ] Panel de marca muestra thumbnail del resultado, no la selfie del usuario final
- [ ] Cada generación tiene registro de consentimiento biométrico
- [ ] `prompt_used` está disponible para RAG
- [ ] `result_image_url` se purga tras 48h
- [ ] Términos y Condiciones reflejan el estado real del sistema