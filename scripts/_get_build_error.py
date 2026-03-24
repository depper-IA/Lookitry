import paramiko

host = '31.220.18.39'
port = 22
user = 'root'
password = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=port, username=user, password=password, timeout=30)

cmd = "cd /root/Lookitry && docker compose -f docker-compose.frontend.yml build --no-cache 2>&1 | grep -A5 'Type error' | head -40"
stdin, stdout, stderr = client.exec_command(cmd, timeout=180)
out = stdout.read().decode()
print("=== BUILD ERRORS DETAIL ===")
print(out or "(sin output)")
client.close()
