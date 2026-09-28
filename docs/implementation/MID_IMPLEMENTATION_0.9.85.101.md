# MID 0.9.85.101 · MID 18.2.13 · Sky-Kohärenz, Nacht-Skybars und Kartenfokus

## Anlass
Die aktuelle Wetterkarte konnte bei frischen Stationsdaten Text und Piktogramm aus unterschiedlichen Bewölkungsquellen ableiten. Zusätzlich wurde ein numerischer DWD-SYNOP-`present_weather`-Wert wie ein Open-Meteo-`weather_code` behandelt; dadurch konnte insbesondere SYNOP ww=3 fälschlich als „Bedeckt“ erscheinen. In den 7-/14-Tage-Tageszeilen fehlte außerdem die bereits in anderen Zeitprofilen etablierte Nachtkennzeichnung. Der transiente PWA-Installationshinweis konnte Karteninhalte überlagern.

## Umsetzung
- Frische beobachtete Gesamtbewölkung steuert Zustandslabel, Wettercode und Hauptpiktogramm gemeinsam. Modellierte Low-/Mid-/High-Schichten werden in diesem Fall nicht in das beobachtungsbasierte Hauptsymbol gemischt.
- Ohne ausreichend aktuelle Gesamtbewölkungsbeobachtung verwenden Label und Piktogramm gemeinsam den Modellhintergrund einschließlich dessen Wolkenschichten.
- Numerische SYNOP-ww-Codes 0–3 werden als eigene Codetabelle behandelt und nicht mehr direkt an `label(0…3)` weitergereicht. Reale textuelle METAR/SYNOP-Erscheinungen und bestehende Sicht-/Niederschlagsprioritäten bleiben erhalten.
- Die Bewölkungs-Detailinformation zeigt die verwendete Messquelle samt Beobachtungszeit/Alter oder kennzeichnet den Modellfallback.
- Ein gemeinsamer Tages-Skybar-Nachtlayer projiziert `solarTimelineWindow` auf die Skybar-Geometrie. 7-Tage-Tageskarten und 14-Tage-Zeilen verwenden denselben Nachtfarb- und Fade-Vertrag in Band- und Quadratansicht.
- Der automatische PWA-Installationshinweis wird im aktiven Karten-/Kompositbereich nur temporär ausgeblendet. Der manuelle Installationsknopf und ein bereits geöffneter Installationsdialog bleiben davon unberührt.
- Wetterdaten, Modellfusion, Warnschwellen und Worker-Datenlogik werden nicht verändert.

## Prüfung
- Neue Regression: `scripts/test-mid-18-2-13-sky-coherence-night-skybars-install.mjs`.
- Bestehende Current-Observation-, Wetterpiktogramm-, Skybar-, Responsive-, Produktionsbuild- und iOS-Hüllenverträge werden im Source-PR-Gate vollständig erneut ausgeführt.
- Visuelle Replit-Abnahme folgt auf dem geprüften Quellstand für Smartphone und Desktop in Light/Dark.
