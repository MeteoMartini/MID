# MID v0.9.84.6 – Widget-Zeitraum 3–7 Tage

Die eigenständige Widget-Kurvenübersicht bietet jetzt die fünf auswählbaren Zeiträume **3, 4, 5, 6 und 7 Tage**.

- Die Auswahl verwendet weiterhin den kanonischen `SevenDayCurveOverview`-Renderer.
- Alle fünf Werte werden unter `mid:0.7.1:widget-settings` gespeichert und beim nächsten App-Start wiederhergestellt.
- Alte oder ungültige gespeicherte Werte fallen sicher auf 7 Tage zurück.
- Kartenansicht und Kurvenansicht behalten dieselbe Auswahl; die Kurvenbreite passt sich an die gewählte Tageszahl an.
- Datenpfad, Piktogramme, Tmin/Tmax, Skybar, Temperaturkurve, Niederschlagsbalken, Hazards und Export bleiben unverändert.

Die Erweiterung ersetzt keine Sicherheits-, Worker- oder Workflow-Verträge.
