import os

p = r"c:\Users\Usuario\Mostrador_wilkiedevs\frontend\src\components\dashboard\SettingsForm.tsx"

with open(p, 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

for i, line in enumerate(lines[390:405]):
    # printing line numbers and literal repr
    print(f"{i+391}: {repr(line)}")
