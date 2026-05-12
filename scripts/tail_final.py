import sys
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
import os, paramiko, time
host, user, psw = '31.220.18.39', 'root', 'Travis18456916#'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=psw)

print("Tailing frontend logs...")
for _ in range(15):
    stdin, stdout, stderr = ssh.exec_command('tail -n 15 /root/virtual-tryon/deploy_front_final.txt')
    log = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.write("---\n")
    sys.stdout.write(log + "\n")
    sys.stdout.flush()
    if "Started" in log or "Up" in log or "Built" in log:
        sys.stdout.write("Done!\n")
        break
    time.sleep(10)
