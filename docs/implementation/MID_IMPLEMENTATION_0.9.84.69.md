# MID 0.9.84.69 – Implementierungsnachweis

## Ausgangsbasis
- Unmittelbar vor Beginn standen GitHub `main` und `mid-stable` auf dem erfolgreich installierten MID-Stand v0.9.84.68, Commit `c53b8ccc1a424b91a53739be2d58d7fc8518013f`.
- Arbeitsbasis war der dazugehörige Professional-Stand v0.9.84.68.
- v0.9.84.69 ist ein reiner Design-/WebApp-Wartungsstand. Die in v0.9.84.68 integrierten Open-Meteo-/Worker-Änderungen bleiben unverändert erhalten.

## Apple-2026-Vertrag für die WebApp
MID übernimmt die aktuellen Apple-Grundsätze nicht als optische 1:1-Kopie einer nativen App, sondern als verbindliche responsive WebApp-Regeln:
- Layoutentscheidungen richten sich nach verfügbarer Breite/Höhe und Eingabemethode statt allein nach Gerät oder Orientierung.
- Safe Areas bleiben für Dynamic Island, Home-Indikator und Fensterränder berücksichtigt.
- Häufige Touchaktionen verwenden 44 px Mindesttrefferfläche als pragmatische Web-Abbildung der von Apple empfohlenen 44 pt. CSS-Pixel und Apple-Points werden dabei ausdrücklich nicht gleichgesetzt.
- Bei Maus/Trackpad darf die Oberfläche kompakter bleiben; sobald auf einem iPad zusätzlich Touch verfügbar ist (`any-pointer: coarse`), bleibt die Touchreserve erhalten.
- Sekundäre Informationen werden über Scrollbereiche, Drawer und bestehende Disclosure-Elemente zugänglich gehalten, statt Funktionen auszublenden.
- Glass/Transparenz bleibt auf Navigation und Kontrollflächen konzentriert; Inhaltskarten werden nicht pauschal mit Glas-Effekten versehen.

## Typografie
- Semantische UI-Tokens auf eine belastbarere Hierarchie angehoben: `micro` 11 px, `xs` 11.5 px, `sm` 12 px, `meta` 13 px, `body` 14 px, `label` 14 px.
- Der Compact-Modus unterschreitet bei normalen UI-Mikrotexten 11 px nicht mehr.
- SVG-/Diagrammachsentexte bleiben ein eigener dichter Visualisierungsvertrag; sie wurden nicht global auf 11 px gezwungen, damit Skalen und Kurven nicht kollidieren.
- Einstellungen, Systemupdate, Planner, More-Drawer, Quellenhinweise und Istwetter-Metadaten wurden auf die neue Hierarchie angehoben.

## Navigation und Eingabe
- iPhone/kompakte Breiten: Fünf-Bereiche-Bottom-Navigation mindestens 58 px hoch und mit 11-px-Labels.
- Breite, niedrige Fenster: eigener `max-height`-Vertrag reduziert die Leiste kontrolliert auf 50 px, ohne die Beschriftung wieder auf Mikrotypografie zu drücken.
- iPad/kompakter Desktop 851–1120 px: 72-px-Seitenrail mit Safe-Area-Abstand; Inhalt erhält entsprechenden Einzug.
- Breitere Desktopfenster: beschriftete Seitenleiste bleibt erhalten, Safe-Area und zentrierter Maximalcontainer werden berücksichtigt.
- Appweite Controls erhalten 44 px Mindesthöhe/-breite bei Touch bzw. mindestens 32 px bei reinem Fine-Pointer. Standard-Press-State wurde ergänzt.

## 14-Tage-Prognose
- Auf Breiten bis 1024 px werden die Karten nicht mehr auf 156 px plus 6–8-px-Schrift zusammengedrückt.
- Stattdessen 188–196 px breite horizontale Scroll-Snap-Karten mit 11–15-px-Inhalten.
- Wetterregime, Tmin/Tmax, Niederschlag, Sonne, Wind, Konsistenz und Infofunktion bleiben vollständig vorhanden.
- Der Info-Button erhält 44 × 44 px Trefferfläche.

## Start-/Recovery-Oberfläche
- Boot-Recovery-Aktionen von 40 px auf 44 px Mindesthöhe erhöht und typografisch leicht angehoben.
- `viewport-fit=cover`, vorhandene Apple-PWA-Metadaten und Theme-/Logo-Startlogik bleiben unverändert.

## Funktionsschutz
Unverändert bleiben insbesondere Wetterdaten, Modellquellen und -gewichtung, WMO-/DWD-Terminologie, Wetterpiktogramme, Niederschlagsphasen/-farben, Warnschwellen, Radar/Nowcast/Komposit, Ensembleberechnung, Favoritenlogik sowie Worker-Fachlogik.
