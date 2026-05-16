import paramiko
import time
import urllib.request
import urllib.error

# Trigger the error
try:
    req = urllib.request.Request(
        'https://api.lookitry.com/api/pruebalo/wilkie-devs',
        headers={'Origin': 'https://lookitry.com'}
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        print("Status:", response.status)
except urllib.error.HTTPError as e:
    print("HTTP Error triggered:", e.code)
except Exception as e:
    print("Error:", e)

# Give it a second to log
time.sleep(2)

# Check logs
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', 22, 'root', 'Travis18456916#')

stdin, stdout, stderr = ssh.exec_command('docker logs lookitry-backend --tail 50 2>&1 | grep widgetSecurity | tail -10')
output = stdout.read().decode('utf-8', errors='replace')
print("\n=== LOGS ===")
print(output if output else "No logs found")

ssh.close()