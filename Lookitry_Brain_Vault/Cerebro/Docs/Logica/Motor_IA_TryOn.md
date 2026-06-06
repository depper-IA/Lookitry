# Motor IA: Try-On y Generación

Este documento explica cómo funciona el corazón de Lookitry: la generación de pruebas virtuales. La lógica maestra reside en `pruebalo.controller.ts`.

## 1. Flujo de una Generación
Cuando un usuario sube una foto en el widget:
1. **Validación de Créditos**: Se verifica `usageService.reserveGenerationCredit`. Si no hay, se bloquea la acción.
2. **Control de Concurrencia**: Solo se permite **1 generación activa por ranura** (slot) para evitar saturación de la IA y asegurar tiempos de respuesta.
3. **Deduplicación (Fingerprint)**: Se calcula un hash de la imagen. Si el mismo usuario ya generó el mismo producto con la misma imagen, se le devuelve el resultado guardado **sin gastar créditos**.

## 2. El "Prompt" Dinámico
Lookitry no envía un texto estático a la IA. El prompt se construye por capas:
- **Base**: Instrucciones generales de vestimenta.
- **Categoría**: Reglas específicas (ej. si es "Pantalon", no quitar la camisa).
- **Master Prompt**: Reglas globales del Administrador (desde `payment_settings`).
- **Enriquecimiento RAG**: El sistema lee errores pasados en esa categoría y añade instrucciones para NO repetirlos.

## 3. Estados de Generación
| Estado | Significado |
|--------|-------------|
| `PENDING` | El trabajo está en la cola de RabbitMQ/n8n. |
| `SUCCESS` | Imagen generada y guardada en MinIO. |
| `FAILED` | Error técnico o créditos agotados en el proveedor (Vertex AI). |

## 4. Sistema de Feedback (Bucle de Aprendizaje)
Cuando un usuario pulsa "Reportar error":
1. Se guarda el `error_type` (ej. `wrong_clothing_removed`).
2. Se genera un **Embedding** (vector) de ese error.
3. Este vector se usa en futuras generaciones para que la IA sepa qué corregir automáticamente.

## 5. Modelos Activos (Mayo 2026)

| Etapa | Modelo | Costo estimado |
|-------|--------|----------------|
| Segmentación | MobileSAM | - |
| Generación | **Nano Banana (Gemini 2.5 Flash)** | ~$0.01-0.05 |

**Total por generación: ~$0.01-0.05 USD**

## 6. Código Relacionado

- `backend/src/services/vertex-ai.service.ts` —  MobileSAM + Nano Banana
- `backend/src/controllers/tryon.controller.ts` — Pipeline con fallback n8n
- `backend/src/services/n8n.client.ts` — Cliente n8n
