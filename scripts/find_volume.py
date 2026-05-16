import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

stdin, stdout, stderr = client.exec_command('cat /root/virtual-tryon/vps-docker-compose.yml | tail -n 10')
print(stdout.read().decode())

client.close()