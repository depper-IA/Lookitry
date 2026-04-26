#!/usr/bin/env python3
"""Fix remaining encoding issues in pruebalo.controller.ts"""
import os

filepath = 'src/controllers/pruebalo.controller.ts'

with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Fix remaining double-encoding issues
# These are partial patterns that weren't caught
fixes = {
    'Caché contaminado Ñampa;" invalidar': 'Caché contaminado — invalidar',
    'Caché contaminado Ñampa;"': 'Caché contaminado —',
    'Caché contaminado Ñ': 'Caché contaminado —',
    'Ñampa;"': '—',
    'Ñamp"': '—',
    'c3 91 c2 e2 80 9d': '',  # The extra mojibake bytes
    'â€"'.encode('utf-8').decode('latin-1'): '—',
}

# The specific problematic line 175
# Let's find and fix it
print("Before fix (line 175 area):")
idx = content.find('Cach')
if idx >= 0:
    print(repr(content[idx:idx+80]))

# Apply manual fixes for the specific pattern
# The em-dash mojibake pattern
content = content.replace('Ñampa;"'.encode('utf-8').decode('latin-1'), '—')

# Also fix other potential patterns
content = content.replace('â€"'.encode('utf-8').decode('latin-1'), '—')
content = content.replace('â€"'.encode('utf-8').decode('latin-1'), '—')

print("\nAfter fix (line 175 area):")
idx = content.find('Cach')
if idx >= 0:
    print(repr(content[idx:idx+80]))

# Save
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("\nDone!")