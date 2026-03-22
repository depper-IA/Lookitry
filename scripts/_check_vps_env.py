import paramiko
import sys

def check_env():
    HOST = "31.220.18.39"
    USER = "root"
    PASS = "Travis18456916#"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    
    print("--- Environment Variables in VPS (.env.production) ---")
    stdin, stdout, stderr = ssh.exec_command("cat /root/virtual-tryon/backend/.env.production")
    out = stdout.read().decode()
    
    keys_to_show = ["FRONTEND_URL", "CORS_ORIGIN", "COOKIE_DOMAIN", "NODE_ENV", "JWT_SECRET", "SUPABASE_URL"]
    for line in out.splitlines():
        if any(key in line for key in keys_to_show):
            # Ocultar el valor real del JWT_SECRET por seguridad, solo mostrar que existe
            if "JWT_SECRET" in line:
                print("JWT_SECRET=***** (Present)")
            else:
                print(line)
    
    ssh.close()

if __name__ == "__main__":
    check_env()
