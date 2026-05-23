#!/usr/bin/env python3
import subprocess, json

result = subprocess.run(
    ['docker', 'exec', 'root-n8n-1', 'wget', '-qO-',
     'http://localhost:5678/rest/workflows?active=true',
     '-H', 'X-N8N-API-KEY: FsJdcMdJ2j/q/llqXU/abAZ5U40f3RKL'],
    capture_output=True, text=True
)

try:
    data = json.loads(result.stdout)
    workflows = data.get('data', [])
    print(f"Active workflows: {len(workflows)}")
    for w in workflows:
        print(f"  - {w.get('name', 'unnamed')} (id:{w['id']}, active:{w.get('active', False)}, triggerCount:{w.get('triggerCount', 0)})")
except Exception as e:
    print(f"Error parsing: {e}")
    print(f"Raw output (first 200 chars): {result.stdout[:200]}")