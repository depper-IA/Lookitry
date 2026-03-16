import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=30)

def run(cmd, timeout=60):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    o = out.read().decode(errors='replace')
    e = err.read().decode(errors='replace')
    if o.strip(): print(o.strip())
    if e.strip(): print('[err]', e.strip())

print('=== BUILD ERROR COMPLETO ===')
run('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml build 2>&1 | grep -E "error TS|Error|error:" | head -40', timeout=120)

ssh.close()
