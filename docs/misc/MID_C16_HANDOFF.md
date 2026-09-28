# MID C16 Handoff · v0.9.85.36

## Ausgangspunkt

- Stabile Basis: MID v0.9.85.35 (`25c508e1ccbedc3c2fbf8ad4434ff1f9b7876ac8`).
- Anlass: realer iPhone-Sichtvergleich unter „Heute“. Das 24-h-Wetterprofil behielt auf ~402-CSS-px breiten Geräten 632 CSS-px Diagrammhöhe und wirkte dadurch gegenüber der Breite sichtbar überdehnt.

## C16-Änderung

- `ForecastCockpit` führt eine gemeinsame responsive Y-Skalierung für sämtliche 24-h-Spuren ein: <=560 px 72 %, 561–860 px 86 %, darüber 100 %.
- Zeitachse, Solarereignisse, Wetterpiktogramme, Wolken, Temperatur, thermisches Empfinden, Niederschlag, Wind/Böen, Luftdruck und Hazards folgen derselben Geometrie. Es wird keine einzelne Kurve isoliert verzerrt.
- Der DWD-Originalbildbereich verwendet einen expliziten Toggle und startet verlässlich geschlossen. Browser-Wiederherstellung eines nativen `details`-Zustands kann das große Bild nicht mehr ungefragt öffnen.
- Kurzfrist-Zusammenfassung und 90-Minuten-Kopfzeile sind gegen abgeschnittene Texte auf schmalen Geräten abgesichert.
- Keine meteorologischen Daten, Schwellen, Quellen, Nowcast-/RUC-Gewichtungen, WMO-/DWD-Semantik oder Parameterfarben geändert.

## Veröffentlichung

- Ausschließlich Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → GitHub Pages → Stable-Promotion.
- Eine Veröffentlichung gilt erst dann als erfolgreich, wenn installierter `main`-Commit, Pages und `mid-stable` auf denselben Release-SHA zeigen.

## Fortsetzung

- Nach Stable-Promotion reale iPhone-/iPad-/Landscape-Sichtprüfung von „Heute“ fortsetzen.
- Danach den nächsten noch nicht vollständig konzeptkonformen Seitenabschnitt entlang des Redesign-Fahrplans bearbeiten; keine Rückkehr zum alten Kachel-/Kartenlayout.
