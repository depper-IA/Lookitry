$bytes = [System.IO.File]::ReadAllBytes("C:\Users\Matt\Lookitry\frontend\src\components\dashboard\ProductList.tsx")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$allLines = $text.Split("`n")

# Track brace depth from line 467 (ListView) to line 683
$depth = 0
$maxDepth = 0
$maxLine = 0

for ($i = 466; $i -lt 684; $i++) {
    $line = $allLines[$i]
    for ($j = 0; $j -lt $line.Length; $j++) {
        if ($line[$j] -eq '{') { $depth++ }
        if ($line[$j] -eq '}') { $depth-- }
    }
    if ($depth -gt $maxDepth) {
        $maxDepth = $depth
        $maxLine = $i + 1
    }
    if ($depth -lt 0) {
        Write-Host "NEGATIVE at line $($i + 1): depth=$depth"
        Write-Host "Line: $($allLines[$i])"
        break
    }
}

Write-Host ""
Write-Host "At line 683 (end of mobile section), depth=$depth"
Write-Host "Max depth was $maxDepth at line $maxLine"
Write-Host ""
Write-Host "Lines 680-685:"
for ($i = 679; $i -lt 686; $i++) {
    Write-Host ("Line " + ($i + 1) + " (depth check): " + $allLines[$i])
}