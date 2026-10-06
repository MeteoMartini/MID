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
    @{ Slug = "malatya"; Name = "Malatya" },
    @{ Slug = "kuerecik"; Name = "Kürecik" },
    @{ Slug = "amari"; Name = "Ämari" }
)

$profiles = @(
    @{
        View = "kurve"
        Days = 7
        Wind = 1
        Rain = 1
        Sunshine = 1
        Hazards = 0
    },
    @{
        View = "kompakt"
        Days = 5
        Wind = 1
        Rain = 0
        Sunshine = 0
        Hazards = 0
    }
)

$themes = @("light", "dark")

foreach ($location in $locations) {
    foreach ($profile in $profiles) {
        foreach ($theme in $themes) {
            $fileName = "$($location.Slug)-$($profile.View)-$($profile.Days)d-$theme.png"
            $outputPath = Join-Path $OutputDirectory $fileName
            $url = "https://www.midwx.app/?widget=$($location.Slug)&ansicht=$($profile.View)&tage=$($profile.Days)&design=$theme&farben=ecmwf&wind=$($profile.Wind)&regen=$($profile.Rain)&sonne=$($profile.Sunshine)&hazards=$($profile.Hazards)"

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

Write-Host "Alle 12 MID-Widgets für Malatya, Kürecik und Ämari wurden in Hell/Dunkel mit den festgelegten Profilen aktualisiert."
