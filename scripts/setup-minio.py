import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', port=22, username='root', password='Travis18456916#')

print("=== Variables de entorno del VPS ===")
_, stdout, _ = ssh.exec_command('cat /root/.env 2>/dev/null || cat /root/docker-compose.env 2>/dev/null || grep -E "MINIO_SUBDOMAIN|DOMAIN_NAME" /root/.env* 2>/dev/null || echo "No .env encontrado"')
print(stdout.read().decode())

print("=== Traefik labels de minio (subdominio real) ===")
_, stdout, _ = ssh.exec_command('docker inspect minio 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); labels=d[0][\'Config\'][\'Labels\']; [print(k,\'=\',v) for k,v in labels.items() if \'rule\' in k.lower()]"')
print(stdout.read().decode())

print("=== Crear bucket 'images' en MinIO via API ===")
# Usar la API de MinIO directamente con curl desde dentro del contenedor
_, stdout, stderr = ssh.exec_command('''
docker exec minio sh -c "
  mc alias set local http://localhost:9000 Wilkiedevs 'Travis2305*' 2>&1 &&
  mc mb local/images --ignore-existing 2>&1 &&
  mc anonymous set download local/images 2>&1 &&
  mc ls local/ 2>&1
"
''')
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())

ssh.close()
