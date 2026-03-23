import paramiko

def fix_vps():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect("31.220.18.39", username="root", password="Travis18456916#")
    
    print("=== Iniciando correccion de dominios en VPS ===")
    
    # 1. Backups preventivos
    ssh.exec_command("cp /root/virtual-tryon/backend/.env /root/virtual-tryon/backend/.env.bak")
    ssh.exec_command("cp /root/virtual-tryon/frontend/.env.production /root/virtual-tryon/frontend/.env.production.bak")
    ssh.exec_command("cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak")
    
    # 2. Reemplazo de dominios en archivos .env (FRONTEND_URL, API_URL, etc.)
    # Usamos lookitry.com en lugar de lookitry.com
    print("Actualizando archivos .env...")
    ssh.exec_command("sed -i 's/lookitry.com/lookitry.com/g' /root/virtual-tryon/backend/.env")
    ssh.exec_command("sed -i 's/lookitry.com/lookitry.com/g' /root/virtual-tryon/frontend/.env.production")
    
    # 3. Actualizar Nginx
    # Buscamos la linea server_name y la actualizamos
    print("Actualizando configuracion de Nginx...")
    ssh.exec_command("sed -i 's/lookitry.com/lookitry.com/g' /etc/nginx/sites-enabled/default")
    ssh.exec_command("sed -i 's/api.lookitry.com/api.lookitry.com/g' /etc/nginx/sites-enabled/default")
    
    # 4. Reiniciar Nginx
    print("Reiniciando Nginx...")
    ssh.exec_command("nginx -t && systemctl restart nginx")
    
    # 5. Reiniciar Docker para que tome los cambios de .env
    print("Reiniciando contenedores Docker...")
    ssh.exec_command("cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml restart")
    ssh.exec_command("cd /root/virtual-tryon && docker compose -f docker-compose.frontend.yml restart")
    
    print("\n=== Verificacion final ===")
    stdin, stdout, stderr = ssh.exec_command("grep -r 'lookitry.com' /root/virtual-tryon/backend/.env /etc/nginx/sites-enabled/default")
    print(stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command("grep -r 'n8n.wilkiedevs.com' /etc/nginx/sites-enabled/")
    print("Configuracion n8n detectada:", stdout.read().decode())
    
    ssh.close()
    print("Migracion completada exitosamente.")

if __name__ == '__main__':
    fix_vps()
