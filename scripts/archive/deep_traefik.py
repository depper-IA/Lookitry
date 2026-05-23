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

print("=== Deep Traefik Analysis ===")

# Check what traefik sees as services
print("1. Traefik services:")
stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:8080/api/http/services 2>/dev/null | python3 -c "import sys,json; [print(s[\'name\'], s.get(\'status\',\'?\')) for s in json.load(sys.stdin)]"')
print(stdout.read().decode())

print("\n2. Traefik routers for api.lookitry.com:")
stdin, stdout, stderr = ssh.exec_command('curl -s "http://localhost:8080/api/http/routers?filter=name~vt-backend" 2>/dev/null | python3 -m json.tool')
print(stdout.read().decode()[:1500])

print("\n3. Check if backend container is visible to traefik:")
stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:8080/api/http/services 2>/dev/null | python3 -c "import sys,json; [print(s[\'name\'],s.get(\'provider\',\'?\')) for s in json.load(sys.stdin) if \'backend\' in s.get(\'name\',\'\').lower() or \'api\' in s.get(\'name\',\'\").lower()]"')
print(stdout.read().decode())

print("\n4. Check traefik provider docker configuration:")
stdin, stdout, stderr = ssh.exec_command('docker exec traefik sh -c "cat /etc/traefik/traefik.yml 2>/dev/null || cat /traefik.toml 2>/dev/null || echo No config file"')
print(stdout.read().decode())

ssh.close()