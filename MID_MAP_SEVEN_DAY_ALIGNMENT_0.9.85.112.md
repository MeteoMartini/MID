# MID v0.9.85.112 – Kartensteuerung und 7-Tage-Desktopausrichtung

## Ausgangsbasis
- Verifizierte Releasebasis: `mid-stable = main = a6afde4ce9e38965ea484a0c9c81b95bdd3dc2af`.
- Kontrollierter Replit-Handoff: `replit/mid-map-controls-seven-day-alignment-v0985111`.
- Verifizierter Handoff-Commit: `3148e8f3a66b433746bfe37452c786f01bec6499`, direkter Parent der Stable-Basis.
- Der Handoff enthält ausschließlich den neuen responsiven UI-Layer und dessen Import.

## Sichtbare Änderungen
1. Mobile/touchbasierte Kartensteuerung
   - Zoom, Positionszentrierung und Layersteuerung teilen dieselbe rechte Kante.
   - Touch-Ziele werden auf mindestens 44 CSS-Pixel vereinheitlicht.
   - Außen- und Vertikalabstände sowie Safe-Area-Bezug werden konsistent.
   - Attribution/Quellenleiste bleibt räumlich getrennt.

2. 7-Tage-Kurvenübersicht auf Desktop
   - Alle sieben Tagesbereiche werden als gleich breite Segmente gerendert.
   - Linker und rechter Rand werden an die tatsächlichen Plotgrenzen der gemeinsamen Zeitachse angeglichen.
   - Tagesdetails nutzen die volle gemeinsame Breite und verursachen keinen horizontalen Überlauf.

## Nicht geändert
Keine meteorologische Fachlogik, Datenquelle, Warnschwelle, Worker-Fachlogik, iOS-Funktion, Release-Governance oder CI-Sicherheitsregel wurde durch den Replit-Handoff geändert.

## Prüfung
Die bestehende responsive Zielmatrix bleibt verbindlich: 390×844, 430×932, 412×915, 834×1194, 1194×834 und 1440×900, jeweils Light/Dark. Der neue Regressionstest `scripts/test-mid-18-2-20-map-seven-day-alignment-0985112.mjs` schützt die zentralen Layoutverträge.
