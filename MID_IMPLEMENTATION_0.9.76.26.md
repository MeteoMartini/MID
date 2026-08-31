# MID v0.9.76.26 – mobile Gewitter-Ortsliste verdichtet und DWD-Stecknadel korrigiert

## Anlass
Im mobilen Hochformat war die Gewitterkarte „Betroffene Orte & Zugbahn“ weiterhin zu lang. Bereits wenige aktuelle und vorausliegende Orte führten zu einer ellenlangen Liste, obwohl für die schnelle Lageeinschätzung vor allem die **aktuell betroffenen Orte** und die **nächsten Orte auf der Zugbahn** relevant sind.

Zusätzlich war in der DWD-Ansicht „Wolken + Niederschlagsart“ der gewünschte Standort-/Favoritenanker noch immer nicht als klare **Stecknadel (📍)** sichtbar, sondern wirkte weiterhin wie ein runder Marker.

## Umsetzung
- Die Ortsliste wurde in eine verdichtete Struktur mit drei Ebenen überführt:
  - **Zusammenfassungs-Pills** für Anzahl aktuell betroffener Orte, Orte auf der Zugbahn und weitere Einträge.
  - Abschnitt **„Jetzt im Zellbereich“** mit den direkt aktuell betroffenen Orten.
  - Abschnitt **„Nächste Orte auf der Zugbahn“** mit den frühesten erwarteten Annäherungen.
- Im kompakten Modus werden nur die relevantesten Zugbahn-Orte sichtbar gehalten; längere Listen werden deutlich früher gekappt.
- Im ausführlichen Modus landen zusätzliche Orte nicht mehr sofort sichtbar in einer endlosen Liste, sondern in einem aufklappbaren Bereich **„Weitere Orte anzeigen“**.
- Die mobile Darstellung wurde CSS-seitig dafür auf gruppierte Karten statt einer durchgehenden Endlosliste optimiert.
- Der DWD-Ortsanker wird jetzt als echte freigestellte **Stecknadel (📍)** gerendert.
- Die Stecknadel bleibt klickbar für die Bildpunktauswertung, legt aber keinen Ortsnamen mehr über das Radarbild.

## Wirkung
- Im mobilen Hochformat ist die Gewitter-/Zugbahninformation schneller erfassbar.
- Die wichtigsten Orte stehen oben, die restlichen Orte bleiben erreichbar, aber stören die Primärsicht nicht mehr.
- Der Standort-/Favoritenort ist in der DWD-Karte nun eindeutig als **Stecknadel** zu erkennen.

## Validierung
- Neue Regression: `scripts/test-thunder-mobile-place-summary-pin-097625.mjs`
- Angepasste Regression: `scripts/test-weather-profile-cell-gaps-day-wind-pin-097620.mjs`
- Zusätzlich geprüft: TypeScript-/Vite-Build, strukturierter Frontend-Diff ohne fachliche Worker-Logikänderung.

## Worker-Upload
Kein manueller **Worker-Upload** erforderlich. Fachlich wurde nur die App-/UI-Darstellung angepasst; eine etwaige Workersynchronisierung betrifft lediglich die gemeinsame Versionskonstante.
