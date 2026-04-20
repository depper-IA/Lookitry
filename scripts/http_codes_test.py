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

print("=== Testing HTTP codes for API paths ===")

# Use spider mode to just get HTTP code
tests = [
    "/api/auth",
    "/api/auth/register",
    "/api/auth/login",
    "/api/brands",
    "/api/products",
    "/api/pruebalo",
    "/api/generations",
    "/health",
    "/api/payment-settings/public",
]

for path in tests:
    cmd = f'docker exec lookitry-backend sh -c "wget --spider -S http://localhost:3001{path} 2>&1 | grep -i \\"HTTP/\\""'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    result = stdout.read().decode().strip()
    if result:
        print(f"{path}: {result[:100]}")
    else:
        print(f"{path}: NO RESPONSE")

# Install curl for better testing
print("\n=== Install curl and test ===")
stdin, stdout, stderr = ssh.exec_command("docker exec lookitry-backend sh -c 'apk add --no-cache curl > /dev/null 2>&1 && echo installed'")
print(stdout.read().decode())

# Now test with curl
print("\n=== Test with curl ===")
tests2 = [
    "/api/auth",
    "/api/auth/login",
    "/api/brands",
    "/health",
]
for path in tests2:
    cmd = f'docker exec lookitry-backend sh -c "curl -s -o /dev/null -w %{{http_code}} http://localhost:3001{path}"'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(f"{path}: {stdout.read().decode().strip()}")

ssh.close()