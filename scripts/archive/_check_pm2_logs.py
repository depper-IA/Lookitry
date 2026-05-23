import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
stdin, stdout, stderr = client.exec_command("pm2 logs --lines 100 --nostream")
print(stdout.read().decode())
client.close()
