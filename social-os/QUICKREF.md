# 📋 Lookitry Social OS - Quick Reference

## Rebecca's Command Card

### 🎠 Crear Carousel
```bash
python3 social-os/slideshows/rebecca_carousel.py inauguracion
```
Templates: `inauguracion`, `educativo`, `producto`, `testimonial`, `cta`

---

### 📊 Analytics
```bash
# Loggear post
python3 social-os/analytics/tracker.py log --platform instagram --caption "..."

# Ver stats
python3 social-os/analytics/tracker.py stats --platform instagram --days 7

# Listar posts
python3 social-os/analytics/tracker.py list --limit 20
```

---

### 📅 Content Calendar
```bash
# Ver calendario
python3 social-os/calendar/scheduler.py list --days 7

# Añadir post
python3 social-os/calendar/scheduler.py add --platform instagram --template inauguracion

# Siguiente post
python3 social-os/calendar/scheduler.py next

# Completar post
python3 social-os/calendar/scheduler.py complete --id post_001 --buffer-id BufferID

# Plan semanal
python3 social-os/calendar/scheduler.py generate-plan

# Stats
python3 social-os/calendar/scheduler.py stats
```

---

### 🎣 Hooks (en hooks/hook_library.json)
| Tipo | Ejemplo |
|------|---------|
| question | ¿Sabías que...? |
| stat | El 90% de... |
| story | Esta es la historia de... |
| howto | Cómo conseguir... |
| challenge | Prueba esto... |

---

### 🖼️ GCP Image Generation
```python
# Script ya configurado en rebecca_carousel.py
# Usa: /home/travis/Lookitry/Lookitry/google/permiso-abril.json
# Budget: $5 (~140 imágenes)
```

---

### 📱 Posting con Buffer
Usar `@buffer` MCP:
- `@buffer` - Ver canales
- `@buffer` - Crear post
- `@buffer` - Programar

---

## 🎯 Workflow Completo

```
1. python3 scheduler.py next
   → Ver siguiente post planeado

2. python3 rebecca_carousel.py [template]
   → Generar carousel

3. @buffer create-post
   → Programar en plataformas

4. python3 tracker.py log --platform instagram --caption "..."
   → Loggear en analytics

5. python3 scheduler.py complete --id post_001 --buffer-id ...
   → Marcar como completado
```

---

## 💰 Budget Tracking
- GCP: $5 total, ~$0.035/imagen
- Log: `Logs/gcp_usage_log.md`
- Alertar si < $2.00

---

** Última actualización: 2026-04-18**
