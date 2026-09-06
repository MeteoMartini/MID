# MID v0.9.79.6 – Bedienkonzept Schritt 7 und Parallelstand-Merge

## Basis

Der Release baut auf dem zuletzt ausgelieferten optionalen Bedienkonzept **v0.9.79.5** auf und integriert zusätzlich den vom Nutzer hochgeladenen Parallelstand **v0.9.78.85**. Beide Linien wurden gegen die gemeinsame Basis **v0.9.78.83** abgeglichen; die nachträglichen Änderungen aus **v0.9.78.84/.85** werden nicht durch den Bedienkonzept-Zweig überschrieben.

## Übernommene Paralleländerungen v0.9.78.84/.85

- Synoptik-Buildfix: keine ungültige `smoothFactor`-Option in Karten-Polyline-Optionen; die MID-eigene Konturglättung bleibt erhalten.
- Stabiler Persistenzvertrag `mid:composite-settings:v3` einschließlich `modelLineTone`, `isobarLineColor` und `isoheightLineColor`.
- Isobaren/Isohypsen behalten die vorgesehenen Schwarz-/Weiß-/Akzent-/unterschiedlichen Farbmöglichkeiten, ohne Radarprodukte umzufärben.
- Sat/Rad-Wiedergabe wird nicht wieder durch Scrollen automatisch pausiert.
- Event-Hitzeempfehlungen behalten die seriöse Trinkwasser-/Erholungspausen-Semantik.
- Die aktualisierten Synoptik-/Komposit-/Event-Regressionen bleiben Bestandteil der Releasebasis.

## Schritt 7 – Übersicht → Fokus → Details

### Heute

Im optionalen `bottom-tabs`-Modus ist die moderne Heute-Karte die eigentliche Übersicht. Die vollständige bestehende Current-Ansicht wird nicht mehr unmittelbar doppelt darunter gerendert, sondern erst nach explizitem **Details**-Aufruf in einem Fokusbereich. **Übersicht** schließt diesen Fokus wieder. Ein erneuter Aufruf des Bottom-Tabs **Heute** führt bewusst zurück zur Übersicht.

Der klassische Modus rendert `MemoCurrent` weiterhin unverändert und benötigt keinen zusätzlichen Fokuszustand.

### Karte

Im optionalen `bottom-tabs`-Modus öffnet **Karte** das vorhandene Kompositbild direkt als `modern-map-focus-shell`. Die zusätzliche äußere `CollapsibleModule`-Aufklappstufe entfällt nur dort. Ebenen, Timeline, Play/Pause, Geschwindigkeit und die erweiterten technischen Einstellungen bleiben im vorhandenen `RadarPanel` erreichbar.

Der klassische Modus behält die bestehende aufklappbare Kompositsektion vollständig bei.

## Unveränderte Fachverträge

- keine neue Wetterdatenabfrage und keine parallele Forecastlogik,
- keine Änderung an `displayHours` / `displayMinutes15`, Forecast-Fusion oder Ensembleberechnung,
- keine Änderung an Wetterpiktogrammen, Parameterfarben oder Einheiten,
- Radarfarbvertrag bleibt ausschließlich auf den realen Produkt-/`dwd-standard`-Farben,
- keine fachliche Workeränderung; Versionskennung wird lediglich synchronisiert.

## Regression

Required Regression: `scripts/test-modern-focus-detail-hierarchy-09796.mjs`.
Zusätzlich bleiben `scripts/test-synoptic-contour-path-options-097884.mjs` und die bisherigen Schritt-1-bis-6-Regressionen verbindlich.
