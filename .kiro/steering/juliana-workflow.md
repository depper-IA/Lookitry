---
inclusion: always
---

# Flujo de trabajo — Juliana

## Rama de trabajo

**REGLA CRÍTICA:** Todos los cambios de código deben subirse a la rama `Juli`, NO a `main`.

```bash
# Antes de cualquier push, asegurarse de estar en la rama Juli
git checkout Juli
git add -A
git commit -m "descripción"
git push origin Juli
```

Si la rama `Juli` no existe localmente:
```bash
git checkout -b Juli origin/Juli
```

## Deploy

**PROHIBIDO hacer deploy** a menos que:
1. El usuario lo solicite explícitamente, O
2. Ya se esté realizando un deploy previo en la misma sesión

No ejecutar `_deploy_now.py` ni hacer merge a `main` de forma automática.

## Resumen

| Acción | Regla |
|--------|-------|
| Push de código | Siempre a rama `Juli` |
| Deploy al VPS | Solo con orden explícita del usuario |
| Merge a `main` | Solo con orden explícita del usuario |
