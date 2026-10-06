param(
    [string]$OutputDirectory = (Join-Path $env:USERPROFILE "MID-Widgets\Bilder")
)

$ErrorActionPreference = "Stop"

$ZipUrl = "https://github.com/MeteoMartini/MID/releases/download/widget-latest/mid-widget-export-latest.zip"
$ChecksumUrl = "https://github.com/MeteoMartini/MID/releases/download/widget-latest/mid-widget-export-latest.zip.sha256"
$TempRoot = Join-Path $env:TEMP ("MID-Widgets-" + [Guid]::NewGuid().ToString("N"))
$ZipFile = Join-Path $TempRoot "mid-widget-export-latest.zip"
$ChecksumFile = Join-Path $TempRoot "mid-widget-export-latest.zip.sha256"
$Extracted = Join-Path $TempRoot "extract"

try {
    New-Item -ItemType Directory -Path $TempRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $Extracted -Force | Out-Null

    Write-Host "Lade aktuelles MID-Widget-Paket …"
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipFile -UseBasicParsing -Headers @{ "Cache-Control" = "no-cache" }
    Invoke-WebRequest -Uri $ChecksumUrl -OutFile $ChecksumFile -UseBasicParsing -Headers @{ "Cache-Control" = "no-cache" }

    $ChecksumText = (Get-Content $ChecksumFile -Raw).Trim()
    if ($ChecksumText -notmatch '^([0-9a-fA-F]{64})\s+') {
        throw "Ungültige Prüfsummendatei."
    }

    $ExpectedZipHash = $Matches[1].ToLowerInvariant()
    $ActualZipHash = (Get-FileHash -Path $ZipFile -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($ExpectedZipHash -ne $ActualZipHash) {
        throw "SHA-256 des Widget-ZIP stimmt nicht überein."
    }

    Expand-Archive -Path $ZipFile -DestinationPath $Extracted -Force

    $ManifestPath = Join-Path $Extracted "manifest.json"
    if (!(Test-Path $ManifestPath)) {
        throw "manifest.json fehlt im Widget-Paket."
    }

    $Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
    if ([int]$Manifest.count -ne 12 -or @($Manifest.files).Count -ne 12) {
        throw "Widget-Paket enthält nicht exakt 12 freigegebene PNGs."
    }

    foreach ($File in @($Manifest.files)) {
        $PngPath = Join-Path $Extracted $File.filename
        if (!(Test-Path $PngPath)) {
            throw "Widget-Datei fehlt: $($File.filename)"
        }

        $ActualHash = (Get-FileHash -Path $PngPath -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($ActualHash -ne ([string]$File.sha256).ToLowerInvariant()) {
            throw "Prüfsumme stimmt nicht: $($File.filename)"
        }

        $Header = [System.IO.File]::ReadAllBytes($PngPath)
        if ($Header.Length -lt 8 -or
            $Header[0] -ne 0x89 -or $Header[1] -ne 0x50 -or
            $Header[2] -ne 0x4E -or $Header[3] -ne 0x47 -or
            $Header[4] -ne 0x0D -or $Header[5] -ne 0x0A -or
            $Header[6] -ne 0x1A -or $Header[7] -ne 0x0A) {
            throw "Ungültiges PNG: $($File.filename)"
        }
    }

    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    foreach ($File in @($Manifest.files)) {
        Copy-Item -Path (Join-Path $Extracted $File.filename) -Destination (Join-Path $OutputDirectory $File.filename) -Force
    }
    Copy-Item -Path $ManifestPath -Destination (Join-Path $OutputDirectory "manifest.json") -Force
    Copy-Item -Path (Join-Path $Extracted "SHA256SUMS.txt") -Destination (Join-Path $OutputDirectory "SHA256SUMS.txt") -Force

    Write-Host ""
    Write-Host "MID-Widgets erfolgreich aktualisiert."
    Write-Host "Version: v$($Manifest.midVersion)"
    Write-Host "Stable-SHA: $($Manifest.stableSha)"
    Write-Host "Ziel: $OutputDirectory"
}
finally {
    if (Test-Path $TempRoot) {
        Remove-Item $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
