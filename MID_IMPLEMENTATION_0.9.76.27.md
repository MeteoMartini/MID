# MID v0.9.76.27 – mobile Gewitter-Zugbahn weiter verdichtet

## Anlass
Die erste Verdichtung der Gewitter-Ortsliste in v0.9.76.26 beseitigte die ungebremste Endlosliste, ließ im mobilen Hochformat aber noch unnötig viel vertikale Höhe zu. Für die schnelle Lageeinschätzung sollen die wichtigsten Orte ohne langes Scrollen sichtbar sein.

## Umsetzung
- Die primär sichtbare Ortsauswahl ist nun unabhängig vom Detailmodus auf **zwei aktuelle** und **drei vorausliegende** Orte begrenzt.
- Aktuell betroffene Orte werden auf schmalen Displays als kompakte Zweierspalte dargestellt.
- Die **horizontale Zugbahn** zeigt die nächsten vorausliegenden Orte als seitlich scrollbar/snapbare Karten statt als weitere vertikale Liste.
- Zusätzliche Einträge bleiben im ausführlichen Modus über „Weitere Orte anzeigen“ vollständig erreichbar.
- Die bereits korrigierte DWD-**Stecknadel** (📍) für Standort/Favoritenort bleibt erhalten.

## Wirkung
Die Gewitterinformation benötigt auf dem Smartphone deutlich weniger vertikale Fläche. Die aktuelle Betroffenheit und die nächsten erwarteten Zugbahnorte bleiben gleichzeitig sofort erfassbar; weitere Ortsdetails werden erst bei Bedarf geöffnet.

## Validierung
- `scripts/test-thunder-mobile-route-cards-097627.mjs`
- `scripts/test-thunder-mobile-place-summary-pin-097625.mjs`
- `scripts/test-weather-profile-cell-gaps-day-wind-pin-097620.mjs`
- `scripts/test-current-nowcards-responsive-096612.mjs`
- TypeScript NoEmit
- Worker-Syntaxprüfung

## Worker-Upload
Kein manueller **Worker-Upload** erforderlich. Die Änderung betrifft ausschließlich Frontend-/Responsive-Darstellung; Workerdateien werden lediglich versionssynchron gehalten.
