## v0.7.28

- neue, beim Start geschlossene Kachel „Meteogramm“ unmittelbar vor dem Widget-/PNG-Generator
- Modellauswahl mit Best Match sowie ausgewählten regionalen und globalen deterministischen Modellen
- siebentägiges beziehungsweise auf die verfügbare Modelllaufzeit begrenztes Vertikalprofil von Stationsniveau bis 300 hPa
- relative Feuchte als Höhen-Zeit-Querschnitt sowie kombinierte Temperatur-/Winddarstellung mit Richtungspfeilen
- zusätzliche Zeitreihen für 2-m- und 850-hPa-Temperatur, QFF, Wind/Böen sowie Niederschlag, Niederschlagsform und Schneehöhe
- optional einblendbare diagnostische Höhenbänder für Vereisung sowie Turbulenz/CAT; ausdrücklich nicht als amtliche Flugwetterprodukte gekennzeichnet
- Druckniveaus unterhalb des Geländes werden zeitabhängig ausgeblendet
- Meteogramm wird als eigener Lazy-Load-Chunk geladen; Modelldaten werden erst beim Öffnen der Kachel abgerufen und im Worker zwischengespeichert
- Cloudflare Worker um die Route `mode=meteogram` erweitert; Frontend und Worker einheitlich auf v0.7.28 angehoben

## v0.7.28

- Kompositfilm auf eine feste relative Achse von −1 Stunde bis +2 Stunden umgestellt; nicht vorhandene Layerstände werden weich ausgeblendet, reale benachbarte Frames überblendet.
- RainViewer-Metadaten über eine gecachte Workerroute angebunden; letzter realer Radarstand bleibt mit Zeitstempel sichtbar und wird ohne erfundene Zukunftsframes ausgefadet.
- Satelliten-Aktualitätsprüfung um einen Publikationspuffer erweitert; bis 150 Minuten Historie und verspätet veröffentlichte nominal ältere Bilder bleiben nutzbar.
- DWD-/MTG-LI-Blitzzeitachsen auf bis zu 130 Minuten Historie erweitert; Rasterfallback wird auch dann genutzt, wenn Punktdaten am ausgewählten historischen Zeitschritt fehlen.
- H-SAF-Satellitenniederschlagsrate als ergänzende Radarfläche integriert; automatischer MTG-H40B-Vorrang, sobald der Layer im öffentlichen EUMETView-WMS erscheint, mit MSG-H60B als aktuellem Fallback.
- Ortsabhängige Isobaren und 500-hPa-Isohypsen aus Open-Meteo Best Match ergänzt.
- Gemeinsame `CompositeTimeline`-Logik, Worker-Caching und Rendering von maximal zwei Blendframes reduzieren doppelte Berechnungen und Kartenlast.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.28 angehoben.

# Changelog

## v0.7.26

- 14-Tage-Ensemble: beide Diagramme verwenden nun dieselbe numerische Tagesachse; jeder Vorhersagetag besitzt in Temperatur- und Niederschlagsdiagramm exakt dieselbe x-Koordinate, unabhängig von Balken oder zweiter y-Achse.
- Widget-Export in „in Zwischenablage kopieren“ umbenannt.
- Hochauflösendes Radar: aktuelles nationales DWD-HX-Komposit mit 250-m-Raster als erste Wahl für Deutschland integriert; PX250 bleibt als Standort-Fallback erhalten.
- Große HX-HDF5-Raster werden speicherschonend und geräteabhängig gerendert, ohne die native Quellenauflösung falsch auszuweisen.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.26 angehoben.

## v0.7.25

- Niederschlag 1 km und Niederschlag 250 m als gegenseitig ausschließende Auswahl mit einheitlicher Benennung umgesetzt.
- Veraltete PX250-Metadaten und HDF5-Dateiverweise in Frontend und Worker doppelt abgesichert; PX250 beeinflusst keine fremde Kompositzeitachse mehr.
- Zeitvalidierung für Radar, Satellit und Blitz gegen eine plausible Worker-Serverzeit gehärtet und WMS-Abrufe außerhalb der zulässigen Live-/Nowcast-Fenster blockiert.
- Satellitenlayer werden je tatsächlichem Produktzeitpunkt neu geladen; Quellen ohne verlässliche Zeitdimension verwenden den echten neuesten Stand ohne erfundene Uhrzeit.
- Blitzringe auf eine Blitzortung-inspirierte Altersfarbskala in 20-Minuten-Stufen von Weiß bis Dunkelrot umgestellt; Blitzortung selbst wird wegen der Zugriffs- und Weitergabebedingungen nicht als Rohdatenquelle integriert.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.25 angehoben.

## v0.7.24

- Fehlerhafte Kompositzeiten behoben: Worker-Zeitwerte werden unabhängig davon korrekt verarbeitet, ob sie als ISO-Zeit, Unix-Sekunden oder Epoch-Millisekunden eintreffen; die bisherige Vermischung von Sekunden und Millisekunden kann keine Werte wie „−5555 min“ mehr erzeugen.
- Künstlich erzeugte Radarzeitpunkte entfernt. DWD-Radar, Satellit und Blitzraster werden nur noch mit Zeitstempeln abgefragt, die der konkrete Produktlayer tatsächlich in seinen WMS-Capabilities meldet.
- Leere Radar- und Satellitenkarten behoben: DWD- und EUMETSAT-WMS-Kacheln werden CORS-sicher über den Cloudflare Worker ausgeliefert; beim DWD bleibt der offizielle Ausfallserver als Rückfall aktiv.
- DWD-RV verwendet bevorzugt den expliziten 1-km-RV-Layer und stellt – soweit von der Quelle vorhanden – ausschließlich das reale Fenster von relativ −1 Stunde bis +2 Stunden bereit.
- Satellitenquelle wird anhand der aktuell wirklich verfügbaren Produktzeiten gewählt: bevorzugt hochaufgelöstes MTG-FCI, anschließend MSG-HRV/IR und zuletzt ein aktuelles DWD-Meteosat-Produkt. Bei einem fehlerhaften Tagesbild wechselt MID automatisch auf das IR-Produkt.
- Relative Zeitangabe bezieht sich jetzt auf die aktuelle Uhrzeit; Ortszeit und Prognosekennzeichnung stehen separat darunter. Produktzeiten außerhalb von −1 h bis +2 h werden verworfen.
- Worker-Antwort `composite-times` um reale DWD-Radarzeiten, verwendeten Radar-Layer und Serverzeit ergänzt; WMS-Proxy auf freigegebene Layer und valide Zeitstempel begrenzt.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.24 angehoben.

## v0.7.23

- Kompositbild um einen kleinen „Locate Me“-Button ergänzt, der die verschobene Karte animiert auf den gewählten Standort zurückführt, ohne Zoomstufe oder Layerauswahl zurückzusetzen.
- Höhenkonfiguration des Berg-/Skimodus auf direkt editierbare Meterfelder mit Mobil-Zifferntastatur, zuverlässigem Zwischenzustand und zusätzlichen ±50-m-Schaltflächen umgestellt.
- Tal- und Gipfelwerte weisen die verwendete Höhe nun ausdrücklich in m ü. NHN aus; aktuelle und zeitliche Gipfelprognosen zeigen Temperatur und gefühlte Temperatur gemeinsam.
- Bezeichnung „Schneegrenze“ im Berg-/Skimodus fachlich zu „Schneefallgrenze“ präzisiert.
- Auto-Standort in Schnellzugriff, Suche und Favoritenverwaltung einheitlich von „1. Standort“ zu „Standort“ umbenannt.
- Temperatur- und Niederschlagsdiagramm des 14-Tage-Ensemble-Trends verwenden identische feste Achsenreserven. Das Ein-/Ausblenden der Niederschlagswahrscheinlichkeit verändert damit nicht mehr die horizontale Position der Vorhersagetage.
- Frontend und funktional unveränderter Cloudflare Worker einheitlich auf v0.7.23 angehoben.

## v0.7.22

- Widget- und PNG-Generator um einen direkten PowerPoint-Export erweitert: hochauflösendes PNG wird per Clipboard API kopiert; bei fehlender Browserfreigabe erscheint ein kopierbares Rechtsklick-/Long-Press-Fallbackbild.
- Layerauswahl, Kartenbasis und individuelle Deckkräfte für Niederschlag, Satellit und Blitze dauerhaft gespeichert; Deckkraftregler dynamisch auf aktive Layer begrenzt.
- Gemeinsame Komposit-Zeitachse auf reale verfügbare Produktzeiten begrenzt und bis ungefähr ±1 Stunde erweitert, wo Radar-Nowcast beziehungsweise Historie dies erlauben; Übergänge zwischen Kartenframes geglättet.
- Ortsabhängige Auflösungspriorität dokumentiert und umgesetzt: PX250 250 m, DWD-RV 1 km, OPERA 2 km, anschließend RainViewer.
- Optionalen weltweiten Vaisala-Xweather-/GLD360-Blitzpunktabruf im Worker ergänzt; freie Fallbacks bleiben DWD und EUMETSAT MTG-LI. Blitzpunkte werden als alterscodierte, skalierte Ringe statt gefüllter Kreise dargestellt.
- Favoriten können nun direkt in der Schnellzugriffsleiste auf der Startebene per Maus sowie Touch/Pointer verschoben werden.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.22 angehoben.

## v0.7.21

- DWD-PX250-Abruf vom direkten Browserzugriff auf einen CORS-sicheren Worker-Proxy umgestellt; Verfügbarkeitsprüfung und HDF5-Datei werden über neue Worker-Modi bereitgestellt.
- Sichtbare Radarpriorität korrigiert: DWD-RV, danach EUMETNET OPERA/ORD als europäischer Erst-Fallback und erst anschließend RainViewer. OPERA erhält eine eigene Kartenvisualisierung als RATE-Punktraster.
- Kartenbasis um CARTO Positron und CARTO Dark Matter ergänzt; Auswahl wird je Browser gespeichert.
- DWD-Blitzgeometrien als zeitcodierte, mit zunehmendem Alter verblassende Kreise ergänzt; DWD-Blitzdichte und EUMETSAT MTG-LI bleiben als robuste Raster-Fallbacks erhalten.
- Kompositlegende verschlankt und dynamisch an die aktiven Radar-, Satelliten- und Blitzlayer angepasst.
- Favoritenreihenfolge über einen dedizierten Drag-&-Drop-Griff einschließlich Touch-/Pointer-Unterstützung änderbar; Pfeilnavigation bleibt erhalten.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.21 angehoben.

## v0.7.20.2

- Die bisherige Niederschlagsradarkachel heißt nun **Kompositbild** und besitzt getrennte Schalter für Niederschlag, natives DWD-PX250-Radar, hochaufgelöste MTG-FCI-Satellitenbilder und MTG-LI-Blitzaktivität.
- DWD-PX250 wird nur angeboten, wenn der gewählte Standort innerhalb der etwa 150-km-Reichweite eines passenden Radarstandorts liegt und eine aktuelle HDF5-Datei verfügbar ist. Die native Rasterweite beträgt 250 m; die Datei wird erst nach Aktivierung geladen und im Browser gerendert.
- Tagsüber verwendet die Satellitenebene den sichtbaren MTG-FCI-HRFI-Kanal VIS 0,6 mit nominal 0,5 km am Nadir; nachts wird automatisch IR 10,5 mit nominal 1 km verwendet. Bei einem nicht verfügbaren Tageslayer fällt MID auf IR zurück.
- Echtzeit-Blitzaktivität verwendet in Deutschland die DWD-NowCastMIX-Blitzdichte im 1-km-Raster mit 5-Minuten-Aktualisierung; außerhalb dient EUMETSAT MTG-LI AFA im 2-km-Raster als NRT-Fallback. Die Anzeige ist keine metergenaue Bodeneinschlagskarte.
- Radarfilm und Nowcast bleiben für DWD-RV beziehungsweise RainViewer erhalten; PX250 ist bewusst ein aktueller hochaufgelöster Einzelstand ohne künstliche Zukunftsframes.
- Frontend und Worker einheitlich auf v0.7.20.2 angehoben; der Worker erhält ausschließlich die neue Versionskennung und bleibt funktional unverändert. `jsfive` wird als eigener Lazy-Load-Chunk erst für PX250 geladen.

## v0.7.20.1

- Angaben zu Temperaturabweichungen, Temperaturunsicherheit und lokaler Modellkorrektur werden nun fachlich korrekt in Kelvin (K) statt in Grad Celsius ausgegeben.
- Absolute Temperaturen bleiben unverändert in Grad Celsius (°C).
- Frontend und kompatibler Cloudflare Worker auf v0.7.20.1 angehoben.

## v0.7.20

- Modellgestützte hyperlokale Analyse für aktuelle Temperatur, relative Feuchte, Taupunkt, QFF sowie Wind und Böen ergänzt.
- Offizielle DWD-Open-Data-Beobachtungen werden über Bright Sky an mehreren Suchpunkten gesammelt; dadurch stehen mehr DWD-Messpunkte als nur die nächste WMO-/METAR-Station zur Verfügung.
- openSenseMap-/senseBox-Außenmessungen als offene Citizen-Science-Zusatzquelle integriert; sie werden wegen uneinheitlicher Aufstellung nur mit geringer Gewichtung und nach strengen Aktualitäts-, Wertebereichs- und Ausreißerprüfungen verwendet.
- Synoptic Data nutzt nun die vollständige `synopticlabs`-QC-Suite mit grundlegenden und erweiterten Prüfungen.
- Stationswerte werden nicht direkt höhenkorrigiert gemittelt: MID ermittelt an jeder Station die Abweichung zum dortigen Open-Meteo-Best-Match-Hintergrund und interpoliert nur diese lokalen Restfelder zum Zielort.
- Gewichtung berücksichtigt Entfernung, Höhenunterschied, Messalter, Netzqualität, Stationsanzahl sowie Stadt-/Umland-/Land-Kompatibilität; private und Citizen-Science-Netze erhalten kürzere Reichweiten und strengere Altersgrenzen.
- Aktuelle-Wetter-Anzeige nennt nun effektiven Analyseradius, Temperaturunsicherheit, lokale Modellkorrektur und beteiligte Netze.
- Cloudflare Worker und Frontend auf v0.7.20 aktualisiert.

## v0.7.19

- Wassersportmodus als aktivierbares Favoritenprofil ergänzt.
- Open-Meteo Marine Best Match für Meeresoberflächentemperatur, Wellenhöhe/-richtung/-periode, Peak-Periode, Windsee, Dünung, Strömung und Wasserstand inklusive Tide integriert.
- modellierte Hoch-/Tiefpunkte, Wasserstandstendenz und 24-Stunden-Spanne ergänzt; nautische Einschränkungen werden deutlich ausgewiesen.
- Wetter-, Sicht-, UV-, Niederschlags- und Gewitterparameter mit konfigurierbaren Schwellen für Wellen, Böen und Kaltwasser kombiniert.
- See- und Flussprofile ersetzen fehlende Binnengewässerdaten nicht durch entfernte Meeresgitter.
- Wassersportmodul wird nur bei aktivem Profil und erst beim Scrollen geladen; Favoritenexport auf Schema-Version 4 angehoben.
- Frontend und kompatibler Worker auf v0.7.19 aktualisiert.


## v0.7.18

- Initiales Laden deutlich verkleinert: Leaflet/Radar und Recharts/Ensembletrend sind in eigene dynamische Chunks ausgelagert und werden erst bei Annäherung an den sichtbaren Bereich geladen.
- Widgetwerkzeuge bleiben bis zum Aufklappen inaktiv; `html-to-image` wird ausschließlich beim tatsächlichen PNG-Export nachgeladen. Der Berg-/Skimodus bleibt an ein aktiviertes Favoritenprofil gebunden.
- Datenabrufe priorisiert: Best Match wird zuerst angezeigt; Stationsdaten, Luftqualität, Radar, Warnungen und Modellstände folgen anschließend. Klimatologie und Ensembles starten erst beim Ensemblebereich.
- Detaildiagramm um eine markante dynamische Jetzt-Linie mit ortslokaler Uhrzeit ergänzt; Position und Beschriftung werden alle 30 Sekunden aktualisiert.
- GeoSphere/TAWES-Druckverarbeitung gehärtet: `PRED` und Stationsdruck `P` werden getrennt, QFF wird höhen- und differenzbezogen plausibilisiert und Werte wie 854 hPa in Sölden werden als Stationsdruck erkannt beziehungsweise verworfen.
- Fehlt ein plausibler TAWES-QFF-Wert, verwendet MID konsequent Open-Meteo `pressure_msl`; der Worker liefert den Rohdruck nur noch separat.
- Frontend und Worker auf v0.7.18 aktualisiert.

## v0.7.17

- Mobile Kopfzeile korrigiert: Die Ortssuche nutzt wieder die vollständige verfügbare Breite und kann nicht mehr auf ein schmales Symbolfeld zusammenschrumpfen.
- Favoriten stehen unmittelbar unter der Suchleiste wieder als einzelne horizontal scrollbarere Bubbles; der dynamische „1. Standort“ und die Verwaltungs-Schaltfläche bleiben integriert.
- Widget- und PNG-Generator ist beim Laden standardmäßig eingeklappt und lässt sich über eine kompakte Schaltfläche öffnen.
- Österreichische TAWES-Druckdaten werden ausschließlich über `PRED` (reduzierter Luftdruck) als Meereshöhendruck/QFF übernommen; der Stationsdruck `P` wird nicht mehr versehentlich angezeigt.
- METAR-QNH und nicht eindeutig reduzierte Stationsdrücke werden nicht als QFF ausgegeben; in diesem Fall fällt MID auf Open-Meteo `pressure_msl` zurück.
- Frontend und kompatibler Workerstand auf v0.7.17 aktualisiert.

## v0.7.16

- Optionale Standortverfolgung als **„1. Standort“** ergänzt: Bei jedem Öffnen wird die aktuelle Geräteposition neu bestimmt und als erster Schnellzugriff angeboten.
- Standardort und zuletzt verwendeter Ort bleiben als Fallback erhalten, falls die Browser-Ortung nicht verfügbar oder nicht erlaubt ist.
- Favoriten-Schnellzugriff direkt unter das Suchfeld verlegt und nach den frei vergebenen Favoritengruppen geordnet.
- Leeres Suchfeld zeigt den aktuellen Standort sowie gruppierte Favoriten ebenfalls in derselben Reihenfolge.
- Berg-/Skimodus wird nun ausschließlich pro Favorit in der Favoritenverwaltung aktiviert; Tal- und Gipfelhöhe werden dort konfiguriert.
- Die deaktivierte Berg-/Ski-Hinweiskarte und die Höhen-Eingabefelder im Dashboard wurden entfernt, sodass der Modus ohne Aktivierung keinen Platz beansprucht.
- Favoriten-JSON auf Schema-Version 3 erweitert; Standortverfolgung und Berg-/Ski-Konfiguration werden exportiert, importiert und aus älteren Einträgen migriert.
- Frontend und kompatibler Workerstand auf v0.7.16 aktualisiert.

## v0.7.15

- Favoriten Phase 2: eigene Anzeigenamen, Gruppen, sortierbare Reihenfolge, Standardort, horizontaler Schnellzugriff und lokale Regeln je Favorit.
- Favoriten lassen sich als versionierte JSON-Datei exportieren und wieder importieren; bestehende v0.7.14-Favoriten werden automatisch migriert.
- Neuer optionaler Berg- & Skimodus mit explizitem Tal-/Gipfel-Höhenvergleich über Open-Meteo, Nullgradgrenze, angenäherter Schneegrenze, Sicht, angenäherter Wolkenuntergrenze, Windchill, Gipfeltrend und Tageslicht-Orientierung.
- Amtliche Lawinenlage wird über den zuständigen europäischen Warndienst verlinkt; alle abgeleiteten Bergindikatoren sind klar als Orientierung gekennzeichnet.
- Beschreibung der Sonnenschein-/Bewölkungsbalken auf das Wesentliche gekürzt und „Tageslicht“ durch „Tagsüber“ ersetzt.
- DWD-Radarkarte wird nur noch dargestellt, wenn die Standortauswertung tatsächlich DWD-RV als Quelle bestätigt; ansonsten erscheint die RainViewer-Kartenebene mit OPERA-/RainViewer-Standortauswertung.
- DWD-Gebietserkennung des Workers an den aufgelösten Ländercode Deutschland gebunden; außerhalb davon werden OPERA/ORD beziehungsweise RainViewer verwendet.
- Frontend und Worker auf v0.7.15 aktualisiert.

## v0.7.14

- Erstes Farbschema orientiert sich ohne vorhandene Nutzereinstellung automatisch am Hell-/Dunkelmodus des Geräts (`prefers-color-scheme`); eine manuell gewählte MID-Einstellung bleibt gespeichert.
- Radarsteuerung auf ein überlaufsicheres Raster umgestellt; der Regler für die Radar-Deckkraft liegt auf Desktop und Mobil vollständig in einer eigenen Zeile.
- Favoriten-Grundfunktion ergänzt: Der aktuelle Ort oder POI kann über einen Stern gespeichert beziehungsweise entfernt werden.
- Gespeicherte Favoriten werden lokal im Browser abgelegt und beim Fokussieren des leeren Suchfelds direkt zur Auswahl angeboten.
- Frontend und kompatibler Workerstand auf v0.7.14 aktualisiert.

## v0.7.13

- Laufender Niederschlag erhält eine belastbare Endzeit aus dem ersten dauerhaft trockenen DWD-Nowcast-Zeitfenster; einzelne trockene Zwischenframes beenden ein Ereignis nicht vorschnell.
- Bleibt Niederschlag bis zum Ende des verfügbaren Radarhorizonts bestehen, kennzeichnet MID die Zeit als „mindestens bis …“ statt ein scheinbar exaktes Ende auszugeben.
- Ohne ausreichend zukünftige Radarframes wird transparent angezeigt, dass noch keine belastbare Endzeit ableitbar ist.
- „Regenradar“ in „Niederschlagsradar“ umbenannt.
- DWD-Zeitdimension robuster aus den WMS-Capabilities gelesen, einschließlich geerbter Zeitdimensionen übergeordneter Layer.
- Mobile Radarsteuerung neu aufgebaut: vorheriger/nächster Zeitschritt, Play/Pause, fortlaufende Radarfilm-Wiedergabe und klarer Frame-Zähler.
- Bei nur einem gelieferten DWD-Zeitpunkt wird die offizielle 5-Minuten-Zeitachse um den validierten Beobachtungszeitpunkt ergänzt, sodass die WMS-Animation mobil bedienbar bleibt.
- DWD-Legende kompakter, ruhiger und besser lesbar gestaltet; sie verdeckt auf kleinen Bildschirmen weniger Kartenfläche.
- Cloudflare Worker und Frontend auf v0.7.13 aktualisiert.

## v0.7.12

- DWD-Auswertung von einer reinen Raster-`GetFeatureInfo`-Abfrage auf eine robuste Kombination aus WMS-`GetMap`-Pixelanalyse und optionaler Punktwertverfeinerung umgestellt.
- Ein transparenter DWD-Kartenpixel wird als erfolgreicher trockener Radarwert (`0 mm/h`) gewertet; nur ein technisch fehlgeschlagener Kartenabruf löst einen Quellen-Fallback aus.
- WMS-Capabilities werden am allgemeinen DWD-Endpunkt geladen und die Zeitdimension gezielt aus dem Block des tatsächlich verwendeten Radarlayers gelesen.
- Der stabile Alias `dwd:Niederschlagsradar` wird vor dem konkreten RV-Layer verwendet; Primär- und Backup-Geoserver bleiben erhalten.
- Zentrum und Umgebung werden aus derselben Radar-PNG ausgewertet. Dadurch sinkt die Zahl externer Worker-Unterabfragen, während trockene und nasse Standorte zuverlässig unterscheidbar bleiben.
- Auffällige `GRAY_INDEX`-Werte werden mit dem sichtbaren Kartenpixel plausibilisiert und können nicht mehr allein als extreme Niederschlagsrate übernommen werden.
- DWD-Radarlegende als kompakte, kontrastreiche MID-Leseskala mit mm/h-Stufen und Intensitätsklassen neu gestaltet.
- Cloudflare Worker und Frontend auf v0.7.12 aktualisiert.

## v0.7.11

- DWD-Radarzeitachse wird aus der tatsächlichen WMS-Zeitdimension statt aus geratenen Fünf-Minuten-Zeitpunkten übernommen.
- DWD-GetFeatureInfo nutzt Primär- und Backup-Geoserver sowie den stabilen Alias `dwd:Niederschlagsradar` als Fallback.
- Radar-Unterabfragen wurden deutlich reduziert, damit Cloudflare-Subrequest-Limits nicht überschritten werden.
- Trockene Radarwerte (`0 mm/h`) gelten nun ausdrücklich als erfolgreiche DWD-Auswertung und nicht als fehlende Abdeckung.
- Die Radar-Karte übernimmt die exakten verfügbaren DWD-Zeitstempel aus der Standortanalyse.
- Bei einem temporären Quellenfehler wird zwischen vorhandener Radarabdeckung und tatsächlich fehlender Abdeckung unterschieden.

## 0.7.10

- DWD-RV-GetFeatureInfo strikt auf den tatsächlichen Niederschlagswert beschränkt; Zeitstempel und andere numerische Metadaten können nicht mehr als Radarintensität fehlinterpretiert werden.
- DWD-RV-Werte werden entsprechend der WMS-Einheit direkt als mm/h verwendet und nicht erneut heuristisch hochskaliert.
- Fehlwerte und unplausible Radarwerte oberhalb des technischen Plausibilitätsbereichs werden verworfen.
- Extremwerte werden ohne irreführende Zehntelgenauigkeit als extremes Radarecho bzw. > 50 mm/h gekennzeichnet; isolierte Spitzen erhalten einen Unsicherheitshinweis.
- Ankunfts-, Datenstands- und Endzeiten werden in der Ortszeitzone in Klammern ergänzt; der +120-Minuten-Horizont kann nicht mehr als 120–130 Minuten ausgegeben werden.
- RainViewer-Intensität aus der offiziellen Universal-Blue-Palette statt aus einer fehleranfälligen Alpha-Heuristik angenähert; Reflektivitäten unter 10 dBZ werden nicht als Niederschlag gewertet.
- Ein Echo in der Umgebung wird nicht mehr automatisch als sicherer Standorttreffer formuliert; Mittelpunkt und Umgebung werden getrennt bewertet.
- Radarlegende automatisch an die dargestellte Ebene angepasst: offizielle DWD-RV-Legende beziehungsweise RainViewer Universal Blue in dBZ.
- Cloudflare Worker auf v0.7.10 aktualisiert.

## 0.7.9

- Aktuelle Niederschlagswahrscheinlichkeit um eine standortbezogene Radar-Nowcast-Auswertung ergänzt.
- Quellenpriorität: DWD-RV in Deutschland, EUMETNET OPERA/ORD in Europa, RainViewer als globaler Fallback, anschließend Open-Meteo Best Match.
- DWD-Zukunftsframes bis +120 Minuten werden direkt ausgewertet; OPERA und RainViewer erhalten eine eigene räumlich-zeitliche Bewegungsnäherung aus zurückliegenden Frames.
- Dynamische Radar-/Modellgewichtung nach Vorlaufzeit und Datenqualität umgesetzt.
- Radarquellen, Qualitätsstufe, aktuelle Intensität sowie grobe Ankunfts- und Endzeit werden kompakt in der vorhandenen Niederschlagskachel angezeigt.
- OPERA-Kompositprodukte werden mit CC-BY-4.0-Hinweis verwendet; RainViewer bleibt ausdrücklich als best-effort Fallback gekennzeichnet.
- Cloudflare Worker auf v0.7.9 erweitert (`mode=radar-nowcast`).

## 0.7.8
- Standortbezogene Zeitzonenlogik für automatische Stundenwahl, Kurzfristniederschlag, Radar, amtliche Warnungen, Tagesdiagramm, Sonnenauf-/untergang und Widget.
- Stündliche und 15-minütige Open-Meteo-Zeitstempel werden mit der IANA-Zeitzone des Zielorts in echte Zeitpunkte überführt.
- Datumsbeschriftungen verwenden den lokalen Kalendertag des Vorhersageorts und können nicht mehr durch die Gerätezeitzone verschoben werden.
- Ortssuche um OpenStreetMap/Photon-POIs erweitert, einschließlich Berggipfeln, Hotels, Hütten und Sehenswürdigkeiten.
- POI-Typ und OpenStreetMap-Herkunft werden kompakt in den Suchtreffern gekennzeichnet.

## 0.7.7

- Nachtstunden im Tages-Detailansichtsdiagramm vor Sonnenaufgang und nach Sonnenuntergang dezent diagonal schraffiert
- orts- und tagesgenaue Sonnenauf- und Sonnenuntergangszeiten unmittelbar an den Übergängen im Diagramm eingeblendet
- Darstellung ohne zusätzliche Karten- oder Diagrammhöhe umgesetzt
- bestehende Sonnenschein-/Bewölkungsbalkenlogik für Tageslicht und Nacht unverändert beibehalten

## 0.7.6

- Ursache der falschen Jahresdarstellung „5026“ beseitigt: Versionsnummern werden nur noch in Texten mit vorangestelltem `v` ersetzt
- Datumsangaben bei „Aktualisiert“, im Widget und im Update-Hinweis gegen unbeabsichtigte Versionsersetzung abgesichert
- Nachtlogik der Sonnenschein-/Bewölkungsbalken überarbeitet: bei klarem Himmel kein Balken, bei Bewölkung ausschließlich Grau
- Tageslogik beibehalten und feiner skaliert: unter 50 % Bewölkung Gelb, ab 50 % Grau; Linienstärke jeweils proportional in vier Stufen
- Tag/Nacht weiterhin aus der stündlichen Open-Meteo-Angabe `is_day` abgeleitet

## 0.7.5

- platzsparende Modellstand-Information in den Titelzeilen der 7-Tage- und 14-Tage-Ansicht ergänzt
- Open-Meteo-Metadaten für Init- und Verfügbarkeitszeit geeigneter deterministischer und tatsächlich aktiver Ensemblemodelle eingebunden
- Best Match ehrlich als automatische, je Ort, Variable und Horizont wechselnde Modellkombination gekennzeichnet
- wahrscheinliche Quellenkette regionaler und globaler Modelle separat als Schätzung ausgewiesen
- Modellstände in einem aufklappbaren Popover dargestellt, sodass im geschlossenen Zustand nahezu kein zusätzlicher Platz benötigt wird

## 0.7.4

- Detaildiagramm am Desktop fokussierbar gemacht
- Navigation mit Pfeiltaste links und rechts nach einem Klick in die Diagrammfläche ergänzt
- bestehende Stundenlogik einschließlich automatischem Wechsel zum vorherigen oder nächsten Tag wiederverwendet
- Standard-Scrollverhalten nur bei aktivem Diagrammfokus und nur für die horizontalen Pfeiltasten unterdrückt
- visuellen Fokusrahmen für die Tastaturbedienung ergänzt

## 0.7.3

- flächigen Bewölkungsverlauf im Tagesdetail durch eine horizontale Balkenzeile direkt unter den Wetterpiktogrammen ersetzt
- sonnige beziehungsweise überwiegend klare Phasen gelb dargestellt; größere Linienstärke bedeutet klareren Himmel
- bewölkte Phasen grau dargestellt; größere Linienstärke bedeutet stärkere Gesamtbewölkung
- vier Linienstärken für beide Zustände ergänzt und gelbe Sonnenscheindarstellung auf Tagesstunden begrenzt
- kompakte Legende und Erläuterung der Balkenlogik ergänzt

## 0.7.2

- Verlauf der Gesamtbewölkung im Tagesdetail in einen eigenen oberen Diagrammbereich über der Temperaturkurve verschoben
- Temperatur- und Niederschlagsbereiche des Detaildiagramms für eine klare vertikale Trennung neu angeordnet
- `version.json` als cache-frei abgerufene Quelle für die veröffentlichte MID-Version ergänzt
- automatischer Versionsvergleich beim Start mit Hinweis „MID wurde aktualisiert – jetzt neu laden“
- optionale, lokal gespeicherte automatische Neuladung bei künftigen Updates ergänzt
- Versionsprüfung bei Rückkehr aus dem Hintergrund, bei `pageshow`, bei Fokus und regelmäßig während der Nutzung ergänzt
- Cache-Busting beim Neuladen verhindert, dass eine installierte iOS-Web-App erneut den alten Einstiegspunkt öffnet
- Koordinatensuche ergänzt die Geländehöhe über Open-Meteo; das Widget verwendet zusätzlich die Vorhersagehöhe als Rückfall und zeigt nicht mehr fälschlich 0 m an
- Widget-Auswahl für Tage, Layout, Wind, Niederschlag und Hazards wird direkt im React-Zustand aus dem lokalen Speicher wiederhergestellt und bei jeder Änderung gespeichert

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
