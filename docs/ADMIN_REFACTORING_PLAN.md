# Plan de Refactorización - Admin Controller & Service

## Estado Actual

| Archivo | Líneas | Funciones/ Métodos |
|---------|--------|-------------------|
| `admin.controller.ts` | ~1996 | 54 funciones export |
| `admin.service.ts` | ~1740 | 31 métodos en clase |

## Propuesta de Estructura por Dominio

### 🗂️ Estructura Propuesta

```
src/controllers/admin/
├── auth.admin.controller.ts      # Login, logout, forgot-password, reset-password
├── brands.admin.controller.ts    # CRUD marcas, productos, planes
├── subscriptions.admin.controller.ts  # Suscripciones, pagos, activación
├── revenue.admin.controller.ts  # Estadísticas de ingresos
├── admins.admin.controller.ts    # Gestión de admins
├── promotions.admin.controller.ts # Promociones, pricing
├── woo.admin.controller.ts       # WooCommerce
├── feedback.admin.controller.ts # Feedback IA
├── system.admin.controller.ts   # Stats, créditos IA
└── index.ts                     # Re-exports

src/services/admin/
├── auth.admin.service.ts        # Lógica auth
├── brands.admin.service.ts      # Lógica marcas
├── subscriptions.admin.service.ts # Lógica suscripciones
├── revenue.admin.service.ts     # Lógica revenue
├── admins.admin.service.ts      # Lógica gestión admins
├── promotions.admin.service.ts  # Lógica promociones
└── index.ts                     # Re-exports
```

---

## Dominio 1: AUTH (Autenticación Admin)

### Controller (`auth.admin.controller.ts`)
- `adminLogin` (línea 43)
- `adminForgotPassword` (línea 136)
- `adminResetPassword` (línea 195)
- `adminLogout` (línea 239)

### Service (`auth.admin.service.ts`)
- `getAdminByEmail` (línea 51)
- `getAdminById` (línea 68)
- `verifyPassword` (línea 85)
- `isValidBcryptHash` (línea 89 - private)
- `validatePasswordComplexity` (línea 94 - private)
- `requestPasswordResetGetToken` (línea 279)
- `resetPasswordWithToken` (línea 312)

---

## Dominio 2: BRANDS (Gestión de Marcas)

### Controller (`brands.admin.controller.ts`)
- `getAllBrands` (línea 279)
- `changeBrandPlan` (línea 301)
- `getBrandProducts` (línea 377)
- `createBrand` (línea 408)
- `deleteBrand` (línea 473)
- `deleteInactiveProduct` (línea 508)
- `activateBrandPlan` (línea 543)
- `toggleLandingPage` (línea 606)
- `updateModalConfig` (línea 655)
- `getMiniLandingsAdmin` (línea 692)
- `suspendMiniLanding` (línea 731)
- `restoreMiniLanding` (línea 761)
- `sendBrandResetEmail` (línea 1221)
- `getBrandFull` (línea 1697)

### Service (`brands.admin.service.ts`)
- `getAllBrandsWithStats` (línea 367)
- `changeBrandPlan` (línea 503)
- `getBrandProducts` (línea 693)
- `deleteBrand` (línea 717)
- `deleteInactiveProduct` (línea 753)
- `activateBrandPlan` (línea 787)
- `createBrand` (línea 840)
- `getTrialBrands` (línea 908)
- `getBrandFull` (línea 1623)

---

## Dominio 3: SUBSCRIPTIONS (Suscripciones y Pagos)

### Controller (`subscriptions.admin.controller.ts`)
- `getAllSubscriptions` (línea 1716)
- `registerSubscriptionPayment` (línea 1777)
- `suspendSubscription` (línea 1848)
- `reactivateSubscription` (línea 1869)
- `getPayments` (línea 1286)

### Service (`subscriptions.admin.service.ts`)
- `getPayments` (línea 1084)

---

## Dominio 4: REVENUE (Estadísticas de Ingresos)

### Controller (`revenue.admin.controller.ts`)
- `getGlobalStats` (línea 358)
- `getConversionStats` (línea 792)
- `getRevenueStats` (línea 1917)
- `getMissionControl` (línea 1649)
- `getRiskData` (línea 1659)
- `getEconomics` (línea 1669)

### Service (`revenue.admin.service.ts`)
- `getGlobalStats` (línea 557)
- `getConversionStats` (línea 935)
- `getMissionControl` (línea 1221)
- `getRiskData` (línea 1323)
- `getEconomics` (línea 1464)

---

## Dominio 5: ADMINS (Gestión de Administradores)

### Controller (`admins.admin.controller.ts`)
- `listAdmins` (línea 806)
- `createAdmin` (línea 815)
- `updateAdminPermissions` (línea 863)
- `deleteAdmin` (línea 877)
- `sendAdminCredentials` (línea 887)
- `changeOwnPassword` (línea 915)
- `changeAdminPassword` (línea 966)
- `getAuditLog` (línea 1679)

### Service (`admins.admin.service.ts`)
- `listAdmins` (línea 125)
- `createAdmin` (línea 138)
- `updateAdminPermissions` (línea 173)
- `changeAdminPassword` (línea 182)
- `resetAdminPassword` (línea 211)
- `changeOwnPassword` (línea 242)
- `deleteAdmin` (línea 352)
- `getAuditLog` (línea 1576)
- `getAdminMeta` (línea 1207)

---

## Dominio 6: PROMOTIONS (Promociones y Pricing)

### Controller (`promotions.admin.controller.ts`)
- `getAllPromotions` (línea 1464)
- `createPromotion` (línea 1483)
- `updatePromotion` (línea 1523)
- `deletePromotion` (línea 1564)
- `getPricingConfig` (línea 1595)
- `updatePricingConfig` (línea 1614)

### Service - No hay métodos específicos de promotions (usa servicios existentes)

---

## Dominio 7: WOOCOMMERCE (Integración)

### Controller (`woo.admin.controller.ts`)
- `getWooBrandsSummary` (línea 1315)
- `getWooBrandProducts` (línea 1388)
- `setWooProductActive` (línea 1421)

### Service - No hay métodos específicos

---

## Dominio 8: FEEDBACK (Feedback IA)

### Controller (`feedback.admin.controller.ts`)
- `getFeedbacks` (línea 1148)
- `getFeedbackStats` (línea 1167)
- `resolveFeedback` (línea 1180)
- `deleteFeedback` (línea 1194)
- `getUnresolvedFeedbackCount` (línea 1208)

### Service - No hay métodos específicos

---

## Dominio 9: SYSTEM (Estadísticas del Sistema)

### Controller (`system.admin.controller.ts`)
- `getSystemStats` (línea 26)
- `getOpenRouterCredits` (línea 991)
- `getReplicateCredits` (línea 1042)

### Service - No hay métodos específicos

---

## Plan de Implementación (Fases)

### Fase 1: Crear estructura de carpetas
```bash
mkdir -p src/controllers/admin src/services/admin
```

### Fase 2: Crear archivos por dominio (uno por sesión)
1. `auth.admin.controller.ts` + `auth.admin.service.ts`
2. `brands.admin.controller.ts` + `brands.admin.service.ts`
3. `subscriptions.admin.controller.ts` + `subscriptions.admin.service.ts`
4. `revenue.admin.controller.ts` + `revenue.admin.service.ts`
5. `admins.admin.controller.ts` + `admins.admin.service.ts`
6. `promotions.admin.controller.ts`
7. `woo.admin.controller.ts`
8. `feedback.admin.controller.ts`
9. `system.admin.controller.ts`

### Fase 3: Actualizar imports
- Actualizar `admin.routes.ts` para importar de nuevos archivos
- Mantener `admin.controller.ts` y `admin.service.ts` como re-exports para backwards compatibility

### Fase 4: Testing y Deploy
- Verificar que todo compile
- Testear endpoints
- Deploy

---

## Notas Importantes

1. **No romper backwards compatibility**: Mantener exports en archivos originales que re-exportan desde los nuevos módulos
2. **Mover вместе**: Controller Y Service del mismo dominio deben moverse juntos
3. **Tests**: Actualizar imports en tests si existen
4. **Routes**: El archivo `admin.routes.ts`will need to update imports

---

## Dependencies entre dominios

```
auth.admin.controller → auth.admin.service
brands.admin.controller → brands.admin.service
subscriptions.admin.controller → subscriptions.admin.service, brands.admin.service
revenue.admin.controller → revenue.admin.service, brands.admin.service
admins.admin.controller → admins.admin.service
promotions.admin.controller → (usa adminService directamente)
woo.admin.controller → (usa supabaseAdmin directamente)
feedback.admin.controller → (usa supabaseAdmin directamente)
system.admin.controller → (usa systemService si existe)
```

---

*Documento generado automáticamente - Fecha: Abril 2026*