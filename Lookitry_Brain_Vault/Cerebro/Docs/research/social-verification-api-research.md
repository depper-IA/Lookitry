# Investigación: Sistema de Verificación Instagram + TikTok

**Fecha:** 2026-04-06  
**Proyecto:** Lookitry Lead Enrichment  
**Analista:** GrowthPilot Agent

---

## 1. RESUMEN EJECUTIVO

### Situación Actual
El usuario requiere verificar la presencia de empresas en Instagram y TikTok como parte del sistema de enrichment y prospecting.

### Conclusión Principal
**NO existen APIs gratuitas que permitan buscar cuentas públicas o verificar existencia de perfiles de terceros en Instagram o TikTok sin autorización explícita del dueño de la cuenta.**

---

## 2. ANÁLISIS DE APIs DISPONIBLES

### 2.1 INSTAGRAM

#### Instagram Basic Display API (Gratis)
| Aspecto | Detalle |
|---------|---------|
| **Costo** | Gratis |
| **Alcance** | Solo tu propia cuenta |
| **Permisos** | `instagram_basic` |
| **Limitaciones** | NO permite buscar cuentas de terceros |
| **Uso típico** | Mostrar tu propio feed en un website |

#### Instagram Graph API (Negocios)
| Aspecto | Detalle |
|---------|---------|
| **Costo** | Gratis (pero requiere Facebook Business App) |
| **Permisos necesarios** | `instagram_business_basic`, `pages_read_engagement` |
| **Requisito** | Cuenta Business/Creator de Instagram |
| **Alcance** | Solo datos de cuentas que autorizan explícitamente |
| **business_discovery** | Solo funciona con cuentas que autorizaron previamente |

**Veredicto:** No sirve para prospecting de cuentas públicas sin auth.

#### Rate Limits Instagram Graph API
- **500 requests/hour** por app
- **200 requests/hour** por user token
- Límites más estrictos para business_discovery

---

### 2.2 TIKTOK

#### TikTok Display API (Sandbox)
| Aspecto | Detalle |
|---------|---------|
| **Costo** | Gratis en modo sandbox |
| **Alcance** | Solo datos del usuario que autoriza |
| **Scopes** | `user.info.basic`, `video.list` |
| **Limitación** | Sandbox solo permite 100 requests/hora |

#### TikTok Research API (Académicos)
- Solo para investigadores verificados
- Requiere aplicación y aprobación
- NO disponible para uso comercial

#### TikTok Server API (Login Kit)
- Requiere OAuth completo
- Solo datos del usuario que hace login

**Veredicto:** No sirve para prospecting público.

---

### 2.3 COMPARATIVA DE ALTERNATIVAS

| Método | Costo | Legalidad | Fiabilidad | Recomendación |
|--------|-------|-----------|------------|----------------|
| APIs oficiales (Meta/TikTok) | Gratis | ✅ 100% | Alta | NO aplica para prospecting público |
| Web Scraping público | Gratis | ⚠️ ToS ambiguo | Media | Usar con precaución y rate limiting |
| Apollo.io / Clearbit | $50-500/mes | ✅ | Alta | **Recomendado para Fase 2** |
| Hunter.io | $49-500/mes | ✅ | Alta | Alternativa para email verification |
| Apollo for Social | $99/mes | ✅ | Alta | Alternative específica social |

---

## 3. ARQUITECTURA PROPUESTA

### 3.1 ENFOQUE HÍBRIDO (Fase 1 - Inmediato)

Dado que las APIs directas no funcionan para prospecting público, implementamos:

```
Lead del Excel
    │
    ├──► Website → CheerioCrawler → Clasificar contenido ✅ (EXISTE)
    │
    ├──► Instagram Handle → Extraer de website → Verificar existe
    │       ├── Si encuentra @ handle → Verificar formato
    │       └── No se puede verificar contenido sin API
    │
    ├──► TikTok Handle → Extraer de website → Verificar formato
    │       └── Mismo límite que Instagram
    │
    ├──► Social Links → Verificar que son cuentas reales (HTTP check)
    │
    ▼
Clasificación Final: FASHION / NOT_FASHION + SOCIAL_PRESENCE_SCORE
```

### 3.2 VERIFICACIÓN DE WEBSITE (EXISTE)

El servicio actual `lead-enrichment.service.ts` ya tiene:
- Clasificación por keywords
- Chequeo de sitio web

### 3.3 NUEVA FUNCIONALIDAD: Social Handle Extraction

```typescript
interface SocialVerification {
  website: { verified: boolean; isFashion: boolean; content?: string };
  instagram: { 
    handleFound: string | null;      // @handle extraído del website
    urlVerified: boolean;            // El link funciona (HTTP check)
    formatValid: boolean;            // Formato correcto de handle
    isFashionScore: number;          // Basado en bio description si disponible
  };
  tiktok: { 
    handleFound: string | null;
    urlVerified: boolean;
    formatValid: boolean;
    isFashionScore: number;
  };
  social_verification_status: 'verified' | 'partial' | 'unverified';
  overall_fashion_score: number;     // 0-100
}
```

---

## 4. IMPLEMENTACIÓN PROPUESTA

### 4.1 ARCHIVOS A MODIFICAR

1. **`backend/src/services/lead-enrichment.service.ts`**
   - Agregar método `verifySocialHandles()`
   - Agregar `SocialVerification` interface
   - Actualizar `ClassificationResult` con social data

2. **`backend/src/services/lead-generation.service.ts`**
   - Crear método `searchWithSocialVerification()`
   - Para cada resultado de Google Places, verificar social handles

3. **`backend/src/types/social-verification.ts`** (NUEVO)
   - Definir interfaces de verificación social

### 4.2 MÉTODOS A AGREGAR

#### lead-enrichment.service.ts

```typescript
// Nuevo método
async verifySocialHandles(leadId: string): Promise<SocialVerification> {
  // 1. Fetch website content
  // 2. Extract @mentions y links de Instagram/TikTok
  // 3. Verify URLs con HEAD requests
  // 4. Clasificar basado en contexto del website
}
```

#### lead-generation.service.ts

```typescript
// Nuevo método
async searchPlacesWithSocialVerification(query: string): Promise<Lead[]> {
  // 1. Buscar en Google Places (existe)
  // 2. Para cada resultado, extraer handles de website
  // 3. Verificar presencia social
  // 4. Solo crear lead si tiene presencia social verificable
}
```

---

## 5. CAMPOS A AGREGAR EN LA BASE DE DATOS

### Nueva tabla: `lead_social_verification`

```sql
CREATE TABLE lead_social_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  
  -- Website
  website_checked_at TIMESTAMP,
  website_fashion_score INT,
  website_content_preview TEXT,
  
  -- Instagram
  instagram_handle TEXT,
  instagram_url_verified BOOLEAN DEFAULT false,
  instagram_format_valid BOOLEAN DEFAULT false,
  instagram_bio_preview TEXT,
  
  -- TikTok
  tiktok_handle TEXT,
  tiktok_url_verified BOOLEAN DEFAULT false,
  tiktok_format_valid BOOLEAN DEFAULT false,
  
  -- Scores
  social_verification_status TEXT DEFAULT 'unverified', -- unverified|partial|verified
  overall_fashion_score INT DEFAULT 0,
  verified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### ALTER a tabla `leads`

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tiktok_handle TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_verification_status TEXT DEFAULT 'unverified';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_verification_score INT DEFAULT 0;
```

---

## 6. PLAN DE IMPLEMENTACIÓN

### Fase 1 (Inmediato - 1 semana)
- [ ] Crear interfaz `SocialVerification`
- [ ] Implementar `extractSocialHandlesFromWebsite()` 
- [ ] Implementar `verifySocialUrl()` (HTTP HEAD check)
- [ ] Actualizar `lead-enrichment.service.ts` con nuevos métodos
- [ ] Actualizar `lead.service.ts` con nuevos campos
- [ ] Migration de base de datos

### Fase 2 (2-3 semanas) - REQUIERE APIS DE TERCEROS
- [ ] Investigar integración con Apollo.io o Clearbit
- [ ] Implementar enriquecimiento con datos de redes sociales reales
- [ ] Solo posible si hay budget para subscription

### Fase 3 (Futuro) - SCORING AVANZADO
- [ ] ML para clasificar cuentas de Instagram/TikTok por bio/username
- [ ] Integración con herramientas de social listening

---

## 7. ALTERNATIVAS DE PROSPECTING SOCIAL

### Opción A: Apollo.io (RECOMENDADA)
- $99/mes por 500 credits
- Incluye datos de redes sociales
- API de enrichment completa
- **Prospector de moda ya incluido**

### Opción B: Custom Scraping (RISKY)
- Scraper simple de perfiles públicos
- Violación de ToS pero usado por muchos
- Rate limiting estricto requerido
- Mantenimiento alto

### Opción C: Solo verificación de website (ACTUAL)
- Extraer handles del sitio web
- Verificar que los links funcionan
- No verificar contenido real de redes

---

## 8. RECOMENDACIONES FINALES

1. **NO intentar usar APIs oficiales** de Instagram/TikTok para prospecting - no están diseñadas para eso

2. **Implementar extracción de handles desde website** - solución más práctica y legal

3. **Para enrichment real de redes sociales**, considerar Apollo.io en Fase 2 con budget dedicado

4. **El scoring debe basarse en**:
   - Website (contenido fashion) = 40%
   - Social handles encontrados = 30%
   - Keywords en nombre de empresa = 30%

5. **No esperar datos reales de seguidores/seguidos** sin APIs de terceros

---

## 9. LIMITACIONES CONOCIDAS

| Limitación | Impacto | Solución |
|------------|---------|----------|
| No se pueden ver cuentas de terceros | No se puede verificar engagement | Apollo.io (Fase 2) |
| Instagram/TikTok no dan datos públicos | Solo extracción de handles | Web scraping si es necesario |
| Rate limits estrictos | Pocos requests por hora | Batch processing + caching |
| ToS de plataformas | Riesgo legal | Limitar a métodos autorizados |

---

## 10. PRÓXIMOS PASOS

1. [ ] Implementar Fase 1 completa
2. [ ] Probar con 100 leads del Excel
3. [ ] Medir falsos positivos/negativos
4. [ ] Evaluar necesidad de Apollo.io para Fase 2