# CLAUDE.md — Lookitry Project

## PROTOCOLO DE ARRANQUE (OBLIGATORIO)

**AL INICIAR CADA CONVERSACIÓN**, leer primero:
- `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` — reglas de implementación, agentes, diseño y seguridad

Esto es BLOQUEANTE. No proceder hasta leerlo.

## Gestión de Paquetes

**SIEMPRE usar `pnpm`**. PROHIBIDO `npm install` / `npm update`.

```bash
pnpm install   # instalar deps
pnpm add [pkg] # agregar paquete
pnpm dev       # servidor desarrollo
```

Razón: vulnerabilidades activas en NPM (Supply Chain Attacks Mayo 2026). Ver sección 15 de REGLAS_IMPORTANTES.md.
