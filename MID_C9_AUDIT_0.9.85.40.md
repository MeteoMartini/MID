# MID-C9 · Prognose-, Tooltip- und Kartenpolitur · v0.9.85.40

Basis: `main = mid-stable = ef114ad2e05c90de405decbc88b2e6b44b14617f`, v0.9.85.39. Konzeptreferenzen: „Aktuelles Wetter“, „Moderne UI-Konzeptübersicht“ und die Nutzeraufnahmen IMG_1850–1852. Dieser Schritt setzt die P1-Punkte aus dem Audit v0.9.85.39 fort.

## Umgesetzt

1. **7 Tage mobil:** Der spätere Hochformat-Breakpoint hatte das zusammenhängende Tagesband wieder in sieben gestapelte Zeilen zerlegt. Das Tagesband scrollt jetzt in Hoch- und Querformat horizontal. Die gewählte Tagesansicht bleibt markiert, die stündliche Vertiefung öffnet innerhalb derselben Fläche und bleibt auf die sichtbare Gerätebreite begrenzt.
2. **14 Tage / Ensemble:** Die drei Parameter sind als zusammenhängende Registerleiste statt als zusätzliche Kachelreihe gestaltet. Temperatur, Niederschlag und Wind behalten ihre kanonischen Farben und Miniaturverläufe.
3. **Touch-Tooltips:** Die historische Kompaktierung bis 7–8 px wird in der finalen Kaskade aufgehoben. Matrix, Metadaten und Werte nutzen 9–12 px, größere Spaltenabstände, 72 dVH Maximalhöhe und Safe-Area-Abstände. Alle vorhandenen Tooltipzeilen bleiben erhalten.
4. **Karten:** Schnelle Layer bilden auf Telefonen eine horizontal scrollbare Instrumentleiste mit mindestens 44 px hohen Zielen. Karten nutzen im Hochformat weniger unnötige Mindesthöhe; im Querformat wird die verfügbare Gerätehöhe abzüglich der Bedienung verwendet. Timeline, Livezustand, Quellen, Legenden und Layersemantik bleiben unverändert.

## Appweiter Reststand

| Priorität | Bereich | Nächster Abnahmeschritt |
|---|---|---|
| P1 | DWD Wolken/Niederschlagsart | Absolute Georeferenz an unabhängigen Stadt-/Küstenankern und Zoomerhalt auf realem iPhone/iPad praktisch nachweisen. |
| P1 | Aktuell/Kopf/Favoriten | Lange Ortsnamen, Warnlage, Ziehen und Rotation auf realen Geräten prüfen. |
| P1 | Heute/Kurzfrist | Touchwahl, sieben Zeitpunkte, Achsengleichlauf und Tooltipposition in flachem Querformat prüfen. |
| P1 | 7/14 Tage | Tagesdetail, Diagrammachsen und sämtliche Tooltipwerte bei 320 px, iPad Split View und Desktop visuell abnehmen. |
| P1 | Karten/Warnungen/Extremwetter | Layer-/Legendenüberlagerung, Beobachtung→Prognose-Übergang, lange Warntexte und kleine Karten-Tooltips praktisch prüfen. |
| P1 | Dialoge/Overlays | Tastatur, Safe Areas, große Schrift und Schließen im flachen Querformat prüfen. |
| P2 | 46 Tage/Saison/Klima | Ergebnisflächen, Modellmetadaten, Steuerung und Diagrammlegenden weiter vereinheitlichen. |
| P2 | Mehr/Planer/Fachprofile | Einstiegsdichte, Formulare, Berg-/Wasser-/Flugflächen und progressive Details an das gemeinsame Arbeitsraummuster angleichen. |
| P2 | Prognosegüte/Widget/Export | Auswahl, Quellenstatus und Generatorbedienung harmonisieren; Exportmaße unverändert verifizieren. |

## Prüfung

- Produktionsbuild mit TypeScript.
- Bestehende Forecast-, Ensemble-, Karten-, Overlay-, Safe-Area- und Release-Regressionen.
- Produktions-CSS-Kaskade für 320×568 Hochformat und 844×390 Querformat mit `tools/qa/check_c9_workspace_css.py`.
- Fachlogik, Wetterdaten, Warnschwellen, Modellfusion, Parameterfarben und DWD-Geokalibrierung wurden nicht geändert.
