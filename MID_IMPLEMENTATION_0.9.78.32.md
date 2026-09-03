# MID 0.9.78.32

## 14-Tage-Ensemble: progressiver Bootstrap

Die 14-Tage-Ensembledaten werden beim ersten Öffnen nicht mehr erst nach dem vollständigen Acht-Modell-Audit sichtbar. Stattdessen lädt MID parallel zwei schnelle, echte Ensemblepfade:

- priorisierte native Membermodelle mit mindestens 10 Tagen Horizont,
- offizielle Ensemble-Mittel-/Spread-Produkte als probabilistische Reserve.

Sobald mindestens zwei Modellfamilien und sieben auswertbare Tage vorhanden sind, werden die Ensemblewerte sofort angezeigt. Nach 12 Sekunden wird im Hintergrund automatisch die vollständige bisherige Mehrmodell-Auswertung gestartet und ersetzt den Bootstrap, sobald sie verfügbar ist.

`sunshine_duration` gehört nicht mehr zum schnellen Member-Bootstrap, weil die erste 14-Tage-Darstellung nur Temperatur-, Niederschlags- und Windunsicherheit benötigt. Der anschließende vollständige Ensemblepfad fordert die Sonnenscheindauer weiterhin an und fällt bei Bedarf auf die Kernvariablen zurück. Die relative Sonnenscheindauer der 14-Tage-Kacheln bleibt Best-Match-basiert; Ensemble-Sonnenspannen werden ergänzt, wenn die geladenen Modelle sie liefern.

Fehler der Ensemble-Nachladung werden im 14-Tage-Bereich sichtbar gemacht, während der Best-Match-Fallback bestehen bleibt.

## Skybar: keine optischen Lücken bei gleicher Dicke

Die gemeinsame Skybar erhält einen kantenbewussten SVG-Renderer. Direkt aneinanderstoßende Segmente derselben Zeichenlage und Dicke werden an ihrer gemeinsamen Kante nicht mehr beidseitig abgerundet. Dadurch entstehen bei Farb-/Untertypwechseln keine scheinbaren Zwischenräume mehr. Nur die äußeren Enden eines gleichdicken Abschnitts bleiben gerundet.

Die Regel gilt gemeinsam für:

- 24-h-Detailansicht,
- Wetterprofil,
- 7-Tage-Kurvenübersicht,
- Skybar der Tageskacheln.

