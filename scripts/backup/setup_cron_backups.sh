#!/bin/bash
# ============================================
# SCRIPT: setup_cron_backups.sh
# DESCRIPCIÓN: Configura cron jobs para backups
# FRECUENCIA: Una vez (para configurar)
# ============================================

echo "Configurando cron jobs para backups..."

# Hacer scripts ejecutables
chmod +x /root/scripts/backup/backup_supabase.sh
chmod +x /root/scripts/backup/backup_minio.sh
chmod +x /root/scripts/backup/backup_n8n.sh

# Crontab entries
CRON_ENTRIES="# Backup Lookitry - Daily Supabase a las 3:00 AM
0 3 * * * /root/scripts/backup/backup_supabase.sh >> /var/log/backup_supabase.log 2>&1

# Backup Lookitry - Semanal MinIO los domingos a las 2:00 AM
0 2 * * 0 /root/scripts/backup/backup_minio.sh >> /var/log/backup_minio.log 2>&1

# Backup Lookitry - Semanal n8n los domingos a las 4:00 AM
0 4 * * 0 /root/scripts/backup/backup_n8n.sh >> /var/log/backup_n8n.log 2>&1

# Limpieza de logs antiguos (mensual, día 1 a las 6:00 AM
0 6 1 * * find /var/log/backup_*.log -mtime +90 -delete
"

# Agregar al crontab actual
(crontab -l 2>/dev/null | grep -v "Backup Lookitry"; echo "$CRON_ENTRIES") | crontab -

echo "Cron jobs configurados:"
crontab -l | grep -i backup

echo ""
echo "Backup automático configurado exitosamente!"
echo "Los logs se guardarán en /var/log/backup_*.log"
