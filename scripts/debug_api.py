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

print("=== Debugging API health ===")

# Check backend logs
print("\n1. Backend logs...")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 30 lookitry-backend 2>&1")
print(stdout.read().decode())

# Try different health check approaches
print("\n2. Testing with wget...")
stdin, stdout, stderr = ssh.exec_command("docker exec lookitry-backend wget -q -O- http://localhost:3001/health 2>&1")
print(stdout.read().decode())

print("\n3. Testing with curl verbose...")
stdin, stdout, stderr = ssh.exec_command("docker exec lookitry-backend curl -v http://localhost:3001/health 2>&1")
print(stdout.read().decode())

# Check if port 3001 is listening
print("\n4. Checking port 3001...")
stdin, stdout, stderr = ssh.exec_command("ss -tlnp | grep 3001 || netstat -tlnp | grep 3001")
print(stdout.read().decode())

# Check docker network
print("\n5. Checking backend network...")
stdin, stdout, stderr = ssh.exec_command("docker inspect lookitry-backend --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool")
print(stdout.read().decode())

# Check traefik logs
print("\n6. Checking traefik logs for api.lookitry.com...")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 30 traefik 2>&1 | grep -i 'api.lookitry\\|backend\\|error'")
print(stdout.read().decode())

ssh.close()