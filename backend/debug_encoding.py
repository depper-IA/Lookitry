#!/usr/bin/env python3
with open('src/controllers/pruebalo.controller.ts', 'rb') as f:
    raw = f.read()

# Find 'Cach' and get the surrounding bytes
idx = raw.find(b'Cach')
if idx >= 0:
    # Get surrounding context
    start = max(0, idx - 20)
    end = min(len(raw), idx + 100)
    snippet = raw[start:end]
    print('Raw bytes around Cach:')
    print('  Hex:', snippet.hex())
    print('  ASCII decoded:', snippet.decode('ascii', errors='replace'))

# Find the problematic sequence
problem_seq = b'\xc3\x91\xc2\xe2\x80\x9d'
idx2 = raw.find(problem_seq)
if idx2 >= 0:
    print('\nFound problematic sequence at index', idx2)
    snippet2 = raw[idx2:idx2+30]
    print('Hex:', snippet2.hex())
    print('Decoded:', snippet2.decode('utf-8', errors='replace'))