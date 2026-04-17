# Estructura del Repositorio Lookitry

## ⚠️ REGLA CRÍTICA: Ubicación de OpenClaw

**OpenClaw NUNCA debe estar dentro del repositorio.**

### Ubicación Correcta
```
~/.openclaw/
```

### Por qué
- `~/.openclaw/` es el directorio por defecto de OpenClaw
- Contiene: workspaces de agentes, sesiones, credenciales, tokens API
- Contiene información sensible que NO debe estar en Git

### Qué PASA si se crea .openclaw dentro del repo
- Aparece como carpeta duplicada (~/Lookitry/Lookitry/.openclaw/)
- Causa confusión sobre cuál es la ubicación real
- Si se sube a Git, se exponen credenciales y tokens

### Solución si aparece
```bash
rm -rf /path/al/repo/.openclaw
```

**El .gitignore del repo YA incluye `.openclaw/` para prevenir commits accidentales.**

---

## Estructura del Proyecto

```
~/Lookitry/Lookitry/
├── backend/           # API Express + TypeScript
├── frontend/          # Next.js 14 App
├── Lookitry_Brain_Vault/  # Documentación y conocimiento
│   └── Cerebro/
│       ├── AGENTS.md       # Config de agentes
│       ├── REGLAS_IMPORTANTES.md
│       ├── PRD.md          # Product Requirements
│       ├── TECH_STACK.md
│       ├── Agentes/        # Docs de cada agente
│       └── Skills/         # Habilidades técnicas
├── docs/             # Documentación adicional
├── assets/           # Recursos estáticos
└── ...
```

## Ubicaciones de Workspaces de Agentes

| Agente | Workspace Real | Ubicación |
|--------|---------------|-----------|
| Sammantha | `~/.openclaw/workspaces/sammy/` | ✅ Correcta |
| Pixel | `~/.openclaw/workspaces/webwizard/` | ✅ Correcta |
| Kira | `~/.openclaw/workspaces/devguardian/` | ✅ Correcta |
| Nadia | `~/.openclaw/workspaces/dataalchemist/` | ✅ Correcta |
| Marlo | `~/.openclaw/workspaces/growthpilot/` | ✅ Correcta |
| Zephyr | `~/.openclaw/workspaces/architectai/` | ✅ Correcta |
| Lina | `~/.openclaw/workspaces/docs-writer/` | ✅ Correcta |
| Cipher | `~/.openclaw/workspaces/security-auditor/` | ✅ Correcta |
| Rebecca | `~/.openclaw/workspaces/rebecca/` | ✅ Correcta |
| Leo | `~/.openclaw/workspaces/leo/` | ✅ Correcta |

## NO USAR estas ubicaciones (obsoletas)

❌ `/repo/Lookitry/.openclaw/` — Duplicado, no se usa
❌ `/repo/Lookitry/rebecca/` — Workspace stub incompleto, eliminado
❌ `/repo/Lookitry/leo/` — Workspace stub incompleto, eliminado

---

## Reglas de Consistencia

1. **OpenClaw siempre en ~/.openclaw/** — No crear dentro del repo
2. **Workspaces de agentes en ~/.openclaw/workspaces/** — Única fuente de verdad
3. **Documentación en Cerebro/** — Aquí vive el conocimiento
4. **Credenciales nunca en Git** — Tokens, API keys, passwords en ~/.openclaw/ únicamente

---

_Last updated: 2026-04-16_
