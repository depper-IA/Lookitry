import paramiko
from io import StringIO
import time

key_path = "scripts/id_rsa_lookitry"
with open(key_path, 'r') as f:
    key_content = f.read()

key_file = StringIO(key_content)
key = paramiko.RSAKey.from_private_key(key_file)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname="31.220.18.39", username="root", pkey=key, timeout=15)

print("=== Starting n8n, redis, and minio manually ===")

# Start redis
print("\n1. Starting redis...")
stdin, stdout, stderr = ssh.exec_command(
    "docker run -d --name root-redis-1 --network proxy "
    "-v root-redis-data:/data "
    "--restart unless-stopped "
    "redis:7 redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru 2>&1"
)
print(stdout.read().decode())

# Start minio
print("\n2. Starting minio...")
stdin, stdout, stderr = ssh.exec_command(
    "docker run -d --name minio --network proxy "
    "-v root-minio-data:/data "
    "-p 9000:9000 -p 9001:9001 "
    "-e MINIO_ROOT_USER=Wilkiedevs "
    "-e MINIO_ROOT_PASSWORD=Travis2305* "
    "--restart unless-stopped "
    "minio/minio:latest server /data --console-address ':9001' 2>&1"
)
print(stdout.read().decode())

# Start n8n
print("\n3. Starting n8n...")
n8n_cmd = (
    "docker run -d --name root-n8n-1 --network proxy "
    "-p 5678:5678 "
    "-v n8n_data:/home/node/.n8n "
    "-e N8N_RUNNERS_ENABLED=false "
    "-e N8N_NATIVE_PYTHON_RUNNER=false "
    "-e GENERIC_TIMEZONE=America/Bogota "
    "-e SSL_EMAIL=samwilkiedevs@gmail.com "
    "-e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true "
    "-e DOMAIN_NAME=wilkiedevs.com "
    "-e SUBDOMAIN=n8n "
    "-e MINIO_SUBDOMAIN=minio "
    "-e MINIO_ENDPOINT=https://minio.wilkiedevs.com "
    "-e MINIO_BUCKET=images "
    "-e MINIO_ACCESS_KEY=Wilkiedevs "
    "-e MINIO_SECRET_KEY=Travis2305* "
    "-e MINIO_PUBLIC_URL=https://minio.wilkiedevs.com "
    "--restart unless-stopped "
    "docker.n8n.io/n8nio/n8n:latest 2>&1"
)
stdin, stdout, stderr = ssh.exec_command(n8n_cmd)
print(stdout.read().decode())

# Wait for services
print("\n4. Waiting 20 seconds for services to initialize...")
time.sleep(20)

# Check status
print("\n5. Checking all containers...")
stdin, stdout, stderr = ssh.exec_command("docker ps -a --format '{{.Names}}\t{{.Status}}'")
print(stdout.read().decode())

# Check n8n
print("\n6. Checking n8n...")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 15 root-n8n-1 2>&1")
print(stdout.read().decode())

# Check API health
print("\n7. Testing API health...")
stdin, stdout, stderr = ssh.exec_command("curl -s -w '\\nHTTP: %{http_code}' https://api.lookitry.com/health")
print(stdout.read().decode())

# Check traefik routes
print("\n8. Checking traefik router for n8n subdomain...")
stdin, stdout, stderr = ssh.exec_command(
    "docker exec traefik curl -s http://localhost:8080/api/http/routers | python3 -m json.tool 2>/dev/null || echo 'Could not get routers'"
)
print(stdout.read().decode()[:2000])

ssh.close()
print("\n=== Done ===")