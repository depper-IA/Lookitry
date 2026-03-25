import paramiko
import os
import json
from dotenv import load_dotenv
import sys

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS")

if not PASS:
    print("No VPS_PASS set")
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

print("Obteniendo API Key interna de n8n...")
# En instalaciones docker, a veces N8N_HOST o endpoints estan disponibles localmente sin auth si no esta configurado,
# o podemos extraer la API Key si esta en las variables de entorno.
# Pero lo mas directo es forzar una insercion en BD o usar curl internamente
stdin, stdout, stderr = ssh.exec_command("docker exec root-n8n-1 sh -c 'echo \"$N8N_BASIC_AUTH_ACTIVE\"'")
print("Auth activa?", stdout.read().decode().strip())

# Si el CLI falla, vamos a intentar remover el id del JSON para que n8n asigne uno nuevo en la importacion CLI.
with open(os.path.join(os.path.dirname(__file__), '../templates-webs/Descriptor-workflow.js'), 'r', encoding='utf-8') as f:
    wf = json.load(f)

# Limpiar IDs que causan colision o error de SQLite
if 'id' in wf:
    del wf['id']
if 'meta' in wf and 'instanceId' in wf['meta']:
    del wf['meta']['instanceId']

# Para CLI import, el formato que espera es a veces solo la data o el array
wfJSON = json.dumps(wf)

print("Subiendo nuevo JSON limpio para importacion CLI...")
sftp = ssh.open_sftp()
with sftp.open('/root/clean_workflow.json', 'w') as remote_file:
    remote_file.write(wfJSON)
sftp.close()

ssh.exec_command("docker cp /root/clean_workflow.json root-n8n-1:/tmp/clean_workflow.json")

print("Aplicando en n8n CLI...")
stdin, stdout, stderr = ssh.exec_command("docker exec root-n8n-1 n8n import:workflow --input=/tmp/clean_workflow.json")

out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')

print("Salida:", out)
print("Error:", err)

ssh.exec_command("rm /root/clean_workflow.json")
ssh.close()
