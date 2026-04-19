# 🏗️ Lookitry Social OS - Arquitectura

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    LOOKITRY SOCIAL OS                      │
                    └─────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────────────────┐
    │                              INPUT / REQUEST                                  │
    │                                                                              │
    │   Sam Wilkie ──► Telegram ──► Rebecca (AI Agent)                             │
    │                          │                                                  │
    │                          ▼                                                  │
    │                   "Genera carousel inauguracion para TikTok"                 │
    └──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
    ┌──────────────────────────────────────────────────────────────────────────────┐
    │                         CONTENT GENERATION LAYER                             │
    │                                                                              │
    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
    │   │  SonAuto    │    │  GCP        │    │  Templates  │                     │
    │   │  Music AI   │    │  Imagen 3.0 │    │  Predefinidos│                    │
    │   │             │    │             │    │             │                     │
    │   │  Tags:      │    │  Aspect:    │    │  - inauguracion│                  │
    │   │  - electronic│   │  - 1:1 (IG) │    │  - educativo │                    │
    │   │  - dance    │    │  - 9:16     │    │  - producto  │                    │
    │   │  - 2020s    │    │    (TikTok) │    │  - testimonial│                   │
    │   │             │    │             │    │  - cta       │                    │
    │   └─────────────┘    └─────────────┘    └─────────────┘                     │
    │          │                  │                  │                              │
    │          ▼                  ▼                  ▼                              │
    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
    │   │  .ogg       │    │  .png       │    │  prompts    │                     │
    │   │  Música     │    │  Imagen     │    │  Captions   │                     │
    │   │  Original   │    │  raw        │    │  Hooks      │                     │
    │   └─────────────┘    └─────────────┘    └─────────────┘                     │
    └──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
    ┌──────────────────────────────────────────────────────────────────────────────┐
    │                           BRAND OVERLAY LAYER                                 │
    │                                                                              │
    │   ┌─────────────────────────────────────────────────────────────────┐        │
    │   │                      PILLOW (Automático)                         │        │
    │   │                                                                 │        │
    │   │   1. Borde naranja (#FF5C3A) - 6px                               │        │
    │   │   2. Logo watermark (esquina inferior derecha)                   │        │
    │   │   3. Text overlay (para slides principales)                     │        │
    │   │   4. Mejora de colores (opcional)                               │        │
    │   │                                                                 │        │
    │   └─────────────────────────────────────────────────────────────────┘        │
    │                                       │                                      │
    │                                       ▼                                      │
    │   ┌─────────────────────────────────────────────────────────────────┐        │
    │   │              CANVA PRO (Fallback - Manual)                      │        │
    │   │                                                                 │        │
    │   │   - Edición avanzada                                            │        │
    │   │   - Templates pre-diseñados                                    │        │
    │   │   - Elementos gráficos complejos                               │        │
    │   │                                                                 │        │
    │   └─────────────────────────────────────────────────────────────────┘        │
    └──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
    ┌──────────────────────────────────────────────────────────────────────────────┐
    │                         OUTPUT LAYER                                          │
    │                                                                              │
    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
    │   │ Slides       │    │ Audio       │    │ Caption     │                     │
    │   │ 9:16 PNG     │    │ .ogg        │    │ + Hashtags  │                     │
    │   │ (3-5)       │    │ 30-60s       │    │             │                     │
    │   └─────────────┘    └─────────────┘    └─────────────┘                     │
    │          │                  │                  │                              │
    └──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
    ┌──────────────────────────────────────────────────────────────────────────────┐
    │                         PUBLISHING LAYER                                      │
    │                                                                              │
    │   ┌─────────────────────────────────────────────────────────────────┐        │
    │   │                     BUFFER MCP (OpenClaw)                        │        │
    │   │                                                                 │        │
    │   │   Instagram                    TikTok                           │        │
    │   │   ──────────                   ──────                           │        │
    │   │   • Image/Carousel             • Slideshow                      │        │
    │   │   • 1:1 aspect                 • 9:16 aspect                     │        │
    │   │   • Caption                    • Audio attached                 │        │
    │   │   • Schedule                   • Caption                        │        │
    │   │                               • Schedule                       │        │
    │   │                                                                 │        │
    │   └─────────────────────────────────────────────────────────────────┘        │
    └──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
    ┌──────────────────────────────────────────────────────────────────────────────┐
    │                         ANALYTICS LAYER                                       │
    │                                                                              │
    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
    │   │  Tracker    │    │  Calendar    │    │  Supabase   │                     │
    │   │  Local      │    │  Content    │    │  Database   │                     │
    │   │  JSON       │    │  Scheduler   │    │  (futuro)   │                     │
    │   └─────────────┘    └─────────────┘    └─────────────┘                     │
    └──────────────────────────────────────────────────────────────────────────────┘

---

## 📁 Estructura de Archivos

Lookitry/
├── social-os/
│   ├── README.md                      # Este archivo
│   ├── DOCUMENTACION_COMPLETA.md       # Documentación técnica
│   ├── QUICKREF.md                     # Referencia rápida
│   ├── create_tiktok_content.py        # Script principal TikTok
│   │
│   ├── slideshows/                     # Generación de carousels
│   │   ├── generator.py                # Clase generadora
│   │   ├── create_brand_carousel.py   # Crear carousel con marca
│   │   ├── add_brand.py               # Añadir marca
│   │   ├── rebecca_carousel.py        # Script simple Rebecca
│   │   ├── templates.json             # Templates Instagram
│   │   ├── templates_tiktok.json      # Templates TikTok
│   │   └── output/                    # Carousels generados
│   │
│   ├── music/                         # Generación de música
│   │   ├── music_generator.py         # Script SonAuto
│   │   └── output/                    # Canciones generadas
│   │       └── test_song.ogg          # Canción de prueba
│   │
│   ├── canva/                         # Integración Canva
│   │   ├── canva_enhancer.py          # Script enhancement
│   │   └── README.md                  # Docs Canva
│   │
│   ├── calendar/                      # Calendario de contenido
│   │   ├── scheduler.py               # Gestor de posts
│   │   └── content_calendar.json     # Posts planificados
│   │
│   ├── analytics/                     # Analytics
│   │   ├── tracker.py                # Log de posts
│   │   └── database.sql              # Schema Supabase
│   │
│   ├── hooks/                        # Viral hooks
│   │   └── hook_library.json         # 8 hooks predefinidos
│   │
│   └── images/                        # Imágenes
│       ├── raw/                       # GCP output
│       └── brand/                    # Con marca
│
├── backend/
│   └── scripts/
│       └── gcp_image_generator.py    # GCP Imagen
│
└── google/
    └── permiso-abril.json             # Service account key

---

## 🔄 Flujo de Datos

    INPUT: "Genera carousel inauguracion para TikTok"
           │
           ▼
    ┌─────────────────┐
    │  Rebecca Agent  │  ← Recibe request por Telegram
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐     ┌─────────────────┐
    │ SonAuto API     │     │ GCP Vertex AI   │
    │ Genera música   │     │ Genera slides  │
    └────────┬────────┘     └────────┬────────┘
             │                        │
             ▼                        ▼
    ┌─────────────────┐     ┌─────────────────┐
    │ .ogg file       │     │ .png files      │
    │ (30-60s)        │     │ (3-5 slides)    │
    └────────┬────────┘     └────────┬────────┘
             │                        │
             └──────────┬─────────────┘
                        │
                        ▼
               ┌─────────────────┐
               │    Pillow       │
               │  Brand Overlay  │
               │  (borde+logo)   │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐
               │   Canva Pro     │  ← Solo si necesita
               │   (fallback)     │    edición manual
               └────────┬────────┘
                        │
                        ▼
    ┌────────────────────────────────────────────┐
    │              OUTPUT DIRECTORY              │
    │                                            │
    │  social-os/slideshows/output/tiktok_xxx/   │
    │  ├── slide1.png                           │
    │  ├── slide2.png                           │
    │  ├── slide3.png                           │
    │  ├── slide4.png                           │
    │  ├── slide5.png                           │
    │  ├── music.ogg                            │
    │  └── metadata.json                        │
    └────────────────────────────────────────────┘
                        │
                        ▼
               ┌─────────────────┐
               │   Buffer MCP    │  ← Scheduling
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐
               │   Analytics     │  ← Log + tracking
               └─────────────────┘

---

## 💰 Costos por Post

┌─────────────┬────────────┬────────────┬────────────┐
│ Plataforma  │   GCP      │  SonAuto   │   Total    │
├─────────────┼────────────┼────────────┼────────────┤
│ Instagram   │  $0.035    │   $0.00    │  $0.035    │
│ TikTok      │  $0.175    │   $0.022   │  $0.197    │
└─────────────┴────────────┴────────────┴────────────┘

Costo promedio por post: ~$0.20

---

## 🎯 Prioridades de Ejecución

1. GCP genera imagen base
2. Pillow aplica marca (automático)
3. Canva como fallback (manual)
4. SonAuto genera música (TikTok)
5. Buffer programa post
6. Analytics loguea resultado

---

**Creado:** 2026-04-18
**Versión:** 1.0