# Designaudit A3 v0.9.85.387 – Niederschlagsintegrität im 7-Tage-Tagesdetail

## Provenienz
Verifizierte Version .386: `main=mid-stable` @ `b6eba7bea8a42bc78841955b3eeac8a392510d12`. Neuer, SHA-gebundener `chatgpt/v0.9.85.387-design-a3-precipitation-integrity`; keiner der separaten Drafts #542 (RUC) und #543 (Cleanup/KNMI) wurde berührt.

## Geprüfte Datenidentität und Zielzustand
- **Niederschlag:** mm je endgestempeltem Providerintervall, sichtbar ab Slotbeginn. Fehlend ist nicht 0 mm; negative/ungültige Daten sind kein valider Beitrag.
- **PoP:** 0–100 % je exakt demselben Vorwärtsintervall. Echte 0/100 % bleiben erhalten; null/NaN/Infinity/Text/negativ/über 100 werden als unbekannt gekennzeichnet.
- **Aggregation:** Im 3h-Raster nur gültige, lückenlose beitragende Stunden; in Tagessummen als Ersatzprodukt nur vollständig abgedeckte absolute lokale Kalendertaggrenzen, einschließlich 23-/25h-Tage. Die vorgelagerte Provider-Stunden-Vollständigkeit muss zusätzlich nachgewiesen sein.
- **Visualisierung:** Die bestehende Farbe und gestrichelte Linie aus `parameterLineStyle('probability')` bleibt identisch; SVG-Pfade werden an fehlenden Punkten segmentiert. Marker, Kurzwerte, Stundenlisten und zugängliche Tooltips verwenden dieselben validierten Eingänge. Keine Wetter-/Warnsymbolik geändert.

## Implementierungsorte
`src/App.tsx`, `src/precipitationAvailability.ts`, die unverändert verbindliche `MID_PRECIPITATION_INTERVAL_CONTRACT.md`. Bestehender Test `scripts/test-precipitation-forward-geometry-097916.mjs` bewahrt weiterhin die Vorwärtsgeometrie. Neuer Pflicht-Regressionstest `scripts/test-design-a3-precipitation-integrity-0985387.mjs` verifiziert Datenlücken, Überlappungen, 23/24/25h, 0/100 %, NoData und Renderer-Verkabelung.

## Auditgrenze
Die Quelle wurde korrigiert, aber keine echte Browser-/Geräte-/VoiceOver-Screenshotabnahme vorweggenommen. Ein Test der SVG-Pfadverfügbarkeit ersetzt keinen visuellen Layer-/Tooltip-Check bei 320–1920px, Light/Dark und Touch/Keyboard. Alle übrigen 19 Module, Karten, Widgets, URL/PNG/SVG und die appweite Parameter-Matrix bleiben offen unter Issue #523.
