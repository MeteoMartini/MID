# MID v0.9.15.12 – Punkt-Nowcast in allen Kurzfristansichten und K3D-Verortung

## Ausgangsbasis

- Lokale, zuletzt konsistente Arbeitsbasis: MID v0.9.15.11.
- Zielversion: v0.9.15.12.
- Der GitHub-Branch `mid-stable` konnte in diesem Durchlauf nicht erneut remote verifiziert werden, weil der GitHub-Connector während des Zugriffs deaktiviert wurde.

## 1. Appweite Kurzfrist-Nowcast-Fusion

Die Radar-/Modellfusion ist in `src/forecastFusion.ts` zentralisiert. Alle Verbraucher der Kurzfristprognose verwenden damit dieselbe Auswertung:

- `ShortTermForecast.tsx` für die eigenständige Kurzfristansicht,
- `ForecastCockpit.tsx` für die Cockpit-Aggregation,
- der bestehende Wetterzwilling über `applyOperationalNowcastHours`.

### Direkter Standorttreffer

Für jedes 15-Minuten- oder Stundenintervall werden alle darin liegenden DWD-RV-Punkte der 5-Minuten-Serie ausgewertet. Nur Frames mit `hitClass: site` dürfen:

- Standortniederschlag hinzufügen,
- den Niederschlags-Wettercode am Standort beeinflussen,
- eine direkte Standortwahrscheinlichkeit erzeugen.

Menge und Wahrscheinlichkeit werden anhand von Produktqualität, Vorlauf, Frame-Unterstützung und möglicher Intensitätsunsicherheit gewichtet.

### Unterbrochene Phasen

`siteIntervals` werden als getrennte Standortphasen beibehalten. Fehlende Einzelpunkte können aus den exakten Phasen ergänzt werden, ohne trockene Lücken zu überbrücken. Die Kurzfristdetails zeigen die Zahl bestätigender 5-Minuten-Schritte und eine vorhandene Unterbrechung an.

### Reine Umfeldechos

Frames mit `hitClass: nearby`:

- erzeugen keine Standortmenge,
- ändern keinen Standort-Wettercode,
- wirken nur begrenzt auf die Wahrscheinlichkeit,
- zeigen Entfernung und den Hinweis „kein Standorttreffer“.

### Trockene Standortintervalle

Bei vollständiger trockener DWD-RV-Abdeckung wird die Modellwahrscheinlichkeit kurzfristig reduziert. Ein trockenes Radarintervall entfernt jedoch keine größere, bereits modellierte Menge außerhalb des direkten Radarfokus.

### Kompatibilitätsfallback

Für ältere oder reduzierte Radarantworten ohne `nowcastSeries` und `siteIntervals` bleibt ein eng begrenzter Aggregat-Fallback erhalten. Er wird nur benutzt, wenn das Signal als Standortsignal plausibel ist. `nearby`, `approximate`, entfernte oder ausdrücklich als „kein Standorttreffer“ bezeichnete Signale sind ausgeschlossen.

## 2. K3D-Verortung und Darstellung

### Amtliche Zellfläche

Der Worker verarbeitet aus KONRAD3D:

- geodätische Polygonkoordinaten der aktuellen Zelle,
- `covered_area`/`cell_area` einschließlich Einheiten,
- Zellgeschwindigkeit einschließlich m/s-, kt- und km/h-Normalisierung.

Der geometrische Mittelpunkt der Zellfläche wird nur verwendet, wenn er plausibel nahe am amtlichen 3D-Zentroid liegt. Die gesamte Prognosespur wird um denselben Offset verschoben, damit Marker, aktuelle Zellfläche und Track zusammenbleiben.

### Räumliche Echo-Plausibilisierung

K3D-Zellen im lokalen Nahbereich werden gegen aktuelle, ausreichend starke DWD-Radar-Bewegungsanker geprüft. Fehlt ein Echo innerhalb eines zellgrößenabhängigen Toleranzradius, wird die Zelle nicht über dem lokalen Radarbild angezeigt. Weit entfernte Zellen werden nicht anhand des lokalen Ankerfeldes verworfen.

### Leaflet-Ebenen

- `mid-nowcast-vectors`: aktuelle Zellfläche, Track, Korridor und Unsicherheitsellipsen.
- `mid-nowcast-labels`: K3D-Zellmarker, NowCastMIX und Prognosepunkte.

Prognosepunkte sind robuste HTML-DivIcon-Marker. Nur die relevanteste sichtbare Zelle erhält eine vollständig beschriftete Prognosespur; weitere Zellen bleiben als aktuelle Zellmarker und Zellflächen sichtbar.

## 3. Geänderte Dateien

- `src/forecastFusion.ts`
- `src/ShortTermForecast.tsx`
- `src/ForecastCockpit.tsx`
- `src/weather.ts`
- `src/RadarPanel.tsx`
- `src/styles.css`
- `worker/metar-proxy.js`
- `scripts/test-shortterm-point-nowcast-k3d-placement-091512.mjs`
- angepasste bestehende K3D-/Komposit-Regressionsverträge
- Versions-, Baseline- und Changelogdateien

## 4. Prüfungen

- 292 automatisch erkannte MID-Regressionstests bestanden.
- Funktionstest des KONRAD3D-Parsers mit geodätischem Polygon, `covered_area` und Geschwindigkeit in m/s bestanden.
- Direkter Standorttreffer, reine Nähe, Trockenintervall, unterbrochene Phase und Kompatibilitätsfallback geprüft.
- Worker sowie beide PWA-Service-Worker mit `node --check` geprüft.
- 78 TypeScript-/TSX-Dateien per TypeScript-Parser geprüft.
- Die globale TypeScript-Prüfung konnte ohne installierte React-/Leaflet-Abhängigkeiten nicht vollständig laufen. Dabei erkannte lokale Typfehler in `forecastFusion.ts` wurden behoben; verbleibende Meldungen betreffen die fehlenden Projektmodule und deren Typdeklarationen.
- Ein vollständiger Vite-Produktionsbuild ist in der isolierten Umgebung ohne `node_modules` nicht möglich.

## 5. Deployment

- Frontend-Paket ersetzen und GitHub-Pages-Prozess ausführen.
- Cloudflare-Worker ersetzen, weil der KONRAD3D-Parser erweitert wurde.
- Keine neuen Secrets, Variablen, Bindings oder Routen erforderlich.
