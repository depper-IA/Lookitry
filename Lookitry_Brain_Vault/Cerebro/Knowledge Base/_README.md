---
kb_sync: false
---

# Knowledge Base — Rebecca (Agente WhatsApp)

Esta carpeta es la **fuente de verdad** para el conocimiento de Rebecca.

Cada nota en esta carpeta se sincroniza automáticamente con Supabase (`lookitry_knowledge`) cada vez que guardás cambios. Rebecca usa esta información para responder a prospectos en WhatsApp.

---

## Formato de cada nota

```markdown
---
kb_id: identificador_unico        # requerido — sin espacios, usar guión bajo
kb_category: planes               # planes | features | faq | proceso | contacto
kb_active: true                   # true = Rebecca lo usa | false = ignorado
---

# Título del item

Contenido que Rebecca leerá textualmente...
```

## Categorías disponibles

| Categoría | Descripción |
|-----------|-------------|
| `planes` | Precios, planes, descuentos |
| `features` | Funcionalidades del producto |
| `faq` | Preguntas frecuentes |
| `proceso` | Proceso de venta, onboarding |
| `contacto` | Datos de contacto |

## Cómo funciona la sincronización

1. Editás una nota aquí en Obsidian
2. n8n detecta el cambio (schedule cada hora o trigger manual)
3. Genera el embedding con Gemini
4. Hace upsert en Supabase
5. Rebecca ya tiene la info actualizada en su próxima conversación

> **Nota:** El `kb_id` es el identificador único en la DB. Si cambiás el `kb_id` de una nota existente, se crea un item nuevo en lugar de actualizar el anterior.
