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

print("=== Testing POST with wget ===")

# Try wget with POST data
cmd1 = 'docker exec lookitry-backend sh -c "wget -q -O- --post-data=\\'{\\\"test\\\":1}\\' http://localhost:3001/api/auth/register 2>&1 | head -5"'
print("Testing POST /api/auth/register:")
stdin, stdout, stderr = ssh.exec_command(cmd1)
print(stdout.read().decode()[:400])

# Try different method - use curl properly with separate args
print("\n=== Testing with curl binary ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend which curl')
curl_path = stdout.read().decode().strip()
print(f"Curl path: {curl_path}")

if curl_path:
    cmd2 = 'docker exec lookitry-backend curl -s -X POST -H "Content-Type: application/json" -d "{\\\"email\\\":\\\"test@test.com\\\"}" http://localhost:3001/api/auth/register'
    stdin, stdout, stderr = ssh.exec_command(cmd2)
    result = stdout.read().decode()
    print(f"Result: {result[:500]}")
else:
    print("curl not available, trying with wget")

# Check if there's a connectivity issue
print("\n=== Connectivity check ===")
stdin, stdout, stderr = ssh.exec_command('docker exec lookitry-backend sh -c "wget -q -O- http://localhost:3001/health 2>&1 | head -3"')
print("Health check:", stdout.read().decode()[:200])

ssh.close()