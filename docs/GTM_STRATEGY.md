# Lookitry - Go-to-Market Strategy

**Versión:** 1.0  
**Fecha:** Abril 2026  
**Estado:** En construcción  
**Objetivo:** Documentar la estrategia de lanzamiento comercial de Lookitry

---

## 1. Posicionamiento

### Mensaje Principal
"Lookitry es el probador virtual con IA que reduce devoluciones y aumenta ventas en tiendas de moda ecommerce de Latinoamérica."

### Propuesta de Valor
- **Para el retailer:** Reduce el 30% de devoluciones por falta de visualización, aumenta la conversión en fichas de producto.
- **Para el cliente final:** Se prueba la ropa desde su celular, sin apps, en 12 segundos.

### Diferenciación
- Algo específico para fisionomía latina (modelos entrenados con cuerpos latinoamericanos)
- Widget ligero que se instala en menos de 10 minutos
- Integración con WooCommerce y WordPress (no requiere desarrollo)

---

## 2. Canales de Adquisición

### Prioritarios
| Canal | Objetivo | Métrica principal |
|-------|----------|-------------------|
| SEO / Blog | Atwoodes conscientes | Tráfico orgánico, leads |
| Email marketing | nurturing de leads | Open rate, conversión |
| Referidos | amplify word-of-mouth | Invitaciones convertidas |
| Partnerships | canales B2B | Tiendas creadas por partner |

### Secundarios
- Redes sociales (Instagram, TikTok)
- Webinars/workshops sobre ecommerce moda
- Directorios de apps (WooCommerce, Shopify futuro)

---

## 3. Plan de Lanzamiento

### Fase 1: Lanzamiento Beta → GA (Abril 2026)
- **Objetivo:** Convertir 120 marcas beta a planes pagos
- **Canales:** Email directo, WhatsApp, llamadas
- **Oferta:** 20% descuento primer año para betas que conviertan en primeros 30 días

### Fase 2: Escalamiento (Mayo - Junio 2026)
- **Objetivo:** 50 nuevas tiendas activas
- **Canales:** SEO, contenido, ads locales (Colombia)
- **Oferta:** Trial de 7 días pagado ($20.000 COP)

### Fase 3: Expansión (Julio 2026+)
- **Objetivo:** Expandir a otros mercados Latam
- **Canales:** Partners, marketplace listings, influencer marketing
- **Oferta:** Freemium limitado para evaluación

---

## 4. Calendario de Comunicación

| Fecha | Actividad | Canal |
|-------|-----------|-------|
| 03/04/2026 | Comunicación de lanzamiento a betas | Email directo |
| 05/04/2026 | Anuncio en landing principal | Web |
| 07/04/2026 | Post lanzamiento | Instagram, TikTok |
| 14/04/2026 | Webinar/demo para retailers | Zoom |
| 21/04/2026 | Caso de éxito publicado | Blog |

---

## 5. Ofertas de Lanzamiento

### Early Adopter Discount
- **Qué:** 20% descuento anual
- **Para:** Beta testers que conviertan en primeros 30 días
- **Válido hasta:** 30 de Abril 2026

### Referral Bonus
- **Qué:** 1 mes gratis para el referidor y el referido
- **Para:** Cualquier cliente existente que refiera nuevo pago
- **生效:** Permanente

### Trial Pagado
- **Qué:** $20.000 COP por 7 días
- **Incluye:** 15 generaciones, acceso full
- **Objetivo:** Qualificar leads antes de comprometer dinero

---

## 6. Métricas de Éxito

| Métrica | Objetivo Abril 2026 | Objetivo Junio 2026 |
|---------|--------------------|--------------------|
| Tiendas activas | 50 | 150 |
| MRR | $8M COP | $25M COP |
| Trial → Paid | 30% | 25% |
| NPS | >50 | >60 |
| Churn mensual | <5% | <4% |

---

## 7. Responsabilidades

| Área | Responsable | Tareas |
|------|-------------|--------|
| Producto | Sam Wilkie | Widget, integraciones |
| Marketing | (pendiente) | Contenido, ads |
| Ventas | (pendiente) | Contacto betas, cierre |
| CS | (pendiente) | Onboarding, soporte |

---

## 8. Notas

- Este documento se actualiza semanalmente
- Revisión: cada lunes
- Owner: Sam Wilkie

---

## 9. Implementación Técnica (Abril 2026)

### Items Completados
| Item | Estado | Archivo |
|------|--------|---------|
| Estrategia de comunicación | ✅ Documento GTM | `docs/GTM_STRATEGY.md` |
| Redes sociales unificadas | ✅ Configuradas | `frontend/src/services/public-config.service.ts` |
| Programa de referidos | ✅ Backend + Frontend | `backend/src/controllers/referral.controller.ts`, `frontend/src/app/dashboard/referral/page.tsx`, `supabase/migrations/20260403_referrals_program.sql` |
| Sistema Email Campaigns (Brevo) | ✅ Backend + Frontend | `backend/src/services/brevo-campaign.service.ts`, `backend/src/services/email-campaign.service.ts`, `frontend/src/app/admin/email-campaigns/page.tsx`, `supabase/migrations/20260405_email_campaigns.sql` |
| Tabla de referidos en DB | ✅ Migración SQL | `supabase/migrations/20260403_referrals_program.sql` |

### Pendiente
- [ ] Ejecutar campaña de email a betas
- [ ] Activar cuenta de Instagram con contenido
- [ ] Configurar TikTok
- [ ] Revisar cupón LOOKITRY20 en el checkout