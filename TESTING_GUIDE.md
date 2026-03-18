# Guía de Testing Manual — Lookitry

> Tener a mano para verificar que todas las funcionalidades del sitio están activas y correctas.
> Actualizar cuando se agreguen nuevas funcionalidades.

---

## Antes de empezar

### Deshabilitar Turnstile (para tests automatizados o manuales rápidos)
```bash
# Desde Mostrador_wilkiedevs/
python scripts/_toggle_turnstile.py --disable
python scripts/_deploy_now.py --restart
```

### Rehabilitar Turnstile (producción)
```bash
python scripts/_toggle_turnstile.py --enable
python scripts/_deploy_now.py --restart
```

---

## URLs del entorno

| Servicio | URL |
|---|---|
| Frontend | https://pruebalo.wilkiedevs.com |
| API | https://api.pruebalo.wilkiedevs.com |
| Admin | https://pruebalo.wilkiedevs.com/admin |

---

## 1. Registro de nuevo usuario

**URL:** https://pruebalo.wilkiedevs.com/register

### Datos de prueba
```
Nombre de la marca:     Marca Test QA
Slug:                   marca-test-qa
Email:                  test+qa@tudominio.com   ← usar email REAL tuyo
Nombre del responsable: Juan Pérez Test
Teléfono:               +57 300 000 0000  (opcional, puede dejarse vacío)
Contraseña:             Test1234!
```

### Validaciones a verificar
- [ ] Slug se genera automáticamente al escribir el nombre de la marca
- [ ] Email con dominio desechable (ej. `test@mailinator.com`) debe ser rechazado
- [ ] `contact_name` con menos de 3 caracteres debe ser rechazado
- [ ] Contraseña menor a 6 caracteres debe ser rechazada
- [ ] Email ya registrado debe mostrar error de conflicto
- [ ] Slug ya en uso debe mostrar error de conflicto
- [ ] Registro exitoso redirige al dashboard o a verificación de tarjeta (si está activa)
- [ ] Se recibe email de verificación en la bandeja de entrada

### Script automatizado
```bash
python scripts/_test_registro.py
```

---

## 2. Verificación de email

1. Revisar bandeja de entrada del email usado en el registro
2. Hacer clic en el enlace de verificación
3. Debe mostrar mensaje: "Correo verificado correctamente"
4. Iniciar sesión — debe funcionar sin errores

---

## 3. Login

**URL:** https://pruebalo.wilkiedevs.com/login

- [ ] Login con credenciales correctas → redirige al dashboard
- [ ] Login con contraseña incorrecta → "Credenciales inválidas"
- [ ] Login con email no registrado → "Credenciales inválidas"
- [ ] "Olvidé mi contraseña" → envía email de recuperación

---

## 4. Dashboard — Funcionalidades básicas

**URL:** https://pruebalo.wilkiedevs.com/dashboard

- [ ] Se muestra el nombre de la marca y el plan (TRIAL o BASIC)
- [ ] Contador de generaciones disponibles visible
- [ ] Menú lateral funciona correctamente
- [ ] Botón de cerrar sesión funciona

---

## 5. Agregar producto

**URL:** https://pruebalo.wilkiedevs.com/dashboard/productos

- [ ] Formulario de nuevo producto visible
- [ ] Subir imagen del producto (JPG/PNG)
- [ ] "Describir con IA" genera descripción automática
- [ ] Producto aparece en la lista después de guardar
- [ ] Producto puede activarse/desactivarse

---

## 6. Probador virtual (widget)

**URL:** https://pruebalo.wilkiedevs.com/sitio/[tu-slug]

- [ ] Widget carga correctamente
- [ ] Botón "Probar" visible
- [ ] Subir selfie (foto de frente, buena iluminación)
- [ ] Seleccionar producto
- [ ] Generación de imagen funciona (puede tardar 15-30 segundos)
- [ ] Resultado se muestra correctamente
- [ ] Contador de generaciones se decrementa

---

## 7. Pago con Wompi — Modo Sandbox

### Activar modo sandbox
El modo sandbox se activa automáticamente cuando las claves de Wompi son de prueba.
Verificar en `backend/.env` que `WOMPI_PUBLIC_KEY` empiece con `pub_test_`.

### Tarjetas de prueba Wompi

| Tipo                 | Número             | CVV   | Vencimiento | Resultado |
|---|---|---|---|---|
| Visa aprobada        | `4242424242424242` | `123` |     `12/29` | Aprobado  |
| Mastercard aprobada  | `5555555555554444` | `123` |     `12/29` | Aprobado  |
| Visa rechazada       | `4111111111111111` | `123` |     `12/29` | Rechazado |
| Fondos insuficientes | `4000000000009995` | `123` |     `12/29` | Rechazado |

**Datos del titular (cualquier valor):**
```
Nombre: Test User
Documento: 1234567890
Cuotas: 1
```

### Flujo de verificación de tarjeta (si está activo)
1. Registrar nueva cuenta
2. Ser redirigido a Wompi automáticamente
3. Ingresar tarjeta de prueba aprobada
4. Verificar que regresa al dashboard con estado TRIAL activo
5. Verificar que el cobro de $100 COP aparece como reembolsado (puede tardar minutos)

### Flujo de pago de plan
**URL:** https://pruebalo.wilkiedevs.com/planes

1. Seleccionar plan BASIC ($150.000 COP) o PRO ($250.000 COP)
2. Completar checkout con tarjeta de prueba aprobada
3. Verificar redirección a `/pago-exitoso`
4. Verificar que el plan se actualiza en el dashboard

---

## 8. Recuperación de contraseña

1. Ir a https://pruebalo.wilkiedevs.com/login
2. Clic en "Olvidé mi contraseña"
3. Ingresar email registrado
4. Revisar bandeja de entrada
5. Clic en enlace de recuperación
6. Ingresar nueva contraseña (mínimo 6 caracteres)
7. Iniciar sesión con la nueva contraseña

---

## 9. Configuración de la marca

**URL:** https://pruebalo.wilkiedevs.com/dashboard/configuracion

- [ ] Cambiar nombre de la marca
- [ ] Subir logo
- [ ] Cambiar color primario
- [ ] Guardar cambios → se reflejan en el widget

---

## 10. Antispam — Verificar bloqueos

### Emails desechables bloqueados
Intentar registrar con estos dominios (deben ser rechazados):
- `test@mailinator.com`
- `test@guerrillamail.com`
- `test@yopmail.com`
- `test@tempmail.com`
- `test@10minutemail.com`

### Abuso de trial por IP
Si hay campaña de trial activa, registrar dos cuentas desde la misma IP debe bloquear la segunda con:
> "Ya existe una cuenta de prueba registrada desde este dispositivo o red."

---

## 11. Verificar SEO básico

- [ ] https://pruebalo.wilkiedevs.com/sitemap.xml — debe listar las páginas públicas
- [ ] https://pruebalo.wilkiedevs.com/robots.txt — debe existir
- [ ] Favicon visible en la pestaña del navegador
- [ ] Título de la página correcto en cada sección

---

## Checklist rápido de deploy

Antes de dar por bueno un deploy:

```bash
# 1. Verificar que el backend responde
curl https://api.pruebalo.wilkiedevs.com/health

# 2. Verificar que el frontend carga
curl -I https://pruebalo.wilkiedevs.com

# 3. Verificar sitemap
curl https://pruebalo.wilkiedevs.com/sitemap.xml

# 4. Test de registro automatizado
python scripts/_test_registro.py
```

---

## Credenciales de admin (solo para testing)

> Estas credenciales son para el panel de administración interno.
> No compartir ni subir a repositorios públicos.

- Panel admin: https://pruebalo.wilkiedevs.com/admin
- Credenciales: ver `backend/.env` → `ADMIN_EMAIL` / `ADMIN_PASSWORD`

---

*Última actualización: ver historial de git*
