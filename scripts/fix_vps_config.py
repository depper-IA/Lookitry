
import paramiko
import os

# Configuración del VPS extraída del .env local
VPS_HOST = '31.220.18.39'
VPS_USER = 'root'
VPS_PASS = 'Travis18456916#'
ENV_PATH = '/root/virtual-tryon/backend/.env'

# Valor correcto de la Service Key
CORRECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg'

def fix_vps_env():
    print(f"🚀 Conectando al VPS {VPS_HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS)
        print("✅ Conexión establecida.")

        # Leer el contenido actual del .env
        stdin, stdout, stderr = ssh.exec_command(f'cat {ENV_PATH}')
        content = stdout.read().decode()
        
        lines = content.splitlines()
        new_lines = []
        found = False
        
        for line in lines:
            if line.startswith('SUPABASE_SERVICE_KEY='):
                new_lines.append(f'SUPABASE_SERVICE_KEY={CORRECT_KEY}')
                found = True
            else:
                new_lines.append(line)
        
        if not found:
            new_lines.append(f'SUPABASE_SERVICE_KEY={CORRECT_KEY}')
            print("➕ SUPABASE_SERVICE_KEY no existía, añadiendo al final.")
        else:
            print("🔄 SUPABASE_SERVICE_KEY encontrada, actualizando valor.")

        # Escribir el nuevo contenido de forma segura
        final_content = "\n".join(new_lines)
        # Escapamos comillas simples para el comando echo
        escaped_content = final_content.replace("'", "'\\''")
        
        # Guardar archivo
        ssh.exec_command(f"echo '{escaped_content}' > {ENV_PATH}")
        print("💾 Archivo .env guardado en el VPS.")

        # Reiniciar contenedores
        print("🔄 Reiniciando backend para aplicar cambios...")
        ssh.exec_command('cd /root/virtual-tryon && docker compose -f docker-compose.backend.yml restart')
        print("✨ Proceso completado exitosamente.")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    fix_vps_env()
