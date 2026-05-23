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

print("=== Testing via curl ===")

# Test frontend via Host header
print("\n1. Testing frontend with Host header:")
stdin, stdout, stderr = ssh.exec_command(
    'curl -s -H "Host: lookitry.com" http://localhost:80/ 2>&1 | head -10'
)
print(stdout.read().decode())

# Test backend via Host header
print("\n2. Testing backend with Host header:")
stdin, stdout, stderr = ssh.exec_command(
    'curl -s -H "Host: api.lookitry.com" http://localhost:80/health 2>&1'
)
print(stdout.read().decode())

# Test n8n via Host header
print("\n3. Testing n8n with Host header:")
stdin, stdout, stderr = ssh.exec_command(
    'curl -s -H "Host: n8n.wilkiedevs.com" http://localhost:80/ 2>&1 | head -5'
)
print(stdout.read().decode())

# Get all routers with their details
print("\n4. All router details:")
stdin, stdout, stderr = ssh.exec_command(
    'curl -s http://localhost:8080/api/http/routers | python3 -m json.tool 2>/dev/null'
)
print(stdout.read().decode()[:3000])

ssh.close()