import os
import re

files_to_read = [
    ".kiro/steering/architecture.md",
    ".kiro/steering/brand.md",
    ".kiro/steering/deploy-workflow.md"
]

content_to_append = ""

for file_path in files_to_read:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
            # Clean up old names
            text = re.sub(r'(?i)virtual[- ]?try[- ]?on', 'LOOKITRY', text)
            text = re.sub(r'(?i)mostrador', 'LOOKITRY', text)
            
            # Add to content
            header = f"\n\n## {file_path.split('/')[-1].replace('.md', '').upper()} ##\n"
            content_to_append += header + text

# Read current master memory
with open("LOOKITRY_MASTER_MEMORY.md", 'r', encoding='utf-8') as f:
    current_memory = f.read()

# Append missing important brand, architecture and deploy data
new_memory = current_memory + "\n" + content_to_append

with open("LOOKITRY_MASTER_MEMORY.md", 'w', encoding='utf-8') as f:
    f.write(new_memory)

# Cleanup
for file_path in files_to_read:
    if os.path.exists(file_path):
        os.remove(file_path)

try:
    os.rmdir(".kiro/steering")
    os.rmdir(".kiro")
except:
    pass

print("Archivos recuperados, limpiados de nombres antiguos y apendados exitosamente a LOOKITRY_MASTER_MEMORY.md")
