# MID v0.9.84.5 – eigenständige Widget-Kurvenübersicht

## Umsetzung

- Die Widget-Auswahl `Kurvenübersicht` verwendet jetzt den kanonischen `SevenDayCurveOverview`-Renderer der App statt eines parallelen, vereinfachten Widget-Kurvenpfads.
- Der Modus ist vollständig eigenständig: Die bisherigen Tageskarten werden in dieser Ansicht nicht zusätzlich gerendert.
- Der Zeitraum bleibt auf 3 oder 7 Tage wählbar und wird wie die übrigen Widgetoptionen unter `mid:0.7.1:widget-settings` gespeichert.
- Tageskopf, Datum, Wetterpiktogramm, ECMWF-basierte Tmin-/Tmax-Pillen, geglättete Temperaturkurve, gerundete Skybar-Segmente, Nachtbereiche und stündliche Niederschlagssäulen folgen damit derselben visuellen und fachlichen Grundlage wie die 7-Tage-Ansicht.
- Niederschlag und Sonnenschein können auch in der Kurvenansicht über die bestehende Optionsgruppe gesteuert werden; Wind- und Hazardoptionen bleiben für die kompakte Tagesansicht verfügbar.
- Die Darstellung ist für das dunkle Referenzdesign optimiert und bleibt auf hellen Themes sowie in mobilen Hoch-/Querformaten responsiv.

## Bewusste Nichtänderungen

- Der kanonische Wetter-, Niederschlags- und Piktogrammkern wird nicht dupliziert und nicht fachlich verändert.
- Native WidgetKit-, Worker-, App-Group- und Persistenzverträge bleiben unverändert.
- Bestehende Export-/Zwischenablagepfade und die klassische kompakte Tagesansicht bleiben erhalten.
