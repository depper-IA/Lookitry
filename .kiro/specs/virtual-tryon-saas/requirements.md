# Requirements Document - Virtual Try-On SaaS

## Introduction

Sistema SaaS B2B de probador virtual de ropa/merch mediante IA. Permite a marcas ofrecer a sus clientes finales la experiencia de "probarse" productos virtualmente mediante selfies y generación de imágenes con IA.

## Glossary

- **Brand**: Empresa/marca cliente que contrata el servicio SaaS
- **End_User**: Cliente final de la marca que usa el probador virtual
- **Try_On_System**: Sistema completo de probador virtual
- **Virtual_Try_On_Engine**: Motor de IA que genera las imágenes (vía n8n + OpenRouter)
- **Widget**: Componente embebible del probador en sitios externos
- **Generation**: Proceso de crear una imagen de try-on (cuenta para límites de plan)
- **Plan**: Nivel de membresía de la marca (Básico o Pro)
- **Subscription**: Suscripción mensual de una marca al servicio
- **Subscription_Status**: Estado de suscripción (active, expiring_soon, expired, suspended)
- **Payment_Gateway**: Pasarela de pagos para procesar suscripciones (Wompi, PayU, Mercado Pago)
- **Renewal**: Renovación de suscripción por 30 días adicionales
- **Suspension**: Bloqueo temporal de acceso por falta de pago
- **COP**: Peso colombiano (moneda)

## Requirements

### Requirement 1: Gestión de Cuentas de Marca

**User Story:** Como marca, quiero crear y gestionar mi cuenta en el sistema, para poder configurar mi probador virtual y controlar mi uso.

#### Acceptance Criteria

1. WHEN una marca se registra, THE Try_On_System SHALL crear una cuenta con email, contraseña, nombre de marca y slug único
2. WHEN una marca inicia sesión, THE Try_On_System SHALL validar credenciales y generar token de autenticación
3. WHEN una marca accede a su dashboard, THE Try_On_System SHALL mostrar información de su plan actual y uso
4. THE Try_On_System SHALL asignar automáticamente el Plan Básico a nuevas marcas
5. WHEN se crea un slug de marca, THE Try_On_System SHALL validar que sea único y válido para URLs

### Requirement 2: Sistema de Planes y Límites

**User Story:** Como administrador del sistema, quiero controlar el uso mediante planes de membresía, para monetizar el servicio de forma escalable.

#### Plan Básico (Colombia)
- **Precio:** 150.000 COP al mes
- **Enfoque:** Marcas pequeñas que venden por Instagram/WhatsApp sin web o con web muy básica
- **Incluye:**
  - 1 probador virtual con URL propia (tryon.midominio.com/slug-marca o subdominio)
  - Hasta 5 productos estrella en el probador
  - Hasta 400 imágenes generadas por mes
  - Branding básico: logo, colores, textos principales
  - Botón de contacto a WhatsApp/Instagram
  - Soporte básico por WhatsApp/email
- **Objetivo:** Ser una "campaña de probador virtual" accesible para marcas pequeñas

#### Plan Pro (Colombia)
- **Precio:** 250.000–300.000 COP al mes
- **Enfoque:** Marcas que ya venden online con más volumen (tienda propia o marketplace)
- **Incluye:**
  - Todo lo del Plan Básico
  - Hasta 15 productos en el probador
  - Hasta 1200 imágenes generadas por mes
  - Branding avanzado y personalización completa
  - Integración con sistemas externos
  - Soporte prioritario

#### Acceptance Criteria

1. THE Try_On_System SHALL definir Plan Básico con límite de 5 productos y 400 generaciones mensuales a 150.000 COP/mes
2. THE Try_On_System SHALL definir Plan Pro con límite de 15 productos y 1200 generaciones mensuales a 250.000-300.000 COP/mes
3. WHEN una marca intenta generar una imagen, THE Try_On_System SHALL verificar que no haya excedido su límite mensual
4. IF una marca excede su límite mensual, THEN THE Try_On_System SHALL rechazar la solicitud con mensaje de error apropiado
5. THE Try_On_System SHALL resetear contadores de uso el primer día de cada mes
6. WHEN una marca consulta su uso, THE Try_On_System SHALL mostrar generaciones usadas y límite total del mes actual
7. THE Try_On_System SHALL mostrar precios en COP (pesos colombianos) en toda la interfaz

### Requirement 3: Gestión de Productos

**User Story:** Como marca, quiero crear y gestionar mis productos en el probador, para que mis clientes puedan probárselos virtualmente.

#### Acceptance Criteria

1. WHEN una marca crea un producto, THE Try_On_System SHALL almacenar nombre, descripción, imagen de referencia y categoría
2. WHEN una marca intenta agregar un producto, THE Try_On_System SHALL verificar que no exceda el límite de su plan
3. IF una marca excede su límite de productos, THEN THE Try_On_System SHALL rechazar la creación con mensaje de error
4. THE Try_On_System SHALL permitir editar nombre, descripción e imagen de productos existentes
5. THE Try_On_System SHALL permitir eliminar productos sin afectar generaciones históricas
6. WHEN se lista productos, THE Try_On_System SHALL mostrar solo productos activos de la marca

### Requirement 4: Configuración del Probador

**User Story:** Como marca, quiero personalizar la apariencia de mi probador virtual, para mantener consistencia con mi identidad de marca.

#### Acceptance Criteria

1. THE Try_On_System SHALL permitir configurar logo de marca, colores primario y secundario
2. WHEN una marca actualiza su configuración, THE Try_On_System SHALL aplicar cambios inmediatamente en el probador público
3. THE Try_On_System SHALL validar que los colores estén en formato hexadecimal válido
4. WHEN se accede al probador público, THE Try_On_System SHALL cargar la configuración visual de la marca

### Requirement 5: Probador Virtual Público

**User Story:** Como cliente final, quiero probarme productos virtualmente subiendo mi foto, para visualizar cómo me quedarían antes de comprar.

#### Acceptance Criteria

1. WHEN un End_User accede a /tryon/:brandSlug, THE Try_On_System SHALL cargar configuración y productos de esa marca
2. IF el brandSlug no existe, THEN THE Try_On_System SHALL mostrar página de error 404
3. THE Try_On_System SHALL permitir al End_User subir una imagen tipo selfie (JPG, PNG, máximo 5MB)
4. WHEN se sube una imagen, THE Try_On_System SHALL mostrar preview antes de generar
5. THE Try_On_System SHALL mostrar lista de productos disponibles con imágenes y nombres
6. WHEN un End_User selecciona un producto y confirma, THE Try_On_System SHALL iniciar generación de imagen virtual
7. WHILE se genera la imagen, THE Try_On_System SHALL mostrar indicador de carga con mensaje apropiado
8. WHEN la generación completa, THE Try_On_System SHALL mostrar imagen resultante con opción de descarga
9. IF la generación falla, THEN THE Try_On_System SHALL mostrar mensaje de error y permitir reintentar

### Requirement 6: Integración con Motor de IA (n8n)

**User Story:** Como sistema, necesito integrarme con el workflow de n8n para generar imágenes de try-on mediante IA.

#### Acceptance Criteria

1. WHEN se solicita una generación, THE Try_On_System SHALL enviar a n8n: brandId, productId, URL de selfie y parámetros de estilo
2. THE Try_On_System SHALL esperar respuesta de n8n con URL de imagen generada o error
3. IF n8n responde exitosamente, THEN THE Try_On_System SHALL almacenar URL de imagen y retornarla al frontend
4. IF n8n falla o timeout, THEN THE Try_On_System SHALL registrar error y notificar al End_User
5. THE Try_On_System SHALL configurar timeout de 60 segundos para llamadas a n8n
6. WHEN una generación completa exitosamente, THE Try_On_System SHALL incrementar contador de uso de la marca

### Requirement 7: Widget Embebible

**User Story:** Como marca, quiero embeber el probador en mi sitio web existente, para ofrecer la experiencia sin que mis clientes salgan de mi dominio.

#### Acceptance Criteria

1. THE Try_On_System SHALL proporcionar código de embed (iframe o script) para cada marca
2. WHEN se embebe el widget, THE Try_On_System SHALL cargar probador completo dentro del iframe
3. THE Try_On_System SHALL permitir comunicación entre iframe y página padre mediante postMessage
4. THE Try_On_System SHALL adaptar dimensiones del widget responsivamente
5. WHEN se genera una imagen en el widget, THE Try_On_System SHALL notificar a la página padre vía postMessage

### Requirement 8: Registro de Generaciones

**User Story:** Como sistema, necesito registrar cada generación de imagen para control de uso y auditoría.

#### Acceptance Criteria

1. WHEN se completa una generación, THE Try_On_System SHALL crear registro con: brandId, productId, fecha, URL de imagen generada
2. THE Try_On_System SHALL almacenar estado de generación (exitosa, fallida, pendiente)
3. WHEN una marca consulta su historial, THE Try_On_System SHALL mostrar últimas generaciones con fechas y productos
4. THE Try_On_System SHALL calcular uso mensual sumando generaciones exitosas del mes actual

### Requirement 9: Autenticación y Seguridad

**User Story:** Como sistema, debo proteger endpoints privados y validar acceso de marcas a sus recursos.

#### Acceptance Criteria

1. THE Try_On_System SHALL usar JWT para autenticación de marcas
2. WHEN una marca inicia sesión, THE Try_On_System SHALL generar token JWT con expiración de 7 días
3. THE Try_On_System SHALL validar token JWT en todos los endpoints protegidos
4. THE Try_On_System SHALL hashear contraseñas usando bcrypt antes de almacenar
5. WHEN una marca accede a recursos, THE Try_On_System SHALL verificar que pertenezcan a esa marca
6. THE Try_On_System SHALL permitir acceso público sin autenticación a endpoints /tryon/:brandSlug

### Requirement 10: Manejo de Archivos

**User Story:** Como sistema, necesito manejar carga y almacenamiento de imágenes de forma eficiente y segura.

#### Acceptance Criteria

1. THE Try_On_System SHALL validar tipo de archivo (solo JPG, PNG, WEBP)
2. THE Try_On_System SHALL validar tamaño máximo de 5MB para selfies
3. WHEN se sube una selfie, THE Try_On_System SHALL almacenarla temporalmente o enviar directamente a n8n
4. THE Try_On_System SHALL generar URLs firmadas o temporales para imágenes de productos
5. IF una imagen excede límites, THEN THE Try_On_System SHALL rechazar con mensaje descriptivo

### Requirement 11: Sistema de Suscripciones y Pagos

**User Story:** Como administrador del sistema, quiero gestionar suscripciones mensuales de marcas, para controlar el acceso al servicio y garantizar pagos recurrentes.

#### Opciones de Implementación Propuestas

**Opción A: Integración con Pasarela de Pagos (Recomendado)**
- Integrar con Wompi, PayU o Mercado Pago (pasarelas colombianas)
- Suscripciones recurrentes automáticas
- Webhooks para notificaciones de pago exitoso/fallido
- Renovación automática mensual

**Opción B: Sistema Manual con Recordatorios**
- Marca paga por transferencia/consignación
- Admin marca manualmente el pago en el sistema
- Sistema envía recordatorios automáticos 3 días antes del vencimiento
- Suspensión automática si no hay pago confirmado

**Opción C: Sistema Híbrido (Fase Inicial)**
- Período de prueba gratuito de 7-14 días
- Después requiere activación manual por admin tras confirmar pago
- Migración futura a pagos automáticos

#### Acceptance Criteria

1. THE Try_On_System SHALL registrar fecha de inicio de suscripción para cada marca
2. THE Try_On_System SHALL calcular fecha de vencimiento de suscripción (inicio + 30 días)
3. WHEN una suscripción vence, THE Try_On_System SHALL cambiar estado de marca a "suspended"
4. WHEN una marca está suspendida, THE Try_On_System SHALL bloquear acceso al dashboard y probador público
5. THE Try_On_System SHALL permitir al admin renovar manualmente una suscripción
6. WHEN se renueva una suscripción, THE Try_On_System SHALL extender fecha de vencimiento por 30 días adicionales
7. THE Try_On_System SHALL enviar notificación por email 7 días antes del vencimiento
8. THE Try_On_System SHALL enviar notificación por email 3 días antes del vencimiento
9. THE Try_On_System SHALL enviar notificación por email el día del vencimiento
10. THE Try_On_System SHALL mostrar en dashboard días restantes de suscripción
11. WHEN una marca suspendida intenta acceder, THE Try_On_System SHALL mostrar mensaje con instrucciones de renovación
12. THE Try_On_System SHALL mantener datos de marca suspendida por 90 días antes de eliminar
13. IF una marca renueva dentro de 90 días, THEN THE Try_On_System SHALL restaurar acceso completo con datos intactos
14. THE Try_On_System SHALL registrar historial de pagos con fecha, monto y método

### Requirement 12: Panel de Administración de Suscripciones

**User Story:** Como administrador del sistema, quiero gestionar suscripciones de todas las marcas desde un panel centralizado, para controlar renovaciones y suspensiones.

#### Acceptance Criteria

1. THE Try_On_System SHALL mostrar lista de todas las marcas con estado de suscripción (activa, por vencer, vencida, suspendida)
2. THE Try_On_System SHALL permitir filtrar marcas por estado de suscripción
3. THE Try_On_System SHALL mostrar fecha de vencimiento y días restantes para cada marca
4. THE Try_On_System SHALL permitir al admin renovar manualmente una suscripción
5. THE Try_On_System SHALL permitir al admin suspender/reactivar una marca manualmente
6. THE Try_On_System SHALL permitir al admin cambiar plan de una marca (BASIC ↔ PRO)
7. WHEN se cambia de plan, THE Try_On_System SHALL ajustar límites inmediatamente
8. THE Try_On_System SHALL mostrar alertas de marcas próximas a vencer (< 7 días)
9. THE Try_On_System SHALL generar reporte mensual de ingresos por suscripciones
10. THE Try_On_System SHALL registrar todas las acciones del admin en log de auditoría

### Requirement 13: Notificaciones y Comunicación

**User Story:** Como marca, quiero recibir notificaciones sobre el estado de mi suscripción, para renovar a tiempo y evitar suspensiones.

#### Acceptance Criteria

1. THE Try_On_System SHALL enviar email de bienvenida al registrarse con detalles del plan
2. THE Try_On_System SHALL enviar recordatorio 7 días antes del vencimiento con instrucciones de pago
3. THE Try_On_System SHALL enviar recordatorio 3 días antes del vencimiento con urgencia
4. THE Try_On_System SHALL enviar notificación el día del vencimiento
5. THE Try_On_System SHALL enviar notificación de suspensión si no se renueva
6. THE Try_On_System SHALL enviar confirmación de renovación exitosa
7. THE Try_On_System SHALL enviar alerta cuando se alcance 80% del límite mensual de generaciones
8. THE Try_On_System SHALL enviar alerta cuando se alcance 100% del límite mensual
9. THE Try_On_System SHALL incluir en emails: días restantes, monto a pagar, instrucciones de pago
10. THE Try_On_System SHALL permitir a marca configurar preferencias de notificaciones


### Requirement 14: Panel de Administración Mejorado - Gestión de Marcas

**User Story:** Como administrador del sistema, quiero gestionar marcas de forma eficiente con herramientas de búsqueda, filtrado y acciones detalladas, para administrar el sistema de manera organizada.

#### Acceptance Criteria

1. THE Try_On_System SHALL proporcionar búsqueda en tiempo real por nombre, email o slug de marca
2. THE Try_On_System SHALL permitir filtrar marcas por plan (BASIC, PRO, Todos)
3. THE Try_On_System SHALL implementar paginación con 10 marcas por página
4. THE Try_On_System SHALL mostrar contador de resultados filtrados vs total
5. THE Try_On_System SHALL proporcionar botón "Crear Marca" para registro manual de clientes
6. WHEN el admin crea una marca manualmente, THE Try_On_System SHALL solicitar: nombre, email, contraseña, slug y plan
7. THE Try_On_System SHALL validar unicidad de email y slug al crear marca manualmente
8. THE Try_On_System SHALL auto-generar slug válido eliminando caracteres especiales
9. THE Try_On_System SHALL proporcionar acción "Ver Detalles" que muestre:
   - Información completa de la marca
   - Estadísticas de uso (productos, generaciones totales, generaciones del mes)
   - Fecha de registro
10. THE Try_On_System SHALL proporcionar acción "Ver Productos" para visualizar productos de la marca
11. THE Try_On_System SHALL proporcionar acción "Editar" que permita modificar:
    - Nombre de la marca
    - Email
    - Slug (con validación de unicidad)
12. THE Try_On_System SHALL mostrar iconos visuales para cada acción (ojo, caja, lápiz)
13. THE Try_On_System SHALL resetear paginación a página 1 cuando cambien filtros o búsqueda
14. THE Try_On_System SHALL mantener estado de filtros durante la sesión del admin

### Requirement 15: Panel de Administración Mejorado - Gestión de Suscripciones

**User Story:** Como administrador del sistema, quiero gestionar suscripciones con herramientas avanzadas de búsqueda y filtrado, para controlar renovaciones y cambios de plan eficientemente.

#### Acceptance Criteria

1. THE Try_On_System SHALL proporcionar búsqueda en tiempo real por nombre, email o slug en suscripciones
2. THE Try_On_System SHALL permitir filtrar suscripciones por estado:
   - Todas
   - Activas
   - Por vencer (expiring_soon)
   - Vencidas (expired)
   - Suspendidas (suspended)
3. THE Try_On_System SHALL mostrar contador de suscripciones por cada estado
4. THE Try_On_System SHALL implementar paginación con 10 suscripciones por página
5. THE Try_On_System SHALL mostrar paginación inteligente (máximo 5 números de página visibles)
6. THE Try_On_System SHALL proporcionar acción "Cambiar Plan" que permita:
   - Ver plan actual con precio
   - Seleccionar nuevo plan (BASIC o PRO)
   - Ver advertencia sobre cambio inmediato
   - Confirmar cambio de plan
7. WHEN se cambia el plan, THE Try_On_System SHALL actualizar límites de productos y generaciones inmediatamente
8. THE Try_On_System SHALL mostrar precios en formato COP ($150.000 COP, $250.000 COP)
9. THE Try_On_System SHALL mantener acción "Renovar" con formulario de registro de pago:
   - Monto (pre-llenado según plan)
   - Fecha de pago
   - Método de pago (transferencia, efectivo, tarjeta, otro)
   - Notas opcionales
10. THE Try_On_System SHALL mantener acciones "Suspender" y "Reactivar" según estado actual
11. THE Try_On_System SHALL mostrar alertas visuales para suscripciones críticas:
    - Banner amarillo para suscripciones que vencen en ≤7 días
    - Fila con fondo rojo para suscripciones que vencen en ≤3 días
12. THE Try_On_System SHALL mostrar días restantes con colores:
    - Verde: >7 días
    - Amarillo: 3-7 días
    - Rojo: <3 días o vencida
13. THE Try_On_System SHALL resetear paginación a página 1 cuando cambien filtros o búsqueda
14. THE Try_On_System SHALL combinar filtros de estado y búsqueda de texto simultáneamente

### Requirement 16: Estructura de Navegación del Panel de Administración

**User Story:** Como administrador del sistema, quiero una navegación clara y consistente en el panel de administración, para acceder rápidamente a todas las funcionalidades.

#### Acceptance Criteria

1. THE Try_On_System SHALL proporcionar layout consistente con sidebar de navegación
2. THE Try_On_System SHALL incluir en el sidebar:
   - Logo/título "Admin Panel"
   - Link a "Estadísticas" (/admin/dashboard)
   - Link a "Marcas" (/admin/brands)
   - Link a "Suscripciones" (/admin/subscriptions)
   - Información del admin (nombre, email)
   - Botón de logout
3. THE Try_On_System SHALL resaltar el link activo en el sidebar
4. THE Try_On_System SHALL mostrar iconos visuales para cada sección del menú
5. THE Try_On_System SHALL proteger todas las rutas de admin con autenticación
6. WHEN un usuario no autenticado intenta acceder, THE Try_On_System SHALL redirigir a /admin/login
7. THE Try_On_System SHALL mantener sesión de admin en localStorage
8. THE Try_On_System SHALL proporcionar página de login exclusiva para administradores (/admin/login)
9. THE Try_On_System SHALL usar credenciales de admin separadas de las marcas
10. THE Try_On_System SHALL mostrar spinner de carga durante autenticación

### Requirement 17: Creación Manual de Marcas por Admin

**User Story:** Como administrador del sistema, quiero crear cuentas de marca manualmente, para dar de alta clientes que pagaron por otros medios o requieren configuración especial.

#### Acceptance Criteria

1. THE Try_On_System SHALL proporcionar modal de creación de marca con formulario completo
2. THE Try_On_System SHALL solicitar campos obligatorios:
   - Nombre de la marca
   - Email (con validación de formato)
   - Contraseña (mínimo 6 caracteres)
   - Slug (auto-sanitizado, solo letras minúsculas, números y guiones)
   - Plan (BASIC o PRO)
3. THE Try_On_System SHALL mostrar preview de URL del probador: /pruebalo/{slug}
4. THE Try_On_System SHALL validar unicidad de email antes de crear
5. THE Try_On_System SHALL validar unicidad de slug antes de crear
6. THE Try_On_System SHALL auto-convertir slug a formato válido (lowercase, sin espacios ni caracteres especiales)
7. WHEN se crea la marca exitosamente, THE Try_On_System SHALL:
   - Crear cuenta con contraseña hasheada
   - Asignar plan seleccionado
   - Inicializar suscripción activa
   - Recargar lista de marcas
   - Mostrar mensaje de confirmación
8. IF la creación falla, THEN THE Try_On_System SHALL mostrar mensaje de error descriptivo
9. THE Try_On_System SHALL permitir cancelar creación sin guardar cambios
10. THE Try_On_System SHALL deshabilitar botón "Crear" mientras se procesa la solicitud

### Requirement 18: Modales de Información y Edición

**User Story:** Como administrador del sistema, quiero ver y editar información de marcas mediante modales intuitivos, para gestionar datos sin salir de la página principal.

#### Acceptance Criteria

1. THE Try_On_System SHALL proporcionar modal "Ver Detalles" que muestre:
   - Nombre, email, slug
   - Plan actual
   - Estadísticas: productos, generaciones totales, generaciones del mes
   - Fecha de registro
2. THE Try_On_System SHALL proporcionar modal "Ver Productos" preparado para integración futura
3. THE Try_On_System SHALL proporcionar modal "Editar Marca" que permita modificar:
   - Nombre de la marca
   - Email (con validación)
   - Slug (con auto-sanitización y validación de unicidad)
4. THE Try_On_System SHALL mostrar preview de nueva URL al editar slug
5. WHEN se guarda edición exitosamente, THE Try_On_System SHALL:
   - Actualizar datos en base de datos
   - Recargar lista de marcas
   - Cerrar modal
   - Mostrar mensaje de confirmación
6. THE Try_On_System SHALL permitir cancelar edición sin guardar cambios
7. THE Try_On_System SHALL mantener datos originales si se cancela
8. THE Try_On_System SHALL usar diseño consistente para todos los modales:
   - Fondo oscuro semi-transparente
   - Contenedor blanco centrado
   - Título descriptivo
   - Botones de acción alineados a la derecha
9. THE Try_On_System SHALL cerrar modales al hacer clic en "Cancelar" o "Cerrar"
10. THE Try_On_System SHALL limpiar estado de modales al cerrar

## Implementation Notes

### Panel de Administración - Arquitectura

El panel de administración se implementa con las siguientes características técnicas:

**Frontend (Next.js 14 + TypeScript):**
- Layout compartido: `/admin/layout.tsx` con sidebar de navegación
- Páginas principales:
  - `/admin/login` - Autenticación de administradores
  - `/admin/dashboard` - Estadísticas globales del sistema
  - `/admin/brands` - Gestión de marcas con búsqueda, filtros y paginación
  - `/admin/subscriptions` - Gestión de suscripciones con búsqueda, filtros y paginación

**Backend (Express + TypeScript):**
- Endpoints de admin protegidos con middleware `adminAuthMiddleware`
- Tabla `admins` en Supabase para credenciales de administradores
- Endpoints existentes:
  - `POST /api/admin/auth/login` - Login de admin
  - `GET /api/admin/stats` - Estadísticas globales
  - `GET /api/admin/brands` - Lista de marcas con estadísticas
  - `PATCH /api/admin/brands/:id/plan` - Cambiar plan de marca
  - `GET /api/admin/subscriptions` - Lista de suscripciones
  - `PATCH /api/admin/subscriptions/:brandId/renew` - Renovar suscripción
  - `PATCH /api/admin/subscriptions/:brandId/suspend` - Suspender marca
  - `PATCH /api/admin/subscriptions/:brandId/reactivate` - Reactivar marca

**Características de UX:**
- Búsqueda en tiempo real con debounce
- Filtros combinables (estado + búsqueda de texto)
- Paginación inteligente con navegación
- Modales para acciones sin cambiar de página
- Iconos visuales para acciones rápidas
- Alertas visuales con colores semánticos
- Formularios con validación en tiempo real
- Estados de carga y mensajes de confirmación

**Seguridad:**
- Autenticación JWT separada para admins
- Tokens almacenados en localStorage
- Validación de permisos en cada endpoint
- Protección de rutas en frontend
- Sanitización de inputs (especialmente slug)
- Validación de unicidad en email y slug


### Requirement 19: Sistema de Almacenamiento de Imágenes con WordPress

**User Story:** Como sistema, necesito almacenar imágenes de productos y generaciones de forma eficiente y económica, reutilizando la infraestructura de hosting existente.

#### Arquitectura de Almacenamiento

**Flujo de Subida:**
```
Frontend → Backend → WordPress REST API → Hosting
```

**Componentes:**
1. **Plugin de WordPress:** `n8n Image Upload API v1.1.0`
2. **Endpoint de subida:** `https://pruebalo.wilkiedevs.com/wp-json/n8n/v1/upload`
3. **Endpoint de eliminación:** `https://pruebalo.wilkiedevs.com/wp-json/n8n/v1/delete`
4. **Endpoint de prueba:** `https://pruebalo.wilkiedevs.com/wp-json/n8n/v1/test`

#### Acceptance Criteria

1. THE Try_On_System SHALL usar el plugin de WordPress para almacenar imágenes de productos y logos
2. THE Try_On_System SHALL autenticar peticiones usando Bearer Token: `Travis2305**`
3. WHEN se sube una imagen, THE Try_On_System SHALL enviar:
   - `image_base64`: Imagen en base64 sin prefijo data:image
   - `filename`: Nombre del archivo sanitizado
   - `temporary`: Boolean (true para temporales, false para permanentes)
4. THE Try_On_System SHALL recibir respuesta con:
   - `success`: Boolean
   - `url`: URL pública de la imagen
   - `path`: Ruta del archivo en el servidor
   - `size`: Tamaño en bytes
5. THE Try_On_System SHALL almacenar imágenes temporales en `/wp-content/uploads/temp/`
6. THE Try_On_System SHALL almacenar imágenes permanentes en `/wp-content/uploads/tryon/`
7. THE Try_On_System SHALL limpiar automáticamente imágenes temporales después de 24 horas
8. THE Try_On_System SHALL comprimir imágenes antes de subir (máx 1920x1920, 85% calidad)
9. THE Try_On_System SHALL validar tipo de archivo (JPG, PNG, WEBP)
10. THE Try_On_System SHALL validar tamaño máximo de 5MB
11. THE Try_On_System SHALL generar nombres de archivo únicos con timestamp
12. THE Try_On_System SHALL proteger carpetas con .htaccess para evitar listado de directorios
13. THE Try_On_System SHALL permitir acceso público a imágenes individuales
14. THE Try_On_System SHALL soportar autenticación Bearer Token y Basic Auth
15. THE Try_On_System SHALL registrar errores en logs de WordPress

#### Configuración del Plugin

**Ubicación:** Plugin de WordPress instalado en `pruebalo.wilkiedevs.com`

**Token de Autenticación:**
- Definido en `wp-config.php`: `define('N8N_API_SECRET', 'Travis2305**');`
- Usado en header: `Authorization: Bearer Travis2305**`

**Estructura de Carpetas:**
```
wp-content/uploads/
├── temp/           # Imágenes temporales (auto-limpieza 24h)
│   ├── selfie-{brand_id}-{timestamp}.jpg
│   └── .htaccess
└── tryon/          # Imágenes permanentes
    ├── product-{timestamp}.jpg
    ├── tryon-{brand_id}-{product_id}-{timestamp}.jpg
    └── .htaccess
```

**Endpoints Disponibles:**

1. **POST /wp-json/n8n/v1/upload**
   - Sube imagen en base64
   - Requiere autenticación
   - Retorna URL pública

2. **DELETE /wp-json/n8n/v1/delete**
   - Elimina imagen por URL
   - Requiere autenticación
   - Solo permite eliminar de temp/ o tryon/

3. **GET /wp-json/n8n/v1/test**
   - Verifica que el plugin esté activo
   - No requiere autenticación
   - Retorna información del plugin

#### Ventajas de esta Solución

1. **Costo:** Gratis (usa hosting existente de WordPress)
2. **Simplicidad:** No requiere configurar nuevo servicio de almacenamiento
3. **Integración:** Reutiliza infraestructura de n8n existente
4. **Mantenimiento:** Auto-limpieza de archivos temporales
5. **Seguridad:** Autenticación con Bearer Token
6. **Escalabilidad:** Puede migrar a CDN en el futuro si es necesario

#### Variables de Entorno

**Backend (.env):**
```env
N8N_BEARER_TOKEN=Travis2305**
```

**Frontend:**
No requiere configuración adicional, usa el endpoint del backend.

#### Código del Plugin de WordPress

El plugin completo está documentado en el archivo fuente y proporciona:
- Validación de autenticación (Bearer Token y Basic Auth)
- Sanitización de nombres de archivo
- Validación de base64
- Creación automática de carpetas
- Protección con .htaccess
- Limpieza automática de temporales (cron diario)
- Logging de errores
- Endpoint de prueba para verificación


### Requirement 20: Sistema de Limpieza Automática de Imágenes

**User Story:** Como administrador del sistema, quiero que las imágenes de productos eliminados se limpien automáticamente, para evitar saturación del hosting y optimizar el uso de almacenamiento.

#### Estrategia de Gestión de Almacenamiento

**Tipos de Imágenes:**

1. **Imágenes de Productos (permanentes con limpieza diferida)**
   - Ubicación: `/wp-content/uploads/tryon/`
   - Retención: Se mantienen mientras el producto esté activo
   - Limpieza: Se eliminan 30 días después de que el producto sea eliminado (soft delete)
   - Límite de tamaño: 5MB por imagen
   - Formato: JPG, PNG, WEBP

2. **Logos de Marca (permanentes)**
   - Ubicación: `/wp-content/uploads/logos/` (futuro)
   - Retención: Se mantienen mientras la marca esté activa
   - Límite de tamaño: 2MB por logo
   - Límite de cantidad: 1 logo por marca (reemplaza el anterior)

3. **Imágenes Generadas (temporales)**
   - Ubicación: `/wp-content/uploads/temp/`
   - Retención: 24 horas (limpieza automática por plugin de WordPress)
   - Uso: Selfies y resultados de try-on

#### Acceptance Criteria

1. THE Try_On_System SHALL ejecutar limpieza automática diariamente a las 3:00 AM
2. THE Try_On_System SHALL identificar productos con `deleted_at` no nulo
3. THE Try_On_System SHALL eliminar imágenes de productos eliminados hace más de 30 días
4. WHEN se elimina una imagen, THE Try_On_System SHALL llamar al endpoint DELETE de WordPress
5. THE Try_On_System SHALL registrar en logs cada imagen eliminada exitosamente
6. THE Try_On_System SHALL registrar en logs errores de eliminación sin detener el proceso
7. THE Try_On_System SHALL proporcionar endpoint manual `/api/cleanup/run` para ejecutar limpieza bajo demanda
8. THE Try_On_System SHALL requerir autenticación para ejecutar limpieza manual
9. THE Try_On_System SHALL retornar estadísticas de limpieza: imágenes eliminadas y errores
10. THE Try_On_System SHALL solo eliminar imágenes alojadas en `pruebalo.wilkiedevs.com`
11. THE Try_On_System SHALL ignorar imágenes externas (URLs de otros dominios)
12. THE Try_On_System SHALL permitir configurar días de retención (por defecto 30 días)
13. THE Try_On_System SHALL continuar limpieza aunque algunas imágenes fallen
14. THE Try_On_System SHALL no considerar error si la imagen ya no existe (404)

#### Componentes Implementados

**Backend:**
- `src/services/cleanup.service.ts` - Lógica de limpieza
- `src/controllers/cleanup.controller.ts` - Endpoints de limpieza
- `src/routes/cleanup.routes.ts` - Rutas de limpieza
- `src/jobs/cleanup.job.ts` - Cron job diario

**Endpoints:**
- `POST /api/cleanup/run` - Ejecutar limpieza manual (requiere auth)
- `GET /api/cleanup/stats` - Obtener estadísticas de almacenamiento (futuro)

**Cron Job:**
- Programado con `node-cron`
- Se ejecuta todos los días a las 3:00 AM
- Inicia automáticamente al arrancar el servidor

#### Flujo de Limpieza

1. **Identificación:**
   - Consulta productos con `deleted_at` no nulo
   - Filtra productos eliminados hace más de 30 días

2. **Validación:**
   - Verifica que la URL de imagen sea del dominio `pruebalo.wilkiedevs.com`
   - Ignora URLs externas

3. **Eliminación:**
   - Llama a `DELETE /wp-json/n8n/v1/delete` con la URL de la imagen
   - Usa Bearer Token para autenticación
   - Timeout de 10 segundos por imagen

4. **Registro:**
   - Log de cada imagen eliminada exitosamente
   - Log de errores sin detener el proceso
   - Estadísticas finales: total eliminadas y errores

#### Configuración

**Variables de Entorno:**
```env
N8N_BEARER_TOKEN=Travis2305**  # Token para autenticar con WordPress
```

**Configuración de Retención:**
```typescript
cleanupService.setConfig({
  productImageRetentionDays: 30,  // Días para mantener imágenes después de eliminar producto
  deleteOrphanImages: true,        // Eliminar imágenes sin producto asociado
});
```

#### Logs de Ejemplo

```
[Cleanup Job] 🧹 Iniciando limpieza automática programada...
[Cleanup] Iniciando limpieza de imágenes de productos eliminados...
[Cleanup] ✅ Imagen eliminada: https://pruebalo.wilkiedevs.com/wp-content/uploads/tryon/product-123.jpg
[Cleanup] ✅ Imagen eliminada: https://pruebalo.wilkiedevs.com/wp-content/uploads/tryon/product-456.jpg
[Cleanup] Limpieza completada: 2 eliminadas, 0 errores
[Cleanup Job] ✅ Limpieza completada: 2 eliminadas, 0 errores
```

#### Ventajas del Sistema

1. **Automático:** No requiere intervención manual
2. **Seguro:** Período de gracia de 30 días antes de eliminar
3. **Eficiente:** Se ejecuta en horario de baja demanda (3:00 AM)
4. **Robusto:** Continúa aunque algunas imágenes fallen
5. **Auditable:** Logs detallados de cada operación
6. **Flexible:** Configuración ajustable de días de retención
7. **Manual:** Endpoint disponible para limpieza bajo demanda



### Requirement 21: Integración con MCP de n8n para Gestión de Workflows

**User Story:** Como desarrollador del sistema, quiero integrar el MCP (Model Context Protocol) de n8n, para gestionar workflows directamente desde el entorno de desarrollo y automatizar la configuración del sistema de generación de imágenes.

#### Descripción del MCP de n8n

El MCP de n8n es un servidor que permite interactuar con la API de n8n mediante el Model Context Protocol, facilitando la gestión de workflows, credenciales y ejecuciones desde herramientas de desarrollo compatibles.

#### Configuración del MCP

**Archivo de Configuración:** `.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--init",
        "-e",
        "MCP_MODE=stdio",
        "-e",
        "LOG_LEVEL=error",
        "-e",
        "DISABLE_CONSOLE_OUTPUT=true",
        "-e",
        "N8N_API_URL=https://n8n.wilkiedevs.com",
        "-e",
        "N8N_API_KEY=<TU_API_KEY_DE_N8N>",
        "ghcr.io/czlonkowski/n8n-mcp@sha256:80613ac30c3fe39a7b9d343104603804edfbc34c1cdc27e95459b15b7c651dd2"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

#### Requisitos Previos

1. **Docker:** Debe estar instalado y corriendo en el sistema
2. **API Key de n8n:** Generar desde n8n → Settings → API
3. **Acceso a n8n:** URL accesible desde el entorno de desarrollo

#### Acceptance Criteria

1. THE Try_On_System SHALL documentar la configuración del MCP de n8n en requirements.md
2. THE Try_On_System SHALL proporcionar scripts alternativos para gestión de workflows cuando el MCP no esté disponible
3. THE Try_On_System SHALL incluir scripts de importación de workflows usando la API REST de n8n
4. THE Try_On_System SHALL incluir scripts de activación de workflows usando la API REST de n8n
5. THE Try_On_System SHALL documentar el proceso manual de importación de workflows como fallback
6. THE Try_On_System SHALL mantener archivos JSON de workflows en el repositorio para versionamiento
7. THE Try_On_System SHALL proporcionar instrucciones claras para obtener la API Key de n8n
8. THE Try_On_System SHALL documentar troubleshooting común del MCP (Docker no corriendo, API Key inválida, etc.)

#### Scripts de Gestión de Workflows (Alternativa al MCP)

**Ubicación:** `backend/src/scripts/`

1. **import-n8n-workflow.ts**
   - Importa workflow desde archivo JSON a n8n
   - Usa API REST de n8n directamente
   - Detecta workflows existentes y ofrece actualizar o crear nuevo
   - Retorna ID y URL del workflow

2. **activate-n8n-workflow.ts**
   - Activa workflow en n8n
   - Obtiene URL del webhook
   - Muestra instrucciones para actualizar .env

3. **test-n8n-simple.ts**
   - Prueba el webhook de n8n con payload de ejemplo
   - Verifica conectividad y autenticación
   - Útil para debugging

#### Uso de los Scripts

**Importar workflow:**
```bash
cd backend
npx ts-node src/scripts/import-n8n-workflow.ts
```

**Activar workflow:**
```bash
cd backend
npx ts-node src/scripts/activate-n8n-workflow.ts
```

**Probar webhook:**
```bash
cd backend
npm run test:n8n-simple
```

#### Workflows Disponibles

1. **n8n-workflow-virtual-tryon-FIXED.json**
   - Workflow simplificado sin manejo de errores complejo
   - Cadena lineal de nodos para evitar problemas de conexión
   - Recomendado para producción

2. **n8n-workflow-virtual-tryon-UPDATED.json**
   - Workflow con manejo de errores avanzado
   - Puede presentar problemas con "Respond to Webhook"
   - Usar solo si se necesita manejo de errores personalizado

#### Troubleshooting del MCP

**Error: "Connection closed" o "MCP error -32000"**
- **Causa:** Docker no está corriendo o no puede conectarse
- **Solución:** 
  1. Verificar que Docker Desktop esté corriendo
  2. Ejecutar `docker ps` para verificar conectividad
  3. Usar scripts alternativos si Docker no está disponible

**Error: "Authorization failed"**
- **Causa:** API Key inválida o expirada
- **Solución:**
  1. Generar nueva API Key en n8n → Settings → API
  2. Actualizar `N8N_API_KEY` en `.kiro/settings/mcp.json`
  3. Reiniciar el servidor MCP

**Error: "Cannot pull Docker image"**
- **Causa:** Problemas de red o imagen no disponible
- **Solución:**
  1. Verificar conexión a internet
  2. Ejecutar manualmente: `docker pull ghcr.io/czlonkowski/n8n-mcp@sha256:80613ac30c3fe39a7b9d343104603804edfbc34c1cdc27e95459b15b7c651dd2`
  3. Usar scripts alternativos si persiste el problema

#### Ventajas del MCP

1. **Integración Directa:** Gestión de workflows desde el IDE
2. **Automatización:** Scripts para importar y activar workflows
3. **Versionamiento:** Workflows en JSON versionados en Git
4. **Debugging:** Herramientas para probar webhooks fácilmente
5. **Fallback:** Scripts alternativos cuando MCP no está disponible

#### Limitaciones Conocidas

1. **Requiere Docker:** El MCP necesita Docker corriendo
2. **Activación Manual:** Algunos workflows requieren activación manual en n8n UI debido a conflictos de webhook
3. **Credenciales:** Las credenciales de n8n deben configurarse manualmente en la UI
4. **Conflictos de Webhook:** Si existe otro workflow con el mismo path, la activación falla

#### Proceso Manual de Importación (Fallback)

Si el MCP y los scripts no funcionan, seguir estos pasos:

1. Abrir n8n en el navegador: `https://n8n.wilkiedevs.com`
2. Ir a **Workflows** → **Import from File**
3. Seleccionar `n8n-workflow-virtual-tryon-FIXED.json`
4. Hacer clic en **Import**
5. Configurar credenciales:
   - "pruebalo.wilkiedevs": HTTP Header Auth con `Bearer Travis2305**`
   - "Open Pruebalo": HTTP Bearer Auth con token de OpenRouter
6. Activar el workflow con el toggle en la esquina superior derecha
7. Copiar la URL del webhook del nodo "Webhook"
8. Actualizar `N8N_WEBHOOK_URL` en `backend/.env`

#### Documentación Adicional

- **Instrucciones detalladas:** `INSTRUCCIONES_N8N_WORKFLOW.md`
- **Workflows:** Carpeta raíz del proyecto
- **Scripts:** `backend/src/scripts/`

### Requirement 22: Reglas de Modificación del Workflow de n8n

**User Story:** Como desarrollador del sistema, necesito reglas claras sobre cómo modificar el workflow de n8n, para evitar romper el flujo de producción.

#### Regla Principal

**NUNCA crear workflows nuevos.** Solo se permite trabajar sobre el workflow existente con ID `wPLypk7KhBcFLicX` en `https://n8n.wilkiedevs.com`.

#### Acceptance Criteria

1. THE Try_On_System SHALL mantener un único workflow activo con path `/tryon`
2. WHEN se necesite modificar lógica de un nodo, THE Try_On_System SHALL actualizar el nodo existente vía API (`PUT /api/v1/workflows/{id}`) sin crear workflows nuevos
3. THE Try_On_System SHALL usar regex en lugar de `new URL()` para validar URLs dentro de nodos Code de n8n, ya que el task runner de n8n puede no soportar `new URL()` correctamente
4. THE Try_On_System SHALL usar template literals con `{{ }}` solo para valores simples; para objetos complejos (base64, prompts con saltos de línea) usar nodos Code intermedios
5. WHEN se actualice un nodo vía API, THE Try_On_System SHALL verificar que el workflow siga activo (`active: true`) después del PUT
6. THE Try_On_System SHALL mantener el JSON de respaldo del workflow actualizado en `n8n-workflow-virtual-tryon-FIXED.json`

#### Nodos del Workflow Activo

| Nodo | ID | Función |
|------|----|---------|
| Webhook | `webhook-node-001` | Recibe petición POST en `/tryon` |
| Validar Input | `validate-input-001` | Valida campos y genera timestamp |
| Subir Selfie Temporal | `upload-selfie-001` | Sube selfie a WordPress (temp) |
| Preparar Prompt Gemini | `prepare-prompt-001` | Construye prompt completo |
| Generar con Gemini | `generate-gemini-001` | Llama a OpenRouter/Gemini |
| Extraer Imagen Base64 | `extract-image-001` | Extrae imagen de respuesta |
| Subir Imagen Final | `upload-final-001` | Sube resultado a WordPress (permanente) |
| Eliminar Selfie Temporal | `delete-temp-001` | Limpia selfie temporal |
| Preparar Respuesta | `prepare-response-001` | Formatea respuesta final |
| Responder Éxito | `respond-success-001` | Envía respuesta al cliente |

#### Problemas Conocidos y Soluciones

1. **`new URL()` falla en task runner de n8n:** Usar regex `/^https?:\/\/.+/` en su lugar
2. **Template `{{ }}` con base64 rompe JSON:** Construir el body del HTTP Request en un nodo Code previo y pasar como variable simple
3. **Workflow se desactiva tras PUT:** Verificar `active` y llamar `/activate` si es necesario
4. **Respuesta vacía `""`:** Indica que un nodo intermedio falló y n8n cerró la conexión sin llegar al nodo "Responder Éxito"


### Requirement 23: Personalización Avanzada del Widget (Templates y Opciones Pro)

**User Story:** Como marca, quiero personalizar la apariencia de mi probador virtual con templates prediseñados y opciones avanzadas según mi plan, para mantener consistencia con mi identidad de marca.

#### Acceptance Criteria

1. THE Try_On_System SHALL ofrecer al menos 3 templates visuales para el widget: Minimal, Modern y Bold
2. THE Try_On_System SHALL marcar el template "Bold" como exclusivo del Plan Pro
3. WHEN una marca selecciona un template, THE Try_On_System SHALL aplicar automáticamente los colores primario y secundario del template
4. THE Try_On_System SHALL mostrar una mini-preview del template antes de seleccionarlo
5. THE Try_On_System SHALL permitir personalizar el texto del botón principal (solo Plan Pro)
6. THE Try_On_System SHALL permitir configurar un mensaje de bienvenida en la pantalla inicial del widget (solo Plan Pro)
7. WHEN una marca con Plan Básico intenta usar opciones Pro, THE Try_On_System SHALL mostrar overlay bloqueado con mensaje de actualización
8. THE Try_On_System SHALL mostrar vista previa en tiempo real del widget con los cambios aplicados
9. THE Try_On_System SHALL persistir los campos `widget_template`, `button_text` y `welcome_message` en la tabla `brands` de Supabase
10. THE Try_On_System SHALL exponer `button_text` y `welcome_message` en el endpoint público `/api/pruebalo/:brandSlug`
11. WHEN el widget carga, THE Try_On_System SHALL usar `buttonText` de la configuración de marca en lugar de texto hardcodeado
12. WHEN el widget carga, THE Try_On_System SHALL mostrar `welcomeMessage` en la pantalla de subida de selfie si está configurado

#### Campos de Configuración

| Campo | Tipo | Plan | Descripción |
|-------|------|------|-------------|
| `widget_template` | string | Básico/Pro | Template visual: `minimal`, `modern`, `bold` |
| `primary_color` | string | Básico/Pro | Color principal en formato hexadecimal |
| `secondary_color` | string | Básico/Pro | Color de fondo en formato hexadecimal |
| `button_text` | string | Pro | Texto del botón de generación |
| `welcome_message` | string | Pro | Mensaje en pantalla inicial del widget |

#### Templates Disponibles

| Template | Plan | Color Principal | Color Fondo | Descripción |
|----------|------|----------------|-------------|-------------|
| `minimal` | Básico | `#111827` | `#F9FAFB` | Limpio y elegante, fondo blanco |
| `modern` | Básico | `#6366F1` | `#EEF2FF` | Vibrante con gradientes suaves |
| `bold` | Pro | `#F59E0B` | `#111827` | Oscuro y llamativo |

#### Implementación Frontend

**Componentes modificados:**
- `SettingsForm.tsx`: Reescrito con 3 tabs (General, Apariencia, Pro), templates con mini-preview, color presets clickeables, opciones Pro con overlay de bloqueo
- `TryOnWidget.tsx`: Usa `buttonText` y `welcomeMessage` de `config.brand` en lugar de valores hardcodeados
- `SelfieUploader.tsx`: Acepta prop `welcomeMessage` y lo muestra en la pantalla inicial

**Mapeo snake_case ↔ camelCase:**
- Frontend service (`brands.service.ts`) convierte `widget_template` → `widgetTemplate`, `button_text` → `buttonText`, `welcome_message` → `welcomeMessage`
- Backend controller acepta `widget_template`, `button_text`, `welcome_message` en el body del PATCH
- Endpoint público (`pruebalo.controller.ts`) devuelve `button_text` y `welcome_message` en la respuesta

#### Migración de Base de Datos Requerida

Si los campos no existen en la tabla `brands` de Supabase, ejecutar:

```sql
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS widget_template VARCHAR(50) DEFAULT 'minimal',
  ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) DEFAULT 'Probarme esto',
  ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT '';
```

### Requirement 24: Corrección de Bugs de Sintaxis en Componentes Frontend

**User Story:** Como desarrollador, necesito que los componentes del frontend estén libres de errores de sintaxis para que la aplicación compile y funcione correctamente.

#### Bugs Corregidos

1. **TryOnWidget.tsx:** Faltaba el `}` de cierre del bloque JSX del paso `upload`, causando que todo el JSX posterior quedara fuera del return y generara errores de compilación en cascada
2. **SettingsForm.tsx:** El archivo quedó corrupto con código mezclado dentro del JSX del componente `WidgetPreview` (código de formulario insertado dentro de un atributo `clas` inválido), causando más de 60 errores de TypeScript

#### Acceptance Criteria

1. THE Try_On_System SHALL compilar sin errores de TypeScript en todos los componentes del widget
2. THE Try_On_System SHALL compilar sin errores de TypeScript en todos los componentes del dashboard
3. WHEN se modifique un componente, THE Try_On_System SHALL verificar que no haya errores de diagnóstico antes de considerar el cambio completo
4. THE Try_On_System SHALL mantener el `SettingsForm.tsx` con la estructura de 3 tabs: General, Apariencia y Pro
5. THE Try_On_System SHALL mantener el `TryOnWidget.tsx` con el flujo de 4 pasos: upload → select → generating → result


### Requirement 25: Migración de Base de Datos — Campos de Personalización del Widget

**User Story:** Como administrador del sistema, necesito que la tabla `brands` en Supabase tenga los campos necesarios para la personalización avanzada del widget, para que las marcas puedan guardar su configuración correctamente.

#### Contexto

El error "Error al actualizar la marca" en la página de Configuración del dashboard se produce porque los campos `widget_template`, `button_text` y `welcome_message` no existen en la tabla `brands` de Supabase. El backend intenta hacer un `UPDATE` con esos campos y Supabase devuelve error de columna inexistente.

#### SQL de Migración

Ejecutar en Supabase Dashboard → SQL Editor (`https://supabase.com/dashboard/project/vkdooutklowctuudjnkl/sql/new`):

```sql
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS widget_template VARCHAR(50) DEFAULT 'minimal',
  ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) DEFAULT 'Probarme esto',
  ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT '';
```

#### Acceptance Criteria

1. THE Try_On_System SHALL tener las columnas `widget_template`, `button_text` y `welcome_message` en la tabla `brands` de Supabase
2. THE Try_On_System SHALL usar `VARCHAR(50)` para `widget_template` con default `'minimal'`
3. THE Try_On_System SHALL usar `VARCHAR(100)` para `button_text` con default `'Probarme esto'`
4. THE Try_On_System SHALL usar `TEXT` para `welcome_message` con default `''`
5. WHEN se ejecute la migración, THE Try_On_System SHALL usar `IF NOT EXISTS` para evitar errores si las columnas ya existen
6. THE Try_On_System SHALL actualizar el tipo `Brand` en `backend/src/types/index.ts` para incluir los nuevos campos
7. AFTER la migración, THE Try_On_System SHALL reiniciar el backend para que tome los cambios del schema

#### Actualización del Tipo Brand (Backend)

Agregar a `backend/src/types/index.ts` en la interfaz `Brand`:

```typescript
export interface Brand {
  // ... campos existentes ...
  widget_template: string | null;
  button_text: string | null;
  welcome_message: string | null;
}
```

#### Fallback Implementado

Mientras las columnas no existan, el `brands.service.ts` tiene un fallback que detecta el error de columna inexistente y reintenta la actualización solo con los campos base (`name`, `logo`, `primary_color`, `secondary_color`). Esto evita que el formulario de configuración falle completamente, aunque los campos de widget no se guarden hasta que se ejecute la migración.

#### Proyecto Supabase

- **Project Ref:** `vkdooutklowctuudjnkl`
- **URL:** `https://vkdooutklowctuudjnkl.supabase.co`
- **SQL Editor:** `https://supabase.com/dashboard/project/vkdooutklowctuudjnkl/sql/new`


### Requirement 26: Cambios en Backend — Soporte Completo de Campos de Widget

**User Story:** Como sistema, el backend debe soportar completamente los campos de personalización del widget sin usar `(brand as any)` ni tener fallbacks de emergencia, ahora que la migración de base de datos fue ejecutada.

#### Cambios Implementados

**`backend/src/types/index.ts`**
- Agregados campos `widget_template`, `button_text`, `welcome_message` al interface `Brand`
- Eliminado el uso de `(brand as any)` en el controller de pruebalo

**`backend/src/services/brands.service.ts`**
- `UpdateBrandDto` ya incluía los 3 campos nuevos
- Lógica de fallback agregada temporalmente: si Supabase devuelve error de columna inexistente, reintenta solo con campos base (`name`, `logo`, `primary_color`, `secondary_color`)
- Este fallback puede eliminarse una vez confirmada la migración en producción

**`backend/src/controllers/pruebalo.controller.ts`**
- Eliminado `(brand as any).widget_template` → ahora usa `brand.widget_template` directamente
- Eliminado `(brand as any).button_text` → ahora usa `brand.button_text`
- Eliminado `(brand as any).welcome_message` → ahora usa `brand.welcome_message`

**`backend/src/controllers/brands.controller.ts`**
- Ya acepta y procesa `widget_template`, `button_text`, `welcome_message` del body del PATCH `/api/brands/me`

#### Scripts de Utilidad Creados

- `backend/src/scripts/migrate-brands-widget-fields.ts` — verifica qué columnas faltan y genera el SQL necesario
- `backend/src/scripts/run-migration.ts` — detecta si las columnas existen y muestra instrucciones

#### Estado Actual

- ✅ Migración SQL ejecutada en Supabase (columnas existen)
- ✅ Backend reiniciado y corriendo en puerto 3001
- ✅ Tipos TypeScript actualizados
- ✅ Sin uso de `(brand as any)` en controllers
- ✅ Formulario de configuración guarda correctamente los 3 campos nuevos


### Requirement 27: Fix del Embed — Compatibilidad con Next.js 14 y Colores Dinámicos

**User Story:** Como cliente final, quiero que el embed del probador virtual cargue correctamente y refleje los colores configurados por la marca, para tener una experiencia visual consistente.

#### Problemas Corregidos

1. **`embed/[brandSlug]/page.tsx` — `params` como Promise en Next.js 14:**
   En Next.js 14 con App Router, `params` en server components es una `Promise` y debe usarse con `await`. El componente fue actualizado a `async` y usa `await params` para obtener `brandSlug`.

2. **`TryOnWidget.tsx` — Background hardcodeado:**
   El widget usaba `bg-gray-50` hardcodeado como fondo. Ahora usa `secondaryColor` de la configuración de marca aplicado via `style={{ backgroundColor: secondaryColor }}`.

#### Acceptance Criteria

1. THE Try_On_System SHALL usar `async/await` en `embed/[brandSlug]/page.tsx` para obtener `params` correctamente en Next.js 14
2. THE Try_On_System SHALL tipar `params` como `Promise<{ brandSlug: string }>` en el server component del embed
3. THE Try_On_System SHALL aplicar `secondaryColor` de la configuración de marca como color de fondo del widget
4. WHEN `secondaryColor` no esté configurado, THE Try_On_System SHALL usar `#f9fafb` como valor por defecto
5. THE Try_On_System SHALL reflejar cambios de configuración (colores, template, buttonText, welcomeMessage) en el embed sin necesidad de rebuild

#### Archivos Modificados

- `frontend/src/app/embed/[brandSlug]/page.tsx` — Convertido a async, `params` con `await`
- `frontend/src/components/tryon/TryOnWidget.tsx` — `secondaryColor` extraído de config y aplicado como background dinámico

#### Configuración de API URL

- **Desarrollo:** `NEXT_PUBLIC_API_URL=http://localhost:3001` (en `frontend/.env`)
- **Producción:** Requiere actualizar `NEXT_PUBLIC_API_URL` en `frontend/.env.production` con la URL real del backend (actualmente tiene placeholder `REEMPLAZAR_CON_URL_API_PRODUCCION`)
- El frontend en producción debe apuntar a la URL pública del backend para que el embed funcione desde sitios externos


### Requirement 28: Integración con Supabase MCP Power

**User Story:** Como desarrollador del sistema, quiero usar el Power de Supabase en Kiro para ejecutar migraciones y consultas SQL directamente desde el IDE, para gestionar la base de datos sin salir del entorno de desarrollo.

#### Configuración del MCP de Supabase

**Archivo:** `~/.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "env": {},
      "disabled": false,
      "autoApprove": ["fetch"]
    }
  },
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "url": "https://mcp.supabase.com/mcp",
        "disabled": false,
        "autoApprove": [
          "list_tables",
          "apply_migration",
          "get_project_api_keys",
          "get_anon_key",
          "list_projects",
          "execute_sql",
          "get_advisors",
          "list_migrations"
        ]
      }
    }
  }
}
```

#### Proyecto Supabase

- **Project Ref:** `vkdooutklowctuudjnkl`
- **URL:** `https://vkdooutklowctuudjnkl.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM`

#### Acceptance Criteria

1. THE Try_On_System SHALL usar el Power de Supabase en Kiro para ejecutar SQL directamente cuando sea necesario
2. THE Try_On_System SHALL usar `execute_sql` del MCP para migraciones y consultas de diagnóstico
3. THE Try_On_System SHALL usar `list_tables` para verificar el schema de la base de datos
4. THE Try_On_System SHALL usar `apply_migration` para aplicar migraciones de forma controlada
5. WHEN el Power de Supabase no esté disponible, THE Try_On_System SHALL usar el SQL Editor de Supabase Dashboard como fallback

#### Troubleshooting del Power de Supabase

**Si el Power no funciona:**
1. Verificar que `~/.kiro/settings/mcp.json` tenga JSON válido (sin comas faltantes ni llaves sin cerrar)
2. El JSON debe tener `mcpServers` cerrado con `}` antes de la clave `"powers"`
3. Reiniciar Kiro después de corregir el JSON
4. Verificar en la vista MCP Server del panel de Kiro que el servidor esté conectado


### Requirement 29: Layouts Diferenciados por Template en el Widget

**User Story:** Como marca, quiero que cada template del probador virtual tenga una disposición visual completamente diferente (no solo colores), para que la elección de template tenga un impacto real en la experiencia del usuario final.

#### Acceptance Criteria

1. THE Try_On_System SHALL implementar el template `minimal` con layout de barra superior: header fijo en la parte superior, productos en fila horizontal y selfie centrada debajo
2. THE Try_On_System SHALL implementar el template `modern` con layout de sidebar lateral: panel izquierdo con lista de productos y área principal a la derecha con la selfie
3. THE Try_On_System SHALL implementar el template `bold` (solo Pro) con layout centrado: hero grande centrado con selfie prominente y grid de productos en la parte inferior
4. THE Try_On_System SHALL mostrar una mini-preview visual del layout de cada template en el selector de la pestaña Apariencia del dashboard
5. WHEN una marca selecciona un template, THE Try_On_System SHALL actualizar la vista previa del widget en tiempo real con el layout correspondiente
6. THE Try_On_System SHALL diferenciar los templates no solo por colores sino por la posición y tamaño de los elementos (header, productos, selfie, botón)
7. THE Try_On_System SHALL bloquear el template `bold` para marcas con Plan Básico, mostrando badge "Pro" y cursor no permitido
8. WHEN una marca con Plan Pro selecciona `bold`, THE Try_On_System SHALL mostrar el layout con fondo oscuro, hero centrado grande y grid de 4 productos

#### Descripción de Layouts

| Template | Layout | Productos | Selfie | Botón |
|----------|--------|-----------|--------|-------|
| `minimal` | Barra superior | Fila horizontal | Centrada abajo | Ancho completo |
| `modern` | Sidebar izquierdo | Panel lateral | Área principal derecha | Centrado |
| `bold` | Centrado (Pro) | Grid 4 columnas inferior | Hero grande superior | Centrado inferior |

#### Implementación

- **`SettingsForm.tsx`:** Componente `LayoutMiniPreview` renderiza SVG/divs representando cada layout. Componente `WidgetPreview` renderiza el widget completo con el layout seleccionado.
- **`TryOnWidget.tsx`:** Actualmente usa un layout único. La aplicación del template al widget público es una mejora futura (ver Requirement 30).


### Requirement 30: Diferenciación Visual Evidente entre Plan Básico y Plan Pro

**User Story:** Como marca con Plan Básico, quiero ver claramente qué opciones adicionales tiene el Plan Pro, para evaluar si vale la pena actualizar mi plan.

#### Acceptance Criteria

1. THE Try_On_System SHALL mostrar una pestaña "Pro" en el formulario de configuración del dashboard
2. WHEN la marca tiene Plan Básico, THE Try_On_System SHALL mostrar en la pestaña Pro:
   - Banner con gradiente dorado/naranja destacando el Plan Pro
   - Lista de 6+ features exclusivas con iconos
   - Mensaje de contacto para actualizar el plan
   - Formulario de opciones Pro deshabilitado con overlay de opacidad reducida
3. WHEN la marca tiene Plan Pro, THE Try_On_System SHALL mostrar en la pestaña Pro:
   - Badge de confirmación "Tienes acceso completo al Plan Pro"
   - Formulario de opciones Pro completamente habilitado
4. THE Try_On_System SHALL deshabilitar el botón "Guardar" en la pestaña Pro para marcas con Plan Básico, mostrando "Requiere Plan Pro"
5. THE Try_On_System SHALL mostrar badge "Pro" en el template `bold` dentro del selector de templates de la pestaña Apariencia
6. THE Try_On_System SHALL aplicar `opacity-60` y `cursor-not-allowed` al template `bold` cuando la marca tiene Plan Básico
7. THE Try_On_System SHALL mostrar en la pestaña Pro las siguientes features exclusivas:
   - Texto del botón personalizado
   - Mensaje de bienvenida
   - Template Bold (layout centrado)
   - Hasta 15 productos
   - 1.200 generaciones/mes
   - Soporte prioritario


### Requirement 31: Página de Suscripción Estilizada con Comparativa de Planes

**User Story:** Como marca, quiero ver una página de suscripción visualmente atractiva con información clara de mi plan actual, comparativa con otros planes y una forma fácil de solicitar cambios, para gestionar mi suscripción sin necesidad de contactar soporte directamente.

#### Acceptance Criteria

1. THE Try_On_System SHALL mostrar una card hero con gradiente del color del plan actual (slate para Básico, indigo/purple para Pro)
2. THE Try_On_System SHALL mostrar en la card hero: nombre del plan, precio mensual en COP y estado de suscripción con badge de color semántico
3. THE Try_On_System SHALL mostrar una barra de progreso visual indicando los días transcurridos del ciclo de 30 días
4. THE Try_On_System SHALL mostrar los días restantes de suscripción debajo de la barra de progreso
5. THE Try_On_System SHALL mostrar una comparativa lado a lado de Plan Básico vs Plan Pro con sus features completas
6. THE Try_On_System SHALL resaltar el plan actual con borde indigo y badge "Tu plan"
7. THE Try_On_System SHALL mostrar botón "Solicitar cambio a [Plan]" en el plan que no es el actual
8. WHEN una marca hace clic en cambiar de plan, THE Try_On_System SHALL mostrar un modal con:
   - Header con gradiente del plan destino
   - Campo de texto para que la marca explique por qué quiere cambiar
   - Botón de envío deshabilitado si el campo está vacío
   - Confirmación visual tras enviar la solicitud
9. THE Try_On_System SHALL mostrar sección de contacto con email y WhatsApp para renovaciones manuales
10. THE Try_On_System SHALL mostrar historial de pagos en tabla estilizada con columnas: Fecha, Monto, Método, Estado
11. WHEN no hay historial de pagos, THE Try_On_System SHALL mostrar estado vacío con ícono y mensaje descriptivo
12. THE Try_On_System SHALL usar `subscriptionService.getSubscriptionInfo()` para obtener datos de suscripción en tiempo real
13. THE Try_On_System SHALL formatear todos los montos en COP usando `formatCurrency()` de `utils/currency.ts`
14. THE Try_On_System SHALL mostrar los estados de pago con colores semánticos: completado (verde), pendiente (amarillo), fallido (rojo), reembolsado (gris)

#### Información de Contacto para Renovaciones

- **Email:** info@pruebalo.wilkiedevs.com
- **WhatsApp:** +57 310 543 6281 (enlace: `https://wa.me/573105436281`)

#### Precios de Planes

| Plan | Precio mensual |
|------|---------------|
| Básico | $150.000 COP |
| Pro | $250.000 COP |


### Requirement 31: Sistema Anti-Abuso de Trials por Campaña

**User Story:** Como administrador del sistema, quiero controlar cuándo se ofrece el período de prueba gratuito y bloquear registros múltiples desde el mismo dispositivo o red, para evitar que se consuman créditos de IA de forma abusiva.

#### Estrategia Implementada

El trial gratuito solo se activa cuando el administrador crea y activa una campaña desde el panel de admin. Sin campaña activa, los nuevos registros crean la cuenta sin trial (trial_end_date = null, créditos = 0). El bloqueo anti-abuso se aplica por IP y por fingerprint de dispositivo.

#### Acceptance Criteria

1. THE Try_On_System SHALL requerir una campaña de trial activa para que nuevos registros reciban período de prueba
2. WHEN no hay campaña activa, THE Try_On_System SHALL crear la cuenta sin trial (trial_end_date = null, trial_generations_limit = 0)
3. WHEN hay campaña activa, THE Try_On_System SHALL verificar si la IP del registro ya tiene un trial en los últimos 30 días
4. WHEN hay campaña activa, THE Try_On_System SHALL verificar si el fingerprint del dispositivo ya tiene un trial en los últimos 30 días
5. IF se detecta abuso por IP o fingerprint, THEN THE Try_On_System SHALL rechazar el registro con error TRIAL_ABUSE (HTTP 429)
6. WHEN se crea una cuenta con trial exitosamente, THE Try_On_System SHALL registrar IP y fingerprint en trial_registrations
7. THE Try_On_System SHALL permitir al admin crear campañas con nombre, duración en días y fecha de fin opcional
8. THE Try_On_System SHALL permitir al admin activar y desactivar campañas desde el dashboard
9. THE Try_On_System SHALL garantizar que solo una campaña esté activa a la vez
10. THE Try_On_System SHALL exponer endpoint público GET /api/trial/status con estado de campaña activa y días de prueba
11. THE Try_On_System SHALL mostrar en el formulario de registro si hay trial activo y cuántos días incluye
12. WHEN se detecta TRIAL_ABUSE en el frontend, THE Try_On_System SHALL mostrar mensaje claro con enlace a /planes
13. THE Try_On_System SHALL capturar el fingerprint del dispositivo usando @fingerprintjs/fingerprintjs en el frontend
14. THE Try_On_System SHALL enviar el fingerprint junto con los datos de registro al backend

#### Tablas de Base de Datos

**trial_campaigns:**
- id (UUID), name (TEXT), active (BOOLEAN), trial_days (INTEGER), ends_at (TIMESTAMPTZ nullable), created_by (TEXT), created_at, updated_at

**trial_registrations:**
- id (UUID), brand_id (UUID → brands), campaign_id (UUID → trial_campaigns), ip_address (TEXT), fingerprint (TEXT nullable), created_at

#### Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/trial/status | Público | Estado de campaña activa |
| GET | /api/admin/trial-campaign | Admin | Listar campañas |
| POST | /api/admin/trial-campaign | Admin | Crear campaña |
| PATCH | /api/admin/trial-campaign/:id | Admin | Activar/desactivar campaña |
