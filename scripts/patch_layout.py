"""Patch admin layout.tsx to add Enterprise Sync nav item and EnterpriseIcon."""
import sys

path = r'c:\Users\Matt\Lookitry\frontend\src\app\admin\layout.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Mark original size
original_size = len(content)

# 1. Add Enterprise Sync item before WooCommerce in the nav
search = "{ href: '/admin/woocommerce'"
replacement = "{ href: '/admin/enterprise',    label: 'Enterprise Sync', icon: EnterpriseIcon },\r\n      { href: '/admin/woocommerce'"
if search in content:
    content = content.replace(search, replacement, 1)
    print(f"Nav item added. Size: {len(content)}")
else:
    print("WARNING: Could not find woocommerce nav item", file=sys.stderr)

# 2. Add EnterpriseIcon before WooIcon function
search2 = "function WooIcon("
replacement2 = """function EnterpriseIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function WooIcon("""
if search2 in content:
    content = content.replace(search2, replacement2, 1)
    print(f"EnterpriseIcon added. Size: {len(content)}")
else:
    print("WARNING: Could not find WooIcon function", file=sys.stderr)

if len(content) == original_size:
    print("ERROR: No changes made!", file=sys.stderr)
    sys.exit(1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! Patched successfully.")
