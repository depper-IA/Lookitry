# Supabase-Lookitry.ps1
# Scripts para operaciones de Supabase en Lookitry
# Uso: . .\Supabase-Lookitry.ps1

$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM"
    "Authorization" = "Bearer ***REMOVED-SECRET***"
    "Content-Type" = "application/json"
}

$baseUrl = "https://vkdooutklowctuudjnkl.supabase.co/rest/v1"

function Get-Brand {
    param(
        [string]$Email,
        [string]$Id,
        [switch]$All
    )
    
    if ($Email) {
        $uri = "$baseUrl/brands?email=eq.$Email&select=*"
        return Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    }
    
    if ($Id) {
        $uri = "$baseUrl/brands?id=eq.$Id&select=*"
        return Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    }
    
    if ($All) {
        $uri = "$baseUrl/brands?select=*&order=created_at.desc&limit=50"
        return Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    }
    
    Write-Host "Usa: Get-Brand -Email 'test@ejemplo.com' o -Id 'uuid'"
}

function Remove-Brand {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Email
    )
    
    $uri = "$baseUrl/brands?email=eq.$Email"
    $result = Invoke-RestMethod -Uri $uri -Method DELETE -Headers $headers -Prefer "return=minimal"
    Write-Host "Eliminado: $Email"
    return $result
}

function Update-Brand {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Id,
        [Parameter(Mandatory=$true)]
        [hashtable]$Data
    )
    
    $body = $Data | ConvertTo-Json
    $uri = "$baseUrl/brands?id=eq.$Id"
    return Invoke-RestMethod -Uri $uri -Method PATCH -Headers $headers -Body $body
}

function Get-BrandByGoogleId {
    param(
        [Parameter(Mandatory=$true)]
        [string]$GoogleId
    )
    
    $uri = "$baseUrl/brands?google_id=eq.$GoogleId&select=*"
    return Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
}

function Get-TrialCampaigns {
    $uri = "$baseUrl/trial_campaigns?active=eq.true&select=*"
    return Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
}

function Get-RecentGoogleSignups {
    $uri = "$baseUrl/brands?google_id=not.is.null&select=id,email,slug,google_id,needs_onboarding&order=created_at.desc&limit=20"
    return Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
}

# Exportar funciones
Export-ModuleMember -Function Get-Brand, Remove-Brand, Update-Brand, Get-BrandByGoogleId, Get-TrialCampaigns, Get-RecentGoogleSignups
