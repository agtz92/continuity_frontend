# Refactor hardcoded color classes to semantic theme tokens.
# Idempotent: re-running on already-refactored files is a no-op.
# Status utility colors (red, amber, orange, pink, yellow, green) are left as-is.

$ErrorActionPreference = "Stop"

$replacements = [ordered]@{
    # Page bg
    "bg-zinc-950"                = "bg-bg"
    "border-zinc-950"            = "border-bg"
    "text-zinc-950"              = "text-bg"

    # Surface (cards, panels)
    "bg-zinc-900/80"             = "bg-surface/80"
    "bg-zinc-900/60"             = "bg-surface/60"
    "bg-zinc-900/50"             = "bg-surface/50"
    "bg-zinc-900/40"             = "bg-surface/40"
    "bg-zinc-900/30"             = "bg-surface/30"
    "bg-zinc-900"                = "bg-surface"
    "border-zinc-900"            = "border-surface"

    # Border / elevated hover bg (mapped together)
    "bg-zinc-800/80"             = "bg-border/80"
    "bg-zinc-800/60"             = "bg-border/60"
    "bg-zinc-800/50"             = "bg-border/50"
    "bg-zinc-800/40"             = "bg-border/40"
    "bg-zinc-800"                = "bg-border"
    "border-zinc-800"            = "border-border"
    "border-zinc-700"            = "border-border"
    "border-zinc-600"            = "border-border"
    "bg-zinc-700"                = "bg-border"
    "hover:bg-zinc-800"          = "hover:bg-border"
    "hover:bg-zinc-700"          = "hover:bg-border"
    "hover:border-zinc-700"      = "hover:border-border"

    # Text
    "text-zinc-100"              = "text-text"
    "text-zinc-200"              = "text-text"
    "text-zinc-300"              = "text-text-muted"
    "text-zinc-400"              = "text-text-muted"
    "text-zinc-500"              = "text-text-muted"
    "text-zinc-600"              = "text-text-muted"
    "hover:text-zinc-100"        = "hover:text-text"
    "hover:text-zinc-200"        = "hover:text-text"
    "hover:text-zinc-300"        = "hover:text-text"
    "hover:text-zinc-400"        = "hover:text-text-muted"
    "hover:text-zinc-500"        = "hover:text-text-muted"
    "placeholder:text-zinc-500"  = "placeholder:text-text-muted"
    "placeholder:text-zinc-600"  = "placeholder:text-text-muted"
    "placeholder-zinc-500"       = "placeholder-text-muted"
    "placeholder-zinc-600"       = "placeholder-text-muted"
    "divide-zinc-800"            = "divide-border"
    "divide-zinc-700"            = "divide-border"
    "ring-zinc-800"              = "ring-border"
    "ring-zinc-700"              = "ring-border"

    # Accent (emerald)
    "text-emerald-300"           = "text-accent"
    "text-emerald-400"           = "text-accent"
    "text-emerald-500"           = "text-accent"
    "text-emerald-600"           = "text-accent"
    "bg-emerald-400"             = "bg-accent"
    "bg-emerald-500"             = "bg-accent"
    "bg-emerald-600"             = "bg-accent"
    "hover:bg-emerald-600"       = "hover:opacity-90"
    "hover:bg-emerald-500"       = "hover:opacity-90"
    "hover:bg-emerald-400"       = "hover:opacity-90"
    "hover:text-emerald-300"     = "hover:text-accent"
    "hover:text-emerald-400"     = "hover:text-accent"
    "border-emerald-500"         = "border-accent"
    "border-emerald-400"         = "border-accent"
    "border-emerald-600"         = "border-accent"
    "ring-emerald-500"           = "ring-accent"
    "ring-emerald-400"           = "ring-accent"
    "from-emerald-500"           = "from-accent"
    "from-emerald-400"           = "from-accent"
    "to-emerald-500"             = "to-accent"
    "to-emerald-400"             = "to-accent"
    "via-emerald-500"            = "via-accent"

    # Accent-2 (blue)
    "text-blue-300"              = "text-accent-2"
    "text-blue-400"              = "text-accent-2"
    "text-blue-500"              = "text-accent-2"
    "text-blue-600"              = "text-accent-2"
    "bg-blue-400"                = "bg-accent-2"
    "bg-blue-500"                = "bg-accent-2"
    "bg-blue-600"                = "bg-accent-2"
    "hover:bg-blue-600"          = "hover:opacity-90"
    "hover:bg-blue-500"          = "hover:opacity-90"
    "hover:text-blue-300"        = "hover:text-accent-2"
    "hover:text-blue-400"        = "hover:text-accent-2"
    "border-blue-500"            = "border-accent-2"
    "border-blue-400"            = "border-accent-2"
    "ring-blue-500"              = "ring-accent-2"
    "from-blue-500"              = "from-accent-2"
    "from-blue-400"              = "from-accent-2"
    "to-blue-500"                = "to-accent-2"
    "to-blue-400"                = "to-accent-2"
    "via-blue-500"               = "via-accent-2"

    # text-white in body content → text-text
    # (We do NOT replace bg-white because some explicit white backgrounds exist
    # in elements where we want raw white regardless of theme.)
    "text-white"                 = "text-text"
    "hover:text-white"           = "hover:text-text"
}

$files = Get-ChildItem -Path "src" -Include "*.ts","*.tsx" -Recurse -File `
    | Where-Object { $_.FullName -notmatch "\\node_modules\\" }

$totalChanges = 0
$filesChanged = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding utf8
    if (-not $content) { continue }
    $original = $content
    foreach ($pair in $replacements.GetEnumerator()) {
        $content = $content.Replace($pair.Key, $pair.Value)
    }
    if ($content -ne $original) {
        # Write without BOM to match the project's existing encoding
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        $filesChanged++
        # Crude diff count
        $diff = ($original.Length - $content.Length)
        $totalChanges++
        Write-Output ("modified: " + $file.FullName.Substring((Get-Location).Path.Length + 1))
    }
}

Write-Output ""
Write-Output ("Files changed: " + $filesChanged)
