import paramiko
import urllib.request

# Test from outside
try:
    with urllib.request.urlopen('https://api.lookitry.com/api/pruebalo/wilkie-devs', timeout=10) as response:
        print("Status:", response.status)
        data = response.read().decode('utf-8', errors='replace')
        print("Response length:", len(data))
        print("First 300 chars:", data[:300])
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.reason)
    print("Response:", e.read().decode('utf-8', errors='replace')[:500])
except Exception as e:
    print("Error:", e)

# SSH check logs
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

# Check traefik logs
stdin, stdout, stderr = ssh.exec_command('docker logs traefik --tail 20 2>&1 | grep -i "wilkie\|403\|blocked" || echo "No match"')
print("\n=== TRAEFIK LOGS ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()