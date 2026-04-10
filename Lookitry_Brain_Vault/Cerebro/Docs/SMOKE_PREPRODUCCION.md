# Smoke QA de Preproducción

Batería rápida para validar recorridos críticos antes de salir a producción.

## Comando

```bash
cd backend
npm run test:smoke
```

## Qué valida

- `GET /health`
  - El backend responde.
  - El payload de salud incluye estado general y servicios.
- `POST /api/auth/register`
  - Las validaciones mínimas del registro fallan correctamente por HTTP.
- `POST /api/auth/login`
  - Credenciales inválidas devuelven `401`.
- `GET /api/payments/wompi/checkout-url`
  - Un visitante puede iniciar checkout guest y crear registro pendiente.
- `POST /api/payments/checkout-addon`
  - Una marca autenticada puede iniciar compra de créditos extra.

## Objetivo

Detectar regresiones graves en auth, checkout y disponibilidad del sistema antes de un deploy o venta a clientes.

## Importante

- Esta batería usa Express real y rutas HTTP reales, pero con integraciones externas mockeadas.
- No reemplaza una validación E2E completa con navegador, webhooks sandbox y staging.
- Sirve como barrera rápida de preproducción dentro del repo.
