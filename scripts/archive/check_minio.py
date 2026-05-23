import paramiko
import json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

stdin, stdout, stderr = client.exec_command('docker inspect minio')
data = json.loads(stdout.read().decode())
print(json.dumps(data[0]['Mounts'], indent=2))

client.close()