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

print("=== Updating Traefik with TLS certificates ===")

# Create new traefik docker-compose with TLS
traefik_compose = """version: '3.8'

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
      - traefik-certs:/certs
    networks:
      - proxy
    restart: unless-stopped

networks:
  proxy:
    external: true

volumes:
  traefik-certs:
"""

print("New docker-compose content:")
print(traefik_compose)

# Write the new compose file
cmd = f'cat > /docker/traefik-reverse-proxy/docker-compose.yml << \'ENDOFFILE\\n{traefik_compose}ENDOFFILE'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("\nWrite result:", stdout.read().decode(), stderr.read().decode())

ssh.close()
print("\n=== Now restart traefik ===")