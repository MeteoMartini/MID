# MID 0.9.84.70 – Testbericht

## Erfolgreich ausgeführt
- neuer App-weite-Designabdeckungstest 098470
- neuer Visualisierungs-Lesbarkeitstest 098470
- Apple-Adaptive-Designvertrag 098469
- UI-Audit-Standardisierung 098462
- Klima-Modul
- DWD-Radar/Meteogramm-Ausrichtung
- Ensemble-Achsen sowie Temperatur-/Niederschlagsachsen
- Langfrist-Untersektionen / relative Sonnenscheindauer
- Synoptik Isohypsen-Sichtbarkeit und Konturpfadoptionen
- Flugmeteorologie
- Events progressive Offenlegung
- Reise-Center-Lesbarkeit
- Wetterkarten-Modul
- appweite Touch-Responsivität
- iOS Safe Area und iOS Resume/Ortserhalt
- appweiter Parameterfarbvertrag
- appweiter Wetterpiktogrammvertrag
- Water-Current-Richtungspfeil
- Cockpit-Responsivität und Current-Nowcards
- Versionierung und Release-Lineage
- `node --check` für Worker, Worker-Aggregat und beide Service Worker
- CSS-Parsing mit `tinycss2` für `30-modern.css` und das aggregierte `styles.css`

## Lokal nicht ausführbar
Einige ältere Quelltests (`ensemble-tooltip-axis-device-layout`, `synoptic-module`, `location-thunder-water-tide-layout`, `water-tide-tooltip-layering`) benötigen `typescript-strada`. Das Release-ZIP enthält bewusst kein `node_modules`; daher brechen diese lokal bereits beim Laden der Testabhängigkeit ab und nicht an einem fachlichen Assert. Der GitHub-Installer stellt die Projekttoolchain mit `npm ci` bereit und führt dort den vollständigen TypeScript-/Vite-/Regressionslauf aus.

## Ergebnis
Die lokal ausführbaren, für diese Änderung relevanten Verträge bestehen. Keine meteorologische Produktionslogik wurde verändert.
