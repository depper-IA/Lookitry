# Arquitectura de Datos y Estados para un Registro/Checkout Robusto en Lookitry

## 1. Principios Fundamentales para un Sistema Infalible

La construcción de un sistema de registro y checkout que sea resistente a fallos y que corrija las inconsistencias previas requiere la adhesión a principios arquitectónicos sólidos. Estos principios garantizan la integridad de los datos, la eficiencia operativa y una experiencia de usuario sin fricciones.

### 1.1. Transacciones Atómicas

Una cuenta de usuario se considerará completamente creada y activa solo después de que todos los pasos críticos del proceso —autenticación, validación de los datos de la marca y confirmación del pago— se hayan completado con éxito. Este enfoque previene la existencia de estados intermedios inconsistentes que podrían dejar al sistema en un limbo operativo o con datos parciales.

### 1.2. Fuente Única de Verdad (Single Source of Truth)

La base de datos, en este caso Supabase, servirá como la fuente definitiva y autoritativa para el estado de los usuarios y sus suscripciones. Tanto el frontend como el backend deben reflejar y actualizar este estado de manera consistente, eliminando cualquier ambigüedad sobre la información del usuario.

### 1.3. Validación Temprana y Continua

Las validaciones de datos se implementarán en las etapas más tempranas del flujo de usuario (frontend) y se revalidarán rigurosamente en el backend. Esta estrategia de doble validación es crucial para prevenir la entrada de datos maliciosos o incorrectos, garantizando la calidad de la información desde el origen.

### 1.4. Separación de Responsabilidades

Se establecerá una clara distinción entre la lógica de autenticación, la lógica de negocio (gestión de planes, slugs) y la lógica de procesamiento de pagos. Esta separación modular facilita el mantenimiento del código, mejora la escalabilidad del sistema y permite una gestión más eficiente de cada componente.

### 1.5. Idempotencia en Webhooks

Los webhooks de pago se diseñarán para ser idempotentes, lo que significa que pueden procesar la misma notificación múltiples veces sin generar efectos secundarios no deseados, como la doble activación de una suscripción. Esta característica es fundamental para la robustez del sistema frente a reintentos de notificación o fallos temporales de red.

## 2. Modelos de Datos Actualizados en Supabase

Para soportar el nuevo flujo de registro y checkout, se revisarán y ajustarán los modelos de datos existentes. La tabla `brands` mantendrá su rol central, y se introducirá una nueva tabla, `pending_registrations_v2`, para gestionar el estado transaccional de los registros antes de la creación definitiva de la marca.

### 2.1. Tabla `brands` (Actualizaciones Clave)

La tabla `brands` se actualizará para incluir campos que reflejen el proveedor de autenticación y el estado de onboarding, asegurando una gestión integral de la marca.

| Campo | Tipo | Descripción | Notas Clave |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Identificador único de la marca. | Clave primaria. |
| `email` | `text` | Correo electrónico del usuario. | `UNIQUE`, `NOT NULL`. |
| `password` | `text` | Contraseña hasheada. | `NOT NULL` si `auth_provider` es `email`. |
| `name` | `text` | Nombre de la marca. | `NOT NULL`. |
| `slug` | `text` | URL personalizada de la marca. | `UNIQUE`, `NOT NULL`, validación `^[a-z0-9-]+$`. |
| `contact_name` | `text` | Nombre completo del contacto principal. | `NOT NULL`. |
| `plan` | `plan_type` | Plan actual (`TRIAL`, `BASIC`, `PRO`, `ENTERPRISE`). | `NOT NULL`, `DEFAULT 'TRIAL'`. |
| `auth_provider` | `text` | Proveedor de autenticación (`email`, `google`). | `DEFAULT 'email'`. |
| `google_id` | `text` | ID único de Google si se usó Google Auth. | `UNIQUE`, `NULLABLE`. |
| `email_verified` | `boolean` | Indica si el correo ha sido verificado. | `DEFAULT FALSE`. |
| `email_verification_token` | `text` | Token para verificación de correo. | `NULLABLE`. |
| `subscription_status` | `subscription_status` | Estado de la suscripción (`active`, `trial`, `expired`, etc.). | `NULLABLE`. |
| `subscription_start_date` | `timestamptz` | Fecha de inicio de la suscripción. | `NULLABLE`. |
| `subscription_end_date` | `timestamptz` | Fecha de fin de la suscripción. | `NULLABLE`. |
| `trial_end_date` | `timestamptz` | Fecha de fin del período de prueba. | `NULLABLE`. |
| `trial_generations_limit` | `integer` | Límite de generaciones durante el trial. | `DEFAULT 0`. |
| `has_landing_page` | `boolean` | Indica si la marca tiene el add-on de landing page. | `DEFAULT FALSE`. |
| `needs_onboarding` | `boolean` | Indica si el usuario necesita completar datos de marca (ej. slug) después de Google Auth. | `DEFAULT FALSE`. |

### 2.2. Nueva Tabla `pending_registrations_v2`

Esta tabla es fundamental para gestionar el estado transaccional de los registros que aún no han completado el pago o la configuración de la marca. Su propósito es mantener un registro temporal hasta que la marca se cree o se vincule exitosamente, momento en el cual se eliminará.

| Campo | Tipo | Descripción | Notas Clave |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Identificador único del registro pendiente. | `PRIMARY KEY`. |
| `email` | `text` | Correo electrónico del usuario. | `UNIQUE`, `NOT NULL`. |
| `password_hash` | `text` | Contraseña hasheada (si es registro manual). | `NULLABLE`. |
| `google_id` | `text` | ID de Google (si es Google Auth). | `NULLABLE`. |
| `name_prefill` | `text` | Nombre sugerido para la marca. | `NULLABLE`. |
| `contact_name_prefill` | `text` | Nombre de contacto sugerido. | `NULLABLE`. |
| `selected_plan` | `plan_type` | Plan elegido por el usuario. | `NOT NULL`. |
| `months` | `integer` | Meses de suscripción (para planes pagos). | `DEFAULT 1`. |
| `includes_landing` | `boolean` | Si el plan incluye el add-on de landing. | `DEFAULT FALSE`. |
| `status` | `text` | Estado del registro pendiente (`initiated`, `payment_pending`, `brand_config_pending`, `completed`, `failed`). | `NOT NULL`, `DEFAULT 'initiated'`. |
| `payment_reference` | `text` | Referencia de pago (Wompi, PayPal). | `UNIQUE`, `NULLABLE`. |
| `created_at` | `timestamptz` | Fecha de creación del registro pendiente. | `DEFAULT now()`. |
| `expires_at` | `timestamptz` | Fecha de expiración del registro pendiente. | Se puede limpiar periódicamente. |

## 3. Flujo de Estados Detallado (Frontend y Backend)

El nuevo flujo de registro y checkout se concibe como una máquina de estados, donde cada interacción del usuario y cada respuesta del sistema transicionan a un estado claro y predefinido. Esto elimina ambigüedades y garantiza la coherencia del proceso.

### 3.1. Flujo de Registro Manual

El registro manual se estructura en tres pasos principales, culminando con la activación atómica de la cuenta tras la confirmación del pago.

#### Paso 1: Autenticación (Frontend y Backend)

1.  **Frontend**: El usuario ingresa su dirección de correo electrónico y una contraseña. Se realizan validaciones iniciales en el cliente para el formato del email y la complejidad de la contraseña (longitud mínima, presencia de mayúsculas, minúsculas, números y caracteres especiales).
2.  **Backend (`/api/auth/initiate-manual-registration`)**: El servidor valida la unicidad del email y hashea la contraseña. Posteriormente, crea un registro en la tabla `pending_registrations_v2` con un estado inicial de `brand_config_pending`, almacenando el email, el hash de la contraseña y los detalles del plan seleccionado. Se devuelve un `registration_id` temporal al frontend.

#### Paso 2: Configuración de Marca (Frontend y Backend)

1.  **Frontend**: El usuario proporciona el nombre de su marca y un slug personalizado. Se aplican validaciones en el cliente para la longitud y el formato del slug (solo minúsculas, números y guiones).
2.  **Backend (`/api/brand/check-slug-availability`)**: Se realiza una verificación en tiempo real para asegurar que el slug no esté reservado y sea único en las tablas `brands` y `pending_registrations_v2`.
3.  **Backend (`/api/auth/complete-brand-config`)**: El registro pendiente en `pending_registrations_v2` se actualiza con el nombre de la marca y el slug, y su estado cambia a `payment_pending`. Se devuelve el `registration_id` y los detalles del plan al frontend para proceder al checkout.

#### Paso 3: Checkout y Activación Atómica (Frontend y Backend)

1.  **Frontend**: Se presenta al usuario un resumen del plan y las opciones de pago. El proceso de pago se inicia con la pasarela seleccionada (Wompi/PayPal), enviando el `registration_id` como metadato o referencia de la transacción.
2.  **Backend (Webhook de Pago - Wompi/PayPal)**: Al recibir la notificación de pago `APPROVED`, el sistema extrae el `registration_id` de la referencia. Se verifica que el estado del registro pendiente sea `payment_pending` y que el monto pagado coincida con el plan. Si todas las validaciones son exitosas, se procede a la **creación atómica de la marca**:
    *   Se inserta una nueva entrada en la tabla `brands` utilizando los datos de `pending_registrations_v2`.
    *   Se establece `email_verified: FALSE` y se genera un `email_verification_token`.
    *   Se actualizan los campos de suscripción (`subscription_status`, `subscription_start_date`, `subscription_end_date`, `trial_end_date`).
    *   El registro en `pending_registrations_v2` se marca como `completed` o se elimina.
    *   Se envía un correo electrónico de verificación y se genera un JWT para la sesión del usuario.

### 3.2. Flujo de Registro con Google Auth (Onboarding Diferido)

El registro mediante Google Auth se optimiza para una experiencia rápida, con un paso de onboarding diferido para la configuración de la marca.

#### Paso 1: Autenticación con Google (Frontend y Backend)

1.  **Frontend**: El usuario selecciona "Continuar con Google". Google devuelve un `id_token` o `access_token`.
2.  **Backend (`/api/auth/google-login`)**: El token de Google se verifica en el backend para asegurar su autenticidad. Se extraen el email, nombre y `google_id` del usuario. El sistema busca una cuenta existente en `brands` por `google_id` o email. Si se encuentra una cuenta por email pero sin `google_id`, se vincula el `google_id` a la cuenta existente y se procede al login. Si no existe, se crea un registro en `pending_registrations_v2` con `status: 'brand_config_pending'`, incluyendo el email, `google_id` y nombres pre-rellenados. Se devuelve un `registration_id` temporal y un flag `needs_onboarding: TRUE` al frontend.

#### Paso 2: Configuración de Marca (Onboarding Diferido - Frontend y Backend)

1.  **Frontend**: Si el flag `needs_onboarding` es `TRUE`, el usuario es redirigido a una página de configuración de marca. Aquí, se le solicita que ingrese el nombre de su marca y un slug, que pueden estar pre-rellenados con la información de Google.
2.  **Backend (`/api/brand/check-slug-availability`)**: Similar al registro manual, se valida la unicidad y el formato del slug.
3.  **Backend (`/api/auth/complete-brand-config`)**: El registro pendiente en `pending_registrations_v2` se actualiza con los datos de la marca y el slug, y su estado cambia a `payment_pending`. Se devuelve el `registration_id` y los detalles del plan (por defecto TRIAL o el seleccionado) para el checkout.

#### Paso 3: Checkout y Activación Atómica (Frontend y Backend)

1.  **Frontend**: El usuario procede al checkout, donde se muestra el resumen del plan y las opciones de pago. El `registration_id` se envía a la pasarela de pago.
2.  **Backend (Webhook de Pago - Wompi/PayPal)**: La lógica es idéntica a la del registro manual. La marca se crea atómicamente en la tabla `brands` utilizando los datos de `pending_registrations_v2`. En este caso, `email_verified` se establece como `TRUE` ya que Google ha verificado el correo.

## 4. Validaciones Críticas para la Integridad del Sistema

La implementación de validaciones rigurosas en cada etapa del proceso es esencial para prevenir errores y mantener la integridad de los datos. Estas validaciones se aplicarán tanto en el frontend para una retroalimentación inmediata al usuario, como en el backend para garantizar la seguridad y la consistencia.

### 4.1. Validación de Slug

El slug, que forma parte de la URL personalizada de la marca, debe cumplir con criterios estrictos para asegurar su funcionalidad y unicidad:

*   **Formato (Regex)**: El slug solo puede contener letras minúsculas, números y guiones. Se utilizará la expresión regular `^[a-z0-9-]+$` para hacer cumplir esta regla. Esto excluye espacios, caracteres especiales y letras mayúsculas.
*   **Longitud**: Se establecerá una longitud mínima de 3 caracteres y una máxima de 50 caracteres para el slug, optimizando tanto la legibilidad como la gestión en la base de datos.
*   **Slugs Reservados**: Se mantendrá una lista de slugs prohibidos (ej., `admin`, `login`, `api`, `blog`, `checkout`, `register`, `home`, `app`, `dashboard`). Esta lista se aplicará tanto en el frontend como en el backend para evitar conflictos con rutas del sistema.
*   **Unicidad**: El slug debe ser único en todo el sistema. Esto implica verificar su disponibilidad en la tabla `brands` y en la tabla `pending_registrations_v2` para evitar colisiones durante el proceso de registro. El frontend realizará llamadas asíncronas (`/api/brand/check-slug-availability`) con un retardo (debounced) para proporcionar retroalimentación en tiempo real al usuario, mientras que el backend realizará la validación final antes de cualquier inserción.

### 4.2. Validación de Contraseña

La seguridad de la contraseña es primordial. Se aplicarán las siguientes reglas de complejidad:

*   **Longitud Mínima**: La contraseña debe tener al menos 8 caracteres.
*   **Complejidad de Caracteres**: Debe incluir al menos una letra mayúscula, una letra minúscula, un número y un carácter especial (ej., `!@#$%^&*()_+-=[]{};:'"\\|,.<>/?`).
*   **Confirmación**: El frontend debe solicitar al usuario que confirme la contraseña ingresándola una segunda vez para minimizar errores tipográficos.

El siguiente fragmento de código Python ilustra la lógica de validación de contraseña y slug que se puede adaptar a TypeScript para el backend:

```python
import re

def validate_password_complexity(password: str) -> dict:
    if len(password) < 8:
        return {"isValid": False, "message": "La contraseña debe tener al menos 8 caracteres"}
    if not re.search(r'[A-Z]', password):
        return {"isValid": False, "message": "La contraseña debe contener al menos una letra mayúscula"}
    if not re.search(r'[a-z]', password):
        return {"isValid": False, "message": "La contraseña debe contener al menos una letra minúscula"}
    if not re.search(r'[0-9]', password):
        return {"isValid": False, "message": "La contraseña debe contener al menos un número"}
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\\|,.<>/?]', password):
        return {"isValid": False, "message": "La contraseña debe contener al menos un carácter especial (!@#$%^&*...)"}
    return {"isValid": True}

def validate_slug(slug: str, reserved_slugs: list) -> dict:
    if not re.match(r'^[a-z0-9-]+$', slug):
        return {"isValid": False, "message": "El slug solo puede contener letras minúsculas, números y guiones"}
    if not (3 <= len(slug) <= 50):
        return {"isValid": False, "message": "El slug debe tener entre 3 y 50 caracteres"}
    if slug in reserved_slugs:
        return {"isValid": False, "message": "Este slug está reservado"}
    return {"isValid": True}
```

### 4.3. Validación de Email

La validación del email es un paso crítico para asegurar la comunicación efectiva con el usuario y prevenir abusos:

*   **Formato**: Se utilizará una expresión regular estándar para validar el formato del email, asegurando que cumpla con las convenciones de una dirección de correo electrónico válida.
*   **Dominios Desechables**: Se implementará una lista negra de dominios de correo electrónico temporales o desechables (ej. `mailinator.com`, `yopmail.com`). Los registros con estos dominios serán rechazados para mantener la calidad de los usuarios y evitar spam.
*   **Unicidad**: El email proporcionado debe ser único en todo el sistema. Esto se verificará tanto en la tabla `brands` como en `pending_registrations_v2` para evitar duplicidades y conflictos de cuentas.

## 5. Consideraciones Adicionales para la Robustez del Sistema

Para asegurar que el sistema sea completamente robusto y a prueba de fallos, se deben tener en cuenta las siguientes consideraciones:

*   **Manejo de Errores y Logging**: Se implementará un sistema exhaustivo de registro (logging) de eventos y errores en el backend. Esto permitirá monitorear el flujo en tiempo real, identificar rápidamente cualquier anomalía y facilitar la depuración. Las notificaciones automáticas para errores críticos son esenciales.

*   **Mecanismos de Reintento y Compensación**: Para operaciones que involucran servicios externos (como pasarelas de pago), se diseñarán mecanismos de reintento con retroceso exponencial. En casos de fallos irrecuperables, se considerará la implementación de lógica de compensación, como reembolsos automáticos o la generación de tareas manuales para el equipo de soporte.

*   **Seguridad Integral**: Todas las comunicaciones entre el frontend y el backend deben realizarse a través de HTTPS. Se utilizarán JSON Web Tokens (JWT) seguros para la autenticación y autorización, y se protegerán rigurosamente todas las claves API y secretos de entorno.

*   **Limpieza de `pending_registrations_v2`**: Se establecerá un cron job periódico para limpiar la tabla `pending_registrations_v2`, eliminando los registros que hayan expirado o que se hayan marcado como fallidos. Esto ayuda a mantener la base de datos optimizada y libre de datos obsoletos.

*   **Experiencia de Usuario (UX) en Errores**: En el frontend, los mensajes de error deben ser claros, concisos y útiles, guiando al usuario sobre cómo resolver el problema. Evitar mensajes técnicos crípticos y ofrecer soluciones prácticas.

---

**Autor**: Manus AI
**Fecha**: 5 de abril de 2026
