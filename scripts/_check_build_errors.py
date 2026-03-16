import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=30)

def run(cmd, timeout=180):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return out.read().decode(errors='replace')

print('=== BACKEND BUILD ===')
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build 2>&1 | tail -40'))

print('\n=== FRONTEND BUILD ===')
print(run('cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml build 2>&1 | tail -60'))

ssh.close()
