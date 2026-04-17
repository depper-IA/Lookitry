import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
stdin, stdout, stderr = client.exec_command("docker logs root-n8n-1 --tail 50")
print("LOGS:", stdout.read().decode())
client.close()
