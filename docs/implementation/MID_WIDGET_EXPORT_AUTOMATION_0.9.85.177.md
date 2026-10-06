# MID v0.9.85.177 · Automatischer Widget-Export

## Ziel

Die zwölf in v0.9.85.175 definierten festen Widget-PNGs für Malatya, Kürecik und Ämari sollen ohne lokalen Browser, OneDrive, Node-Installation oder Administratorrechte regelmäßig aus der jeweils freigegebenen MID-Version erzeugt und als verifizierbares Paket bereitgestellt werden.

## Verifizierte Basis

- `main = mid-stable`
- Version: v0.9.85.176
- SHA: `eab656d060e6dc093db1f98195ffa7ff65d17c72`
- Offene PRs beim Start: keine
- Die Widgetmatrix aus v0.9.85.175 ist in v0.9.85.176 unverändert.

## Trigger und Source-of-Truth

Der neue kanonische Workflow `ci/github/workflows/widget-export.yml` ist aktiv nach `.github/workflows/widget-export.yml` gespiegelt und Teil von `scripts/sync-github-workflows.mjs`.

Er läuft:
1. nach jedem erfolgreich abgeschlossenen Workflow `MID-Release aus ZIP installieren und veröffentlichen`,
2. stündlich um Minute 17,
3. manuell per `workflow_dispatch`.

Der Renderjob checkt immer ausdrücklich `mid-stable` aus. Vor dem Rendering müssen `package.json`, `MID_BASELINE.json` und `public/version.json` dieselbe Version tragen. Danach wird `https://www.midwx.app/version.json` cachefrei geprüft. Weicht die öffentliche Version ab oder ist sie nicht belegbar, wird fail-closed nichts publiziert.

## Rendering

`tools/widget-export/render-widget-matrix.mjs` importiert `widgetUrlExportVariants` aus `src/widgetUrlExports.ts`. Es gibt keine zweite fachliche Orts-/Parameterkonfiguration im Workflow.

Die Matrix muss exakt zwölf Einträge enthalten:
- Malatya, Kürecik, Ämari
- 7d Kurve Light/Dark: Wind + Niederschlag + Sonne + ECMWF, Hazards aus
- 5d Kompakt Light/Dark: Wind + ECMWF, Niederschlag/Sonne/Hazards aus

Jede Variante wird durch das bestehende `capture-widget.mjs` gerendert. Dieses wartet auf `midWidgetReady=ready` und erfasst nur `.weatherwidget`.

Nach jedem Capture werden geprüft:
- PNG-Signatur,
- vorhandener IHDR-Block,
- plausible Breite/Höhe,
- Mindestgröße,
- SHA-256.

Das Ergebnisverzeichnis enthält genau zwölf PNGs plus:
- `manifest.json` mit MID-Version, Stable-SHA, öffentlicher Version, Parametern, Abmessungen, Bytegrößen und Einzeldatei-SHA-256,
- `SHA256SUMS.txt`.

## Bereitstellung

Der Workflow baut `mid-widget-export-latest.zip` und eine separate SHA-256-Datei. Das komplette Laufartefakt wird zusätzlich 14 Tage als GitHub-Actions-Artefakt aufbewahrt.

Die dauerhafte Übergabe verwendet das rollierende Prerelease `widget-latest`:

`https://github.com/MeteoMartini/MID/releases/download/widget-latest/mid-widget-export-latest.zip`

Die Assets werden mit `--clobber` unter unveränderten Namen ersetzt. Dadurch bleibt die Downloadadresse stabil.

## Berechtigungen

Der Renderjob besitzt ausschließlich `contents: read`. Der Publishjob verwendet ebenfalls keinen schreibberechtigten normalen `GITHUB_TOKEN`. Er erzeugt über die bereits etablierte MID Release App ein kurzlebiges Token mit ausschließlich `permission-contents: write`. Pull-Request-, Actions-, Secrets- oder Adminrechte werden nicht angefordert.

## Windows-Übernahme ohne Adminrechte

`tools/widget-export/Download-MID-Widgets.ps1` verwendet ausschließlich PowerShell-Bordmittel:
1. ZIP + ZIP-SHA-256 in einen temporären Benutzerpfad laden,
2. ZIP-Prüfsumme verifizieren,
3. entpacken,
4. Manifest auf exakt zwölf Dateien prüfen,
5. jede PNG-SHA-256 und PNG-Signatur prüfen,
6. erst danach die validierten Bilder nach `%USERPROFILE%\MID-Widgets\Bilder` kopieren.

Ein fehlgeschlagener Download oder eine Prüfsummenabweichung überschreibt keine vorhandenen Zielbilder.

## Abgrenzung

Dieser Build ändert keine meteorologische Fachlogik, keine Widgetdarstellung und keinen Cloudflare-Worker. Der SharePoint-Upload selbst bleibt bewusst getrennt, bis der konkrete SharePoint-Authentifizierungsweg des Arbeitsplatzes verifiziert ist.
