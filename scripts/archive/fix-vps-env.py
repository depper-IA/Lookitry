import paramiko
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(os.getenv("VPS_HOST", "31.220.18.39"), username="root", password=os.getenv("VPS_PASS"))
stdin, stdout, stderr = ssh.exec_command("cat /root/virtual-tryon/backend/.env | grep -i gemini")
print("GEMINI ENV VARS:")
print(stdout.read().decode())
stdin, stdout, stderr = ssh.exec_command('echo "GEMINI_API_KEY=***REMOVED-SECRET***" >> /root/virtual-tryon/backend/.env')
print("Appended GEMINI_API_KEY to VPS .env")
ssh.exec_command("docker compose -f /root/virtual-tryon/docker-compose.backend.yml restart")
print("Restarted backend")