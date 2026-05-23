with open('frontend/src/app/politicas-privacidad/page.tsx', 'rb') as f:
    content = f.read()

# Add n8n to the third-party sharing list
# After "Vertex AI, OpenRouter) ... confidencialidad."
old = (
    b'Vertex AI, OpenRouter) para el procesamiento de im\xc3\xa1genes del probador virtual, '
    b'bajo acuerdos contractuales de confidencialidad.\n'
    b'\xe2\x80\x94 Autoridades comp'
)

new = (
    b'Vertex AI, OpenRouter) para el procesamiento de im\xc3\xa1genes del probador virtual, '
    b'bajo acuerdos contractuales de confidencialidad.\n'
    b'\xe2\x80\x94 n8n (plataforma de automatizaci\xc3\xb3n) para generaci\xc3\xb3n de im\xc3\xa1genes por IA, bajo acuerdo de procesamiento de datos conforme Ley 1581 Art. 10-C.\n'
    b'\xe2\x80\x94 Autoridades comp'
)

if old in content:
    content = content.replace(old, new, 1)
    print('Added n8n to third-party sharing')
else:
    print('Pattern not found')

with open('frontend/src/app/politicas-privacidad/page.tsx', 'wb') as f:
    f.write(content)

print('Done')