import paramiko
import time
import urllib.request
import json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Wait for restart
print("Waiting for backend to restart...")
time.sleep(8)

# Check backend status
stdin, stdout, stderr = ssh.exec_command('docker ps --filter name=lookitry-backend --format "{{.Status}}"')
print("Backend:", stdout.read().decode('utf-8', errors='replace').strip())

# Check health
try:
    with urllib.request.urlopen('https://api.lookitry.com/health', timeout=10) as response:
        health = json.loads(response.read().decode('utf-8'))
        print("\n=== API HEALTH ===")
        print(f"Status: {health.get('status')}")
        redis_status = [s for s in health.get('services', []) if s.get('name') == 'Redis'][0]
        print(f"Redis: {redis_status.get('status')}")
except Exception as e:
    print(f"Health check failed: {e}")

ssh.close()