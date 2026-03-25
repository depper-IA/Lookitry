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

# Leer archivo local
with open(os.path.join(os.path.dirname(__file__), '../templates-webs/Descriptor-workflow.js'), 'r', encoding='utf-8') as f:
    workflow_json = f.read()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

# Escribir json temporalmente en el VPS
print("Subiendo JSON...")
sftp = ssh.open_sftp()
with sftp.open('/root/temp_descriptor_workflow.json', 'w') as remote_file:
    remote_file.write(workflow_json)
sftp.close()

print("Importando archivo al contenedor n8n...")
ssh.exec_command("docker cp /root/temp_descriptor_workflow.json root-n8n-1:/tmp/workflow.json")

print("Aplicando en n8n CLI...")
stdin, stdout, stderr = ssh.exec_command("docker exec root-n8n-1 n8n import:workflow --input=/tmp/workflow.json")

# Leer y decodificar evitando errores de charmaps en Windows
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')

# Enviar a terminal ascii seguro
print("Salida import:", out.encode('ascii', errors='ignore').decode('ascii'))
print("Error import:", err.encode('ascii', errors='ignore').decode('ascii'))

# Limpieza
ssh.exec_command("rm /root/temp_descriptor_workflow.json")
ssh.close()
print("Despliegue de workflow completado.")
