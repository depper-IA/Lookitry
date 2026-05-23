import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)

stdin, stdout, stderr = client.exec_command("cat /root/docker-compose.yml")
compose = stdout.read().decode()

if "EXECUTIONS_MODE=main" not in compose:
    compose = compose.replace("environment:", "environment:\n      - EXECUTIONS_MODE=main\n      - N8N_RUNNERS_ENABLED=false")
    sftp = client.open_sftp()
    with sftp.open("/root/docker-compose.yml", "w") as f:
        f.write(compose)
    sftp.close()

stdin, stdout, stderr = client.exec_command("cd /root && docker compose up -d n8n")
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
