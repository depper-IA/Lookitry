"""Activa o desactiva Turnstile en el VPS sin redeploy"""
import paramiko, time, sys

enable = "--enable" in sys.argv
disable = "--disable" in sys.argv
if not enable and not disable:
    print("Uso: python _toggle_turnstile.py --enable | --disable")
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=30)

if disable:
    ssh.exec_command("sed -i 's/TURNSTILE_ENABLED=true/TURNSTILE_ENABLED=false/' /root/virtual-tryon/backend/.env")
    print("Turnstile DESACTIVADO")
else:
    ssh.exec_command("sed -i 's/TURNSTILE_ENABLED=false/TURNSTILE_ENABLED=true/' /root/virtual-tryon/backend/.env")
    print("Turnstile ACTIVADO")

time.sleep(1)
_, out, _ = ssh.exec_command("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d 2>&1")
time.sleep(6)

_, out, _ = ssh.exec_command("grep TURNSTILE_ENABLED /root/virtual-tryon/backend/.env")
print("Estado actual:", out.read().decode().strip())

_, out, _ = ssh.exec_command("docker ps --format '{{.Names}} {{.Status}}' | grep backend")
print("Backend:", out.read().decode().strip())
ssh.close()
