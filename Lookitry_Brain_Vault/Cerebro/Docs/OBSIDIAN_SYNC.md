# Contrato Cerebro-Obsidian

## Vault

- **Ruta del vault**: `Lookitry_Brain_Vault/`
- **Cerebro**: `Lookitry_Brain_Vault/Cerebro/` (fuente de verdad)
- **Configuración Obsidian**: `.obsidian/` (en la raíz del vault — no editar manualmente)

## Jerarquía de Verdad

El Cerebro es la fuente de verdad. Obsidian es el visor.

Si hay conflicto entre metadata generada por Obsidian y el contenido del Cerebro, **el contenido del Cerebro prevalece**. Obsidian puede agregar timestamps, tags y backlinks; eso no reemplaza el contenido source.

## Archivos Always-Load

Estos archivos tienen frontmatter `inclusion: always` y se cargan automáticamente:

| Archivo | Razón |
|---------|-------|
| `Cerebro/REGLAS_IMPORTANTES.md` | Reglas maestras del proyecto |
| `Cerebro/MAPA_MAESTRO.md` | Índice de navegación |

## Archivos On-Demand

Se leen cuando la tarea lo requiere:

| Archivo | Cuándo leerlo |
|---------|--------------|
| `Cerebro/TECH_STACK.md` | Arquitectura o dependencias |
| `Cerebro/DESIGN.md` | UI/UX y sistema de diseño |
| `Cerebro/AGENTS.md` | Orquestación de agentes |
| `Cerebro/Protocolos/ARRANQUE_UNIVERSAL.md` | Configurar una nueva IA |
| `Cerebro/Docs/OBSIDIAN_SYNC.md` | Agregar documentos al Cerebro |

## Convenciones de Links Internos

Usar siempre `[[NombreArchivo]]` sin extensión para links internos de Obsidian.

**Correcto**: `[[MAPA_MAESTRO]]`, `[[REGLAS_IMPORTANTES]]`, `[[ARRANQUE_UNIVERSAL]]`
**Incorrecto**: `[[MAPA_MAESTRO.md]]`, `[[/Cerebro/REGLAS_IMPORTANTES]]`

## Regla de Actualización del MAPA_MAESTRO

Cada vez que se agrega un documento nuevo a `Lookitry_Brain_Vault/Cerebro/`, se **DEBE** actualizar `MAPA_MAESTRO.md` para incluir un link al nuevo documento en la sección correspondiente.

## Links Rotos

Si un link `[[Target]]` apunta a un archivo que no existe, documentarlo en `MAPA_MAESTRO.md` bajo la sección "Links Rotos" hasta que el archivo sea creado.

## Sincronización Cerebro ↔ Obsidian

1. **Escritura**: Editar archivos en `Cerebro/` directamente. No usar Obsidian para crear nuevos archivos en el vault raíz.
2. **Lectura**: Obsidian muestra el Cerebro con backlinks, graph view y search. Conveniente para navegación, no para edición.
3. **Conflicts**: Si Obsidian genera cambios (frontmatter, tags), revisarlos. Si contradicen el Cerebro, revertir al contenido del Cerebro.