"""
Migración via Supabase Management API:
1. Agrega columnas price y badge a products
2. Actualiza constraint de landing_template para incluir 'moderno'
"""
import paramiko
import tempfile
import os

HOST = "31.220.18.39"
USER = "root"
PASS = "Travis18456916#"

# Este script usa el cliente de supabase-js con service role
# y ejecuta las migraciones via queries directas a la tabla
# (Supabase no expone exec_sql por defecto, pero sí permite
# usar el endpoint /rest/v1/ con service role para DDL via pg-meta)
node_script = r"""
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL; // ej: https://xxx.supabase.co
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan variables de entorno SUPABASE_URL / SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Extraer el project ref del URL: https://abcdef.supabase.co -> abcdef
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
console.log('Project ref:', projectRef);

// Usar el endpoint de Management API para ejecutar SQL
// POST https://api.supabase.com/v1/projects/{ref}/database/query
async function execSQL(sql) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

async function run() {
  const queries = [
    {
      label: 'Agregar columna price a products',
      sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS price numeric(12,2) DEFAULT NULL',
    },
    {
      label: 'Agregar columna badge a products',
      sql: "ALTER TABLE products ADD COLUMN IF NOT EXISTS badge text DEFAULT NULL",
    },
    {
      label: 'Eliminar constraint anterior de landing_template',
      sql: 'ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_landing_template_check',
    },
    {
      label: "Agregar constraint con 'moderno'",
      sql: "ALTER TABLE brands ADD CONSTRAINT brands_landing_template_check CHECK (landing_template IN ('classic', 'editorial', 'probador', 'moderno'))",
    },
  ];

  for (const q of queries) {
    const result = await execSQL(q.sql);
    if (result.status === 200 || result.status === 201) {
      console.log(`  OK - ${q.label}`);
    } else {
      console.log(`  [${result.status}] ${q.label}: ${result.body}`);
    }
  }
}

run().catch(e => console.error('FATAL:', e.message));
"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)
print("Conectado al VPS")

local_path = os.path.join(tempfile.gettempdir(), "migrate_template.js")
with open(local_path, "w") as f:
    f.write(node_script)

sftp = ssh.open_sftp()
sftp.put(local_path, "/tmp/migrate_template.js")
sftp.close()

_, out, err = ssh.exec_command("docker cp /tmp/migrate_template.js virtual-tryon-backend:/app/migrate_template.js", timeout=15)
out.read(); err.read()

_, out, err = ssh.exec_command("docker exec virtual-tryon-backend node /app/migrate_template.js", timeout=30)
stdout = out.read().decode()
stderr = err.read().decode()
print("Output:", stdout)
if stderr:
    print("Stderr:", stderr)

ssh.exec_command("docker exec virtual-tryon-backend rm /app/migrate_template.js", timeout=10)
ssh.close()
print("Migración completada.")
