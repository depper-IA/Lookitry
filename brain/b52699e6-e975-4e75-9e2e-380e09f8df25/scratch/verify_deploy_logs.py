
import paramiko

# Credenciales verificadas
HOST = "31.220.18.39"
USER = "root"
PASS = "Travis18456916#"

def verify_logs():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print(f"Conectando a {HOST}...")
        ssh.connect(HOST, username=USER, password=PASS, timeout=10)
        
        print("\n=== Backend Container Logs (Last 20 lines) ===")
        stdin, stdout, stderr = ssh.exec_command("docker logs lookitry-backend --tail 20")
        print(stdout.read().decode())
        
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_logs()
