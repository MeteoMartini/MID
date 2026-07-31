## MID v0.8.26.4 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.26.3**, da die vorhandene Gezeitenfunktion fachlich korrigiert und der Marineabruf gezielt vervollständigt wurde.

### Wasserwetter – Gezeiten

- amplitudenadaptive Wendepunkterkennung statt einer festen 3-mm-Differenz zwischen unmittelbar benachbarten Werten
- Erkennung über beidseitige 90-Minuten-Zeitfenster
- robuste Zusammenfassung breiter Hoch- und Tiefwasserplateaus
- vollständiger Tageskontext mit bis zu drei Stunden Randdaten
- automatischer Fallback auf stündliche Wasserstandsdaten, falls die 15-Minuten-Reihe flach, unvollständig oder ungeeignet ist
- alle Ereignisse bleiben dem jeweiligen Kalendertag zugeordnet und sind vom dargestellten Aktivitätszeitfenster unabhängig

### Marineabruf

- `sea_level_height_msl` wird im 15-Minuten-Raster ausdrücklich für acht Tage angefordert
- 15-Minuten-Strömungsfelder werden nicht mehr zusätzlich geladen, weil die vorhandenen stündlichen Strömungswerte für die Darstellung verwendet werden
- Wellen-, Strömungs-, Wasserstands- und übrige Marinefunktionen bleiben vollständig erhalten

### Prüfung

- bestehende Tages-Gezeitenregression bestanden
- bestehende Gezeitenmatrix-Regressionsprüfung bestanden
- neue dynamische Prüfung mit geringer Tidenamplitude bestanden
- automatischer Stundenfallback bei ungeeigneter 15-Minuten-Reihe bestanden
- alle 187 automatisch erkannten Regressionstests bestanden
- 68 TypeScript-/TSX-Dateien parsergeprüft
- 193 JavaScript-/MJS-Dateien syntaktisch geprüft
- Worker syntaktisch geprüft

Der vollständige lokale Produktionsbuild konnte nicht gestartet werden, weil der interne Paketspiegel `yallist-3.1.1.tgz` mit HTTP 404 beantwortete. Der bestehende GitHub-Produktionsworkflow führt den vollständigen TypeScript- und Vite-Build mit regulärer Abhängigkeitsinstallation aus.
