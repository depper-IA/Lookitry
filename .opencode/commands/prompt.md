---
description: Optimiza un prompt para ejecutar en OpenCode
agent: general
---

Eres un experto en prompt engineering para OpenCode. Optimiza el siguiente prompt para que funcione óptimamente dentro del entorno de OpenCode (tool use, agents, workflow de ejecución).

---
$ARGUMENTS
---

## Contexto: Cómo funciona OpenCode

OpenCode es un CLI de código abierto basado en agentes con estas capacidades:

### Herramientas disponibles
- **bash**: Ejecuta comandos de terminal
- **read/write/edit**: Manipulación de archivos
- **glob/grep**: Búsqueda de archivos y contenido
- **task**: Lanza subagents para tareas paralelas
- **webfetch**: Obtiene contenido de URLs

### Patrones de ejecución
- Llamadas a herramientas en paralelo cuando no hay dependencias
- Agentes especializados: `general` (propsito general), `explore` (exploración de codebases), `build` (construcción de cdigo), `plan` (planificación)
- Respuestas concisas - evita texto innecesario
- Optional chaining `?.` obligatorio en accesos a datos de API/Supabase

### Estructura de proyectos
- Comandos personalizados en `.opencode/commands/`
- Skills en `.opencode/skills/` o `.agent/skills/`
- Config en `opencode.json`
- Agentes definidos en `.opencode/agents/` o `AGENTS.md` en raíz

## Mejores prácticas para optimizar prompts para OpenCode

### 1. Sé específico y estructurado
- Usa secciones claras: Contexto, Tarea, Restricciones, Formato de salida
- Indica exactamente qué herramientas usar o no usar
- Especifica el orden cuando matters

### 2. Define el alcance (scope)
- Delimita qué archivos/carpetas afecta
- Especifica qué NO debe hacer
- Evita ambigüedad en el alcance

### 3. Instrucciones de acción claras
- "Ejecuta X" vs "Sugiere X" - indica si debe actuar o no
- Indica si debe usar subagents para tareas paralelas
- Especifica llamadas a herramientas específicas si es crítico

### 4. Formato de salida deseado
- Indica si quieres código, explicación, o ambos
- Especifica formato (JSON, markdown, etc.)
- Indica nivel de detalle esperado

### 5. Considera el contexto del proyecto
- Si hay `AGENTS.md`, `SKILL.md`, o documentación relevant, menciónalos
- Indica convenciones del proyecto a seguir
- Referencia variables de entorno o configs importantes

### 6. Manejo de errores y edge cases
- Especifica cómo manejar situaciones ambiguas
- Indica si debe preguntar o inferir
- Establece qué hacer si algo falla

### 7. Optimización para tokens
- Pide respuestas concisas cuando sea apropiado
- Indica si quieres explicaciones paso a paso o solo resultado final

## Formato de salida

Provee el prompt optimizado en este formato:

### Análisis
[breve análisis del prompt original y qué mejora necesita]

### Prompt optimizado
[prompt reescrito optimizado para OpenCode]

### Cambios clave
1. [cambio 1 y su justificación]
2. [cambio 2 y su justificación]
...

### Notas adicionales
[consejos adicionales para usar este prompt en OpenCode, si aplica]
