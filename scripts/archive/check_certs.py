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

print("=== Checking ACME certificate status ===")

# Check acme.json content (it contains cert info)
print("\n1. ACME JSON structure:")
stdin, stdout, stderr = ssh.exec_command("python3 -c \"import json; data=json.load(open('/docker/traefik-reverse-proxy/certs/acme.json')); print('Keys:', list(data.keys())); print('Account:', data.get('mytlschallenge', {}).get('acme', {}).get('email')); certs = data.get('mytlschallenge', {}).get('acme', {}).get('certificates', []); print('Certificates:', len(certs))\"")
print(stdout.read().decode())

# Check if Traefik has successfully obtained certs by triggering a request
print("\n2. Triggering certificate generation by accessing domains...")
stdin, stdout, stderr = ssh.exec_command("curl -s -L -o /dev/null -w '%{http_code}' --header 'Host: lookitry.com' https://lookitry.com/ 2>&1")
print("lookitry.com:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command("curl -s -L -o /dev/null -w '%{http_code}' --header 'Host: api.lookitry.com' https://api.lookitry.com/health 2>&1")
print("api.lookitry.com:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command("curl -s -L -o /dev/null -w '%{http_code}' --header 'Host: n8n.wilkiedevs.com' https://n8n.wilkiedevs.com/ 2>&1")
print("n8n.wilkiedevs.com:", stdout.read().decode())

print("\n3. Waiting 5 seconds for cert generation...")
time.sleep(5)

print("\n4. Checking acme.json again:")
stdin, stdout, stderr = ssh.exec_command("python3 -c \"import json; data=json.load(open('/docker/traefik-reverse-proxy/certs/acme.json')); certs = data.get('mytlschallenge', {}).get('acme', {}).get('certificates', []); print('Total certs:', len(certs)); [print('  - Domain:', c.get('domain', {}).get('main')) for c in certs]\"")
print(stdout.read().decode())

print("\n5. Traefik logs (recent):")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 30 traefik 2>&1 | grep -E 'certificate|acme|ACME|tls|error'")
print(stdout.read().decode())

ssh.close()