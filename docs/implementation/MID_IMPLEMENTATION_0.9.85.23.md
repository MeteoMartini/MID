# MID-C7 · Implementierungsnotiz v0.9.85.23

## Anlass

Die vorhandene MID-Next-Schicht enthielt bereits C3- bis C6-Bausteine, zeigte aber auf großen Ansichten weiterhin überlagerte Navigations- und Arbeitsbereichselemente. C7 schließt diese Integrationslücke, ohne meteorologische Daten, Fusionen, Warnlogik oder gespeicherte Profile zu verändern.

## Umgesetzt

- Eine nachgelagerte, ausschließlich auf `html[data-mid-design='next']` begrenzte C7-CSS-Schicht behebt den Desktop-Offset der Hauptnavigation und hält die mobilen Safe-Area-Regeln getrennt.
- Die Root-Shell kennzeichnet den aktiven modernen Arbeitsbereich. Nicht zum Arbeitsbereich gehörende Prognosehorizonte und Planeroberflächen werden in MID Next nicht gleichzeitig sichtbar.
- Die Aktuell-Ansicht startet ohne gespeicherte Präferenz kompakt; eine explizit gespeicherte Detailansicht bleibt erhalten.
- Ein Regressionstest prüft Importschicht, Arbeitsbereichskennzeichnung, Desktop-/Mobilregeln und die reduzierte Bewegungspräferenz.

## Nicht verändert

Alle Datenquellen, C6-Prognose-Cockpits, Karten-Layer, RUC-/Radarlogik, lokale Einstellungen, klassische Darstellung und vorhandene Interaktionsverträge bleiben unverändert.
