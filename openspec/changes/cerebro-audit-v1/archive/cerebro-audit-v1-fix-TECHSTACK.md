# Correcciones: TECH_STACK.md

## Cambios a aplicar:

### 1. CORREGIR versión sharp Backend (Sección 2.2)
Dice `sharp: 0.33.1` pero el código tiene `0.34.5`

**ACTUAL:**
```
| `sharp` | 0.33.1 | Procesamiento imágenes |
```

**CAMBIAR A:**
```
| `sharp` | 0.34.5 | Procesamiento imágenes |
```

### 2. ACTUALIZAR Estructura del Proyecto (Sección 8)
La carpeta `mission-control/` existe pero está vacía (código eliminado).

**ACTUAL:**
```
LOOKITRY/
├── frontend/                    # Next.js 14 (App Router)
├── backend/                     # Express API
├── scripts/                    # Deploy (_deploy_now.py)
├── lookitry-woocommerce/       # Plugin WordPress/WooCommerce
├── sam-service/               # Python/FastAPI MobileSAM
├── mission-control/            # Dashboard de agentes IA  ← ELIMINADO
├── mcp-gcp/                  # GCP MCP Server
└── Lookitry_Brain_Vault/     # Documentación del Cerebro
```

**CAMBIAR A:**
```
LOOKITRY/
├── frontend/                    # Next.js 14 (App Router)
├── backend/                     # Express API
├── scripts/                    # Deploy (_deploy_now.py)
├── lookitry-woocommerce/       # Plugin WordPress/WooCommerce
├── sam-service/               # Python/FastAPI MobileSAM
├── mcp-gcp/                  # GCP MCP Server
└── Lookitry_Brain_Vault/     # Documentación del Cerebro
```

### 3. ACTUALIZAR nota de pnpm (Sección 4.5)
El TECH_STACK.md dice que `mission-control/` es parte del proyecto pero ya no existe. Remover de cualquier referencia.