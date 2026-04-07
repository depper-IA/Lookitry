#!/bin/bash
# ============================================
# SCRIPT: backup_supabase.sh
# DESCRIPCIÓN: Backup de base de datos Supabase
# FRECUENCIA: Diario (recomendado)
# ============================================

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/supabase"
RETENTION_DAYS=84

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

echo "[$(date)] Iniciando backup de Supabase..."

# Obtener connection string desde variable de entorno o usar defaults
PGHOST=${PGHOST:-"vkdooutklowctuudjnkl.supabase.co"}
PGPORT=${PGPORT:-"5432"}
PGUSER=${PGUSER:-"postgres"}
PGDATABASE=${PGDATABASE:-"postgres"}

# Dump de la base de datos
pg_dump -h $PGHOST \
        -p $PGPORT \
        -U $PGUSER \
        -d $PGDATABASE \
        -F c \
        -b \
        -v \
        -f "$BACKUP_DIR/lookitry_backup_$DATE.dump"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup creado exitosamente"
    
    # Comprimir
    gzip "$BACKUP_DIR/lookitry_backup_$DATE.dump"
    echo "[$(date)] Backup comprimido"
    
    # Eliminar backups antiguos
    find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete
    echo "[$(date)] Backups antiguos eliminados (retención: $RETENTION_DAYS días)"
    
    echo "[$(date)] Backup completado: lookitry_backup_$DATE.dump.gz"
else
    echo "[$(date)] ERROR: Backup falló"
    exit 1
fi
