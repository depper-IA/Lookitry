# 🛡️ PLAN DE BACKUP Y DISASTER RECOVERY - LOOKITRY

**Fecha:** 2026-04-06  
**Última actualización:** 2026-04-06  
**Responsable:** Equipo Lookitry  

---

## 📋 ÍNDICE

1. [Inventario de Activos](#1-inventario-de-activos)
2. [Estrategia de Backup](#2-estrategia-de-backup)
3. [Procedimientos de Backup](#3-procedimientos-de-backup)
4. [Procedimientos de Restauración](#4-procedimientos-de-restauración)
5. [Disaster Recovery](#5-disaster-recovery)
6. [Contacto de Emergencia](#6-contacto-de-emergencia)

---

## 1. INVENTARIO DE ACTIVOS

### 1.1 Base de Datos (Supabase)

| Attribute | Value |
|-----------|-------|
| **Tipo** | PostgreSQL 15 (Supabase Managed) |
| **Proyecto** | vkdooutklowctuudjnkl |
| **Región** | us-east-1 |
| **Endpoint** | `vkdooutklowctuudjnkl.supabase.co` |
| **Tamaño estimado** | ~1-10 GB |
| **Tablas** | 40+ |

### 1.2 Almacenamiento (MinIO/S3)

| Attribute | Value |
|-----------|-------|
| **Tipo** | MinIO (S3-compatible) |
| **URL** | https://minio.wilkiedevs.com |
| **Buckets** | `lookitry-selfies`, `lookitry-products`, `lookitry-results` |
| **Tamaño estimado** | ~50-100 GB |
| **Uptime** | 6+ semanas |

### 1.3 Workflows (n8n)

| Attribute | Value |
|-----------|-------|
| **URL** | https://n8n.wilkiedevs.com |
| **Workflows activos** | Try-on, Descriptor, Enterprise Sync |
| **Criticalidad** | ALTA - sin n8n no funciona Try-On |

### 1.4 Aplicaciones

| Servicio | Contenedor | Recursos |
|----------|------------|----------|
| Backend | lookitry-backend | 512MB-1GB RAM |
| Frontend | lookitry-frontend | ~512MB RAM |
| Traefik | (reverse proxy) | - |

---

## 2. ESTRATEGIA DE BACKUP

### 2.1 Base de Datos (Supabase)

| Tipo | Frecuencia | Retención | Ubicación |
|------|------------|-----------|-----------|
| **Automatic Daily** | Diario | 7 días | Supabase (automático) |
| **Point-in-time** | Continuo | 30 días | Supabase (automático) |
| **Manual Full** | Semanal | 12 semanas | VPS / Backup storage |

**Nota:** Supabase proporciona backups automáticos diarios y PITR (Point-in-Time Recovery). Verificar que esté habilitado en Dashboard → Settings → Database.

### 2.2 MinIO (Object Storage)

| Tipo | Frecuencia | Retención | Herramienta |
|------|------------|-----------|-------------|
| **Versioning** | Automático | 30 días | MinIO built-in |
| **Full backup** | Semanal | 12 semanas | `mc mirror` o rclone |
| **Incremental** | Diario | 7 días | rclone sync |

### 2.3 n8n Workflows

| Tipo | Frecuencia | Retención | Método |
|------|------------|-----------|--------|
| **Export JSON** | Antes de cambios | Forever | n8n UI → Settings → Export |
| **Auto-save** | Cada 5 min | - | n8n built-in |
| **Git backup** | Semanal | Forever | git repo dedicado |

---

## 3. PROCEDIMIENTOS DE BACKUP

### 3.1 Backup Manual de Supabase (PostgreSQL)

```bash
#!/bin/bash
# backup_supabase.sh
# Ejecutar en VPS o máquina con acceso a Postgres

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/supabase"
RETENTION_DAYS=84

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Dump de la base de datos
pg_dump -h vkdooutklowctuudjnkl.supabase.co \
        -U postgres \
        -d postgres \
        -F c \
        -b \
        -v \
        -f "$BACKUP_DIR/lookitry_backup_$DATE.dump"

# Comprimir
gzip "$BACKUP_DIR/lookitry_backup_$DATE.dump"

# Eliminar backups antiguos
find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completado: lookitry_backup_$DATE.dump.gz"
```

### 3.2 Backup de MinIO con rclone

```bash
#!/bin/bash
# backup_minio.sh

RCLONE_CONFIG="/root/.config/rclone/rclone.conf"
BACKUP_DIR="/root/backups/minio"
RETENTION_DAYS=84

mkdir -p $BACKUP_DIR

# Backup de cada bucket
for BUCKET in lookitry-selfies lookitry-products lookitry-results; do
    DATE=$(date +%Y%m%d_%H%M%S)
    rclone sync minio:$BUCKET $BACKUP_DIR/$BUCKET \
        --config=$RCLONE_CONFIG \
        --transfers=4 \
        --checkers=8 \
        --drive-chunk-size=64M \
        --log-level=INFO \
        --stats=1m

    # Crear tarball
    tar -czf $BACKUP_DIR/${BUCKET}_${DATE}.tar.gz -C $BACKUP_DIR $BUCKET
    
    # Eliminar carpeta sync
    rm -rf $BACKUP_DIR/$BUCKET
done

# Eliminar backups antiguos
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup MinIO completado"
```

### 3.3 Backup de n8n Workflows

```bash
#!/bin/bash
# backup_n8n.sh

BACKUP_DIR="/root/backups/n8n"
DATE=$(date +%Y%m%d_%H%M%S)
N8N_URL="https://n8n.wilkiedevs.com"

mkdir -p $BACKUP_DIR

# Exportar workflows via n8n API
curl -X GET "$N8N_URL/rest/workflows" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -o "$BACKUP_DIR/workflows_$DATE.json"

# Backup de credenciales (encrypted)
curl -X GET "$N8N_URL/rest/credentials" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -o "$BACKUP_DIR/credentials_$DATE.json"

# Comprimir
tar -czf $BACKUP_DIR/n8n_backup_$DATE.tar.gz \
    -C $BACKUP_DIR \
    workflows_$DATE.json \
    credentials_$DATE.json

rm workflows_$DATE.json credentials_$DATE.json

echo "Backup n8n completado: n8n_backup_$DATE.tar.gz"
```

### 3.4 Cron Jobs (Programar backups automáticos)

```bash
# Agregar a crontab: crontab -e

# Backup Supabase diario a las 3:00 AM
0 3 * * * /root/scripts/backup_supabase.sh >> /var/log/backup_supabase.log 2>&1

# Backup MinIO semanal los domingos a las 2:00 AM
0 2 * * 0 /root/scripts/backup_minio.sh >> /var/log/backup_minio.log 2>&1

# Backup n8n semanal los domingos a las 4:00 AM
0 4 * * 0 /root/scripts/backup_n8n.sh >> /var/log/backup_n8n.log 2>&1

# Limpieza de logs antiguos (mensual)
0 5 1 * * find /var/log/backup_*.log -mtime +90 -delete
```

---

## 4. PROCEDIMIENTOS DE RESTAURACIÓN

### 4.1 Restaurar Base de Datos Supabase

```bash
#!/bin/bash
# restore_supabase.sh
# WARNING: Este proceso sobreescribe la base de datos actual

BACKUP_FILE=$1  # Path al archivo .dump.gz

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <archivo_backup.dump.gz>"
    exit 1
fi

# Descomprimir si es .gz
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -k "$BACKUP_FILE"
    BACKUP_FILE=${BACKUP_FILE%.gz}
fi

# Restaurar (requiere service_role key)
pg_restore -h vkdooutklowctuudjnkl.supabase.co \
           -U postgres \
           -d postgres \
           --clean \
           --if-exists \
           -v \
           "$BACKUP_FILE"

echo "Restauración completada"
```

### 4.2 Restaurar MinIO

```bash
#!/bin/bash
# restore_minio.sh

BUCKET=$1
BACKUP_FILE=$2  # Path al archivo .tar.gz

if [ -z "$BUCKET" ] || [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <bucket_name> <archivo_backup.tar.gz>"
    exit 1
fi

# Extraer
tar -xzf "$BACKUP_FILE"

# Restaurar
rclone sync ./$BUCKET minio:$BUCKET \
    --config=/root/.config/rclone/rclone.conf \
    --transfers=4 \
    --log-level=INFO

# Limpiar
rm -rf ./$BUCKET

echo "Restauración MinIO completada"
```

### 4.3 Restaurar n8n Workflows

```bash
#!/bin/bash
# restore_n8n.sh

BACKUP_FILE=$1  # Path al archivo .tar.gz

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <archivo_backup.tar.gz>"
    exit 1
fi

# Extraer
tar -xzf "$BACKUP_FILE"

# Restaurar workflows
# (Requiere importación manual via UI o API)

echo "Extraido a directorio actual. Importar manualmente via n8n UI"
```

---

## 5. DISASTER RECOVERY

### 5.1 RTO (Recovery Time Objective)

| Servicio | RTO | Justificación |
|----------|-----|--------------|
| Database | 4 horas | Crítico - sin DB no hay servicio |
| Files (MinIO) | 24 horas | Afecta nuevos uploads, productos |
| n8n | 2 horas | Sin workflows no hay Try-On |
| Backend | 1 hora | API principal |
| Frontend | 1 hora | Sitio público |

### 5.2 RPO (Recovery Point Objective)

| Servicio | RPO | Justificación |
|----------|-----|--------------|
| Database | 1 hora | Máximo 1 hora de pérdida de datos |
| Files (MinIO) | 24 horas | Máximo 1 día de pérdida de archivos |
| n8n | 1 semana | Workflows cambian poco |

### 5.3 Escenarios de Disaster

#### Escenario 1: Base de Datos Corrupta

```
1. Detectar problema (monitoring/alertas)
2. Notificar al equipo (Slack/Email)
3. Evaluar severidad:
   - Si hay backups PITR de Supabase: usar point-in-time restore
   - Si no: restaurar desde backup más reciente
4. Ejecutar restore
5. Verificar integridad
6. Restart servicios
7. Notificar resolución
```

#### Escenario 2: Pérdida Total del VPS

```
1.确认灾难 - 确认VPS无法恢复
2. Provisionar nuevo VPS con misma configuración
3. Reconstruir contenedores desde docker-compose
4. Restaurar backups de:
   - Supabase (PITR o dump)
   - MinIO (rclone restore)
   - n8n workflows (desde backup JSON)
5. Verificar configuración de DNS/Traefik
6. Tests de humo
7. Notificar a usuarios si hubo downtime
```

#### Escenario 3: Ransomware/Ataque

```
1. Aislar inmediatamente - desconectar de red
2. No pagar - no negociar con atacantes
3. Evaluar alcance del daño
4. Si hay backups limpios:
   - Formatear VPS
   - Restaurar desde backup anterior al ataque
5. Cambiar TODAS las credenciales
6. Investigar vector de ataque
7. Implementar medidas preventivas
8. Restaurar servicios
```

---

## 6. CONTACTO DE EMERGENCIA

### 6.1 Equipo de Respuesta

| Rol | Nombre | Teléfono | Email |
|-----|--------|----------|-------|
| IT Lead | (agregar) | (agregar) | (agregar) |
| DevOps | (agregar) | (agregar) | (agregar) |
| CEO/Founder | (agregar) | (agregar) | (agregar) |

### 6.2 Servicios Externos

| Servicio | URL | Teléfono/Emergencia |
|----------|-----|-------------------|
| Supabase Support | https://supabase.com/dashboard | support@supabase.com |
| VPS Provider | (agregar) | (agregar) |
| Domain Registrar | (agregar) | (agregar) |

### 6.3 Links Importantes

- Supabase Dashboard: https://supabase.com/dashboard/project/vkdooutklowctuudjnkl
- MinIO Console: https://minio.wilkiedevs.com
- n8n: https://n8n.wilkiedevs.com
- Traefik Dashboard: (agregar si existe)

---

## 7. CHECKLIST DE VERIFICACIÓN

### 7.1 Semanal

- [ ] Verificar que backups se ejecutaron exitosamente
- [ ] Revisar logs de backup por errores
- [ ] Verificar espacio en disco en VPS

### 7.2 Mensual

- [ ] Probar restauración en ambiente de staging
- [ ] Rotar credenciales de backup
- [ ] Actualizar contactos de emergencia
- [ ] Revisar y actualizar este documento

### 7.3 Trimestral

- [ ] Disaster recovery drill completo
- [ ] Penetration testing
- [ ] Auditoría de seguridad
- [ ] Revisión de RTO/RPO

---

## 8. HISTORIAL DE CAMBIOS

| Fecha | Versión | Cambios | Autor |
|-------|---------|---------|-------|
| 2026-04-06 | 1.0 | Creación inicial del documento | DevGuardian |

---

**IMPORTANTE:** Este documento debe ser revisado y actualizado regularmente. Guardar copia fuera del VPS (ej: Google Drive, GitHub private repo).
