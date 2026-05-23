import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

stdin, stdout, stderr = client.exec_command('cat /root/virtual-tryon/docker_build_frontend.log')
with open('docker_build_frontend.log', 'wb') as f:
    f.write(stdout.read())

client.close()