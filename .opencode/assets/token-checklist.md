# Token Optimization Checklist

## Antes de Cada Respuesta

- [ ] ¿Puedo usar símbolos en vez de palabras completas?
- [ ] ¿El contexto requiere toda esta información?
- [ ] ¿Hay redundancia que eliminar?
- [ ] ¿Puedo comprimir el formato a `dominio: item | status`?

## Análisis de Skills

- [ ] Skill < 200 líneas (core esencial)
- [ ] ¿Hay contenido que mover a EXTENDED?
- [ ] ¿Hay ASCII art que convertir a texto descriptivo?
- [ ] ¿Ejemplos > 50 líneas → mover a ASSETS?

## Compresión de Logs

- [ ] `timestamp + level + message` → `ts + lvl + msg`
- [ ] Paths relativos, no absolutos
- [ ] Usar `»` para sequences
- [ ] Combinar logs similares en una línea

## Red Flags de Token Waste

- [ ] Explicaciones innecesarias ("En primer lugar...", "Es importante notar que...")
- [ ] Repetición de información ya en contexto
- [ ] Headers/footers extensos
- [ ] ASCII art decorativo
- [ ] Ejemplos que duplican la explicación

## Scoring

| Puntuación | Criterio |
|------------|----------|
| 90-100 | Óptimo — skill lean, símbolos usados |
| 70-89 | Bueno — puede comprimirse más |
| 50-69 | Regular — aplicar checklist |
| <50 | Crítico — refactorizar urgentemente |

## Acciones por Score

- **90-100:** Mantener, monitorear
- **70-89:** Revisar EXTENDED para mover más a ASSETS
- **50-69:** Sesión de compresión scheduled
- **<50:** Prioridad inmediata — refactorizar antes de nuevos features
