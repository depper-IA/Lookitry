import subprocess

# Check if backend directory exists on VPS
result = subprocess.run(
    ['powershell', '-Command',
     'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 root@31.220.18.39 "ls -la /root/virtual-tryon/ 2>&1"'],
    capture_output=True, text=True, timeout=20
)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr[:300] if result.stderr else "")