import sys
import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
cmd = """
docker stop root-n8n-1
VOL_PATH=$(docker volume inspect n8n_data --format '{{.Mountpoint}}')
# Delete WAL and SHM to clear any residual locks
rm -f $VOL_PATH/database.sqlite-wal
rm -f $VOL_PATH/database.sqlite-shm
chmod 777 $VOL_PATH/database.sqlite
chown 1000:1000 $VOL_PATH/database.sqlite
docker start root-n8n-1
"""
client.exec_command(cmd)
client.close()
