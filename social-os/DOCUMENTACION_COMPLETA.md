# 📋 Lookitry Social OS - Documentación Completa

**Fecha:** 2026-04-18
**Versión:** 1.0
**Última actualización:** 2026-04-18 20:07

---

## 🎯 Resumen Ejecutivo

Sistema de automatización de redes sociales para **Lookitry**, una plataforma de virtual try-on de zapatos.

### Plataformas Configuradas
- ✅ **Instagram** (Image/Carousel, 1:1)
- ✅ **TikTok** (Slideshow + Música AI, 9:16)

### Stack Tecnológico
| Servicio | Función | Costo |
|----------|---------|-------|
| GCP Vertex AI | Generación de imágenes | $5 credits |
| Pillow | Overlays, marca | $0 |
| Canva Pro | Fallback edición | $0 (cliente tiene) |
| SonAuto AI | Música TikTok | ~$0.02/canción |
| Buffer MCP | Scheduling | $0 (ya configurado) |

**Costo por post:** ~$0.20

---

## 🔧 Configuración Completada

### 1. GCP Image Generation (Vertex AI)

#### Método de Autenticación
JWT + OAuth2 token exchange (NO compute_engine.Credentials)

```
1. Cargar service account key (JSON)
2. Crear JWT claims
3. Firmar con private key (RS256)
4. Intercambiar por OAuth2 access_token
5. Usar token con aiplatform.googleapis.com
```

#### Credenciales
- **Service Account:** `lookitry-67844@appspot.gserviceaccount.com`
- **Key File:** `/home/travis/Lookitry/Lookitry/google/permiso-abril.json`
- **Project ID:** `lookitry-67844`

#### Modelo
- **Modelo:** `imagen-3.0-generate-001`
- **Endpoint:** `https://aiplatform.googleapis.com/v1/projects/lookitry-67844/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`

#### Aspect Ratios
| Ratio | Uso |
|-------|-----|
| `1:1` | Instagram posts |
| `9:16` | TikTok carousels |

#### Budget
- **Créditos:** $5
- **Costo por imagen:** ~$0.035
- **Imágenes disponibles:** ~140

#### Archivos Creados
- `/home/travis/Lookitry/Lookitry/backend/scripts/gcp_image_generator.py` - Script principal
- `/home/travis/Lookitry/Lookitry/test_gcp.py` - Test script
- `/home/travis/Lookitry/Lookitry/google/permiso-abril.json` - Service account key

#### Imágenes Generadas (ejemplos)
- `lookitry_instagram_post.png` (1.2MB)
- `test_permiso.png` (822KB)

---

### 2. SonAuto AI - Música para TikTok

#### Configuración
- **API Key:** `sksonauto_wrlgeFuh0RI9Ajb7I8yMfg132qj_PBIFJn55_hWP74IrnJid`
- **Endpoint:** `https://api.sonauto.ai/v1`
- **Song URL:** `https://cdn.sonauto.ai/pubapi/generations2/`

#### Tags Válidos
| Tag | Descripción |
|-----|-------------|
| `electronic` | Música electrónica |
| `dance` | Dance/EDM |
| `ambient` | Ambient/Atmosférico |
| `chill` | Chill/Relajado |
| `pop` | Pop |
| `rock` | Rock |
| `2020s` | Estilo moderno |
| `corporate` | Corporativo |
| `motivational` | Motivacional |

#### ⚠️ Tags Inválidos (evitar)
- `upbeat`, `fashion`, `luxury`, `trending`, `viral`

#### Estilos Predefinidos
| Style | Tags | Prompt |
|-------|------|--------|
| `energetic` | electronic, dance, 2020s | Energetic electronic dance |
| `chill` | chill, ambient, relaxation | Relaxed ambient |
| `trending` | electronic, pop, 2020s | Trending viral TikTok |
| `fashion` | electronic, dance, 2020s | Fashion-forward luxury |

#### Costo
- **Trial:** 1,500 credits gratis
- **Paid:** $11/month (20K credits)
- **Costo por canción:** ~$0.022

#### Ejemplo de Lyrics Generados
```
[Chorus]
Flash lights flicker, we own the night
Strut down pixels, feeling alive
Bold colors clashing, never think twice
Upload a moment, ready to thrive
```

---

### 3. Brand Overlay (Pillow)

#### Colores de Marca
| Color | Hex | RGB |
|-------|-----|-----|
| Naranja | `#FF5C3A` | (255, 92, 58) |
| Negro | `#111111` | (17, 17, 17) |
| Blanco | `#FFFFFF` | (255, 255, 255) |

#### Elementos Aplicados
1. **Borde naranja** - 6px de ancho
2. **Logo watermark** - Esquina inferior derecha, 8-10% del ancho
3. **Texto overlay** - Para slides principales (opcional)

#### Logo
- **Archivo:** `/home/travis/Lookitry/Lookitry/Content/Graphics/lookitry_logo_real.png`

---

### 4. Canva Pro (Fallback)

#### Cuándo Usar
- Edición manual avanzada
- Templates pre-diseñados
- Elementos gráficos complejos
- Composición de múltiples imágenes

#### Flujo de Trabajo
```
GCP genera imagen
    ↓
Pillow añade marca (borde + logo)
    ↓
¿Necesita más edición?
    ↓
Sí → Abrir en Canva Pro (manual)
No → Usar directo
```

#### Scripts Creados
- `/home/travis/Lookitry/Lookitry/social-os/canva/canva_enhancer.py`

---

### 5. Buffer MCP

#### Configuración
- **Plataformas:** Instagram + TikTok
- **Módulo:** OpenClaw Buffer MCP
- **Token:** Bearer token configurado en OpenClaw

---

## 📁 Estructura del Proyecto

```
Lookitry/
├── social-os/                           # Sistema de Social OS
│   ├── README.md                        # Documentación principal
│   ├── create_tiktok_content.py         # Script TikTok completo
│   ├── slideshows/                     # Generador de carousels
│   │   ├── generator.py                 # Clase principal
│   │   ├── create_brand_carousel.py     # Crear carousel con marca
│   │   ├── add_brand.py                # Añadir marca a imagen
│   │   ├── rebecca_carousel.py         # Script simple para Rebecca
│   │   ├── templates.json               # Templates Instagram
│   │   └── templates_tiktok.json       # Templates TikTok
│   ├── music/                           # Generación de música
│   │   ├── music_generator.py           # Script SonAuto
│   │   └── output/                      # Canciones generadas
│   ├── canva/                           # Integración Canva (fallback)
│   │   ├── canva_enhancer.py            # Script principal
│   │   └── README.md                    # Documentación Canva
│   ├── calendar/                        # Calendario de contenido
│   │   ├── scheduler.py                 # Gestor de posts
│   │   └── content_calendar.json        # Posts planificados
│   ├── analytics/                       # Analytics
│   │   ├── tracker.py                   # Log de posts
│   │   └── database.sql                 # Schema Supabase
│   ├── hooks/                           # Viral hooks
│   │   └── hook_library.json            # 8 hooks predefinidos
│   └── images/
│       ├── raw/                         # Imágenes GCP
│       └── brand/                       # Con marca
├── backend/                             # Backend Lookitry
│   ├── scripts/
│   │   └── gcp_image_generator.py        # Generador GCP
│   └── .env                             # Variables entorno
├── google/                              # Credenciales GCP
│   ├── permiso-abril.json               # Service account key
│   └── lookitry-67844-sa.json           # SA key alternativa
└── Content/                             # Assets de marca
    └── Graphics/
        └── lookitry_logo_real.png       # Logo Lookitry
```

---

## 📋 Templates Disponibles

### TikTok Templates
| Template | Slides | Descripción |
|----------|--------|-------------|
| `inauguracion` | 5 | Lanzamiento de Lookitry |
| `educativo` | 5 | Enseñar sobre el problema |
| `producto` | 5 | Cómo funciona el producto |
| `testimonial` | 5 | Casos de éxito / Social proof |
| `cta` | 3 | Llamado a la acción |

---

## 🚀 Guías de Uso Rápido

### 1. Generar Contenido TikTok Completo (Slides + Música)
```bash
python3 social-os/create_tiktok_content.py inauguracion
python3 social-os/create_tiktok_content.py inauguracion --music-style energetic
```

### 2. Generar Solo Música
```bash
python3 social-os/music/music_generator.py generate --prompt "upbeat fashion song" --style energetic
python3 social-os/music/music_generator.py list
```

### 3. Generar Solo Carousel Instagram
```bash
python3 social-os/slideshows/create_brand_carousel.py inauguracion instagram
```

### 4. Mejorar Imagen con Marca
```bash
python3 social-os/canva/canva_enhancer.py enhance --input imagen.png --text "Lookitry"
```

### 5. Ver Calendario de Posts
```bash
python3 social-os/calendar/scheduler.py next
python3 social-os/calendar/scheduler.py list
```

### 6. Loggear Post Completado
```bash
python3 social-os/analytics/tracker.py log --platform tiktok --caption "..."
```

---

## 🔧 Workflow Completo (Para Rebecca)

```
1. Revisar calendario
   @rebecca ¿Cuál es el siguiente post?
   
2. Generar contenido
   @rebecca Genera carousel inauguracion para TikTok
   
3. Generar imagen (GCP)
   → Imagen raw guardada en social-os/images/raw/
   
4. Añadir marca (Pillow)
   → Imagen con marca guardada en social-os/slideshows/output/
   
5. Generar música (SonAuto) [TikTok]
   → Música guardada en social-os/music/output/
   
6. Revisar y ajustar [Opcional - Canva]
   → Abrir en Canva Pro si necesita edits
   
7. Programar en Buffer
   @buffer create-post --platform tiktok --files slides/*.png --audio music.ogg
   
8. Loggear en analytics
   python3 tracker.py log --platform tiktok --buffer-id [id]
   
9. Marcar completo
   python3 scheduler.py complete --id [post_id]
```

---

## 💰 Budget Tracking

### GCP
| Métrica | Valor |
|---------|-------|
| Crédito inicial | $5.00 |
| Costo por imagen | $0.035 |
| Imágenes usadas | ~5 |
| Imágenes restantes | ~135 |
| Saldo estimado | ~$4.93 |

### SonAuto
| Métrica | Valor |
|---------|-------|
| Credits trial | 1,500 |
| Costo por canción | ~$0.022 |
| Canciones generadas | 1 |
| Credits restantes | ~1,499 |

### Buffer
- **Costo:** $0 (ya configurado)

---

## 🎓 Notas Técnicas Importantes

### GCP Authentication
❌ **NO usar:** `google.auth.compute_engine.Credentials`
❌ **NO usar:** API keys simples

✅ **SÍ usar:** JWT signed con service account private key

```python
# Método correcto
import jwt
import requests

with open('service_account.json') as f:
    sa_data = json.load(f)

claims = {
    "iss": sa_data['client_email'],
    "sub": sa_data['client_email'],
    "aud": "https://oauth2.googleapis.com/token",
    "scope": "https://www.googleapis.com/auth/cloud-platform",
    "iat": int(time.time()),
    "exp": int(time.time()) + 3600
}

token = jwt.encode(claims, sa_data['private_key'], algorithm="RS256")
response = requests.post(
    "https://oauth2.googleapis.com/token",
    data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": token}
)
access_token = response.json()['access_token']
```

### SonAuto Tags
⚠️ **Tags inválidos** (causan error 422):
- `upbeat`, `fashion`, `luxury`, `trending`, `viral`

✅ **Tags válidos:**
- `electronic`, `dance`, `ambient`, `chill`, `pop`, `rock`
- `2020s`, `2010s`, `2000s`, `1990s`
- `corporate`, `motivational`, `positive`, `relaxing`

---

## 🔄 Changelog

| Fecha | Cambio | Status |
|-------|--------|--------|
| 2026-04-18 | GCP image generation configurado | ✅ |
| 2026-04-18 | Primera imagen generada exitosamente | ✅ |
| 2026-04-18 | Lookitry Social OS creado | ✅ |
| 2026-04-18 | Templates TikTok configurados | ✅ |
| 2026-04-18 | SonAuto music integration | ✅ |
| 2026-04-18 | Primera canción generada | ✅ |
| 2026-04-18 | Canva Pro configurado como fallback | ✅ |
| 2026-04-18 | Documentación completa | ✅ |

---

## 📞 Próximos Pasos

1. [ ] Probar script completo de TikTok
2. [ ] Configurar Supabase para analytics
3. [ ] Crear más templates de contenido
4. [ ] Configurar webhooks para posting automático
5. [ ] Añadir más estilos de música

---

**Documento creado:** 2026-04-18 20:07
**Por:** Sammantha (Lookitry AI Assistant)
**Versión:** 1.0