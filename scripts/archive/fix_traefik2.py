import paramiko
from io import StringIO

key_path = "scripts/id_rsa_lookitry"
with open(key_path, 'r') as f:
    key_content = f.read()

key_file = StringIO(key_content)
key = paramiko.RSAKey.from_private_key(key_file)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname="31.220.18.39", username="root", pkey=key, timeout=15)

print("=== Creating Traefik certs directory ===")
stdin, stdout, stderr = ssh.exec_command("mkdir -p /docker/traefik-reverse-proxy/certs")
print(stdout.read().decode())

# Create acme.json file (empty but with proper permissions)
print("\n=== Creating acme.json ===")
stdin, stdout, stderr = ssh.exec_command("touch /docker/traefik-reverse-proxy/certs/acme.json && chmod 600 /docker/traefik-reverse-proxy/certs/acme.json")
print(stdout.read().decode())

# Write the new docker-compose using Python on the VPS
print("\n=== Writing new docker-compose.yml ===")
compose_content = """version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    command:
      - "--api.insecure=true"
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.endpoint=unix:///var/run/docker.sock"
      - "--providers.docker.network=proxy"
      - "--providers.docker.exposedByDefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesResolvers.mytlschallenge.acme.email=samwilkiedevs@gmail.com"
      - "--certificatesResolvers.mytlschallenge.acme.storage=/certs/acme.json"
      - "--certificatesResolvers.mytlschallenge.acme.httpchallenge.entrypoint=web"
      - "--log.level=INFO"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./certs:/certs
    networks:
      - proxy
    restart: unless-stopped

networks:
  proxy:
    external: true
"""

# Use Python on VPS to write the file
import base64
encoded = base64.b64encode(compose_content.encode()).decode()
cmd = f'python3 -c "import base64,sys; open(\'/docker/traefik-reverse-proxy/docker-compose.yml\',\'wb\').write(base64.b64decode(\'{encoded}\'))"'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Write result:", stdout.read().decode(), stderr.read().decode())

# Verify
print("\n=== Verifying docker-compose.yml ===")
stdin, stdout, stderr = ssh.exec_command("cat /docker/traefik-reverse-proxy/docker-compose.yml")
print(stdout.read().decode())

ssh.close()