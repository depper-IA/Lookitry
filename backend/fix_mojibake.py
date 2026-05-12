#!/usr/bin/env python3
with open('src/controllers/pruebalo.controller.ts', 'rb') as f:
    raw = f.read()

# The problematic sequence we found:
# c391c2a2c3a2c282c2acc3a2c280c29d
# This is the mojibake for em-dash (—)
# In correct UTF-8, em-dash is: e2 80 94

# But the file has extra bytes that were double-encoded
# Let's just replace the known bad sequence with correct em-dash

# First, let's see what we need to fix
bad_seq = bytes([0xc3, 0x91, 0xc2, 0xa2, 0xc3, 0xa2, 0xc2, 0x80, 0xc2, 0x9d])
good_seq = bytes([0xe2, 0x80, 0x94])  # em-dash in UTF-8

if bad_seq in raw:
    print("Found bad sequence!")
    fixed = raw.replace(bad_seq, good_seq)
    with open('src/controllers/pruebalo.controller.ts', 'wb') as f:
        f.write(fixed)
    print("Fixed!")
else:
    print("Bad sequence not found, trying alternative patterns...")

# Check for other common mojibake patterns
# Em-dash: â€ (c3 a2 e2 82 ac) -> should be — (e2 80 94)
alt_bad = bytes([0xc3, 0xa2, 0xe2, 0x82, 0xac])
if alt_bad in raw:
    print("Found alt em-dash mojibake")
    fixed = raw.replace(alt_bad, good_seq)
    with open('src/controllers/pruebalo.controller.ts', 'wb') as f:
        f.write(fixed)
    print("Fixed alt!")