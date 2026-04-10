# Esquema Detallado de Base de Datos - Lookitry

Este documento contiene la estructura exacta y actual de la base de datos de Supabase para Lookitry, obtenida mediante introspeccion directa del sistema.

## Tablas Principales (Core)

### brands
Gestion de marcas, suscripciones y configuracion del widget.
- `id`: uuid (PK)
- `name`, `slug`, `email`, `password`
- `plan`: enum (BASIC, PRO, TRIAL, ENTERPRISE, LANDING)
- `subscription_status`: enum (active, expiring_soon, expired, suspended, trial)
- `subscription_start_date`, `subscription_end_date`: timestamptz
- `logo`, `logo_light`, `logo_dark`: text (URLs MinIO)
- `primary_color`, `secondary_color`: text (Hex)
- `has_landing_page`: boolean
- `landing_template`: enum (classic, editorial, probador, moderno)
- `extra_credits_balance`: integer (Creditos comprados adicionales)
- `referral_code`: varchar (Codigo para programa de referidos)

### products
Catalogo de productos de las marcas.
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands)
- `name`, `description`, `category`, `image_url`
- `price`: integer (Soporta COP)
- `is_active`: boolean (Control de limites de plan)
- `badge`: enum (nuevo, top, oferta)

### generations
Historial de pruebas virtuales (Try-On).
- `id`: uuid (PK)
- `brand_id`: uuid (FK -> brands)
- `product_id`: uuid (FK -> products)
- `selfie_url`, `result_image_url`: text
- `status`: enum (PENDING, SUCCESS, FAILED)
- `prompt_used`: text (Prompt final tras enriquecimiento RAG)
- `processing_time`: integer (ms)

---

## IA y Sistema RAG

### generation_feedback
Base de conocimiento de errores para aprendizaje de la IA.
- `id`: uuid (PK)
- `generation_id`: uuid (FK -> generations)
- `error_type`: enum (distorsion, color, etc)
- `embedding`: vector(768) - Gemini-embedding-001
- `description`: text

### project_knowledge
RAG para documentacion del proyecto (Agentes).
- `id`: uuid (PK)
- `file_path`, `content`, `content_hash`: text
- `embedding`: vector(768)

---

## Pagos y Suscripciones

### subscription_payments
Historial de transacciones completadas.
- `brand_id`: uuid (FK)
- `amount`: numeric
- `currency`: text (Default 'COP')
- `status`: text (completed, pending, failed)
- `months_paid`: integer (1-24)
- `reference`: text (ID de pasarela)

### payment_logs
Auditoria detallada de eventos de pasarelas.
- `gateway`: enum (wompi, paypal, manual)
- `payload`: jsonb (Respuesta cruda de la API)
- `status`: text

---

## Marketing y Ventas (CRM)

### leads
Prospectos extraidos mediante automatizacion.
- `name`, `business_type`, `email`, `phone`, `website`
- `city`, `country`: text
- `social_verification_score`: integer (Calidad del lead)
- `status`: enum (new, qualified, contacted, interested, client)

### email_campaigns
Gestion de envios masivos.
- `name`, `subject`, `html_template`
- `status`: enum (draft, scheduled, processing, completed)
- `filter_type`: text (Criterio de segmentacion)

---

## Administracion y Soporte

### admins
- `email`, `password`, `role`
- `permissions`: text[] (Permisos granulares)

### admin_notifications
- `type`, `title`, `message`
- `severity`: text (info, warning, error)

---

## Configuracion Dinamica

### pricing_config
- `id`: text (basic, pro, landing, metas, operativos)
- `data`: jsonb (Precios y limites)

### payment_settings
Configuracion global de llaves y modos de prueba de Wompi/PayPal.
