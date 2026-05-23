import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#')

# Stop and remove the old lookitry-minio-server and minio containers to clean up
print("Cleaning up old minio containers...")
client.exec_command('docker stop lookitry-minio-server minio')
client.exec_command('docker rm lookitry-minio-server minio')
time.sleep(2)

# Update docker-compose file on VPS
print("Pulling latest code on VPS...")
client.exec_command('cd /root/virtual-tryon && git pull origin main')

# Start minio from the main docker-compose
print("Starting minio...")
stdin, stdout, stderr = client.exec_command('cd /root/virtual-tryon && docker compose -f vps-docker-compose.yml up -d minio')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()