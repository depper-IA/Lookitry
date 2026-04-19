# Skill: Automatización de Redes Sociales con Buffer + GCP Imagen

## Identidad

**Problema que resuelve:** Automatizar la creación y programación de contenido visual profesional en Twitter, Facebook, Instagram y LinkedIn usando GCP Vertex AI para imágenes.

**Integraciones:**
- Buffer MCP (`@buffer`) - programación de posts
- GCP Vertex AI (`imagen-3.0-generate-001`) - generación de imágenes profesionales
- Servicio Account: `lookitry-67844@appspot.gserviceaccount.com`

---

## Protocolo de Ejecución

### Flujo Completo

```
1. Sam solicita contenido por Telegram
   "Rebecca, genera contenido [tema] para Instagram + Twitter"
   
2. Rebecca analiza el tema y genera:
   a) Contenido de texto (para cada plataforma)
   b) Prompt de imagen para GCP Vertex AI
   
3. Rebecca genera imagen con GCP:
   - Autenticación via Service Account JWT
   - Endpoint: aiplatform.googleapis.com
   - Modelo: imagen-3.0-generate-001
   
4. Sam revisa en Telegram (con imagen + texto)
   
5. Sam dice "aprobar" o "modificar"
   
6. Si aprobado:
   - Rebecca envía a Buffer vía @buffer MCP
   - Buffer programa en todas las plataformas
   
7. Rebecca loguea uso de GCP y actualiza budget tracking
```

---

## Herramientas Disponibles

### 1. @buffer - Buffer MCP

**Uso:** Programar posts en redes sociales

**Prompts disponibles:**
- "List all my connected Buffer channels"
- "Add a post to my Buffer queue that says '[contenido]'"
- "Show me all my draft posts in Buffer"

### 2. GCP Vertex AI - Generación de Imágenes

**Service Account:** `lookitry-67844@appspot.gserviceaccount.com`
**Ubicación credentials:** `/home/travis/Lookitry/Lookitry/google/lookitry-67844-sa.json`

**Flujo de generación:**
```
1. Crear JWT con private key del Service Account
2. Intercambiar JWT por access token (oauth2.googleapis.com/token)
3. Enviar request a aiplatform.googleapis.com
4. Recibir imagen en base64
5. Guardar como PNG
```

**Parámetros recomendados:**
```python
{
    "instances": [{
        "prompt": "[descripción detallada de la imagen]"
    }],
    "parameters": {
        "sampleCount": 1,
        "aspectRatio": "1:1"  # Para Instagram
    }
}
```

**Modelos disponibles:**
- `imagen-3.0-generate-001` (principal, profesional)
- `imagen-4.0-generate-001` (ultra calidad, más caro)
- `imagen-4.0-fast-generate-001` (más rápido, menos costo)

---

## Rate Limits y Budget

### Budget de GCP

| Recurso | Valor |
|---------|-------|
| Billing Account | R5YFTJBL6DY2YVMU |
| Crédito total | $5.00 USD |
| Validez | Hasta 2026-10-15 |

### Costos por Imagen

| Tamaño | Costo aprox. | Imágenes posibles con $5 |
|--------|-------------|--------------------------|
| 512x512 | $0.015 | ~333 |
| 1024x1024 | $0.035 | ~142 |
| 2048x2048 | $0.065 | ~76 |

**Recomendación:** Usar 1024x1024 para posts de Instagram

### Protocolo de Monitoreo

**Antes de generar:**
1. Verificar logs de uso previo
2. Estimar costo según tamaño de imagen
3. Si presupuesto < $2.00, informar a Sam antes de proceder

**Después de generar:**
1. Loggear en `gcp_usage_log.md`:
   - Timestamp
   - Descripción de imagen
   - Costo estimado
   - Crédito remaining

---

## Formato de Contenido por Plataforma

### Twitter
- 3 tweets (máx 280 caracteres)
- 2-3 hashtags máximo
- Incluir link si es relevante

### Facebook
- 150-300 palabras
- Tono conversacional
- Pregunta al final para engagement

### Instagram
- Caption: storytelling hook + cuerpo
- Imagen: 1024x1024 PNG
- Hashtags en primer comment

### LinkedIn
- 200-400 palabras
- Profesional pero accesible
- Fin con pregunta o reflexión

---

## Prompts para Generación de Contenido

### Post Inauguración Lookitry

**Imagen prompt:**
```
Professional Instagram promotional post for Lookitry inauguration - 
virtual try-on AI for online clothing stores. Fashion model with 
smartphone seeing virtual clothing overlay, modern sleek design, 
vibrant orange and black brand colors, celebration grand opening 
atmosphere, high quality advertisement style
```

**Texto Instagram:**
```
🎉 ¡LOOKITRY YA ESTÁ AQUÍ! 🎉

Imagina que tus clientes pueden probarse tu ropa ANTES de comprar. 
Sin devoluciones. Sin dudas. Solo ventas.

 nuestro probador virtual con IA ya está funcionando para tu tienda online.

🌟 Reduce devoluciones hasta un 40%
📈 Aumenta conversión
✨ Experiencia de compra premium

¿Quieres ser de las primeras marcas en usarlo?

Link en bio 👆
```

### Post Educativo

**Imagen prompt:**
```
Clean minimalist Instagram post about virtual try-on technology 
for online clothing stores. Modern fashion retail technology, 
AI visualization, orange and black color scheme, professional 
ecommerce aesthetic
```

**Texto:**
```
💡 ¿Sabías que el 30% de las devoluciones en tiendas de moda online 
son por tallas incorrectas?

Con Lookitry, tus clientes prueban virtualmente antes de comprar.

✅ Menos devoluciones
✅ Más ventas
✅ Clientes más felices

¿Tu tienda ya tiene esta tecnología?
```

---

## Logs y Tracking

### Archivo: `gcp_usage_log.md`

```markdown
## [YYYY-MM-DD HH:MM]
- Imagen generada: [descripción]
- Modelo: imagen-3.0-generate-001
- Tamaño: 1024x1024
- Costo estimado: $0.035
- Crédito remaining: $X.XX
- Post programado en: [plataformas]
```

---

## Indicadores de Éxito

| Métrica | target |
|---------|--------|
| Contenido generado | Completo y en formato correcto |
| Imagen GCP | PNG 1024x1024 profesional |
| Posts programados | Todos exitosos en Buffer |
| Budget tracking | <$3 gastados sin notificación |
| Engagement posts | 10% más que manual |

---

## Notas Importantes

1. **Presupuesto:** $5 es un crédito de un solo uso. No se renueva automáticamente.
2. **Imagen profesional:** GCP Vertex AI produce imágenes de alta calidad, no como generators básicos.
3. **Aprobación:** Siempre esperar confirmación de Sam antes de publicar.
4. **Tracking:** Documentar cada imagen generada para controlar el gasto.
5. **Service Account:** Las credenciales están en `/home/travis/Lookitry/Lookitry/google/lookitry-67844-sa.json`

---

**Creado:** 2026-04-18
**Actualizado:** 2026-04-18
**Agente:** Rebecca
**Integraciones:** Buffer MCP (@buffer), GCP Vertex AI