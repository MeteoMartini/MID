# MID v0.9.79.1 · Optionales neues Bedienkonzept, Schritt 2

## Ausgangsbasis

Verbindliche Arbeitsbasis war der zuletzt ausgelieferte Stand **v0.9.79.0**. Das neue Bedienkonzept bleibt weiterhin optional; `classic` ist der unveränderte Fallback.

## Umgesetzt

- kompakter mobiler Kopfbereich ausschließlich im Modus `bottom-tabs`
- aktueller MID-Logo-/Themevertrag bleibt erhalten
- Suche und Kopfaktionen platzsparender angeordnet, mit mindestens 44 px iOS-Touchflächen
- gemeinsame Prognose-Horizontleiste: `90 min · 24 h · 7 T · 14 T · 46 T · Saison`
- Horizontleiste wird nur einmal vor dem ersten aktivierten Prognosemodul gerendert
- 90 min / 24 h fokussieren vorhandene Kurzfristinhalte
- Prognose-Cockpit fokussiert für 90 min den Nowcast-/90-Minuten-Bereich und für 24 h das vorhandene 24-h-Wetterprofil
- 7 T / 14 T verwenden die vorhandenen Tages-/Ensemble-Horizonte
- 46 T / Saison verwenden das vorhandene Langfristmodul und springen zu Witterungstrend bzw. Saisonbereich
- keine neuen Forecast-Requests und keine duplizierte Datenarchitektur
- klassischer Modus bleibt vom neuen Header-CSS und der Horizontleiste unberührt
- Radar-Farbtabellen und Standard-Radarprodukte wurden nicht verändert

## Absicherung

- eigener Regressionstest `scripts/test-modern-navigation-step2-09791.mjs`
- bestehender Schritt-1-Test bleibt verpflichtend
- TSX-Syntax der geänderten Komponenten mit TypeScript-Parser geprüft
- Styles-Aggregat aus den kanonischen Stylemodulen neu erzeugt

## Weiterer sinnvoller Schritt

Schritt 3 kann den gemeinsamen **Map-Focus-Modus** im optionalen Design umsetzen: bestehende Radar-/Satellit-/Kompositprodukte unverändert, aber einheitliche Kartenbedienung mit Pan/Zoom, Layer, Timeline, Play/Pause und Geschwindigkeit.
