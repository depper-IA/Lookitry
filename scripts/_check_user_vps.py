import paramiko
import sys
import base64

def check_user_exists(email):
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
    
    if not backend_name:
        print("Backend container not found.")
        return

    print(f"--- Checking user {email} inside container {backend_name} ---")
    
    node_script = f"""
const {{ createClient }} = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {{
  try {{
    const {{ data, error }} = await supabaseAdmin
      .from('brands')
      .select('id, email, email_verified, plan, subscription_status')
      .eq('email', '{email}')
      .single();
      
    if (error) {{
      console.log('ERROR:', error.message);
    }} else {{
      console.log('USER_FOUND:', JSON.stringify(data));
    }}
  }} catch (e) {{
    console.log('UNEXPECTED_ERROR:', e.message);
  }}
}}
check();
"""
    # Usar base64 para evitar problemas de escape de caracteres en el shell
    b64_script = base64.b64encode(node_script.encode()).decode()
    ssh.exec_command(f"echo '{b64_script}' | base64 -d > /tmp/check_user.js")
    ssh.exec_command(f"docker cp /tmp/check_user.js {backend_name}:/app/check_user.js")
    stdin, stdout, stderr = ssh.exec_command(f"docker exec {backend_name} node /app/check_user.js")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "info@pruebalo.wilkiedevs.com"
    check_user_exists(email)
