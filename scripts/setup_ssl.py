import paramiko
import sys
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el .env del backend
load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

HOST = os.getenv("VPS_HOST", "31.220.18.39")
USER = os.getenv("VPS_USER", "root")
PASS = os.getenv("VPS_PASS")

if not PASS:
    print("Error: La variable VPS_PASS no está definida en el archivo .env del backend.")
    sys.exit(1)

def run_ssh_command(cmd):
    print(f"\nRunning command: {cmd}")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, username=USER, password=PASS, timeout=30)
        _, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode(errors="replace")
        err = stderr.read().decode(errors="replace")
        if out: print(out)
        if err: print("[stderr]", err)
        ssh.close()
        return out, err
    except Exception as e:
        print(f"Error: {e}")
        return None, str(e)

if __name__ == "__main__":
    # 1. Verificar si Nginx ya tiene el dominio configurado o si necesitamos agregarlo
    # Buscamos en los archivos de configuración de Nginx si aparece "lookitry.com"
    print("Checking Nginx configuration for lookitry.com...")
    out, _ = run_ssh_command("grep -r 'lookitry.com' /etc/nginx/")
    
    if not out or "server_name" not in out:
        print("Domain lookitry.com not found in Nginx server_name. Adding to configuration...")
        # Intentamos encontrar el archivo de configuración de lookitry.com para usarlo de base
        # O simplemente agregamos un nuevo bloque.
        # En este caso, probablemente sea el archivo que maneja la app principal.
        # Vamos a ver que hay en /etc/nginx/sites-enabled
        out, _ = run_ssh_command("ls /etc/nginx/sites-enabled/")
        print("Available sites:", out)
        
        # Asumimos que hay uno llamado 'virtual-tryon' o similar (según el nombre del proyecto)
        # O simplemente vamos a inyectar el server_name en el bloque de pruebalo
        # Vamos a buscar el archivo que contiene 'lookitry.com'
        out, _ = run_ssh_command("grep -l 'lookitry.com' /etc/nginx/sites-enabled/*")
        config_file = out.strip() if out else ""
        
        if config_file:
             print(f"Adding lookitry.com to {config_file}...")
             # Reemplazamos 'server_name lookitry.com;' por 'server_name lookitry.com lookitry.com www.lookitry.com;'
             sed_cmd = f"sed -i 's/server_name .*lookitry.com/server_name lookitry.com lookitry.com www.lookitry.com/g' {config_file}"
             run_ssh_command(sed_cmd)
             run_ssh_command("nginx -t && systemctl reload nginx")
        else:
             print("Could not find Nginx config file for lookitry.com. Creating a new one might be risky.")
    
    # 2. Ejecutar Certbot
    print("\nRunning Certbot for lookitry.com and www.lookitry.com...")
    certbot_cmd = "certbot --nginx -d lookitry.com -d www.lookitry.com --non-interactive --agree-tos --email info@lookitry.com --expand"
    run_ssh_command(certbot_cmd)
    
    # 3. Recargar Nginx por si acaso
    run_ssh_command("systemctl reload nginx")
    print("\nSSL Setup process finished.")
