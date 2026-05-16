---
name: "github"
displayName: "GitHub MCP Server"
description: "Conecta Kiro directamente a GitHub para gestionar repositorios, issues, pull requests, Actions y más mediante lenguaje natural. Usa el servidor MCP oficial de GitHub con autenticación por Personal Access Token."
keywords: ["github", "repositorio", "pull-request", "issues", "git", "actions", "ci-cd"]
author: "Travis"
---

# GitHub MCP Server

## Overview

El GitHub MCP Server es el servidor MCP oficial de GitHub que conecta tu agente de IA directamente a la plataforma de GitHub. Con él puedes leer y navegar código, gestionar issues y pull requests, monitorear workflows de GitHub Actions, analizar seguridad del código y colaborar con tu equipo — todo desde lenguaje natural.

Este power usa la imagen Docker oficial `ghcr.io/github/github-mcp-server` y requiere un **GitHub Personal Access Token (PAT)** para autenticarse.

## Onboarding

### Prerrequisitos

1. **Docker instalado y corriendo** — el servidor corre en un contenedor Docker.
   - Verifica: `docker --version`
   - Si no lo tienes: https://docs.docker.com/get-docker/

2. **GitHub Personal Access Token (PAT)** — necesitas un token con los permisos adecuados.

### Crear tu GitHub PAT

1. Ve a https://github.com/settings/personal-access-tokens/new
2. Dale un nombre descriptivo (ej: `kiro-mcp`)
3. Selecciona los permisos según lo que necesites:
   - **Repositorios**: `repo` (lectura/escritura) o `public_repo` (solo públicos)
   - **Issues y PRs**: incluidos en `repo`
   - **Actions**: `workflow`
   - **Organizaciones**: `read:org`
   - **Usuarios**: `read:user`
4. Genera el token y **cópialo** — solo se muestra una vez

### Configurar el token en mcp.json

Abre el archivo `mcp.json` de este power y reemplaza `YOUR_GITHUB_PAT_HERE` con tu token real.

### Verificar que Docker puede bajar la imagen

```bash
docker pull ghcr.io/github/github-mcp-server
```

Si ves errores de autenticación: `docker logout ghcr.io` y vuelve a intentar.

---

## Toolsets disponibles

El servidor organiza sus herramientas en **toolsets**. Por defecto activa: `context`, `repos`, `issues`, `pull_requests`, `users`.

| Toolset | Descripción |
|---------|-------------|
| `context` | Info del usuario actual y contexto de GitHub (recomendado) |
| `repos` | Gestión de repositorios |
| `issues` | Issues de GitHub |
| `pull_requests` | Pull Requests |
| `users` | Usuarios de GitHub |
| `actions` | Workflows de GitHub Actions y CI/CD |
| `git` | Operaciones Git de bajo nivel (branches, commits) |
| `notifications` | Notificaciones de GitHub |
| `discussions` | GitHub Discussions |
| `projects` | GitHub Projects |
| `labels` | Labels de repositorios |
| `gists` | GitHub Gists |
| `orgs` | Organizaciones de GitHub |
| `stargazers` | Stargazers |
| `code_security` | Code Scanning y seguridad |
| `dependabot` | Alertas de Dependabot |
| `secret_protection` | Secret Scanning |
| `security_advisories` | Advisories de seguridad |

Para activar toolsets adicionales, agrega la variable `GITHUB_TOOLSETS` en el `mcp.json`:

```json
"env": {
  "GITHUB_PERSONAL_ACCESS_TOKEN": "tu-token",
  "GITHUB_TOOLSETS": "default,actions,git,notifications"
}
```

---

## Workflows comunes

### Explorar un repositorio

```
"Muéstrame los archivos del repositorio mi-usuario/mi-repo"
"¿Cuál es el contenido de src/index.ts en mi-usuario/mi-repo?"
"Lista los últimos commits del repo mi-usuario/mi-repo"
```

### Gestionar Issues

```
"Crea un issue en mi-usuario/mi-repo con título 'Bug en login' y descripción detallada"
"Lista los issues abiertos de mi-usuario/mi-repo"
"Cierra el issue #42 de mi-usuario/mi-repo"
"Agrega el comentario 'Revisando esto' al issue #15"
```

### Trabajar con Pull Requests

```
"Lista los PRs abiertos de mi-usuario/mi-repo"
"Crea un PR desde la rama feature/login hacia main con descripción del cambio"
"Muéstrame los archivos cambiados en el PR #8"
"Aprueba el PR #8 con el comentario 'LGTM'"
```

### GitHub Actions

```
"¿Cuál es el estado del último workflow run en mi-usuario/mi-repo?"
"Lista los workflows fallidos de la última semana"
"Re-ejecuta el workflow run #123"
```

### Buscar código

```
"Busca todos los archivos que usen 'supabase' en mi-usuario/mi-repo"
"Encuentra funciones que contengan 'authenticate' en el repositorio"
```

---

## Modos especiales

### Solo lectura (recomendado para exploración)

Agrega `"GITHUB_READ_ONLY": "1"` en las variables de entorno del `mcp.json`. Previene cualquier modificación accidental.

### Toolsets dinámicos (beta)

Agrega `"GITHUB_DYNAMIC_TOOLSETS": "1"` para que el agente descubra y active toolsets según necesite, reduciendo el contexto inicial.

### GitHub Enterprise Server

Agrega `"GITHUB_HOST": "https://tu-dominio-ghes.com"` en las variables de entorno.

---

## Troubleshooting

### Error: "docker: command not found"
Docker no está instalado o no está en el PATH.
- Instala Docker: https://docs.docker.com/get-docker/
- Reinicia tu terminal después de instalar

### Error: "unauthorized" al bajar la imagen
Token de Docker expirado.
```bash
docker logout ghcr.io
docker pull ghcr.io/github/github-mcp-server
```

### Error: "Bad credentials" o "401 Unauthorized"
El PAT es incorrecto, expiró o no tiene los permisos necesarios.
1. Verifica que copiaste el token completo en `mcp.json`
2. Genera un nuevo PAT en https://github.com/settings/tokens
3. Asegúrate de que el token tiene los scopes necesarios

### El servidor no responde / timeout
1. Verifica que Docker está corriendo: `docker ps`
2. Prueba bajar la imagen manualmente: `docker pull ghcr.io/github/github-mcp-server`
3. Reinicia Kiro y reconecta el servidor MCP desde el panel MCP

### Error: "rate limit exceeded"
Alcanzaste el límite de la API de GitHub.
- Los tokens autenticados tienen 5,000 requests/hora
- Espera unos minutos o usa un token con más permisos

---

## MCP Config Placeholders

**IMPORTANTE:** Antes de usar este power, reemplaza el siguiente placeholder en `mcp.json`:

- **`YOUR_GITHUB_PAT_HERE`**: Tu GitHub Personal Access Token.
  - **Cómo obtenerlo:**
    1. Ve a https://github.com/settings/personal-access-tokens/new
    2. Ponle un nombre (ej: `kiro-mcp`)
    3. Selecciona los permisos que necesitas (mínimo: `repo`, `read:user`)
    4. Haz clic en "Generate token"
    5. Copia el token generado y pégalo aquí

Después de reemplazar, tu `mcp.json` debería verse así:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_tuTokenRealAqui123456"
      }
    }
  }
}
```

---

**Imagen Docker:** `ghcr.io/github/github-mcp-server`
**Repositorio oficial:** https://github.com/github/github-mcp-server
**Documentación de PATs:** https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
