import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)

stdin, stdout, stderr = client.exec_command("cat /root/docker-compose.yml")
compose_data = stdout.read().decode("utf-8")

if "EXECUTIONS_DATA_SAVE_ON_ERROR" not in compose_data:
    lines = compose_data.split('\n')
    new_lines = []
    for line in lines:
        new_lines.append(line)
        if "DB_TYPE=sqlite" in line:
            indent = line[:len(line) - len(line.lstrip())]
            new_lines.append(f"{indent}- EXECUTIONS_DATA_SAVE_ON_ERROR=all")
            new_lines.append(f"{indent}- EXECUTIONS_DATA_SAVE_ON_SUCCESS=none")
            new_lines.append(f"{indent}- EXECUTIONS_DATA_PRUNE=true")
            new_lines.append(f"{indent}- EXECUTIONS_DATA_MAX_AGE=168")
            new_lines.append(f"{indent}- DB_SQLITE_TIMEOUT=15000")
            new_lines.append(f"{indent}- N8N_DIAGNOSTICS_ENABLED=false")
            
    updated_compose = '\n'.join(new_lines)
    sftp = client.open_sftp()
    with sftp.open("/root/docker-compose.yml", "w") as f:
        f.write(updated_compose)
    sftp.close()
    print("[+] Archivo docker-compose.yml modificado exitosamente.")
else:
    print("[-] Las variables ya existían en docker-compose.yml.")

print("[+] Reiniciando n8n con la nueva configuración...")
stdin, stdout, stderr = client.exec_command("cd /root/ && docker compose down n8n && docker compose up -d n8n")
print(stdout.read().decode("utf-8"))
print(stderr.read().decode("utf-8"))

client.close()
