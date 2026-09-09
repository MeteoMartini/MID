# MID v0.9.84.7 – Widget-Kurvenübersicht

Die Widget-Kurvenübersicht verwendet für Tageskopf, Skybar und Diagramm nun nachweislich dieselbe bereits normalisierte Stundenreihe. Niederschlagsmenge und -phase werden dadurch nicht erneut zeitlich verschoben. Für die Säulen greift zusätzlich ein konservativer Fallback auf die kanonische Gesamtmenge beziehungsweise die Summe der vorhandenen Niederschlagskomponenten.

- Beim ersten Start nach der Korrektur wird Niederschlag in alten Widgetständen einmalig wieder aktiviert; danach bleibt die bewusste Nutzerauswahl erhalten.
- Die Option „Niederschlag“ kennzeichnet in der Kurvenansicht ausdrücklich, dass sie Skybar und Säulen gemeinsam steuert.
- Bei deaktiviertem Niederschlag wird dies auch in der Legende eindeutig ausgewiesen.
- Die feste SVG-Mindesthöhe ist entfernt. Das Diagramm hält sein kanonisches Seitenverhältnis und erzeugt keine künstliche Leerzone mehr.
- Tageskopf, Piktogramme, Tmin/Tmax, Skybar, Kurve, Säulen, Legende und Quellenfuß wurden enger zusammengeführt.
- Das Einstellungsmenü verwendet feste, überlaufsichere Raster, gleich hohe Optionsfelder und volle Select-Breiten.
- Die Tagesauswahl 3, 4, 5, 6 oder 7 sowie alle Optionen bleiben persistent.

Wetterdaten-, Warn-, Export-, Worker-, Sicherheits- und Workflowverträge bleiben unverändert.
