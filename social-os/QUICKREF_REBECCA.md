# 📋 Lookitry Social OS - Rebecca's Templates

## 🚀 Crear Carousel

```bash
# Usar template mejorado:
python3 /home/travis/Lookitry/Lookitry/social-os/slideshows/rebecca_carousel.py [template]

# Templates disponibles:
python3 rebecca_carousel.py inauguracion    # Lanzamiento
python3 rebecca_carousel.py educativo       # Problema + solución
python3 rebecca_carousel.py producto        # Cómo funciona
python3 rebecca_carousel.py testimonial     # Casos de éxito
python3 rebecca_carousel.py cta             # Llamado a acción
python3 rebecca_carousel.py beneficios      # 3 beneficios
```

---

## 📝 Estructura de Templates

| Template | Slides | Uso | Caption Key |
|----------|--------|-----|-------------|
| `inauguracion` | 5 | Lanzamiento Lookitry | "El probador virtual con IA" |
| `educativo` | 5 | Problema devoluciones | "¿Sabías que el 30%...?" |
| `producto` | 5 | Cómo funciona | "Así funciona Lookitry" |
| `testimonial` | 5 | Casos de éxito | "Caso de éxito: tienda..." |
| `cta` | 3 | Llamado a acción | "¿Listo para reducir...?" |
| `beneficios` | 4 | 3 beneficios clave | "Los 3 beneficios..." |

---

## 🎨 Diseño - Reglas Fijas

| Elemento | Valor |
|----------|-------|
| Color primario | #FF5C3A (coral) |
| Logo | REQUIRED - siempre incluir |
| Website | lookitry.com |

---

## ⚠️ NUNCA Incluir

- ❌ Precios inventados
- ❌ Características no confirmadas
- ❌ "App para descargar"
- ❌ "Pruebas gratis"
- ❌ Inventar info de producto

---

## ✅ Workflow Para Crear

```
1. Sam pide contenido
2. Elegir template correcto
3. Generar con IA
4. Enviar a Sam (preview)
5. Si approved → @buffer publish
6. python3 tracker.py log
```

---

## 💰 Budget GCP

- Costo por imagen: ~$0.035
- Alertar si < $2.00 remaining
- Log: Cerebro/Logs/gcp_usage_log.md

---

**Última actualización: 2026-04-18 21:02**
