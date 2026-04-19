# 📱 Lookitry Social OS - Sistema de Social Media Automation

## Visión

Construir un sistema propio de automation de redes sociales que rivalice con Genviral, basado en lo que ya tenemos configurado.

---

## 🎯 Lo que YA tenemos

| Componente | Status | Notas |
|-----------|--------|-------|
| Buffer MCP | ✅ Funcional | Twitter, FB, IG, LinkedIn |
| GCP Vertex AI | ✅ Funcional | Imágenes profesionales |
| Rebecca (agente) | ✅ Configurada | Content creator |
| Budget tracking | ✅ Activo | $5 créditos GCP |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    LOOKITRY SOCIAL OS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐     ┌──────────────┐     ┌───────────────┐  │
│  │ REBECCA  │────▶│ CONTENT      │────▶│ BUFFER MCP   │  │
│  │ (Agent)  │     │ GENERATOR    │     │ (Posting)    │  │
│  └──────────┘     └──────────────┘     └───────────────┘  │
│       │                  │                      │           │
│       │                  │                      │           │
│       ▼                  ▼                      ▼           │
│  ┌──────────┐     ┌──────────────┐     ┌───────────────┐  │
│  │ GCP      │     │ IMAGE        │     │ ANALYTICS     │  │
│  │ VERTEX   │     │ PROCESSOR    │     │ TRACKER       │  │
│  │ (Imágenes)│    │ (Slideshows) │     │ (Métricas)    │  │
│  └──────────┘     └──────────────┘     └───────────────┘  │
│                           │                      │           │
│                           ▼                      ▼           │
│                    ┌──────────────┐     ┌───────────────┐  │
│                    │ CONTENT     │     │ PERFORMANCE   │  │
│                    │ CALENDAR    │     │ DATABASE      │  │
│                    └──────────────┘     └───────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Módulos a Construir

### 1. 📊 Analytics Tracker (PRIORIDAD ALTA)

**Propósito:** Trackear performance de todos los posts

**Datos a capturar:**
```json
{
  "post_id": "buffer_post_uuid",
  "platform": "instagram",
  "content_type": "image|carousel|video",
  "posted_at": "2026-04-18T10:00:00Z",
  "caption_text": "...",
  "image_url": "...",
  "metrics": {
    "likes": 0,
    "comments": 0,
    "shares": 0,
    "views": 0,
    "saves": 0,
    "reach": 0
  },
  "engagement_rate": 0.0,
  "hook_type": "question|stat|story|...",
  "cta_type": "link|link_in_bio|..."
}
```

**Ubicación:** `social-os/analytics/`

### 2. 🎠 Slideshow Generator (PRIORIDAD ALTA)

**Propósito:** Crear carousels/slideshows multi-slide

**Flujo:**
1. Rebecca genera imágenes individuales con GCP
2. Script las combina en carousel
3. Se añade texto overlay
4. Se programa en Buffer

**Herramientas:**
- ImageMagick o Pillow para procesamiento
- GCP para generación de imágenes

**Ubicación:** `social-os/slideshows/generator.py`

### 3. 📅 Content Calendar (PRIORIDAD MEDIA)

**Propósito:** Planificar posts con anticipación

**Estructura:**
```json
{
  "calendar": {
    "2026-04-18": [
      {
        "platform": "instagram",
        "time": "10:00",
        "content_type": "carousel",
        "theme": "inauguracion",
        "status": "draft|scheduled|posted"
      }
    ]
  }
}
```

**Ubicación:** `social-os/calendar/content_calendar.json`

### 4. 🪝 Hook Library (PRIORIDAD MEDIA)

**Propósito:** Biblioteca de hooks virales probados

**Estructura:**
```json
{
  "hooks": [
    {
      "id": "hook_001",
      "text": "¿Sabías que...?",
      "type": "question",
      "engagement_avg": 8.5,
      "uses": 12,
      "best_platforms": ["instagram", "tiktok"]
    }
  ]
}
```

**Ubicación:** `social-os/hooks/hook_library.json`

### 5. 📈 Performance Dashboard (PRIORIDAD BAJA)

**Propósito:** Visualizar métricas de forma clara

**Métricas clave:**
- Engagement rate por platform
- Best performing hooks
- Best posting times
- Content type performance

**Ubicación:** `frontend/src/app/dashboard/social-analytics/`

---

## 🔧 Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Agent | Rebecca (MiniMax-M2.7) |
| Image Gen | GCP Vertex AI Imagen 3.0 |
| Posting | Buffer MCP |
| Database | Supabase (exist) |
| Scripts | Python |
| Storage | Local + Supabase |

---

## 📋 Roadmap de Implementación

### Fase 1: Analytics Foundation (Esta semana)
- [ ] Crear tabla `social_posts` en Supabase
- [ ] Script para loggear posts a Buffer
- [ ] Dashboard básico de métricas
- [ ] Integrar con Rebecca

### Fase 2: Slideshow System (Próxima semana)
- [ ] Script generator de carousels
- [ ] Templates de slides
- [ ] Text overlay automation
- [ ] Test con Instagram carousel

### Fase 3: Hook System (Semana 3)
- [ ] Crear hook library
- [ ] Track engagement por hook
- [ ] A/B testing de hooks
- [ ] Rebecca usa hooks automáticamente

### Fase 4: Calendar + Planning (Semana 4)
- [ ] Content calendar con JSON
- [ ] Auto-scheduling inteligente
- [ ] Themed content weeks
- [ ] Integration con Buffer queue

---

## 💰 Costos

| Recurso | Costo | Notas |
|---------|-------|-------|
| GCP Imágenes | $5 credits | ~140 imágenes |
| Supabase | $0 | Ya tenemos |
| Buffer | $0 | Plan existente |
| Desarrollo | 0 | Lo hacemos nosotros ✅ |

---

## 🎯 Success Metrics

| Métrica | Target |
|---------|--------|
| Posts/semana | 15-20 |
| Engagement rate | >5% |
| Time saved | >5hrs/semana |
| Images generated | <$0.05/imagen |

---

## 📁 Estructura de Archivos

```
social-os/
├── analytics/
│   ├── tracker.py
│   ├── database.sql
│   └── reports.py
├── slideshows/
│   ├── generator.py
│   ├── templates/
│   └── output/
├── calendar/
│   ├── content_calendar.json
│   └── scheduler.py
├── hooks/
│   ├── hook_library.json
│   └── hook_tracker.py
├── images/
│   ├── raw/
│   └── processed/
├── logs/
│   └── activity.log
└── config/
    ├── platforms.json
    └── brand_voice.md
```

---

## 🚀 Integración con Rebecca

Rebecca debe:
1. **Generar imagen** → GCP Vertex AI
2. **Crear caption** → Basado en hooks library
3. **Programar post** → Buffer MCP
4. **Loggear** → Analytics tracker
5. **Trackear metrics** → Actualizar después de 48h

---

**Creado:** 2026-04-18
**Status:** Planning
**Prioridad:** Alta
**Responsable:** Sammantha + Rebecca