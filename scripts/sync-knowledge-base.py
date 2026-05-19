#!/usr/bin/env python3
"""
Sync Knowledge Base MDs → Supabase via backend endpoint.
Uso: python3 scripts/sync-knowledge-base.py
"""
import os, re, json, requests

KB_DIR = os.path.join(os.path.dirname(__file__), '..', 'Lookitry_Brain_Vault/Cerebro/Knowledge Base')
BACKEND_URL = "https://api.lookitry.com/api/admin/sync-kb"
ADMIN_KEY = "lookitry_kb_sync_2026"

def parse_md(path):
    with open(path, 'r') as f:
        raw = f.read()
    kb_id   = re.search(r'kb_id:\s*(.+)', raw)
    kb_cat  = re.search(r'kb_category:\s*(.+)', raw)
    kb_act  = re.search(r'kb_active:\s*(.+)', raw)
    title_m = re.search(r'^# (.+)$', raw, re.MULTILINE)
    if not kb_id or not kb_cat:
        return None
    content = re.sub(r'^---.*?---\s*', '', raw, flags=re.DOTALL).strip()
    content = re.sub(r'^# .+\n', '', content).strip()
    return {
        "id":       kb_id.group(1).strip(),
        "category": kb_cat.group(1).strip(),
        "title":    title_m.group(1).strip() if title_m else os.path.basename(path),
        "content":  content,
        "is_active": kb_act.group(1).strip().lower() == 'true' if kb_act else True,
    }

items = []
for fname in sorted(os.listdir(KB_DIR)):
    if not fname.endswith('.md') or fname.startswith('_'):
        continue
    item = parse_md(os.path.join(KB_DIR, fname))
    if item:
        items.append(item)
        print(f"  ✅ [{item['id']}] {fname}")
    else:
        print(f"  SKIP {fname} (sin frontmatter)")

print(f"\nEnviando {len(items)} items al backend...")
r = requests.post(
    BACKEND_URL,
    json={"items": items},
    headers={"x-admin-key": ADMIN_KEY},
    timeout=120
)
print(f"Status: {r.status_code}")
try:
    result = r.json()
    print(f"Synced: {result.get('synced')}/{result.get('total')}")
    errors = [x for x in result.get('results', []) if x.startswith('ERR')]
    if errors:
        print("Errores:", errors)
except Exception:
    print(r.text[:300] if r.text else "(sin respuesta)")
