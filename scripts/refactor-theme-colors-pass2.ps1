# Second pass: fix double-replacement artifacts (bg-X hover:bg-X) and
# catch the remaining light emerald/blue text shades that were missed
# by the first pass.

$ErrorActionPreference = "Stop"

$replacements = [ordered]@{
    # Restore hover affordance on primary buttons
    "bg-accent hover:bg-accent"     = "bg-accent hover:opacity-90"
    "bg-accent-2 hover:bg-accent-2" = "bg-accent-2 hover:opacity-90"
    "bg-border hover:bg-border"     = "bg-border hover:opacity-80"

    # Very-light accent shades used for high-contrast text on tinted bg
    "text-emerald-50"  = "text-accent"
    "text-emerald-100" = "text-accent"
    "text-emerald-200" = "text-accent"
    "text-blue-100"    = "text-accent-2"
    "text-blue-200"    = "text-accent-2"
}

$files = Get-ChildItem -Path "src" -Include "*.ts","*.tsx" -Recurse -File `
    | Where-Object { $_.FullName -notmatch "\\node_modules\\" }

$filesChanged = 0
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding utf8
    if (-not $content) { continue }
    $original = $content
    foreach ($pair in $replacements.GetEnumerator()) {
        $content = $content.Replace($pair.Key, $pair.Value)
    }
    if ($content -ne $original) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        $filesChanged++
        Write-Output ("modified: " + $file.FullName.Substring((Get-Location).Path.Length + 1))
    }
}
Write-Output ("Files changed: " + $filesChanged)
