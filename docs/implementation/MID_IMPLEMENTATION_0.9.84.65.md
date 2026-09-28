# MID 0.9.84.65 – Kopfzeile, Suche und Favoriten

## Ziel
Der in 0.9.84.62 begonnene komponentenweise Design-/Konsistenzaudit wird im obersten App-Bereich fortgesetzt. Im Fokus stehen iOS-/iPadOS-Touchziele, semantische Lesbarkeit und eine konsistente Hierarchie zwischen Standardkopf und optionalem Bottom-Tab-Layout. Wetter- und Favoritenfunktionen bleiben unverändert.

## Verifizierte Arbeitsbasis
Vor der Bearbeitung standen GitHub `main` und `mid-stable` beide auf dem erfolgreich installierten Release v0.9.84.63 (`2cd906011280d917929e357f8031c85b74a520f3`). Der unmittelbar zuvor erzeugte lokale Wartungsstand v0.9.84.64 enthielt ausschließlich den Reise-Center-Lesbarkeitspatch und wurde als fortzusetzender Delta-Stand verwendet.

## Befund
- Im optionalen Bottom-Tab-Layout wurden Favoriten-Schnellzugriffe und der Verwaltungsbutton auf 30 px Höhe reduziert, obwohl Suche und Hauptaktionen dort bereits 44 px nutzen.
- Der Suchfeld-Schließen-/Leeren-Button lag im Standardkopf nur bei 30 px.
- Favoriten-Untertexte und Statuskennzeichen lagen teils bei 7–8 px; Such-/POI-Kennzeichen ebenfalls bei 8 px.
- Der sichtbare Drag-Griff der Favoritenleiste war nur 12 px breit.
- Regel-, Berg- und Wasserprofil-Beschriftungen der Favoritenverwaltung verwendeten noch historische 8–9-px-Einzelwerte.

## Umsetzung
- Suchfeldaktion auf 36 px angehoben; auf `pointer: coarse` 40 px.
- Favoriten-Schnellzugriffe im Standardkopf mindestens 40 px hoch; im besonders kompakten Bottom-Tab-Layout mindestens 36 px und auf Touchgeräten 40 px.
- Favoriten-Verwaltungsbutton auf dieselben Mindestgrößen harmonisiert.
- Untertexte und Statuskennzeichen auf die bestehenden MID-Typografietokens `micro/xs/sm` umgestellt.
- POI-/Favoriten-Badges in der nachgeladenen `v078.css` ebenfalls auf `--mid-text-micro` standardisiert, damit die spätere Legacy-CSS-Schicht die neue Typografie nicht wieder überschreibt.
- Drag-Griff auf 16 px, auf groben Touch-Pointern 20 px verbreitert; die Reihenfolge kann weiterhin per Drag-and-drop oder in der Verwaltung per Pfeiltasten geändert werden.
- Beschriftungen in Regel-, Berg- und Wasserprofilen der Favoritenverwaltung auf die semantische XS-Typografie angehoben.

## Funktionsschutz
Unverändert bleiben insbesondere Standortbestimmung, aktive Ort-/Favoritenauswahl, Persistenz, Gruppen, Standardort, Maus-/Touch-Drag-and-drop, Pfeiltasten-Reihenfolge, Berg-/Ski- und Wasserprofile, Event-Favoriten-Trennung, Suchquellen, Wetterabruf, Warnungen, Piktogramme, Modellfusion sowie Worker-Fachlogik.

## Regression
Der neue Pflichtvertrag `scripts/test-header-favorites-readability-098465.mjs` schützt Mindestgrößen, semantische Typografie, den erweiterten Drag-Griff, Standort-/Favoritenfunktionen und die bytegleiche Synchronität des aus den fünf kanonischen CSS-Modulen erzeugten `src/styles.css`.
