# Open Payments — Lookitry Subscription Billing

> Flujo de cobro automático de suscripciones (Basic / Pro / Enterprise) desde la wallet de la marca hacia la wallet de Lookitry, usando el protocolo Open Payments (GNAP + ILP).

---

## Arquitectura de actores

```mermaid
flowchart TD
    subgraph BRAND ["🏪 Marca / E-commerce"]
        B_USER["Usuario Final\n(comprador)"]
        B_ADMIN["Admin de Marca\n(aprueba grants)"]
    end

    subgraph LOOKITRY ["⚙️ Lookitry (SaaS)"]
        LK_API["Lookitry Backend\n(orchestrator)"]
        LK_DB["Token Store\n(Access Token + Wallet Address)"]
    end

    subgraph OPEN_PAYMENTS ["🔐 Open Payments Infrastructure"]
        AS["Authorization Server\n(AS de la marca)"]
        RS["Resource Server\n(Wallet de la marca)"]
        WM["Wallet Marca\n(ILP Address)"]
        WL["Wallet Lookitry\n(ILP Address)"]
    end

    B_ADMIN -- "aprueba grant\nconsentimiento explícito" --> AS
    AS -- "Access Token\n(scoped)" --> LK_API
    LK_API -- "almacena token" --> LK_DB
    LK_API -- "POST /quotes\nPOST /outgoing-payments\n[Bearer Token]" --> RS
    RS -- "debita plan_price" --> WM
    WM -- "ILP transfer" --> WL
    WL -- "incoming payment\nconfirmado" --> LK_API
    LK_API -- "activa / renueva\nsuscripción" --> B_USER
```

---

## Fase 1 — Onboarding & Grant

```mermaid
sequenceDiagram
    actor Brand as Marca (Admin)
    participant LK as Lookitry Backend
    participant AS as Authorization Server
    participant RS as Resource Server

    Brand->>LK: Selecciona plan (Basic / Pro / Enterprise)
    Note over LK: Construye Grant Request con límites del plan

    LK->>AS: POST /grants
    Note right of AS: access: [outgoing-payment]<br/>limits: {<br/>  debitAmount: plan_price (COP),<br/>  interval: P1M (mensual)<br/>}

    AS-->>LK: 200 { interact: { redirect: "https://as.marca.com/grant/xyz" }, continue: { uri, wait } }

    LK-->>Brand: Redirige a pantalla de consentimiento

    Brand->>AS: Revisa y aprueba el grant
    Note over Brand,AS: La marca ve:<br/>• Monto: $180.000 COP/mes<br/>• Duración: 30 días (renovable)<br/>• Beneficiario: Lookitry<br/>• Acción: Virtual Try-On SaaS

    AS-->>LK: Redirect con interact_ref

    LK->>AS: POST /grants/continue [Bearer: continuation_token]
    Note right of AS: { interact_ref }

    AS-->>LK: Access Token { value, expiresIn, manageUrl }
    Note over LK: Almacena token ligado al\nWallet Address de la marca
```

---

## Fase 2 — Cobro mensual automático

```mermaid
sequenceDiagram
    participant LK as Lookitry Backend
    participant RS as Resource Server (Wallet Marca)
    participant WM as Wallet Marca
    participant WL as Wallet Lookitry

    Note over LK: Evento: fecha de renovación\n(billing cycle trigger)

    LK->>RS: POST /quotes
    Note right of RS: {<br/>  walletAddress: "https://marca.wallet/alice",<br/>  receiver: "https://lookitry.wallet/lk-recv",<br/>  debitAmount: { value: "18000000", assetCode: "COP", assetScale: 2 }<br/>}

    RS-->>LK: Quote { id, debitAmount, receiveAmount, expiresAt }
    Note over LK: Valida monto y expiración

    LK->>RS: POST /outgoing-payments [Bearer: Access Token]
    Note right of RS: {<br/>  walletAddress: "https://marca.wallet/alice",<br/>  quoteId: "quote_abc123",<br/>  metadata: { planId: "basic", period: "2026-06" }<br/>}

    RS->>WM: Debita $180.000 COP
    WM->>WL: Transferencia ILP (interoperable entre proveedores)
    WL-->>LK: Webhook: Incoming Payment { state: "COMPLETED", receivedAmount }

    LK->>LK: Registra pago + activa suscripción período siguiente
    LK-->>Brand: Notificación: "Suscripción renovada — Plan Basic activo"
```

---

## Fase 3 — Renovación o cambio de plan

```mermaid
sequenceDiagram
    participant LK as Lookitry Backend
    participant AS as Authorization Server
    actor Brand as Marca (Admin)

    Note over LK: Token próximo a expirar\n(día 28 del ciclo)

    alt Token rotable (non-interactive refresh)
        LK->>AS: POST /grants/continue [Bearer: rotation_token]
        AS-->>LK: Nuevo Access Token (mismos límites)
        Note over LK: Renovación transparente\nsin intervención de la marca
    else Cambio de plan o límites modificados
        LK->>AS: POST /grants (nuevo grant request)
        AS-->>Brand: Nueva pantalla de consentimiento
        Brand->>AS: Aprueba nuevos términos\n(ej: upgrade a Pro $350.000/mes)
        AS-->>LK: Access Token actualizado
        LK->>LK: Actualiza plan en DB
    end
```

---

## Resumen del flujo completo

```mermaid
flowchart LR
    A([Marca elige plan]) --> B[Lookitry solicita Grant]
    B --> C{AS presenta\nconsentimiento}
    C -- "Marca aprueba" --> D[AS emite Access Token]
    D --> E[Lookitry almacena token\npor Wallet Address]

    E --> F([Billing date])
    F --> G[Lookitry crea Quote]
    G --> H[Lookitry crea\nOutgoing Payment]
    H --> I[Wallet Marca → Wallet Lookitry\nvía ILP]
    I --> J[Lookitry confirma\nIncoming Payment]
    J --> K([Suscripción activa])

    K --> L{¿Token expira?}
    L -- "No" --> F
    L -- "Sí / cambio de plan" --> B
```

---

## Referencia de objetos Open Payments

| Objeto | Quién lo crea | Para qué |
|--------|--------------|----------|
| **Grant** | Lookitry → AS de la marca | Solicitar permiso para cobrar |
| **Access Token** | Authorization Server | Autorizar a Lookitry a actuar en nombre de la marca |
| **Wallet Address** | Cada proveedor de wallet | Identificador ILP de cada cuenta |
| **Quote** | Lookitry → Resource Server | Calcular monto exacto + tipo de cambio |
| **Outgoing Payment** | Lookitry → Resource Server | Ejecutar el débito desde la wallet de la marca |
| **Incoming Payment** | Wallet de Lookitry | Confirmar que los fondos llegaron |

---

## Planes y montos

| Plan | Monto mensual | Asset | Intervalo |
|------|--------------|-------|-----------|
| Basic | $180.000 COP | COP, scale 2 | P1M |
| Pro | $350.000 COP | COP, scale 2 | P1M |
| Enterprise | $800.000+ COP | COP / USD | P1M (negociable) |

Para pagos internacionales (USD), el Resource Server resuelve la conversión vía ILP antes de crear el Outgoing Payment. Lookitry recibe en COP o USD según su Wallet Address.

---

## Beneficios clave vs. modelo actual

| Capacidad | Modelo actual (Wompi/PayPal) | Open Payments |
|-----------|------------------------------|---------------|
| Cobro automático | Manual / link de pago | Automático vía Access Token |
| Consentimiento explícito | Fuera de banda | Nativo en el protocolo (GNAP) |
| Interoperabilidad de wallets | No (solo Wompi o PayPal) | Sí — cualquier wallet ILP |
| Pagos transfronterizos | PayPal únicamente | Nativo — ILP resuelve FX |
| Límites de gasto auditables | No | Sí — encoded en el Grant |
| Sin datos de tarjeta | No | Sí — cero PCI scope |
| Revocación inmediata | No | Sí — el AS puede revocar el token |
