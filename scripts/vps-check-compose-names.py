import paramiko

HOST = '31.220.18.39'
USER = 'root'
PASS = 'Travis18456916#'

def run(ssh, cmd):
    print(f'\n$ {cmd}')
    _, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print('[stderr]', err)
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)

run(ssh, 'cat /root/virtual-tryon/docker-compose.backend.yml')
run(ssh, 'cat /root/virtual-tryon/docker-compose.frontend.yml')

ssh.close()
