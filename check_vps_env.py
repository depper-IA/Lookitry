import paramiko
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(os.getenv("VPS_HOST", "31.220.18.39"), username="root", password=os.getenv("VPS_PASS"))
stdin, stdout, stderr = ssh.exec_command("cat /root/Lookitry/backend/.env | grep -i gemini")
print("GEMINI ENV VARS:")
print(stdout.read().decode())
stdin, stdout, stderr = ssh.exec_command("cat /root/Lookitry/backend/.env | grep -i vertex")
print("VERTEX ENV VARS:")
print(stdout.read().decode())