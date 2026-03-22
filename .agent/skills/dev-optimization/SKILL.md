---
name: dev-optimization
description: Técnicas de optimización de tiempo, tokens y despliegue rápido.
---

# DEV OPTIMIZATION & CREDIT SAVING SKILL

## 1. Reglas de Modificación en Archivos
- Modifica el código exactamente donde necesita el cambio usando herramientas de Búsqueda y Reemplazo (`replace_file_content` o `multi_replace`).
- NO reescribas archivos enteros a menos que vayas a cambiar el 80% de ellos.
- NUNCA uses la herramienta del navegador (Browser Subagent) para probar si algo funciona en Localhost, a menos que el usuario lo solicite expresamente. Esto quema demasiados créditos. En su lugar pide al usuario que haga QA, o usar tests unitarios.

## 2. Flujo de Git & Deploy ultra veloz
- Aprovecha el script: `python scripts/_deploy_now.py --restart` para resetear el contenedor y tomar variables de entorno sin reconstruirlo (toma 5s).
- Trata de enviar un solo gran commit al finalizar la tarea y empujarlo, usando el menor número de interacciones posibles con consola.
