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

print("=== Restarting Traefik with TLS config ===")

# Navigate to traefik directory and restart
print("1. Stopping Traefik...")
stdin, stdout, stderr = ssh.exec_command("cd /docker/traefik-reverse-proxy && docker compose down 2>&1")
print(stdout.read().decode())

print("\n2. Starting Traefik with new config...")
stdin, stdout, stderr = ssh.exec_command("cd /docker/traefik-reverse-proxy && docker compose up -d 2>&1")
print(stdout.read().decode())

print("\n3. Waiting 10 seconds for Traefik to initialize...")
time.sleep(10)

print("\n4. Checking Traefik status...")
stdin, stdout, stderr = ssh.exec_command("docker ps --format '{{.Names}}\t{{.Status}}' | grep traefik")
print(stdout.read().decode())

print("\n5. Checking Traefik logs...")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 20 traefik 2>&1")
print(stdout.read().decode())

print("\n6. Checking ACME cert creation...")
stdin, stdout, stderr = ssh.exec_command("ls -la /docker/traefik-reverse-proxy/certs/")
print(stdout.read().decode())

print("\n7. Checking Traefik routers after restart...")
stdin, stdout, stderr = ssh.exec_command(
    'curl -s http://localhost:8080/api/http/routers | python3 -c "import sys,json;[print(r[\'name\'], r[\'tls\']) for r in json.load(sys.stdin) if r.get(\'provider\')==\'docker\']"'
)
print(stdout.read().decode())

ssh.close()
print("\n=== Done ===")