# Monitoreo de Uptime - Configuracion

## Estado: ✅ CONFIGURADO

Este documento describe los pasos para configurar monitoreo externo de uptime para Lookitry.

---

## Status Page

**URL pública:** https://stats.uptimerobot.com/CTEnSD7d1j

La página de estado pública muestra el estado de los servicios monitoreados.

---

## Endpoints Disponibles para Monitoreo

### Backend API
- **URL**: `https://api.lookitry.com/health`
- **Metodo**: GET
- **Respuesta esperada**: JSON con `status: "ok" | "degraded" | "down"`

Ejemplo de respuesta:
```json
{
  "status": "ok",
  "timestamp": "2026-04-03T12:00:00.000Z",
  "uptime": 86400,
  "services": {
    "supabase": { "status": "ok", "latency": 45 },
    "n8n": { "status": "ok", "latency": 120 },
    "email": { "status": "ok", "latency": 30 },
    "minio": { "status": "ok", "latency": 25 }
  }
}
```

### Frontend (Sitio Web)
- **URL**: `https://lookitry.com`
- **Metodo**: GET
- **Respuesta esperada**: 200 OK

### Widget Try-On
- **URL**: `https://lookitry.com/pruebalo/[brand-slug]`
- **Metodo**: GET
- **Respuesta esperada**: 200 OK

---

## Proveedores de Monitoreo Recomendados

### 1. UptimeRobot (Recomendado - Gratis)

**Plan Gratis**:
- Hasta 5 monitores
- Intervalo de verificacion: 5 min minimum
- Alertas por email
- Alertas por SMS (limitado)

**Pasos para configurar**:
1. Ir a https://uptimerobot.com
2. Crear cuenta gratuita
3. Click "Add New Monitor"
4. Seleccionar tipo "HTTP(s)"
5. Ingresar URL del endpoint
6. Configurar intervalo (5 min recomendado)
7. Guardar

### 2. Cronitor (Alternativa)

**Plan Gratis**:
- Hasta 5 monitores
- Intervalo: 1 min

**URL**: https://cronitor.io

### 3. Pingdom (Enterprise)

**Caracteristicas**:
- Mas avanzado
- Analisis de rendimiento

**URL**: https://www.pingdom.com

---

## Configuracion de Alertas Sugerida

### Email
- **Destinatario**: info@lookitry.com
- **Asunto**: [ALERTA] Lookitry - Servicio caido

### WhatsApp (opcional)
- Configurar via UptimeRobot integration
- O usar Twilio para alertas automaticas

### Slack (opcional)
- Crear webhook de incoming
- Configurar en UptimeRobot

---

## Checklist de Configuracion

- [ ] Crear cuenta en UptimeRobot
- [ ] Agregar monitor: `https://api.lookitry.com/health`
- [ ] Agregar monitor: `https://lookitry.com`
- [ ] Configurar alertas por email
- [ ] Probar alerta (simular caida)
- [ ] Documentar runbook de respuesta a incidentes

---

## Runbook de Incidentes

### Si el status es "degraded":
1. Verificar logs del backend: `backend.log`
2. Revisar credit usage en OpenRouter
3. Verificar queue de n8n

### Si el status es "down":
1. Verificar que el servidor esta up
2. Revisar Redis/queue workers
3. Verificar creditos de API (OpenRouter, Replicate)
4. Revisar Base de datos Supabase
5. Notificar al equipo de guardia

---

## Responsable

- **Owner**: Equipo de Operaciones
- **Prioridad**: Alta
- **Deadline**: Antes de lanzar a produccion

---

## Notas

- El endpoint `/health` NO requiere autenticacion
- Retorna codigo 200 si todo ok, 503 si hay problemas
- El campo `uptime` muestra segundos desde ultimo reinicio del proceso
