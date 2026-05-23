import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("31.220.18.39", username="root", password="Travis18456916#", timeout=15)
cmd = r"""
docker run --rm -v root_n8n_data:/data alpine sh -c "apk add --no-cache sqlite && sqlite3 /data/database.sqlite '.tables' && sqlite3 /data/database.sqlite 'SELECT id, name, active FROM \"workflow_entity\";'"
"""
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
print(stdout.read().decode())
print(stderr.read().decode())
client.close()
