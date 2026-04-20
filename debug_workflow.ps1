$apiKey = "***REMOVED-SECRET***"
$workflowId = "ZjVTV3QxoPEi60GX"
$url = "https://n8n.wilkiedevs.com/api/v1/workflows/$workflowId"

# Get current workflow
$workflow = Invoke-RestMethod -Uri $url -Method GET -Headers @{'X-N8N-API-KEY'=$apiKey}

# Find the Analyze an image node
$nodes = $workflow.activeVersion.nodes
$analyzeNode = $nodes | Where-Object { $_.name -eq "Analyze an image" }

# Current prompt
$currentPrompt = $analyzeNode.parameters.text
Write-Host "=== CURRENT PROMPT ==="
Write-Host $currentPrompt
Write-Host ""
Write-Host "=== MODEL ==="
Write-Host $analyzeNode.parameters.modelId.value
