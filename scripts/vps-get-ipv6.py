import paramiko

HOST = '31.220.18.39'
PORT = 22
USER = 'root'
PASS = 'Travis18456916#'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=15):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode().strip()

print("IPv6 del VPS:")
print(run("ip -6 addr show scope global | grep inet6 | awk '{print $2}' | cut -d/ -f1 | head -3"))
print("\nIPv4 del VPS:")
print(run("curl -s --max-time 5 ifconfig.me"))

client.close()
