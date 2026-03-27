"""Patch SettingsForm.tsx to add WooCommerce Plugin."""
path = r'c:\Users\Matt\Lookitry\frontend\src\components\dashboard\SettingsForm.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add WooCommerce Plugin to the list
search = "'Control total de branding',"
replacement = "'Control total de branding',\n                                    'Plugin de WooCommerce',"
if search in content:
    content = content.replace(search, replacement, 1)
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    print('Patched successfully')
else:
    print('Could not find search string')
