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

print("=== 1. Ver .env actual del backend ===")
run("tail -20 /root/virtual-tryon/backend/.env")

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

print("\n=== 3. Ver docker-compose.backend.yml ===")
run("cat /root/virtual-tryon/docker-compose.backend.yml")

print("\n=== 4. Rebuild y restart backend ===")
run("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build --no-cache 2>&1 | tail -20", timeout=300)
run("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml up -d 2>&1", timeout=60)

print("\n=== 5. Rebuild y restart frontend ===")
run("cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml build --no-cache 2>&1 | tail -20", timeout=300)
run("cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml up -d 2>&1", timeout=60)

print("\n=== 6. Esperar y verificar ===")
time.sleep(10)
run("docker ps --format 'table {{.Names}}\t{{.Status}}' | grep virtual-tryon")

print("\n=== 7. Test endpoint upload ===")
run("curl -s -o /dev/null -w '%{http_code}' https://api.pruebalo.wilkiedevs.com/api/upload -X POST -H 'Content-Type: application/json' -d '{}'")

print("\n=== 8. Logs backend (últimas 20 líneas) ===")
run("docker logs virtual-tryon-backend --tail 20 2>&1")

ssh.close()
print("\nDeploy completado.")
