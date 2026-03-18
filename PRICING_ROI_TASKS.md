# Plan de Tareas — Dashboard ROI + Precios Dinámicos

> Proyecto: Lookitry (pruebalo.wilkiedevs.com)
> Fecha: 2026-03-18
> Stack: Next.js App Router · TypeScript · Supabase · Tailwind

---

## Contexto y decisiones de diseño

### ¿Dashboard ROI separado o integrado en /admin/revenue?

**Decisión: INTEGRAR en `/admin/revenue` (ampliar la página existente).**

Razones:
- Ya existe `/admin/revenue/page.tsx` con estructura base (ingresos por plan, proyección, gráfico mensual)
- Crear una página nueva duplicaría lógica y navegación
- La página actual le falta: costos operativos, churn, ARPU, margen bruto, % meta, punto de equilibrio
- Se agrega una pestaña "ROI / Metas" dentro de la misma página

### ¿Precios en archivo JSON o en Supabase?

**Decisión: Tabla Supabase `pricing_config` + API route Next.js + caché ISR.**

Razones:
- Ya usamos Supabase para todo lo demás
- El panel admin ya existe — solo agregar una sección nueva
- ISR (revalidate: 3600) garantiza que la landing refleje cambios sin rebuild
- No rompe SEO (los precios se renderizan en servidor)

---

## PARTE 1 — Dashboard ROI y Metas (ampliar /admin/revenue)

### Tabla modelo — columnas exactas

| Columna | Tipo | Fórmula / Fuente |
|---|---|---|
| Mes | string | `YYYY-MM` |
| Clientes Básico | int | Supabase `subscriptions` WHERE plan=BASIC AND status=active |
| Clientes Pro | int | Supabase `subscriptions` WHERE plan=PRO AND status=active |
| Mini-landings vendidas | int | Supabase `payments` WHERE plan=LANDING AND mes=X |
| Ingresos Básico | COP | clientes_basic × 150.000 |
| Ingresos Pro | COP | clientes_pro × 250.000 |
| Ingresos Landing | COP | landings × 650.000 |
| Ingresos Totales | COP | sum de los 3 anteriores |
| Costo OpenRouter | COP | generaciones_mes × costo_por_gen (editable) |
| Costo VPS | COP | fijo mensual (editable, ~$37.000 COP aprox) |
| Costo Dominio | COP | anual / 12 (editable) |
| Costos Totales | COP | OpenRouter + VPS + Dominio |
| Margen Bruto | COP | Ingresos Totales − Costos Totales |
| Margen Bruto % | % | (Margen / Ingresos) × 100 |
| ROI Mensual | % | (Ingresos − Costos) / Costos × 100 |
| ARPU | COP | Ingresos Totales / (clientes_basic + clientes_pro) |
| Nuevos clientes | int | clientes que entraron ese mes |
| Churn | int | clientes que cancelaron ese mes |
| % Meta cumplida | % | Ingresos Totales / 1.400.000 × 100 |

### Fórmulas clave

```
ROI mensual        = (Ingresos - Costos) / Costos × 100
Punto equilibrio   = Costos Totales / precio_plan
ARPU               = Ingresos / (clientes_basic + clientes_pro)
Margen bruto %     = (Ingresos - Costos) / Ingresos × 100
% meta             = Ingresos / 1.400.000 × 100
Proyección 3 meses = promedio últimos 3 meses × (1 + tasa_crecimiento)
```

### Ejemplo ficticio — 4 Básico + 4 Pro + 1 mini-landing

| Concepto | Valor |
|---|---|
| Ingresos Básico | 4 × $150.000 = $600.000 |
| Ingresos Pro | 4 × $250.000 = $1.000.000 |
| Ingresos Landing | 1 × $650.000 = $650.000 |
| **Ingresos Totales** | **$2.250.000** |
| Costo OpenRouter (est.) | $120.000 (4.800 gen × $25/gen) |
| Costo VPS | $37.000 |
| Costo Dominio | $5.000 |
| **Costos Totales** | **$162.000** |
| **Margen Bruto** | **$2.088.000** |
| Margen Bruto % | 92,8% |
| ROI Mensual | 1.288% |
| ARPU | $2.250.000 / 8 = $281.250 |
| % Meta (1.4M) | 160,7% — META SUPERADA |
| Punto equilibrio Básico | $162.000 / $150.000 = 1,08 → 2 clientes |
| Punto equilibrio Pro | $162.000 / $250.000 = 0,65 → 1 cliente |

---

## PARTE 2 — Precios Dinámicos

### Estructura tabla Supabase `pricing_config`

```sql
CREATE TABLE pricing_config (
  id            text PRIMARY KEY,          -- 'basic', 'pro', 'mini_landing', 'meta', 'costs'
  data          jsonb NOT NULL,
  updated_at    timestamptz DEFAULT now()
);
```

Filas iniciales:
- `basic` → precio, límites, features, subtítulo, botón
- `pro` → ídem
- `mini_landing` → precio único, precio original, descuento %, features
- `meta` → meta_mensual_cop, trm_referencia
- `costs` → costo_vps_cop, costo_dominio_cop_mensual, costo_openrouter_por_gen_cop

---

## Tareas ordenadas por dependencia

### FASE 0 — Preparación (sin código, solo decisiones)
- [ ] **T0.1** Confirmar que la tabla `pricing_config` no existe aún en Supabase
- [ ] **T0.2** Confirmar TRM actual para calcular USD (o usar API pública)

---

### FASE 1 — Base de datos

- [ ] **T1.1** Crear migración SQL: tabla `pricing_config` con RLS (solo admin puede escribir, lectura pública)
- [ ] **T1.2** Insertar filas iniciales con los precios actuales (basic, pro, mini_landing, meta, costs)
- [ ] **T1.3** Verificar que la lectura pública funciona sin auth (para la landing)

---

### FASE 2 — API y capa de datos

- [ ] **T2.1** Crear `frontend/src/lib/pricing.ts`
  - Función `getPricingConfig()` — lee de Supabase con `revalidate: 3600`
  - Tipos TypeScript para cada plan
  - Función `formatCOP(n)` centralizada (mover de PlanesClient)

- [ ] **T2.2** Crear API route `frontend/src/app/api/pricing/route.ts`
  - GET: devuelve config completa (para el panel admin via fetch client-side)
  - PUT: actualiza una fila (solo con adminToken)

- [ ] **T2.3** Crear API route `frontend/src/app/api/pricing/trm/route.ts`
  - GET: consulta TRM actual desde API pública (banrep.gov.co o exchangerate-api)
  - Caché de 24h para no abusar la API externa

---

### FASE 3 — Landing / página de planes dinámica

- [ ] **T3.1** Convertir `PlanesClient.tsx` para recibir `pricingConfig` como prop
  - Eliminar los `250000` y `150000` hardcodeados
  - Leer precios, features, subtítulos y textos de botón desde la prop
  - Mantener la lógica de descuento por duración (los % de descuento también vienen de config)

- [ ] **T3.2** Actualizar `frontend/src/app/planes/page.tsx` (Server Component)
  - Llamar `getPricingConfig()` en el servidor
  - Pasar como prop a `PlanesClient`
  - Agregar `export const revalidate = 3600` para ISR

- [ ] **T3.3** Verificar que el SEO no se rompe
  - Los precios deben estar en el HTML inicial (no solo client-side)
  - Revisar `generateMetadata` en `page.tsx` de planes
  - Confirmar que el sitemap no necesita cambios

---

### FASE 4 — Panel admin: configuración de precios

- [ ] **T4.1** Crear `frontend/src/app/admin/pricing/page.tsx`
  - Sección "Plan Básico": editar precio, productos_max, generaciones, subtítulo, features (lista editable), texto botón
  - Sección "Plan Pro": ídem
  - Sección "Mini-landing": precio único, precio original, descuento %, features
  - Sección "Meta y TRM": meta mensual COP, TRM manual o botón "Actualizar desde API"
  - Sección "Costos operativos": VPS, dominio, costo OpenRouter por generación

- [ ] **T4.2** Agregar calculadoras automáticas en el panel (solo visualización, no se guardan):
  - Precio en USD = precio_cop / trm
  - Clientes necesarios para meta = ceil(meta / precio_plan)
  - Margen estimado = precio_plan − (generaciones_plan × costo_openrouter_por_gen) − (costos_fijos / clientes_estimados)
  - Punto de equilibrio = costos_totales_mes / precio_plan

- [ ] **T4.3** Agregar enlace "Precios" en el sidebar del admin layout

---

### FASE 5 — Dashboard ROI (ampliar /admin/revenue)

- [ ] **T5.1** Agregar pestañas a `/admin/revenue/page.tsx`:
  - Pestaña "Ingresos" (lo que ya existe, mejorado)
  - Pestaña "ROI / Metas" (nueva)

- [ ] **T5.2** Pestaña "ROI / Metas" — componentes:
  - Tarjeta "% Meta cumplida" con barra de progreso visual (color verde si >100%, naranja si 70-99%, rojo si <70%)
  - Tarjeta "ROI mensual %" con comparativa vs mes anterior
  - Tarjeta "ARPU" con tendencia
  - Tarjeta "Margen bruto %" con tendencia
  - Tabla de costos operativos del mes (VPS + dominio + OpenRouter estimado)
  - Tabla "Punto de equilibrio por plan" (cuántos clientes necesito para cubrir costos)
  - Proyección 3 y 6 meses basada en promedio de últimos 3 meses

- [ ] **T5.3** Agregar métricas de churn y nuevos clientes
  - Consulta Supabase: clientes que entraron este mes vs mes anterior
  - Consulta Supabase: clientes que cancelaron (status cambió a cancelled)
  - Mostrar en tarjetas con delta +/-

- [ ] **T5.4** Leer costos desde `pricing_config` (tabla costs) en lugar de hardcodear
  - El costo OpenRouter se calcula: generaciones_mes_total × costo_por_gen
  - Las generaciones totales vienen de la tabla de uso existente

---

### FASE 6 — Deploy y verificación

- [ ] **T6.1** Commit y push de todos los cambios
- [ ] **T6.2** Deploy frontend: `python scripts/_deploy_now.py --frontend`
- [ ] **T6.3** Verificar en producción:
  - Landing `/planes` muestra precios correctos (renderizados en servidor)
  - Panel admin `/admin/pricing` guarda y refleja cambios en landing (esperar revalidate o forzar)
  - Dashboard `/admin/revenue` muestra pestañas ROI con datos reales
- [ ] **T6.4** Actualizar sitemap si se agregó `/admin/pricing` (no debe estar — es privada, agregar a `disallow` en robots.ts)

---

## Orden de ejecución recomendado

```
T1.1 → T1.2 → T1.3
         ↓
T2.1 → T2.2 → T2.3
         ↓
T3.1 → T3.2 → T3.3
         ↓
T4.1 → T4.2 → T4.3
         ↓
T5.1 → T5.2 → T5.3 → T5.4
         ↓
T6.1 → T6.2 → T6.3 → T6.4
```

T0.1 y T0.2 se hacen antes de todo.
T2.3 (TRM API) puede hacerse en paralelo con T3.x.
T4.x y T5.x pueden hacerse en paralelo una vez T2.x esté listo.

---

## Archivos que se crean / modifican

| Archivo | Acción |
|---|---|
| `supabase/migrations/YYYYMMDD_pricing_config.sql` | CREAR |
| `frontend/src/lib/pricing.ts` | CREAR |
| `frontend/src/app/api/pricing/route.ts` | CREAR |
| `frontend/src/app/api/pricing/trm/route.ts` | CREAR |
| `frontend/src/app/planes/page.tsx` | MODIFICAR (agregar ISR + pasar prop) |
| `frontend/src/app/planes/PlanesClient.tsx` | MODIFICAR (leer desde prop, no hardcoded) |
| `frontend/src/app/admin/pricing/page.tsx` | CREAR |
| `frontend/src/app/admin/revenue/page.tsx` | MODIFICAR (agregar pestañas ROI) |
| `frontend/src/app/admin/layout.tsx` | MODIFICAR (agregar link "Precios" en sidebar) |
| `frontend/src/app/robots.ts` | MODIFICAR (agregar /admin/pricing a disallow) |

**Archivos que NO se tocan:**
- `sitemap.ts` — /admin/pricing es privada, no va en sitemap
- Workflows n8n — no aplica
- Backend — no requiere cambios (los precios los lee el frontend directo de Supabase)

---

## Notas de implementación

- La TRM de referencia inicial es 3.700 COP/USD (editable desde el panel)
- La meta mensual inicial es 1.400.000 COP (editable desde el panel)
- El costo OpenRouter estimado por generación: ~$25 COP (basado en ~$0.039 USD/imagen × 3.700 TRM / 5.8 gen promedio por imagen — ajustar según datos reales)
- ISR revalidate: 3600 (1 hora) — si necesitas cambio inmediato, agregar botón "Forzar revalidación" en el panel que llame a `revalidatePath('/planes')`
- RLS en `pricing_config`: SELECT público (anon key), INSERT/UPDATE/DELETE solo service_role o admin autenticado
