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

print("=== Testing from VPS ===")

# Test API from VPS itself
print("\n1. Testing API health from VPS...")
stdin, stdout, stderr = ssh.exec_command("curl -s -w '\\nHTTP: %{http_code}' http://localhost:3001/health")
print(stdout.read().decode())

# Test n8n from VPS itself
print("\n2. Testing n8n from VPS...")
stdin, stdout, stderr = ssh.exec_command("curl -s -o /dev/null -w 'HTTP: %{http_code}' http://localhost:5678/")
print(stdout.read().decode())

# Stop n8n container
print("\n3. Stopping n8n container...")
stdin, stdout, stderr = ssh.exec_command("docker stop root-n8n-1 && docker rm root-n8n-1")
print(stdout.read().decode())

# Start n8n with traefik labels
print("\n4. Starting n8n with traefik labels...")
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
    "--label traefik.enable=true "
    "--label 'traefik.http.routers.n8n.rule=Host(`n8n.wilkiedevs.com`)' "
    "--label 'traefik.http.routers.n8n.entrypoints=websecure' "
    "--label 'traefik.http.routers.n8n.tls.certresolver=mytlschallenge' "
    "--label 'traefik.http.services.n8n.loadbalancer.server.port=5678' "
    "docker.n8n.io/n8nio/n8n:latest 2>&1"
)
stdin, stdout, stderr = ssh.exec_command(n8n_cmd)
print(stdout.read().decode())

print("\n5. Waiting 15 seconds for n8n to initialize...")
time.sleep(15)

print("\n6. Checking n8n status...")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 10 root-n8n-1 2>&1")
print(stdout.read().decode())

# Final status check
print("\n7. Final container status...")
stdin, stdout, stderr = ssh.exec_command("docker ps --format '{{.Names}}\t{{.Status}}'")
print(stdout.read().decode())

ssh.close()
print("\n=== Done ===")