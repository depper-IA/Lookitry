import sys
import paramiko
import time

VPS_HOST = "31.220.18.39"
VPS_USER = "root"
VPS_PASS = "Travis18456916#"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)
print("[+] Conectado. Deteniendo procesos de Node/PM2 para liberar CPU...")
client.exec_command("pm2 stop all")
time.sleep(3)

print("[+] Deteniendo n8n...")
client.exec_command("docker stop root-n8n-1")

print("[+] Limpiando locks de SQLite...")
cmd = """
VOL_PATH=$(docker volume inspect n8n_data --format '{{.Mountpoint}}')
rm -f $VOL_PATH/database.sqlite-wal
rm -f $VOL_PATH/database.sqlite-shm
chmod 777 $VOL_PATH/database.sqlite
"""
client.exec_command(cmd)
time.sleep(2)

print("[+] Iniciando n8n (ahora con el VPS aliviado)...")
client.exec_command("docker start root-n8n-1")
print("[+] Esperando 15 segundos a que inicie n8n...")
time.sleep(15)

print("[+] Verificando estado:")
stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' https://n8n.wilkiedevs.com/healthz")
print("HTTP Code Healthz:", stdout.read().decode().strip())

print("[+] Iniciando procesos de PM2 de nuevo...")
client.exec_command("pm2 start all")

client.close()
