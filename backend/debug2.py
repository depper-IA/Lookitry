#!/usr/bin/env python3
with open('src/controllers/pruebalo.controller.ts', 'rb') as f:
    raw = f.read()

# Find all occurrences of the em-dash byte sequences
# In UTF-8, em-dash (U+2014) is E2 80 94
# If double-encoded, it becomes C3 A2 E2 82 AC

em_dash_utf8 = bytes([0xe2, 0x80, 0x94])
em_dash_mojibake = bytes([0xc3, 0xa2, 0xe2, 0x82, 0xac])

print("Looking for problematic sequences...")

# Find 'invalidar' and check what's before it
idx = raw.find(b'invalidar')
while idx > 0:
    # Check the 50 bytes before 'invalidar'
    before = raw[max(0, idx-50):idx]
    if b'Cach' in before:
        print(f"Found at index {idx}:")
        print(f"  Before 'invalidar': {before.hex()}")
        print(f"  Decoded: {before.decode('utf-8', errors='replace')}")
    idx = raw.find(b'invalidar', idx+1)