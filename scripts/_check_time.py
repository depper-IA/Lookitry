import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
stdin, stdout, stderr = client.exec_command("date && docker exec root-n8n-1 date")
print(stdout.read().decode())
client.close()
