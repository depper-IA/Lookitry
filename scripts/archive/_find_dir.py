import sys
import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
cmd = "find / -type d -name virtual-tryon 2>/dev/null"
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
print(stdout.read().decode())
client.close()
