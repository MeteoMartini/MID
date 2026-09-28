# MID v0.9.6.0

## Ziel
Der Prognose-Einstieg wird ohne technische Erklärbalken sofort lesbar. Gleichzeitig wird die zentrale Niederschlagslogik app-weit fachlich vereinheitlicht und unterscheidet stratiformen und konvektiven Niederschlag anhand der tatsächlich verfügbaren Modellfelder statt allein anhand eines Wettercodes.

## Prognose-Cockpit
- Nichtssagende blaue Platzhalterbalken der geschlossenen Kurzfrist-Sektion entfernt.
- Geschlossene Kurzfrist-Sektion zeigt nun vier konkrete Schlüsselzeitpunkte mit Wetterzustand, Temperatur sowie relevanter Niederschlags- oder Böeninformation.
- Unpassende Erklärung „Blaue Balken …“ oberhalb des Temperaturdiagramms entfernt.
- Erweiterte Kurzfristansicht erhält drei sofort lesbare Schwerpunktfelder für Temperatur, Niederschlag und Wind.
- Niederschlagsbalken erscheinen nur bei tatsächlich prognostizierter Menge; reine Wahrscheinlichkeiten werden nur bei meteorologisch relevantem Signal angezeigt.
- Kurzfrist-Zusammenfassung nennt Trocken-/Nassfenster, Temperaturspanne und stärkste Böe mit Zeitpunkt.

## Sieben Tage
- Nicht intuitive abstrakte Phasen- und Farbbalken entfernt.
- Jeder Tag erhält eine direkt benannte Wetterkategorie: Regenreich, Schauer, Windig, Sonnig, Warm oder Ruhig.
- Tageskacheln zeigen Niederschlagsmenge und Wahrscheinlichkeit unmittelbar statt über eine schwer interpretierbare Farbleiste.
- Die kompakte Ribbon-Vorschau zeigt Wochentag, Wetterpiktogramm und Höchsttemperatur.
- Mobile Einfärbungen dienen nur noch der unterstützenden Gruppierung; Text, Symbol und Werte bleiben die primäre Information.

## Wissenschaftliche Niederschlagsklassifikation
- Zentrale Klassifikation `classifyPrecipitationCharacter` für konvektiv, stratiform, gemischt oder unbestimmt ergänzt.
- Explizite Modellkomponenten `rain` und `showers` besitzen Vorrang vor abgeleiteten Indizien.
- Wettercode, CAPE, Lifted Index, CIN, Bewölkung, tiefe Bewölkung, Feuchte, Sonnenscheindauer und Tageszeit werden nur als konsistente Zusatzbelege verwendet.
- CAPE allein darf einen explizit stratiformen Modellniederschlag nicht in Schauer umdeuten.
- Ausgewogene direkte Anteile aus Regen und Schauern bleiben als Mischcharakter erhalten.
- Unplausibler Sprühregen oder Schneegriesel wird nur bei passender tiefer Schichtbewölkung/Feuchte beibehalten; andernfalls erfolgt eine konservative Verallgemeinerung.
- Niederschlagsart, Wettercode und Komponenten werden nach Fusion, Tagesaggregation und Worker-Verarbeitung gemeinsam konsistent gehalten.

## Datenpfade
- Open-Meteo-Tagesdaten um Regen-, Schauer-, Schneefall-Summen und Niederschlagsstunden erweitert.
- Stundenpfade führen Feuchte, CAPE, Lifted Index, CIN, Sonnenscheindauer und Tag/Nacht bis in die zentrale Plausibilisierung.
- Forecast-Fusion, Kurzfrist, Meteogramm, Native-Widget-Feed und Push-Vorhersage verwenden dieselbe zentrale Systematik.
- Worker-Fusion liefert und reconciliert Regen, Schauer und Schneefall getrennt.

## Version
Funktionsrelease v0.9.6.0, da sowohl die sichtbare Prognoseoberfläche als auch die app-weite fachliche Niederschlagsklassifikation und Worker-Datenverarbeitung substanziell erweitert wurden.
