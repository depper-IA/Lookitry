import paramiko
import sys

def fix_cookie_domain():
    HOST = "31.220.18.39"
    USER = "root"
    PASS = "Travis18456916#"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    
    print("--- Fixing COOKIE_DOMAIN in VPS ---")
    # Cambiar .lookitry.com por lookitry.com (sin el punto inicial)
    # También asegurar que CORS_ORIGIN incluya el dominio sin www si no está
    
    cmd = "sed -i 's/COOKIE_DOMAIN=.lookitry.com/COOKIE_DOMAIN=lookitry.com/g' /root/virtual-tryon/backend/.env.production"
    ssh.exec_command(cmd)
    
    print("Restarting backend to apply changes...")
    ssh.exec_command("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml restart")
    
    ssh.close()
    print("Done. Please try logging in again in 10 seconds.")

if __name__ == "__main__":
    fix_cookie_domain()
