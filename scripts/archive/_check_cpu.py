import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
stdin, stdout, stderr = client.exec_command("ps aux --sort=-%cpu | head -15")
print("Top CPU processes:")
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command("uptime")
print("Uptime / Load:")
print(stdout.read().decode())

client.close()
