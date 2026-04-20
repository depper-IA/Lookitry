$apiKey = "***REMOVED-SECRET***"
$workflowId = "ZjVTV3QxoPEi60GX"

# First deactivate (already deactivated from previous run)
$deactivateUrl = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId/deactivate"
try {
    $null = Invoke-RestMethod -Uri $deactivateUrl -Method POST -Headers @{'X-N8N-API-KEY' = $apiKey}
    Write-Host "Deactivated"
} catch {}

# Get workflow
$getUrl = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"
$workflow = Invoke-RestMethod -Uri $getUrl -Method GET -Headers @{'X-N8N-API-KEY' = $apiKey}
Write-Host "Workflow active status: $($workflow.active)"

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

# Check what the original workflow structure looks like - maybe we need meta field
Write-Host ""
Write-Host "=== Checking workflow meta ==="
Write-Host "Has meta: $($workflow.meta -ne $null)"
Write-Host "Has pinData: $($workflow.pinData -ne $null)"

# Try using the exact same structure that GET returned, but with our modified nodes
$updatePayload = @{
    name = $workflow.name
    description = $workflow.description
    nodes = $workflow.activeVersion.nodes
    connections = $workflow.activeVersion.connections
    settings = $workflow.settings
    staticData = $workflow.staticData
    tags = $workflow.tags
    active = $false
    isArchived = $workflow.isArchived
    versionId = $workflow.versionId
    meta = $workflow.meta
} | ConvertTo-Json -Depth 20

# Save to file
$updatePayload | Set-Content -Path "C:\Users\Matt\Lookitry\workflow_update_payload.json" -Encoding UTF8

Write-Host ""
Write-Host "=== Sending update ==="
$updateUrl = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"
try {
    $response = Invoke-RestMethod -Uri $updateUrl -Method PUT `
        -Headers @{
            'X-N8N-API-KEY' = $apiKey
            'Content-Type' = 'application/json'
        } `
        -Body $updatePayload `
        -ErrorAction Stop
    Write-Host "SUCCESS! Updated workflow: $($response.name)"
} catch {
    Write-Host "PUT Error: $($_.Exception.Message)"

    # Try to get more details
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Response body: $body"
    } catch {}
}
