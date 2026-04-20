import json

with open('C:/Users/Matt/Lookitry/scripts/descriptor_workflow.json', 'r', encoding='utf-8') as f:
    data = f.read()

# Try to parse the JSON
try:
    nodes = json.loads(data)
    print(f'Total nodes: {len(nodes)}\n')

    for i, node in enumerate(nodes):
        name = node.get('name', 'unnamed')
        ntype = node.get('type', 'unknown')
        print(f'=== Node {i+1}: "{name}" | Type: {ntype} ===')

        if ntype == 'n8n-nodes-base.code':
            code = node.get('parameters', {}).get('jsCode', '')
            lines = code.split('\n')
            print(f'Code has {len(lines)} lines:')
            for j, line in enumerate(lines, 1):
                print(f'  {j:2}: {line}')
            print()

        elif ntype == 'n8n-nodes-base.webhook':
            params = node.get('parameters', {})
            print(f'  Path: {params.get("path")}')
            print(f'  HTTP Method: {params.get("httpMethod")}')
            print()

        elif ntype == 'n8n-nodes-base.googleGemini':
            # Google Gemini node
            text_param = node.get('parameters', {}).get('text', '')
            print(f'  Text param (first 300 chars): {text_param[:300]}...')
            print()

        else:
            # Other node types
            params_str = json.dumps(node.get('parameters', {}), indent=2)[:800]
            print(f'  Params: {params_str}...')
            print()

except json.JSONDecodeError as e:
    print(f'JSON error: {e}')
    print(f'Data length: {len(data)}')
    print(f'Error position: {e.pos}')
    print(f'Context around error: {data[max(0, e.pos-100):e.pos+100]}')