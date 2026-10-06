# MID v0.9.85.182 · Widget Render Retry

## Befund

Der serverseitige Widget-Workflow auf v0.9.85.181 / Stable-SHA `a855f418c3fa00af40da8ccedcd2b1a7c05b02b9` bestand Checkout, Browser-Preflight, Versionsspiegel und öffentliche Versionsprüfung. Acht PNGs wurden erfolgreich erzeugt. Beim Rendering von `kuerecik-kompakt-5d-light.png` blieb der Wetterabruf jedoch länger als 120 Sekunden aus; der Renderer brach korrekt fail-closed ab und veröffentlichte deshalb kein unvollständiges Paket.

## Änderung

- maximal drei Capture-Versuche je einzelner Widgetvariante,
- 180 Sekunden Capture-/Datenzeit je Versuch,
- kurzer begrenzter Backoff zwischen Wiederholungen,
- Entfernung vorhandener Ziel- und `.part.png`-Dateien vor jedem Versuch,
- Workflow-Zeitrahmen 45 Minuten,
- unverändert fail-closed nach dem dritten Fehlschlag.

## Abgrenzung

Widgetmatrix, Orte, Profile, ECMWF-Farben, Wetterlogik, Live-URLs, öffentliche Versionsbindung und SharePoint-Übergabe bleiben unverändert.

## Regression

`scripts/test-widget-export-automation-0985178.mjs` schützt Retryzahl, 180-s-Zeitfenster, Cleanup, endgültigen Fail-closed-Fehler und den erhöhten Workflow-Zeitrahmen.
