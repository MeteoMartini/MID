# MID v0.9.84.31 – Implementierungsnotiz

## Prognose-Einstiege
- Gemeinsame Einstiegsgestaltung für Kurzfrist, Prognose-Cockpit, Warnungen, Langfrist und Reiseplaner verfeinert.
- 90 min / 24 h auf kleinen Displays als gleichbreite, gut erreichbare Segmente.
- Prognose-Horizontnavigation horizontal scroll- und snapfähig, ohne Umbruch.

## 7 / 14 Tage
- 7-Tage-Niederschlagswerte verwenden den appweiten Parameterfarbvertrag.
- 14-Tage-Hochformat: lesbarere Typografie, größere Tracks und Piktogramme.
- 14-Tage-Querformat bis 1024 px: feste Kartenbreite mit horizontalem Scrollen statt sieben stark gequetschter Spalten.

## Tagesansicht
- Niederschlagsbalken erhalten Phasenfarbe über `precipitationPhaseColor` sowie die vorhandenen Regen-/Schnee-/Misch-/Gewittermuster.
- Intensität beeinflusst Deckkraft und Konturstärke, ohne die Niederschlagsmenge selbst zu verändern.

## Releasefehler
- Ungenutzter `date`-Parameter aus `mediumDay` entfernt; damit entfällt der konkrete TypeScript-Blocker aus dem fehlgeschlagenen Release-Lauf.

## Worker
- Keine fachliche Workeränderung.
