# Checklist de Rotacion de Credenciales

> Estado: **PARCIALMENTE EJECUTADO — ACCION URGENTE PENDIENTE**
> Generado: 2026-05-23
> Verificado contra git: 2026-06-08
> Responsable: Travis (rotacion manual — las IAs NO ejecutan este proceso)

---

## Estado Verificado (2026-06-08)

Verificacion hecha con `git ls-files` y lectura del contenido en HEAD.

| Archivo | Trackeado en HEAD | Secretos vivos en HEAD | Estado |
|---------|-------------------|------------------------|--------|
| `opencode.json` | **SI** | **SI — 6 secretos** | **URGENTE — sin destrackear** |
| `scripts/id_rsa_lookitry` | No | — | Destrackeado (sigue en historial) |
| `scripts/n8n_api_key.txt` | No | — | Destrackeado (sigue en historial) |
| `bedrock-long-term-api-key.csv` | No | — | Destrackeado (sigue en historial) |
| `.kiro/steering/LOOKITRY_ARCH.md` | Si | No (placeholders) | Saneado |

### URGENTE — `opencode.json` sigue trackeado con secretos vivos

A 2026-06-08, `opencode.json` esta en el commit actual y expone:

| Linea | Campo | Servicio |
|-------|-------|----------|
| 8 | `provider.minimax.options.apiKey` | MiniMax (`sk-cp-...`) |
| 113 | `provider.groq.options.apiKey` | Groq (`gsk_...`) |
| 226 | `TELEGRAM_BOT_TOKEN` | Telegram Bot |
| 239 | `N8N_API_KEY` | n8n (JWT) |
| 251 | `API_TOKEN` | Hostinger |
| 263 | `CONTEXT7_API_KEY` | Context7 |

Estos 6 secretos deben rotarse Y el archivo destrackearse de inmediato.

> Nota: `opencode.json` aparece como modificado en el working tree. Antes de
> `git rm --cached`, confirmar que existe `opencode.example.json` con la
> estructura de placeholders para el onboarding.

---

## Credenciales a Rotar

| Servicio | Archivo Comprometido | Variable/Campo | Prioridad | Estado |
|---------|---------------------|----------------|-----------|--------|
| VPS SSH | `scripts/id_rsa_lookitry` | Clave privada RSA | CRITICA | Destrackeado — rotar + purgar historial |
| VPS Password | `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` | Seccion VPS PRODUCCION | CRITICA | Verificar manualmente |
| n8n JWT | `scripts/n8n_api_key.txt` | Token JWT completo | ALTA | Destrackeado — rotar + purgar historial |
| n8n JWT | `opencode.json` | `mcp.n8n.environment.N8N_API_KEY` | ALTA | **Trackeado — rotar YA** |
| Telegram Bot | `opencode.json` | `mcp.telegram.environment.TELEGRAM_BOT_TOKEN` | ALTA | **Trackeado — rotar YA** |
| Hostinger API | `opencode.json` | `mcp.hostinger-mcp.environment.API_TOKEN` | ALTA | **Trackeado — rotar YA** |
| MiniMax API | `opencode.json` | `provider.minimax.options.apiKey` | ALTA | **Trackeado — rotar YA** |
| Groq API | `opencode.json` | `provider.groq.options.apiKey` | MEDIA | **Trackeado — rotar YA** |
| Context7 API | `opencode.json` | `mcp.context7.environment.CONTEXT7_API_KEY` | MEDIA | **Trackeado — rotar YA** |
| AWS Bedrock | `bedrock-long-term-api-key.csv` | Access Key ID + Secret Access Key | ALTA | Destrackeado — rotar + purgar historial |
| LOOKITRY_ARCH | `.kiro/steering/LOOKITRY_ARCH.md` | Tabla "Credenciales MCP" | ALTA | Saneado (placeholders) |

---

## Paso 1 — Dejar de trackear los archivos en git

Solo falta `opencode.json` (los otros 3 ya estan destrackeados):

```bash
git rm --cached opencode.json
git commit -m "chore(security): untrack credential file from git"
git push
```

> Verificar que `opencode.json` este en `.gitignore` para evitar re-trackeo.

---

## Paso 2 — Rotar cada credencial

Despues de ejecutar el Paso 1, rotar cada credencial en su plataforma:

1. **VPS SSH** — Generar nuevo par de claves: `ssh-keygen -t ed25519 -f scripts/id_rsa_lookitry_new`
2. **VPS Password** — Cambiar en el panel de Hostinger VPS
3. **n8n JWT** — Revocar y regenerar en `https://n8n.wilkiedevs.com/settings/api`
4. **Telegram Bot** — Revocar token en @BotFather con `/revoke`
5. **Hostinger API** — Revocar en `https://hpanel.hostinger.com/profile/api`
6. **MiniMax API** — Revocar en el panel de MiniMax
7. **Groq API** — Revocar en `https://console.groq.com/keys`
8. **Context7 API** — Revocar en el panel de Context7
9. **AWS Bedrock** — Revocar en AWS IAM Console

Actualizar `opencode.json` y `backend/.env` con los nuevos valores despues de rotar.

---

## Paso 3 — Purga del historial de git (RECOMENDADO)

> ADVERTENCIA: Este paso reescribe el historial de git. Requiere autorizacion
> explicita de Travis y coordinacion si hay otros colaboradores.
> Hacer backup del repo antes de ejecutar.
>
> Aplica a TODOS los archivos: los 3 ya destrackeados siguen en el historial
> (recuperables con `git show <commit>:<archivo>`), mas `opencode.json` despues
> del Paso 1.

```bash
# Instalar git-filter-repo si no esta instalado
pip install git-filter-repo

# Purgar cada archivo del historial
git filter-repo --path opencode.json --invert-paths
git filter-repo --path scripts/n8n_api_key.txt --invert-paths
git filter-repo --path scripts/id_rsa_lookitry --invert-paths
git filter-repo --path bedrock-long-term-api-key.csv --invert-paths

# Force push (DESTRUCTIVO — coordinar con colaboradores)
git push origin --force --all
git push origin --force --tags
```

> Importante: la purga del historial NO sustituye la rotacion. Cualquiera que
> haya clonado el repo antes de la purga ya tiene los secretos. Rotar SIEMPRE.

---

## Onboarding en nuevo PC

Para configurar el proyecto en una nueva maquina:

```bash
git clone <repo-url>
cp opencode.example.json opencode.json
# Editar opencode.json con las credenciales reales
cp backend/.env.example backend/.env
# Editar backend/.env con las credenciales reales
```

Ver `opencode.example.json` para la estructura completa con placeholders.
