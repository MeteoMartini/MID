# MID 0.9.84.72 – Testbericht

## Erfolgreich lokal ausgeführt
- neuer Header-/Istwetter-Dichtevertrag `test-current-header-density-098472.mjs`
- Mobile Current Hero
- Current Layout/Module Controls
- Current Metrics Collapse
- Current More/Hazard Caption
- kompakte Datenbasis der hyperlokalen Analyse
- Current Source Info Type Safety
- iOS Safe-Area Header
- Header/Favoriten-Lesbarkeit
- Apple-Adaptive-Designvertrag 098469
- appweite Designabdeckung 098470
- Visualisierungs-Audit Block 1 und Block 2
- UI-Audit-Standardisierung 098462
- appweite Parameterfarben
- appweiter Wetterpiktogramm-Vertrag
- Versionierung und Release-Lineage
- `node --check` für Worker, Worker-Aggregat und beide Service Worker

## Zusätzliche Prüfungen
- `styles.css` ist byte-identisch zur Verkettung der fünf kanonischen `styles-src`-Module.
- Der neue Vertrag prüft ausdrücklich vollständige Versionsdarstellung, <=360-px-Fallback, Taupunkt-Umbruch, Trennung von Kurzinfo und (i)-Details sowie 44-px-Infoziele.

## Lokal nicht vollständig reproduziert
Das Release-ZIP enthält weiterhin bewusst kein `node_modules`. Der GitHub-Installer stellt mit `npm ci` die projektgebundene TypeScript/Vite-Toolchain bereit und führt die vollständige Suite sowie den iOS-Web-Sync aus.

## Kanonischer Abgleich vor Paketierung
Unmittelbar vor der ZIP-Erstellung standen `main` und `mid-stable` beide auf dem erfolgreich installierten MID 0.9.84.71 (`64dccfafa8f95c35f9668d6e7213d271442414f3`). Der v0.9.84.72-Arbeitsstand ist damit als direkte Fortsetzung des aktuellen Stable-Stands bestätigt.

## Ergebnis
Alle lokal ausführbaren, für diesen Screenshot-/Designblock relevanten Verträge bestehen. Keine meteorologische Produktionslogik wurde verändert.
