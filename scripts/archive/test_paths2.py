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

print("=== Test API paths with status codes ===")

# Test different endpoints with status codes
tests = [
    ("/api/auth", 'wget -q -O- -S "http://localhost:3001/api/auth" 2>&1 | head -5'),
    ("/api/auth/login", 'wget -q -O- -S "http://localhost:3001/api/auth/login" 2>&1 | head -5'),
    ("/api/brands", 'wget -q -O- -S "http://localhost:3001/api/brands" 2>&1 | head -5'),
    ("/api/pruebalo/test", 'wget -q -O- -S "http://localhost:3001/api/pruebalo/test" 2>&1 | head -5'),
    ("/health", 'wget -q -O- -S "http://localhost:3001/health" 2>&1 | head -5'),
]

for path, cmd in tests:
    print(f"\n{path}:")
    stdin, stdout, stderr = ssh.exec_command(f'docker exec lookitry-backend sh -c "{cmd}"')
    print(stdout.read().decode()[:300])

# Check what happens with curl
print("\n=== Try curl instead ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "which curl || which wget"')
print(stdout.read().decode())

ssh.close()