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

print("=== Test from OUTSIDE via traefik ===")

# Test from traefik container (acts as external client)
tests = [
    ("GET /api/brands via traefik", 'docker exec traefik sh -c "curl -s -o /dev/null -w %{%{http_code}} http://localhost/api/brands"'),
    ("GET /health via traefik", 'docker exec traefik sh -c "curl -s -o /dev/null -w %{%{http_code}} http://localhost/health"'),
    ("GET /api/pruebalo/test via traefik", 'docker exec traefik sh -c "curl -s -o /dev/null -w %{%{http_code}} http://localhost/api/pruebalo/test"'),
]

for name, cmd in tests:
    print(f"\n{name}:")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode().strip())

print("\n=== Test direct from VPS with Host header ===")

# Use curl from traefik to test with Host header (simulating external request)
tests2 = [
    ("lookitry.com", 'docker exec traefik sh -c "curl -s -o /dev/null -w %{%{http_code}} -H \\"Host: lookitry.com\\" http://localhost/"'),
    ("api.lookitry.com", 'docker exec traefik sh -c "curl -s -o /dev/null -w %{%{http_code}} -H \\"Host: api.lookitry.com\\" http://localhost/api/brands"'),
    ("api.lookitry.com health", 'docker exec traefik sh -c "curl -s -o /dev/null -w %{%{http_code}} -H \\"Host: api.lookitry.com\\" http://localhost/health"'),
]

for name, cmd in tests2:
    print(f"\n{name}:")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode().strip())

ssh.close()