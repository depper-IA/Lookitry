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

print("=== Checking Traefik routes ===")

# Check traefik routers
print("\n1. Checking traefik docker provider routers:")
stdin, stdout, stderr = ssh.exec_command(
    'curl -s http://localhost:8080/api/http/routers 2>/dev/null | python3 -c "import sys,json;[print(r[\'name\'],r[\'status\']) for r in json.load(sys.stdin)]"'
)
print(stdout.read().decode())

# Check frontned directly via traefik internal
print("\n2. Testing frontend through traefik:")
stdin, stdout, stderr = ssh.exec_command(
    'docker exec traefik wget -q -O- -H "Host: lookitry.com" http://localhost:80/ 2>&1 | head -20'
)
print(stdout.read().decode())

# Check backend through traefik
print("\n3. Testing backend through traefik:")
stdin, stdout, stderr = ssh.exec_command(
    'docker exec traefik wget -q -O- -H "Host: api.lookitry.com" http://localhost:80/health 2>&1'
)
print(stdout.read().decode())

# Check n8n through traefik
print("\n4. Testing n8n subdomain:")
stdin, stdout, stderr = ssh.exec_command(
    'docker exec traefik wget -q -O- -H "Host: n8n.wilkiedevs.com" http://localhost:80/ 2>&1 | head -5'
)
print(stdout.read().decode())

# Check if traefik has the TLS challenge resolver
print("\n5. Checking traefik certs resolver:")
stdin, stdout, stderr = ssh.exec_command(
    'curl -s http://localhost:8080/api/http/routers | python3 -c "import sys,json;print([r for r in json.load(sys.stdin) if \"tls\" in str(r)])"'
)
print(stdout.read().decode())

ssh.close()