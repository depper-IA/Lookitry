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
sftp = ssh.open_sftp()
with sftp.open('/root/temp_descriptor_workflow.json', 'w') as remote_file:
    remote_file.write(workflow_json)
sftp.close()

# Encontrar el ID del workflow actual asumiendo que el nombre es o contiene "Descriptor"
print("Listando workflows...")
stdin, stdout, stderr = ssh.exec_command("docker exec root-n8n-1 n8n export:workflow --all | grep -i descriptor")
workflows_export = stdout.read().decode('utf-8', errors='replace')
print("Salida de export:", workflows_export)

# Como alternativa directa a la API o CLI de importacion:
# Actualizar el workflow mediante un script Node.js inyectado si es posible, o
# Copiar el archivo al contenedor e importarlo
print("Importando archivo al contenedor n8n...")
ssh.exec_command("docker cp /root/temp_descriptor_workflow.json root-n8n-1:/tmp/workflow.json")

# Importar o actualizar. Si pasamos --all, n8n podria crear uno nuevo si el ID difiere.
# El JSON proporcionado tiene ID: 34a894eba6858199b78c0769d1eb411eeca63ea6b87d5682b14ecb5319e0d30f
print("Aplicando en n8n CLI...")
stdin, stdout, stderr = ssh.exec_command("docker exec root-n8n-1 n8n import:workflow --input=/tmp/workflow.json")
print("Salida import:", stdout.read().decode('utf-8', errors='replace'))
print("Error import:", stderr.read().decode('utf-8', errors='replace'))

# Limpieza
ssh.exec_command("rm /root/temp_descriptor_workflow.json")
ssh.close()
print("Despliegue de workflow completado.")
