import paramiko
import sys

def check_vps():
    HOST = "31.220.18.39"
    USER = "root"
    PASS = "Travis18456916#"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    
    print("\n--- Frontend Health Check ---")
    stdin, stdout, stderr = ssh.exec_command("curl -s -I https://pruebalo.wilkiedevs.com")
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    check_vps()
