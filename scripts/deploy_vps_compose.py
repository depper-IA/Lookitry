"""Deploy vps-docker-compose.yml directly to VPS via SSH"""
import os
import sys

# Add paramiko support
try:
    import paramiko
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

HOST = "31.220.18.39"
USER = "root"
PASS = "Travis18456916#"
REPO = "/root/virtual-tryon"

# Read the local file
local_file = os.path.join(os.path.dirname(__file__), "..", "vps-docker-compose.yml")
with open(local_file, "r") as f:
    content = f.read()

print(f"[INFO] Connecting to {HOST}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)

print("[INFO] Uploading vps-docker-compose.yml...")
sftp = ssh.open_sftp()
with sftp.file('/tmp/vps-docker-compose.yml', 'w') as f:
    f.write(content)
sftp.close()

# Copy to the repo
stdin, stdout, stderr = ssh.exec_command(f"cp /tmp/vps-docker-compose.yml {REPO}/vps-docker-compose.yml", timeout=30)
print(stdout.read().decode() + stderr.read().decode())

# Also backup the existing root docker-compose.yml
stdin, stdout, stderr = ssh.exec_command(f"cp /docker/root/docker-compose.yml /docker/root/docker-compose.yml.bak 2>/dev/null || echo 'No existing file'", timeout=30)
print(stdout.read().decode() + stderr.read().decode())

# Show what we deployed
stdin, stdout, stderr = ssh.exec_command(f"head -30 {REPO}/vps-docker-compose.yml", timeout=30)
print("\n[DEPLOYED FILE]:\n" + stdout.read().decode())

# Now redeploy root project
print("\n[INFO] Redeploying root project...")
stdin, stdout, stderr = ssh.exec_command(
    f"cd /docker/root && docker compose up -d --pull always 2>&1 | tail -30",
    timeout=180
)
output = stdout.read().decode() + stderr.read().decode()
print(output)

if "error" in output.lower() or "failed" in output.lower():
    print("\n[ERROR] Deploy failed, restoring backup...")
    ssh.exec_command("cp /docker/root/docker-compose.yml.bak /docker/root/docker-compose.yml 2>/dev/null", timeout=10)
else:
    print("\n[OK] Deploy completed")

ssh.close()
print("\nDone.")