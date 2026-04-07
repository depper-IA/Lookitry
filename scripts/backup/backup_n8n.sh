#!/bin/bash
# ============================================
# SCRIPT: backup_n8n.sh
# DESCRIPCIÓN: Backup de workflows n8n
# FRECUENCIA: Semanal (recomendado)
# ============================================

BACKUP_DIR="/root/backups/n8n"
DATE=$(date +%Y%m%d_%H%M%S)
N8N_URL="${N8N_URL:-https://n8n.wilkiedevs.com}"
N8N_API_KEY="${N8N_API_KEY}"

echo "[$(date)] Iniciando backup de n8n..."

mkdir -p $BACKUP_DIR

if [ -z "$N8N_API_KEY" ]; then
    echo "[$(date)] ERROR: N8N_API_KEY no está configurada"
    exit 1
fi

# Exportar workflows
echo "[$(date)] Exportando workflows..."
curl -s -X GET "$N8N_URL/rest/workflows" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -o "$BACKUP_DIR/workflows_$DATE.json"

if [ $? -eq 0 ] && [ -s "$BACKUP_DIR/workflows_$DATE.json" ]; then
    echo "[$(date)] Workflows exportados exitosamente"
else
    echo "[$(date)] ERROR: Fallo al exportar workflows"
    rm -f "$BACKUP_DIR/workflows_$DATE.json"
    exit 1
fi

# Exportar credenciales (encrypted)
echo "[$(date)] Exportando credenciales..."
curl -s -X GET "$N8N_URL/rest/credentials" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -o "$BACKUP_DIR/credentials_$DATE.json"

if [ $? -eq 0 ] && [ -s "$BACKUP_DIR/credentials_$DATE.json" ]; then
    echo "[$(date)] Credenciales exportadas exitosamente"
else
    echo "[$(date)] ERROR: Fallo al exportar credenciales"
    rm -f "$BACKUP_DIR/credentials_$DATE.json"
fi

# Comprimir todo
tar -czf $BACKUP_DIR/n8n_backup_$DATE.tar.gz \
    -C $BACKUP_DIR \
    workflows_$DATE.json \
    credentials_$DATE.json

rm -f workflows_$DATE.json credentials_$DATE.json

echo "[$(date)] Backup n8n completado: n8n_backup_$DATE.tar.gz"
