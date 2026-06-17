# Propuesta: Hardening de Seguridad Lookitry

## Declaración del Problema

Se han identificado múltiples vulnerabilidades críticas en el backend y la base de datos de Lookitry que exponen al sistema a ataques de fuerza bruta, filtración de credenciales en logs, evasión de controles de rate limiting y acceso no autorizado a datos sensibles (PII).

* **VULN-001 (Admin Brute Force)**: Ausencia de políticas de bloqueo de cuenta ante múltiples intentos fallidos de login para administradores.
* **VULN-002 (CORS)**: Configuración permisiva de CORS en rutas públicas (`publicCorsConfig` con origen `*`), exponiendo endpoints a accesos no autorizados de orígenes cruzados.
* **VULN-004 (API Key Log Leak)**: Impresión de cabeceras sensibles (como `Authorization` y `X-Api-Key`) en el log al registrar bloqueos de origen en `widgetSecurity.ts`.
* **VULN-005 (JWT/Redis fail-open)**: Falla de rate limiters al caer en modo permisivo (fail-open) si Redis se desconecta, dejando la API expuesta a denegación de servicio (DoS).
* **DB Audit**: Ausencia de auditoría centralizada de políticas de seguridad a nivel de fila (RLS) en la base de datos.

## Solución Propuesta (Hardening Incremental)

Adoptar un enfoque de **Hardening Incremental** para parchar puntualmente cada vulnerabilidad identificada, minimizando el riesgo de regresiones operativas en producción.

## Alcance (Backend + DB)

### En Alcance (In Scope)
* **VULN-001**: Implementar lógica de bloqueo de cuentas (Account Lockout: 5 intentos = 15 min de bloqueo) usando los campos `failed_login_attempts` y `locked_until` en la tabla `brands` durante el flujo de login.
* **VULN-002**: Reemplazar CORS wildcard de rutas públicas con validación dinámica estricta basada en `allowed_origins` registrado por cada marca.
* **VULN-004**: Sanitizar el log de cabeceras en `widgetSecurity.ts` para excluir `Authorization`, `X-Api-Key` y cookies.
* **VULN-005**: Configurar rate limiters para fallar-cerrado (fail-closed) o usar un fallback seguro en memoria si Redis no está disponible.
* **DB Audit**: Crear y aplicar un script SQL de auditoría de políticas RLS para forzar `USING` y validar roles `anon` y `authenticated` en Supabase.

### Fuera de Alcance (Out of Scope)
* Reescritura total del middleware de autenticación.
* Pentesting de caja negra externo.

## Capacidades (Capabilities)

### New Capabilities
- Ninguna

### Modified Capabilities
- `user-auth`: Validación robusta de intentos de login y fail-closed de tokens.
- `widget-api-security`: CORS dinámico estricto y sanitización de registros de auditoría.

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|--------|-------------|
| `backend/src/middleware/auth.ts` | Modified | Lockout y control estricto de fail-open de JWT |
| `backend/src/middleware/rateLimiter.ts` | Modified | Robustez contra desconexión de Redis (VULN-005) |
| `backend/src/middleware/widgetSecurity.ts` | Modified | Sanitización de logs (VULN-004) |
| `backend/src/config/security.config.ts` | Modified | Corrección de CORS permisivo (VULN-002) |
| `Supabase (PostgreSQL)` | Modified | Script de auditoría de políticas RLS y roles |

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|------|--------|-------------|
| Bloqueo accidental de clientes legítimos por CORS estricto. | Alto | Poblar la tabla de marcas con sus orígenes antes de activar la validación estricta. |
| Falsos positivos en bloqueo de cuentas (Lockout). | Medio | Logs detallados de intentos fallidos y permitir desbloqueo manual por base de datos. |

## Plan de Retorno (Rollback)

Si ocurren fallos críticos en producción:
1. Revertir cambios de middlewares al commit anterior.
2. Desactivar temporalmente la restricción de CORS estricto en el backend usando variables de entorno de fallback.
3. Desactivar el RLS de tablas si bloquea queries críticas legítimas.

## Criterios de Éxito

- [ ] Bloqueo de login activado tras 5 intentos fallidos (VULN-001).
- [ ] CORS bloquea orígenes no registrados para el widget (VULN-002).
- [ ] Logs no registran Authorization ni X-Api-Key (VULN-004).
- [ ] RLS activo y auditado en tablas sensibles (DB Audit).
