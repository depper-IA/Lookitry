import paramiko, json, copy

host = '31.220.18.39'
user = 'root'
pwd = 'Travis18456916#'
N8N_API_KEY = '***REMOVED-SECRET***'
N8N_BEARER = 'Travis2305**'
NEW_UPLOAD_URL = 'https://api.pruebalo.wilkiedevs.com/api/upload/selfie'
WF_IDS = ['wPLypk7KhBcFLicX', 'Ft86NDu6ZJCyOpgD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pwd, timeout=30)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode()

n8n_ip = run("docker inspect root-n8n-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'").strip()

def api_get(path):
    out = run(f'curl -s -H "X-N8N-API-KEY: {N8N_API_KEY}" http://{n8n_ip}:5678{path}')
    return json.loads(out)

def api_put(path, body):
    body_json = json.dumps(body).replace("'", "'\\''")
    out = run(f"curl -s -X PUT -H 'X-N8N-API-KEY: {N8N_API_KEY}' -H 'Content-Type: application/json' -d '{body_json}' http://{n8n_ip}:5678{path}", timeout=30)
    return out

for wf_id in WF_IDS:
    print(f"\n{'='*60}")
    wf = api_get(f'/api/v1/workflows/{wf_id}')
    print(f"Procesando: {wf.get('name')} (activo: {wf.get('active')})")

    nodes = wf.get('nodes', [])
    modified = False

    for node in nodes:
        name = node.get('name', '')
        params = node.get('parameters', {})
        url = params.get('url', '')

        # Nodos de upload (selfie temporal e imagen final)
        if 'wp-json/n8n/v1/upload' in url:
            print(f"  Actualizando nodo: {name}")
            params['url'] = NEW_UPLOAD_URL
            params['method'] = 'POST'

            # Actualizar headers para incluir Bearer token
            send_headers = params.get('sendHeaders', False)
            header_params = params.get('headerParameters', {})
            headers_list = header_params.get('parameters', [])

            # Limpiar headers viejos de auth y content-type
            headers_list = [h for h in headers_list if h.get('name', '').lower() not in ['authorization', 'content-type']]
            headers_list.append({'name': 'Authorization', 'value': f'Bearer {N8N_BEARER}'})
            headers_list.append({'name': 'Content-Type', 'value': 'application/json'})

            params['sendHeaders'] = True
            params['headerParameters'] = {'parameters': headers_list}

            # Actualizar body para enviar image_base64 y filename
            # El body debe enviar JSON con image_base64 y filename
            params['sendBody'] = True
            params['contentType'] = 'json'
            params['specifyBody'] = 'json'

            # Determinar qué base64 enviar según el nodo
            if 'selfie' in name.lower() or 'Selfie' in name:
                b64_expr = '={{ $json.selfie_base64 }}'
                fname = 'selfie.jpg'
            else:
                # Imagen final generada por Gemini
                b64_expr = '={{ $json.image_base64 }}'
                fname = 'result.jpg'

            params['jsonBody'] = json.dumps({
                'image_base64': b64_expr,
                'filename': fname
            })

            node['parameters'] = params
            modified = True
            print(f"    -> URL: {NEW_UPLOAD_URL}")
            print(f"    -> Body: image_base64={b64_expr}, filename={fname}")

        # Nodo de eliminar selfie temporal — desactivar (no-op: cambiar a noop)
        elif 'wp-json/n8n/v1/delete' in url:
            print(f"  Desactivando nodo de delete: {name} (WordPress ya no existe)")
            # Cambiar a un Set node que no hace nada en lugar de eliminar
            node['type'] = 'n8n-nodes-base.noOp'
            node['parameters'] = {}
            node['typeVersion'] = 1
            modified = True
            print(f"    -> Convertido a NoOp")

    if modified:
        # Limpiar settings — solo campos permitidos por la API de n8n
        raw_settings = wf.get('settings', {}) or {}
        allowed_settings_keys = {
            'executionOrder', 'saveManualExecutions', 'callerPolicy',
            'errorWorkflow', 'timezone', 'saveDataSuccessExecution',
            'saveDataErrorExecution', 'saveExecutionProgress',
            'executionTimeout', 'maxExecutionTimeout'
        }
        clean_settings = {k: v for k, v in raw_settings.items() if k in allowed_settings_keys}

        # Enviar el workflow actualizado
        payload = {
            'name': wf['name'],
            'nodes': nodes,
            'connections': wf.get('connections', {}),
            'settings': clean_settings,
            'staticData': wf.get('staticData'),
        }
        result = api_put(f'/api/v1/workflows/{wf_id}', payload)
        try:
            r = json.loads(result)
            if r.get('id'):
                print(f"  GUARDADO correctamente (ID: {r['id']})")
            else:
                print(f"  ERROR al guardar: {result[:300]}")
        except:
            print(f"  Respuesta raw: {result[:300]}")
    else:
        print("  Sin cambios necesarios")

client.close()
print("\nDONE")
