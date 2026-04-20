import paramiko
import json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.220.18.39', username='root', password='Travis18456916#', timeout=15)

# Buscar la ruta del volumen de n8n
cmd = 'docker volume inspect n8n_data --format "{{.Mountpoint}}"'
stdin, stdout, stderr = client.exec_command(cmd)
vol_path = stdout.read().decode('utf-8').strip()
print(f'n8n volume path: {vol_path}')

# Copiar la DB localmente para analizarla
cmd2 = f'docker cp root-n8n-1:/bitnami/n8n/database.sqlite /tmp/n8n_db.sqlite'
client.exec_command(cmd2)
print('Copied database to /tmp/n8n_db.sqlite')

# Ahora extraer los nodos del workflow ZjVTV3QxoPEi60GX
cmd3 = 'sqlite3 /tmp/n8n_db.sqlite "SELECT id, name, nodes FROM workflow_entity WHERE id=\'ZjVTV3QxoPEi60GX\';"'
stdin, stdout, stderr = client.exec_command(cmd3)
result = stdout.read().decode('utf-8', errors='replace')

print(f'Query result length: {len(result)}')
if result:
    # Parse JSON del campo nodes
    lines = result.split('\n')
    if len(lines) >= 3:
        workflow_id = lines[0]
        workflow_name = lines[1]
        nodes_json = lines[2]
        print(f'Workflow: {workflow_id} - {workflow_name}')

        try:
            nodes = json.loads(nodes_json)
            print(f'Total nodes: {len(nodes)}')

            for i, node in enumerate(nodes):
                name = node.get('name', 'unnamed')
                ntype = node.get('type', 'unknown')
                print(f'\n=== Node {i+1}: {name} | Type: {ntype} ===')

                if ntype == 'n8n-nodes-base.code':
                    code = node.get('parameters', {}).get('jsCode', '')
                    lines_code = code.split('\n')
                    print(f'Code has {len(lines_code)} lines')
                    print('--- CODE START ---')
                    for j, line in enumerate(lines_code, 1):
                        print(f'{j}: {line}')
                    print('--- CODE END ---')

                elif ntype == 'n8n-nodes-base.webhook':
                    params = node.get('parameters', {})
                    print(f'Webhook path: {params.get("path")}')
                    print(f'HTTP method: {params.get("httpMethod")}')
                    print('Full params:', json.dumps(params, indent=2))

                else:
                    print('Other node params:', json.dumps(node.get('parameters', {}), indent=2)[:500])

        except Exception as e:
            print(f'JSON parse error: {e}')
            print('Nodes JSON (first 1000):', nodes_json[:1000])
else:
    print('No result from query')
    print('stderr:', stderr.read().decode('utf-8', errors='replace'))

client.close()