---
name: testing
description: Skill para escribir, organizar y ejecutar tests en el proyecto Lookitry (backend Jest + TypeScript). Cubre tests unitarios, de integración y property-based. Incluye convenciones, patrones de mock, scripts helper y ejemplos listos para copiar.
---

# Skill: Testing — Lookitry / virtual-tryon

## Cuándo usar este skill

Activa este skill cuando el usuario pida:
- Crear o extender tests del backend (Jest + TypeScript)
- Ejecutar la suite de tests
- Identificar qué módulos no tienen cobertura
- Agregar mocks de Supabase, Wompi, n8n, MinIO o SMTP
- Depurar un test que falla

---

## Estructura de archivos de tests

```
backend/src/__tests__/
├── <módulo>.unit.test.ts          # Tests unitarios (sin I/O real)
├── <módulo>.integration.test.ts   # Tests de integración (mocks de BD)
├── <módulo>.property.test.ts      # Property-based con fast-check
└── properties/                    # Subgrupos de property tests
```

**Convención de nombres:**
- `*.unit.test.ts` → prueba una función/clase aislada con todos sus deps mockeados
- `*.integration.test.ts` → prueba el flujo completo de un controller/endpoint con BD mockeada
- `*.property.test.ts` → usa `fast-check` para verificar invariantes del modelo

---

## Stack de testing

| Herramienta | Rol |
|-------------|-----|
| `jest` | Runner principal |
| `ts-jest` | Transpila TypeScript en tiempo de test |
| `fast-check` | Generación de propiedades |
| `supertest` | (opcional) HTTP assertions |

Config en `backend/jest.config.js` y `backend/package.json`.

---

## Comandos principales

```bash
# Desde backend/
npm test                          # Toda la suite
npm test -- --watch               # Modo watch
npm test -- --coverage            # Con reporte de cobertura
npm test -- --runInBand           # Serial (evita conflictos de env)
npm test -- <archivo>             # Solo un archivo
npm test -- --testNamePattern "debe" # Solo tests que matcheen el nombre
```

Ver también `scripts/run-tests.ps1` para uso desde PowerShell en Windows.

---

## Patrón de mock obligatorio: Supabase

El backend usa **siempre `supabaseAdmin`** (service role). Al mockear, usar esta estructura:

```typescript
jest.mock('../config/supabase', () => ({
  supabase: {},
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));
```

> ⚠️ **Nunca** mockear `supabase` (anon key) pensando que el backend lo usa — salvo en `health.controller.ts`.

---

## Patrón de mock: Servicios internos

Los servicios se mockean con `jest.mock` antes de los imports. Usar **factory functions**:

```typescript
jest.mock('../services/subscription.service', () => ({
  SubscriptionService: jest.fn().mockImplementation(() => ({
    renewSubscription: jest.fn().mockResolvedValue({ id: 'brand-id' }),
    checkSubscriptionStatus: jest.fn().mockResolvedValue('active'),
  })),
}));
```

Para acceder a la instancia mockeada que crea el módulo bajo prueba:

```typescript
const MockedSS = SubscriptionService as jest.MockedClass<typeof SubscriptionService>;
const instance = MockedSS.mock.results[0]?.value; // instancia creada al importar
const renewMock = instance?.renewSubscription as jest.Mock;
```

---

## Patrón de mock: Request/Response de Express

```typescript
function buildReqRes(body: unknown, headers: Record<string, string> = {}) {
  const req = { body, headers, query: {}, params: {} } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}
```

---

## Patrón de property-based test con fast-check

```typescript
import * as fc from 'fast-check';

it('propiedad invariante', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom('BASIC', 'PRO'),
      fc.integer({ min: 0, max: 20 }),
      async (plan, count) => {
        // ... setup, acción, assertion
        expect(result).toBeLessThanOrEqual(PLANS[plan].maxProducts);
      }
    ),
    { numRuns: 50 }
  );
}, 30000); // timeout generoso para property tests
```

---

## Variables de entorno para tests

Los tests no deben depender de `.env`. Configurar en `beforeEach`:

```typescript
beforeEach(() => {
  process.env.WOMPI_EVENTS_SECRET = 'test-secret';
  process.env.WOMPI_INTEGRITY_SECRET = 'test-integrity';
  process.env.WOMPI_PUBLIC_KEY = 'pub_test_key';
  process.env.WOMPI_ENABLED = 'true';
  process.env.JWT_SECRET = 'test-jwt-secret';
});
```

---

## Qué testear por módulo

| Módulo | Prioridad | Tipo sugerido |
|--------|-----------|---------------|
| `wompi.service.ts` | 🔴 Alta | Unit + Integration |
| `subscription.service.ts` | 🔴 Alta | Unit |
| `auth.service.ts` | 🔴 Alta | Unit |
| `usage.service.ts` | 🟡 Media | Unit + Property |
| `products.service.ts` | 🟡 Media | Unit + Property |
| `wompi.controller.ts` | 🔴 Alta | Integration |
| `brands.controller.ts` | 🟡 Media | Integration |
| `pruebalo.controller.ts` | 🟡 Media | Integration |
| `email.service.ts` | 🟢 Baja | Unit (mock nodemailer) |

---

## Checklist al crear un nuevo test

- [ ] El archivo tiene el sufijo correcto (`.unit.`, `.integration.`, `.property.`)
- [ ] Todos los módulos externos están mockeados (`jest.mock` antes de imports)
- [ ] Variables de entorno se setean en `beforeEach`, no en el módulo
- [ ] Cada `describe` agrupa un escenario claro
- [ ] Existe un `afterEach` / `afterAll` que limpia si hay estado mutable
- [ ] El nombre del `it` empieza con un verbo: "debe", "rechaza", "lanza", "retorna"
- [ ] Property tests tienen timeout explícito (`}, 30000)`)

---

## Ejemplos listos — ver carpeta `examples/`

- `examples/unit.example.ts` — test unitario de un service
- `examples/integration.example.ts` — test de controller con mocks
- `examples/property.example.ts` — property test con fast-check

---

## Limitaciones conocidas

- Los tests del backend corren en Node.js (no en browser)
- El frontend (Next.js) no tiene tests configurados aún; si se añaden, usar `jest` con `jest-environment-jsdom`
- Los property tests con BD real (como `usage.property.test.ts`) requieren conexión a Supabase y son lentos — preferir mocks
