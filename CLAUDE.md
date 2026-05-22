# CLAUDE.md — Lookitry Project

## Idioma y Tono (OBLIGATORIO)

**SIEMPRE español neutro (tuteo, "tú")**. PROHIBIDO voseo rioplatense ("subí", "andá", "elegí", "mirá", etc.).
PROHIBIDO usar emojis en respuestas y en copy de UI.
Aplica a: respuestas del agente Y copy generado para la UI.
Ejemplos correctos: "sube", "elige", "mira", "ve a", "haz clic".

## PROTOCOLO DE ARRANQUE (OBLIGATORIO)

**AL INICIAR CADA CONVERSACIÓN**, leer primero:
- `Lookitry_Brain_Vault/Cerebro/MAPA_MAESTRO.md` — reglas de implementación, diseño y seguridad

Esto es BLOQUEANTE. No proceder hasta leerlo.

## Gestión de Paquetes

**SIEMPRE usar `pnpm`**. PROHIBIDO `npm install` / `npm update`.

```bash
pnpm install   # instalar deps
pnpm add [pkg] # agregar paquete
pnpm dev       # servidor desarrollo
```

Razón: vulnerabilidades activas en NPM (Supply Chain Attacks Mayo 2026). Ver sección 15 de REGLAS_IMPORTANTES.md.
