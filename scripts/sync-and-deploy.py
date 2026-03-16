import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', port=22, username='root', password='Travis18456916#')

def run(cmd, timeout=300):
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip(): print("OUT:", out[-3000:])
    if err.strip(): print("ERR:", err[-500:])
    return out

# ── Leer archivos locales modificados ────────────────────────────────────────

files_to_sync = {
    'Mostrador_wilkiedevs/backend/src/services/upload.service.ts': '/root/virtual-tryon/backend/src/services/upload.service.ts',
    'Mostrador_wilkiedevs/backend/src/app.ts': '/root/virtual-tryon/backend/src/app.ts',
    'Mostrador_wilkiedevs/backend/src/controllers/trialCampaign.controller.ts': '/root/virtual-tryon/backend/src/controllers/trialCampaign.controller.ts',
    'Mostrador_wilkiedevs/backend/src/routes/trial.routes.ts': '/root/virtual-tryon/backend/src/routes/trial.routes.ts',
}

sftp = ssh.open_sftp()

print("=== 1. Sincronizar archivos del backend ===")
for local_path, remote_path in files_to_sync.items():
    try:
        with open(local_path, 'r', encoding='utf-8') as f:
            content = f.read()
        with sftp.open(remote_path, 'w') as f:
            f.write(content)
        print(f"  OK: {remote_path}")
    except Exception as e:
        print(f"  ERROR {local_path}: {e}")

sftp.close()

print("\n=== 2. Agregar variables MinIO al .env del backend ===")
run("""
grep -q "MINIO_ENDPOINT" /root/virtual-tryon/backend/.env || cat >> /root/virtual-tryon/backend/.env << 'ENVEOF'

# MinIO Storage
MINIO_ENDPOINT=https://minio.wilkiedevs.com
MINIO_BUCKET=images
MINIO_ACCESS_KEY=Wilkiedevs
MINIO_SECRET_KEY=Travis2305*
MINIO_PUBLIC_URL=https://minio.wilkiedevs.com
ENVEOF
echo "Variables MinIO OK"
""")

print("\n=== 3. Rebuild backend ===")
run("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build --no-cache 2>&1 | tail -30", timeout=300)

print("\n=== 4. Restart backend ===")
run("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d 2>&1")

print("\n=== 5. Rebuild frontend ===")
run("cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml build --no-cache 2>&1 | tail -30", timeout=300)

print("\n=== 6. Restart frontend ===")
run("cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml up -d 2>&1")

print("\n=== 7. Verificar estado ===")
time.sleep(10)
run("docker ps --format 'table {{.Names}}\t{{.Status}}' | grep virtual-tryon")

print("\n=== 8. Test /api/upload (debe dar 401, no 404) ===")
run("curl -s -w '\\nHTTP: %{http_code}' https://api.pruebalo.wilkiedevs.com/api/upload -X POST -H 'Content-Type: application/json' -d '{}'")

print("\n=== 9. Logs backend ===")
run("docker logs virtual-tryon-backend --tail 15 2>&1")

ssh.close()
print("\nDeploy completado.")
