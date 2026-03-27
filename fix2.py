with open('c:/Users/Matt/Lookitry/frontend/src/components/dashboard/SettingsForm.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '<span className="text-3xl font-[1000] text-zinc-900"></span>',
    '<span className="text-3xl font-[1000] text-zinc-900">{proPrice ? \c:\Users\Matt\Lookitry{Math.round(proPrice / 1000)}k : \'\'}</span>'
)

with open('c:/Users/Matt/Lookitry/frontend/src/components/dashboard/SettingsForm.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
