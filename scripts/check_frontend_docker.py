import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Check docker-compose.frontend.yml for labels/routing
stdin, stdout, stderr = client.exec_command('cat /root/virtual-tryon/docker-compose.frontend.yml 2>&1')
data = stdout.read().decode('utf-8', errors='replace')
print(f'Frontend docker-compose:\n{data}')

client.close()