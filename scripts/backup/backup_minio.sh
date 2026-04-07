#!/bin/bash
# ============================================
# SCRIPT: backup_minio.sh
# DESCRIPCIÓN: Backup de buckets MinIO/S3
# FRECUENCIA: Semanal (recomendado)
# ============================================

RCLONE_CONFIG="${RCLONE_CONFIG:-/root/.config/rclone/rclone.conf}"
BACKUP_DIR="/root/backups/minio"
RETENTION_DAYS=84
DATE=$(date +%Y%m%d_%H%M%S)

echo "[$(date)] Iniciando backup de MinIO..."

mkdir -p $BACKUP_DIR

# Buckets a respaldar
BUCKETS="lookitry-selfies lookitry-products lookitry-results"

for BUCKET in $BUCKETS; do
    echo "[$(date)] Sincronizando bucket: $BUCKET"
    
    # Usar mc (MinIO Client) o rclone
    if command -v mc &> /dev/null; then
        # MinIO Client
        mc mirror --overwrite $BUCKET $BACKUP_DIR/$BUCKET
    elif command -v rclone &> /dev/null; then
        # rclone
        rclone sync minio/$BUCKET $BACKUP_DIR/$BUCKET \
            --config=$RCLONE_CONFIG \
            --transfers=4 \
            --checkers=8 \
            --log-level=INFO \
            --stats=1m
    else
        echo "[$(date)] ERROR: No se encontró mc ni rclone"
        exit 1
    fi
    
    if [ $? -eq 0 ]; then
        # Crear tarball
        tar -czf $BACKUP_DIR/${BUCKET}_${DATE}.tar.gz -C $BACKUP_DIR $BUCKET
        
        # Eliminar carpeta sync
        rm -rf $BACKUP_DIR/$BUCKET
        
        echo "[$(date)] Bucket $BUCKET respaldado exitosamente"
    else
        echo "[$(date)] ERROR: Fallo al respaldar bucket $BUCKET"
    fi
done

# Eliminar backups antiguos
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Backups antiguos eliminados (retención: $RETENTION_DAYS días)"

echo "[$(date)] Backup MinIO completado"
