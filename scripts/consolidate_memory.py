import os
import subprocess

files_to_merge = [
    "CONTEXT.md",
    "CONTEXTO_PROYECTO.md",
    "API_DOCUMENTATION.md",
    "AUDITORIA_ARQUITECTURA_SEGURIDAD.md",
    "AUDITORIA_FRONTEND.md",
    "AUDITORIA_PAGOS_MARZO_2026.md",
    "AUDITORIA_SEGURIDAD.md",
    "AUDIT_TASKS.md",
    "PRICING_ROI_TASKS.md",
    "SEO_TASKS.md",
    "TESTING_GUIDE.md",
    "listado.md",
    ".kiro/steering/REGLAS_IMPORTANTES.md",
    ".kiro/steering/architecture.md",
    ".kiro/steering/brand.md",
    ".kiro/steering/context7-usage.md",
    ".kiro/steering/deploy-workflow.md",
    ".kiro/steering/juliana-workflow.md",
    ".kiro/steering/language-preference.md",
    ".kiro/steering/tools-and-credentials.md",
]

master_content = "# LOOKITRY - MASTER MEMORY CONTEXT\n\n"
master_content += "> Este es el ÚNICO archivo maestro de memoria para todas las interfaces de IA (Kiro, Gemini CLI, Antigravity, Cursor).\n"
master_content += "> Reemplaza todo el mar de documentos sueltos que existían antes. ¡Léelo antes de tocar rutas principales o lógicas de negocio!\n\n"

master_content += "## 1. SKILLS & PROCEDIMIENTOS OBLIGATORIOS\n"
master_content += "- **Diseño UI/UX (Pro Max)**: Aplicar SIEMPRE (`.agent/skills/ui-ux-pro-max/SKILL.md`) a cualquier componente frontend. Lookitry debe sentirse premium.\n"
master_content += "- **Testing & QA**: Referir a (`.gemini/skills/testing/SKILL.md`) al tocar lógicas de pago (Wompi) o Try-On (n8n).\n"
master_content += "- **Optimización de Desarrollo (NUEVO)**: Referir a (`.agent/skills/dev-optimization/SKILL.md`) para flujos ultra rápidos y ahorro de créditos.\n\n"

for f in files_to_merge:
    if os.path.exists(f):
        master_content += f"\n\n{'='*60}\n# END SECTION -- BEGIN: {f}\n{'='*60}\n\n"
        with open(f, "r", encoding="utf-8", errors="ignore") as file:
            master_content += file.read() + "\n"

with open("LOOKITRY_MASTER_MEMORY.md", "w", encoding="utf-8") as out:
    out.write(master_content)

print(f"Master file LOOKITRY_MASTER_MEMORY.md created. Size: {os.path.getsize('LOOKITRY_MASTER_MEMORY.md')} bytes.")

deleted_count = 0
for f in files_to_merge:
    if os.path.exists(f):
        subprocess.run(["git", "rm", "-f", f], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(f):
            os.remove(f)
        deleted_count += 1

print(f"Deleted {deleted_count} fragmented files.")

# Create the new dev-optimization skill
skill_folder = ".agent/skills/dev-optimization"
os.makedirs(skill_folder, exist_ok=True)
skill_path = os.path.join(skill_folder, "SKILL.md")

skill_content = """---
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
"""

with open(skill_path, "w", encoding="utf-8") as out:
    out.write(skill_content)

print("Created dev-optimization skill!")
