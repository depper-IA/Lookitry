import sys
import paramiko
import time
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
print("Stopping n8n...")
stdin, stdout, stderr = client.exec_command("docker stop root-n8n-1", timeout=30)
print(stdout.read().decode())
time.sleep(5)
print("Starting n8n...")
stdin, stdout, stderr = client.exec_command("docker start root-n8n-1", timeout=30)
print(stdout.read().decode())
client.close()
