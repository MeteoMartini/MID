param(
    [string]$OutputDirectory = "",
    [int]$TimeoutSeconds = 180
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"

function Get-MIDDefaultOutputDirectory {
    $pictures = [Environment]::GetFolderPath([Environment+SpecialFolder]::MyPictures)
    if ([string]::IsNullOrWhiteSpace($pictures)) {
        $pictures = Join-Path $env:USERPROFILE "Pictures"
    }
    return (Join-Path $pictures "MID-Widgets")
}

function Get-MIDEdgePath {
    $candidates = @()
    if (-not [string]::IsNullOrWhiteSpace(${env:ProgramFiles(x86)})) { $candidates += (Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe") }
    if (-not [string]::IsNullOrWhiteSpace($env:ProgramFiles)) { $candidates += (Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe") }
    if (-not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) { $candidates += (Join-Path $env:LOCALAPPDATA "Microsoft\Edge\Application\msedge.exe") }

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }

    $command = Get-Command msedge.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    throw "Microsoft Edge wurde nicht gefunden. Es wird nichts installiert. Nutze MID-Widget-Fallback.html oder wende dich an den Firmen-IT-Support."
}

function Get-MIDLocalJson([string]$Uri) {
    $client = New-Object System.Net.WebClient
    try {
        # Nur localhost-CDP: Firmenproxy und Zertifikatsvorgaben fuer die eigentliche MID-Verbindung bleiben unangetastet.
        $client.Proxy = [System.Net.GlobalProxySelection]::GetEmptyWebProxy()
        return ($client.DownloadString($Uri) | ConvertFrom-Json)
    }
    finally {
        $client.Dispose()
    }
}

function Send-MIDCdpCommand {
    param(
        [Parameter(Mandatory=$true)]$Socket,
        [Parameter(Mandatory=$true)][int]$Id,
        [Parameter(Mandatory=$true)][string]$Method,
        [hashtable]$Parameters = @{}
    )

    $payload = @{ id = $Id; method = $Method; params = $Parameters } | ConvertTo-Json -Compress -Depth 12
    $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
    $segment = New-Object 'System.ArraySegment[byte]' -ArgumentList (, $bytes)
    $Socket.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null

    while ($true) {
        $stream = New-Object System.IO.MemoryStream
        try {
            do {
                $buffer = New-Object byte[] 65536
                $receiveSegment = New-Object 'System.ArraySegment[byte]' -ArgumentList (, $buffer)
                $received = $Socket.ReceiveAsync($receiveSegment, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
                if ($received.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) {
                    throw "Edge hat die lokale Debuggingverbindung beendet."
                }
                if ($received.Count -gt 0) { $stream.Write($buffer, 0, $received.Count) }
            } while (-not $received.EndOfMessage)

            $message = [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
        }
        finally {
            $stream.Dispose()
        }

        $idProperty = $message.PSObject.Properties['id']
        if ($idProperty -and [int]$idProperty.Value -eq $Id) {
            $errorProperty = $message.PSObject.Properties['error']
            if ($errorProperty -and $errorProperty.Value) { throw "Edge-CDP $Method: $($errorProperty.Value.message)" }
            $resultProperty = $message.PSObject.Properties['result']
            return $resultProperty.Value
        }
    }
}

function Wait-MIDCondition {
    param(
        [Parameter(Mandatory=$true)][scriptblock]$Probe,
        [Parameter(Mandatory=$true)][string]$Description,
        [int]$Timeout = 30
    )
    $deadline = [DateTime]::UtcNow.AddSeconds($Timeout)
    $lastError = $null
    while ([DateTime]::UtcNow -lt $deadline) {
        try {
            $result = & $Probe
            if ($result) { return $result }
        }
        catch { $lastError = $_.Exception.Message }
        Start-Sleep -Milliseconds 250
    }
    if ($lastError) { throw "$Description ($lastError)" }
    throw "$Description (Zeitueberschreitung)"
}

function Save-MIDWidgetPng {
    param(
        [Parameter(Mandatory=$true)]$Socket,
        [Parameter(Mandatory=$true)][ref]$Sequence,
        [Parameter(Mandatory=$true)][string]$Url,
        [Parameter(Mandatory=$true)][string]$OutputPath,
        [int]$Timeout = 180
    )

    $refreshToken = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds().ToString()
    $separator = if ($Url.Contains('?')) { '&' } else { '?' }
    $targetUrl = "$Url${separator}_mid_widget_refresh=$refreshToken"

    $Sequence.Value++
    Send-MIDCdpCommand -Socket $Socket -Id $Sequence.Value -Method 'Page.navigate' -Parameters @{ url = $targetUrl } | Out-Null

    $readyState = Wait-MIDCondition -Timeout $Timeout -Description "MID meldet das Widget nicht als fertig gerendert" -Probe {
        $Sequence.Value++
        try {
            $probe = Send-MIDCdpCommand -Socket $Socket -Id $Sequence.Value -Method 'Runtime.evaluate' -Parameters @{
                expression = "(()=>({ready:document.documentElement.dataset.midWidgetReady==='ready',href:location.href,error:(document.querySelector('.error')&&document.querySelector('.error').textContent)||'',text:(document.body&&document.body.innerText||'').slice(0,240)}))()"
                returnByValue = $true
            }
            $value = $probe.result.value
            if ($value.error) { throw [string]$value.error }
            if ($value.ready -and ([string]$value.href).Contains("_mid_widget_refresh=$refreshToken")) { return $value }
        }
        catch {
            # Navigation kann kurzzeitig den JS-Kontext ersetzen; bis zum Timeout weiter pruefen.
            throw
        }
        return $null
    }

    $Sequence.Value++
    $measurement = Send-MIDCdpCommand -Socket $Socket -Id $Sequence.Value -Method 'Runtime.evaluate' -Parameters @{
        expression = "(()=>{const node=document.querySelector('.weatherwidget');if(!node)return null;const box=node.getBoundingClientRect();return{x:Math.max(0,box.x),y:Math.max(0,box.y),width:Math.ceil(Math.max(box.width,node.scrollWidth)),height:Math.ceil(Math.max(box.height,node.scrollHeight))}})()"
        returnByValue = $true
    }
    $box = $measurement.result.value
    if (-not $box -or [double]$box.width -lt 100 -or [double]$box.height -lt 100) {
        throw "Widget-Abmessungen sind unplausibel. $($readyState.text)"
    }

    $Sequence.Value++
    $capture = Send-MIDCdpCommand -Socket $Socket -Id $Sequence.Value -Method 'Page.captureScreenshot' -Parameters @{
        format = 'png'
        fromSurface = $true
        captureBeyondViewport = $true
        clip = @{
            x = [double]$box.x
            y = [double]$box.y
            width = [double]$box.width
            height = [double]$box.height
            scale = 1
        }
    }
    $png = [Convert]::FromBase64String([string]$capture.data)
    if ($png.Length -lt 20000 -or $png[0] -ne 137 -or $png[1] -ne 80 -or $png[2] -ne 78 -or $png[3] -ne 71) {
        throw "Ungueltiger oder leerer Screenshot ($($png.Length) Byte). Bestehende PowerPoint-Bilder bleiben unveraendert."
    }

    [IO.File]::WriteAllBytes($OutputPath, $png)
    Write-Host ("Vorbereitet: {0} ({1:N0} Byte, {2}x{3}px)" -f ([IO.Path]::GetFileName($OutputPath)), $png.Length, [int]$box.width, [int]$box.height)
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) { $OutputDirectory = Get-MIDDefaultOutputDirectory }
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$edge = Get-MIDEdgePath
$profile = Join-Path ([IO.Path]::GetTempPath()) ("mid-widget-edge-{0}-{1}" -f $PID, [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
$stage = Join-Path $OutputDirectory (".mid-stage-{0}" -f $PID)
New-Item -ItemType Directory -Path $profile -Force | Out-Null
New-Item -ItemType Directory -Path $stage -Force | Out-Null

$browser = $null
$socket = $null
try {
    $arguments = @(
        '--headless=new',
        '--remote-debugging-port=0',
        '--remote-debugging-address=127.0.0.1',
        "--user-data-dir=$profile",
        '--no-first-run',
        '--disable-features=msEdgeFirstRunExperience',
        '--hide-scrollbars',
        '--window-size=1500,1400',
        'about:blank'
    )
    # Keine Proxy-, Zertifikats-, Sandbox- oder Security-Overrides: Edge erbt die Firmenvorgaben.
    $browser = Start-Process -FilePath $edge -ArgumentList $arguments -PassThru -WindowStyle Hidden
    $activePortFile = Join-Path $profile 'DevToolsActivePort'
    $port = Wait-MIDCondition -Timeout 30 -Description "Edge stellt keinen lokalen Debuggingport bereit. Die Firmenrichtlinie kann Headless/DevTools blockieren" -Probe {
        if (-not (Test-Path -LiteralPath $activePortFile -PathType Leaf)) { return $null }
        $line = (Get-Content -LiteralPath $activePortFile -ErrorAction Stop | Select-Object -First 1)
        $number = 0
        if ([int]::TryParse([string]$line, [ref]$number) -and $number -gt 0) { return $number }
        return $null
    }

    $target = Wait-MIDCondition -Timeout 30 -Description "Edge-Seitentarget wurde nicht bereitgestellt" -Probe {
        $targets = @(Get-MIDLocalJson -Uri "http://127.0.0.1:$port/json/list")
        return ($targets | Where-Object { $_.type -eq 'page' -and $_.webSocketDebuggerUrl } | Select-Object -First 1)
    }

    $socket = New-Object System.Net.WebSockets.ClientWebSocket
    $socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
    $sequence = 0
    $sequenceRef = [ref]$sequence
    $sequenceRef.Value++
    Send-MIDCdpCommand -Socket $socket -Id $sequenceRef.Value -Method 'Runtime.enable' | Out-Null
    $sequenceRef.Value++
    Send-MIDCdpCommand -Socket $socket -Id $sequenceRef.Value -Method 'Page.enable' | Out-Null

    $locations = @(
        @{ Slug = 'wiesbaden'; Name = 'Wiesbaden' },
        @{ Slug = 'kuerecik'; Name = 'Kuerecik' },
        @{ Slug = 'malatya'; Name = 'Malatya' }
    )
    $views = @('kompakt', 'kurve')
    $days = @(5, 7)
    $prepared = @()

    foreach ($location in $locations) {
        foreach ($view in $views) {
            foreach ($dayCount in $days) {
                $fileName = "$($location.Slug)-$view-${dayCount}d-light.png"
                $stagePath = Join-Path $stage $fileName
                $url = "https://www.midwx.app/?widget=$($location.Slug)&ansicht=$view&tage=$dayCount&design=light&farben=ecmwf"
                Save-MIDWidgetPng -Socket $socket -Sequence $sequenceRef -Url $url -OutputPath $stagePath -Timeout $TimeoutSeconds
                $prepared += @{ Name = $fileName; Stage = $stagePath; Target = (Join-Path $OutputDirectory $fileName) }
            }
        }
    }

    # Transaktionaler Austausch: erst wenn alle 12 neuen PNGs validiert sind, beginnt der Commit.
    # Bestehende Dateien werden vorher gesichert und bei einem Commit-Fehler bestmoeglich zurueckgerollt.
    $backupDirectory = Join-Path $stage '_backup'
    New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
    $committed = @()
    try {
        foreach ($item in $prepared) {
            if (Test-Path -LiteralPath $item.Target -PathType Leaf) {
                Copy-Item -LiteralPath $item.Target -Destination (Join-Path $backupDirectory $item.Name) -Force
            }
        }
        foreach ($item in $prepared) {
            Move-Item -LiteralPath $item.Stage -Destination $item.Target -Force
            $committed += $item
        }
    }
    catch {
        foreach ($item in $committed) {
            $backup = Join-Path $backupDirectory $item.Name
            try {
                if (Test-Path -LiteralPath $backup -PathType Leaf) {
                    Copy-Item -LiteralPath $backup -Destination $item.Target -Force
                } else {
                    Remove-Item -LiteralPath $item.Target -Force -ErrorAction SilentlyContinue
                }
            } catch {}
        }
        throw
    }
    $status = @(
        'MID Widget-Export erfolgreich',
        ("Aktualisiert: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')),
        'Quelle: https://www.midwx.app/',
        'Farben: ECMWF-Temperaturpalette',
        'Client: Microsoft Edge, ohne Node.js/npm/Installation'
    ) -join [Environment]::NewLine
    [IO.File]::WriteAllText((Join-Path $OutputDirectory 'MID-widget-status.txt'), $status, [Text.Encoding]::UTF8)

    Write-Host ""
    Write-Host "Alle 12 MID-Widgets wurden aktualisiert."
    Write-Host "Ordner: $OutputDirectory"
    Write-Host "PowerPoint kann dieselben Dateinamen dauerhaft verknuepfen; bei einem spaeteren Fehler bleiben die letzten gueltigen PNGs erhalten."
}
catch {
    Write-Error ("MID-Widget-Export abgebrochen: {0}`nEs wurden keine vorhandenen PowerPoint-PNGs durch Teil- oder Fehlerbilder ersetzt. Falls Firmenrichtlinien Edge-Headless/DevTools sperren, oeffne MID-Widget-Fallback.html." -f $_.Exception.Message)
    exit 1
}
finally {
    if ($socket) {
        try {
            if ($socket.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
                $socket.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'MID fertig', [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
            }
        } catch {}
        $socket.Dispose()
    }
    if ($browser) {
        try { if (-not $browser.HasExited) { Stop-Process -Id $browser.Id -Force -ErrorAction SilentlyContinue } } catch {}
    }
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $profile -Recurse -Force -ErrorAction SilentlyContinue
}
