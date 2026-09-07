# MID v0.9.80.4 – Freigabeprüfung

Stand: 7. September 2026. Ausgangsbasis: hochgeladener Quellstand v0.9.80.3; v0.9.80.4 wurde aus den unmittelbar anschließenden verbindlichen MID-Projektverträgen konsolidiert.

## Geprüfte Änderungen

- appweit einheitliche DWD-Böenschwellen einschließlich der Sondergrenzen 50 und 140 km/h
- Widget-Hinweise aus dem kanonischen automatischen MID-Hazardpfad
- Widget-Böenfarbe nach derselben Warnstufe wie übrige App-Bereiche
- Sonnenscheindauer im Widget in ganzen Stunden
- Klima-Farbvertrag für Tmin, Mitteltemperatur, Tmax und Niederschlag
- Bedeckungsanteile nach Achtelklassen
- Niederschlags- und Schneefalltage mit transparenten Schwellen
- Windrose als Tagesverteilung mit Richtungshäufigkeit und Geschwindigkeitsanteilen
- ERA5-Seamless-Klimacache v6 mit Schneefalltag-Statistik
- Wartungsaggregate und Release-Lineage

## Erfolgreiche Prüfungen

- `scripts/test-climate-hazard-widget-09804.mjs`
- `scripts/test-climate-section-09800.mjs`
- `scripts/test-cockpit-landscape-widget-09161.mjs`
- `scripts/test-appwide-precipitation-and-daily-heat.mjs`
- `scripts/test-forecast-highest-hazard-per-kind-081812.mjs`
- `scripts/test-wind-warnings-modules.mjs`
- `scripts/test-hazard-time-direction-localtime-097919.mjs`
- `scripts/test-travel-planner-era5-seamless-units-09652.mjs`
- `scripts/test-maintenance-modularization-09560.mjs`
- `scripts/test-release-lineage.mjs`
- `node --check` für `worker.js`, `worker/metar-proxy.js`, `public/service-worker.js` und `public/sw.js`
- direkte Grenzwertprobe: 50 km/h → Stufe 0, >50 → 1; 65/90 → 2; 105/120/140 → 3; >140 → 4
- geänderte TS/TSX-Dateien parser-/transpilebasiert ohne Syntaxdiagnose
- `worker.js` und `worker/metar-proxy.js` bytegleich

## Umgebungseinschränkung

Ein vollständiges `npm ci` und damit der komplette lokale Vite-Produktionsbuild konnte in dieser isolierten Laufzeit nicht abgeschlossen werden: die Paketinstallation brach mit einem Container-Transportfehler ab. Das ist kein diagnostizierter MID-Quellfehler. Der Installer erzeugt den Produktionsbuild regulär aus dem verifizierten Lockfile.

Die native iOS-Webkopie wurde deshalb nicht erneut per Capacitor synchronisiert und nicht künstlich umetikettiert. Die Änderungen liegen im gemeinsamen React/Vite-Fachkern.

## Worker

Keine funktionale Workeränderung gegenüber v0.9.80.3. Der Worker wurde lediglich auf v0.9.80.4 versionssynchronisiert; ein erneuter Worker-Upload ist nicht erforderlich.
