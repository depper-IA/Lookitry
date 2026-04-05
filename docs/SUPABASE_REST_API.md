# Supabase REST API - Lookitry

## Configuración

### Headers requeridos
```powershell
$headers = @{
    "apikey" = "TU_ANON_KEY"
    "Authorization" = "Bearer TU_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}
```

### Para Lookitry
```powershell
$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg"
}
```

**Project Ref:** `vkdooutklowctuudjnkl`
**Base URL:** `https://vkdooutklowctuudjnkl.supabase.co/rest/v1/`

---

## Consultas Básicas

### SELECT - Obtener registros

```powershell
# Todos los brands
Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?select=id,email,name,slug" -Method GET -Headers $headers

# Filtrar por email
Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?email=eq.usuario@ejemplo.com&select=id,email" -Method GET -Headers $headers

# Filtrar con múltiples condiciones
Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?select=*&plan=eq.PRO" -Method GET -Headers $headers

# Ordenar y limitar
Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?select=id,email&order=created_at.desc&limit=10" -Method GET -Headers $headers
```

### INSERT - Crear registros

```powershell
# Crear brand
$body = @{
    email = "nuevo@ejemplo.com"
    name = "Mi Marca"
    slug = "mi-marca"
    plan = "BASIC"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands" -Method POST -Headers $headers -Body $body
```

### UPDATE - Actualizar registros

```powershell
# Actualizar brand por ID
$body = @{ name = "Nombre Actualizado" } | ConvertTo-Json

Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?id=eq.UUID" -Method PATCH -Headers $headers -Body $body
```

### DELETE - Eliminar registros

```powershell
# Eliminar por email
Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?email=eq.usuario@ejemplo.com" -Method DELETE -Headers $headers

# Eliminar por ID
Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?id=eq.UUID" -Method DELETE -Headers $headers
```

---

## Filtros Comunes

| Filtro | Ejemplo |
|--------|---------|
| Igual a | `email=eq.usuario@ejemplo.com` |
| No igual | `email=neq.usuario@ejemplo.com` |
| Like | `slug=ilike.google-*` |
| Mayor que | `created_at=gt.2024-01-01` |
| Menor que | `id=lt.UUID` |
| Contains | `name=cs.partedelnombre` |
| in | `plan=in.(BASIC,PRO)` |

---

## Ejemplos para Lookitry

### Obtener brand por email
```powershell
Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?email=eq.lwlanguageschool2020@gmail.com&select=id,email,google_id,slug,plan,needs_onboarding" -Method GET -Headers $headers
```

### Ver brands recientes con Google OAuth
```powershell
Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?google_id=not.is.null&select=id,email,slug,google_id,needs_onboarding&order=created_at.desc&limit=10" -Method GET -Headers $headers
```

### Verificar si existe email
```powershell
$result = Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?email=eq.test@ejemplo.com&select=id" -Method GET -Headers $headers
if ($result.Count -eq 0) { Write-Host "No existe" }
```

### Actualizar slug después de onboarding
```powershell
$body = @{ slug = "nuevo-slug"; needs_onboarding = $false } | ConvertTo-Json
Invoke-RestMethod -Uri "https://vkdooutklowctuudjnkl.supabase.co/rest/v1/brands?id=eq.UUID-DEL-BRAND" -Method PATCH -Headers $headers -Body $body
```

---

## Tablas Comunes en Lookitry

- `brands` - Marcas/cuentas de usuarios
- `products` - Productos del probador virtual
- `generations` - Generación de imágenes
- `trial_campaigns` - Campañas de trial configuradas
- `trial_events` - Eventos de trial (en social_links JSONB de brands)

---

## Notas Importantes

1. **Service Role Key** es necesaria para operaciones que requieren bypass de RLS
2. La clave `apikey` es la anon key (pública), pero para mutaciones usar service role en Authorization
3. Usar `Prefer: return=minimal` header para DELETE si no necesitas respuesta
4. Para inserts/updates masivas, usar bulk endpoint con header `Prefer: resolution=merge-duplicates`
