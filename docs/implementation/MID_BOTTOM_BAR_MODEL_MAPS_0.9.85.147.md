# MID 18.2.23 · v0.9.85.147 — Bottom-Bar-Stabilität und Modellkarten-Polish

## Ausgangsbasis

- Verifizierte Source-of-Truth: `main` = `mid-stable` auf `a5b6d72a7cebfd7a461346a89b9bd5776e4925c8` (v0.9.85.146).
- Replit wurde vor der Umsetzung geprüft, lag aber weiterhin auf v0.9.85.144 und wurde weder als Codebasis noch als Designquelle zurückgemischt.

## Mobile Bottom-Bar

- Der veraltete scrollabhängige Hidden-State wurde aus der React-Navigation entfernt.
- Die mobile Hauptnavigation bleibt dauerhaft `position: fixed` und gibt keinen scrollabhängigen Transform-Zustand mehr aus.
- Die finale mobile CSS-Schicht deaktiviert Transform-/Transition-/Will-change- und Backdrop-Blur-Effekte, die auf iOS/Safari die feste Ebene beim Scrollen sichtbar versetzen können.
- Safe-Area-Abstände, fünf Navigationsziele, Touchflächen und aktive Zustände bleiben erhalten.

## Modellkarten

- Die bestehenden DWD-WMS-/Rasterkarten erhalten eine klare Produktidentität mit Produktfamilie, Modell, Datenquelle und Analyse-/Vorhersagestatus.
- Modell, Kartenprodukt und Kartenbasis bleiben dieselben fachlichen Auswahlen; die Produktauswahl wird visuell priorisiert.
- Karte, Zeitachse, INIT/Gültig, Druckfläche/Höhe, Deckkraft und Quelleninformationen bleiben unverändert funktional.
- Die neue Gestaltung ist responsiv für Smartphone, Tablet und Desktop und verändert keine meteorologischen Parameter, Quellen, Schwellen oder Zeitschritte.
- Niederschlagssummenkarten und native Direktkarten bleiben fachlich getrennte Darstellungen; die ältere Kartenfamilie wird lediglich gestalterisch an deren Qualitätsniveau angenähert.

## Regression

- Bestehende Bottom-Bar-Regression schützt nun ausdrücklich gegen die Rückkehr eines scrollabhängigen Hidden-State sowie gegen compositor-sensitive Transform-/Blur-Regeln.
- Bestehende Wetterkarten-Regression schützt Produktkopf, priorisierte Produktauswahl, Classic-Layout und den neuen späten CSS-Polish-Layer.
