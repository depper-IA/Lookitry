# 📊 CONFIGURACIÓN UPTIMEROBOT - LOOKITRY

**Última actualización:** 2026-04-07

---

## 🎯 ENDPOINTS CRÍTICOS A MONITOREAR

### 1. API Backend ( PRINCIPAL )
```
URL: https://api.lookitry.com/health
Tipo: HTTP(s)
Intervalo: 1 minuto
Alerta: Si tiempo de respuesta > 10s o status != 200
```

### 2. Frontend Website
```
URL: https://lookitry.com
Tipo: HTTP(s)
Intervalo: 5 minutos
Alerta: Si status != 200
```

### 3. Widget Try-On (Mini-landing público)
```
URL: https://lookitry.com/pruebalo/demo
Tipo: HTTP(s)
Intervalo: 5 minutos
Alerta: Si status != 200
```

### 4. n8n Workflows (Procesamiento IA)
```
URL: https://n8n.wilkiedevs.com/health
Tipo: HTTP(s)
Intervalo: 2 minutos
Alerta: Si status != 200
```

### 5. MinIO Storage (Imágenes y assets)
```
URL: https://minio.wilkiedevs.com/minio/health/live
Tipo: HTTP(s)
Intervalo: 5 minutos
Alerta: Si status != 200
```

### 6. Supabase (Base de datos)
```
URL: https://vkdooutklowctuudjnkl.supabase.co
Tipo: HTTP(s)
Intervalo: 5 minutos
Alerta: Si status != 200
```

### 7. Dashboard Admin
```
URL: https://lookitry.com/admin
Tipo: HTTP(s)
Intervalo: 10 minutos
Alerta: Si status != 200
```

---

## 📋 STATUS PAGE PÚBLICA

**URL:** https://stats.uptimerobot.com/CTEnSD7d1j

### Configurar Status Page:
1. Ir a UptimeRobot Dashboard → Status Pages
2. Crear/editar status page para Lookitry
3. Agregar los monitores listados arriba
4. Configurar政策性 de notificaciones

---

## 🔔 CONFIGURACIÓN DE ALERTAS

### Canales de notificación (en orden de prioridad):

#### 1. Email (Gratuito - incluido)
```
info@lookitry.com
```

#### 2. WhatsApp (Recomendado para respuesta rápida)
- Requiere: UptimeRobot Pro plan
- Configurar en: Dashboard → Alert Contacts → Add Alert Contact → WhatsApp

#### 3. Slack (Si tienen canal de DevOps)
- Webhook URL del canal de Slack
- Configurar en: Dashboard → Alert Contacts → Add Alert Contact → Slack

#### 4. Telegram Bot (Opcional)
- Ya tienes bot configurado: `TELEGRAM_BOT_TOKEN=8657005550:AAHSP_ht0nm3J2U...`
- Crear canal de alertas en Telegram

---

## ⚙️ PASOS PARA CONFIGURAR

### Paso 1: Crear cuenta/verificar cuenta
1. Ir a https://uptimerobot.com
2. Login con cuenta existente o crear nueva
3. Verificar email

### Paso 2: Agregar Alert Contacts
1. Dashboard → Alert Contacts → Add Alert Contact
2. Agregar email: info@lookitry.com
3. **(Opcional)** Agregar WhatsApp, Slack, Telegram

### Paso 3: Agregar Monitores
1. Dashboard → Add New Monitor
2. Para cada endpoint de la lista anterior:
   - Monitor Type: HTTP(s)
   - Friendly Name: [Nombre descriptivo]
   - URL: [URL del endpoint]
   - Monitoring Interval: [según tabla]
   - Alert Contacts: [seleccionar email/WhatsApp/etc]

### Paso 4: Crear Status Page
1. Dashboard → Status Pages → Create Status Page
2. Nombre: "Lookitry Status"
3. Agregar todos los monitores
4. Configurar:
   - Publicidade: Público
   - SSL check: Habilitado
   - Logo: Logo de Lookitry
5. Guardar y compartir URL

### Paso 5: Verificar funcionamiento
1. Hacer test manual: desactivar un contenedor y verificar que llega alerta
2. Verificar que status page muestra correctamente todos los servicios

---

## 🚨 CHECKLIST DE MONITOREEO

```
MONITORES CREADOS:
[ ] api.lookitry.com/health
[ ] lookitry.com
[ ] lookitry.com/pruebalo/demo
[ ] n8n.wilkiedevs.com/health
[ ] minio.wilkiedevs.com/minio/health/live
[ ] vkdooutklowctuudjnkl.supabase.co
[ ] lookitry.com/admin

ALERT CONTACTS:
[ ] Email configurado
[ ] WhatsApp configurado (recomendado)

STATUS PAGE:
[ ] Status page pública creada
[ ] URL verificada
[ ] Todos los monitores agregados
[ ] Test de alertas enviado
```

---

## 📊 MÉTRICAS A MONITOREAR

### Disponibilidad objetivo (SLA):
| Plan | Disponibilidad |
|------|----------------|
| BASIC | 99.5% → downtime máximo 3.6h/mes |
| PRO | 99.9% → downtime máximo 43min/mes |
| ENTERPRISE | 99.95% → downtime máximo 22min/mes |

### Tiempo de respuesta objetivo:
| Servicio | Máximo |
|----------|--------|
| API Backend | < 500ms |
| Frontend | < 2s |
| n8n | < 5s |

---

## 🔧 RUNBOOK: RESPUESTA A INCIDENTE

### Cuando llega alerta de downtime:

1. **Verificar** - Acceder al servicio reportado
2. **Evaluar** - Es alerta real o false positive?
3. **Comunicar** - Si es real, publicar en status page
4. **Escalar** - Notificar al equipo según severidad:
   - Level 1 (Frontend/API down): Responder en 15 min
   - Level 2 (Servicio degradado): Responder en 1 hora
   - Level 3 (Minor issue): Resolver en 24h

### Comandos de verificación en VPS:
```bash
# Ver estado de contenedores
docker ps -a

# Ver logs de backend
docker logs lookitry-backend --tail 100

# Ver logs de nginx/traefik
docker logs traefik --tail 100

# Reiniciar servicio específico
docker-compose -f /root/virtual-tryon/docker-compose.backend.yml restart backend
```

---

## 📝 NOTAS

- UptimeRobot free tier: 50 monitores, interval mínimo 5 min
- UptimeRobot paid: Más monitores, intervalos más frecuentes, más canales de alerta
- La status page pública ayuda a reducir tickets de soporte durante outages

---

## ACTUALIZACIÓN

Historial de cambios en la configuración de monitoreo.
