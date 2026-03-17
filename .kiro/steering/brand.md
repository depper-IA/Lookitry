---
inclusion: always
---

# Lookitry — Identidad de Marca

## Nombre y escritura

- Nombre oficial: **Lookitry**
- En JSX siempre: `Look<span className="text-[#FF5C3A]">itry</span>`
- NUNCA usar "VirtualTryOn", "Virtual Try On", "Mostrador" ni variantes antiguas en UI pública.

## Descripción del producto

Lookitry es un probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica. Permite a las marcas integrar un widget de prueba virtual en su tienda en minutos, sin apps ni desarrollo adicional.

- Mercado objetivo: Colombia, México, Argentina, Chile, Perú
- Idioma principal: Español
- Propuesta de valor: "Pruébalo antes de comprarlo" — reduce devoluciones y aumenta conversión

## Paleta de colores corporativos

| Nombre           | Hex       | Uso principal                                      |
|------------------|-----------|----------------------------------------------------|
| Naranja Lookitry | `#FF5C3A` | Color de marca, CTAs, acentos, ítem activo en nav  |
| Negro base       | `#0a0a0a` | Fondo principal (modo oscuro)                      |
| Negro card       | `#141414` | Fondo de tarjetas y paneles                        |
| Crema / Beige    | `#f5f2ee` | Fondo alternativo claro, secciones landing         |
| Blanco           | `#ffffff` | Texto principal sobre fondos oscuros               |

### Grises (modo oscuro — regla de legibilidad)

| Uso                        | Valor mínimo |
|----------------------------|--------------|
| Texto secundario / ayuda   | `#999`       |
| Texto de features / listas | `#bbb`       |
| Texto muy sutil (mínimo)   | `#666`       |
| PROHIBIDO para texto       | `#333`, `#444`, `#555` |

## Archivos de marca

| Archivo                                    | Estado       | Uso                                         |
|--------------------------------------------|--------------|---------------------------------------------|
| `frontend/public/logo.svg`                 | ✅ Activo    | Logo principal — usar en TODAS las páginas  |
| `frontend/public/favicon.png`              | ✅ Activo    | Favicon del sitio                           |
| `templates-webs/Lookitry-logo - copia.svg` | ✅ Fuente    | Original SVG fuente                         |
| `templates-webs/Lookitry-favicon.png`      | ✅ Fuente    | Original favicon fuente                     |
| `frontend/public/logo.png`                 | ❌ Obsoleto  | NO usar — reemplazado por logo.svg          |
| `templates-webs/Lookitry-logo.png`         | ❌ Obsoleto  | NO usar — reemplazado por SVG               |

## Tipografía

- Títulos / marca: **Syne** (`--font-syne`) — pesos 400–800
- Cuerpo / UI: **DM Sans** (`--font-dm-sans`) — pesos 300–500

## Variables CSS del sistema de diseño

```css
var(--bg-base)          /* Fondo principal */
var(--bg-card)          /* Fondo de tarjetas */
var(--bg-sidebar)       /* Fondo del sidebar */
var(--bg-sidebar-hover) /* Hover en sidebar */
var(--bg-header)        /* Fondo del header sticky */
var(--bg-hover)         /* Hover genérico */
var(--border-color)     /* Bordes */
var(--text-primary)     /* Texto principal */
var(--text-secondary)   /* Texto secundario */
var(--text-muted)       /* Texto muy sutil */
var(--text-sidebar)     /* Texto en sidebar */
var(--shadow-header)    /* Sombra del header */
```

## Colores de estado / severidad

| Estado  | Color     |
|---------|-----------|
| Info    | `#3b82f6` |
| Warning | `#f59e0b` |
| Error   | `#ef4444` |
| Success | `#10b981` |

## Planes del producto

| Plan    | Precio           | Descripción                                      |
|---------|------------------|--------------------------------------------------|
| TRIAL   | Gratis temporal  | Badge violeta `#6366f1`. Independiente de BASIC. |
| BASIC   | $150.000 COP/mes | 5 productos, 400 generaciones/mes                |
| PRO     | $250.000 COP/mes | 15 productos, 1.200 generaciones/mes             |
| LANDING | Pago único       | Mini-landing personalizada                       |

## Toggle / Switch

- Color activo: `#FF5C3A` (NUNCA `bg-blue-600`)

## URLs del sistema

| Servicio   | URL                                   |
|------------|---------------------------------------|
| Frontend   | `https://pruebalo.wilkiedevs.com`     |
| API        | `https://api.pruebalo.wilkiedevs.com` |
| n8n        | `https://n8n.wilkiedevs.com`          |
| MinIO      | `https://minio.wilkiedevs.com`        |

## Infraestructura — IDs y referencias clave

| Recurso              | ID / Valor                                      |
|----------------------|-------------------------------------------------|
| Supabase Project ID  | `vkdooutklowctuudjnkl`                          |
| Supabase URL         | `https://vkdooutklowctuudjnkl.supabase.co`      |
| VPS ID (Hostinger)   | `1004711`                                       |
| VPS IP               | `31.220.18.39`                                  |
| Docker project       | `virtual-tryon`                                 |
| GitHub repo          | `https://github.com/depper-IA/virtual-tryon.git`|

## Workflows n8n (IDs — no cargar archivos para consultarlos)

| Workflow              | ID                   | Webhook / Uso                        |
|-----------------------|----------------------|--------------------------------------|
| Try-On principal      | `wPLypk7KhBcFLicX`   | `/webhook/tryon`                     |
| Feedback embedding    | `47RcLopJB6M82b0k`   | Flujo4 — embeddings de feedback      |
| Describir con IA      | `ZjVTV3QxoPEi60GX`   | Descriptor de productos              |

Nodo clave en "Describir con IA": `03feeeff-f6bb-4eaf-92f8-4d67d2ba18fe` (Formatear respuesta) — devuelve `{ description, category, enrichedPrompt }`.
Todos los workflows tienen la etiqueta `SaaS`.

## Reglas de branding en nuevas páginas

1. **Logo siempre SVG + nombre de texto** — en TODAS las páginas del frontend sin excepción:
   - Usar `<Image src="/logo.svg" ... />` (nunca `logo.png`)
   - Junto al logo siempre mostrar: `Look<span className="text-[#FF5C3A]">itry</span>`
   - Aplica a: landing, login, register, dashboard, checkout, planes, términos, registro-pro, pago-exitoso, admin, y cualquier página creada a futuro
2. El favicon debe ser `favicon.png` en todos los layouts.
3. El color `#FF5C3A` es el único acento de marca — no introducir otros colores de acento.
4. Fondo oscuro por defecto en dashboards (`#0a0a0a`). Landing puede usar `#f5f2ee` como sección alternativa.
5. No usar emojis en UI — usar iconos SVG o `lucide-react`.
6. NUNCA mostrar solo el logo sin el nombre de texto, ni solo el nombre sin el logo.
7. Tamaños estándar del logo por contexto:
   - Sidebar / header dashboard: `h-7` o `h-8`
   - Páginas de auth (login, register): `h-8` o `h-10`
   - Landing pública (nav): `h-8`
   - Footer: `h-6`
8. En JSX el nombre siempre es: `Look<span className="text-[#FF5C3A]">itry</span>` — nunca texto plano "Lookitry".

## Flujo de trabajo Git y Deploy — Reglas obligatorias

### Antes de cualquier commit/push
1. Siempre hacer `git fetch origin` y revisar si hay commits nuevos en `main` que no están localmente.
2. Verificar si Juli (u otro colaborador) tiene cambios pendientes de subir — revisar el log remoto con `git log origin/main --oneline -10` antes de hacer push.
3. Hacer `git pull origin main --rebase` antes de cualquier push para integrar cambios remotos sin conflictos.
4. Si hay conflictos de merge, resolverlos antes de continuar.

### Antes de aplicar un deploy al VPS
1. Verificar el estado del repo remoto: `git log origin/main --oneline -5` para ver si hay commits recientes de otros colaboradores.
2. Si hay commits recientes de Juli u otro colaborador en los últimos minutos, esperar o coordinar antes de hacer deploy para no pisar sus cambios.
3. El VPS siempre jala del repo git (`git pull origin main`) — los cambios locales que no estén en git NO se despliegan.
4. Siempre verificar que el `git pull` en el VPS muestre los archivos modificados esperados, no solo "Already up to date".

### Flujo correcto de deploy
```
git add <archivos>
git commit -m "descripción"
git pull origin main --rebase   ← integrar cambios de otros
git push origin main
python scripts/_deploy_now.py --backend --frontend --no-cache
```
