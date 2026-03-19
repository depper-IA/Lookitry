#!/usr/bin/env python3
"""Ejecuta una migración SQL en Supabase via el contenedor backend en el VPS."""
import paramiko

HOST = "31.220.18.39"
USER = "root"
PASS = "Travis18456916#"

SQL = "ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS includes_landing boolean NOT NULL DEFAULT false;"

node_script = f"""
const {{ createClient }} = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
sb.from('pending_registrations').select('id').limit(1).then(() => {{
  // Usar pg directo no está disponible, usar fetch a la API de Supabase
  const fetch = require('node-fetch');
  fetch(process.env.SUPABASE_URL + '/rest/v1/rpc/exec_sql', {{
    method: 'POST',
    headers: {{
      'apikey': process.env.SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }},
    body: JSON.stringify({{ sql: `{SQL}` }})
  }}).then(r => r.text()).then(t => console.log('Result:', t)).catch(e => console.error('Fetch error:', e.message));
}}).catch(e => console.error('Error:', e.message));
"""

cmd = f'docker exec virtual-tryon-backend node -e "{node_script.strip()}"'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)

# Ejecutar directamente el SQL via psql si está disponible, o via el script de migración
sql_cmd = f"""docker exec virtual-tryon-backend node -e "
const {{ createClient }} = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
sb.rpc('exec_sql', {{ sql: '{SQL}' }}).then(r => console.log('OK:', JSON.stringify(r.error))).catch(e => console.error('ERR:', e.message));
" """

stdin, stdout, stderr = ssh.exec_command(sql_cmd, timeout=30)
out = stdout.read().decode()
err = stderr.read().decode()
print("STDOUT:", out)
print("STDERR:", err)
ssh.close()
