# MID Widget Export

## Kanonischer Betrieb ab MID v0.9.85.181

Die zwölf festen MID-Widget-PNGs werden serverseitig in GitHub Actions erzeugt. Lokale Browser-, Node- oder OneDrive-Installationen sind für den regulären Betrieb nicht erforderlich.

Der Workflow `.github/workflows/widget-export.yml` läuft automatisch genau viermal täglich im 6-Stunden-Abstand: um 00:17, 06:17, 12:17 und 18:17 UTC. Zusätzliche automatische Starts nach Releases oder `mid-stable`-Pushes entfallen. Für bewusste Diagnose-/Notfallläufe bleibt `workflow_dispatch` erhalten.

Er lädt ausschließlich `mid-stable`, verifiziert die Versionsspiegel und veröffentlicht nur dann neue Bilder, wenn `https://www.midwx.app/version.json` dieselbe MID-Version meldet. Danach rendert `render-widget-matrix.mjs` die kanonische Matrix aus `src/widgetUrlExports.ts`, prüft PNG-Signatur, Abmessungen und SHA-256 und erzeugt `manifest.json` sowie `SHA256SUMS.txt`.

## Fester Download

Das rollierende, als Prerelease markierte GitHub-Release `widget-latest` stellt dauerhaft bereit:

`https://github.com/MeteoMartini/MID/releases/download/widget-latest/mid-widget-export-latest.zip`

Zusätzlich liegt eine SHA-256-Datei unter:

`https://github.com/MeteoMartini/MID/releases/download/widget-latest/mid-widget-export-latest.zip.sha256`

Das ZIP enthält genau zwölf PNGs:
- Malatya: 7d Kurve Light/Dark und 5d Kompakt Light/Dark
- Kürecik: 7d Kurve Light/Dark und 5d Kompakt Light/Dark
- Ämari: 7d Kurve Light/Dark und 5d Kompakt Light/Dark

Die fachlichen Parameterprofile stammen ausschließlich aus `src/widgetUrlExports.ts`.

## Windows ohne Administratorrechte

`Download-MID-Widgets.ps1` verwendet nur Windows-/PowerShell-Bordmittel. Es lädt das rollierende ZIP in ein temporäres Benutzerverzeichnis, prüft die ZIP-SHA-256, entpackt es, prüft anschließend alle zwölf PNGs gegen das Manifest und kopiert erst dann die validierten Dateien nach:

`%USERPROFILE%\MID-Widgets\Bilder`

Beispiel:

`powershell.exe -NoProfile -File .\Download-MID-Widgets.ps1`

Ein optionaler Zielordner kann über `-OutputDirectory` angegeben werden. Erst nach vollständig erfolgreicher Validierung werden vorhandene gleichnamige Dateien überschrieben.

## Lokaler Renderer als Fallback

`Update-MID-Widgets.ps1` und `capture-widget.mjs` bleiben für Diagnose-/Fallback-Zwecke bestehen. Der reguläre SharePoint-Transfer soll jedoch das serverseitig erzeugte und kryptografisch geprüfte rollierende Paket verwenden.

## Browser-Laufzeit auf GitHub

Der serverseitige Renderer verwendet auf GitHub Ubuntu den vorinstallierten Google-Chrome-/Chromium-Browser. Der Workflow prüft den Browser vor dem Rendern und übergibt seinen absoluten Pfad über `MID_WIDGET_BROWSER`. `capture-widget.mjs` bleibt zugleich lokal auf Windows/macOS/Linux nutzbar und unterstützt Edge, Chrome sowie Chromium. Fehlt ein kompatibler Browser oder beendet er sich vorzeitig, bricht der Export fail-closed mit einer konkreten Diagnose ab.


## Resilienz bei transienten Datenfehlern

Seit MID v0.9.85.182 wird jede der zwölf Varianten bei einem einzelnen Capture-/Wetterabruf-Fehler begrenzt erneut gerendert. Pro Variante sind maximal drei Versuche mit jeweils 180 Sekunden vorgesehen. Vor einem Wiederholungsversuch werden partielle PNG-Dateien entfernt. Erst wenn auch der dritte Versuch fehlschlägt, stoppt der Export weiterhin fail-closed und veröffentlicht kein unvollständiges Paket.

## Erstfehlerdiagnostik (.216)

Der erste fehlgeschlagene CDP-Versuch je Ziel bewahrt Screenshot und JSON unter `diagnostics/`. Weitere Versuche überschreiben den Erstbefund nicht; auch nach erfolgreicher Recovery bleibt er im CI-Laufartefakt erhalten. Das öffentliche ZIP enthält weiterhin nur die zwölf geprüften Widget-PNGs sowie Manifest und Prüfsummen. Der Bericht enthält keine Cookies, Request-Header, Antwortinhalte oder URL-Querystrings. Version, Stable-SHA und verfügbarer Widget-Zeitbereich unterstützen die Zuordnung; der Zeitbereich ist kein Modelllauf-Identifier.
