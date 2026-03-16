import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', port=22, username='root', password='Travis18456916#')

def run(cmd, timeout=120):
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print("OUT:", out[-2000:])
    if err: print("ERR:", err[-1000:])
    return out

print("=== 1. Agregar variables MinIO al .env del backend en VPS ===")
run("""
cd /root/virtual-tryon/Mostrador_wilkiedevs/backend
grep -q "MINIO_ENDPOINT" .env || cat >> .env << 'EOF'

# MinIO Storage
MINIO_ENDPOINT=https://minio.wilkiedevs.com
MINIO_BUCKET=images
MINIO_ACCESS_KEY=Wilkiedevs
MINIO_SECRET_KEY=Travis2305*
MINIO_PUBLIC_URL=https://minio.wilkiedevs.com
EOF
echo "Variables MinIO agregadas"
""")

print("=== 2. Git pull ===")
run("cd /root/virtual-tryon && git pull origin main 2>&1", timeout=60)

print("=== 3. Rebuild backend ===")
run("cd /root/virtual-tryon && docker compose -f Mostrador_wilkiedevs/docker-compose.yml build backend 2>&1", timeout=300)

print("=== 4. Rebuild frontend ===")
run("cd /root/virtual-tryon && docker compose -f Mostrador_wilkiedevs/docker-compose.yml build frontend 2>&1", timeout=300)

print("=== 5. Restart servicios ===")
run("cd /root/virtual-tryon && docker compose -f Mostrador_wilkiedevs/docker-compose.yml up -d backend frontend 2>&1", timeout=60)

print("=== 6. Verificar estado ===")
time.sleep(8)
run("docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'backend|frontend'")

print("=== 7. Test upload endpoint ===")
run("curl -s -o /dev/null -w '%{http_code}' https://api.pruebalo.wilkiedevs.com/api/upload -X POST -H 'Content-Type: application/json' -d '{}'")

ssh.close()
print("\nDeploy completado.")
