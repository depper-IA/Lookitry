with open('backend/src/controllers/tryon.controller.ts', 'rb') as f:
    content = f.read()

# Find the exact bytes for updateGeneration + SUCCESS
# Vertex path: updateGeneration(... status: 'SUCCESS', result_image_url: resultImageUrl, processing_time: ..., prompt_used: prompt,   });
idx = content.find(b"status: 'SUCCESS',")
print('SUCCESS at:', idx)

if idx >= 0:
    chunk = content[idx:idx+300]
    print(chunk.hex())
    # Find the opening brace of updateGeneration - go backwards
    # Look for 'generationsService.updateGeneration'
    back_idx = content.rfind(b'generationsService.updateGeneration', 0, idx)
    print('updateGeneration at:', back_idx)
    if back_idx >= 0:
        update_chunk = content[back_idx:idx+300]
        print('Update chunk (last 300 bytes):')
        for i, b in enumerate(update_chunk[-200:]):
            if b == 13: print('<CR>', end='')
            elif b == 10: print('<LF>', end='')
            else: print(chr(b), end='')
        print()
else:
    print('Pattern not found')