import os, paramiko, time
host, user, psw = '31.220.18.39', 'root', 'Travis18456916#'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=psw)

print("Tailing frontend logs...")
for _ in range(12):
    stdin, stdout, stderr = ssh.exec_command('tail -n 20 /root/virtual-tryon/deploy_log_front.txt')
    log = stdout.read().decode()
    print("---")
    print(log)
    if "Started" in log or "Up" in log or "Built" in log:
        break
    time.sleep(10)
