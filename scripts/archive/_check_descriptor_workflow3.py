import paramiko
import json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)

# Copiar la DB localmente para analizarla
cmd2 = 'docker cp root-n8n-1:/bitnami/n8n/database.sqlite /tmp/n8n_db.sqlite 2>/dev/null; sqlite3 /tmp/n8n_db.sqlite "SELECT nodes FROM workflow_entity WHERE id=\'ZjVTV3QxoPEi60GX\';" > /tmp/nodes.json 2>&1'
client.exec_command(cmd2)

# Leer el resultado
cmd3 = 'cat /tmp/nodes.json'
stdin, stdout, stderr = client.exec_command(cmd3)
result = stdout.read().decode('utf-8', errors='replace')

# Escribir resultado a archivo
with open('C:/Users/Matt/Lookitry/scripts/descriptor_workflow.json', 'w', encoding='utf-8') as f:
    f.write(result)

print('Wrote output to descriptor_workflow.json')
print(f'Length: {len(result)}')
print(f'First 500 chars: {result[:500]}')

client.close()