import sys
import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
cmd = "VOL_PATH=$(docker volume inspect n8n_data --format '{{.Mountpoint}}') && chown -R 1000:1000 $VOL_PATH && chmod -R 777 $VOL_PATH && docker restart root-n8n-1"
client.exec_command(cmd)
client.close()
