"""
Migración: agrega columnas landing_price y landing_original_price a payment_settings
"""
import paramiko
import os

HOST = "31.220.18.39"
USER = "root"
PASS = "Travis18456916#"

# Script Node.js que corre dentro del contenedor backend
node_script = """
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await s
    .from('payment_settings')
    .upsert({
      id: 1,
      landing_price: 650000,
      landing_original_price: 900000,
    }, { onConflict: 'id', ignoreDuplicates: false });
  
  if (error) {
    console.log('UPSERT_ERROR:', error.message, error.code);
  } else {
    console.log('OK - columnas landing_price y landing_original_price inicializadas');
  }
}
run().catch(e => console.error('FATAL:', e.message));
"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)
print("Conectado al VPS")

# Copiar el script al host via SFTP, luego copiarlo al contenedor
import tempfile, os
local_path = os.path.join(tempfile.gettempdir(), "migrate_landing.js")
with open(local_path, "w") as f:
    f.write(node_script)

sftp = ssh.open_sftp()
sftp.put(local_path, "/tmp/migrate_landing.js")
sftp.close()
print("Script copiado al VPS")

# Copiar del host al contenedor en el directorio del proyecto (donde están node_modules)
_, out, err = ssh.exec_command("docker cp /tmp/migrate_landing.js lookitry-backend:/app/migrate_landing.js", timeout=15)
print("Docker cp:", out.read().decode(), err.read().decode())

_, out, err = ssh.exec_command("docker exec lookitry-backend node /app/migrate_landing.js", timeout=30)
print("Run:", out.read().decode())
print("Err:", err.read().decode())

# Limpiar
ssh.exec_command("docker exec lookitry-backend rm /app/migrate_landing.js", timeout=10)

ssh.close()
print("Migración completada.")
