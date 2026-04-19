# 🎨 Canva Integration - Lookitry Social OS

Canva funciona como **fallback** cuando las imágenes generadas por GCP necesitan retoques adicionales.

## 📋 Flujo de Trabajo

```
1. GCP genera imagen (imagen-3.0-generate-001)
         ↓
2. Pillow añade marca (borde + logo)
         ↓
3. ¿Necesita más edición? → Canva (fallback)
         ↓
4. Output final
```

## 🎯 Cómo Funciona Canva (Fallback)

| Paso | Acción | Automático |
|------|--------|------------|
| 1 | Generar en Canva | Manual |
| 2 | Descargar PNG | Manual |
| 3 | Añadir a carpeta | Manual |
| 4 | Usar en buffer | Automático |

## 📁 Archivos

```
social-os/
├── canva/
│   ├── canva_enhancer.py     # Script principal
│   ├── config.json           # Credenciales OAuth
│   └── templates/            # Templates pre-hechos
└── ...
```

## 🔧 Setup Canva API

### 1. Crear App en Canva Developers
1. Ve a https://www.canva.com/developers
2. Click "Create an app"
3. Obtén Client ID y Client Secret

### 2. Configurar
```bash
python3 social-os/canva/canva_enhancer.py setup
```

### 3. Scopes necesarios
- `design:content:read`
- `design:content:write`
- `asset:read`
- `asset:write`

## 🎨 Tipos de Mejoras

| Mejora | Pillow | Canva |
|--------|--------|-------|
| Borde de marca | ✅ | ✅ |
| Logo watermark | ✅ | ✅ |
| Texto superpuesto | ✅ | ✅ |
| Filtros de color | ⚠️ | ✅ |
| Elementos gráficos | ❌ | ✅ |
| Templates complejos | ❌ | ✅ |

## 📊 Costo

| Servicio | Costo |
|----------|-------|
| GCP Imágenes | $5 credits (~140 imágenes) |
| Pillow | $0 |
| Canva Pro | Ya tienes (~$13/mes) |

---

## 🚀 Uso

```bash
# Mejorar con Pillow (default)
python3 social-os/canva/canva_enhancer.py enhance --input imagen.png --text "Lookitry"

# Mejorar con Canva
python3 social-os/canva/canva_enhancer.py enhance --input imagen.png --use-canva
```

## 🎯 Casos de Uso Canva

1. **Edición manual** - Abrir imagen en Canva, hacer ajustes
2. **Templates** - Usar templates pre-diseñados de Lookitry
3. **Elementos gráficos** - Añadir iconos, formas, gráficos
4. **Combinaciones** - Componer múltiples imágenes

---

**Status:** Fallback - Usar cuando GCP + Pillow no sea suficiente
**Integración:** Manual o semi-automática con OAuth