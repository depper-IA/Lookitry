import paramiko
from io import StringIO

key_path = "scripts/id_rsa_lookitry"
with open(key_path, 'r') as f:
    key_content = f.read()

key_file = StringIO(key_content)
key = paramiko.RSAKey.from_private_key(key_file)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname="31.220.18.39", username="root", pkey=key, timeout=15)

print("=== Debugging Redis connection ===")

# Check redis container network
print("\n1. Redis container network...")
stdin, stdout, stderr = ssh.exec_command("docker inspect root-redis-1 --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool")
print(stdout.read().decode())

# Check if redis is accessible from backend network
print("\n2. Testing redis from backend container...")
stdin, stdout, stderr = ssh.exec_command(
    "docker exec lookitry-backend sh -c 'nc -zv root-redis-1 6379 2>&1 || echo failed'"
)
print(stdout.read().decode())

# Try connecting using the docker network IP
print("\n3. Getting redis container IP...")
stdin, stdout, stderr = ssh.exec_command(
    "docker inspect root-redis-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'"
)
redis_ip = stdout.read().decode().strip()
print(f"Redis IP: {redis_ip}")

# Check what REDIS_URL the backend is using
print("\n4. Checking REDIS_URL in backend...")
stdin, stdout, stderr = ssh.exec_command("docker exec lookitry-backend sh -c 'echo $REDIS_URL'")
print(stdout.read().decode())

# Try to connect to redis via IP directly
print("\n5. Testing redis via IP...")
stdin, stdout, stderr = ssh.exec_command(
    f"docker exec lookitry-backend sh -c 'nc -zv {redis_ip} 6379 2>&1 || echo failed'"
)
print(stdout.read().decode())

# Check if redis is running properly
print("\n6. Redis logs...")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 5 root-redis-1 2>&1")
print(stdout.read().decode())

# Check redis is accepting connections
print("\n7. Redis port check...")
stdin, stdout, stderr = ssh.exec_command("docker exec root-redis-1 redis-cli ping 2>&1")
print(stdout.read().decode())

ssh.close()