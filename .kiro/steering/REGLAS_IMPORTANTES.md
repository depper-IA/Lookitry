# Reglas Importantes del Proyecto

## Gestión de Workflows de n8n

### ⚠️ CRÍTICO: No Crear Nuevos Nodos sin Consentimiento

**REGLA:** No crear, importar ni modificar workflows de n8n sin el consentimiento explícito del usuario.

**Razón:** Los workflows de n8n pueden tener configuraciones específicas, credenciales y paths de webhook que no deben ser duplicados o modificados sin supervisión.

**Workflows Activos:**
- **Virtual Try-On** (`wPLypk7KhBcFLicX`) — webhook: `https://n8n.wilkiedevs.com/webhook/tryon`
  - Modelo aprobado para generación de imágenes: `google/gemini-2.5-flash-image` (Nano Banana, ~$0.039/imagen)
- **Describir con IA** (`ZjVTV3QxoPEi60GX`) — webhook: `https://n8n.wilkiedevs.com/webhook/descriptor`
  - Modelo aprobado para visión/análisis: `google/gemma-3-27b-it:free` (gratuito, vision, 131K ctx)
  - Prompt configurado para devolver texto plano (sin markdown, sin asteriscos, sin títulos)
- **Acción permitida:** Solo actualizar los workflows existentes si el usuario lo solicita explícitamente

### Acciones Permitidas sin Consentimiento

1. ✅ Leer configuración de workflows existentes
2. ✅ Crear scripts de prueba para webhooks
3. ✅ Actualizar documentación
4. ✅ Actualizar código del backend que consume el webhook
5. ✅ Crear archivos JSON de workflows como respaldo (sin importar)

### Acciones que Requieren Consentimiento Explícito

1. ❌ Crear nuevos workflows en n8n
2. ❌ Importar workflows a n8n
3. ❌ Activar/desactivar workflows
4. ❌ Modificar nodos de workflows existentes
5. ❌ Cambiar paths de webhooks
6. ❌ Modificar credenciales de n8n

## ⛔ CRÍTICO: Uso de APIs y Modelos de IA — Solo Versiones Gratuitas

**REGLA ABSOLUTA:** Está TOTALMENTE PROHIBIDO usar modelos de IA de pago o APIs con costo sin consentimiento explícito del usuario.

**Esto aplica a:**
- Modelos de Google Gemini (usar solo `gemini-1.5-flash` o `gemini-2.0-flash` en tier gratuito, NUNCA `gemini-1.5-pro` ni modelos de pago)
- OpenRouter: usar solo modelos con sufijo `:free` (ej. `google/gemini-2.0-flash-exp:free`), NUNCA modelos sin ese sufijo
- OpenAI: PROHIBIDO usar sin autorización explícita (todos son de pago)
- Anthropic/Claude: PROHIBIDO usar sin autorización explícita
- Cualquier otra API de IA con costo por token o por llamada

**En n8n específicamente:**
- Al configurar nodos de IA, verificar siempre que el modelo seleccionado sea gratuito
- Si hay duda sobre si un modelo tiene costo, preguntar antes de usarlo
- No asumir que un modelo es gratuito por estar disponible en la lista

**Consecuencia de incumplimiento:** Genera costos no autorizados al usuario. Esto es inaceptable.

---

## Otras Reglas del Proyecto

### Gestión de Archivos

- No eliminar archivos sin confirmar con el usuario
- No crear archivos de documentación innecesarios
- Mantener estructura de carpetas organizada

### Código

- Seguir convenciones de TypeScript del proyecto
- Usar servicios existentes antes de crear nuevos
- Mantener consistencia con el código existente

### Base de Datos

- No ejecutar migraciones sin consentimiento
- No modificar esquemas de tablas sin aprobación
- Respetar datos existentes en producción

### Deployment

- No hacer cambios en producción sin autorización
- No modificar variables de entorno de producción
- No reiniciar servicios sin avisar

## Contacto

Si tienes dudas sobre si una acción requiere consentimiento, **pregunta primero**.
