# Add dark: variants to light-shade status colors so badges have proper
# contrast in light mode. Light-shade text (100-300) is unreadable on
# light-tinted badge backgrounds; we keep them for dark theme via `dark:`
# and pair each with a darker shade (700-800) for light theme.

$ErrorActionPreference = "Stop"

# Status / utility colors that appear in badges. emerald/blue are NOT in
# this list because the refactor already mapped them to semantic accent
# tokens.
$colors = @(
    "purple", "amber", "slate", "red", "orange", "rose", "pink",
    "cyan", "indigo", "lime", "fuchsia", "sky", "teal", "yellow",
    "green", "violet"
)

# Build a replacement map. We match the bare class and any opacity suffix
# (e.g. text-purple-200/80). The dark variant keeps the original shade and
# opacity; the base swaps to a readable shade for light theme.
$shadeToDark = @{
    "100" = "800"
    "200" = "700"
    "300" = "700"
}

$replacements = [ordered]@{}
foreach ($color in $colors) {
    foreach ($shade in $shadeToDark.Keys) {
        $darkShade = $shadeToDark[$shade]
        # Base: text-purple-300 → text-purple-700 dark:text-purple-300
        $base = "text-$color-$shade"
        $repl = "text-$color-$darkShade dark:text-$color-$shade"
        # Don't add if already migrated (idempotency)
        $replacements[$base + "<MARK>"] = $repl
    }
}

# Also handle opacity variants like text-purple-200/80
$opacityReplacements = [ordered]@{}
foreach ($color in $colors) {
    foreach ($shade in $shadeToDark.Keys) {
        $darkShade = $shadeToDark[$shade]
        foreach ($op in @("90", "80", "75", "70", "60", "50", "40", "30", "20", "10")) {
            $base = "text-$color-$shade/$op"
            $repl = "text-$color-$darkShade/$op dark:text-$color-$shade/$op"
            $opacityReplacements[$base + "<MARK>"] = $repl
        }
    }
}

$files = Get-ChildItem -Path "src" -Include "*.ts","*.tsx" -Recurse -File `
    | Where-Object { $_.FullName -notmatch "\\node_modules\\" }

$filesChanged = 0
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding utf8
    if (-not $content) { continue }
    $original = $content

    # Handle opacity variants FIRST so we don't mangle them when matching the
    # bare shade (e.g. text-purple-200 would otherwise greedily match inside
    # text-purple-200/80).
    foreach ($pair in $opacityReplacements.GetEnumerator()) {
        $key = $pair.Key -replace "<MARK>$", ""
        # Skip if already has dark: variant
        if ($content -match [regex]::Escape("dark:$key")) { continue }
        $content = $content.Replace($key, $pair.Value)
    }

    foreach ($pair in $replacements.GetEnumerator()) {
        $key = $pair.Key -replace "<MARK>$", ""
        if ($content -match [regex]::Escape("dark:$key")) { continue }
        # Use word-boundary regex to avoid matching text-purple-200 inside
        # text-purple-200/80 (already handled above). PowerShell's Replace
        # is plain-string; switch to regex for boundary check.
        $pattern = "(?<![\w/-])" + [regex]::Escape($key) + "(?![\w/-])"
        $content = [regex]::Replace($content, $pattern, $pair.Value)
    }

    if ($content -ne $original) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        $filesChanged++
        Write-Output ("modified: " + $file.FullName.Substring((Get-Location).Path.Length + 1))
    }
}
Write-Output ("Files changed: " + $filesChanged)
