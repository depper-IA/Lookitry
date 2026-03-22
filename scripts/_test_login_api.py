import paramiko
import sys

def test_login_api():
    HOST = "31.220.18.39"
    USER = "root"
    PASS = "Travis18456916#"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    
    print("--- Testing Login API with curl from VPS ---")
    # Intentar login con credenciales ficticias para ver el comportamiento de la cookie y headers
    cmd = "curl -i -X POST https://api.pruebalo.wilkiedevs.com/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"nonexistent@lookitry.com\",\"password\":\"wrongpassword\"}'"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    test_login_api()
