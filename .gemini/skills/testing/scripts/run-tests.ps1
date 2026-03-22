# run-tests.ps1
# Helper para ejecutar tests del backend de Lookitry desde PowerShell
# Uso: .\run-tests.ps1 [opciones]
#
#   -Watch        Modo watch interactivo
#   -Coverage     Genera reporte de cobertura
#   -File <name>  Corre solo tests que incluyan <name> en el path
#   -Pattern <p>  Corre solo tests que matcheen el nombre
#   -Unit         Solo tests unitarios (*.unit.test.ts)
#   -Integration  Solo tests de integración (*.integration.test.ts)
#   -Property     Solo property-based tests (*.property.test.ts)

param(
    [switch]$Watch,
    [switch]$Coverage,
    [string]$File = "",
    [string]$Pattern = "",
    [switch]$Unit,
    [switch]$Integration,
    [switch]$Property
)

$BackendDir = Join-Path $PSScriptRoot "..\..\..\backend"

if (-not (Test-Path $BackendDir)) {
    Write-Error "No se encontro el directorio backend en: $BackendDir"
    exit 1
}

Set-Location $BackendDir

$jestArgs = @("--runInBand")

if ($Watch)    { $jestArgs += "--watch" }
if ($Coverage) { $jestArgs += "--coverage" }
if ($Pattern)  { $jestArgs += "--testNamePattern", "`"$Pattern`"" }

if ($Unit) {
    $jestArgs += "--testPathPatterns", "unit\.test"
} elseif ($Integration) {
    $jestArgs += "--testPathPatterns", "integration\.test"
} elseif ($Property) {
    $jestArgs += "--testPathPatterns", "property\.test"
} elseif ($File) {
    $jestArgs += $File
}

Write-Host "Ejecutando tests en: $BackendDir" -ForegroundColor Cyan
Write-Host "Comando: npm test -- $($jestArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

npm test -- @jestArgs
