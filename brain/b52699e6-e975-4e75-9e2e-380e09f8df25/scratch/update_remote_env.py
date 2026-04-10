
import paramiko
import os

# Credenciales verificadas
HOST = "31.220.18.39"
USER = "root"
PASS = "Travis18456916#"
REPO_PATH = "/root/virtual-tryon"

def update_remote_env():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print(f"Conectando a {HOST}...")
        ssh.connect(HOST, username=USER, password=PASS, timeout=10)
        
        env_file = f"{REPO_PATH}/backend/.env.production"
        redis_line = "REDIS_URL=redis://root-redis-1:6379"
        
        # Primero verificamos si ya existe la línea
        stdin, stdout, stderr = ssh.exec_command(f"grep 'REDIS_URL=' {env_file}")
        existing = stdout.read().decode().strip()
        
        if existing:
            print(f"Actualizando REDIS_URL existente en {env_file}...")
            # Reemplazar línea existente
            ssh.exec_command(f"sed -i 's|^REDIS_URL=.*|{redis_line}|' {env_file}")
        else:
            print(f"Añadiendo REDIS_URL a {env_file}...")
            # Añadir al final del archivo
            ssh.exec_command(f"echo '' >> {env_file}")
            ssh.exec_command(f"echo '# Redis Configuration' >> {env_file}")
            ssh.exec_command(f"echo '{redis_line}' >> {env_file}")
            
        print("Sincronización de variables de entorno completada.")
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_remote_env()
