import os
import re

p = r"c:\Users\Usuario\Mostrador_wilkiedevs\backend\src\services\__tests__\n8n.client.test.ts"

with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# Resolve first conflict (lines 35-45 roughly)
c = re.sub(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> origin/Juli', r'\1', c, flags=re.DOTALL)

# Resolve second conflict (lines 73-83 roughly)
# Note: Since I used re.sub for all, it might handle both if the markers are identical.
# But let's check.

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print("Conflict resolved in backend/src/services/__tests__/n8n.client.test.ts")
