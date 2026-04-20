$apiKey = "***REMOVED-SECRET***"
$workflowId = "ZjVTV3QxoPEi60GX"

# First, let's try deactivating the workflow
Write-Host "=== Step 1: Deactivating workflow ==="
$deactivateUrl = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId/deactivate"

try {
    $response = Invoke-RestMethod -Uri $deactivateUrl -Method POST `
        -Headers @{'X-N8N-API-KEY' = $apiKey} `
        -ErrorAction Stop
    Write-Host "Deactivated: $($response.active)"
} catch {
    Write-Host "Deactivate error: $($_.Exception.Message)"
}

# Now let's try the update
Write-Host ""
Write-Host "=== Step 2: Getting workflow ==="
$getUrl = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"
$workflow = Invoke-RestMethod -Uri $getUrl -Method GET -Headers @{'X-N8N-API-KEY' = $apiKey}
Write-Host "Got workflow: $($workflow.name), active: $($workflow.active)"

# THE FIXED PROMPT
$fixedPrompt = 'You are a fashion vision expert. Analyze this product image.

CRITICAL: Output ONLY valid JSON. No markdown. No code blocks. Start with { and end with }.

{
  "garment_type": "type of garment",
  "silhouette": "silhouette style",
  "primary_color": "main color",
  "secondary_colors": ["color1"] or [],
  "patterns": "patterns or null",
  "materials": "materials",
  "design_details": {
    "neckline": "neckline",
    "sleeves": "sleeves",
    "closures": "closures",
    "pockets": "pockets or null",
    "other": "other or null"
  },
  "fit": "fitted | regular | loose | oversize",
  "suggested_category": "ONE OF: Camiseta, Hoodie, Chaqueta, Pantalones, Zapatos, Accesorios, Otros"
}'

# Update the node
for ($i = 0; $i -lt $workflow.activeVersion.nodes.Count; $i++) {
    if ($workflow.activeVersion.nodes[$i].name -eq "Analyze an image") {
        $workflow.activeVersion.nodes[$i].parameters.text = $fixedPrompt
        Write-Host "Updated node at index $i"
        break
    }
}

Write-Host ""
Write-Host "=== Step 3: Updating workflow ==="
$updatePayload = @{
    name = $workflow.name
    nodes = $workflow.activeVersion.nodes
    connections = $workflow.activeVersion.connections
    settings = $workflow.settings
    active = $false  # Keep it inactive
    versionId = $workflow.versionId
} | ConvertTo-Json -Depth 20

$updateUrl = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"
try {
    $response = Invoke-RestMethod -Uri $updateUrl -Method PUT `
        -Headers @{
            'X-N8N-API-KEY' = $apiKey
            'Content-Type' = 'application/json'
        } `
        -Body $updatePayload `
        -ErrorAction Stop
    Write-Host "=== SUCCESS ==="
    Write-Host "Updated workflow: $($response.name)"
    Write-Host "Active: $($response.active)"
} catch {
    Write-Host "Update error: $($_.Exception.Message)"
}

# Now try to activate
Write-Host ""
Write-Host "=== Step 4: Activating workflow ==="
$activateUrl = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId/activate"
try {
    $response = Invoke-RestMethod -Uri $activateUrl -Method POST `
        -Headers @{'X-N8N-API-KEY' = $apiKey} `
        -ErrorAction Stop
    Write-Host "Activated: $($response.active)"
} catch {
    Write-Host "Activate error: $($_.Exception.Message)"
}
