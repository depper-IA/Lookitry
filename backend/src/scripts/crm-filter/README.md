# CRM Lead Filter System - Documentation

## Overview

This system imports, classifies, and enriches leads from your CRM Excel file (`BASE_CLIENTES_CRM.xlsx`) for use with Lookitry's marketing campaigns.

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRM FILTER SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BASE_CLIENTES_CRM.xlsx                                          │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ import-crm-    │───▶│ LeadEnrichment  │                     │
│  │ leads.ts       │    │ Service         │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                               │
│                    ┌─────────────┼─────────────┐                │
│                    │             │             │                │
│                    ▼             ▼             ▼                │
│           ┌──────────┐  ┌──────────────┐  ┌──────────┐         │
│           │Supabase  │  │ CSV Files    │  │  n8n     │         │
│           │leads     │  │ (filtered)   │  │ Workflow │         │
│           └──────────┘  └──────────────┘  └──────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Files Created

| File | Purpose |
|------|---------|
| `backend/src/scripts/crm-filter/import-crm-leads.ts` | CLI script for initial classification |
| `backend/src/scripts/crm-filter/web-verification-agent.ts` | Website verification agent |
| `backend/src/services/lead-enrichment.service.ts` | Service for Supabase integration |
| `supabase/migrations/20260406_lead_enrichment.sql` | Database migration |
| `n8n/workflows/crm-enrichment-workflow.json` | n8n workflow for batch enrichment |

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install xlsx
npm install --save-dev @types/xlsx
npm install crawlee
```

### 2. Apply Database Migration

Run in Supabase SQL Editor or via CLI:

```sql
-- Apply migration/supabase/migrations/20260406_lead_enrichment.sql
```

### 3. Run Initial Classification

```bash
cd backend

# View statistics only (no files written)
npx ts-node src/scripts/crm-filter/import-crm-leads.ts --stats-only

# Dry run (shows what would be imported)
npx ts-node src/scripts/crm-filter/import-crm-leads.ts --dry-run

# Full import
npx ts-node src/scripts/crm-filter/import-crm-leads.ts
```

### 4. Import Leads to Supabase

```typescript
import { leadEnrichmentService } from '../services/lead-enrichment.service';

const result = await leadEnrichmentService.importFromCRMExcel(
  'C:/Users/Matt/Lookitry/BASE_CLIENTES_CRM.xlsx'
);

console.log(result);
// { success: true, totalProcessed: 4153, imported: 892, duplicates: 45, errors: 0 }
```

### 5. Setup n8n Workflow

1. Login to n8n at https://n8n.wilkiedevs.com
2. Import workflow from `n8n/workflows/crm-enrichment-workflow.json`
3. Configure Supabase credentials
4. Activate workflow

## Usage Examples

### CLI - Import and Classify

```bash
# Statistics only
npx ts-node src/scripts/crm-filter/import-crm-leads.ts --stats-only

# Full import with CSV output
npx ts-node src/scripts/crm-filter/import-crm-leads.ts

# Dry run
npx ts-node src/scripts/crm-filter/import-crm-leads.ts --dry-run
```

### CLI - Web Verification

```bash
# Verify single URL
npx ts-node src/scripts/crm-filter/web-verification-agent.ts https://example.com

# Quick health check
npx ts-node src/scripts/crm-filter/web-verification-agent.ts --check https://example.com

# Batch verification (pipe URLs)
cat urls.txt | npx ts-node src/scripts/crm-filter/web-verification-agent.ts --batch
```

### Programmatic Usage

```typescript
import { leadEnrichmentService } from '../services/lead-enrichment.service';

// Import from Excel
const importResult = await leadEnrichmentService.importFromCRMExcel(
  './BASE_CLIENTES_CRM.xlsx'
);

// Classify pending leads
const enrichmentResult = await leadEnrichmentService.enrichPendingLeads(100);

// Get enrichment statistics
const stats = await leadEnrichmentService.getEnrichmentStats();
console.log(stats);
// { total: 4153, fashion_relevant: 892, pending_verification: 156, ... }

// Delete non-fashion leads
const deleted = await leadEnrichmentService.deleteNonFashionLeads();
```

## Classification Logic

### Fashion Keywords (Accept)

- Spanish: `ropa`, `boutique`, `moda`, `fashion`, `zapato`, `calzado`, `accesorios`, `joyeria`, `perfume`, `cosmetico`, `beauty`, etc.
- English: `clothing`, `apparel`, `shoes`, `accessories`, `jewelry`, `designer`, `brand`, `boutique`, etc.

### No-Fashion Keywords (Reject)

- Spanish: `supermercado`, `bar`, `restaurant`, `dentista`, `gimnasio`, `farmacia`, `banco`, etc.
- English: `supermarket`, `restaurant`, `pharmacy`, `bank`, `gym`, `hotel`, etc.

### Country Detection

Automatically detects country from city name:
- Colombia: Bogota, Medellin, Cali, Barranquilla, etc.
- USA: New York, Los Angeles, Miami, Chicago, etc.
- Spain: Madrid, Barcelona, Valencia, Sevilla, etc.

## Database Schema Changes

The migration adds these columns to `leads`:

| Column | Type | Description |
|--------|------|-------------|
| `is_fashion_relevant` | BOOLEAN | NULL=unclassified, TRUE=fashion, FALSE=not |
| `enrichment_source` | VARCHAR(50) | How enriched: keyword_classification, web_verification, ai_classification, manual |
| `website_verified` | BOOLEAN | Website was scraped |
| `business_type_confirmed` | VARCHAR(255) | Confirmed business type |
| `last_enriched_at` | TIMESTAMPTZ | Last enrichment timestamp |
| `website_content` | TEXT | Keywords found during scraping |
| `enrichment_score` | INTEGER | Score 0-100 |

## Workflow n8n

The n8n workflow (`crm-enrichment-workflow.json`):

1. **Trigger**: Runs every 5 minutes
2. **Get Pending Leads**: Fetches leads where `is_fashion_relevant IS NULL` and has website
3. **Classify**: Applies keyword classification
4. **Update**: Updates leads in Supabase
5. **Notify**: Sends Slack notification with summary

## Troubleshooting

### Excel file not found

```bash
# Make sure you're running from the Lookitry root directory
cd C:\Users\Matt\Lookitry
npx ts-node backend/src/scripts/crm-filter/import-crm-leads.ts
```

### Memory issues with large Excel

The script processes in batches of 50. For very large files, modify `batchSize` in `import-crm-leads.ts`.

### Supabase connection errors

Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables are set correctly.

## Cost

- **Apify MCP**: $0 (using free tier or Crawlee local)
- **n8n**: $0 (already hosted on your VPS)
- **OpenRouter AI**: $0 (free tier available)
- **Total**: $0

## Support

For issues, check:
1. Supabase logs: `supabase_get_logs`
2. n8n workflow executions
3. Backend logs for import errors
