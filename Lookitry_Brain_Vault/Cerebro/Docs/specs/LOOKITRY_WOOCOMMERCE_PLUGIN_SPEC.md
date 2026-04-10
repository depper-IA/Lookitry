# Lookitry for WooCommerce - Spec Operativo

**Version:** 2.0  
**Estado:** Beta comercial en ejecucion  
**Ultima actualizacion:** 31 de Marzo 2026 (Auditoría Técnica Finalizada)  
**Objetivo del documento:** seguimiento semanal de lo implementado, pendientes, riesgos y decisiones para lanzar el Plugin MVP de WooCommerce con impacto en ingresos y retencion.


---

## Estado de auditoria tecnica (plugin + backend)

**Corte de auditoria:** Marzo 2026  
**Alcance auditado:** `lookitry-woocommerce`, `backend`, `frontend/dashboard/integrations`

### Resultado ejecutivo

- Integracion base plugin-backend: **100% funcional**.
- Modelo comercial (plugin no gratuito): **alineado a nivel tecnico** (API key + limites por plan).
- Riesgo principal (upsert): **Mitigado** (Constraint único `brand_id, external_id` verificado en producción).
- Estado general: **Listo para escala comercial controlada**.


---

## 1) Contexto y estado actual

Este documento reemplaza la version estrategica/conversacional anterior y se enfoca en ejecucion.

- **Fuente de verdad funcional:** `CHANGELOG_GEMINI.md` (implementaciones reales).
- **Fuente de verdad de prioridad:** `docs/ROADMAP.md` (beta comercial).
- **Alcance actual del plugin:** integracion WooCommerce en fase MVP, acoplada al backend principal de Lookitry (misma cuenta, misma bolsa de uso, misma suscripcion).

---

## 2) Modelo comercial vigente (sin ambiguedad)

### Decision activa

El plugin **no se maneja como producto gratuito con uso libre**.  
El acceso al valor (generaciones IA y operacion real) requiere:

- trial pagado, o
- plan activo (BASIC/PRO o superior), segun configuracion comercial vigente.

### Decision descartada

Queda descartada para seguimiento operativo la narrativa de:

- plugin gratis + generaciones gratis como estrategia principal de adquisicion.

Si en el futuro se reactiva algun esquema freemium, debe abrirse como experimento nuevo con metricas y fecha de inicio/cierre.

---

## 3) Capacidades implementadas (checklist)

> Estado basado en cambios documentados en marzo 2026.

### Base de integracion y plataforma

- [x] Dashboard de integraciones activo y sin terminologia tecnica confusa para el usuario final.
- [x] Flujo comercial movido a enfoque beta cobrable (copys y CTAs de prueba paga).
- [x] Endpoints de embed preparados para interoperar con sitios externos (incluyendo escenario WooCommerce).
- [x] Correccion backend en actualizacion de productos para mapear `externalId -> external_id`.
- [x] Dominio/plataforma consolidado en `lookitry.com` y coherencia de entornos productivos.

### Cobros y operacion comercial (dependencia critica para plugin)

- [x] Checkout PayPal real habilitado en dashboard (sin flujo manual por WhatsApp).
- [x] Flujo de registro post-pago reforzado para evitar bloqueos por slug y mejorar conversion.
- [x] Varias correcciones de prorrateo, autenticacion y consistencia de checkout ya aplicadas.

### Seguridad y confiabilidad transversal

- [x] Endurecimiento de seguridad y CSP aplicado en backend/frontend/widget.
- [x] Ajustes de CORS y politicas para soportar integraciones externas controladas.

---

## 3.1) Auditoria ejecutable por componente (estado real)

### Plugin WooCommerce (`lookitry-woocommerce`)

- [x] Settings admin para API key (`lookitry_api_key`) operativo.
- [x] Validacion de API key contra backend (`/api/pruebalo/validate-api-key`).
- [x] Carga de catalogo Woo local por AJAX.
- [x] Sync de productos al backend (`/api/pruebalo/sync-woocommerce`).
- [x] Inyeccion de boton try-on en `woocommerce_after_add_to_cart_button`.
- [x] Modal + iframe con init seguro (`/api/embed/wordpress/init`).
- [x] Control de activacion/desactivacion por producto habilitado desde panel Admin de Lookitry.
- [x] Telemetria tecnica del plugin (errores de red, retries, tiempos de respuesta).

### Backend (`backend`)

- [x] Migracion `brands.api_key` aplicada.
- [x] Migracion `products.external_id` aplicada.
- [x] Endpoint de validacion de API key operativo.
- [x] Endpoint de consulta de productos sincronizados operativo.
- [x] Endpoint de sync WooCommerce operativo.
- [x] Endpoint de inicializacion embed WordPress operativo.
- [x] Resolucion de producto por `external_id` operativa.
- [x] Normalizacion de uso de API key por header implementada en plugin y backend (con compatibilidad legacy temporal).
- [x] Constraint unico `(brand_id, external_id)` aplicado y verificado en base de datos productiva.


### Dashboard / Frontend integraciones (`frontend`)

- [x] Vista de integraciones con API key expuesta al owner.
- [x] Flujo guiado de instalacion WooCommerce documentado en UI.
- [x] Vista de estado conectada a `/health`.
- [x] Nueva opcion en panel admin para control WooCommerce centralizado por marca/producto.
- [x] Eliminar datos mock/estaticos en status (carga %, incidentes hardcodeados).
- [x] Mostrar metricas reales por tienda/plugin (syncs, errores, latencia, productos activos).

---

## 4) Capacidades pendientes priorizadas (MVP plugin)

## Corto plazo (0-6 semanas)

- [ ] Definir y cerrar contrato tecnico del plugin (versionado de API, errores estandar, limites, timeouts).
- [ ] Publicar flujo completo de autenticacion por API key para WordPress (emision, rotacion, revocacion, auditoria).
- [ ] Cerrar sincronizacion minima de catalogo WooCommerce con mapeo estable por `external_id`.
- [ ] Definir reglas de activacion por producto (slots) en backend y su reflejo en plugin.
- [ ] Telemetria minima por tienda: activaciones, uso del boton, generaciones, fallos de integracion.

## Mediano plazo (6-16 semanas)

- [ ] Sincronizacion incremental de catalogo y reintentos robustos.
- [ ] Observabilidad por merchant (health por tienda, errores frecuentes, latencia por endpoint).
- [ ] Experiencia de soporte dentro del dashboard para merchants con plugin.

---

## 5) Arquitectura funcional objetivo (MVP)

### 5.1 Autenticacion y seguridad

- Credencial de integracion por marca (`api_key`) gestionada desde dashboard.
- Firma/validacion de peticiones para evitar uso indebido de creditos por terceros.
- Logs de uso por tienda para detectar abuso y facilitar soporte.

### 5.2 Mapeo de productos externos

- El plugin usa ID de WooCommerce y lo vincula con producto interno via `external_id`.
- Toda operacion del probador debe resolver esa correspondencia antes de generar.

### 5.3 Inyeccion UI en WooCommerce

- Inyeccion del boton del probador en hooks de producto (ejemplo: `woocommerce_after_add_to_cart_button`).
- Configuracion de estilo basica desde plugin para no requerir cambios de codigo en la tienda.

### 5.4 Integracion con ecosistema Lookitry

- Una sola identidad de marca entre dashboard, mini-landing e integraciones.
- El consumo se descuenta de la misma suscripcion activa.

---

## 6) KPIs de seguimiento del plugin

## Activacion e implementacion

- **Tiendas con plugin instalado** (semanal).
- **Tiendas activas** (al menos 1 producto mapeado y boton activo).
- **Tiempo a primera activacion** (desde instalacion a primer uso real).

## Uso y valor

- **Uso del boton de probador** por tienda y por producto.
- **Generaciones exitosas** por tienda.
- **Tasa de error de generacion** y causas principales.

## Negocio

- **Conversion a plan pago** desde trial pagado.
- **Expansion de slots/productos activos** por tienda.
- **Retencion 30/60 dias** de tiendas con plugin activo.

---

## 7) Riesgos y decisiones abiertas

### Riesgos actuales

- Dependencia de estabilidad de checkout/onboarding para no romper activacion comercial.
- Falta de contrato formal de API del plugin puede generar deuda tecnica temprana.
- Sin observabilidad por tienda se eleva costo de soporte y diagnostico.
- Riesgo de inconsistencia en sincronizacion masiva si no existe constraint unico compuesto en DB.
- Riesgo de exposicion accidental de credenciales al usar API key en query params heredados.

### Decisiones abiertas (resolver en este ciclo)

- Definir politica final de slots (limites, rotacion, UX en dashboard/plugin).
- Definir forma de mostrar ROI al merchant (dashboard Lookitry, plugin, o ambos).
- Definir estrategia de lanzamiento inicial (piloto cerrado vs salida abierta controlada).

---

## 8) Hitos 30-60 dias

## Hito 1 - Base tecnica y comercial cerrada (Semanas 1-2)

- Contrato de API plugin definido.
- Flujo API key completo (crear/rotar/revocar).
- Checklist QA de checkout + onboarding sin bloqueantes.
- Constraint unico `(brand_id, external_id)` aplicado y validado en ambiente productivo.

## Hito 2 - MVP funcional en tiendas piloto (Semanas 3-4)

- Sync basico de catalogo activo.
- Activacion de probador en producto WooCommerce funcionando end-to-end.
- Telemetria minima disponible por merchant.

## Hito 3 - Validacion de conversion y retencion (Semanas 5-8)

- Reporte semanal de KPIs del plugin.
- Ajustes de UX/comercial basados en datos reales.
- Decision go/no-go para ampliar rollout.

---

## 9) Definicion de "MVP listo"

El Plugin MVP se considera listo cuando:

- permite autenticar tienda con API key valida;
- mapea y activa productos con `external_id` sin errores criticos;
- genera imagenes de forma estable en tiendas piloto;
- reporta metricas minimas de uso/error por tienda;
- opera bajo modelo comercial pago sin contradicciones de mensaje en producto/documentacion.

---

## 10) Plan de fixes tecnicos priorizados (accionable)

## Prioridad P0 (antes de escalar tiendas)

- [x] **DB hardening sync Woo:** Constraint único e índice `(brand_id, external_id)` aplicado y validado en entorno productivo.

- [x] **Compatibilidad de API key:** backend y plugin unificados para flujo principal por header.
- [x] **Seguridad de transporte de key:** endpoints plugin migrados a `x-api-key` con compatibilidad temporal de query param.

## Prioridad P1 (operacion piloto robusta)

- [x] **Status real por tienda:** reemplazar bloques mock en dashboard de estado por datos reales.
- [x] **Observabilidad plugin:** logging minimo de errores de sync/init y tiempos de respuesta por tienda.
- [x] **QA E2E Woo:** pruebas guiadas (instalar plugin -> validar key -> sync -> abrir modal -> generar).

## Prioridad P2 (post-piloto, crecimiento)

- [ ] **Gestion de slots en plugin:** UX de activacion/desactivacion por producto y rotacion.
- [ ] **Retry inteligente de sync:** reintentos con backoff para fallos transitorios.
- [ ] **Reporte semanal automatico:** activacion, uso, errores, retencion 30/60 dias.
