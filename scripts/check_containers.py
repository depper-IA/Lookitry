import subprocess

result = subprocess.run(
    ['powershell', '-Command',
     'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@31.220.18.39 "docker ps -a --format table {{.Names}}\t{{.Status}}\t{{.Ports}}"'],
    capture_output=True, text=True, timeout=30
)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr[:500] if result.stderr else "")