# Lookitry - Financial Model

**Plantilla de proyecciones financieras para pitch a inversores**

---

## Supuestos Base (Mayo 2026 - Con datos de DB)

| Variable | Valor | Fuente |
|----------|-------|--------|
| MRR actual | **$0** | Sin suscripciones recurrentes aún (solo trials) |
| ARPU BASIC | **$180.000 COP** | Plan BASIC |
| ARPU PRO | **$350.000 COP** | Plan PRO |
| ARPU ENTERPRISE | **$800.000 COP** | Plan ENTERPRISE |
| Revenue total histórico | **~$2.3M COP** | 9 brands, payments en DB |
| Brands registrados | **9** (6 TRIAL, 1 BASIC, 2 PRO) | DB Supabase |
| Generaciones totales | **86** (72% éxito) | DB Supabase |
| LTV BASIC | **$3.6M COP** | $180K / 5% churn |
| LTV PRO | **$7M COP** | $350K / 5% churn |
| Churn target | **<5%/mes** | KPI a mantener |

---

## Modelo de Ingresos (Proyección 24 meses)

### Escenario Conservador

| Mes | Retailers | MRR (COP) | Mix planes | Notes |
|-----|-----------|-----------|------------|-------|
| 1 | 5 | $900K | 3 BASIC, 2 PRO | Lanzamiento beta |
| 3 | 20 | $3.6M | 12 BASIC, 8 PRO | Early adopters |
| 6 | 50 | $9M | 30 BASIC, 15 PRO, 5 ENT | Producto-market fit |
| 9 | 100 | $18M | 50 BASIC, 35 PRO, 10 ENT, 5 add-ons | GTM ejecutando |
| 12 | 200 | $36M | 80 BASIC, 70 PRO, 15 ENT, 35 add-ons | Expansión a México |
| 18 | 400 | $72M | 150 BASIC, 150 PRO, 30 ENT, 70 add-ons | Consolidación |
| 24 | 800 | $144M | 300 BASIC, 300 PRO, 50 ENT, 150 add-ons | Escala regional |

**MRR Target 24 meses:** $144M COP (~USD 36K)

### Escenario Optimista

| Mes | Retailers | MRR (COP) | Mix planes | Notes |
|-----|-----------|-----------|------------|-------|
| 1 | 10 | $1.8M | 6 BASIC, 4 PRO | Lanzamiento con demanda |
| 3 | 50 | $9M | 30 BASIC, 20 PRO | Viral/word-of-mouth |
| 6 | 150 | $27M | 70 BASIC, 50 PRO, 30 ENT | Partnerships activos |
| 12 | 500 | $90M | 150 BASIC, 200 PRO, 50 ENT, 100 add-ons | Expansión + Enterprise |
| 24 | 1500 | $270M | 500 BASIC, 600 PRO, 100 ENT, 300 add-ons | Líder regional |

**MRR Target 24 meses:** $270M COP (~USD 67K)

---

## Estructura de Costos

### Costos Fijos Mensuales

| Item | Costo (COP) | Notas |
|------|-------------|-------|
| VPS (servidor) | $37.000 | Servidor principal |
| Dominio + SSL | $5.000 | Annual prorrateado |
| Supabase | $30.000 | Plan pro estimado |
| Herramientas (Slack, etc.) | $13.000 | Misc |
| **Total fijo** | **~$85.000/mes** | Sin contar IA | |

### Costos Variables

| Item | Costo por unidad | Notas |
|------|------------------|-------|
| Generación de IA | **$25 COP** (~USD 0.02) | Por try-on |
| Storage (MinIO) | ~$0.023 USD/GB | Selfies, productos, resultados |
| Soporte | variable | Crece con clientes |

**Margen por cliente (ejemplo BASIC):**
```
Ingreso: $180.000
- Costo IA (400 gen × $25): $10.000
- Costo fijo prorrateado: ~$567 (85K / 150 clientes)
= Margen bruto: $169.433 (94% gross margin)
```

### Costos de Adquisición (CAC)

| Canal | CAC | Conversión |
|-------|-----|------------|
| Inbound (SEO/Blog) | $XXX.XXX | Bajo, largo plazo |
| Outbound (ventas manual) | $XXX.XXX | Alto, costoso |
| Partnerships | $XXX.XXX | Medio, escalable |
| Paid ads | $XXX.XXX | Testear |

---

## Unit Economics

### Métricas Clave

```
LTV : CAC Ratio = 3:1 (target)
Ejemplo: Si CAC = $500.000 y LTV = $1.500.000 → Ratio 3:1

Payback period = 3-6 meses (target)
MRR > CAC en mes 6

Churn aceptable = <5%/mes
LTV = ARPU / Churn rate
Ejemplo: $200.000 / 0.05 = $4.000.000 LTV
```

### Proyección de LTV

| Plan | ARPU | Churn 5% | LTV | Margen/liente |
|------|------|-----------|-----|---------------|
| BASIC | $180.000 | 5% | **$3.6M** | ~$169K |
| PRO | $350.000 | 5% | **$7M** | ~$330K |
| ENTERPRISE | $800.000 | 3% | **$26.6M** | ~$756K |

---

## Burn Rate y Runway

### Inversión Solicitada: USD $100K

| Uso | % | USD | COP equivalente |
|-----|---|-----|------------------|
| Equipo (ventas + marketing) | 40% | $40.000 | ~$160M COP |
| Campañas de adquisición | 30% | $30.000 | ~$120M COP |
| Optimización IA | 20% | $20.000 | ~$80M COP |
| Operaciones + contingencias | 10% | $10.000 | ~$40M COP |
| **Total** | **100%** | **$100.000** | **~$400M COP** |

### Runway Proyectado

| Mes | Burn rate (COP) | Runway remaining |
|-----|-----------------|------------------|
| 0 | - | $400M |
| 3 | $50M/mes | $250M |
| 6 | $60M/mes | $130M |
| 9 | $70M/mes | $60M (punto de decisión) |
| 12 | $80M/mes | [Necesita próxima ronda o revenue] |

**Runway: 12-15 meses**

---

## Proyección de Revenue

### Escenario Base (12 meses)

```
Mes 1-3: MRR $2M (10 retailers básicos)
Mes 4-6: MRR $8M (30 retailers)
Mes 7-9: MRR $20M (70 retailers)
Mes 10-12: MRR $50M (150 retailers)

ARR al mes 12: $600M COP = ~$150K USD
```

### Revenue Mix Target (mes 12)

| Plan | Retailers | ARPU | MRR |
|------|-----------|------|-----|
| BASIC | 80 | $180.000 | $14.4M |
| PRO | 50 | $350.000 | $17.5M |
| ENTERPRISE | 15 | $800.000 | $12M |
| Add-ons (Mini-landing) | 55 | ~$54K avg | $3M |
| **Total** | **200** | | **$47M** |

---

## Métricas para Seguir (KPIs)

| Métrica | Mes 1 | Mes 6 | Mes 12 | Target |
|---------|-------|-------|--------|--------|
| MRR | $X.XM | $X.XM | $50M | ✓ |
| Retailers activos | X | X | 150 | ✓ |
| Trial → Paid | 20% | 25% | 30% | ✓ |
| Churn mensual | <8% | <6% | <5% | ✓ |
| NPS | >40 | >50 | >60 | ✓ |
| LTV:CAC | >2:1 | >2.5:1 | >3:1 | ✓ |
| Burn multiple | - | <2 | <1.5 | ✓ |

---

## Exit Scenarios (Seed Scenario)

| Escenario | Timing | Valuation | Multiple |
|-----------|--------|-----------|---------|
| Series A | Mes 18-24 | $2-5M | 10-20x seed |
| Acquisition (strategic) | Mes 24+ | $5-15M | 25-75x seed |
| Organic growth | 5+ años | $50M+ | Lifestyle |

---

## Disclaimer

Este modelo es una **proyección** basada en supuestos que deben validarse con datos reales.

Supuestos clave a validar:
- Conversion trial → paid real
- CAC real por canal
- Churn real post-launch
- ARPU real por segmento

**Recomendación:** Actualizar mensualmente con datos reales del negocio.

---

**Tags:** #FinancialModel #UnitEconomics #MRR #LTV #CAC #SaaS