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

print("=== Test using Python in container ===")

# Use Python to make HTTP requests
python_test = '''
import urllib.request
import json

tests = [
    ("GET /health", "http://localhost:3001/health"),
    ("GET /api/brands", "http://localhost:3001/api/brands"),
    ("POST /api/auth/register", "http://localhost:3001/api/auth/register"),
]

for name, url in tests:
    try:
        req = urllib.request.Request(url)
        if "POST" in name:
            req = urllib.request.Request(url, data=b'{}', headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode()[:200]
            print(f"{name}: {resp.status} - {body}")
    except Exception as e:
        print(f"{name}: ERROR - {e}")
'''

# Encode and run
encoded = python_test.replace('"', '\\"').replace('\n', ' ')
cmd = f'docker exec lookitry-backend python3 -c "{encoded}"'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode()[:500])

ssh.close()