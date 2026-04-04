# WhatsApp Bot - Pendiente para Implementacion

## Estado: PENDIENTE

Este documento describe los requisitos para implementar un bot de WhatsApp automatico en el futuro.

---

## Requisitos del Negocio

### Canales de Soporte Actual
- WhatsApp: +57 310 543 6281
- Email: info@lookitry.com
- Horario: Lunes a Viernes 9am-6pm (Colombia)

### Objetivo
Implementar bot automatico de WhatsApp para:
1. Mensaje de bienvenida automatico
2. Respuestas rapidas a preguntas frecuentes
3. Escalamiento a soporte humano
4. Recopilar feedback inicial

---

## Requisito Tecnico

### Opcion 1: WhatsApp Business API (Recomendado)

**Proveedor**: Meta WhatsApp Business API

**Caracteristicas**:
- Messages templates para bienvenida
- WhatsApp Flows para interacciones
- Chatbot con AI
- Multiagente

**Costos**:
- Primeros 1,000 conversaciones/mes: Gratis
- Subsequent conversations: $0.005 - $0.14 per message

**Credenciales necesarias**:
- Facebook Business Account
- WhatsApp Business API credentials
- Phone number ID
- Access Token

**Documentacion**:
- https://developers.facebook.com/docs/whatsapp

### Opcion 2: n8n + WhatsApp (Alternativa)

Si ya tienen n8n configurado, pueden usar:
- n8n nodes para WhatsApp
- Integracion via Twilio o Meta

**Archivo de workflow existente**:
- `docs/n8n/workflow_whatsapp_bot.json` (crear)

---

## Flujo de Mensaje de Bienvenida Propuesto

```
Cliente: Hola

Bot: ¡Hola! 👋 Bienvenido a Lookitry

Soy el asistente virtual de Lookitry. ¿En que puedo ayudarte?

1️⃣Tengo una pregunta sobre mi cuenta
2️⃣Necesito ayuda tecnica
3️⃣Quiero activar un plan
4️⃣Hablar con un agente

Escribe el numero de opcion o describe tu necesidad.
```

---

## Configuracion del Numero

**El numero telefonico ya es configurable en el codigo:**

- `frontend/src/services/public-config.service.ts` (line 19)
- `backend/src/services/paymentSettings.service.ts` (line 37)
- Tabla: `payment_settings` en Supabase

Para cambiar el numero en el futuro, actualizar el campo `manual_whatsapp` en la tabla de configuracion.

---

## Pendiente: Integracion con CRM

Futuro: conectar bot de WhatsApp con CRM para tracking de ventas y soporte.

---

## Responsable

- **Owner**: Equipo de Producto
- **Prioridad**: Media
- **Bloqueador**: Requiere cuenta de Facebook Business

---

## Checklist de Implementacion

- [ ] Crear Facebook Business Account
- [ ] Configurar WhatsApp Business API
- [ ] Obtener credenciales (Phone ID, Access Token)
- [ ] Diseñar flujo de bienvenida
- [ ] Crear message templates
- [ ] Implementar bot con n8n o API directa
- [ ] Testear flujo
- [ ] Lanzar a produccion
