# Implementation Plan: Virtual Try-On SaaS

## Overview

Plan de implementación incremental para el sistema SaaS de probador virtual. Se priorizan funcionalidades core primero, luego features avanzados. Cada tarea construye sobre las anteriores.

## Tasks

- [x] 1. Setup inicial del proyecto
  - Crear estructura de carpetas para backend (Express + TypeScript)
  - Crear estructura de carpetas para frontend (Next.js 14 + TypeScript)
  - Configurar TypeScript, ESLint, Prettier en ambos proyectos
  - Instalar dependencias: Express, Supabase client, bcrypt, jsonwebtoken, multer, axios
  - Instalar dependencias frontend: Next.js, TailwindCSS, axios, @supabase/supabase-js
  - Crear archivos .env con variables de entorno
  - _Requirements: 9.1, 9.4_

- [x] 2. Configurar Supabase y crear schema de base de datos
  - Conectar a Supabase usando credenciales proporcionadas
  - Ejecutar SQL para crear tablas: brands, products, generations
  - Crear tipos enum: plan_type, generation_status
  - Configurar índices y triggers (updated_at)
  - Configurar Row Level Security (RLS) policies
  - Verificar conexión desde backend
  - _Requirements: 1.1, 3.1, 8.1_

- [x] 3. Implementar sistema de autenticación
  - [x] 3.1 Crear módulo de autenticación en backend
    - Implementar registro de marca con hash de contraseña (bcrypt)
    - Implementar login con generación de JWT
    - Crear middleware de validación de JWT
    - Validar unicidad de email y slug
    - _Requirements: 1.1, 1.2, 1.5, 9.2, 9.3, 9.4_
  
  - [ ]* 3.2 Write property test for autenticación
    - **Property 1: Contraseñas hasheadas**
    - **Validates: Requirements 9.4**
  
  - [ ]* 3.3 Write property test for JWT
    - **Property 2: JWT con expiración correcta**
    - **Validates: Requirements 9.2**

- [x] 4. Implementar gestión de marcas (Brands)
  - [x] 4.1 Crear servicio y controlador de brands
    - Endpoint GET /api/brands/me (obtener datos de marca autenticada)
    - Endpoint PATCH /api/brands/me (actualizar configuración visual)
    - Validar formato hexadecimal de colores
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 4.2 Write property test for validación de colores
    - **Property 3: Validación de colores hexadecimales**
    - **Validates: Requirements 4.3**

- [x] 5. Implementar sistema de planes y límites
  - [x] 5.1 Crear configuración de planes (BASIC, PRO)
    - Definir constantes de planes en config/plans.ts
    - Implementar UsageService con métodos checkGenerationLimit y getUsageStats
    - Calcular uso mensual dinámicamente desde tabla generations
    - _Requirements: 2.1, 2.2, 2.6, 8.4_
  
  - [x] 5.2 Crear endpoint GET /api/usage/stats
    - Retornar generaciones usadas/límite del mes actual
    - Retornar productos activos/límite del plan
    - Calcular porcentaje de uso
    - _Requirements: 2.6_
  
  - [x] 5.3 Write property test for límites de plan

    - **Property 1: Límite de productos por plan**
    - **Validates: Requirements 2.1, 2.2, 3.2**
  
  - [ ]* 5.4 Write property test for límites de generaciones
    - **Property 2: Límite de generaciones mensuales**
    - **Validates: Requirements 2.3, 2.4**

- [x] 6. Checkpoint - Verificar autenticación y límites
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implementar CRUD de productos
  - [x] 7.1 Crear servicio y controlador de products
    - Endpoint GET /api/products (listar productos de marca autenticada)
    - Endpoint POST /api/products (crear producto con validación de límite)
    - Endpoint PUT /api/products/:id (editar producto)
    - Endpoint DELETE /api/products/:id (soft delete, mantener generaciones)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 7.2 Write property test for CRUD productos
    - **Property 4: Persistencia de productos**
    - **Validates: Requirements 3.1**
  
  - [ ]* 7.3 Write property test for límite de productos
    - **Property 5: Rechazo al exceder límite de productos**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ]* 7.4 Write unit tests para soft delete
    - Test que generaciones persisten después de eliminar producto
    - _Requirements: 3.5_

- [x] 8. Implementar cliente n8n
  - [x] 8.1 Crear N8nClient con método callTryOnWebhook
    - Configurar URL de webhook y API key desde .env
    - Implementar timeout de 90 segundos
    - Manejar errores de timeout y conexión
    - Enviar payload: brandId, productId, selfieBase64, productImageUrl, prompt
    - _Requirements: 6.1, 6.2, 6.4, 6.5_
  
  - [x] 8.2 Write unit tests para n8n client con mock
    - Test respuesta exitosa
    - Test timeout
    - Test error de n8n
    - _Requirements: 6.2, 6.4_

- [x] 9. Implementar endpoint público de configuración
  - [x] 9.1 Crear endpoint GET /api/pruebalo/:brandSlug
    - Buscar marca por slug (sin autenticación)
    - Retornar configuración visual (logo, colores)
    - Retornar productos activos
    - Retornar 404 si slug no existe
    - _Requirements: 4.4, 5.1, 5.2, 9.6_
  
  - [ ]* 9.2 Write property test para endpoint público
    - **Property 6: Acceso público sin autenticación**
    - **Validates: Requirements 9.6**

- [x] 10. Implementar generación de try-on (core feature)
  - [x] 10.1 Crear endpoint POST /api/pruebalo/:brandSlug/generate
    - Validar marca existe por slug
    - Validar producto existe y pertenece a marca
    - Verificar límites de plan (checkGenerationLimit)
    - Validar archivo: tipo (JPG/PNG/WEBP) y tamaño (max 5MB)
    - Convertir imagen a base64
    - Crear registro en tabla generations (status PENDING)
    - Llamar a n8n con selfieBase64 y prompt
    - Actualizar registro con resultado (SUCCESS/FAILED)
    - Retornar imageUrl al frontend
    - _Requirements: 5.3, 5.6, 5.9, 6.1, 6.2, 6.3, 6.4, 6.6, 8.1, 8.2, 10.1, 10.2, 10.3, 10.5_
  
  - [ ]* 10.2 Write property test para validación de archivos
    - **Property 7: Validación de tipo y tamaño de archivo**
    - **Validates: Requirements 10.1, 10.2, 10.5**
  
  - [ ]* 10.3 Write property test para incremento de contador
    - **Property 8: Incremento de contador por generación exitosa**
    - **Validates: Requirements 6.6, 8.1**
  
  - [ ]* 10.4 Write unit tests para flujo completo
    - Test generación exitosa
    - Test límite excedido (429)
    - Test archivo inválido (400)
    - Test error de n8n (502)
    - _Requirements: 2.3, 2.4, 5.9, 6.4_

- [x] 11. Checkpoint - Verificar generación de try-on
  - Ensure all tests pass, ask the user if questions arise.


- [x] 12. Implementar frontend - Autenticación
  - [x] 12.1 Crear páginas de login y registro
    - Componente LoginForm con validación
    - Componente RegisterForm con validación de slug
    - Servicio auth.service.ts para llamadas a API
    - Hook useAuth para manejo de estado de autenticación
    - Guardar JWT en localStorage
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 12.2 Write unit tests para componentes de auth
    - Test validación de formularios
    - Test manejo de errores
    - _Requirements: 1.1, 1.2_

- [x] 13. Implementar frontend - Dashboard de marca
  - [x] 13.1 Crear layout de dashboard con navegación
    - Sidebar con menú: Productos, Configuración, Uso
    - Header con nombre de marca y logout
    - Proteger rutas con middleware de autenticación
    - _Requirements: 1.3_
  
  - [x] 13.2 Crear página de productos
    - Componente ProductList para mostrar productos
    - Componente ProductForm para crear/editar
    - Validar límite de productos antes de crear
    - Mostrar mensaje cuando se alcanza límite
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [x] 13.3 Crear página de configuración
    - Formulario para editar logo, colores
    - Color picker para colores primario/secundario
    - Preview de cómo se verá el probador
    - _Requirements: 4.1, 4.2_
  
  - [x] 13.4 Crear página de uso/estadísticas
    - Mostrar generaciones usadas vs límite
    - Mostrar productos activos vs límite
    - Barra de progreso visual
    - Fecha de reset mensual
    - _Requirements: 2.6_

- [x] 14. Implementar frontend - Probador público
  - [x] 14.1 Crear página /pruebalo/[brandSlug]
    - Cargar configuración de marca (GET /api/pruebalo/:brandSlug)
    - Aplicar colores y logo de la marca
    - Componente SelfieUploader con drag & drop
    - Validación de archivo en cliente (tipo, tamaño)
    - Preview de selfie antes de generar
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 10.1, 10.2_
  
  - [x] 14.2 Crear componente ProductSelector
    - Grid de productos con imágenes
    - Selección visual de producto
    - Mostrar nombre y categoría
    - _Requirements: 5.5_
  
  - [x] 14.3 Crear componente GenerationLoader
    - Spinner animado durante generación
    - Mensaje: "Esto puede tomar 30-90 segundos"
    - Barra de progreso estimada
    - _Requirements: 5.7_
  
  - [x] 14.4 Crear componente ResultDisplay
    - Mostrar imagen generada
    - Botón de descarga
    - Botón "Probar otro producto"
    - Manejo de errores con mensajes claros
    - _Requirements: 5.8, 5.9_
  
  - [x] 14.5 Integrar flujo completo en TryOnWidget
    - Manejo de estados: upload → select → generating → result
    - Llamada a API de generación
    - Manejo de errores (límite excedido, timeout, etc.)
    - _Requirements: 5.6, 5.9_
  
  - [ ]* 14.6 Write integration tests para flujo de probador
    - Test flujo completo con mock de API
    - Test manejo de errores
    - _Requirements: 5.1, 5.6, 5.9_

- [x] 15. Implementar widget embebible
  - [x] 15.1 Crear página /embed/[brandSlug]
    - Versión simplificada del probador
    - Sin header/footer, solo widget
    - Optimizado para iframe
    - _Requirements: 7.2_
  
  - [x] 15.2 Implementar comunicación postMessage
    - Enviar evento PRUEBALO_COMPLETE al padre
    - Incluir imageUrl y productId en mensaje
    - Adaptar dimensiones responsivamente
    - _Requirements: 7.3, 7.4, 7.5_
  
  - [x] 15.3 Crear generador de código embed
    - Endpoint o página para generar código iframe
    - Incluir brandSlug dinámicamente
    - Documentación de eventos postMessage
    - _Requirements: 7.1_

- [x] 16. Implementar manejo de errores y logging
  - [x] 16.1 Crear middleware de manejo de errores global
    - Capturar errores no manejados
    - Formatear respuestas de error consistentemente
    - Logging de errores en servidor
    - _Requirements: 6.4_
  
  - [x] 16.2 Implementar rate limiting
    - 100 requests por 15 minutos en endpoints públicos
    - Proteger contra abuso
    - _Requirements: 9.6_

- [x] 17. Checkpoint final - Testing end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [-] 18. Optimizaciones y refinamiento
  - [x] 18.1 Optimizar carga de imágenes
    - Compresión de imágenes en cliente antes de subir
    - Lazy loading de productos
    - Compresión en ProductForm para imágenes de productos
    - _Requirements: 10.2_
  
  - [x] 18.2 Mejorar UX de tiempos de espera
    - Mensajes informativos durante generación
    - Estimación de tiempo restante
    - Sistema de fases de progreso
    - Advertencias contextuales
    - _Requirements: 5.7_
  
  - [x] 18.3 Agregar analytics básico

    - Tracking de generaciones por marca
    - Productos más usados
    - _Requirements: 8.3_

- [x] 19. Documentación y deployment
  - [x] 19.1 Crear README con instrucciones de setup
    - Variables de entorno requeridas
    - Comandos de instalación y ejecución
    - Estructura del proyecto
  
  - [x] 19.2 Documentar API endpoints
    - Swagger/OpenAPI spec (opcional)
    - Ejemplos de request/response
  
  - [x] 19.3 Preparar para deployment
    - Configurar scripts de build
    - Variables de entorno de producción
    - Instrucciones de deployment

- [x] 20. Implementar frontend - Panel de Administrador
  - [x] 20.1 Crear página de login de admin
    - Componente AdminLoginForm
    - Autenticación con endpoint /api/admin/auth/login
    - Guardar token de admin en localStorage
    - Redirección a dashboard de admin
  
  - [x] 20.2 Crear layout de dashboard de admin
    - Sidebar con menú: Estadísticas, Marcas
    - Header con nombre de admin y logout
    - Proteger rutas con middleware de autenticación de admin
  
  - [x] 20.3 Crear página de estadísticas globales
    - Mostrar total de marcas registradas
    - Mostrar total de productos en el sistema
    - Mostrar total de generaciones realizadas
    - Gráficos de uso por plan (BASIC vs PRO)
    - Endpoint: GET /api/admin/stats
  
  - [x] 20.4 Crear página de gestión de marcas
    - Listar todas las marcas con sus estadísticas
    - Mostrar plan actual de cada marca
    - Botón para cambiar plan (BASIC ↔ PRO)
    - Mostrar uso de productos y generaciones por marca
    - Endpoint: GET /api/admin/brands
    - Endpoint: PATCH /api/admin/brands/:id/plan

- [-] 21. Implementar sistema de suscripciones - Backend
  - [x] 21.1 Agregar campos de suscripción a tabla brands
    - Agregar columna subscription_start_date (timestamp)
    - Agregar columna subscription_end_date (timestamp)
    - Agregar columna subscription_status (enum: active, expiring_soon, expired, suspended)
    - Agregar columna last_payment_date (timestamp)
    - Agregar columna next_payment_date (timestamp)
    - Migración SQL para actualizar schema
    - _Requirements: 11.1, 11.2_
  
  - [x] 21.2 Crear tabla de historial de pagos
    - Crear tabla subscription_payments con: id, brand_id, amount, currency, payment_date, payment_method, status, notes
    - Índices en brand_id y payment_date
    - _Requirements: 11.14_
  
  - [x] 21.3 Crear SubscriptionService
    - Método checkSubscriptionStatus(brandId): verificar si suscripción está activa
    - Método calculateExpirationDate(startDate): calcular fecha de vencimiento (+30 días)
    - Método renewSubscription(brandId, paymentData): renovar suscripción por 30 días
    - Método suspendSubscription(brandId): cambiar estado a suspended
    - Método getDaysRemaining(brandId): calcular días restantes
    - Método getExpiringSubscriptions(days): obtener suscripciones que vencen en X días
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 11.6, 11.10_
  
  - [x] 21.4 Crear middleware de verificación de suscripción
    - Middleware checkActiveSubscription para proteger endpoints de marca
    - Verificar que subscription_status sea 'active'
    - Si está suspendida, retornar 403 con mensaje de renovación
    - Aplicar a todos los endpoints de marca excepto /api/brands/subscription
    - _Requirements: 11.4, 11.11_
  
  - [x] 21.5 Crear endpoints de gestión de suscripciones
    - GET /api/brands/subscription: obtener estado de suscripción actual
    - GET /api/admin/subscriptions: listar todas las suscripciones con filtros
    - PATCH /api/admin/subscriptions/:brandId/renew: renovar suscripción manualmente
    - PATCH /api/admin/subscriptions/:brandId/suspend: suspender marca
    - PATCH /api/admin/subscriptions/:brandId/reactivate: reactivar marca suspendida
    - POST /api/admin/subscriptions/:brandId/payment: registrar pago manual
    - _Requirements: 11.5, 11.6, 12.4, 12.5, 12.6_
  
  - [x] 21.6 Implementar job de verificación diaria
    - Crear script/cron que se ejecute diariamente
    - Verificar suscripciones que vencen hoy y cambiar estado a 'expired'
    - Cambiar estado a 'expiring_soon' para suscripciones con < 7 días
    - Suspender marcas con suscripción vencida
    - Logging de acciones realizadas
    - _Requirements: 11.3, 11.4_
  
  - [ ]* 21.7 Write property test para cálculo de fechas
    - **Property 9: Fecha de vencimiento siempre es +30 días desde inicio**
    - **Validates: Requirements 11.2, 11.6_
  
  - [ ]* 21.8 Write unit tests para SubscriptionService
    - Test renovación exitosa
    - Test suspensión
    - Test cálculo de días restantes
    - Test obtención de suscripciones por vencer
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 11.6_

- [-] 22. Implementar sistema de notificaciones por email
  - [x] 22.1 Configurar servicio de email
    - Integrar con SendGrid, Mailgun o servicio SMTP
    - Crear EmailService con método sendEmail(to, subject, html)
    - Configurar templates de email con HTML
    - Variables de entorno para credenciales de email
    - _Requirements: 13.1_
  
  - [x] 22.2 Crear templates de email
    - Template de bienvenida con detalles del plan
    - Template de recordatorio 7 días antes (con urgencia baja)
    - Template de recordatorio 3 días antes (con urgencia alta)
    - Template de vencimiento el día de
    - Template de suspensión
    - Template de confirmación de renovación
    - Template de alerta 80% límite de generaciones
    - Template de alerta 100% límite de generaciones
    - Incluir en todos: días restantes, monto, instrucciones de pago
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_
  
  - [x] 22.3 Implementar NotificationService
    - Método sendWelcomeEmail(brand)
    - Método sendExpirationReminder(brand, daysRemaining)
    - Método sendSuspensionNotice(brand)
    - Método sendRenewalConfirmation(brand)
    - Método sendUsageAlert(brand, percentage)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_
  
  - [x] 22.4 Integrar notificaciones en job diario
    - Enviar recordatorios a marcas que vencen en 7 días
    - Enviar recordatorios a marcas que vencen en 3 días
    - Enviar notificación a marcas que vencen hoy
    - Enviar notificación de suspensión a marcas suspendidas
    - _Requirements: 13.2, 13.3, 13.4, 13.5_
  
  - [x] 22.5 Agregar notificaciones de uso
    - Al alcanzar 80% de generaciones, enviar alerta
    - Al alcanzar 100% de generaciones, enviar alerta
    - Verificar en endpoint de generación
    - _Requirements: 13.7, 13.8_
  
  - [x] 22.6 Crear tabla de preferencias de notificaciones
    - Tabla notification_preferences: brand_id, email_enabled, whatsapp_enabled, reminder_7days, reminder_3days, usage_alerts
    - Endpoint PATCH /api/brands/notification-preferences
    - _Requirements: 13.10_
  
  - [ ]* 22.7 Write unit tests para NotificationService
    - Test envío de cada tipo de email
    - Test con mock de servicio de email
    - _Requirements: 13.1-13.8_

- [x] 23. Implementar frontend - Gestión de suscripciones
  - [x] 23.1 Agregar indicador de suscripción en dashboard de marca
    - Badge en header con días restantes
    - Colores: verde (>7 días), amarillo (3-7 días), rojo (<3 días)
    - Click en badge abre modal con detalles
    - _Requirements: 11.10_
  
  - [x] 23.2 Crear página de suscripción para marca
    - Mostrar plan actual y precio en COP
    - Mostrar fecha de inicio y vencimiento
    - Mostrar días restantes con barra de progreso
    - Mostrar historial de pagos
    - Botón "Renovar suscripción" con instrucciones de pago
    - _Requirements: 11.10, 11.14_
  
  - [x] 23.3 Crear modal de suspensión
    - Mostrar cuando marca está suspendida
    - Mensaje claro con instrucciones de renovación
    - Información de contacto para soporte
    - Bloquear acceso a otras páginas del dashboard
    - _Requirements: 11.11_
  
  - [x] 23.4 Agregar página de gestión de suscripciones en admin
    - Tabla con todas las marcas y estado de suscripción
    - Filtros: activa, por vencer, vencida, suspendida
    - Columnas: marca, plan, fecha vencimiento, días restantes, estado
    - Botones de acción: renovar, suspender, reactivar
    - Alertas visuales para suscripciones por vencer
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [x] 23.5 Crear modal de renovación manual en admin
    - Formulario para registrar pago: monto, método, fecha, notas
    - Validación de campos
    - Confirmación antes de renovar
    - Actualizar lista después de renovar
    - _Requirements: 12.4, 11.14_
  
  - [x] 23.6 Agregar reporte de ingresos en admin
    - Página con estadísticas de ingresos mensuales
    - Gráfico de ingresos por mes
    - Desglose por plan (BASIC vs PRO)
    - Total de ingresos del mes actual
    - Proyección de ingresos del próximo mes
    - _Requirements: 12.9_
  
  - [x] 23.7 Mostrar precios en COP en toda la interfaz
    - Actualizar página de planes
    - Mostrar precios en dashboard de marca
    - Mostrar precios en admin
    - Formato: $150.000 COP
    - _Requirements: 2.7_

- [x] 24. Implementar integración con pasarela de pagos (Fase 2 - Opcional)
  - [x] 24.1 Investigar y seleccionar pasarela
    - Evaluar Wompi, PayU, Mercado Pago
    - Comparar comisiones y facilidad de integración
    - Verificar soporte para suscripciones recurrentes
    - Documentar decisión
    - _Requirements: 11 (Opción A)_
  
  - [x] 24.2 Integrar SDK de pasarela seleccionada
    - Instalar SDK en backend
    - Configurar credenciales (API keys)
    - Crear PaymentService con métodos de integración
    - _Requirements: 11 (Opción A)_
  
  - [x] 24.3 Implementar flujo de pago automático
    - Endpoint POST /api/payments/create-subscription: crear suscripción en pasarela
    - Endpoint POST /api/payments/webhook: recibir notificaciones de pago
    - Validar firma de webhook para seguridad
    - Actualizar estado de suscripción al recibir pago exitoso
    - Manejar pagos fallidos
    - _Requirements: 11 (Opción A)_
  
  - [x] 24.4 Crear página de checkout en frontend
    - Formulario de pago integrado con pasarela
    - Redirección a página de confirmación
    - Manejo de errores de pago
    - _Requirements: 11 (Opción A)_
  
  - [x] 24.5 Write integration tests para flujo de pagos
    - Test con mock de pasarela
    - Test webhook de pago exitoso
    - Test webhook de pago fallido
    - _Requirements: 11 (Opción A)_

- [x] 25. Implementar período de prueba gratuito (Fase Inicial - Recomendado)
  - [x] 25.1 Agregar campo trial_end_date a tabla brands
    - Migración SQL para agregar columna
    - Al registrarse, establecer trial_end_date = now() + 7 días y define la cantidad de creditos aproximados basado en los dias que suene atractivo para el cliente, sin gastar mucho
    - _Requirements: 11 (Opción C)_
  
  - [x] 25.2 Modificar lógica de verificación de suscripción
    - Si trial_end_date > now(), permitir acceso sin suscripción activa
    - Mostrar banner "Período de prueba: X días restantes"
    - Al vencer trial, requerir activación por admin
    - _Requirements: 11 (Opción C)_
  
  - [x] 25.3 Agregar indicador de trial en dashboard
    - Badge "Prueba gratuita" en header
    - Contador de días restantes
    - Mensaje al vencer: "Contacta a soporte para activar tu plan"
    - _Requirements: 11 (Opción C)_
  
  - [x] 25.4 Agregar gestión de trials en admin
    - Columna "En prueba" en lista de marcas
    - Filtro para marcas en período de prueba
    - Botón "Activar plan" para convertir trial a suscripción pagada
    - _Requirements: 11 (Opción C)_

- [x] 26. Checkpoint - Sistema de suscripciones
  - Ensure all tests pass, ask the user if questions arise.
  - Verificar que suscripciones se renuevan correctamente
  - Verificar que marcas suspendidas no pueden acceder
  - Verificar que notificaciones se envían en fechas correctas
  - Verificar que admin puede gestionar suscripciones

- [x] 27. Mejoras de UX — Landing y onboarding
  - [x] 27.1 Mejorar página de landing pública
    - Sección hero con CTA directo al registro
    - Sección de precios comparativa (Básico vs Pro) con tabla de features
    - Sección de cómo funciona (3 pasos visuales)
    - Footer con links de contacto y soporte
  - [x] 27.2 Wizard de onboarding post-registro
    - Paso 1: Subir logo de marca
    - Paso 2: Crear primer producto
    - Paso 3: Copiar código embed o ver probador en vivo
    - Guardar progreso en localStorage, mostrar solo si no se completó
    - Botón "Saltar" en cada paso

- [x] 28. Mejoras de UX — Dashboard de marca
  - [x] 28.1 Botón "Ver probador en vivo" en dashboard
    - Botón en header o página de configuración que abra `/pruebalo/{slug}` en nueva pestaña
    - Mostrar URL del probador como texto copiable
  - [x] 28.2 Notificaciones in-app en dashboard
    - Badge en header cuando suscripción vence en menos de 7 días
    - Banner amarillo cuando se alcanza 80% de generaciones del mes
    - Banner rojo cuando se alcanza 100% de generaciones (límite alcanzado)
    - Descartar notificaciones con botón de cierre (persistir en sessionStorage)

- [x] 29. Mejoras de negocio — Conversión y monetización
  - [x] 29.1 Modal de upgrade contextual para funciones Pro
    - Cuando marca BASIC intenta usar función Pro, mostrar modal con precio y beneficios
    - Botón "Solicitar upgrade" que envía email automático al admin con datos de la marca
    - Endpoint POST /api/brands/request-upgrade en backend
  - [x] 29.2 Métricas de conversión en panel admin
    - Sección en dashboard admin: marcas en trial, marcas convertidas, tasa de conversión
    - Gráfico de conversiones por mes
    - Endpoint GET /api/admin/stats/conversion
  - [x] 29.3 Soporte para pagos anticipados con descuento
    - En modal de renovación admin, opción de seleccionar 1, 3 o 6 meses
    - Descuento automático: 3 meses = 5%, 6 meses = 10%
    - Extender subscription_end_date proporcionalmente al período seleccionado

- [x] 30. Mejoras técnicas — Estabilidad y rendimiento
  - [x] 30.1 Health check mejorado con estado de servicios
    - Endpoint GET /api/health que reporte estado de Supabase, n8n y servicio de email
    - Respuesta con latencia de cada servicio y estado (ok / degraded / down)
    - Útil para monitoreo en producción
  - [x] 30.2 Rate limiting por brandSlug en generaciones
    - Límite de 10 generaciones por hora por brandSlug (independiente del límite mensual)
    - Protege contra abuso de un solo usuario en el probador de una marca
    - Retornar 429 con mensaje claro y tiempo de espera
  - [x] 30.3 Caché de configuración pública del probador
    - Caché en memoria (Map con TTL de 5 minutos) para GET /api/marca/:brandSlug
    - Invalidar caché cuando la marca actualiza su configuración (PATCH /api/brands/me)
    - Reducir carga en Supabase cuando una marca tiene alto tráfico

- [x] 31. Sistema anti-abuso de trials por campaña
  - [x] 31.1 Crear tablas SQL de campañas de trial
    - Tabla `trial_campaigns`: id, name, active, trial_days, ends_at, created_by, created_at
    - Tabla `trial_registrations`: id, brand_id, campaign_id, ip_address, fingerprint, created_at
    - Índices en ip_address, fingerprint y created_at
    - _Requirements: 31_
  - [x] 31.2 Crear controlador de campañas de trial (admin)
    - GET /api/admin/trial-campaign — listar campañas
    - POST /api/admin/trial-campaign — crear campaña
    - PATCH /api/admin/trial-campaign/:id — activar/desactivar campaña
    - GET /api/trial/status — estado público (sin auth) para el frontend
    - _Requirements: 31_
  - [x] 31.3 Modificar auth.service.ts para verificar campaña activa
    - Si no hay campaña activa: trial_end_date = null, trial_generations_limit = 0
    - Si hay campaña activa: verificar IP y fingerprint contra trial_registrations
    - Si hay abuso (IP o fingerprint ya registrado en últimos 30 días): lanzar TRIAL_ABUSE
    - Registrar IP + fingerprint en trial_registrations al crear cuenta con trial
    - _Requirements: 31_
  - [x] 31.4 Manejar error TRIAL_ABUSE en auth.controller.ts
    - Retornar 429 con error TRIAL_ABUSE y mensaje descriptivo
    - _Requirements: 31_
  - [x] 31.5 Agregar rutas de campaña de trial en admin.routes.ts
    - Protegidas con requirePermission('settings')
    - Ruta pública GET /api/trial/status registrada en app.ts
    - _Requirements: 31_
  - [x] 31.6 Crear página admin /admin/trial-campaign
    - Crear, activar y desactivar campañas desde el dashboard
    - Historial de campañas anteriores
    - _Requirements: 31_
  - [x] 31.7 Agregar fingerprint en RegisterForm.tsx
    - Instalar @fingerprintjs/fingerprintjs en frontend
    - Generar visitorId al cargar el formulario de registro
    - Enviar fingerprint junto con los datos de registro al backend
    - _Requirements: 31_
  - [x] 31.8 Mostrar estado del trial en RegisterForm.tsx
    - Consultar GET /api/trial/status al cargar el formulario
    - Mostrar banner verde con días de prueba si hay campaña activa
    - Cambiar texto del botón según estado del trial
    - Mostrar enlace a /planes si se detecta TRIAL_ABUSE
    - _Requirements: 31_

- [x] 32. Rediseño visual del dashboard — paleta corporativa + Dark/Light mode + responsive móvil
  - [x] 32.1 Aplicar paleta corporativa al layout del dashboard
    - Reemplazar todos los colores indigo/gray/white por `#0a0a0a`, `#f5f2ee`, `#FF5C3A`
    - Tipografía: Syne para headings, DM Sans para body (consistente con landing)
    - Sidebar, header, cards y tablas con la nueva paleta
    - Sin emojis — usar iconos SVG inline o lucide-react
    - _Archivos: dashboard/layout.tsx, sidebar, header_
  - [x] 32.2 Implementar selector Dark/Light mode
    - Agregar toggle Dark/Light en el header del dashboard
    - Persistir preferencia en localStorage
    - Dark mode: fondo `#0a0a0a`, cards `#141414`, bordes `#2a2a2a`
    - Light mode: fondo `#f5f2ee`, cards `#ffffff`, bordes `#e0dcd7`, texto `#0a0a0a`
    - Usar CSS variables o clase `dark` en el `<html>` para el cambio
    - _Archivos: layout.tsx, globals.css, ThemeToggle component_
  - [x] 32.3 Verificar y corregir responsive para móvil
    - Sidebar colapsable en móvil (drawer/overlay)
    - Tablas con scroll horizontal en pantallas pequeñas
    - Cards de estadísticas en grid 1 columna en móvil, 2-3 en desktop
    - Formularios con padding y tamaños de fuente adecuados en móvil
    - Botones con tamaño mínimo de 44px para touch
    - _Breakpoints: sm (640px), md (768px), lg (1024px)_
  - [x] 32.4 Aplicar paleta a páginas internas del dashboard
    - Página de productos (lista, formulario crear/editar)
    - Página de configuración de marca (color picker, logo)
    - Página de uso/estadísticas (barras de progreso, métricas)
    - Página de suscripción (estado, historial de pagos)
    - Página de embed (código generado, preview)
  - [x] 32.5 Aplicar paleta al panel de administrador
    - Dashboard admin: estadísticas globales, gráficos
    - Página de marcas (tabla, filtros, acciones)
    - Página de suscripciones admin
    - Página de trial-campaign
    - Página de ingresos/reportes

- [x] 33. Mini-landing por cliente en probador.wilkiedevs.com/[slug]
  - [x] 33.1 Diseñar estructura de la mini-landing
    - Ruta: `probador.wilkiedevs.com/[slug]` (extender la ruta pública existente)
    - Secciones: hero con nombre/logo de marca, descripción, galería de productos, probador virtual embebido, CTA de contacto/compra
    - La mini-landing usa los datos ya existentes de la marca (logo, colores, productos)
    - Campos adicionales opcionales: descripción de marca, redes sociales, WhatsApp de contacto, banner/imagen de portada
    - _Backend: agregar campos a tabla brands: brand_description, whatsapp_contact, cover_image_url, social_links (jsonb)_
  - [x] 33.2 Agregar campos de mini-landing en backend
    - Migración SQL: agregar columnas brand_description, whatsapp_contact, cover_image_url, social_links a tabla brands
    - Endpoint PATCH /api/brands/me ya existente — extender para aceptar nuevos campos
    - Endpoint GET /api/pruebalo/:brandSlug — incluir nuevos campos en respuesta pública
    - _Archivos: brands.controller.ts, brands.service.ts_
  - [x] 33.3 Crear página de mini-landing pública
    - Componente `MiniLanding` en `/pruebalo/[brandSlug]/page.tsx`
    - Aplicar colores de la marca (primary_color, secondary_color) como variables CSS
    - Sección hero: cover_image o fondo con color de marca, logo, nombre
    - Sección productos: grid de productos con imagen y nombre
    - Sección probador: widget embebido (iframe a `/embed/[brandSlug]`) o inline
    - Sección contacto: botón WhatsApp si whatsapp_contact está configurado
    - SEO básico: meta title y description con nombre de la marca
    - _Archivos: frontend/src/app/pruebalo/[brandSlug]/page.tsx_
  - [x] 33.4 Agregar configuración de mini-landing en dashboard de marca
    - Nueva sección "Mi página" en el dashboard
    - Formulario para editar: descripción, WhatsApp, imagen de portada
    - Preview en tiempo real de cómo se verá la mini-landing
    - Botón "Ver mi página" que abre `probador.wilkiedevs.com/[slug]` en nueva pestaña
    - URL copiable con un clic
    - _Archivos: dashboard/mi-pagina/page.tsx_
  - [x] 33.5 Implementar cobro de setup fee en checkout
    - Agregar opción "Incluir creación de mini-landing" en página `/checkout`
    - Setup fee: $500.000 COP (pago único, solo primera vez)
    - Campo booleano `has_landing_page` en tabla brands
    - Si `has_landing_page = false`, mostrar la mini-landing con banner "Activa tu página — $500.000"
    - Si `has_landing_page = true`, mini-landing completamente funcional y sin banners
    - Admin puede activar manualmente desde panel de marcas
    - _Archivos: checkout/page.tsx, brands tabla, admin panel_
  - [x] 33.6 Configurar dominio y SEO
    - Verificar que `probador.wilkiedevs.com/[slug]` resuelve correctamente en producción
    - Agregar sitemap dinámico con todas las mini-landings activas
    - Open Graph tags para compartir en redes sociales (imagen de portada, nombre de marca)
    - _Archivos: app/sitemap.ts, layout de pruebalo_

- [x] 34. Configurar Git y deploy en Hostinger
  - [x] 34.1 Inicializar repositorio Git y configurar .gitignore
    - `git init` en la raíz del proyecto `Mostrador_wilkiedevs/`
    - Crear `.gitignore` que excluya: `node_modules/`, `.env`, `.env.local`, `dist/`, `.next/`, `build/`, `*.log`, `.DS_Store`
    - Primer commit con todo el código fuente
    - Crear repositorio en GitHub/GitLab y hacer push inicial
    - _Archivos: .gitignore_
  - [x] 34.2 Preparar variables de entorno para producción
    - Documentar todas las variables de entorno requeridas (backend y frontend)
    - Crear `.env.example` con nombres de variables sin valores sensibles
    - Verificar que ningún secreto esté commiteado en el repo
    - _Archivos: backend/.env.example, frontend/.env.example_
  - [x] 34.3 Configurar scripts de build para producción
    - Backend: verificar `npm run build` genera `dist/` correctamente
    - Frontend: verificar `npm run build` genera `.next/` correctamente
    - Agregar script `start` en backend para producción (`node dist/index.js`)
    - Documentar comandos de deploy en README
    - _Archivos: backend/package.json, frontend/package.json_
  - [ ] 34.4 Deploy del backend en Hostinger (Node.js)
    - Subir código del backend vía Git o SFTP
    - Configurar variables de entorno en panel de Hostinger
    - Instalar dependencias: `npm install --production`
    - Ejecutar build: `npm run build`
    - Configurar proceso Node.js persistente (PM2 o similar)
    - Verificar que el backend responde en la URL de producción
    - _Requiere acceso a Hostinger_
  - [ ] 34.5 Deploy del frontend en Hostinger (Next.js)
    - Subir código del frontend vía Git o SFTP
    - Configurar variables de entorno de producción (NEXT_PUBLIC_API_URL, etc.)
    - Ejecutar build: `npm run build`
    - Configurar servidor para servir la app Next.js
    - Verificar que el frontend carga correctamente en producción
    - _Requiere acceso a Hostinger_
  - [ ] 34.6 Configurar dominio y HTTPS
    - Apuntar dominio principal al frontend
    - Apuntar subdominio API al backend (ej. `api.wilkiedevs.com`)
    - Verificar certificados SSL activos
    - Actualizar CORS en backend para aceptar el dominio de producción
    - _Requiere acceso a Hostinger y configuración DNS_

## Notes

- Tasks marcados con `*` son opcionales y pueden omitirse para MVP más rápido
- Cada checkpoint asegura que el sistema funciona antes de continuar
- Property tests validan propiedades universales con datos aleatorios (min 100 iteraciones)
- Unit tests validan casos específicos y edge cases
- Prioridad: Core features primero (auth, productos, generación), luego features avanzados (widget, analytics)
- **Sistema de suscripciones:** Se recomienda empezar con Opción C (período de prueba + activación manual) para MVP, luego migrar a Opción A (pagos automáticos) en Fase 2
- **Precios en COP:** Todos los precios deben mostrarse en pesos colombianos con formato $XXX.XXX COP
- **Mejoras post-MVP (tasks 27-30):** Implementar una a una según prioridad de negocio
