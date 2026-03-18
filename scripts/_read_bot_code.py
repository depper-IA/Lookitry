import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)

def run(cmd, wait=8):
    chan = ssh.get_transport().open_session()
    chan.exec_command(cmd)
    time.sleep(wait)
    out = b""
    while chan.recv_ready():
        out += chan.recv(131072)
    chan.close()
    return out.decode().strip()

print(run("cat /home/ubuntu/superprof_bot/superprof_service_completo.py", wait=10))
ssh.close()
