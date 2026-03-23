"""
Copia el backend/.env local al VPS y reinicia el backend.
Uso: python scripts/_update_env.py
"""
import paramiko
import time

HOST = "31.220.18.39"
USER = "root"
PASS = "Travis18456916#"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)
print("Conectado al VPS")

# Leer el .env local
with open("backend/.env.production", "r") as f:
    env_content = f.read()

# Escribirlo en el VPS via SFTP
sftp = ssh.open_sftp()
with sftp.open("/root/virtual-tryon/backend/.env.production", "w") as remote_file:
    remote_file.write(env_content)
sftp.close()
print(".env copiado al VPS")

# Reiniciar solo el backend (up -d aplica los cambios del .env)
_, stdout, stderr = ssh.exec_command(
    "docker compose -f /root/virtual-tryon/docker-compose.backend.yml up -d",
    timeout=60
)
out = stdout.read().decode(errors="replace")
err = stderr.read().decode(errors="replace")
if out.strip(): print(out.strip())
if err.strip(): print(err.strip())
print("Backend reiniciado")

time.sleep(6)

# Health check
_, stdout, _ = ssh.exec_command(
    'curl -s -w "\\nHTTP: %{http_code}" https://api.lookitry.com/health',
    timeout=15
)
print(stdout.read().decode(errors="replace").strip())

ssh.close()
print("\nListo — GEMINI_API_KEY activa en produccion.")
