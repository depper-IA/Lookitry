import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
stdin, stdout, stderr = client.exec_command("docker ps --filter name=n8n")
print("PS:", stdout.read().decode())
stdin, stdout, stderr = client.exec_command("docker logs root-n8n-1 2>&1 | tail -n 20")
print("LOGS:", stdout.read().decode())
client.close()
