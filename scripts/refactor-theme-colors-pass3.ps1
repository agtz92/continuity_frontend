# Third pass: handle residual zinc shades (status dots, muted badges,
# highlight states) that the first two passes missed.

$ErrorActionPreference = "Stop"

$replacements = [ordered]@{
    # Muted status indicators
    "bg-zinc-500/20"        = "bg-text-muted/20"
    "bg-zinc-500/10"        = "bg-text-muted/10"
    "border-zinc-500/30"    = "border-text-muted/30"
    "border-zinc-500/40"    = "border-text-muted/40"
    "border-zinc-500/60"    = "border-text-muted/60"
    "hover:border-zinc-500" = "hover:border-text-muted"
    "hover:bg-zinc-600"     = "hover:bg-text-muted"
    "hover:bg-zinc-500"     = "hover:bg-text-muted"
    "hover:bg-zinc-400"     = "hover:bg-text-muted"

    # Small indicator dots
    "bg-zinc-400"           = "bg-text-muted"
    "bg-zinc-500"           = "bg-text-muted"
    "bg-zinc-600"           = "bg-text-muted"

    # Highlight states (selected items, etc.)
    "bg-zinc-100/10"        = "bg-text/10"
    "bg-zinc-100/15"        = "bg-text/15"
    "bg-zinc-100/20"        = "bg-text/20"
    "border-zinc-300/60"    = "border-text/30"
    "border-zinc-300/40"    = "border-text/30"
    "border-zinc-300"       = "border-text"
    "border-zinc-100"       = "border-text"
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
