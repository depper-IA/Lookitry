# Checklist de Rotacion de Credenciales

> Estado: **PENDIENTE DE ROTACION**
> Generado: 2026-05-23
> Responsable: Travis (rotacion manual — las IAs NO ejecutan este proceso)

---

## Credenciales a Rotar

| Servicio | Archivo Comprometido | Variable/Campo | Prioridad |
|---------|---------------------|----------------|-----------|
| VPS SSH | `scripts/id_rsa_lookitry` | Clave privada RSA | CRITICA |
| VPS Password | `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` | Seccion VPS PRODUCCION | CRITICA |
| n8n JWT | `scripts/n8n_api_key.txt` | Token JWT completo | ALTA |
| n8n JWT | `opencode.json` | `mcp.n8n.environment.N8N_API_KEY` | ALTA |
| Telegram Bot | `opencode.json` | `mcp.telegram.environment.TELEGRAM_BOT_TOKEN` | ALTA |
| Hostinger API | `opencode.json` | `mcp.hostinger-mcp.environment.API_TOKEN` | ALTA |
| MiniMax API | `opencode.json` | `provider.minimax.options.apiKey` | ALTA |
| Groq API | `opencode.json` | `provider.groq.options.apiKey` | MEDIA |
| Context7 API | `opencode.json` | `mcp.context7.environment.CONTEXT7_API_KEY` | MEDIA |
| AWS Bedrock | `bedrock-long-term-api-key.csv` | Access Key ID + Secret Access Key | ALTA |
| LOOKITRY_ARCH | `.kiro/steering/LOOKITRY_ARCH.md` | Tabla "Credenciales MCP" (tokens reales) | ALTA |

---

## Paso 1 — Dejar de trackear los archivos en git

Ejecutar desde la raiz del repositorio (estos comandos NO eliminan los archivos del disco):

```bash
git rm --cached opencode.json
git rm --cached scripts/n8n_api_key.txt
git rm --cached scripts/id_rsa_lookitry
git rm --cached bedrock-long-term-api-key.csv
git commit -m "chore(security): untrack credential files from git"
git push
```

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

## Paso 3 — Purga del historial de git (OPCIONAL pero recomendado)

> ADVERTENCIA: Este paso reescribe el historial de git. Requiere autorizacion
> explicita de Travis y coordinacion si hay otros colaboradores.
> Hacer backup del repo antes de ejecutar.

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
