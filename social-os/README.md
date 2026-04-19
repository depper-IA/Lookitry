# 📱 Lookitry Social OS

Sistema propio de automatización de redes sociales para **Instagram + TikTok** con música AI.

## 🎯 Plataformas Configuradas

| Platform | Formato | Aspect Ratio | Música |
|----------|---------|--------------|--------|
| **Instagram** | Image/Carousel | 1:1 | No |
| **TikTok** | Slideshow | 9:16 | ✅ SonAuto AI |

## 🎨 Brand Guidelines

| Elemento | Valor |
|----------|-------|
| Color primario | `#FF5C3A` (Naranja) |
| Color secundario | `#111111` (Negro) |
| Texto | `#FFFFFF` (Blanco) |
| Logo | `Content/Graphics/lookitry_logo_real.png` |

## 🎵 SonAuto - Música AI

**API Key:** Configurada ✅
**Endpoint:** `https://api.sonauto.ai/v1`

### Estilos de música:
| Style | Tags | Uso |
|-------|------|-----|
| `energetic` | electronic, dance, 2020s | Posts activos, CTA |
| `chill` | chill, ambient, relaxation | Contenido relajado |
| `trending` | electronic, pop, 2020s | Viral, trending |
| `fashion` | electronic, dance, 2020s | Moda, producto |

## 🎨 Stack de Imágenes

| Servicio | Uso | Costo | Status |
|----------|-----|-------|--------|
| **GCP Imagen** | Generación principal | $5 credits | ✅ Activo |
| **Pillow** | Overlays, marca | $0 | ✅ Activo |
| **Canva Pro** | Fallback, edición avanzada | $0 (ya tienes) | ✅ Fallback |

## 📦 Scripts Disponibles

### TikTok Completo (Slides + Música) - ¡PRINCIPAL!
```bash
# Genera slides 9:16 + música automáticamente
python3 social-os/create_tiktok_content.py inauguracion
python3 social-os/create_tiktok_content.py inauguracion --music-style energetic
```

### Mejora de Imagen (Pillow + Canva fallback)
```bash
# Mejorar con marca (default, Pillow)
python3 social-os/canva/canva_enhancer.py enhance --input imagen.png

# Configurar Canva API para uso avanzado
python3 social-os/canva/canva_enhancer.py setup
```

### Scripts Individuales
```bash
# Solo música
python3 social-os/music/music_generator.py generate --prompt "energetic fashion song" --style energetic

# Solo carousel con marca
python3 social-os/slideshows/create_brand_carousel.py inauguracion instagram

# Añadir marca a imagen
python3 social-os/slideshows/add_brand.py --input imagen.png
```

## 📋 Templates

| Template | Slides | Uso |
|----------|--------|-----|
| `inauguracion` | 5 | Lanzamiento Lookitry |
| `educativo` | 5 | Enseñar sobre el problema |
| `producto` | 5 | Mostrar cómo funciona |
| `testimonial` | 5 | Social proof / casos de éxito |
| `cta` | 3 | Llamado a la acción |

## 🚀 Workflow Completo

```
1. Ver siguiente post
   python3 scheduler.py next

2. Generar contenido TikTok completo (slides + música)
   python3 create_tiktok_content.py inauguracion

3. Revisar output:
   - Slides: social-os/slideshows/output/tiktok_[id]/
   - Música: social-os/music/output/tiktok_music_[id].ogg

4. Programar en Buffer
   @buffer create-post

5. Loggear
   python3 tracker.py log --platform tiktok --caption "..."

6. Completar
   python3 scheduler.py complete --id post_001 --buffer-id ...
```

## 📁 Estructura

```
social-os/
├── create_tiktok_content.py   # Script principal TikTok (slides + música)
├── slideshows/
│   ├── create_brand_carousel.py
│   ├── add_brand.py
│   └── templates_tiktok.json
├── canva/
│   ├── canva_enhancer.py     # Mejora imágenes (fallback)
│   └── README.md
├── music/
│   ├── music_generator.py     # Generador de música SonAuto
│   └── output/               # Canciones generadas
├── calendar/
│   ├── scheduler.py
│   └── content_calendar.json
├── analytics/
│   └── tracker.py
├── hooks/
│   └── hook_library.json
└── images/
    ├── raw/                  # Imágenes GCP
    └── brand/               # Con marca
```

## 💰 Budget

| Servicio | Costo | Notes |
|-----------|-------|-------|
| GCP Imágenes | $5 credits | ~140 imágenes |
| SonAuto Música | ~$0.02/song | API key disponible |
| Buffer | $0 | Ya configurado |

## 🎵 Music Genres (SonAuto)

Tags válidos:
- electronic, dance, ambient, chill, pop, rock
- 2020s, 2010s, 2000s, 1990s
- motivational, positive, relaxing
- corporate, business

---

**Construido:** 2026-04-18
**Plataformas:** Instagram + TikTok
**Música:** SonAuto AI ✅
**Stack:** Python + Buffer MCP + GCP Vertex AI + SonAuto + Canva