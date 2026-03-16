import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', port=22, username='root', password='Travis18456916#')

print("=== MinIO containers ===")
_, stdout, _ = ssh.exec_command('docker ps --format "{{.Names}} {{.Ports}}" | grep -i minio')
print(stdout.read().decode())

print("=== MinIO en docker-compose.yml ===")
_, stdout, _ = ssh.exec_command('grep -A 25 "minio" /root/docker-compose.yml')
print(stdout.read().decode())

print("=== Variables de entorno MinIO ===")
_, stdout, _ = ssh.exec_command('docker exec $(docker ps -q --filter name=minio) env 2>/dev/null | grep -E "MINIO_ROOT|MINIO_ACCESS|MINIO_SECRET" || echo "No se pudo obtener env"')
print(stdout.read().decode())

print("=== Buckets existentes ===")
_, stdout, stderr = ssh.exec_command('docker exec $(docker ps -q --filter name=minio) mc ls local/ 2>/dev/null || echo "mc no disponible"')
print(stdout.read().decode())
print(stderr.read().decode())

ssh.close()
