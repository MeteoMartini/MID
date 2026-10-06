# MID Widget Export

## Kanonischer Betrieb ab MID v0.9.85.178

Die zwölf festen MID-Widget-PNGs werden serverseitig in GitHub Actions erzeugt. Lokale Browser-, Node- oder OneDrive-Installationen sind für den regulären Betrieb nicht erforderlich.

Der Workflow `.github/workflows/widget-export.yml` läuft:
- nach jedem erfolgreich abgeschlossenen MID-Release,
- zusätzlich stündlich um Minute 17,
- sowie manuell per `workflow_dispatch`.

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
