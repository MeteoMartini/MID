# MID v0.9.85.181 · Widget Browser Runtime

## Befund

Der erste vollständig getriggerte Widget-Lauf auf MID v0.9.85.180 (`37456137572`) bestätigte:
- Trigger auf `mid-stable`: erfolgreich,
- Checkout des Stable-SHA: erfolgreich,
- lokale Versionsspiegel: erfolgreich,
- öffentliche Version auf `www.midwx.app/version.json`: erfolgreich,
- Fehler erst beim ersten PNG-Render.

Fehler:
`Edge-Debuggingport wurde nicht bereitgestellt (Zeitüberschreitung)`.

Damit war der Transport-/Triggervertrag korrekt; der Renderer war lediglich nicht vollständig plattformportabel.

## Umsetzung

`tools/widget-export/capture-widget.mjs` unterstützt nun:
- expliziten Pfad über `--browser`,
- expliziten Pfad über `MID_WIDGET_BROWSER`,
- Windows: Microsoft Edge und Google Chrome,
- macOS: Edge, Chrome und Chromium,
- Linux: Google Chrome Stable, Google Chrome, Chromium, Chromium Browser und Edge.

Auf Linux werden `--no-sandbox` und `--disable-dev-shm-usage` ergänzt. Der Browserprozess wird auf Spawn-Fehler und vorzeitigen Exit überwacht; stderr wird begrenzt gesammelt und in der Fehlermeldung ausgegeben. Ein defekter Start wartet damit nicht mehr bis zum allgemeinen CDP-Timeout.

Der Widget-Workflow ermittelt auf Ubuntu vor dem Rendering explizit einen Chrome-/Chromium-Pfad, zeigt die Browser-Version an und exportiert den Pfad als `MID_WIDGET_BROWSER`.

## Regression

`scripts/test-widget-export-browser-runtime-0985181.mjs` ist Required Regression und Baseline-Vertrag. Sie prüft:
- Cross-Platform-Kandidaten,
- Linux-CI-Flags,
- expliziten Browseroverride,
- fail-fast Browserprozessüberwachung,
- den Workflow-Preflight,
- die kanonisch/aktive Workflow-Gleichheit.

## Abgrenzung

Keine Änderung an den zwölf Widgetvarianten, am Renderingziel `.weatherwidget`, an `midWidgetReady`, an Wetterdaten, RUC, Warnungen, Karten oder Workerlogik.
