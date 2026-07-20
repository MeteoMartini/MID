## 0.7.1

- alle wesentlichen Reihen der 14-Tage-Temperatur- und Niederschlagsdiagramme lassen sich direkt über die Legende einzeln ein- und ausblenden; die Auswahl wird lokal gespeichert
- Tagesdetaildiagramm um einen kompakten stündlichen Verlauf der Gesamtbewölkung einschließlich Wert der gewählten Stunde ergänzt
- Abruf amtlicher Warnungen für Desktop-Browser durch CORS-sicheren Neuversuch, HTTPS-Normalisierung, Cache-Umgehung und verständlichere Fehlermeldung stabilisiert
- Ortssuche akzeptiert Dezimalkoordinaten, deutsche Dezimalkommas sowie N/S/E/W-Angaben und ergänzt den Ortsnamen per Reverse-Geocoding
- Widget-/PNG-Generator speichert Tage, Layout und sichtbare Parameter; angezeigter Ortsname und PNG-Dateiname können je Standort angepasst werden
- Fehler bei der GeoSphere-GeoJSON-Zuordnung behoben: `properties.station` wird nun als Stations-ID erkannt
- GeoSphere Austria/TAWES zusätzlich serverseitig in den gemeinsamen Cloudflare Worker integriert
- Worker nutzt bei nicht verfügbaren Detailparametern automatisch einen reduzierten TAWES-Parametersatz
- mehrere passende österreichische Stationen werden im Frontend robust und höhengewichtet zusammengeführt
- Windwerte aus dem direkten TAWES-Abruf werden vor der Stationsmittelung korrekt von m/s in kt umgerechnet
- METAR- und Stationszeitstempel aus ISO-Text, Unix-Sekunden oder Unix-Millisekunden werden einheitlich normalisiert
- Worker-Diagnose ergänzt GeoSphere Austria einschließlich `sourceRows` und möglicher Abruffehler

## 0.7.0

- optionale hyperlokale Stationsnetze Netatmo, Synoptic Data und Xweather zusätzlich zu Weather Underground integriert
- weiterhin nur ein gemeinsamer Cloudflare Worker für Stationsdaten und amtliche Warnungen erforderlich
- aktuelle Beobachtungen aus mehreren geeigneten Stationen werden entfernungs-, höhen-, aktualitäts-, QC- und anbietergewichtet zusammengeführt
- robuste Median-/Abweichungsfilter entfernen einzelne Stationsausreißer vor der Mittelung
- zirkuläre Mittelung der Windrichtung ergänzt
- Stationsanzeige nennt Anzahl und Quellen des lokalen Mittels sowie die Temperaturstreuung
- ENS-Mittel für Tmin/Tmax im 14-Tage-Diagramm über die Legende ein- und ausblendbar
- klimatologisches Tmin-/Tmax-Mittel 1991–2020 aus ERA5-Land ergänzt und über die Legende schaltbar
- Klimadaten werden kalendertagsbezogen verdichtet und 180 Tage lokal zwischengespeichert
- Worker-Gesundheitstest zeigt aktivierte optionale Datenanbieter ohne Offenlegung von Secrets

## 0.6.2

- weiterhin nur ein gemeinsamer Cloudflare Worker für weltweite METAR-Stationsdaten und amtliche Warnungen erforderlich
- weltweiten NOAA-AviationWeather-METAR-Abruf vom veralteten Parameter `hours` auf `hoursBeforeNow` umgestellt
- Stationsantwort um Diagnosewerte für Radius, Trefferzahl und Providerfehler ergänzt
- Länderbezeichnungen aus Suche und lokal gespeicherten Orten auf ISO-Zweibuchstabencodes normalisiert und alte Ortsdaten automatisch migriert
- Länderermittlung im Worker um Orts-/Regionsauswertung, BigDataCloud-Reverse-Geocoding und konservative geografische Rückfälle ergänzt
- Cagliari/Sardinien wird zuverlässig dem italienischen MeteoAlarm-Feed zugeordnet
- MeteoAlarm-Atom/CAP-Parser unterstützt nun eingebettete beziehungsweise XML-maskierte CAP-Meldungen, `content src` und relative CAP-Verknüpfungen
- Regionsbegriffe Sardegna, Sardinia und Sardinien für die örtliche Warnungszuordnung gleichgesetzt

## 0.6.1

- Abruf deutscher Warnungen auf den offiziellen DWD-WFS-Layer `dwd:Warnungen_Gemeinden` umgestellt
- exakte standortbezogene Filterung über die amtlichen Warnpolygone
- DWD-CAP-Atom-Feed als automatische Rückfallquelle beibehalten
- MeteoAlarm-Atom/CAP-Abruf nach Ort, Bezirk und Region priorisiert
- Zahl externer CAP-Unteranfragen begrenzt, damit der Cloudflare-Free-Worker nicht das Subrequest-Limit überschreitet
- Worker-Endpunkt `?mode=health` und Versions-/Zeitangaben zur Diagnose ergänzt
- GitHub-Actions-Workflow bindet `VITE_METAR_PROXY_URL` und `VITE_ALERT_PROXY_URL` aus Repository-Variablen ein
- Fehler aus dem Warnungsproxy werden im Dashboard nicht mehr als scheinbare Entwarnung behandelt

## 0.5.7

- kontinuierliche Farbskala für Prognosekonsistenz (0–100 %)
- Konsistenzpunkte farblich exakt nach Prozentwert interpoliert
- Schaltflächen für hohe/mittlere/geringe Konsistenz entfernt
- kompakte Farbverlaufslegende ergänzt

## 0.5.6

- Linie der gefühlten Temperatur im hellen Layout deutlich kontrastreicher dargestellt
- Legendenmuster für die gefühlte Temperatur an die neue Linienfarbe angepasst
- Warntexte und Warnflächen im hellen Layout für Gelb, Orange, Rot und Violett kontrastreich überarbeitet
- grüne Entwarnung im hellen Layout ebenfalls besser lesbar gestaltet

## 0.5.5

- Groß-/Kleinschreibung in sekundären Tageswetterhinweisen korrigiert, z. B. „leichter Sprühregen“ statt „leichter sprühregen“.
- 7-Tage-Tageszeilen in Hoch- und Querformat neu gerastert, um Überlappungen zwischen Wetterbeschreibung, Tmin/Tmax und Temperaturbalken zu verhindern.
- Wettertexte erhalten einen klar begrenzten, umbrechenden Bereich; der Temperaturbalken wird auf schmaleren Displays in einer eigenen Zeile dargestellt.

## 0.5.4

- Bewölkung in aktuellen Daten und Stunden-Tooltip auf n/8 umgestellt
- Tageswettercharakter auf eine gewichtete stündliche Auswertung umgestellt
- Niederschlagsereignisse werden nur bei ausreichender Dauer, Menge oder Wahrscheinlichkeit zum dominierenden Tagescharakter
- kurze Ereignisse mit geringer Wahrscheinlichkeit erscheinen nur als sekundärer zeitbezogener Hinweis

## 0.5.3

- Niederschlagsklassifikation zentral und strikt nach WMO-Wettercodes überarbeitet
- Sprühregen ausschließlich für WMO 51/53/55, gefrierender Sprühregen ausschließlich für 56/57
- normaler Regen für 61/63/65 und gefrierender Regen für 66/67 eindeutig getrennt
- Regenschauer 80/81/82, Schneefall 71/73/75, Schneegriesel 77 und Schneeschauer 85/86 eindeutig getrennt
- zusätzliche Unterstützung für WMO-Mischcodes 68/69 (Schneeregen) sowie 83/84 (Schneeregenschauer)
- Gewitterniederschlag und Gewitter mit Hagel getrennt
- gemischte Niederschlagsformen werden nur bei gleichzeitig messbaren flüssigen und festen Anteilen abgeleitet

## 0.5.2

- Niederschlagsarten anhand von WMO-Code, Regen-, Schauer- und Schneefallkomponenten neu klassifiziert
- Sprühregen wird nicht mehr als pauschaler Fallback verwendet
- Kurzfristkarte zeigt Niederschlagsart sowie voraussichtlichen Beginn und das Ende auf Basis der 15-Minuten-Best-Match-Daten
- Radarzeitleiste innerhalb der DWD-Radarabdeckung bis +60 Minuten erweitert; außerhalb werden optionale RainViewer-Nowcast-Frames verwendet

## 0.5.1

- Stunden-Navigation der Detailansicht springt an Tagesgrenzen automatisch zum angrenzenden Tag
- 23:00 Uhr → nächster Tag 00:00 Uhr; 00:00 Uhr → vorheriger Tag 23:00 Uhr
- Niederschlagsart Drizzle projektweit als „Sprühregen“ bezeichnet

## 0.5.0

- stündliche Kachelmatrix entfernt und durch dauerhaft sichtbare, kompakte Stunden-Detailanzeige am Diagramm ersetzt
- Stundenwahl erfolgt durch Klick ins Diagramm oder Vor-/Zurücknavigation im Tooltip
- UVI verwendet ausschließlich den tatsächlich erwarteten, bewölkungsberücksichtigten Open-Meteo-Wert; Klarhimmelvergleich und zusätzliche Eigenkorrektur entfernt
- Niederschlag aus dem Tooltip für Temperaturtrend und Prognoseunsicherheit entfernt
- Minor-Release wegen substanzieller Änderung der Bedienstruktur

## 0.4.9

- restriktives Versionsschema dokumentiert; diese Änderung bleibt ein Patch-Release
- 14-Tage-Tooltip klar in Best Match, ENS-Mittel, P10–P90, Niederschlag und Prognosekonsistenz gegliedert
- große stündliche Detailkarten entfernt und durch ein kompaktes Tooltip direkt am Tagesdiagramm ersetzt
- Tooltip erscheint beim Klick auf eine Stunde im Diagramm oder auf eine Stundenkachel
- UV-Logik korrigiert: tatsächlicher cloud-adjustierter Open-Meteo-UVI ist Primärwert; Klarhimmel-UVI wird nur als Vergleich/Fallback verwendet
- UV-Fallback um Wolkenschichten, Sichtweite, Wetterzustand und mögliche Cloud-Enhancement-Situationen erweitert

## 0.4.8

- Tooltip-Reihenfolge im 14-Tage-Temperaturtrend bestätigt und konsistent belassen
- UV-Index auf effektive Werte umgestellt: bewölkungs- und wetterkorrigierte Anzeige statt unkorrigierter Rohwerte
- UV-basierte Hazard-Logik und Tages-Hazards greifen nun auf die effektiven stündlichen UV-Werte zurück

## 0.4.7

- Tooltip im 14-Tage-Temperaturtrend angepasst: "Best Match Tmin/Tmax" statt Minimum/Maximum
- ENS-Mittel im Tooltip getrennt für Tmin und Tmax ausgewiesen

## 0.4.6

- Hazard-Schwellen überarbeitet: farbige Abstufung orientiert an DWD, Meteoalarm und NWS
- Niederschlagsformen in der 7-Tage-Detailansicht erweitert und vereinfacht benannt: Regen, Schauer, Schnee, Schneeschauer, Schneeregen und Schneeregenschauer
- dynamische Detail-Legende für Niederschlagsarten ergänzt
- Hochformat-/Mobil-Lesbarkeit bei langen Bezeichnungen verbessert

# Changelog

## 0.4.4

- Header bereinigt: neben dem Logo wird nur noch die Versionsangabe angezeigt
- Detailansicht um Niederschlagswahrscheinlichkeits-Linie und kompakte Legende erweitert
- Hazard-System auf vier Warnstufen (gelb, orange, rot, violett) erweitert
- zusätzliche Hazard-Prüfung für UV-Index sowie feinere Stufen für Böen, Starkregen, Hitze, Frost und Gewitter
- tägliche Hazard-Pills in 7-Tage-Ansicht und Widget entsprechend erweitert

## 0.4.3

- HTML-Seitentitel auf „MID - Meteorological Information Dashboard“ gesetzt
- MID-Logo in Header und als Favicon eingebunden
- Versionsnummer auch in der kompakten mobilen Kopfzeile sichtbar
- 14-Tage-Niederschlagsdiagramm zeigt die Best-Match-Niederschlagsmenge des Ortes statt des Ensemble-Mittels
- mobile Kopfzeile für Hochformat angepasst; Reload- und Lokalisierungs-Buttons sauber ausgerichtet
- README und Changelog aktualisiert

## 0.4.2

- Autolokalisierung benennt den Standort nach Geodatenbank und kennzeichnet dies deutlich
- helle Layout-Umschaltung auch im mobilen Layout sichtbar
- Niederschlagswahrscheinlichkeit im 14-Tage-Niederschlag per Legende ein-/ausblendbar
- Widgets nochmals kompakter gestaltet
- Tooltip im 14-Tage-Temperaturtrend zeigt für Best Match Min-/Max-Werte

## 0.4.1

- Changelog-Link im Footer
- leerer Erststart ohne Standardort; lokales Merken des zuletzt gewählten Ortes
- kombinierte Wind-/Windrichtungskachel bei den aktuellen Daten
- kompaktere mobile Kacheln
- Feinschliff der 14-Tage-Ensemble-Darstellung
- Niederschlagswahrscheinlichkeit in der 14-Tage-Übersicht und im Niederschlagstrend
- adaptive PNG-Abmessungen und kompakte nebeneinanderliegende Widget-Tage

## 0.4.0

- Suchfeld ist beim ersten Aufruf leer und dient nur der gezielten Orts-/Standortsuche
- stündliche Wetterpiktogramme in der Detailansicht ergänzt; aktuelle Stunde wird standardmäßig vorausgewählt
- stündliche Kacheln in der Detailansicht um Windrichtung und Wind erweitert
- Detaildiagramm größer und besser lesbar skaliert
- Widget-/PNG-Generator gestalterisch an das übrige MID-Design angepasst
- neue Option zum Ein-/Ausblenden von Hazards im Widget und PNG-Export

## 0.3.9

- Persistente 14-Tage-Ensemble-Übersicht
- korrigierte Open-Meteo-Ensemblemodell-IDs
- standortbezogene Modellwahl und Gewichtung
- robuster P10–P90-Ausreißerfilter und Ensemble-Mean-Fallback
- direkt anklickbares Tagesdiagramm mit separater Niederschlagswahrscheinlichkeit
- gefühlte Temperatur in Hitze-Hazards
- kompakteres responsives Layout
- erweiterter WMO-/METAR-Stationsabgleich

## 0.3.8

- 14-Tage-Ensemble-Kachelübersicht mit Konsistenzpunkten
