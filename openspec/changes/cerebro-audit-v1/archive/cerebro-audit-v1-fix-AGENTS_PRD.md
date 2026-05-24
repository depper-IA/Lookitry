# Correcciones: AGENTS + PRD

## AGENTS_CONFIG_MASTER.md

### 1. CORREGIR docs-writer → docs-writter

El doc dice `docs-writer` pero opencode.json usa `docs-writter` (double 't').

**CAMBIAR TODAS LAS OCURRENCIAS de:**
- `docs-writer` → `docs-writter`
- `Lina` (docs-writer) → `Lina (docs-writter)` — actualizar en tabla de delegación

### 2. ACTUALIZAR Groq (Sección RESUMEN v3.0)

Dice "Groq y DeepSeek siguen removidos de todos los systemPromptOverride"

**CAMBIAR A:**
```
### Modelo Default: MiniMax-M2.7

- **Mantenido**: Todos los agentes usan `minimax/MiniMax-M2.7`
- Groq disponible solo como `small_model` fallback (no para uso regular)
- DeepSeek removido de todos los systemPromptOverride
```

---

## PRD.md

### 3. CORREGIR generciones TRIAL

Dice TRIAL tiene 50 generaciones, pero Supabase pricing_config dice 15.

**ACTUAL (PRD.md sección 2.1):**
```
| **TRIAL** | $20.000 COP (pago único) | 1 | 50 | `#6366f1` violeta |
```

**CAMBIAR A:**
```
| **TRIAL** | $20.000 COP (pago único) | 1 | 15 | `#6366f1` violeta |
```

**NOTA:** La fuente de verdad para precios y generaciones es la tabla `pricing_config` en Supabase, no este documento. Si hay discrepancia, verificar primero Supabase.

### 4. AGREGAR nota sobre fuente de verdad

**AGREGAR al inicio de sección 2.1:**
```
> ⚠️ **NOTA:** Los valores de precios y generaciones son dinámicos vía `pricing_config` de Supabase.
> Este documento puede no reflejar cambios recientes. Consultar `pricing_config` como fuente de verdad.
```