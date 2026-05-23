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

print("=== Testing HTTPS directly from VPS ===")

# Test HTTPS directly
print("1. Testing HTTPS for lookitry.com:")
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://lookitry.com/ 2>&1')
print(stdout.read().decode())

print("\n2. Testing HTTPS for api.lookitry.com:")
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://api.lookitry.com/health 2>&1')
print(stdout.read().decode())

print("\n3. Testing HTTPS for n8n.wilkiedevs.com:")
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://n8n.wilkiedevs.com/ 2>&1')
print(stdout.read().decode())

print("\n4. Full HTTPS response from api.lookitry.com (verbose):")
stdin, stdout, stderr = ssh.exec_command('curl -s -v --connect-timeout 5 https://api.lookitry.com/health 2>&1 | head -40')
print(stdout.read().decode())

ssh.close()