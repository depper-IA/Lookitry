# Skill: Automatización de Redes Sociales con Buffer

## Identidad

**Problema que resuelve:** Automatizar la creación y programación de contenido en Twitter, Facebook, Instagram y LinkedIn sin intervención manual diaria.

**Flujo completo:**
```
1. Sam solicita contenido por Telegram
2. Rebecca genera contenido optimizado por plataforma
3. Sam revisa y aprueba
4. Rebecca envía a Buffer API
5. Buffer programa los posts automáticamente
```

---

## Protocolo de Ejecución

### Paso 1: Configuración Inicial

1. **Obtener API Key de Buffer:**
   - Ir a buffer.com → Settings → API → Create New Token
   - Guardar token en `/home/travis/Lookitry/Lookitry/backend/.buffer_api_key`

2. **Plataformas habilitadas en Buffer:**
   - Twitter/X
   - Facebook Page
   - Instagram (Business)
   - LinkedIn Page

3. **Perfiles de Buffer:** Obtener profile IDs de cada canal conectado

### Paso 2: Generar Contenido

Cuando Sam envíe un mensaje como:
```
"Rebecca, genera contenido para esta semana sobre [tema]"
```

Rebecca debe:

1. **Analizar el tema** usando contexto de marca previo
2. **Generar contenido por plataforma:**

```
Twitter:
- 3 tweets (máx 280 caracteres)
- Incluir hashtags relevantes
- Variar el ángulo en cada tweet

Facebook:
- 1 post largo (150-300 palabras)
- Storytelling approach
- CTA incluido

Instagram:
- 1 caption ( storytelling + hashtags en comments)
- Sugerencia de imagen/visual

LinkedIn:
- 1 article/post profesional (200-400 palabras)
- Angle: thought leadership
- Mencionar insights del tema
```

3. **Formatear para Buffer API:**

```javascript
const bufferPayload = {
  "profile_ids": ["PROFILE_ID_TWITTER", "PROFILE_ID_FACEBOOK", ...],
  "text": "contenido del post",
  "media": { "link": "url_de_imagen" }, // opcional
  "scheduled_at": "2026-04-19T10:00:00Z" // opcional
}
```

### Paso 3: Enviar a Buffer

**Endpoint:** `POST https://buffer.com/1/updates/create.json`

**Headers:**
```
Authorization: Bearer {BUFFER_API_KEY}
Content-Type: application/json
```

**Payload completo:**
```json
{
  "profile_ids": ["array", "de", "profiles"],
  "text": "contenido optimizado",
  "media": {
    "link": "https://..."
  },
  "scheduled_at": null // null = publicar ahora, o timestamp ISO
}
```

### Paso 4: Verificar y Reportar

Después de enviar a Buffer:
1. Loggar la respuesta de Buffer (confirmation)
2. Reportar a Sam: qué se envió, a qué plataforma, cuándo se publicará
3. Guardar en memoria para reference futura

---

## Formato de Contenido por Plataforma

### Twitter
```
- Máx 280 caracteres
- 2-3 hashtags máximo
- Incluir números/emojis solo si relevan
- Variación: pregunta, dato, opinión, call-to-action
```

### Facebook
```
- 150-300 palabras
- Tono conversacional
- Pregunta al final para engagement
- Link preview si aplica
```

### Instagram
```
Caption:
- Storytelling hook (primeros 125 caracteres cruciales)
- Cuerpo del post
- hashtags en primer comment
- No usar emojis excesivamente
```

### LinkedIn
```
- 200-400 palabras
- Profesional pero accesible
- Datos o experiencias concretas
- Fin con pregunta o reflexión
```

---

## Indicadores de Éxito

| Métrica | target |
|---------|--------|
| Contenido generado | Completoy en formato correcto |
| Respuesta de Buffer | 200 OK para cada profile |
| Engagement de posts | 10% más que manual (baseline) |
| Tiempo de publicación | <2 min desde aprobación |

---

## Notas Importantes

- **No publicar contenido sensible automáticamente** - siempre esperar confirmación de Sam
- **Guardar todos los outputs** en memoria para learn del estilo
- **Buffer rate limits:** 60 requests/hour - implementar delays si necesario
- **Instagram requires** que caption en primer comment no supere 2,200 caracteres

---

**Creado:** 2026-04-18
**Agente:** Rebecca
**Integración:** Buffer API