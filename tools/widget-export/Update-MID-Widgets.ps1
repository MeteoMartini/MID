param(
    [string]$OutputDirectory = "$env:SystemDrive\MID-Widgets\Bilder"
)

$ErrorActionPreference = "Stop"
$captureScript = Join-Path $PSScriptRoot "capture-widget.mjs"
$node = Get-Command node.exe -ErrorAction SilentlyContinue

if (-not $node) {
    throw "Node.js 22 wurde nicht gefunden. Bitte die offizielle Node.js-LTS-Version installieren oder node.exe zum PATH hinzufügen."
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$locations = @(
    @{ Slug = "wiesbaden"; Name = "Wiesbaden" },
    @{ Slug = "kuerecik"; Name = "Kürecik" },
    @{ Slug = "malatya"; Name = "Malatya" }
)
$views = @("kompakt", "kurve")
$days = @(5, 7)

foreach ($location in $locations) {
    foreach ($view in $views) {
        foreach ($dayCount in $days) {
            $fileName = "$($location.Slug)-$view-${dayCount}d-light.png"
            $outputPath = Join-Path $OutputDirectory $fileName
            $url = "https://www.midwx.app/?widget=$($location.Slug)&ansicht=$view&tage=$dayCount&design=light&farben=ecmwf"

            Write-Host "Erzeuge $fileName …"
            & $node.Source $captureScript `
                --url $url `
                --output $outputPath `
                --width 1500 `
                --height 1200 `
                --timeout 180

            if ($LASTEXITCODE -ne 0) {
                throw "Widget-Export fehlgeschlagen: $fileName"
            }
        }
    }
}

Write-Host "Alle MID-Widgets wurden mit ECMWF-Temperaturfarben aktualisiert."
