
import paramiko
import os
from dotenv import load_dotenv

# Reutilizamos las credenciales que ya conocemos por los archivos vistos
HOST = "31.220.18.39"
USER = "root"
PASS = "Travis18456916#"

def check_vps():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print(f"Conectando a {HOST}...")
        ssh.connect(HOST, username=USER, password=PASS, timeout=10)
        
        print("\n=== Docker Containers ===")
        stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\\t{{.Image}}\\t{{.Status}}'")
        print(stdout.read().decode())
        
        print("\n=== Docker Networks ===")
        stdin, stdout, stderr = ssh.exec_command("docker network ls")
        print(stdout.read().decode())
        
        print("\n=== Checking for Redis process on host ===")
        stdin, stdout, stderr = ssh.exec_command("ps aux | grep redis")
        print(stdout.read().decode())

        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_vps()
