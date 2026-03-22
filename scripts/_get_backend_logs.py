import paramiko
import sys

def get_logs():
    HOST = "31.220.18.39"
    USER = "root"
    PASS = "Travis18456916#"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    
    # Obtener nombre real del contenedor
    stdin, stdout, stderr = ssh.exec_command("docker ps -a --format '{{.Names}}'")
    names = stdout.read().decode().splitlines()
    backend_name = next((n for n in names if "backend" in n), None)
    
    if backend_name:
        print(f"--- Logs for {backend_name} ---")
        stdin, stdout, stderr = ssh.exec_command(f"docker logs {backend_name} --tail 100")
        print(stdout.read().decode())
        print(stderr.read().decode())
    else:
        print("Backend container not found.")
    
    ssh.close()

if __name__ == "__main__":
    get_logs()
