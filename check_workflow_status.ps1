$apiKey = "***REMOVED-SECRET***"

# Get the current workflow to check its state
$workflowId = "ZjVTV3QxoPEi60GX"
$url = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"

$workflow = Invoke-RestMethod -Uri $url -Method GET -Headers @{'X-N8N-API-KEY' = $apiKey}

# Find the "Analyze an image" node to check the current prompt
foreach ($node in $workflow.activeVersion.nodes) {
    if ($node.name -eq "Analyze an image") {
        Write-Host "=== CURRENT GEMINI NODE CONFIG ==="
        Write-Host "Model: $($node.parameters.modelId.value)"
        Write-Host "Prompt length: $($node.parameters.text.Length) chars"
        Write-Host ""
        Write-Host "=== CURRENT PROMPT ==="
        Write-Host $node.parameters.text
    }
}

# Check workflow activation status
Write-Host ""
Write-Host "=== WORKFLOW STATUS ==="
Write-Host "Active: $($workflow.active)"
Write-Host "Version ID: $($workflow.versionId)"
Write-Host "Active Version ID: $($workflow.activeVersionId)"
