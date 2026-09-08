# MID v0.9.82.0 – Freigabeprüfung

## Geprüfter Ausgangsstand
- Nutzer-ZIP: v0.9.81.2.
- `mid-stable` vor der Bearbeitung: `Install MID v0.9.81.2`.
- Neuer Stand: v0.9.82.0 als Funktionsrelease.

## Gezielte Regressionen
- `test-climate-hazard-widget-09804.mjs`: grün.
- `test-climate-section-09800.mjs`: grün.
- `test-travel-planner-era5-seamless-units-09652.mjs`: grün, einschließlich Klimaböen in kt und Cache v7.
- `test-ios-safe-area-header-096671.mjs`: grün; kanonische CSS-Aggregate synchron.
- `test-versioning.mjs`: grün; v0.9.82.0 korrekt als Funktionsstand erkannt.
- `test-release-lineage.mjs`: grün.
- `test-maintenance-07821.mjs`: grün.

## Syntax / Release
- `ClimatePanel.tsx`: TypeScript-Transpile-Syntaxprüfung grün.
- `travelPlanner.ts`: TypeScript-Transpile-Syntaxprüfung grün.
- `worker.js`, `worker/metar-proxy.js`, `public/service-worker.js`, `public/sw.js`: `node --check` grün.
- Worker-Fachlogik gegenüber v0.9.81.2 unverändert; nur Releaseversion synchronisiert.

## Fachliche Punkte
- Historische Tageshöchstböe wird optional über `wind_gusts_10m_max` angefragt.
- Fällt diese Variable aus, bleibt der bisherige Klimadatensatz verfügbar und Böen-UI wird nicht angezeigt.
- Windrose: Umschalter Wind/Böen nur bei vorhandenen Daten; Richtung bleibt tägliche Hauptwindrichtung.
- Stärkste Böe des gewählten Zeitraums und der Monatszeiträume wird aus der ERA5-Reanalyse ausgewiesen.
- Niederschlags- und Schneefalltage werden ganzzahlig gerundet.
- Klima-Tooltip auf 272 SVG-Einheiten verbreitert und zweizeilig angeordnet; Werte bleiben innerhalb der Tooltip-Fläche.

## Bewusst nicht ausgeführt
- Kein vollständiges `npm ci`/Vite-Produktionsbuild, da die Projektabhängigkeiten im isolierten Container nicht installiert sind. Für die Änderung wurden stattdessen die betroffenen Regressionen, Aggregate und TypeScript-Syntax geprüft.
