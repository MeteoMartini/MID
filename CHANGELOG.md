# MID v0.9.17.5

- Buildfix: ungültige Mischung aus Nullish-Coalescing (`??`) und logischem ODER (`||`) in der Berechnung der Meteogramm-Achsenschritte beseitigt; die Tick-Fallbacks sind nun explizit getrennt. Die dedizierte TS5076-Regression lädt TypeScript portabel aus den Projektabhängigkeiten und verwendet den CAAS-Pfad nur noch als lokalen Fallback.
- Feinschliff: Achsen, Raster und Tagestrennung des Kurzfrist-Meteogramms optisch näher an einer professionellen Meteogramm-Darstellung ausgerichtet.
- Tooltip des Kurzfristdiagramms als kompakte Infobox mit Wettericon, klaren Parameterzeilen und besserer Lesbarkeit auf Mobilgeräten überarbeitet.
- Korrektur: Ganzzahlige maximale Niederschlagswahrscheinlichkeit im Cockpit wieder mit dem bestehenden Build-Regressionstest synchronisiert.
- Cockpit-Kurzfristbereich als kompaktes Meteogramm neu aufgebaut
- Tooltip/Overlay passt sich auf schmalen Displays mobil unten an statt Inhalte zu verdecken
- Temperatur- und gefühlte Temperatur im Kurzfristdiagramm farblich konsistent ohne alte Blau/Rot-Gegenüberstellung
- 24-Stunden-Leiste und Kurzfrist-Insights beibehalten, aber auf das neue Diagramm abgestimmt

# MID v0.9.17.4

- Die Cockpit-Kurzfristansicht ersetzt die bisherige Kurzfristmatrix nun durch eine neue, innovative Parametertimeline. Wetter, ECMWF-Temperatur, Niederschlag, Wind/Böen sowie Wolken- und Sichtsignal werden je Zeitpunkt in einer diagrammatischen Lane-Struktur verdichtet.
- Die 24-h-Leiste kennzeichnet Start und Ende jetzt eindeutig mit Datum und Uhrzeit. Damit entfällt die missverständliche reine Zeitspannen-Anzeige.
- Für schmale/mobile Ansichten wird die 24-h-Leiste deutlich flacher und kompakter gerendert. Die Stundenchips bündeln weiterhin Temperatur, Wetter, Niederschlag und Wind, verbrauchen aber spürbar weniger Höhe.
- Responsive CSS- und Interaktionsanpassungen sichern, dass sowohl die neue Kurzfristdiagrammansicht als auch die verdichtete 24-h-Leiste auf kleinen Displays nutzbar bleiben.
- CI-Korrektur: Die Temperatur-Lane erklärt weiterhin ausdrücklich das Temperaturmittel, sodass der bestehende Cockpit-Usability-Vertrag und die zugehörige Regression erfüllt bleiben.

# MID v0.9.17.3

- Die Cockpit-Kurzfristansicht reagiert nun wirklich auf Klick/Tipp: Sowohl die Kurzfristmatrix als auch 90-Minuten-Slots und 24h-Stundenfelder öffnen bzw. aktualisieren sofort die Kurzfristdetails.
- Temperaturen in den Kurzfristansichten werden jetzt mit einer ECMWF-orientierten Farbskala dargestellt.
- Die bisherige Grafik wurde durch eine neue interaktive Kurzfristmatrix ersetzt, die Temperatur, gefühlte Temperatur, Wetter, Niederschlag, Wind/Böen, Bewölkung, Feuchte, Sicht und Gewittersignal direkt pro Zeitpunkt zusammenführt.
- Für schmale/mobile Displays werden die Kurzfristkacheln gezielt in flache, horizontal gestreckte Felder umgebaut. Damit bleiben Scrollen und Überblick auf kleinen Geräten deutlich besser nutzbar.
- Die responsive 24h-Vorschau wurde ebenfalls auf echte Interaktion und mobile Einspaltigkeit nachgeschärft. Eine neue Regression prüft Interaktivität, ECMWF-Farben, Matrixdarstellung und mobile Flachfelder.

# MID v0.9.17.2

- Der Kurzfristbereich unterhalb der 90-Minuten-Vorhersage wurde gestalterisch erneut überarbeitet. Statt einer einfachen Kachelmatrix erscheint dort jetzt eine hochwertigere, professionellere Kurzfrist-Sektion mit klarerer Informationshierarchie.
- Die stündliche Vorschau zeigt nun bis zu 24 Stunden in einer kompakten, horizontal scrollbaren Timeline-Leiste. Damit entfallen die bislang als unzweckmäßig bewerteten zweispaltigen Stundenkacheln.
- Die Kurzfrist-Metriken bleiben als Premium-Spotlights sichtbar und passen sich je nach Displaybreite abgestuft an Desktop, Tablet und Smartphone an. Für schmale Geräte werden nur die Kennzahlen gestapelt; die Stundenleiste bleibt einspaltig beziehungsweise horizontal nebeneinander.
- Die Änderung folgt ausdrücklich dem MID-Grundsatz, neue UI-Bausteine immer displaygrößen- und gerätegerecht auszuarbeiten. Eine neue Regression sichert 24h-Timeline, Premium-Layout und responsive Einspaltigkeit der Kurzfristvorschau ab.

# MID v0.9.17.1

- Das Kurzfrist-Cockpit unterhalb der 90-Minuten-Vorhersage wurde grafisch neu aufgebaut. Die bisherige knappe Kennzahlenleiste wird durch eine responsive Kurzfrist-Insight-Zone mit stündlicher Vorschau, Temperaturspanne, Windspitze und Niederschlagsfenster ersetzt.
- Die Kurzfristgrafik nutzt kompaktere Proportionen mit weniger Leerraum und bleibt je nach Rasterwahl beziehungsweise Displaybreite besser lesbar. Unterhalb des Diagramms passt sich die Stunden-Vorschau flexibel an schmale und breite Displays an.
- In den Cockpit-Übersichten wird der zusätzliche 14-Tage-Streuungstext oberhalb des MID-Prognose-Kompasses entfernt, da der Kompass diese Information bereits inhaltlich abdeckt. Die Überschrift bleibt erhalten, die Legende bleibt kompakt sichtbar.
- Neue Regression schützt die neue Kurzfrist-Insight-Zone, die stündliche Vorschau und das Entfallen des redundanten 14-Tage-Textblocks im Cockpit.
- CI-Korrektur: Die maximale Niederschlagswahrscheinlichkeit wird im neu gestalteten Bereich weiterhin direkt ganzzahlig aus allen dargestellten Kurzfristpunkten berechnet; der bestehende Schutztest `test-build-percent-integers-091513.mjs` bleibt damit erfüllt.

# MID v0.9.16.1

- Die 14-Tage-Übersicht verhindert auf Smartphones im Querformat Überlagerungen zwischen benachbarten Karten. Kartenkopf, Konsistenzfeld und Messzeilen besitzen nun feste responsive Raster und bleiben vollständig innerhalb ihrer Kachel.
- Konsistenzwerte werden stets einzeilig dargestellt. Auf schmalen Displays liegen Messwert und Bezeichnung über dem zugehörigen Balken, sodass Regen- und Windangaben nicht mehr in die nächste Karte ragen.
- Der Widget-/PNG-Generator erhält eine moderat breitere Exportfläche und größere Schriften für alle wesentlichen Inhalte.
- Widget-Hazards werden auf die höchste am jeweiligen Tag vorhandene Warnstufe begrenzt; niedrigere Warnstufen werden in dieser kompakten Exportansicht ausgeblendet.
- Neue Regression schützt Querformatlayout, Konsistenzfelder, Widget-Lesbarkeit und Hazard-Priorisierung.

# MID v0.9.15.14

- KONRAD3D rendert im Kompositbild jetzt die vollständigen Vektorelemente nicht mehr nur für genau eine, sondern für bis zu drei der relevantesten sichtbaren Zellen. Dadurch erscheinen Zugbahn, Unsicherheitskorridor, Ellipsen und Prognosepunkte wieder vollständig, wenn mehrere plausible K3D-Zellen im Kartenausschnitt liegen.
- Die K3D-Vektorlayer wurden optisch nachgeschärft. Spur, Zellfläche, Ellipsen und Korridor erhalten nun stärkere Konturen beziehungsweise Schatten und nutzen im dedizierten Pane einen normalen Mischmodus, damit sie über Radar- und Satellitenraster auch im Dark-Theme zuverlässig sichtbar bleiben.
- Die Prognoseellipsen werden bei den hervorgehobenen Zellen dichter dargestellt, sodass fehlende Zwischenelemente im 5-Minuten-Raster nicht mehr wie abgerissene K3D-Spuren wirken.

# MID v0.9.15.13

- Produktionsbuild repariert: `RadarNowcastInterval` wird in `forecastFusion.ts` nun als TypeScript-Typ importiert. Die Intervallauswertung für die appweite DWD-RV-Punkt-Nowcast-Fusion kompiliert dadurch ohne TS2304.
- Prozentanzeigen werden an der Oberfläche konsequent ganzzahlig ausgegeben. Insbesondere zeigt das Kurzfrist-Cockpit das maximale Niederschlagsrisiko gerundet statt mit langen Fließkommazahlen.
- Weitere potenziell kontinuierliche Prozentwerte in Wetterzwilling, Modellverifikation, Gewitterrisiko, Ensemble-Konsistenz, Radar-Deckkraft und Synoptik werden vor der Anzeige gerundet; interne Berechnungen behalten ihre volle Genauigkeit.
- Bestehende Gewitter-Detailregressionen wurden auf die nun ausdrücklich ganzzahlige Prozentdarstellung aktualisiert.
- Neue Regression schützt den fehlenden `RadarNowcastInterval`-Import und verhindert die erneute Ausgabe ungerundeter Prozentwerte an den betroffenen Oberflächen.

# MID v0.9.15.12

- Die 5-Minuten-DWD-RV-Standortserie aus dem Radar-Nowcast wird zentral in alle Kurzfristdarstellungen übernommen. Standalone-Kurzfrist, Cockpit und Wetterzwilling verwenden damit dieselben direkten Standorttreffer, trockenen Intervalle, Unterbrechungen und reinen Umfeldsignale.
- Direkte Standorttreffer werden über sämtliche im Zielintervall liegenden 5-Minuten-Schritte mengen- und wahrscheinlichkeitsgewichtet. Unterbrochene Phasen bleiben getrennt; reine Umfeldechos erhöhen keine Standortmenge und dürfen die Standortwahrscheinlichkeit nur begrenzt beeinflussen.
- Für ältere beziehungsweise reduzierte Radarantworten ohne Punktserie bleibt ein eng begrenzter, standortgebundener Aggregat-Fallback erhalten; als „nearby“ oder „approximate“ gekennzeichnete Echos sind davon ausgeschlossen.
- KONRAD3D übernimmt die amtliche aktuelle Zellfläche aus den geodätischen Polygonkoordinaten und nutzt deren plausibilisierten Mittelpunkt für Marker, Zellfläche und die konsistent verschobene Prognosespur.
- K3D-Vektoren und HTML-Marker liegen in getrennten, expliziten Leaflet-Panes. Prognosepunkte werden als robuste HTML-Marker gerendert; nur die relevanteste sichtbare, radarbestätigte Zelle erhält die vollständig beschriftete Zugbahn.
- Lokale K3D-Zellen werden gegen aktuelle DWD-Radaranker plausibilisiert. Zellen ohne räumlich passende Radarechos werden im Nahbereich nicht mehr über der Karte angezeigt. Zellfläche, Geschwindigkeitseinheiten und Flächenangaben werden aus den amtlichen XML-Feldern normalisiert.
- Neue Regression schützt die appweite Punkt-Nowcast-Fusion, den Ausschluss reiner Umfeldechos, unterbrochene Standortphasen, K3D-Polygon-/Geschwindigkeitsauswertung, getrennte Pane-Ebenen und die räumliche Echo-Plausibilisierung.

# MID v0.9.15.10

- KONRAD3D-Objekte werden an den aktuell gewählten Radarzeitstand gebunden; außerhalb eines engen Zehn-Minuten-Fensters werden keine zeitlich fremden Zellobjekte über das Radar gelegt.
- K3D-Zugbahnen werden nur noch für Zellen gezeichnet, deren aktuelles Zellzentrum im sichtbaren Kartenausschnitt liegt. Beim Verschieben der Karte erscheinen daher keine losgelösten Prognosespuren ohne zugehörige aktuelle Zelle mehr.
- Vollständige Zugbahn, Prognosepunkte und Unsicherheitsgeometrie werden auf die zwei relevantesten sichtbaren Zellen begrenzt; weitere sichtbare Zellen behalten Marker und aktuelle Zellfläche.
- Amtliche Prognosepunkte werden räumlich gegen Zellgeschwindigkeit und Vorlauf plausibilisiert. Unplausibel weit versetzte Koordinaten werden verworfen und nur bei belastbarem Zugvektor transparent ersetzt.
- Unsicherheitsradien und permanente Zeitbeschriftungen wurden begrenzt, damit fehlerhafte Einheiten oder viele benachbarte Zellen keine kartengroßen Ellipsen und Beschriftungsteppiche erzeugen.
- Der KONRAD3D-Worker liest bei Längenfeldern nun sowohl das amtliche XML-Attribut `unit` als auch `units`; Meterwerte werden dadurch nicht mehr fälschlich als Kilometer interpretiert.
- Neue Regression schützt Kartenausschnitt-, Zeit- und Geometrieplausibilität sowie die Singularform des DWD-Einheitenattributs.

# MID v0.9.15.9

- Ein Tipp auf eine Push-Benachrichtigung öffnet immer die normale MID-Startansicht im Scope-Root. Von Push-Payloads mitgegebene Deep-Links oder Einstellungs-Hashes werden verworfen; der Benachrichtigungsort bleibt über sichere Standortparameter erhalten.
- Bereits geöffnete MID-Fenster erhalten ein eigenes `MID_NOTIFICATION_OPEN`-Signal, schließen Einstellungs- und Impressumsdialoge und springen an den Anfang der Startansicht.
- KONRAD3D-Vektorelemente verwenden einen expliziten Leaflet-SVG-Renderer im dedizierten Nowcast-Pane. Zellfläche, Zugbahn, Unsicherheitskorridor, Ellipsen und Prognosepunkte liegen dadurch zuverlässig oberhalb des Radarrasters.
- K3D-Geometrien erhalten kontrastierende Halos und permanente, kompakte Zeitmarken. Bei fehlenden Einzelpunkten kann zusätzlich eine vorhandene prognostizierte Endposition zur transparent abgeleiteten Spur bis +60 Minuten genutzt werden.
- Neue Regression schützt Startansicht bei Benachrichtigung, Overlay-Schließung, K3D-Pane/Renderer, sichtbare Geometrie und Endpunkt-Fallback.

# MID v0.9.15.8

- DWD-HX-250-m-Radar wird nicht mehr als rechteckiges WGS84-Bild über die Karte gestreckt, sondern kachelweise und projektionstreu aus der im HDF5 hinterlegten ellipsoidischen Polarstereografie nach Web-Mercator abgebildet.
- Die HX-Rasterachse wird gemäß Produktmetadaten korrekt behandelt: Pixelzentren beginnen bei x=0/y=0, die y-Koordinate nimmt je Rasterzeile um 250 m ab.
- Falsche Verortungen gegenüber dem DWD-RV-1-km-Komposit, insbesondere im Westen und Norden Deutschlands, werden dadurch beseitigt.
- Sichtbare Kartenausschnitte werden als Leaflet-Canvas-Kacheln berechnet; Farb-Lookup, Kachelpuffer und asynchrones Rendering begrenzen Rechenlast und Speicherbedarf.
- Neues Projektionsmodul verarbeitet `+a`, `+b`, `+x_0`, `+y_0`, `+lat_ts` und `+lon_0` aus `projdef` einschließlich ellipsoidischer Vorwärts- und Rücktransformation.
- Neue Regression prüft alle vier amtlichen HX-Eckreferenzen auf Zentimetergenauigkeit sowie die Rasterzelle für Münster.

# MID v0.9.15.7

- Produktionsbuild repariert: `ResolvedKonradTrackPoint[]` ist für die veränderliche KONRAD3D-Prognosepunktliste nun explizit typisiert.
- Amtliche und abgeleitete K3D-Punkte können dadurch gemeinsam verarbeitet werden; `derived` ist im TypeScript-Build zulässig.
- Keine funktionale Änderung an Radar-, Nowcast- oder Worker-Datenlogik.

# MID v0.9.15.6

- Ensemble-Diagramme für Temperatur, Niederschlag und Wind besitzen am Desktop nun eine eigene, von Recharts unabhängige Treffer- und Tooltip-Schicht. Hover, Klick zum Fixieren, Außenklick, Escape sowie Pfeiltasten funktionieren einheitlich; eine senkrechte Führungslinie kennzeichnet den aktiven Tag.
- Das 250-m-Radar verwendet in Deutschland vorrangig das flächendeckende DWD-HX-Deutschlandkomposit statt eines einzelnen Standortradars. Lokales PX250 bleibt nur als klar gekennzeichneter Fallback erhalten.
- HX-/PX250-Reflektivität wird für die gemeinsame Darstellung über Z=200·R^1,6 in eine äquivalente Regenrate umgerechnet und mit derselben mm/h-Farbskala wie das 1-km-Radar dargestellt.
- Der KONRAD3D-XML-Parser verarbeitet die amtlichen `forecast/centroid_forecasts/centroid_forecast`-Elemente einschließlich aller 5-Minuten-Positionen und Unsicherheitsellipsen. Ein fehlerhaft escaptes dynamisches RegExp, das Prognosepunkte verschluckte, wurde korrigiert.
- Das Kompositbild zeichnet aktuelle Zellfläche, Zugbahn bis +60 Minuten, Prognosepunkte, 1σ-Korridor und Unsicherheitsellipsen oberhalb des Radars. Nur bei fehlenden amtlichen Einzelpunkten wird eine transparent gekennzeichnete Vektor-Spur ergänzt.
- Neue Regression prüft alle drei Desktop-Ensemble-Interaktionen, HX-Priorisierung, gemeinsame Regenratenskala sowie das echte amtliche KONRAD3D-XML-Schema funktional.

# MID v0.9.15.5

- Tagescharaktere werden appweit ausschließlich aus dem astronomischen beziehungsweise zivilen Tagesfenster abgeleitet; Nachtregen desselben Kalendertags beeinflusst weder Text noch Tagespiktogramm.
- Die auf einen Tag folgende Nacht wird zentral und datumsübergreifend als Abend des Prognosetags plus Morgen des Folgetags gebildet. Cockpit, klassische Tageskarten, Detailansicht, Widgets und Tropennachtprüfung verwenden dieselbe Grenze.
- Das 7-Tage-Cockpit weist relevante Tagesschauer auch bei moderater Tageswahrscheinlichkeit als „Schauer“ aus und fällt nicht mehr auf „Ruhig“ zurück.
- Die 7-Tage-Kurzinterpretation verwendet für Wetterregime und Niederschlagsstärke nur Tagesstunden; kalendernächtliche Mengen können den Tagesabschnitt nicht mehr als regnerisch deklarieren.
- Neue Regression schützt Tages-/Folgenachtgrenzen, Nachtregen-Ausschluss, Tagesschauerklassifikation und die gemeinsame appweite Periodenlogik.

# MID v0.9.15.4

- Gewitter-Ortslisten werden bei zu wenigen Overpass-Treffern aktiv durch entlang der 60-Minuten-Zugbahn gesampelte Ortsabfragen ergänzt; der Bezugsort bleibt nur ein Eintrag unter mehreren.
- Eine fehlende oder zu kurze KONRAD3D-Prognosespur wird aus offizieller Zugrichtung und -geschwindigkeit in 10-Minuten-Schritten transparent ergänzt.
- Overpass-Endpunkte werden parallel abgefragt, Rückwärtsgeokodierungen gecacht und begrenzt parallelisiert; dadurch bleibt die Gewitterinformation trotz Mehrortanalyse reaktionsfähig.
- Radar- und Nowcast-Layer bleiben beim Zoomen montiert, behalten Kachelpuffer und laden angrenzende Zeitstände mit minimaler Deckkraft vor. Dadurch sinken Flackern und Nachladen beim Panning, Zoomen und Abspielen.
- Die Wetterblick-Prüfung wurde als Transfer-Audit dokumentiert: Bedienprinzipien werden eigenständig nachgebaut; proprietärer Code und Wetterblick-Daten werden nicht kopiert oder gescrapt.
- Neuer Regressionstest schützt Mehrort-Fallback, 60-Minuten-Spur, Quellenkennzeichnung und Layer-Performance.

# MID v0.9.15.3

- Cockpit-Registeransicht: Die 14-Tage-Angabe zur zunehmenden Unsicherheit nennt neben dem Wochentag nun immer auch das eindeutige Datum im Format dd.mm.
- Auch die Tooltip-Beschriftung des 14-Tage-Mini-Ribbons kombiniert Wochentag und Datum.
- Neuer Regressionstest schützt die Datumsangabe in der Registerzusammenfassung.

# MID v0.9.15.2

- 7-Tage-Stundenübersicht: ECMWF-orientierte Temperaturfarben deutlich dezenter und kompakter dargestellt.
- Ensemble-Diagramme: Desktop-Hover nach dem Schließen oder einem Außenklick zuverlässig reaktiviert; Tooltips stehlen dem Diagramm nicht länger den Mauszeiger.
- Regressionstest für Temperaturfeld-Geometrie und Desktop-Tooltip-Reaktivierung ergänzt.

# Changelog

## 0.9.15.11

- Niederschlags-Nowcast: vollständige 5-Minuten-DWD-RV-Punktserie bis +120 Minuten.
- Getrennte Niederschlagsphasen werden mit Unterbrechungen und tatsächlicher letzter Endzeit ausgewiesen.
- Echos im Kilometerumfeld werden nicht mehr als Standorttreffer oder Standortmenge gewertet.
- Aktuelle Standortbeobachtung wird mit nativem RADOLAN YW gegengeprüft; OPERA dient nur als Kontrollabgleich.

## 0.9.15.1
- Gewitterinformationen weisen jetzt mehrere aktuell vom radarbestimmten Zellbereich erfasste Orte mit „Jetzt“ aus.
- Auf der prognostizierten Zugbahn liegende Orte erhalten eine individuelle lokale Ankunftszeit beziehungsweise ein Zeitfenster und werden chronologisch sortiert.
- Vier klar getrennte Ortsstatus verhindern falsche Sicherheit: aktuell betroffen, voraussichtlich auf der Zugbahn, möglicher Treffer und nur im Unsicherheitskorridor.
- Die Ortsbestimmung kombiniert den geometrischen KONRAD3D-Zell- und Prognosekorridor mit OpenStreetMap/Overpass; ein sparsamer BigDataCloud-Sampling-Fallback bleibt bei Ausfällen verfügbar.
- Der Bezugsort wird separat gegen aktuelle Zellfläche, Zugachse und Prognoseunsicherheit geprüft und bei Relevanz in die Ortsliste aufgenommen.
- Direkt in der Gewitterkachel erscheinen die wichtigsten Orte; die vollständige Liste mit Statusbegründung, Zugachsenabstand, Ankunftsfenster und Quellenangabe liegt hinter dem Info-Button.
- Neue Regression schützt Ortskorridor, Statusklassifizierung, Zeitlokalisierung, vollständige UI-Liste und Worker-/Frontend-Datenvertrag.

## 0.9.15.0
- Kurzfristige Temperatur- und Gefühlstemperaturwerte erhalten eine meteorologische Plausibilitätsprüfung gegen isolierte 15-Minuten-Ausreißer. Bei ruhiger, trockener Wetterlage werden einzelne ungestützte Sprünge zeitlich interpoliert und transparent als plausibilisiert gekennzeichnet.
- Die klassische 7-Tage-Stundenübersicht öffnet den aktuellen Tag direkt an der aktuellen Ortsstunde. Im 3-Stunden-Raster werden alle Zeitschritte gezeigt; im 1-Stunden-Raster zunächst ein sinnvoll zentriertes Zeitfenster und auf Wunsch der vollständige Tag.
- Wettertexte der Stundenkacheln wandern in ein Hover-/Fokus-Overlay; die Piktogramme werden größer. Temperaturfelder verwenden eine ECMWF-orientierte 2-m-Temperaturfarbskala mit kontrastangepasster Schrift.
- Gewitterinformationen übernehmen zusätzliche KONRAD3D-, HYMEC-, Radar-, Zell-, Zugbahn-, Hagel-, Starkregen-, Wind- und NWP-Parameter. Relevante Auswirkungen stehen direkt in der Kachel; vollständige Detailgruppen einschließlich optionaler DWD-Mesozyklonenerkennung liegen hinter dem Info-Button.
- Historische Release-Hinweise zu später vollständig entfernten oder stillgelegten Großfunktionen wurden aus der nutzerseitigen Historie bereinigt. Statusmeldungen zur Stilllegung bleiben erhalten; der Wetterstationsanbieter „Synoptic Data“ ist davon ausdrücklich nicht betroffen.
- Neue Regression schützt Plausibilisierung, Stundenfokus, 3h-/1h-Umfang, Piktogramm-Overlay, Temperaturfarblogik, Gewitterdetails und bereinigte Release-Historie.

## 0.9.14.5
- Empfehlungen aus den zuletzt gesichteten Wartungs-/UI-Hinweisen werden für kommende Releases als fortlaufende Release-Leitlinie übernommen.
- Nachtpiktogramme wurden kontrastreicher gemacht: hellere Nacht-Hintergründe, hellere Nachtwolken und stärkere Mond-/Niederschlagskontraste verbessern die Erkennbarkeit auf hellen Karten und in kleinen Größen.
- Tag- und Nachtpiktogramm stehen in Tageskarten, klassischer 7-Tage-Ansicht und Widget/Quickfacts nun nebeneinander; das Nachticon liegt nicht mehr auf dem Tagesicon.
- Größenverhältnis von Tages- zu Nachtpiktogrammen harmonisiert; Nachticons bleiben kleiner, aber deutlich besser lesbar.
- Böenangaben im 7-Tage-Cockpit werden nicht mehr abgeschnitten; das Layout reserviert mehr Platz und die kompakte Beschriftung bleibt vollständig sichtbar.
- Klassische 7-Tage-Stundenansicht: Wetter-/Bewölkungstext wird nicht mehr hart abgeschnitten und die Temperaturkachel wurde optisch an das übrige App-Design angeglichen.
- Neuer Regressionstest schützt die UI-Politur für Nachtpiktogramme, Böenlayout und klassische Stundenliste.

## 0.9.14.4
- Buildfix im 3-Stunden-Aggregator des Prognose-Cockpits: `wind` ist jetzt im typisierten Mittelwertvertrag enthalten; der GitHub-Fehler TS2345 ist beseitigt.
- Eigener Regressionstest schützt die Windaggregation im 3-Stunden-Raster.
- Der Piktogramm-/ISO-Test isoliert die WMO-Klassifikationsfunktion robust, auch nachdem zusätzliche SVG-Hilfskomponenten ergänzt wurden.

## 0.9.14.3
- Wolkenformen werden zusätzlich zum Wolkenstockwerk klassifiziert: Stratus/Hochnebel, Altostratus, Cirrus, Cumulus, Cumulonimbus und mehrschichtige Bewölkung besitzen nun klar getrennte SVG-Formen.
- Flache Schichtbewölkung, mittelhohe Wolkendecken, faserige hohe Wolken, Haufenwolken und hochreichende Gewitterwolken sind in kleinen Tages-, Nacht- und Stundenpiktogrammen deutlicher unterscheidbar.
- Tag-/Nacht-Hintergründe reagieren jetzt zusätzlich auf die Wolkenform; Nachtnebel, Schichtbewölkung und konvektive Lagen bleiben dadurch auch auf hellen Karten lesbar.
- Bei hoher bzw. mittelhoher Schichtbewölkung kann Sonne oder Mond gedämpft hinter der Wolkendecke erscheinen; nächtlicher Nebel erhält einen schwach durchscheinenden Mondhinweis.
- Neuer Regressionstest schützt Wolkenformklassifikation, Tag-/Nacht-Hintergrund und appweite Metadatenattribute der Piktogramme.

## 0.9.14.2
- Wetterpiktogramme weiter geschärft: klarere visuelle Trennung zwischen Schichtbewölkung, mehrschichtiger Bewölkung und konvektiver Bewölkung.
- Tages- und Nachtpiktogramme erhalten nun einen dezenten semitransparenten Hintergrund: tagsüber heller, nachts dunkler, damit der Tag-/Nachtcharakter schneller erkennbar bleibt.
- Nachtpiktogramme sind dadurch auf hellen Karten und in kleinen Darstellungen besser ablesbar, ohne stilistisch aus dem App-Bild zu fallen.
- Hohe Bewölkung und Quellwolken wurden zeichnerisch kontrastreicher ausgearbeitet, damit die Wolkenstockwerke stärker voneinander unterscheidbar sind.

## 0.9.14.1
- 3h-/1h-Umschalter im Prognose-Cockpit summieren Niederschlagsmengen im 3-Stunden-Raster jetzt korrekt auf; Wahrscheinlichkeiten und repräsentative Wettercodes werden blockweise neu verdichtet.
- Tages- und Nachtpiktogramme nutzen nun konsequent die Folgnachtlogik: Das kleine Nachticon eines Tages wertet nur die folgende Nacht aus und nicht mehr die zurückliegende Nacht desselben Kalendertages.
- Nachtpiktogramme wurden appweit vereinheitlicht (auch im Cockpit, in Widgets und Tageskarten): transparenter Stil ohne weiße Kachel, klarerer Größenunterschied zu Tagesicons und stärkere Erkennbarkeit auf hellem Hintergrund.
- Klassische Tagesansicht klappt die Stundenliste jetzt auch am Desktop direkt unter dem jeweiligen Tag auf; damit werden redundante Parallelansichten reduziert.
- Bewölkungsdarstellung der Piktogramme kontrastreicher verfeinert, insbesondere für hohe Bewölkung und klare Nachtlagen.

## 0.9.14.0
- Tmin/Tmax in Tageskarten werden relativ zum jeweiligen Klimamittel dezent abgestuft; höhere Tmax-Abweichungen erscheinen dunkler rot, deutlich kühlere Tmin dunkler blau.
- 7-Tage-Cockpit: Tageskarte öffnet direkt den einstündigen klassischen Tagesverlauf als Akkordeon; Rückkehr über „Tagesansicht“.
- Redundante vollständige Kurzfrist- und 7-Tage-Module aus Cockpit-Untermenüs entfernt; nur die eigenständige Ensemble-Analyse bleibt separat aufklappbar.
- Register- und Ribbon-Cockpit in den Einstellungen klarer voneinander abgegrenzt.

## 0.9.13.3
- SEO-Buildfix: Die statische HTML-Releaseversion wird nun durch `sync-version.mjs` automatisch mit Paket, Baseline, Worker und Service Worker synchronisiert.
- Der Regressionstest `test-seo-discoverability-0990.mjs` läuft damit wieder erfolgreich.

## 0.9.13.2
- Buildfix für die meteoblue-ähnliche Tagesdetailansicht: `detailListWeatherLabel()` verwendet jetzt korrekt `PrecipitationParts` statt `PrecipSample`.
- Die dadurch ausgelösten TS2339-/TS2345-Fehler für `type`, `displayCode` und `weatherLabel` sind beseitigt.
- Neuer Regressionstest schützt den Niederschlagstypvertrag der aufklappbaren Tagesdetails.

## 0.9.13.1
- Tageskarten zeigen das kleine Nachtpiktogramm jetzt ohne zusätzlichen „Nacht“-Schriftzug; Tages- und Nachticon überlappen dabei nicht mehr.
- Die tageweise Vorhersage erhält für kompakte Ansichten ein meteoblue-ähnliches Akkordeon: Klick auf einen Tag klappt 3h-Details direkt darunter auf, inklusive Umschalter auf 1h.
- Das 14-Tage-/Cockpit-Tag-Nacht-Paar übernimmt ebenfalls die schriftzugfreie Nachtpiktogramm-Darstellung.
- Regressionstests für Wolkenschicht-/Tag-Nacht-Piktogramme und Tagesdetails an die neue UI angepasst.

## 0.9.12.2
- GitHub-Produktionsbuild repariert: die nach der Radar-Metadatenverdichtung ungenutzte Hilfsfunktion `radarClockRange` wurde entfernt.
- Radarzeitformatierung, hervorgehobene 2-h-Summe und Info-Popover aus v0.9.12.1 bleiben unverändert.
- Eigener Regressionstest verhindert die erneute Einführung der ungenutzten Deklaration.

## 0.9.11.1
- GitHub-Produktionsbuild repariert: `RadarNowcast | null` wird an den drei neuen Kurzfrist-/Cockpit-Props explizit zu `undefined` normalisiert.
- Keine fachliche Änderung gegenüber v0.9.11.0.

## 0.9.11.0
- Kurzfrist-Nowcasting auf die ersten 90 Minuten erweitert: standardmäßig 5–6 15-Minuten-Kacheln statt nur vier, inklusive Radar-/Nowcast-Einfluss auf Niederschlagswahrscheinlichkeit und -signal.
- Windpfeile im Prognose-Cockpit, in der Kurzfristvorhersage und in den Tageskarten weiter vereinheitlicht; warnstufenabhängige Einfärbung bleibt konsistent.
- Kurzfrist-Zusammenfassung sprachlich korrigiert: keine irreführenden Formulierungen wie „Klar ab 16:00 Uhr“ mehr, sondern zukunftsbezogene oder laufende Aussagen.
- Kurzfristdiagramm optisch entzerrt: mehr vertikaler Platz, getrennte Ebenen für Piktogramme, Temperaturwerte, Windpfeile und Uhrzeit, sodass keine Überlagerungen mehr auftreten.
- Professionelle Wetterpiktogramme werden in den betroffenen Kurzfrist- und Cockpit-Modulen konsistent verwendet.

## 0.9.10.0
- 14-Tage-Cockpit um professionelle Wetterpiktogramme je Tag und in der Fokuskarte ergänzt.
- Windpfeile in Kurzfrist-, 7-Tage- und 14-Tage-Cockpit vereinheitlicht; Richtung und warnstufenabhängige Farbformatierung entsprechen der Kurzfristvorhersage.
- Hyperlokaler Stationsanker wird gemeinsam auf 90-Minuten-Ultrakurzfrist, Cockpit-Kurzfrist und vollständige Kurzfristvorhersage angewandt.
- Kurzfristtexte verdichtet: z. B. „Trocken · Böen bis 26 kt um 21:00“ statt der sperrigen bisherigen Formulierung.

## 0.9.9.0
- Suchmaschinen-Discoverability für `https://www.midwx.app/` ergänzt: Canonical, indexierbare Meta-Tags, Open Graph, strukturierte WebApplication-Daten, robots.txt, XML-Sitemap, CNAME und statischer No-JavaScript-Fallback.
- Prognose-Cockpit auf Desktop repariert: Icon, Titel, Zusammenfassung und Mini-Ribbon besitzen feste Gridbereiche; kein seitliches Verrutschen oder unkontrolliertes Umbrechen von „7 Tage“.
- Register- und Ribbon-Cockpit für 1, 2 und 3 aktive Horizonte sowie Desktop, Tablet und Smartphone responsiv abgesichert; klassische Ansicht bleibt unberührt.

## 0.9.8.0
- Warnungsbereiche für automatische und amtliche Warnungen auf allen Displaygrößen deutlich verdichtet; Titel und Gültigkeit bleiben im eingeklappten Zustand sichtbar.
- Kurzfrist-Cockpit mit eindeutiger 3-h/1-h-Umschaltung, meteorologisch vollständigem 90-Minuten-Schnellblick, verbesserten Achsen, Wetterpiktogrammen und warnstufenabhängig eingefärbten Windpfeilen.
- 14-Tage-Schalter fachlich neu aufgebaut: Temperatur relativ zum Klimamittel, ein kombinierter Niederschlagsbalken und Wind/Böen in den Farben der vollständigen Diagramme.
- Temperaturabweichungen werden in Kelvin, Tmin blau und Tmax rot dargestellt.
- Niederschlagsdiagramm: P10–P90-Schalter blendet nur die schwarzen Spannen aus; Achsen und Diagrammrahmen bleiben erhalten.
- Ensemble-Tooltips auf Desktop auf Hover/Fine-Pointer umgestellt; Touchgeräte behalten Klickbedienung.
- Nutzlose durchschnittliche Ensemble-Mitglieder-Zeile entfernt und Konsistenz-/Modellstatus kompakter dargestellt.

## 0.9.7.1
- GitHub-Produktionsbuild repariert: fünf ungenutzte Deklarationen in `ForecastCockpit.tsx` entfernt (`CloudRain`, `Compass`, `GaugeCircle`, `finite`, `circularDelta`).
- Keine fachliche oder visuelle Änderung gegenüber v0.9.7.0.

## 0.9.7.0
- Prognose-Cockpit: Kurzfrist standardmäßig auf 3h-Darstellung mit 1h-Umschaltung und 90-Minuten-Schnellblick erweitert.
- 7-Tage-Farblogik durch Legende und geschärfte Tagesregime verständlicher gemacht.
- 14-Tage-Übersicht auf 3-Parameter-Tageskarten umgestellt und Konsistenzformel app-weit harmonisiert.
- Amtliche Warnungen standardmäßig eingeklappt; sichtbarer Fokus auf Titel und Gültigkeitspille.
- Niederschlagssystematik für konvektiv vs. stratiform in Frontend und Worker nachgeschärft.

# MID v0.9.7.0

- Kurzfristansicht auf klare 3-Stunden-Standarddarstellung umgestellt; per Umschalter lässt sich stündlich verdichten.
- Die horizontale Temperatur-Referenzlinie in der Kurzfrist ist nun explizit als 24h-Mittel ausgewiesen; die bisher missverständliche Darstellung wurde ersetzt.
- Zusätzlicher 90-Minuten-Schnellblick mit kompakten 15-Minuten-Slots für Niederschlag/Wahrscheinlichkeit direkt im Prognose-Cockpit.
- 7-Tage-Karten inhaltlich entschärft und objektiver gemacht: `Regenreich`/`Windig` werden nicht mehr bei geringen Mengen oder Einzelereignissen ausgelöst.
- 14-Tage-Übersicht erhält pro Tag drei selbsterklärende Parameterbalken für Temperatur relativ zum Klimamittel, kombinierten Niederschlag sowie Wind/Böen.
- Konsistenz im 14-Tage-Cockpit an dieselbe Bewertungslogik wie in der vollständigen Analyse angeglichen.
- Amtliche Warnungen bleiben standardmäßig kompakt eingeklappt; Titel und Gültigkeitspille sind sofort sichtbar.
- Relevante Regressionen bestanden: Cockpit-Klarheit, optionale Prognose-Cockpits sowie app-weite konvektiv/stratiforme Niederschlagslogik.

# MID v0.9.6.0

- Prognose-Cockpit auf eine sofort lesbare Stunden-/Tagesübersicht umgestellt; nichtssagende blaue Platzhalter und die unpassende Balkenerklärung entfernt.
- Kurzfrist-Ribbon zeigt konkrete Schlüsselzeitpunkte, Temperatur, Niederschlag und Böen; die erweiterte Ansicht fasst die drei wichtigsten Wetterfaktoren kompakt zusammen.
- Sieben-Tage-Darstellung verwendet benannte Wetterkategorien und direkt sichtbare Mengen/Wahrscheinlichkeiten statt schwer interpretierbarer Phasenbalken.
- App-weite objektive Klassifikation für konvektiven, stratiformen, gemischten und unbestimmten Niederschlag ergänzt.
- Explizite Modellanteile `rain`/`showers` führen; Wettercode, CAPE, Lifted Index, CIN, Feuchte, Bewölkung und Sonnenschein dienen als konsistente Zusatzbelege.
- Sprühregen und Schneegriesel bleiben nur bei passender tiefer Schichtbewölkung und Feuchte bestehen.
- Forecast-Fusion, Tagesaggregation, Kurzfrist, Meteogramm, Widget-/Push-Feed und Worker nutzen dieselbe Niederschlagskonsistenz.
- 262 automatisch erkannte Regressionstests bestanden.

# MID v0.9.5.1

- GitHub-Buildfehler `TS2345` in der Wind-/Böen-Vorschau behoben.
- Interne Einheit auf den zentralen `WindUnit`-Wert `kn` korrigiert; sichtbare Ausgabe bleibt `kt`.
- Regressionstest für den WindUnit-Vertrag ergänzt.

# MID v0.9.4.1

- GitHub-Produktionsbuild repariert: ungenutzte `quartileFill`-Deklaration entfernt.
- Nicht mehr verwendete lokale `weatherFamily`-Hilfsfunktion aus dem Prognose-Cockpit entfernt.
- Überholten `frame`-Parameter aus `mapBounds` und dessen Aufruf entfernt.
- Die übrigen meteorologischen und visuellen Funktionen von v0.9.4.0 bleiben unverändert.
- Neuer Regressionstest schützt alle drei `TS6133`-Buildfehler.

# MID v0.9.4.0

- Winddarstellung vereinheitlicht: Phasenpfeile und Stationswindfahnen zeigen ohne zusätzliche 180-Grad-Drehung die meteorologische Herkunftsrichtung „Wind aus“.
- Gemeinsames Temperatur-/Niederschlag-/Wind-Böen-Deck oberhalb der klassischen Ensembleansicht und im 14-Tage-Cockpit.
- Cockpit verwendet dieselben professionellen Ensemblediagramme wie die vollständige Analyse; Temperaturwerte sind rot/blau beschriftet und späte Tage konsistenzabhängig ausgeblendet.
- Horizontales Scrollen in der 7-Tage-Matrix löst keinen Cockpit-Horizontwechsel mehr aus.
- Zentrale Niederschlagsplausibilisierung verhindert ungestützte Sprühregenvisualisierung.
- 256 automatisch erkannte Regressionstests bestanden.

# MID v0.9.2.0

- Zwei zusätzliche optionale Prognoseoberflächen: gemeinsames Register-Cockpit und kompakter Ribbon-Stapel.
- Die klassische Darstellung von Kurzfrist, 7 Tagen und 14 Tagen bleibt unverändert der Standard.
- Adaptive 24-Stunden-MeteoRibbon mit priorisierten Wetterwechseln, Temperatur, Niederschlag und Wind.
- Sieben-Tage-Wetterband mit gemeinsamer Temperaturskala, Wetterphasen und synchronem Tagesfokus.
- Vierzehn-Tage-Unsicherheitshorizont mit Parameter-Miniaturen, Ensembleband, Konsistenz und Szenarien.
- Persistente Auswahl über die Einstellungen, Wischbedienung und vollständige alte Analysen als zweite Ebene.
- 253 bestehende und neue Regressionstests bestanden.

# MID v0.8.35.0

- Sonnenstunden des aktuellen Tages bleiben die vollständige tägliche Best-Match-Aggregation und werden abends nicht mehr auf die noch verbleibenden Stunden gekürzt.
- Reine Best-Match-Tage behalten die offizielle Tagesaggregation; nur vollständig abgedeckte Zukunftstage mit tatsächlicher kohärenter Stundenreparatur werden neu summiert.
- Best Match ist wieder die operative Hauptprognose für Kurzfrist, 7 Tage und alle gemeinsamen Wettersektionen.
- Multi-Model-Antworten werden über die tatsächlich gelieferten API-Suffixe getrennt und diagnostiziert; ein fehlendes Modell wird gezielt einzeln nachgeladen.
- Widersprüchliche Best-Match-Stunden werden ausschließlich als vollständiges Wetterbündel aus einem einzigen plausiblen Modell ersetzt.
- Modellvergleich, MOSMIX und Wetterzwilling korrigieren nur eng begrenzte geeignete Parameter; Niederschlag, Wettercode, Bewölkung und Sonne bleiben gekoppelt.
- Der lokale Wetterzwilling setzt nun auf den bereits geprüften Fusion-Stunden und -Tagen auf und kann Bündelreparaturen oder MOSMIX nicht mehr umgehen.

# MID v0.8.33.17

- Ursache von Niederschlagsmengen bei 0 % behoben: Ein nasser WMO-Code kann keine Tagesmenge mehr auf eine probabilistisch ungestützte Stunde ziehen.
- Forecast-Menge, Niederschlagsart und Wettercode werden bei 0–5 % nun unabhängig von der Mengenhöhe zentral gemeinsam entfernt.
- Finale Stundenreihe wird nach Fusion, Wetterzwilling, Nowcast und Tages-/Stundenabgleich nochmals vollständig reconciliert.
- Aktuelles Wetter, Wassersport, Gewitterauswertung, Tagesdetail, 7-Tage-Prognose, Ensemble-Referenz, Widgets und Worker verwenden dieselbe Konsistenzregel.

# MID v0.8.33.16

- iOS-Scrollpfad ohne globale Karten-Neustilisierung und ohne fortlaufende Scroll-rAF-Schleife.
- Durchgehender Root-Hintergrund und reduzierte mobile Blur-/Compositor-Ebenen gegen weiße Scrollflächen.
- Viewport-Module aktivieren im Vorladebereich ohne zusätzliche Timer-/Idle-Verzögerung.
- Aktuelle Temperatur erweitert den heutigen Tagesbereich nach oben oder unten und wird in Stunden-/Tagesansichten konsistent berücksichtigt.

# Changelog

## 0.8.33.15

- Suchfeld erhält einen bewegungstoleranten Touch-end-Fokuspfad, sodass der erste Tap auch unmittelbar nach einer Momentum-Scrollbewegung aktiviert.
- Tagespfeile der stündlichen Detailansicht reagieren direkt auf Touch-end, unterdrücken Ghost-Clicks und besitzen mobil 44 × 44 Pixel große Trefferflächen.
- Aktiver Detailtag aus dem globalen App-State in die Forecast-Komponente verlagert; ein Tageswechsel rendert nicht mehr das gesamte Dashboard neu.
- Statische Inhalte der sieben Tageszeilen von der aktiven Auswahl entkoppelt, damit Tages-Hazards und Tagescharaktere beim Pfeiltipp nicht erneut berechnet werden.
- Fast-Scroll-Erkennung von Timeout-Neuanlage je Scrollereignis auf einen einzelnen rAF-Settle-Zyklus umgestellt; Header-Blur bleibt während des Nachlaufs deaktiviert.

## 0.8.33.14

- Mobile Ersttipper abgesichert: Radar- und Ensembleflächen bleiben auch unmittelbar nach Scrollbewegungen interaktiv; der Fast-Scroll-Modus reduziert nur noch visuelle Effekte.
- Stündliches Detaildiagramm reagiert direkt über einen bewegungstoleranten Pointer-Tap-Pfad und erzwingt auf Touchgeräten keinen unnötigen Fokus mehr.
- Ensemble-Tooltips werden bereits beim Pointer-down freigeschaltet, damit ein zuvor geschlossenes Tooltip beim nächsten Tap sofort erscheint.
- Einstellungsdialog, Schalter und Diagramme erhalten konsistente Touch-Actions; layoutverändernde Hover-Effekte sind auf groben Zeigern deaktiviert.
- Flugmeteogramm-Tooltips werden pro Animationsframe gebündelt statt bei jeder Pointerbewegung neu gerendert.
- React-Hook-Reihenfolge der 7-Tage-/Detailkomponente repariert und unzulässigen State-Update aus einem Meteogramm-`useMemo` entfernt.
- Tageszeilen der 7-Tage-Vorhersage memoisiert, damit die Auswahl einer Detailstunde nicht erneut alle Tages-Hazards und Tagescharaktere berechnet.

## 0.8.33.11

- Hauptkarte und Bewölkungskarte verwenden denselben frischen hyperlokalen Himmelszustand.
- 7/8 Bewölkung wird als „Stark bewölkt“, 8/8 als „Bedeckt“ bezeichnet; lokaler Nebel behält Vorrang.

## 0.8.33.10

- Luftdruckkarte zeigt Werte mit einer Nachkommastelle.
- Technische Feldbezeichnung `pressure_msl` aus der sichtbaren Quellenzeile entfernt.

## 0.8.33.9

- Warnfreier Status auf „Keine Warnung“ verkürzt.
- Tagespiktogramm und Tagesbeschreibung gewichten den dominierenden Tagesverlauf stärker; ein einzelner schwacher Regenimpuls am späten Abend erscheint nur noch als Zusatz „abends Regen möglich“.
- 7-Tage-Karte, Detailansicht und 14-Tage-Übersicht verwenden denselben vollständigen Tagescharakter.

## 0.8.33.8
- Stunden-Detailansicht: Niederschlagsart wird in der Niederschlagskachel nicht mehr doppelt wiederholt.
- Der frei gewordene Platz zeigt bei vorhandener Konvektion das Gewitterrisiko vollständig an.

## 0.8.33.6
- Niederschlagswerte zwischen 7-Tage-Karte, Tagesdetail und finaler Stundenreihe konsistent zusammengeführt

## 0.8.33.5
- UVI app-weit auf ganze Indexwerte vereinheitlicht
- Aktuelle Niederschlagswahrscheinlichkeit an die trockene operative Nowcast-Gewichtung angeglichen

## 0.8.33.4
- GitHub-CI-Fix für den Nowcast-/Tageskonsistenztest: projektlokale TypeScript-Auflösung statt exklusivem festem NVM-Pfad
- Keine Änderung der Prognose- oder Nowcast-Logik

## 0.8.33.3
- Radar-Nowcast und trockener MOSMIX-/Mehrquellenkonsens im Kurzfristbereich stärker priorisiert
- Regen-Wettercodes bei belastbar trockenem Nowcast bereinigt
- 7-Tage-Karte, Tagesdetail und Kurzfristvorhersage auf dieselben finalen Niederschlagswerte vereinheitlicht
- Heutiger 7-Tage-Trend ignoriert abgelaufene Modellstunden

## 0.8.33.2
- Temperatur-Ensembletooltip: Sonne-Wertblock leicht nach rechts versetzt, damit Beschriftung und Werte klar getrennt und vollständig lesbar bleiben

## 0.8.33.1
- Temperatur-Ensembletooltip: Sonne samt P10–P90 und Niederschlag samt Wahrscheinlichkeit jeweils bündig in einer einzigen Zeile dargestellt.
- Ortssuche: Suchfeld reagiert über die gesamte Eingabefläche bereits auf die erste Berührung und fokussiert ohne Scrollsprung.
- Favoriten: Standortstern, Standort-Schnellzugriff und Favoritenblasen reagieren auf Touch unmittelbar beim ersten gültigen Tap; störende Pointer-Capture-Logik entfernt.

## 0.8.33.0
- DWD MOSMIX als stationsbezogene statistische Nachkorrektur der adaptiven Mehrquellen-Prognose integriert.
- MOSMIX wird wegen seiner ICON-/IFS-Basis nicht als zusätzliche unabhängige Modellfamilie gezählt, sondern nur nach robustem Mehrmodellkonsens angewendet.
- Kurzfristvorhersage erhält direkte stündliche MOSMIX-Korrekturen; Radar- und Gewitternowcast bleiben im unmittelbaren Niederschlagszeitraum vorrangig.
- 7-Tage- und 14-Tage-Best-Match-Referenz verwenden die adaptive Fusion; MOSMIX wirkt nur innerhalb seiner maximalen Zehn-Tage-Abdeckung.
- Wetterzwilling archiviert Modellfusion mit und ohne MOSMIX getrennt, damit der lokale Zusatznutzen messbar wird.
- Nicht blockierende Hintergrundabfrage mit Worker-/Local-Cache und Qualitätsfiltern für Entfernung und Höhenunterschied.

## 0.8.32.1
- Modelllauf-Metadaten für ECMWF AIFS auf die aktuelle Open-Meteo-Quelle `ecmwf_aifs025_single` umgestellt.
- Monatealte oder zeitlich unplausible Modelllauf-Metadaten werden nicht mehr angezeigt oder für die Mehrquellenfusion verwendet.
- Best-Match-Information fachlich präzisiert: statt einer nicht belegbaren Modellkette zeigt MID nur noch potenziell relevante Regionalmodelle und kennzeichnet die Metadatenquelle.
- Worker-Aliase und Forecast-Fusion für ECMWF AIFS Single aktualisiert.

## 0.8.31.0
- Einstellungs- und Favoritenmenüs öffnen mit sofortiger Dialoghülle und verzögertem Inhaltsaufbau.
- Viewport-Gates aktivieren schwere Module nur noch nach stabiler Sichtbarkeit und in einer Idle-Phase.
- iOS-Scrollstabilität verbessert: problematisches content-visibility für schwere Dashboard-/Ensemblebereiche deaktiviert.
- Schnelle Scrollphasen reduzieren temporär teure visuelle Effekte und Karten-/Chart-Interaktionen.

## 0.8.30.9
- Ensemble-Tooltips schließen zuverlässig durch Antippen/Klicken der geöffneten Tooltipkarte sowie weiterhin durch Außenklick und Escape.
- Niederschlags- und Wind/Böen-Diagramm verwenden wieder dieselbe Recharts-Datumsachse wie das Temperaturdiagramm; die problematische externe HTML-Achse wurde entfernt.
- Senkrechte Tageshilfslinien für Niederschlag und Wind/Böen werden als achsgebundene Referenzlinien sichtbar über den Datenflächen gerendert.
- Hochformat-, Querformat- und Desktop-Geometrie der Ensemble-Achsen durch neue Layoutregression abgesichert.

## 0.8.30.8
- Niederschlag und Wind/Böen: robuste externe Datumsachse im Hochformat; alle 14 Tage bleiben sichtbar.
- Ensemble-Tooltips: Tippen auf die geöffnete Tooltipkarte schließt sie wieder; Außenklick und Escape bleiben erhalten.
- Niederschlag und Wind/Böen: senkrechte Tageshilfslinien werden direkt vom gemeinsamen Recharts-Tagesraster erzeugt.

## 0.8.30.7
- Niederschlagsdiagramm: Zeitachsenbeschriftung im Hochformat wieder dauerhaft sichtbar.
- Ensemble-Tooltips: Interaktion innerhalb der Tooltipkarte schließt die Auswahl nicht mehr.
- Niederschlag und Wind/Böen: senkrechte Tageshilfslinien als sichtbare Vordergrundebene ergänzt.

## 0.8.30.6
- Temperatur-Ensemble: senkrechte Tageshilfslinien wieder sichtbar und direkt aus den tatsächlich gerenderten X-Achsenmarken abgeleitet.
- Temperatur-Ensemble: Sonne-/Wolkenkästchen verwenden dieselben vermessenen Tageszentren; Zellgrenzen liegen exakt in der Mitte benachbarter Achsmarken – einschließlich des letzten Tages rechts.
- Zusätzliche Regression verhindert die Rückkehr zur theoretischen, nach rechts driftenden Wetterband-Geometrie.

## 0.8.30.4
- TypeScript-Buildfix: ungenutzte `cellSlotWidth`-Deklaration entfernt
- Prognose-Kompass professioneller und meteorologisch konkreter formuliert
- Szenario-Cluster mit sofort sichtbarer Prozentübersicht und Anteilsskalen ergänzt

## 0.8.30.2
- Synchronisations-Worker: `midwx.app` und `www.midwx.app` dauerhaft als freigegebene Ursprünge ergänzt.
- Konfigurierte Cloudflare-Originlisten ergänzen nun die MID-Standarddomains, statt sie zu ersetzen.
- Originwerte werden auf den tatsächlichen URL-Ursprung normalisiert; abschließende Schrägstriche verursachen keine Fehlablehnung mehr.
- Einstellungsmenü zeigt bei einem noch veralteten Worker eine konkrete Upload-Anweisung.

## 0.8.30.1
- Temperatur-Ensemble: Sonne-/Wolkenleiste nutzt exakte Tagesintervallgrenzen; die letzte Zelle endet exakt am Plotrand und alle Zellmittel liegen auf den Tagesmarken.
- Temperatur-Ensemble: Zellfüllungen ohne überstehende Einzelrahmen, mit gemeinsamer Außenkontur und exakt positionierten Tagestrennern.
- Kurzfristvorhersage: ausschließlich eine Detailkachel gleichzeitig geöffnet; Wechsel auf eine andere Zeit ersetzt die bisherige Auswahl unmittelbar.
- Kurzfristvorhersage: doppelte Touch-/Click-Auslösung entfernt und Auswahl bei Datenaktualisierung abgesichert.

## 0.8.30.0
- Menü „Daten & Synchronisation“ widerspruchsfrei neu geordnet: automatische Web-App-Synchronisation zuerst, manuelle iCloud-Sicherheitskopie als zusätzlicher Notfallschutz.
- Gemeinsame portable Datenrichtlinie für Sicherung und Synchronisation eingeführt; Ensemble-, Diagramm-, Modul- und weitere App-Einstellungen werden nicht mehr durch zu breite Ausschlüsse übergangen.
- Vollständiger Snapshot-Abgleich v2 synchronisiert nun auch Löschungen und setzt portable Einstellungen auf verbundenen Web-Apps konsistent gleich.
- Sicherungsformat v3 übernimmt auf Wunsch den bestehenden Geräteverbund und stellt Wiederherstellungsstände für weitere Web-Apps bereit.
- Klare iOS-Hinweise ergänzt: Safari und installierte Home-Bildschirm-Web-Apps müssen einmal mit demselben Synchronisationscode verbunden werden.

## 0.8.28.1
- Ensemble-Diagramme im Hochformat verbreitert und in der Höhe reduziert; Achsen, Legenden und leicht diagonale Tagesbeschriftungen vereinheitlicht.
- Ensemble-Tooltips auf Klick/Tipp umgestellt, Animation und Blur entfernt und Outside-Dismiss ergänzt, um iOS-Lags zu vermeiden.
- Temperatur-Tooltip verdichtet; „Best Match“ in der Niederschlagszeile entfernt und Tmin/Tmax-Spalten enger angeordnet.

## 0.8.28.0
- Neue iCloud-Drive-Dateisicherung für Favoriten, App-Einstellungen, Profile und vollständige Wetterzwilling-Langzeitdaten einschließlich Wiederherstellung und Integritätsprüfung
- Vollständiger Neuaufbau der Ensemble-Diagramme auf einer gemeinsamen professionellen Chart-Engine mit identischen Tagespositionen, Achsen, Plotmaßen und responsiven Tooltips
- Temperatur-Wetterleiste als lückenlose Tageszellen; Tageshilfslinien liegen exakt in den Zellmitten
- Mehrstufiger PWA-Startschutz gegen weiße Startseiten mit Cache-Reparatur ohne Löschung lokaler Daten
- Wiederherstellungsoberfläche ermöglicht vor Reparatur eine Datensicherung

## 0.8.27.14
- Sämtliche veralteten Ensemble-, Achsen-, Tooltip-, Wetterband-, Export- und Touch-Regressionstests auf den aktuellen Funktionsvertrag synchronisiert
- GitHub-Installer wird nicht mehr durch Prüfungen der früheren Einzelgeometrien blockiert
- Prognose-Kompass bleibt dynamisch: weitgehend gesicherte Prognosedauer statt pauschal drei Tage

## 0.8.27.13
- GitHub-/CI-Buildfix für gemeinsame Ensemble-Achs- und Diagrammhöhen
- Prognose-Kompass zeigt jetzt die tatsächlich weitgehend gesicherte Prognosedauer statt pauschal 3 Tage

## 0.8.27.12
- Ensemble-Tagesleisten und Tagesachsen vereinheitlicht
- Detailansicht-Pillen verdichtet und UVI kompakter benannt
- Ortssuche und Kurzfrist-Kacheln reaktionsschneller

## 0.8.27.11

- Veröffentlichungsfehler nach erfolgreichem Produktionsbuild behoben: veraltete Regressionstests an die aktuelle Temperatur-Ensemble-, Tooltip- und Achsengeometrie angepasst
- Schutztests für Hoch-/Querformat, Exportgeometrie, Datumsachse, Wetter-/Hazardband und Tooltip-Randsicherung auf den aktuellen Vertrag aktualisiert
- Interaktions-, Referenzdesign-, UI- und Gezeiten-/Tooltip-Layering-Prüfungen mit der neuen responsiven Darstellung synchronisiert
- Vollständiger Lauf aller automatisch erkannten MID-Regressionen erfolgreich

## 0.8.27.10

- Ensemble-Temperaturtrend weiter verdichtet: Tooltip nochmals deutlich kompakter, mobile X-Achse freier und Wetter-/Hazardband sauberer über der Datumsachse positioniert
- Temperatur-Ensemble responsiver abgestimmt: mehr vertikale Reserve für Achsentitel, bessere mobile Geometrie und sicherere Tooltip-Auslenkung am rechten Rand
- Ortssuche spürbar direkter: schnellere Suchauslösung, suchoptimierte Eingabeeigenschaften und direktere Touch-Bedienung
- Kurzfrist-Kacheln für Touch-Bedienung entschärft: direktere Tap-Reaktion und mobile Interaktion mit weniger Verzögerung

## 0.8.27.9
- Ensemble-Temperaturtooltip wieder deutlich kompakter und dichter gesetzt.
- Ensemble-Temperaturdiagramm: zusätzliche Freiräume für Wetterkästchen, Datumsachse und Achsentitel.
- Wetterkästchen schmaler und höher positioniert, damit die X-Achsenbeschriftung nicht mehr verdeckt wird.
- Tooltip-Rechtsausrichtung weiter verschärft, damit rechte Inhalte nicht abgeschnitten werden.

## 0.8.27.8
- Ensemble-Temperaturdiagramm: Tageskästchen optisch enger und klarer auf die Tagesachsen zentriert.
- Ensemble-Temperaturdiagramm: mehr vertikale Reserve für Datumsachse und Achsentitel, damit Hoch- und Querformat stabiler aussehen.
- Temperatur-Tooltip: bei rechten Datenpunkten automatische Linksverschiebung, damit die rechte Spalte nicht mehr abgeschnitten wird.
- Regressionstests für Temperaturband und Tooltip-Geometrie erweitert.

## 0.8.27.7
- GitHub-Veröffentlichung repariert: acht veraltete Regressionstests auf die seit v0.8.27.6 beabsichtigte Temperaturachsen- und Wetterkachelgeometrie aktualisiert.
- Historische Versionsprüfungen prüfen nun Mindeststand und Synchronität mit `MID_BASELINE.json`, statt spätere Wartungsreleases fälschlich abzulehnen.
- Die sichtbaren Achsen- und Kachelkorrekturen aus v0.8.27.6 bleiben unverändert erhalten.

## 0.8.27.6
- Ensemble-Temperaturdiagramm: Tagesachsenbeschriftung wieder klar sichtbar gemacht.
- Wetter-/Bewölkungskästchen im Temperatur-Ensemble höher positioniert, damit Datumslabels nicht verdeckt werden.
- Wetterkacheln im Temperatur-Ensemble kompakter und präziser auf die Tagesachse ausgerichtet.

## 0.8.27.5
- Tagesdetailansicht: kompaktere Info-Pillen oberhalb des Diagramms.
- Neue UVI-Pille in der Detailansicht mit dem maximalen UV-Index des gewählten Tages.
- Wetter-Pille der Detailansicht platzsparender gestaltet, damit die Zusatzinformation erhalten bleibt ohne unnötig Höhe zu verbrauchen.

## 0.8.27.4
- Vite-Build mit explizitem 4-GB-Heap und deterministischen Vendor-Chunks gegen lange Hänger bei „rendering chunks …“ abgesichert.
- Dynamischen `:has()`-Selektor der Tooltip-Ebene durch eine statische, browser- und buildstabile Ebenenreihenfolge ersetzt.
- Explizite esbuild-Minifizierung für JavaScript und CSS festgelegt; komprimierte Größenberechnung bleibt deaktiviert.
- Sämtliche fachlichen und optischen Änderungen aus v0.8.27.3 bleiben erhalten.

## 0.8.27.3
- Ensemble-Tooltip über Temperaturdiagrammen priorisiert, damit es auf Mobilgeräten nicht mehr vom nachfolgenden Diagramm überdeckt wird.
- Wetter-/Bewölkungskästchen im Ensemble-Temperaturdiagramm neu zentriert und mit präziserer Plot-Geometrie an die Tagesachsen angebunden.
- Niederschlags-/Gewittersymbole in den Kästchen vergrößert; Blitzsymbol kontrastreicher und besser erkennbar innerhalb des Kästchenrahmens.

## 0.8.27.2
- Ensemble-Temperaturtooltips halten Metadatenzeilen nun ohne unerwünschte Umbrüche zusammen.
- Wind-/Böendiagramme reservieren einen eigenen Bereich für diagonale Datumsbeschriftungen und den Achsentitel.
- Favoriten reagieren auf Touch-/Pen-Eingaben bereits beim ersten eindeutigen Antippen; das Verschieben bleibt über den Griff erhalten.
- Hintergrundlernen der Wetterzwillinge wird bei Nutzerinteraktion sofort abgebrochen und erst nach einer Ruhephase fortgesetzt.

## 0.8.27.1
- TypeScript-Buildfehler TS2353 in der hyperlokal angepassten Kurzfristvorhersage behoben.
- Die Gewitterrisikoprüfung erhält nun ausschließlich die im `DetailThunderRiskSample` definierten meteorologischen Felder; die benötigten Instabilitätsparameter bleiben vollständig erhalten.
- Eigene Regression gegen erneut eingeschleuste, nicht unterstützte Felder ergänzt.

## 0.8.27.0
- Modelllauf-Änderungsradar und Szenario-Cluster nur noch im erweiterten Modus, jeweils einklappbar und im geschlossenen Zustand nicht gerendert.
- Tagesdetail-Sonne-/Bewölkungsbalken direkt an den aktuellen React-Datenstand gebunden; veraltete DOM-Nachbearbeitung entfernt.
- Weitere Rendering-, Observer-, Scroll-, Resize- und Ensemble-Aufbereitungsbremsen beseitigt; MID-Prognose-Kompass ergänzt.

## 0.8.26.19
- Kurzfristvorhersage wird bei frischer hyperlokaler oder stationsgestützter Analyse für die ersten Zeitstufen kontrolliert an Temperatur, Feuchte, Taupunkt, QFF-Luftdruck, Wind/Böen, Windrichtung, Bewölkung, Sicht und Niederschlag angeglichen.
- Wetterpiktogramme und Detailwerte folgen der lokalen Ausgangslage und laufen je nach Veränderlichkeit des Parameters gestuft zum Best Match zurück.
- Veraltete Stationswerte bleiben ausgeschlossen; km/h-Stationswind wird vor der Angleichung korrekt in kt umgerechnet und die aktive Datenbasis wird in der Kurzfristkarte gekennzeichnet.

## 0.8.26.18
- Gezeitenzeiten werden mittels robuster lokaler Kurvenanpassung zwischen den Modellstützstellen minutengenau geschätzt.
- Ensemble-Hazardmarker erhalten mehr Abstand zum Bewölkungsband; Niederschlagssymbole werden zusätzlich im jeweiligen Tagesfeld beschnitten.
- Temperatur-, Niederschlags- und Windkarten erhalten eindeutige Ebenen, damit Tooltips weder von Hazardmarkern noch von nachfolgenden Diagrammüberschriften verdeckt werden.

## 0.8.26.17
- Wasserwetter-Zeile auf „Gezeiten“ verkürzt und Wendepunktzeiten per Zwischenwertberechnung minutengenau ausgegeben.
- Ensemble-Hazards oberhalb der Bewölkungsfelder angeordnet; mehrere Marker stehen kollisionsfrei nebeneinander.
- Niederschlagssymbole werden dynamisch auf die Abmessungen des jeweiligen Bewölkungsfeldes begrenzt.

## 0.8.26.15
- TypeScript-Buildfehler TS18048 in der hyperlokalen Kurzfrist-Temperaturbrücke behoben; optionale Anker- und Horizontwerte werden vor dem Vergleich typsicher normalisiert.
- Eigene Regression gegen die erneute direkte Gegenüberstellung optionaler Werte ergänzt.

## 0.8.26.14
- Gewitterinformation auf der Startseite kompakter und vollständiger dargestellt; Ortsbezug bevorzugt nun Stadtniveau statt Stadtteilniveau.
- Kurzfristvorhersage für die ersten 15-Minuten-Schritte thermisch an die aktuelle hyperlokale Analyse angenähert.
- Szenariocluster sprachlich und strukturell verständlicher aufbereitet.

## 0.8.26.13

- Ensemble-Hochformat: Temperatur-Tooltip in Größe, Aufbau und Inhalt auf den bewährten Stand v0.8.25.4 zurückgeführt.
- Ensemble-Temperaturdiagramm: Sonne-/Wolkenfelder, Niederschlagssymbolik und Hazardmarker werden wieder tagesgenau am unteren Plotrand statt mitten im Diagramm dargestellt.
- Recharts 3: Die Wetterebene erhält eine explizit aus Chartgröße, Achsenreserven und Tagesdomäne berechnete SVG-Geometrie; die Linien bleiben darüber sichtbar, Hazardmarker darüber.
- Ensemble-Geometrie: identische Tagesdomänen und Achsenreserven der Temperatur-, Niederschlags- und Winddiagramme bleiben erhalten.

## 0.8.26.12

- Ensemble-Diagramme: Optik und Bedienung des Temperaturdiagramms wieder auf den bewährten Stand von v0.8.25.4 zurückgeführt, weiterhin mit stabilem Recharts-3-Größenrahmen.
- Ensemble-Diagramme: schmale tagesgenaue Sonne-/Wolkenfelder, Niederschlagssymbolik und Hazardmarker als leichte, exakt an der gemeinsamen Tagesachse ausgerichtete Ebene wiederhergestellt.
- Ensemble-Diagramme: Temperatur-Tooltip kompakt und vollständig ohne partielle Zeilenumbrüche; lange technische Bezeichnungen wurden fachlich verkürzt statt abgeschnitten.
- Performance: zusätzliche Recharts-Accessibility-Schicht, experimentelle Skalenebenen, große Wetterkarten-Overlays und content-visibility-Rasterisierung entfernt; vertikales Touch-Scrollen priorisiert.

## 0.8.26.11

- Buildfix: Der im Temperatur-Ensemble-Tooltip verwendete Helfer `compactPrecipitationTooltipLabel` ist wieder eindeutig deklariert.
- Ensemble-Funktionalität bleibt unverändert: Wetterkästchen, Niederschlagssymbolik, Hazardmarker, Tooltips und die gemeinsame Tagesausrichtung werden nicht verändert.
- Neue Regression verhindert eine erneute Verwendung des Tooltip-Helfers ohne passende Deklaration.

## 0.8.26.10

- Ensemble-Temperaturdiagramm: Sonne-/Wolken-Kästchen, Niederschlagssymbolik und Hazardmarker werden wieder als eigenständige, stets sichtbare Tageszeile oberhalb der Datumsachse dargestellt. Die Tagespositionen nutzen dieselben linken und rechten Achsenreserven wie alle drei Ensemble-Diagramme.
- Ensemble-Temperaturtooltip: sämtliche Tabellen-, Zusatz- und Hazardzeilen bleiben einzeilig; lange Inhalte werden kontrolliert gekürzt statt umgebrochen.
- Ensemble-Performance: experimentelle Recharts-Skalenhooks und die zusätzliche Accessibility-DOM-Schicht wurden entfernt. ResizeObserver nutzt direkt die gelieferten Maße, Offscreen-Diagramme verwenden content-visibility und Touch-Flächen erlauben ungehindertes vertikales Scrollen.
- Regressionen: Sichtbarkeit der Wetterzeile, Niederschlags- und Hazardmarker, gemeinsame Tagesgeometrie, Tooltip-Zeilen und mobile Scrollentlastung sind zusätzlich abgesichert.

## 0.8.26.9

- Ensemble-Diagramme: TypeScript-Buildfehler der wiederhergestellten Niederschlagssymbolik behoben. Der Zustand `none` wird vor der Übergabe an das Regen-/Schnee-/Mischform-Piktogramm explizit ausgeschlossen.
- Neue Regression schützt die sichtbaren Sonne-/Wolken-Kästchen, Niederschlagssymbole und Hazardmarker vor einer erneuten ungültigen Typübergabe unter Recharts 3.

## 0.8.26.8

- Ensemble-Temperaturdiagramm: Sonne-/Wolken-Kästchen, Niederschlagssymbole und Hazardmarker werden unter Recharts 3 über eine eigene hoch priorisierte Koordinatenebene zuverlässig oberhalb der Diagrammflächen gerendert.
- Ensemble-Temperaturtooltip: Werte, Überschriften und Metadaten bleiben einzeilig; lange Niederschlags- und Hazardtexte werden kompakt dargestellt und behalten den vollständigen Inhalt als Titelinformation.
- Ensemble-Geometrie: gemeinsame Tagesdomäne, Tickfolge und horizontale Ausrichtung von Temperatur-, Niederschlags- und Winddiagramm bleiben unverändert erhalten.

## 0.8.26.7

- Ensemble-Diagramme: Interaktive Darstellung wie vor dem Wartungsaudit wiederhergestellt; Temperatur-, Niederschlags- und Winddiagramm verwenden wieder zuverlässig Tooltips und explizit gemessene Recharts-3-Pixelabmessungen.
- Temperatur-Ensemble: Sonne-/Wolken-Kästchen, Niederschlagssymbolik und Hazardmarker werden wieder innerhalb der Diagrammfläche dargestellt.
- Ensemble-Ausrichtung: Alle drei Diagramme verwenden dieselbe linke und rechte Achsenreserve, dieselbe Tagesdomäne und dieselbe Exportbreite, sodass identische Vorhersagetage vertikal exakt übereinanderliegen.
- Ensemble-Achsen: Die Beschriftung „Vorhersagetag“ wurde enger an die Datumsachse angebunden und optisch vom nachfolgenden Inhalt abgegrenzt.

## 0.8.26.6

- Buildfix: In der Gezeiten-Glättung des Wasserwetter-Moduls wurde ein ungenutzter Callback-Parameter entfernt, der bei aktiviertem `noUnusedParameters` den TypeScript-Produktionsbuild mit TS6133 abbrach.
- Regression ergänzt, damit derselbe Buildfehler nicht erneut eingeführt wird.
- Die Ensemble-/Flugwetterquellen-Regression akzeptiert nun spätere Wartungsstände der v0.8.26-Linie und blockiert dadurch keine legitimen Buildfix-Releases mehr.

## 0.8.26.5

- Ensemble-Diagramme: Recharts-3-Liveansicht auf den nativen responsiven Diagrammmodus umgestellt und mit einer belastbaren Mindesthöhe versehen; Temperatur-, Niederschlags- und Winddiagramme kollabieren dadurch nicht mehr auf 0 Pixel.
- Ensemble-Export: feste, deterministische PNG-Geometrie bleibt unverändert erhalten und ist vom responsiven Livepfad getrennt.
- Flugmeteogramme: Datenherkunft für Vereisungs- und Turbulenzfelder transparent gekennzeichnet. Die dargestellten Felder bleiben MID-Diagnosen aus Druckniveaudaten und werden nicht fälschlich als direkte DWD-ADWICE- oder WAWFOR-EDP-Produkte bezeichnet.
- DWD-Flugwetterprüfung dokumentiert: ADWICE ist ein Produkt für den europäischen Luftraum; globale Turbulenz-/EDP-Daten werden über den vertragspflichtigen WAWFOR-Datensatz in GRIB2 bereitgestellt und sind kein frei abrufbares Open-Data-Produkt.

## 0.8.26.4

- Wasserwetter-Verlauf: Gezeitenwendepunkte werden mit einer amplitudenadaptiven, zeitfensterbasierten Extremenerkennung ermittelt. Dadurch werden Hoch- und Tiefpunkte auch bei flachen 15-Minuten-Wasserstandskurven zuverlässig erkannt.
- Gezeiten: unvollständige oder für die Wendepunkterkennung ungeeignete 15-Minuten-Daten fallen automatisch auf die vollständige stündliche Wasserstandsreihe zurück.
- Marine-Datenabruf: der 15-Minuten-Wasserstand wird ausdrücklich für den vollständigen achtägigen Vorhersagezeitraum angefordert; nicht benötigte 15-Minuten-Strömungsfelder entfallen zugunsten geringerer Datenlast.

## 0.8.26.3

- GitHub-Regressionen von der im Repository bereits aktiven Workflowgeneration entkoppelt: geprüft wird nun das kanonische, im Release gebündelte Workflowpaket. Dadurch bleibt der reguläre MID-Installer auch mit dem älteren aktiven Installationsworkflow lauffähig.
- Automatische Selbständerung von `.github/workflows` aus dem laufenden Installationsjob entfernt. Der jobgebundene `GITHUB_TOKEN` besitzt hierfür keinen eigenständigen Workflow-Schreibvertrag; Workflowupdates werden daher bewusst als separates, manuell einzuspielendes Paket bereitgestellt.
- Kanonische CI-Dateien zusätzlich unter `ci/github/` aufgenommen und mit einem expliziten, idempotenten Synchronisationsskript versehen. Nicht von MID verwaltete Workflows bleiben dabei unangetastet.
- Neue Regression simuliert ausdrücklich einen alten aktiven Installer und stellt sicher, dass Build- und Wartungsprüfungen trotzdem reproduzierbar bestehen.

## 0.8.26.2

- CI-Regressionsprüfungen stabilisiert: Workflowprüfung ist nicht mehr von unverbindlichen Versionskommentaren abhängig und kontrolliert ausschließlich die verbindlichen MID-Workflows.
- Wartungs-/Recharts-3-Test vollständig deterministisch gemacht: die umgebungsabhängige Offline-npm-Unterprozessprüfung wurde durch direkte Lockfile-Struktur-, Quellen- und Integritätskontrollen ersetzt.
- Neue Regression schützt die GitHub-Actions-Prüfungen vor Abhängigkeiten vom Runner-Cache, von npm-Metadaten und von Workflow-Kommentaren.

## 0.8.26.1

- Recharts-3-Buildfix: die nicht mehr unterstützte `isFront`-Eigenschaft der beiden `ReferenceDot`-Marker wurde durch das offizielle `zIndex`-Prop ersetzt. Niederschlags- und Hazardmarker bleiben damit oberhalb der Diagrammflächen sichtbar.
- Die nach der Recharts-3-Migration ungenutzte Konstante `ENSEMBLE_EXPORT_PLOT_WIDTH` wurde entfernt und der TypeScript-Produktionsbuild dadurch von TS6133 bereinigt.
- Neue Regression prüft sämtliche `ReferenceDot`-Marker auf Recharts-3-kompatible Props und verhindert die Wiedereinführung der ungenutzten Exportkonstante.
- Die Wartungsregression prüft Versionsgleichheit nun ohne einen fest codierten Einzelrelease und bleibt dadurch auch für nachfolgende Wartungsstände wirksam.

## 0.8.26.0

- Ensemble-Diagramme auf **Recharts 3.8.1** migriert; `react-is` ist passend zu React 18.3.1 festgeschrieben. Temperatur-, Niederschlags- und Winddiagramm behalten sämtliche Datenreihen, Tooltips, Fehlerbalken, Warnmarker und PNG-Exporte.
- Die drei Ensemble-Diagramme verwenden die Recharts-3-Zugänglichkeitsschicht; responsive Größenänderungen werden gedrosselt und der feste Exportpfad wurde in ein eigenes, wiederverwendbares Chart-Frame-Modul ausgelagert.
- Buildwerkzeuge auf die bereits geprüften stabilen Stände TypeScript 5.9.3, Vite 6.4.3 und `@vitejs/plugin-react` 4.7.0 festgeschrieben. Node-/npm-Vertrag über `engines` und `packageManager` ergänzt.
- Versionssynchronisierung aktualisiert nun auch `package-lock.json`; Paket, Lockfile, Frontend, Baseline, Service Worker und Cloudflare Worker werden gemeinsam auf denselben Releasewert gesetzt.
- TypeScript-Prüfung auf artefaktfreies `--noEmit` umgestellt. Generierte `*.tsbuildinfo`- und `vite.config.*`-Ausgaben werden nicht mehr Bestandteil der Quell- oder Releasebasis.
- Radarhistorie, KOSTRA-Punktdaten und Reise-/Klimatologiecache erhalten LRU-Grenzen, Ablaufbereinigung und bei Local-Storage-Engpässen einen kontrollierten Bereinigungs-/Wiederholungsversuch. Bestehende Cache- und Stale-Fallback-Funktionen bleiben erhalten.
- Die nachträgliche UI-Aufwertung beobachtet nicht mehr das gesamte Dokument einschließlich Attributänderungen. Sie ist auf den App-Baum, relevante Interaktionen und Größenänderungen der betroffenen Diagrammcontainer begrenzt.
- GitHub Actions auf vollständige Commit-SHAs festgeschrieben, Berechtigungen je Job reduziert und regelmäßige npm-Sicherheitsprüfung sowie Dependabot für npm und GitHub Actions ergänzt.
- Das Release enthält eine kanonische, separat einspielbare `.github`-Konfiguration mit SHA-fixierten Actions, Audits und Dependabot; Workflowänderungen werden aus Sicherheitsgründen nicht vom laufenden Installationsjob selbst geschrieben.
- Neue Wartungsregression schützt Recharts-3-Vertrag, Lockfile-Konsistenz, Cachegrenzen, DOM-Beobachtung, SHA-Pinning, Audits, Laufzeitvertrag und Release-Sauberkeit.

## 0.8.25.4

- Wasserwetter-Verlauf: Gezeiten- und Wasserstandswendepunkte werden je angezeigtem Prognosetag für den vollständigen Kalendertag ermittelt und nicht mehr auf das jeweilige Tageslicht-, Aktivitäts- oder Stundenfenster begrenzt.
- Für angebrochene 15-Minuten-Datenreihen verwendet MID automatisch die vollständigere stündliche Wasserstandsreihe, damit am aktuellen Tag auch bereits vor dem sichtbaren Verlauf liegende Hoch- und Tiefpunkte aufgeführt werden.
- Die kompakte allgemeine Gezeitenübersicht bleibt auf kommende Wendepunkte beschränkt; nur die Tageszeile im Wasserwetter-Verlauf zeigt sämtliche Fälle des jeweiligen Kalendertags.

## 0.8.25.3

- 7-Tage-Trend: Eine Tropennacht wird nun auf die dem jeweiligen Prognosetag folgende Nacht bezogen. Bevorzugt werden die Stunden von 20:00 Uhr bis 08:00 Uhr ausgewertet; der Tiefstwert des Folgetags dient nur als Fallback.
- Tageswarnungen: Stark- und Dauerregenhinweise werden nicht mehr einem trockenen Kalendertag zugeordnet, nur weil ein langes 12-/24-/48-/72-Stunden-Fenster erst später einsetzenden Niederschlag umfasst.
- 7-Tage-Trend und Tageskarten bleiben dadurch konsistent: Bei 0,0 mm und trockener Stundenprognose erscheint keine vorgezogene Dauerregen-Aussage mehr.

## 0.8.25.2

- Produktionsbuild repariert: Die in `RadarPanel.tsx` nicht verwendete Variable `pxFactor` wurde entfernt.
- Die Sichtbarkeitslogik des DWD-250-m-Radars bleibt über die explizit verwendete Bedingung `pxDisplayAvailable` vollständig erhalten.
- Eine neue Regression verhindert, dass der ungenutzte PX250-Faktor oder eine gleichartige TypeScript-TS6133-Regression erneut in den Produktionsstand gelangt.

## 0.8.25.1

- Kompositbild: Die Blickrichtungsspitze erscheint nur noch beim tatsächlich per Geräteortung geöffneten Standort; bei gesuchten Orten und Favoriten wird ausschließlich der neutrale Ortsmarker angezeigt.
- Kompositbild: Isobaren und 500-hPa-Isohypsen werden nach dem Laden der MID-Modellkonturen mehrfach geglättet und mit abgerundeten Linien gezeichnet; der DWD-ICON-WMS bleibt als schneller Lade- und Ausfallfallback erhalten.
- Kompositbild: DWD PX250/HX wurde durch redundante DWD-Open-Data-Endpunkte, tolerantere Aktualitätsfenster, robustere HDF5-Datensatzerkennung, korrigierte Projektionsparameter und eine statische Darstellung des neuesten Einzelstands stabilisiert.
- Kompositbild: Blitzpunkte besitzen nun eine eigene, über Radar-, Satelliten- und Warnrastern liegende Kartenebene sowie deutlich sichtbare gefüllte Marker mit Halo.
- Kompositbild: Zugpfeile werden kleiner und transparenter dargestellt, nur noch an tatsächlich nassen Ankerpunkten gesetzt und innerhalb eines Sicherheitsabstands zum Kartenrand ausgeblendet; künstliche Ersatzanker entfallen.
- Radar-Bewegungsanalyse: Ankerpunkte aus den äußeren Rasterzellen werden verworfen, damit NoData- und Kompositränder keine scheinbaren Verlagerungspfeile erzeugen.

## 0.8.25.0

- Kompositbild: OPERA CIRRUS wird nach erfolgreicher HDF5-Rastervalidierung auch dann geladen, wenn der gewählte Standort in einem trockenen oder lokalen NoData-Pixel liegt; die Kartenreprojektion wurde auf mobilen Geräten entlastet.
- Kompositbild: optionale amtliche DWD-Warnkarte auf Gemeindeebene mit eigener Deckkraftsteuerung ergänzt.
- Kompositbild: Isobaren und 500-hPa-Geopotential werden primär als serverseitig gerenderte DWD-ICON-WMS-Layer geladen; die bisherigen MID-Konturen bleiben als automatischer Fallback erhalten.
- Kompositbild: Blitzdarstellung verwendet bei fehlenden Punktdaten nun zuverlässig das jeweils aktuelle DWD-Blitzdichte- beziehungsweise EUMETSAT-MTG-LI-Raster auch ohne veröffentlichte Zeitdimension; NowCastMIX-Punkte unterdrücken das Blitzraster nicht mehr.
- Kompositbild: KONRAD3D nutzt für Zuglinie und Wahrscheinlichkeitskegel den zeitlich weitesten belastbaren Prognosepunkt; falls nur Bewegungsrichtung und Geschwindigkeit vorliegen, wird ein gekennzeichneter 30-Minuten-Zugpfad abgeleitet.
- Kurzfristvorhersage: Überschreitet die prognostizierte Böe eine DWD-Warnschwelle, erhält der Windrichtungspfeil die Farbe der höchsten erreichten Warnstufe.

## 0.8.24.2

- Eigene Warnungen: Der erläuternde Fußtext wurde auf den einzigen Satz „Automatisch aus Best Match abgeleitet.“ gekürzt.
- Aktuelles Wetter: Die Schaltfläche für die Messwertkacheln heißt jetzt kompakt „mehr“ beziehungsweise im geöffneten Zustand „weniger“.
- Aktuelles Wetter: Die Schaltfläche wurde aus dem Inhaltskopf an den unteren rechten Modulrand verlegt. Reservierter Außenabstand, eigener Ebenenwert und mobile Abstände verhindern Überdeckungen mit Tmin/Tmax, Wettertext, Analysekarte und nachfolgenden Modulen.

## 0.8.24.1

- Ensemble-Diagramme: Datumsbeschriftungen der Temperatur-, Niederschlags- und Windachsen werden jetzt diagonal dargestellt, sodass alle 14 Vorhersagetage auch auf schmalen Displays eindeutig lesbar bleiben.
- Ensemble-Diagramme: Mobile Achsenticks verwenden eine stärkere Neigung als Desktop und Export; zusätzlicher Achsenraum verhindert Überdeckungen mit Diagramminhalten und dem externen Achsentitel.

## 0.8.24.0

- Aktuelles Wetter: Die nachfolgenden Messwertkacheln lassen sich über eine kompakte Schaltfläche im Kopfbereich ein- und ausklappen.
- Der gewählte Zustand der Aktuell-Wetter-Kacheln wird lokal gespeichert und beim nächsten Öffnen von MID wiederhergestellt.
- Die Schaltfläche ist für Maus, Touch und Tastatur bedienbar und weist ihren Zustand über `aria-expanded` aus.

## 0.8.23.0

- Wetterdarstellung vollständig auf ein transparentes, skalierbares SVG-Piktogrammsystem umgestellt. Alle relevanten WMO-Wettergruppen besitzen eigenständige professionelle Symbole für Tag und Nacht, einschließlich Nebel, Reifnebel, Sprühregen, gefrierendem Niederschlag, Schneeregen, Schneegriesel, Schauern, Gewitter und Hagel.
- Das bisher plattformabhängig eckig oder intransparent gerenderte Nebel-Emoji wurde durch ein transparentes Vektor-Piktogramm mit Wolken- und Nebelbändern ersetzt.
- Die neuen Wetterpiktogramme werden konsistent in aktuellem Wetter, Kurzfristvorhersage, 7-Tage-Prognose, Tagesdetail, Ensemble, Widget sowie Berg-, Wasser- und Reisewetter verwendet.
- Gewitterinformation: Bezugsort, aktuelle Zellposition und prognostizierte Zellposition erhalten hinter dem Ortsnamen den dreistelligen ISO-3166-Alpha-3-Ländercode, beispielsweise „Niederkassel, DEU“.
- Der Ortsnamencache der Gewitterinformation wurde auf eine neue Version migriert, damit vorhandene Einträge ohne Ländercode nicht weiterverwendet werden.

## 0.8.22.3

- Kurzfristvorhersage: Die Karten zeigen in der obersten Zeile jetzt direkt die Uhrzeit; die relative +xx-min-Angabe entfällt aus der Kartenansicht und bleibt nur in der Detailansicht erhalten.
- Kurzfristvorhersage: Der Hinweis im Header wurde auf die fachliche Quellenangabe „Best Match“ reduziert; der Zusatz „ohne zusätzlichen Abruf“ entfällt.
- Kurzfristvorhersage: Windpfeile der Karten wurden erneut korrigiert und berücksichtigen nun die 45°-Grundausrichtung des Navigationssymbols, sodass Pfeilrichtung und ausgeschriebene Herkunftsrichtung wieder konsistent zusammenpassen.

## 0.8.22.2

- Radar-Nowcast: Der bisher missverständliche Relativtext „Radarecho erreicht den Standort in … Minuten“ wurde für prognostizierte Standortniederschläge durch einen eindeutigen Uhrzeitraum ersetzt.
- Radar-Nowcast: Sichere Standorttreffer werden als „Niederschlag am Standort voraussichtlich von HH:MM bis HH:MM Uhr“ ausgegeben; unsichere Umgebungsechos bleiben ausdrücklich als mögliches Trefferfenster gekennzeichnet.
- Worker: Das Ende eines prognostizierten Niederschlagsereignisses entspricht nun dem Ende des letzten nassen Radarintervalls statt dessen Beginn. Dadurch entfallen widersprüchliche Angaben wie Ankunft bis 20:30 Uhr und Ende bereits 19:50 Uhr.

## 0.8.22.1

- Kurzfristvorhersage: Zeitachsenstufen rasten nun auf die nächste volle Viertelstunde ein, zeigen vier 15-Minuten-Schritte und wechseln danach auf volle Stunden bis +24 Stunden.
- Kurzfristvorhersage: Windpfeile zeigen jetzt konsistent in die Richtung, in die der Wind weht, während die Himmelsrichtung weiterhin die Herkunftsrichtung des Windes benennt.
- Kurzfristvorhersage: Gewitter-Badges erhalten auf schmalen Karten eine eigene Zeile und überdecken dadurch weder Temperatur noch Wettersymbol.

## 0.8.22.0

- Gewitterinformation: modellierte Böengeschwindigkeiten verwenden nun durchgängig die in MID gewählte Windeinheit.
- Neue optionale Kurzfristvorhersage direkt zwischen Warnungen und 7-Tage-Prognose: +15, +30, +45 Minuten, +1 Stunde und anschließend stündlich bis +24 Stunden; horizontal scrollbar und mit kompakter Detailansicht bei Auswahl. Die Darstellung nutzt ausschließlich bereits geladene 15-Minuten- und Best-Match-Stundendaten und verursacht keine zusätzlichen Abrufe.
- Dashboard-Sektionen können in den Einstellungen einzeln ein- oder ausgeschaltet sowie per Drag-and-drop, Touch-Griff oder Schaltflächen neu angeordnet werden. Deaktivierte Module werden nicht gerendert und lösen dadurch keine modulbezogenen Ladevorgänge aus.
- Gerätesynchronisation: lokal erzeugter QR-Code mit sicherem Fragmenttransfer. Das Zielgerät kann den Code über die Kamera-App scannen, MID öffnen und die Übernahme nach ausdrücklicher Bestätigung durchführen; der Schlüssel wird weder an einen QR-Dienst noch als URL-Anfrage an den Server übertragen.

## 0.8.21.0

- Hyperlokale Analyse: zentrales Quellenqualitätsregister mit feldspezifischer Bewertung von Entfernung, Alter, Standorttyp und Vertrauensfaktor
- Hyperlokale Analyse: lokale Restfeldkorrekturen werden bei geringer Stationsstützung konservativ gedämpft; mehrere übereinstimmende Messpunkte erhalten stärkeres Gewicht
- Niederschlagsmessungen: explizite 10-/60-Minuten-Bezugsintervalle und einheitliche Normalisierung vor der lokalen Assimilation
- Performance: Kurzzeitcache für Stationsanalyse und Modellhintergrund, begrenzte Stale-Fallbacks sowie Cache-Größenlimits
- Workerzugriffe: lokaler Antwortcache, Stale-if-error und temporärer Circuit-Breaker für wiederholt fehlschlagende Endpunkte
- Worker: Quellenvertrag um Niederschlagsintervalle für DWD/Bright Sky, GeoSphere und Synoptic ergänzt; Stations- und Warnantworten abrufschonend zwischengespeichert

## 0.8.20.0

- Hyperlokale Analyse: physische Stationsentdopplung über Kennung, Lage, Höhe, Messzeit und Temperaturplausibilität; Quellenalias-Dopplungen werden vor der Gewichtung entfernt.
- Hyperlokale Analyse: zirkuläre modellgestützte Restfeldanalyse der Windrichtung sowie abschließende Konsistenzprüfung von Temperatur/Taupunkt/Feuchte und Wind/Böen.
- Hyperlokale Analyse: Sicht, Bewölkung, Ceiling, Wolkenuntergrenze und Niederschlag werden nur aus amtlichen beziehungsweise professionellen Beobachtungsnetzen korrigiert.
- Abrufbudget: GeoSphere/Bright Sky werden bei vorhandenem Worker nur bei fehlender Quelle direkt nachgeladen; ein zweiter Stationslauf erfolgt nur bei geringer Dichte, hoher Unsicherheit oder großer effektiver Entfernung.
- Quellen- und Qualitätsaudit für nowcast/LINET, weitere Beobachtungsquellen, App-Architektur, Cachevertrag und Buildprozess ergänzt.

## 0.8.19.12

- 7-Tage-Vorhersage: Haupt- und Untertitel beginnen zuverlässig mit Großbuchstaben.
- Gewitterinformation: aktuelle und prognostizierte Zellposition erhalten nach Möglichkeit einen Ortsnamen; die Ortsauflösung wird räumlich gerastert und 12 Stunden lokal zwischengespeichert.
- Gewitterinformation: nächste Annäherung beziehungsweise möglicher Standorttreffer wird mit Ortszeit und Abstand zum ausgewählten Ort deutlich benannt.
- Gewitterkarte kompakter gestaltet; der freie doppelte Zusammenfassungstext entfällt und Kerndaten stehen ausschließlich in Status- und Unterfeldern.

## 0.8.19.11

- GitHub-Produktionsbuild repariert: Der nach der Gewittertext-Verfeinerung nicht mehr benötigte Parameter `cell` wurde aus `threatHeadline` und dem zugehörigen Aufruf vollständig entfernt.
- Die verfeinerte Gewitterinformation und die natürlichere Sprache der 7-Tage-Untertitel bleiben unverändert erhalten.

## 0.8.19.10

- Gewitterinformation weiter verfeinert: natürliche, wirkungsorientierte Überschriften, klar priorisierte Zellbewegung und farblich differenzierte Kernauswirkungen.
- Erweiterte Gewitterdetails erscheinen in einem größeren, mobilen Infofenster mit Schließen-Schaltfläche.
- 7-Tage-Untertitel verwenden natürliche Zeit-vor-Ereignis-Formulierungen wie „Abends Regen möglich“.

## 0.8.19.9

- Gewitterinformation erweitert: kompakte Kerndaten jetzt direkt auf der Gewitterkarte sichtbar
- Ausführlichere KONRAD3D-Gewitterdetails per Info-Button als strukturierte Übersicht mit Schwerpunkt, Annäherung, Böen-, Hagel-, Blitz- und Zugbahnangaben

## 0.8.19.8

- Tagesdetailansicht: Die kompakte Gewitterrisiko-Prozentangabe erscheint jetzt ab 30 %. Die Schwelle bleibt an die kombinierte Mehrindexdiagnose aus Instabilität, Feuchte, Auslösung und CIN gekoppelt; CAPE allein erzeugt weiterhin kein Signal.
- 7-Tage-Trend: Gewitterformulierungen verwenden jetzt dieselbe stündliche Mehrindexdiagnose wie die Tagesdetailansicht. Die frühere grobe Ersatzregel aus CAPE ≥ 700 J/kg und Tages-Niederschlagswahrscheinlichkeit ≥ 45 % wurde entfernt.
- Bei 30–69 % wird im Trend von Gewitterrisiko gesprochen; erst bei direktem WMO-/Warnsignal oder mindestens 70 % von Gewittern. Dadurch bleiben Kurztrend, Tagesdetail und eigene Warnungen konsistent.

## 0.8.19.7

- Tagesdetailansicht: Gewitterrisiko in der stündlichen Niederschlagskachel jetzt als kompakte Prozentangabe dargestellt
- 14-Tage-Ensemble: Niederschlags-/Schneesymbole bleiben innerhalb der Bewölkungskästchen; Blitzsymbol für Gewitter deutlicher und besser erkennbar

# MID v0.8.19.6

- Tagesdetailansicht: Das kompakte stündliche Gewitterrisiko basiert nicht mehr im Wesentlichen auf CAPE und Niederschlag, sondern auf einer kombinierten Best-Match-Diagnose aus WMO-Gewittercode, CAPE, Lifted Index, konvektiver Hemmung (CIN), Feuchteprofil, integriertem Wasserdampf sowie Schauer-/Niederschlags- und Auslösesignalen.
- Hohe CAPE-Werte allein lösen keine Gewitteranzeige mehr aus. Eine starke konvektive Hemmung kann das Signal unterdrücken, während übereinstimmende Instabilitäts-, Feuchte- und Triggerparameter die Stufe „erhöht“ oder „hoch“ stützen.
- Die Darstellung in der Niederschlagskachel bleibt unverändert kompakt als „⚡ erhöht“ beziehungsweise „⚡ hoch“; die Kachelgröße wird nicht verändert.
- Die zusätzlichen Open-Meteo-Parameter werden im bestehenden Best-Match-Abruf mitgeführt und verursachen keine weiteren Netzaufrufe.
- Neuer Regressionstest schützt Datenvertrag, Mehrindex-Bewertung, starke CIN-Deckelung, konservativen Fallback und direkte WMO-Gewittersignale.

# MID v0.8.19.5

- Tagesdetailansicht: Die bestehende stündliche Niederschlagskachel nennt bei signifikantem Modellhinweis nun kompakt ein erhöhtes oder hohes Gewitterrisiko. WMO-Gewittercodes werden unmittelbar berücksichtigt; zusätzlich werden CAPE, Niederschlagssignal und Niederschlagswahrscheinlichkeit gemeinsam plausibilisiert.
- Die Gewitterinformation wird in der vorhandenen Detailzeile der Niederschlagskachel ausgegeben und per Ein-Zeilen-Kürzung begrenzt, sodass die Kachelgröße unverändert bleibt.
- Ensemble-Temperaturtrend: Die Niederschlagsmenge wird in den Bewölkungs-/Sonnenkästchen nur noch über ein kleines oder großes Symbol unterschieden. Regen nutzt einen Tropfen, Schnee eine Schneeflocke; Mischformen kombinieren beide kompakt.
- Gewitterblitze werden neben das Niederschlagssymbol versetzt und passend verkleinert, damit weder Blitz noch Tropfen/Flocke einander verdecken und die Symbolik vollständig innerhalb des bestehenden Kästchens bleibt.
- Neuer Regressionstest schützt die stündliche Gewitterrisikologik, die kompakte Kachelintegration und die vereinfachte Ensemble-Symbolik.

# MID v0.8.19.4

- GitHub-/TypeScript-Buildfix für die ICAO-Ortssuche: Der Rückgabetyp des neuen Worker-Aufrufs wurde an den bestehenden `fetchWorkerJson`-Vertrag angepasst. Damit ist `Location` nicht mehr fälschlich direkt gegen den optionalen Worker-Fehlerumschlag typisiert.
- Die ICAO-Suche, ihr 30-Tage-Cache, die NOAA-AviationWeather-Auflösung und die Darstellung in Haupt- und Reisewettersuche bleiben funktional unverändert.
- Neuer Regressionstest schützt vor dem konkreten TS2559-Buildfehler.

# MID v0.8.19.3

- Ortssuchen erweitert: Neben Ort, Region, PLZ und POI können nun weltweit exakte vierstellige ICAO Location Indicators wie EDDG, EDDF oder KJFK eingegeben werden.
- Die gemeinsame Suchfunktion steht damit auch in der Hauptsuche und im Reisewetter-Reiseplaner zur Verfügung. ICAO-Treffer werden als Flughafen gekennzeichnet und mit Koordinaten sowie Höhenlage übernommen.
- Abrufschutz: Eine ICAO-Abfrage wird nur bei einem exakten vierstelligen Suchmuster und fehlendem gleichnamigem Orts-/PLZ-Treffer ausgelöst. Erfolgreiche Ergebnisse werden 30 Tage lokal gespeichert; parallele identische Abfragen werden zusammengeführt.
- Der Worker löst ICAO-Kennungen über NOAA AviationWeather auf und speichert erfolgreiche Antworten zusätzlich mit einem 30-Tage-HTTP-Cache.
- Neuer Regressionstest schützt Datenvertrag, Caching, Worker-Endpunkt und alle drei Suchoberflächen.

# MID v0.8.19.2

- Ensemble-Temperaturdiagramm: In den Bewölkungs-/Sonnenkästchen erscheinen nun bei Best-Match-Niederschlag kompakte Niederschlagssymbole direkt innerhalb des bestehenden Rahmens. Je nach Niederschlagsart werden Tropfen, Schneeflocken oder gemischte Symbole gezeigt; Gewittertage erhalten zusätzlich einen Blitz.
- Die Symbolik wird nach Best-Match-Niederschlagsmenge und -wahrscheinlichkeit in ein bis drei Zeichen abgestuft, ohne die Diagrammgröße oder die Kästchengeometrie zu verändern.
- Der Tooltip des Temperaturtrends nennt zusätzlich die zugehörige Best-Match-Niederschlagsart, -menge und die Best-Match-Wahrscheinlichkeit.

# MID v0.8.19.1

- Reisewetter-Abrufe deutlich reduziert, ohne die Sektion zu deaktivieren: pro ungefähr 10-km-Klimaraster und Höhenklasse wird nur ein kompakter Basisdatensatz angefordert und anschließend drei Jahre lokal wiederverwendet.
- Parallele oder wiederholte identische Klimaanfragen werden zusammengeführt; mehrfaches Tippen beziehungsweise gleichzeitige Auswertungen lösen dadurch keinen doppelten Netzabruf aus.
- Der Basisabruf wurde um nicht benötigte historische Variablen verkleinert. Temperaturmittel und Bewölkungsnähe werden aus den verbleibenden Tageswerten abgeleitet.
- Detaillierte historische Schneehöhe wird nicht mehr automatisch allein durch die Optimierung „Hohe Schneelage“ geladen. Sie erfordert eine ausdrückliche Zusatzoption oder eine definierte Mindestschneehöhe; ohne Zusatzabruf bewertet MID das bereits enthaltene Schneefallpotenzial.
- Die Reisewetter-Sektion nutzt weiterhin keinen MID-Worker und bleibt standardmäßig eingeklappt. Ein neuer Regressionstest schützt Abrufbudget, In-Flight-Entdopplung, Rastercache, reduzierten Variablensatz und die explizite Schneehöhenfreigabe.

# MID v0.8.19.0

- Neue, standardmäßig eingeklappte Sektion „Reisewetter & Reiseplaner“ im unteren App-Bereich. Sie ist im Standard- und Erweiterten Modus verfügbar und wird erst beim Scrollen beziehungsweise Öffnen lazy geladen.
- Freie Zielortsuche unabhängig vom aktuell geöffneten MID-Ort. Für einen festen Reisezeitraum werden klimatologisch erwartbare Temperatur, Niederschlagstage, Sonnenschein, Wind, Schneefall und ein kompakter Tagesverlauf dargestellt.
- Flexibler Reiseplaner: Innerhalb eines Suchzeitraums von bis zu 120 Tagen kann ein 2- bis 42-tägiges Reisefenster nach „ausgewogen“, möglichst trocken, warm, kalt, sonnig, schneereich oder windarm optimiert werden.
- Optional definierbare Bedingungen: Mindest-/Höchsttemperatur, maximale Regentage, Mindestsonnenschein, maximales Windmaximum und Mindestschneehöhe. Falls kein Fenster alle Bedingungen erfüllt, zeigt MID transparent die beste Annäherung und die noch verfehlten Kriterien.
- Datengrundlage ist die Open-Meteo-ERA5-Land-Reanalyse 1991–2020. Historische Schneehöhe wird nur bei ausdrücklicher Schneewahl zusätzlich aus Stundenwerten geladen; alle Klimadaten werden lokal aggregiert und für 180 Tage zwischengespeichert. Die Sektion erzeugt keine automatischen Workerzugriffe.
- Neuer Regressionstest schützt Modulposition, eingeklappten Standardzustand, Zielortsuche, feste und flexible Planung, Bedingungen, Klimadatenpfad, optionale Schneehöhe und die dynamische Auswahl des besten Zeitfensters.

# MID v0.8.18.15

- Wasserwetter-Verlauf: Gezeiten- und Wasserstandswendepunkte werden nun direkt in der Tagesmatrix angezeigt. Jeder Tag enthält eine kompakte Tabellenzeile mit Hoch-/Tiefpunkt, exakter Uhrzeit und modelliertem Wasserstand.
- Die Wendepunktanalyse wurde von sechs auf bis zu 18 Ereignisse erweitert, damit beim Aufklappen der Option „Nächste 3 Tage“ alle verfügbaren Tageswendepunkte abgedeckt werden können.
- Die neue Zeile spannt übersichtlich über die Zeitspalten, bleibt horizontal scrollbar und unterscheidet Hoch- und Tiefpunkte farblich, ohne die stündlichen beziehungsweise dreistündlichen Wasserstandswerte zu verdrängen.
- Neuer Regressionstest schützt Drei-Tage-Abdeckung, Datenübergabe, Tabellenintegration und responsive Darstellung.

# MID v0.8.18.14

- Eigene Warnkarten: Identische niedrigere Warnphasen werden jetzt über eine dazwischenliegende höhere Warnstufe hinweg zu einem einzigen einrahmenden Gültigkeitszeitraum verbunden. Im gezeigten Wärmebeispiel gilt die starke Wärmebelastung damit einmal von 11:00 bis 21:00 Uhr, während die extreme Wärmebelastung weiterhin separat von 15:00 bis 17:00 Uhr ausgewiesen wird.
- Eine niedrigere Warnung wird nur zusammengeführt, wenn Warntyp, Warnstufe und sichtbarer Inhalt unverändert bleiben und die zeitliche Lücke vollständig durch eine höhere Warnstufe desselben Typs abgedeckt ist. Inhaltlich unterschiedliche Phasen bleiben getrennt.
- Neuer Regressionstest schützt die einrahmende Zusammenfassung und verhindert zugleich das versehentliche Zusammenführen unterschiedlicher Warninhalte.

# MID v0.8.18.13

- Ensemble-Temperaturdiagramm: Warnmarker werden nun vor der Darstellung nach Warntyp zusammengefasst. Je Warntyp erscheint ausschließlich die höchste erreichte Warnstufe; unterschiedliche Warntypen bleiben parallel sichtbar.
- Ensemble-Tooltip: Auch die Hazard-Liste enthält je Warntyp nur noch die höchste Warnung. Niedrigere Schwellen desselben Typs werden dort nicht mehr doppelt aufgeführt.
- Neuer Regressionstest schützt die gemeinsame Filterung von Diagrammmarkern und Tooltip sowie den Erhalt verschiedener Warntypen.

# MID v0.8.18.12

- 7-Tage-Vorhersage: Die kompakten Warnsymbole zeigen pro Warntyp nur noch die höchste erreichte Warnstufe. Mehrere Wind-, Schnee-, Regen- oder andere Intensitätsstufen werden in dieser engen Übersicht nicht mehr gestapelt.
- Die vollständige Mehrstufenanzeige mit niedrigeren Intensitäten, Gültigkeitszeiträumen und Windrichtung bleibt in den ausführlichen eigenen Warnkarten unverändert erhalten.
- Neuer Regressionstest schützt die Trennung zwischen kompakter Tagesübersicht und vollständiger Warnkartendarstellung.

# MID v0.8.18.11

- GitHub-/TypeScript-Buildfix für die Mehrstufen-Warnlogik: Die nach der Umstellung nicht mehr verwendeten Hilfsfunktionen `levelFromThresholds` und `windClassification` wurden entfernt.
- Die aktive Mehrstufenberechnung über `windClassifications` sowie alle niedrigeren Warnstufen, Gültigkeitszeiträume und Windrichtungstexte bleiben unverändert erhalten.
- Neuer Regressionstest schützt vor erneutem Einbringen ungenutzter Warnungs-Helper und sichert die aktive Mehrstufen-Windlogik ab.

# MID v0.8.18.10

- Eigene Warnungen: Beim Überschreiten mehrerer Schwellen werden nun neben der höchsten Warnstufe auch die niedrigeren Intensitätsstufen ausgegeben.
- Jede Warnstufe erhält einen eigenen, automatisch berechneten Gültigkeitszeitraum; bei Wind bleibt die niedrigere Stufe über den gesamten Zeitraum aktiv, in dem ihre Schwelle überschritten wird, während höhere Stufen als zusätzliche engere Warnphase erscheinen.
- Windwarnungen nennen bei niedrigeren Stufen Schwellenwert und zeitweilige Spitze, etwa „Windböen über 50 km/h; zeitweise bis 71 km/h“, einschließlich Windrichtung beziehungsweise Richtungsänderung.
- Niedrigere Warnstufen werden kompakt als solche gekennzeichnet, ohne die bestehende übersichtliche Kartenstruktur oder die Datums-/Zeitkapsel zu vergrößern.
- Neuer Regressionstest schützt Mehrstufenlogik, überlappende Warnzeiträume, Windrichtungstext, Datenvertrag und responsive Darstellung.

# MID v0.8.18.9

- Eigene Windwarnungen korrigiert: Die reale stündliche Best-Match-Windrichtung wurde intern im Feld `direction` geführt, die Warnlogik hatte jedoch ausschließlich `windDirection` ausgewertet. Dadurch blieb die Richtung trotz vorhandener Daten im Warntext leer.
- Die Warnlogik akzeptiert nun beide Feldbezeichnungen und übernimmt damit die tatsächlich von MID verwendeten Stundenwerte zuverlässig.
- Stabile Richtungen erscheinen direkt im Satz, etwa „Windböen bis 29 kt (54 km/h) aus westlicher Richtung.“; markante Drehungen werden weiterhin als „anfangs …, später …“ formuliert.
- Neuer dynamischer Regressionstest verwendet ausdrücklich den echten `Hour.direction`-Datenvertrag und schützt sowohl konstante Richtung als auch Richtungswechsel vor erneutem Ausfall.

# MID v0.8.18.8

- Eigene Windwarnungen: Die modellierte Windrichtung steht nun direkt im laufenden Warntext – analog zur Formulierung amtlicher DWD-Warnungen – und nicht mehr in einer separaten Kapsel.
- Bei stabiler Richtung lautet die Warnung beispielsweise „Sturmböen bis 39 kt (71 km/h) aus westlicher Richtung.“
- Bei markanter Drehung wird der Text unmittelbar erweitert, etwa „…; anfangs aus südwestlicher, später aus nordwestlicher Richtung.“
- Die separate Windrichtungs-Kapsel einschließlich ihrer CSS-Regeln wurde entfernt; die kompakte Gültigkeitskapsel bleibt unverändert bestehen.
- Regressionstests schützen die Inline-Formulierung, Richtungswechsel, den 360°-/0°-Übergang und das Fehlen der separaten Richtungsanzeige.

# MID v0.8.18.7

- Eigene Windwarnungen zeigen jetzt zusätzlich die modellierte Windrichtung im jeweiligen Warnzeitraum.
- Bei stabiler Windrichtung erscheint eine kompakte Angabe wie „Aus südwestlicher Richtung“.
- Markante Richtungsänderungen werden zeitlich verständlich beschrieben, beispielsweise „Anfangs aus südwestlicher, später aus nordwestlicher Richtung“.
- Die Richtungsbewertung verwendet zirkuläre Mittelwerte, sodass der Übergang über 360°/0° korrekt als nördliche Strömung erkannt wird.
- Die aktuelle Warnkarte erhält eine kompakte Windrichtungs-Kapsel; Tages-, Widget- und Ensemble-Hazard-Tooltips übernehmen die Richtungsinformation ebenfalls.
- Neuer Regressionstest schützt konstante Windrichtung, Richtungswechsel, 360°-Übergänge und responsive Darstellung.

# MID v0.8.18.6

- Eigene Warnindikatoren: Warnzeiträume, die erst morgen beginnen, zeigen nun kompakt sowohl „Morgen“ als auch das konkrete Datum, zum Beispiel „Morgen, 30.07. · 08:00–12:00 Uhr“.
- Spätere Warnungen tragen ebenfalls das Datum; heutige Warnungen bleiben platzsparend bei der Uhrzeit. Zeiträume über Mitternacht zeigen weiterhin Start- und Enddatum vollständig.
- Neuer Regressionstest prüft Morgen-, Folgetag-, Heute- und Mitternachtsdarstellung in der Ortszeitzone.

# MID v0.8.18.5

- Eigene Warnindikatoren zeigen jetzt einen kompakten Gültigkeitszeitraum in Ortszeit. Aktive Zeitfenster beginnen verständlich mit „jetzt“, künftige sowie über Mitternacht reichende Zeiträume werden mit Uhrzeit beziehungsweise Datum dargestellt.
- Die Gültigkeit wird aus den zusammenhängenden Stunden beziehungsweise Akkumulationsfenstern des jeweiligen Warnsignals berechnet; getrennte Ereignisse werden nicht zu einem einzigen langen Zeitraum vermischt.
- Die neue Zeitangabe erscheint als platzsparende, responsive Kapsel direkt in der Warnkarte und bleibt auf schmalen Displays umbrechbar. Amtliche Warnungen und deren bestehende CAP-Zeiträume bleiben unverändert.
- Neuer Regressionstest schützt Berechnung, Datenvertrag, Ortszeitformatierung und kompakte Darstellung.

# MID v0.8.18.4

- Dauerhaft erreichbares Impressum im App-Footer ergänzt und zusätzlich als eigener Bereich „Rechtliches“ im Einstellungsmenü aufgenommen.
- Anbieterkennzeichnung mit vollständigem Namen und ladungsfähiger Anschrift integriert.
- Die Kontaktadresse liegt weder im initialen DOM noch als zusammenhängender Klartext im App-Quellcode vor. Sie wird erst nach bewusster Nutzerinteraktion aus getrennten Zeichencodes zusammengesetzt und anschließend als anklickbare E-Mail-Adresse angeboten.
- Barrierearmes Impressumsdialogfenster mit Escape-, Außenklick- und mobiler Vollbildbedienung ergänzt.
- Neuer Regressionstest schützt Erreichbarkeit, Pflichtangaben, responsives Design und die E-Mail-Obfuskation.

# MID v0.8.18.3

- Cross Section vorerst vollständig pausiert: Im Erweiterten Modus erscheint nur noch eine statische Karte „To be continued“. Das aktive Flugmeteorologie-Modul importiert oder rendert die Cross-Section-Komponente nicht mehr.
- Der Worker-Endpunkt `flight-cross-section` ist hart deaktiviert, aus dem Health-Servicekatalog entfernt und antwortet ohne externe Datenabrufe mit HTTP 410. Dadurch entstehen durch diese Funktion keine NOAA-, Open-Meteo- oder Elevation-Subrequests mehr.
- Druckniveau-Meteogramme bleiben unverändert aktiv. Der Cross-Section-Quellcode wird für eine spätere Weiterentwicklung erhalten, aber nicht in den aktiven Frontendpfad eingebunden.
- Neuer Regressionstest schützt die UI-Pausierung, den entfernten Frontendpfad und die serverseitige Sperre.

# MID v0.8.17.0

- Aktuelle Daten: Die Uhrzeiten der Kachel „Sonne / Mond“ verwenden nun eine ausdrücklich begrenzte, an den übrigen Kachelwerten orientierte Schriftgröße. Die Kachel besitzt keine eigene Mindesthöhe mehr und vergrößert die gesamte Parameterzeile weder auf Desktop noch mobil.
- Ensemble: Unterhalb des Niederschlagsdiagramms wurde ein zusätzliches Winddiagramm ergänzt. Es lässt sich zwischen täglichem Windmaximum und Böenspitzen umschalten und zeigt Best Match, gewichtetes Ensemble-Mittel sowie P10–P90 im Stil des Temperaturtrends.
- Die Open-Meteo-Ensembleabfrage und der Worker-Proxy liefern Wind und Böen einheitlich in Knoten. Der Ensemblecache wurde wegen des erweiterten Datenvertrags invalidiert.
- Temperatur-, Niederschlags- und Winddiagramm können einzeln ein- und ausgeklappt werden. Der Zustand wird lokal gespeichert; PNG-Export, Tooltips, Legenden und mobile Darstellung bleiben je Diagramm erhalten.
- Neue und erweiterte Regressionstests schützen Wind-/Böendaten, Worker-Proxy, Exportgeometrie, Diagrammreihenfolge, Einklappzustände sowie die kompakte Sonne-/Mond-Kachel.

# MID v0.8.16.1

- Aktuelle Daten: Die Kachel „Sonne / Mond“ wurde kompakter abgestimmt. Die Zeitwerte für Sonnenaufgang und Sonnenuntergang verwenden nun deutlich kleinere, an die übrigen Kacheln angeglichene Schriftgrößen.
- Die Mindesthöhe der Sonne-/Mond-Kachel wurde spürbar reduziert, damit die gesamte Zeile der aktuellen Daten auf Desktop und mobil nicht unnötig in die Höhe gezogen wird.
- Die Trennung von Sonnenaufgang, Sonnenuntergang, Mondphase und Tageslänge bleibt erhalten, jedoch mit dichterem vertikalem Rhythmus und platzsparenderen Details.
- Der bestehende Regressionstest für die Astronomie-Kachel prüft jetzt ausdrücklich die kompaktere Typografie und die verringerte Kartenhöhe.

# MID v0.8.15.7

- Aktuelle Daten: Die Kachel „Sonne / Mond“ wurde erneut an das Standarddesign der übrigen Kacheln angeglichen. Sonnenaufgang und Sonnenuntergang erscheinen nun als zwei untereinander liegende, sauber getrennte Zeitblöcke mit Trennlinie statt in einer Sonderdarstellung.
- Desktop- und Mobilansicht wurden auf überlappungsfreie Darstellung optimiert: mehr vertikale Reserve, stabile Typografie, kein Zusammenlaufen der Überschriften und keine Kollision mit der Info-Schaltfläche.
- Mondphase, nächste Mondphase und Tageslänge bleiben darunter kompakt erhalten.
- Der Regressionstest für die Astronomie-Kachel prüft jetzt ausdrücklich das standardnahe Kartenlayout sowie die überlappungsfreie Desktop-/Mobilstruktur.

# MID v0.8.15.4

- Standortauswahl mit Favoritenabgleich korrigiert: Nach einer Geräteortung prüft MID die bewährte geografische Nahbereichszuordnung. Entspricht die Position einem gespeicherten Favoriten, wird dessen kanonischer Ort geöffnet statt eines separaten Reverse-Geocoding-Punkts.
- Dadurch werden für die Standortauswahl automatisch die vollständigen Favoritenprofile verwendet, insbesondere Wetterzwilling-Daten, lokale Lernhistorie sowie Berg-/Winter- und Wasserprofile. Die tatsächlich gemessene Geräteposition bleibt separat für Standortstatus und Distanzprüfung gespeichert.
- Favorit und Standort dürfen nun gleichzeitig aktiv markiert sein: Der passende Favorit bleibt in Schnellleiste, Suchmenü und Favoritenverwaltung blau markiert; zusätzlich erhält der Standort-Eintrag seinen blauen Rahmen, solange die Auswahl tatsächlich von der Geräteortung stammt.
- Eine manuelle Orts- oder Favoritenauswahl entfernt weiterhin sofort ausschließlich den Standort-Rahmen. Beim Standortabgleich wird auf den ausdrücklich zugeordneten kanonischen Favoritenort umgeschaltet, damit Wetterdaten, Favoritenschlüssel und Profildaten konsistent aus derselben Ortsbasis stammen.
- Neuer Regressionstest schützt Favoritenabgleich der Geräteposition, kanonische Favoritenauswahl, gleichzeitige Standort-/Favoritenmarkierung und das Zurücksetzen des Standortstatus bei manueller Auswahl.

# MID v0.8.15.3

- Berg-/Wintersport: Der vollständige Höhenwetter-Verlauf ist im Sommer- wie im Winterprofil standardmäßig eingeklappt und lässt sich über eine kompakte Kopfzeile gezielt öffnen und wieder schließen.
- Beim Wechsel zwischen Sommer- und Winterprofil wird der Höhenwetter-Verlauf erneut geschlossen; auch eine zuvor aufgeklappte Drei-Tage-Ansicht kehrt in den kompakten Ausgangszustand zurück.
- Die 1-/3-Stunden-Umschaltung und die Erweiterung auf die nächsten drei Tage bleiben nach dem Öffnen unverändert verfügbar. Auf mobilen Displays beansprucht die geschlossene Darstellung nur noch eine kompakte Zeile.
- Neuer Regressionstest schützt den geschlossenen Startzustand, beide Saisonbezeichnungen, den Saisonwechsel und die bedingte Darstellung der umfangreichen Höhenmatrix.

# MID v0.8.15.2

- Favoriten-Nahbereichslogik wiederhergestellt: Exakte Koordinaten werden weiterhin bevorzugt; Orte und POIs innerhalb der bewährten plausiblen Distanz- und Höhenschwellen werden wieder demselben Favoriten zugeordnet. Dadurch entstehen bei nur wenigen hundert Metern Abweichung keine unnötigen zusätzlichen Favoriten oder Datenneuladungen.
- Die in v0.8.15.1 eingeführte strikte 150-m-/ID-Prüfung wurde vollständig zurückgenommen. Favoritenmenü, Schnellleiste, Favoritenstern, Ortswechsel und mobile Rand-Wischnavigation verwenden wieder dieselbe konsistente Nahbereichszuordnung.
- Standort-Aktivrahmen grundlegend entkoppelt: Die blaue Markierung richtet sich nun nach der ausdrücklich zuletzt gewählten Quelle „Gerätestandort“ oder „manuelle Orts-/Favoritenauswahl“ und nicht mehr allein nach einem potenziell veralteten `autolocated`-Merkmal im Ortsobjekt.
- Auch wenn ein Ortswechsel wegen geringer Entfernung ohne Datenneuladung abgekürzt wird, wird die Auswahlquelle sofort aktualisiert. Ein manuell gewählter Favorit nimmt daher zuverlässig die Standort-Markierung zurück; ein tatsächlich aufgerufener Gerätestandort aktiviert sie gezielt.
- Der Standort-Rahmen verlangt zusätzlich weiterhin eine geografische Übereinstimmung mit der zuletzt ermittelten Geräteposition. Ein rund 200 km entfernter Ort kann damit weder über die Auswahlquelle noch über die Distanzprüfung als aktiver Standort erscheinen.
- Regressionstest erweitert: geprüft werden Nahbereichszuordnung über wenige hundert Meter, Ablehnung weit entfernter Orte, Quellenwechsel vor dem Kurzschluss, Menüsprung und die einheitlichen Info-Schaltflächen.

# MID v0.8.15.1

- Aktuelle Daten: Die Info-Schaltflächen der Kacheln „Luftqualität“ und „Sonne / Mond“ verwenden nun dieselbe Größe, Ausrichtung und visuelle Gestaltung.
- Favoritenmenü stabilisiert: Beim Öffnen werden der aktuell angezeigte Favorit sowohl im Suchmenü als auch in der Favoritenverwaltung nach dem vollständigen Layout mehrfach abgesichert und direkt mittig in den sichtbaren Bereich geführt. Größenänderungen des Menüs lösen die Positionierung erneut aus.
- Favoriten-Schnellleiste springt auch unter iOS/Safari zuverlässig zum aktiven Favoriten; spätere Layoutänderungen und horizontale Überläufe werden berücksichtigt.
- Standortstatus korrigiert: Gespeicherte Favoriten übernehmen den internen Auto-Standortstatus nicht mehr. Der blaue Aktivrahmen des dynamischen „Standort“-Eintrags erscheint ausschließlich bei einer tatsächlich über die Geräteortung geöffneten Position.
- Die aktive Favoritenerkennung verwendet für die Oberfläche keine großzügige geografische Näherungsprüfung mehr, sodass andere Orte oder nahe POIs nicht fälschlich als aktiver Favorit markiert werden.
- Auch der eigentliche Ortswechsel und die mobile Favoriten-Wischzuordnung verwenden nun dieselbe strikte Identität; nahe, aber unterschiedliche Orte werden nicht mehr als bereits geöffnet verworfen.
- Neuer Regressionstest schützt Info-Schaltflächen, direkten Menüsprung, Favoritenverwaltung, Schnellleiste und die Trennung zwischen Auto-Standort und gespeichertem Favoriten.

# MID v0.8.15.0

- GitHub-Produktionsbuild korrigiert: Die Favoriten-Persistenz verwendet für optionale Idle-Callbacks keine TypeScript-Narrowing-Verzweigung mehr, durch die `window` im Fallback als `never` interpretiert wurde. Der bisherige Fehler TS2339 bei `clearTimeout` ist damit behoben.
- Tagesdetaildiagramm um einen eigenen Luftdruckverlauf in hPa ergänzt. Die adaptive Druckskala erhält eine separate kompakte Diagrammspur; der Verlauf ist standardmäßig sichtbar und über die Legende deaktivierbar.
- Die Detaillegende lässt sich vollständig ein- und ausklappen. Der Zustand wird gespeichert; auf schmalen Displays startet sie beim ersten Aufruf platzsparend eingeklappt.
- Stündliche Detailkacheln neu geordnet: Luftdruck mit kurzfristiger Tendenz beziehungsweise Tagesbereich ergänzt; Bewölkung und UVI zu einer gemeinsamen Kachel zusammengeführt, sodass die mobile Darstellung trotz zusätzlicher Information kompakt bleibt.
- Neuer Regressionstest schützt Buildfix, Luftdruck-Datenpfad, Diagrammspur, schaltbare und persistente Legende sowie die mobile Kachelstruktur.

# MID v0.8.14.0

- Neue Favoriten starten ohne aktive numerische persönliche Regeln. Bestehende unveränderte Standardregeln werden bei der Migration ebenfalls als deaktiviert erkannt; individuell angepasste Regeln und Push-Regeln bleiben erhalten. Ein eigener Schalter aktiviert die 24-Stunden-Prüfung bewusst je Favorit.
- Favoritenmenü korrigiert: Beim Öffnen wird der aktuell angezeigte Favorit nach vollständig aufgebautem Menü zuverlässig mittig in den sichtbaren Bereich geführt. Die Positionierung wird über zwei Renderframes und einen kurzen Layout-Fallback abgesichert.
- Performance-Audit erweitert: Favoritenänderungen werden entprellt und in Browser-Leerlaufphasen gespeichert, bei Ausblenden oder Schließen aber sofort gesichert. Unveränderte Push-/Lernsignaturen werden memoisiert, Wetterzwilling-Ableitungen reagieren nur noch auf tatsächlich relevante Schalter, und lange Favoritenlisten werden per Rendering-Containment entlastet.
- Deaktivierte persönliche Regeln erzeugen weder Regelberechnungen noch die zugehörigen kontrollierten Eingabefelder; Push-Benachrichtigungsregeln bleiben davon unabhängig.
- Neuer Regressionstest schützt Standardzustand, Legacy-Migration, robustes Zentrieren des aktiven Favoriten und die zusätzlichen Performance-Maßnahmen.

# MID v0.8.13.0

- Wetterpiktogramme konsequent um Tages-/Nachtvarianten ergänzt: Bewölkung, Sprühregen und Schauer verwenden nachts keine Sonnenpiktogramme mehr. Der Höhenwetter-Verlauf übernimmt dafür nun ebenfalls den jeweiligen `is_day`-Status je Zeitabschnitt.
- Sonne-/Mond-Kachel verdichtet: Sonnenauf- und -untergang bleiben kompakt im Primärwert; Mondphase und die verbleibenden Tage bis zum nächsten Neu- oder Vollmond erscheinen direkt darunter.
- Schließbares Astronomie-Info-Popover ergänzt. Es zeigt chronologisch astronomische, nautische und bürgerliche Dämmerung, blaue und goldene Stunde, Sonnenhöchststand sowie Mondauf- und -untergang. Außenklick/-tippen und Escape schließen wie bei den übrigen MID-Tooltips.
- Astronomiekern erweitert um zusätzliche Sonnenhöhen-Ereignisse und Countdown zum nächsten Neu-/Vollmond.
- Neuer Regressionstest schützt Nachtpiktogramme, Höhenwetter-Tag/Nacht-Bezug, kompakte Mondanzeige und das Astronomie-Popover.

# MID v0.8.12.0

- Wassersportmodul sprachlich auf „Wassersport“ verkürzt; Favoritenprofil, Schnellzugriff und Modulkopf verwenden nun dieselbe Bezeichnung.
- Neuer standardmäßig eingeklappter „Wasserwetter-Verlauf“ analog zur Höhenwetter-Matrix: umschaltbar zwischen 1- und 3-Stunden-Auflösung, mit aufklappbaren nächsten drei Tagen und Tageslichtfenstern.
- Der Verlauf zeigt Wetter, Luft-/gefühlte Temperatur, Wind/Böen, Niederschlag, Sicht sowie Gewitter/UVI; an geeigneten Meeresstandorten zusätzlich Welle/Richtung, Wellenperiode, Wassertemperatur, Strömung und modellierten Wasserstand.
- Automatische Bergsaison korrigiert: Außerhalb der klassischen Skisaison wird im Automatikmodus konsequent „Sommer“ gewählt; einzelne Restschnee- oder Neuschneesignalwerte erzwingen dann kein Winterprofil mehr.
- Neuer Regressionstest schützt Wasserwetter-Verlauf, eingeklappten Startzustand, Wassersport-Wording und die saisonale Sommerwahl.

# MID v0.8.10.2

- Aktuelle Sonnenscheindauer wird in der Wetterkachel konsequent als Minutenwert je ausgewiesenem Stundenfenster dargestellt: beispielsweise „60 min“ statt „1 h“.
- Die Anzeige bleibt auf die tatsächlich abgedeckte Zeitspanne und grundsätzlich auf höchstens 60 Minuten begrenzt; bei nur 45 Minuten Datenabdeckung können daher maximal 45 min erscheinen.
- Tages- und Ensembleangaben bleiben weiterhin in Stunden, da dort mehrstündige beziehungsweise tägliche Summen dargestellt werden.
- Neuer Regressionstest schützt Minutenformat, Stundenobergrenze und die Verwendung der aggregierten 60-Minuten-Auswertung in der aktuellen Wetterkachel.

# MID v0.8.10.1

- Aktuelle Sonnenscheindauer korrigiert: Die 60-Minuten-Auswertung verwendet jetzt exakt die letzten vier 15-Minuten-Intervalle statt durch die inklusive Zeitgrenze versehentlich fünf Werte zu summieren. Eine Anzeige wie „1 h 15 min in den letzten 60 Minuten“ ist damit ausgeschlossen.
- Jedes 15-Minuten-Intervall wird zusätzlich auf höchstens 900 Sekunden Sonnenschein begrenzt; auch Current- und Stunden-Fallback können den ausgewiesenen Zeitraum nicht mehr überschreiten.
- Volle 60 Minuten werden kompakt als „1 h“ statt „1 h 00 min“ dargestellt.
- Neuer Regressionstest schützt Intervallzahl, physikalische Obergrenze und Ausgabeformat.

# MID v0.8.10.0

- Mobile Favoritennavigation ergänzt: Eine deutliche Wischgeste vom linken beziehungsweise rechten Bildschirmrand zur Mitte öffnet den vorherigen beziehungsweise nächsten Favoriten. Die Gesten sind ausschließlich in der Appansicht aktiv und bleiben im Einstellungsdialog gesperrt.
- Favoritenwechsel auf Mobilgeräten und per Desktop-Klick bewahren nun die aktuelle Ansicht: MID merkt sich den sichtbaren Modul-/Sektionsanker, die relative Bildschirmposition und den ausgewählten Prognosetag. Dadurch bleibt beispielsweise das Tagesdetaildiagramm beim Ortswechsel geöffnet und im Sichtbereich.
- Aktuelle Sonnenscheindauer korrigiert: Statt das einzelne 15-Minuten-Current-Intervall fälschlich als letzte Stunde auszugeben, summiert MID bis zu vier echte 15-Minuten-Werte zu einem gleitenden 60-Minuten-Fenster. Der Zeitraum und die Zahl der Intervalle werden transparent ausgewiesen.
- Die aktuelle Viertelstunde der Sonnenscheindauer erhält bei übereinstimmend dichter lokaler und modellierter Bewölkung einen vorsichtigen Plausibilitätscheck; ältere Viertelstunden des 60-Minuten-Fensters bleiben unverändert.
- Neuer Regressionstest schützt Rand-Wischgesten, Ansichts-/Tageserhalt, die 60-Minuten-Sonnenscheinaggregation und den lokalen Bewölkungsabgleich.

# MID v0.8.9.0

- Berg-/Wintersport-Höhenwetter farblich aufgewertet: Wind-/Böenzellen erhalten ab den bestehenden DWD-nahen Schwellen dezente, textkontrastschonende Warnstufen-Hintergründe; Niederschlagszellen reichen von blassem Blau bei geringen Mengen bis zu dunkelblau mit weißer Schrift bei höheren Intervallsummen.
- Wolkenbasis eindeutig referenziert: Die Höhenmatrix zeigt die Untergrenze in Meter über NHN und zusätzlich relativ über dem jeweiligen Tal-/Mittel-/Bergniveau. Unterschiede zwischen Höhenzonen werden als Ergebnis getrennter Punktprognosen und Vertikalprofile erklärt.
- Wolkenschicht- und Sichtplausibilität ergänzt: MID lädt begrenzte Druckniveau-Wolken- und Geopotentialprofile, erkennt Schichten mit mehr als 5/8 Bedeckung und stuft die Sicht innerhalb einer solchen Schicht konservativ als stark reduziert ein. Diese Korrektur fließt auch in die Höhenzonenbewertung ein.
- Neuer Regressionstest schützt Windwarnfarben, Niederschlagsintensitätsfarben, NHN-/Grundbezug und Wolkenschicht-Sichtprüfung.

# MID v0.8.8.1

- Szenariocluster: Temperaturdifferenzen gegenüber Referenzszenario A werden physikalisch korrekt in Kelvin (K) statt in Grad Celsius beziehungsweise mit Gradzeichen ausgewiesen.
- Absolute Temperaturwerte und Temperaturspannen bleiben weiterhin in Grad Celsius (°C).
- Neuer Regressionstest schützt die saubere Trennung zwischen absoluten Temperaturen in °C und Temperaturabweichungen in K.

# MID v0.8.8.0

- Berg-/Wintersport um einen kompakten Höhenwetter-Verlauf erweitert: Für Tal-, Mittel- und Bergzone werden Wetter, Temperatur, Sicht, Wolkenuntergrenze, Wind/Böen, Niederschlag und Schneefallgrenze im Tagesverlauf dargestellt. Die Auflösung ist zwischen 1 Stunde und 3 Stunden umschaltbar; die nächsten drei Tage lassen sich bei Bedarf aufklappen.
- Die bisherige einfache Bergprognose wurde durch die höhenzonierte Vergleichsmatrix ersetzt. Bei 3-Stunden-Auflösung werden Niederschlags- und Schneemengen je Intervall summiert; alle übrigen Parameter bleiben zeitpunktbezogen und kompakt vergleichbar.
- Saison- und Profilstatus im Bergmodul sprachlich und räumlich getrennt: Statt zusammengeschriebenem „WinterAutomatisch · hohe Sicherheit“ erscheint nun beispielsweise „Winter · Saison automatisch erkannt · Profil automatisch abgeleitet · hohe Sicherheit“.
- Szenariocluster vollständig neu visualisiert: Statt blauer Niederschlagssäulen zeigt jede Variante nun sieben Tageskarten mit Temperaturspanne, Niederschlagsmenge und Böenspitze. Ab Szenario B werden die konkreten Tagesabweichungen gegenüber Szenario A direkt ausgewiesen und farblich nach nasser, trockener, wärmer, kühler oder windiger unterschieden.
- Neuer Regressionstest schützt Höhenwetter-Matrix, Auflösungsumschalter, Drei-Tage-Erweiterung, Profilwording und den neuen siebentägigen Szenariovergleich.

# MID v0.8.7.4

- Berg-/Wintersport: Die Analyse nach Höhenzone bewertet nun ausschließlich das Tageslichtfenster von Sonnenaufgang bis Sonnenuntergang des laufenden Tages. Nach Sonnenuntergang wird automatisch der Folgetag ausgewertet und deutlich als „Morgen“ gekennzeichnet.
- Höhenzonenanalyse um einen gestuften Tagesverlauf erweitert: MID ermittelt stundenweise die günstigste Höhenzone und beschreibt relevante Wechsel, etwa eine günstigere Hochlage bis zum Nachmittag und anschließend bessere Bedingungen im Tal wegen Niederschlag, Sichtverschlechterung, Böen oder Gewitterrisiko.
- Gewitterpotenzial und UVI im Bergmodul werden nicht mehr aus dem gesamten 72-Stunden-Zeitraum gebildet, sondern nur aus dem tatsächlich bewerteten Tageslichtfenster. Ein erst übermorgen erwartetes Gewitter beeinflusst damit die heutige oder morgige Höhenzonenanalyse nicht mehr.
- Neuer Regressionstest schützt Tageslichtfenster, Folgetagswechsel, gestufte Höhenzonen und die tagesbezogene Gewitterauswertung.

# MID v0.8.7.3

- Desktop-Hovertext für die niedrigste Gewitterstufe sprachlich korrigiert: Statt „Gewitter: Einfaches Gewitter“ erscheint nun schlicht „Gewitter“.
- Höhere Gewitterstufen bleiben weiterhin als „Starkes Gewitter“, „Schweres Gewitter“ bzw. „Extremes Gewitter“ differenziert.
- Neuer Regressionstest schützt das Wording der niedrigsten Gewitterstufe.

# MID v0.8.7.2

- Szenariocluster sprachlich präzisiert: Die bisher unklare Bezeichnung „abweichende zeitliche Verteilung“ wurde entfernt. MID benennt nun konkret, worin die zeitliche Abweichung besteht, zum Beispiel „Niederschlagsschwerpunkt am Montag statt am Freitag“, „mehr Niederschlag am Sonntag“, „wärmer am Donnerstag“ oder „windiger am Samstag“.
- Die konkrete Beschreibung wird aus dem stärksten Unterschied der Tagesverläufe gegenüber dem führenden Szenario abgeleitet; identische generische Szenariobezeichnungen werden dadurch ebenfalls vermieden.
- Neuer Regressionstest schützt die konkrete parameter- und wochentagsbezogene Szenariobeschreibung.

# MID v0.8.7.1

- Ensemble-Szenariocluster transparenter gemacht: Für jede vertretene Modellfamilie zeigt MID nun, wie viele ihrer Mitglieder dem jeweiligen Szenario zugeordnet sind und welchem Anteil innerhalb dieser Modellfamilie das entspricht. Dadurch ist nachvollziehbar, warum beispielsweise ICON EPS Seamless gleichzeitig in mehreren Szenarien vorkommen kann.
- Szenariobezeichnungen nachgeschärft: Szenario B/C werden relativ zum führenden Szenario beschrieben; doppelte Beschriftungen wie mehrfach „nahe am Ensemble-Schwerpunkt“ werden vermieden.
- Divergenzerkennung robuster eingestellt: Der heutige, bereits teilweise abgelaufene Tag löst keine normale Trennung mehr aus. Eine markante Divergenz wird frühestens ab morgen bei mindestens zwei aufeinanderfolgenden auffälligen Tagen oder ausnahmsweise bei einer außergewöhnlich starken eintägigen Abweichung ausgewiesen. Temperatur, Tagesniederschlag und Böen fließen gemeinsam ein.
- Ensemblecache auf Generation v7 angehoben, damit ältere Szenariodaten ohne Modellfamilienanteile oder mit der früheren empfindlichen Divergenzlogik nicht weiterverwendet werden.
- Neuer Regressionstest schützt Modellfamilienanteile, eindeutige Szenariolabels und die robuste zukünftige Divergenzerkennung.

# MID v0.8.7.0

- „Lokaler Standortfingerabdruck“ in „Lokales Standortprofil“ umbenannt und als standardmäßig eingeklappte, persistente Detailsektion neu gestaltet. Im geschlossenen Zustand bleiben Geländeform, Exposition, Kaltluft-, Nebel- und Gewässereinfluss direkt ablesbar; zum Bearbeiten wird die Sektion wie bisher aufgeklappt.
- Vorbereitung für native Apple-Widgets und watchOS-Komplikationen ergänzt: stabiler Worker-Datenfeed `mid.native.widget.v1`, prüf- und kopierbare Feed-Adresse unter „Daten & Synchronisation“, kompakter 12-Stunden-/5-Tage-Datenvertrag sowie SF-Symbol-Zuordnung.
- Native WidgetKit-Grundstruktur für iOS, iPadOS und watchOS hinzugefügt, einschließlich Swift-`Codable`-Modell, `AppIntentTimelineProvider` und Vorlagen für Home-Screen-, Lock-Screen-, Smart-Stack- und Komplikationsfamilien.
- Neuer Regressionstest schützt Standortprofil-Zusammenfassung, Worker-Feed, Apple-Widgetfamilien und das native Startgerüst.

# MID v0.8.6.2

- Ensemble-Szenariocluster: Die sichtbaren Szenarioanteile werden nun gemeinsam nach dem größten-Rest-Verfahren gerundet und ergeben deshalb immer exakt 100 %. Einzelnes kaufmännisches Runden konnte zuvor wie im Screenshot 42 % + 39 % + 20 % = 101 % erzeugen.
- Die Prozentwerte werden vor der Rundung auf die tatsächlich dargestellten zwei oder drei Szenarien normalisiert; ausgeblendete statistische Restcluster verfälschen die sichtbare Summe damit nicht.
- Erklärung und Tooltip weisen jetzt ausdrücklich darauf hin, dass es sich um relative, gemeinsam gerundete Ensembleanteile und nicht um amtliche Eintrittswahrscheinlichkeiten handelt.
- Neuer funktionaler Regressionstest schützt die exakte 100-%-Summe auch bei Drittelverteilungen, Nullwerten und nicht ganzzahlig summierenden Rohanteilen.

# MID v0.8.6.1

- Open-Meteo-Upstream-Prüfung erweitert: Relevante, verifizierte Änderungen sollen künftig automatisch in den nächsten MID-Entwicklungsstand übernommen werden; unsichere oder inkompatible Änderungen bleiben bis zur fachlichen Verifikation unangetastet.
- Persönlicher Entscheidungszwilling wird im Rückblickmodul vollständig ausgeblendet, solange „Persönliche Empfehlungen“ in den Einstellungen deaktiviert ist. Die Aktivitätsbezeichnung „Draußenaktivität“ wurde appweit durch „Outdoor“ ersetzt.
- Direkte Datenübernahme von Netatmo, Standard-JSON und anderen privaten Wetterstationen bis auf Weiteres vollständig deaktiviert. Bestehende Konfigurationen bleiben für eine spätere Reaktivierung erhalten, werden aber weder abgefragt noch in „Aktuelles Wetter“ oder das Lernarchiv übernommen.
- Harte technische Sperren verhindern Stationsabrufe, OAuth-Starts und private Sensorarchivierung; bei deaktivierter Funktion wird auch kein periodischer Stations-Timer mehr gestartet.
- Neuer Regressionstest schützt bedingte Anzeige des Entscheidungszwillings, Outdoor-Wording und die vollständige Stationssperre.

# MID v0.8.6.0

- Lokale MID-Prognose erhält eine explizite Qualitätsfreigabe: Sie wird erst nach mindestens sechs abgeschlossenen Kontrolltagen, mindestens zwei Modellfamilien, zwei belastbaren aktuellen Prognosetagen und einem mindestens gleichwertigen Vergleich mit Open-Meteo Best Match als Hauptprognose zugelassen.
- Ist die Qualitätsfreigabe erreicht und die Hauptprognose noch nicht aktiviert, erscheint im Dashboard sowie im Modul „Prognosegüte und Rückblick“ ein direktes Aktivierungsangebot.
- Aktivierte lokale Prognosen werden eindeutig als „MID Wetterzwilling · lokal gewichteter Modellmix“ gekennzeichnet. Zusätzlich zeigt MID das führende Modell als Schwerpunkt mit seinem aktuellen Gewichtsanteil; Best Match bleibt ausdrücklich die unveränderte Kontrollgruppe.
- Eine vorzeitig in den Einstellungen aktivierte Hauptprognose wird nur vorgemerkt und erst nach der Qualitätsfreigabe tatsächlich angewendet.
- Neuer Regressionstest schützt Qualitätsfreigabe, Aktivierungsangebot, Modellmix-Kennzeichnung und den Best-Match-Kontrollschutz.

# MID v0.8.5.0

- Geräteübergreifende Synchronisation erweitert: Neben dem kompakten `localStorage`-Stand wird nun das vollständige Wetterzwilling-Langzeitarchiv aus IndexedDB mit sämtlichen Prognosesnapshots, Beobachtungen und Rückblicken exportiert, im Browser per AES-GCM verschlüsselt, in begrenzte Archivteile zerlegt und über den bestehenden Cloudflare-KV-Geräteverbund gesichert.
- Beim Abruf auf einem weiteren Gerät wird das vollständige Langzeitarchiv entschlüsselt und verlustfrei mit dem dortigen lokalen Archiv zusammengeführt. Kein Gerät überschreibt dabei ältere oder zusätzliche Lernfälle eines anderen Geräts; der zusammengeführte Stand wird anschließend wieder verschlüsselt gesichert.
- Der Synchronisationsstatus zeigt nun gesondert Zeitpunkt, Standortzahl und Datensatzumfang des vollständigen Wetterzwilling-Archivs. Manuelle Synchronisation umfasst Einstellungen und Langzeitarchiv; automatische Abgleiche übertragen das Archiv nur bei einem neueren Datenstand.
- Worker um atomare, segmentierte Archivablage mit Manifest, 180-Tage-Aufbewahrung und Bereinigung der vorherigen Archivgeneration erweitert. Es ist weiterhin kein zusätzliches Cloudflare-Binding erforderlich; das vorhandene `MID_PUSH_SUBSCRIPTIONS`-KV wird genutzt.
- Netatmo-Einrichtungsdiagnose verbessert: MID zeigt nun konkret an, welche Worker-Bindings oder Secrets fehlen, deaktiviert den OAuth-Start bis zur vollständigen Konfiguration und erläutert die notwendigen Schritte direkt im Einstellungsbereich.
- Neuer funktionaler Regressionstest schützt Vollarchiv-Export/-Import, verschlüsselte Segmentübertragung, Worker-Manifest, Abruf einzelner Archivteile und die Netatmo-Konfigurationsdiagnose.

# MID v0.8.4.0

- Lokaler Wetterzwilling lernt beim Öffnen beziehungsweise Wieder-Sichtbarwerden der App nun standardmäßig für sämtliche gespeicherten Favoriten und nicht mehr nur für den gerade angezeigten Standort. Die Favoriten werden ressourcenschonend nacheinander verarbeitet; identische Standorte werden entdoppelt, der aktive Ort wird nicht doppelt geladen und jeder Favorit wird höchstens einmal innerhalb von sechs Stunden erneut abgerufen.
- Für jeden fälligen Favoriten werden Best-Match- und Ensembleprognosen archiviert sowie abgeschlossene Rückblicke nachgeführt. Vorübergehende Fehler eines Ortes blockieren die übrige Warteschlange nicht; abgebrochene Läufe werden beim nächsten Öffnen erneut aufgenommen.
- Neuer Wetterzwilling-Schalter „Alle Favoriten beim Öffnen nachführen“ mit sichtbarem Laufstatus und Zeitstempel. Die Funktion ist standardmäßig aktiv, kann aber unabhängig vom eigentlichen Wetterzwilling deaktiviert werden.
- Einstellungsmenü neu geordnet: Ansicht, Farbdesign und Einheiten sind in „Ansicht & Einheiten“ gebündelt; „Lokaler Wetterzwilling“, „Daten & Synchronisation“ sowie „System & Updates“ besitzen eigenständige, intuitiv auffindbare Bereiche. Favoriten heißen nun „Favoriten & Profile“.
- Gerätespezifische Favoritenlauf- und Cooldown-Zustände sind von der Geräte-Synchronisation ausgeschlossen; die eigentlichen Prognosearchive und Lernprofile bleiben synchronisierbar.
- Neuer Regressionstest schützt das Favoritenlernen, die Drosselung, die getrennte Einstellungsnavigation und den Ausschluss technischer Laufzustände aus dem Geräteabgleich.

# MID v0.8.3.0

- Eigene vernetzte Wetterstationen reaktiviert und automatisierbar umgesetzt: Netatmo kann über den offiziellen OAuth-Zugriff mit reinem Stations-Leserecht verbunden, eine Station samt Außenmodul ausgewählt und regelmäßig in MID übernommen werden.
- Anbieterübergreifender Standard-JSON-Adapter ergänzt. Damit können unter anderem Home-Assistant-, Ecowitt-, WeatherLink- oder vergleichbare Bridges über einen HTTPS-Endpunkt Stationswerte an MID bereitstellen.
- Übernommene Eigenmessungen durchlaufen eine feldweise Plausibilitätsprüfung auf Alter, Standortdistanz, meteorologische Wertebereiche, Abweichung zur Referenzanalyse sowie Wind-/Böenkonsistenz. Unplausible Einzelfelder werden verworfen; plausible Werte bleiben nutzbar.
- Plausible Stationswerte ergänzen „Aktuelles Wetter“ und werden mit eigener Quellenkennzeichnung in das Lernarchiv des lokalen Wetterzwillings aufgenommen. Amtliche, analysierte und modellbasierte Referenzen bleiben getrennt nachvollziehbar.
- Netatmo-Zugriffstoken werden im Worker AES-GCM-verschlüsselt gespeichert; lokale Stationszugänge und Bearer-Token sind von der geräteübergreifenden Synchronisation ausgeschlossen.
- Neue Worker-Routen für OAuth-Start, Callback, Status, Beobachtungsabruf und Trennung sowie neuer funktionaler Regressionstest für Netatmo und Standard-JSON.

# MID v0.8.2.2

- Ensemble-Szenariocluster sprachlich korrigiert: Bei genau einer beteiligten Modellfamilie steht nun „1 Modellfamilie“, bei mehreren weiterhin „Modellfamilien“. Die gleiche Singular-/Plural-Logik gilt für die Zusammenfassung der aktiven Modellfamilien.
- Eigene Sensoren bis auf Weiteres vollständig deaktiviert: Eingabefelder und automatischer Abruf wurden aus dem Rückblickmodul entfernt; zusätzlich blockiert der Lernkern sowohl manuelle als auch automatische private Sensorübernahmen. Die Implementierung bleibt stillgelegt für eine spätere belastbare Automatisierung erhalten.
- KPI zur Regenwahrscheinlichkeit eindeutig umbenannt: „Güte der Regenwahrscheinlichkeit“ bezeichnet nun ausdrücklich die historische Kalibrierungsqualität der Best-Match-Wahrscheinlichkeiten und nicht die aktuelle Regenwahrscheinlichkeit. Der zugehörige Brier-Score wird direkt angezeigt und erläutert.
- Neuer Regressionstest schützt Modellfamilien-Wording, die technische Sensor-Deaktivierung und die eindeutige Regenwahrscheinlichkeits-KPI.

# MID v0.8.2.1

- Release-Paketierung korrigiert: Das vorherige ZIP war inkrementell aktualisiert worden und enthielt dadurch neben dem aktuellen Regressionstest noch die veraltete Datei `test-scenario-settings-regime-0820.mjs` sowie ältere Quellstände. GitHub führte deshalb 108 statt 107 Tests aus; der obsolete Test schlug erwartungsgemäß fehl.
- Das Professional-Replacement wird nun als vollständig neu erzeugtes Archiv ausgegeben. Gelöschte oder umbenannte Dateien können damit nicht mehr aus einer Vorgängerversion im ZIP verbleiben.
- Neuer Regressionstest schützt die Release-Sauberkeit und erkennt den veralteten Szenario-/Regime-Test ausdrücklich. Die funktionalen Korrekturen aus v0.8.2.0 zu Szenarioclustern, Dauerregenklassifikation und zentralen Wetterzwilling-Einstellungen bleiben vollständig erhalten.

# MID v0.8.2.0

- Ensemble-Szenariocluster fachlich und visuell überarbeitet: Die führende Karte verwendet keine globale Primärbutton-Klasse mehr, wodurch alle Texte auch im hellen Design lesbar bleiben. Temperaturspanne, Fünf-Tage-Niederschlag und Böenspitze werden nun getrennt ausgewiesen; die Balken sind ausdrücklich als Tagesniederschlag beschriftet.
- Isolierte, statistisch unplausible Niederschlagsausreißer einzelner Ensemblefamilien werden mit einer robusten Median-/MAD-Prüfung vor der Szenarioclusterung entfernt. Der Ensemblecache wurde deshalb auf Generation v6 angehoben.
- Wetterlagenklassifikation korrigiert: Eine Tagesmenge von 5 mm führt nicht mehr pauschal zur „Dauerregenlage“. Dauerregen erfordert nun eine mindestens sechsstündige zusammenhängende Regenphase mit relevanter Menge oder eine DWD-nahe hohe Tagesmenge; Stundenverläufe werden beim Prognosearchiv und aktuellen Rückblick berücksichtigt. Alte gespeicherte Referenzklassifikationen werden neu bewertet.
- Globale Wetterzwilling-Schalter für Hauptprognose, Nowcast-Assimilation, Bias-Korrektur, Wahrscheinlichkeitskalibrierung und persönliche Empfehlungen wurden zentral unter Einstellungen → MID-System zusammengeführt. Das Rückblicksmodul zeigt nur noch den Betriebsstatus; standortbezogene Profile und Aktivitätsprofile bleiben dort editierbar.
- Neuer Regressionstest schützt Szenarioplausibilität, Kennwertdarstellung, Dauerregenklassifikation und die zentrale Einstellungsstruktur.

# MID v0.8.1.0

- Starre 58-%-Grenze der lokalen Modellgewichtung durch eine adaptive, vertrauensabhängige Obergrenze ersetzt. Die zulässige Dominanz eines Modells richtet sich nun nach globaler und wetterlagen-/horizontspezifischer Stichprobe sowie dem echten Kontrollvergleich von „MID lokal gewichtet“ gegen Best Match.
- Adaptive Schutzstaffel eingeführt: in früher Lernphase typischerweise 48–54 %, bei wachsender Evidenz 56–62 % und nur bei ausreichend belegter, nachgewiesener Verbesserung maximal 65 %. Bei negativer Kontrollgüte wird die Grenze automatisch wieder abgesenkt.
- Parametergewichte für Temperatur, Niederschlag, Wahrscheinlichkeit, Böen und Sonnenschein erhalten zusätzlich eigene, von der jeweiligen Stichprobe abhängige Obergrenzen. Die aktuell wirksame Grenze, Vertrauensstufe und Kontrollgüte werden in der Prognoseerklärung ausgewiesen.
- Standortfingerabdruck grundlegend verbessert: MID kombiniert Orts-/POI-Metadaten mit einem 17-Punkte-DEM-Höhenprofil im 10-km-Umfeld und leitet daraus Geländeform, Exposition, Kaltluftsenken-, Nebel- und Gewässereinfluss ab.
- Die Vorauswahl bleibt vollständig editierbar. Ein neuer Schalter „Neu ableiten“ beziehungsweise „Automatik wiederherstellen“ verwirft bei Bedarf manuelle Änderungen und berechnet das Profil erneut. Die Ableitungsgründe sowie DEM-Relief und relative Höhenlage werden transparent angezeigt.
- Neuer Regressionstest schützt adaptive Gewichtsobergrenzen, Kontrollgruppenbezug, parameterbezogene Grenzen, DEM-/Metadatenableitung und die editierbare Rückkehr zur Automatik.

# MID v0.8.0.1

- Umfassendes Audit sämtlicher mit v0.8.0 eingeführter Wetterzwilling-Funktionen durchgeführt und dabei Einheiten-, Herkunfts-, Zeit- und Archivfehler korrigiert.
- Räumliche Umfeldanalyse korrigiert: Stationsentfernungen werden zuverlässig von Metern in Kilometer umgerechnet; bereits gespeicherte fehlerhafte v0.8.0-Werte werden automatisch migriert. Unrealistische Entfernungen werden nicht mehr als reguläre Referenz angezeigt.
- Echozugdarstellung abgesichert: Eine Richtung von 0° wird nur noch bei tatsächlich belastbarer Bewegung ausgegeben; sonst erscheint ein klarer Hinweis. Qualitätsstufen werden vollständig deutsch dargestellt.
- Beobachtungswahrheit bereinigt: Stations-, Radar- und Modellwerte bleiben getrennte Quellen; Radar und Station werden bei der Tagesmenge nicht mehr doppelt gezählt. Hyperlokale Restfeld- und Stationsmittelanalysen werden korrekt als analysiert statt als direkt gemessen gekennzeichnet.
- Zeitzonen- und Tagesgrenzen korrigiert: Prognosehorizonte, Tagesabschluss, Sensorwerte, Rückblicke und persönliche Zeitfenster verwenden nun konsequent die Zeitzone des Standorts.
- Prognosearchiv robuster gemacht: IndexedDB und lokaler Speicher werden verlustfrei zusammengeführt, Schreibvorgänge serialisiert und ältere fehlerhafte Archivdaten migriert.
- Lernlogik gegen Scheingenauigkeit abgesichert: Mindestzahl unabhängiger Tage, gedeckelte Modellgewichte, getrennte Parameterfreigaben und keine vorzeitige Ausweisung eines Modellsiegers.
- Ensemble-Szenarien widerstandsfähiger gemacht: optionale Böen-/Sonnenscheinfelder können fehlen, ohne ganze Modelle oder Cluster unbrauchbar zu machen; entsprechende API-Abfragen besitzen einen reduzierten Fallback.
- Berg-/Wintersportanalyse nach Höhenzone gegen fehlende Werte und NaN-Scores abgesichert; Zeitfenster enden nun am Ende der letzten ausgewerteten Stunde.
- Hintergrundlernen vervollständigt: Archivwiederherstellung und Rückblicksaktualisierung funktionieren auch, wenn das Prognosegüte-Modul nicht geöffnet wird.
- Neuer Wetterzwilling-Audit-Test schützt Einheiten, Quellenherkunft, Zeitzonen, Lernfreigaben, Assimilation, Szenarien und Höhenzonen.

# MID v0.8.0

- Lokaler Wetterzwilling Stufe 1 – Wahrheits-, Standort- und Archivkern: Unveränderliche Prognosesnapshots, unabhängige Beobachtungshierarchie aus Messung, Radar/Analyse, ERA5-Land-Reanalyse und gekennzeichnetem Modell-Fallback; Quellenqualität, Vertrauen und Abdeckung werden mitgeführt. Langzeitspiegel in IndexedDB und Migration bestehender Rückblicksdaten ergänzt.
- Dauerhafter Standortfingerabdruck je Favorit mit Geländeform, Exposition, Kaltluft-, Nebel- und Gewässereinfluss. Eine räumliche Umfeldanalyse macht Stationsdistanz, Echozugrichtung und Standortwirkung sichtbar.
- Wetterzwilling-Archive und Profile bleiben über die vorhandene verschlüsselte Gerätesynchronisation übertragbar.
- Lokaler Wetterzwilling Stufe 2 – Lernkern: Prognosegüte getrennt nach Temperatur, Niederschlag, Regenwahrscheinlichkeit, Böen und Sonnenschein sowie nach Wetterlage und +12/+24/+48/+72 Stunden. Lokale Bias-Korrektur, Brier-Score, Wahrscheinlichkeitskalibrierung, Regularisierung, Mindeststichproben und Vertrauensstufen schützen vor Überanpassung.
- Kontrollgruppen integriert: Open-Meteo Best Match, einfaches Multimodellmittel und MID lokal gewichtet werden parallel archiviert und nachträglich objektiv verglichen. Modellgewichte werden je Parameter, Wetterlage und Horizont berechnet und begrenzt.
- Lokaler Wetterzwilling Stufe 3 – aktiver Zwilling: Die lokal gelernte Vorhersage ist in den Einstellungen als Hauptprognose aktivierbar. Ohne ausreichende Datenbasis bleibt unverändert Best Match aktiv. Für die ersten Stunden können Radar-/Nowcast-Signale nachvollziehbar assimiliert werden; Rohprognosen bleiben unverändert im Archiv.
- Lokaler Wetterzwilling Stufe 4 – persönlicher Entscheidungszwilling: Aktivitätsprofile für Arbeitsweg, Draußenaktivitäten, Garten, Rudern, Hundespaziergang, Berg-/Wintersport und Hitzeschutz. MID ermittelt geeignete Zeitfenster, nennt Auswirkungen und Unsicherheit und lernt über hilfreiche/nicht passende Rückmeldungen.
- Ensemble-Datenbasis für den Lernkern um Böen und Sonnenscheindauer erweitert. Neue Regression schützt sämtliche vier Wetterzwilling-Stufen und die aktive App-Integration.

# MID v0.7.111.1

- GitHub-Produktionsbuild repariert: Zwei durch die neuen Lern-/Szenariofunktionen verbliebene, ungenutzte Funktionsparameter wurden entfernt. Dadurch bestehen `noUnusedLocals` und `noUnusedParameters` wieder ohne TS6133-Abbruch.
- `currentWeightedForecasts` erhält nur noch die tatsächlich verwendeten Prognose-, Ensemble- und Auswertungsdaten; die Funktionalität der lokal gewichteten Prognose bleibt unverändert.
- Die Ermittlung des ersten Szenario-Divergenztags verwendet keinen ungenutzten Datumsparameter mehr; Ensemble-Szenariocluster bleiben unverändert.
- Zusätzliche Compilerprüfung über sämtliche TS-/TSX-Quelldateien bestätigt: keine verbliebenen TS6133-/TS6192-/TS6196-Diagnosen.

# MID v0.7.111.0

- Prognosegüte zum lokalen Lernsystem ausgebaut: Modellfehler werden getrennt nach Wetterlage sowie +12-, +24-, +48- und +72-Stunden-Horizont bewertet. Die Rückblicksreferenz wurde um Wettercode, Böen und Sonnenscheindauer erweitert, um Hochdruck-, Schauer-, Dauerregen-, Gewitter-, Sturm- und winterliche Lagen zu unterscheiden.
- Lokal lernende Modellgewichtung umgesetzt: Gewichte werden aus historischen Fehlern je Wetterlage und Vorhersagehorizont mit globaler Regularisierung, Mindeststichprobe und Gewichtsobergrenze abgeleitet. MID speichert die daraus erzeugte Prognose als eigenen Vergleich und weist die nachträglich gemessene Verbesserung oder Verschlechterung gegenüber Open-Meteo Best Match aus.
- Ensemble-Szenariocluster ergänzt: vollständige Ensemble-Mitglieder werden über bis zu sieben Tage nach Temperatur- und Niederschlagsverlauf gruppiert. MID zeigt zwei bis drei gewichtete Szenarien mit Anteil, beteiligten Modellfamilien, Verlaufszusammenfassung und dem ersten markanten Divergenztag.
- Berg-/Wintersportanalyse nach Höhenzone ergänzt: Für Tal-, Mittel- und Bergzone werden die nächsten Stunden anhand von Temperatur, Wet-Bulb-Temperatur, Sicht, Niederschlag, Gewitterpotenzial und Böen bewertet. MID nennt die günstigste Höhenzone, das beste Zeitfenster, Schneequalität und relevante Einschränkungen.
- Bestehende Prognosearchive der v1-Struktur werden verlustarm in das erweiterte v2-Archiv migriert; die Daten bleiben über die vorhandene verschlüsselte Gerätesynchronisation übertragbar.
- Neuer Regressionstest schützt Lerngewichtung, Wetterlagen-/Horizontbewertung, Szenariocluster, Höhenzonenanalyse und deren App-/UI-Verdrahtung.

# MID v0.7.110.0

- Modelllauf-Änderungsradar auf die nächsten drei Tage fokussiert. Jede erkannte Änderung nennt nun ausdrücklich die betroffene Best-Match- oder Ensemble-Modellfamilie; auch die serverseitige Push-Prüfung verwendet dasselbe Drei-Tage-Fenster.
- Optionale geräteübergreifende Synchronisation in den Systemeinstellungen ergänzt. Favoriten, Darstellungsoptionen, Spezialprofile und Auswertungsverläufe werden vor dem Upload im Browser mit AES-GCM verschlüsselt und über einen persönlichen Synchronisationscode zwischen MID-Geräten abgeglichen.
- Routenwetter vorläufig aus Dashboard, Einstellungen und aktiver Laufzeit entfernt. Die Quellmodule bleiben ausschließlich als stillgelegte Basis für eine spätere Reaktivierung erhalten.
- Im erweiterten Modus das neue Modul „Prognosegüte und Rückblick“ ergänzt. MID archiviert Prognosestände für die nächsten drei Tage, vergleicht abgeschlossene Tage bevorzugt mit der nachträglichen ERA5-Land-Reanalyse und verwendet für noch nicht verfügbare Tage einen klar gekennzeichneten Best-Match-Rückblick als vorläufige Referenz. Daraus werden Temperaturfehler, Niederschlagsfehler, Brier-Score, lokale Modellrangfolge, tagesbezogene Sieger sowie vorläufige Lerngewichte berechnet.
- Gerätesynchronisation im Worker ergänzt und der bestehende KV-Speicher wiederverwendet; es sind keine neuen Bindings erforderlich, sofern MID_PUSH_SUBSCRIPTIONS bereits für Push eingerichtet ist.
- Neue Regression schützt Drei-Tage-Fenster, Modellangaben, verschlüsselte Gerätesynchronisation, Routenwetter-Stilllegung und Prognosegüte.

# MID v0.7.109.2

- Kompositbild: Für KONRAD3D-Zellen wird im K3D-/NowCastMIX-Layer nun zusätzlich ein Wahrscheinlichkeitskegel der Zugbahn gerendert. Der Kegel nutzt die verfügbare Prognoseposition und den Unsicherheitsradius und macht die erwartete Verlagerung wieder direkt auf der Karte sichtbar.
- Die Zellprognose selbst wird im Overlay wieder klar visualisiert: gestrichelte Prognoselinie, markierter Prognosepunkt sowie ein eigener Overlay-Pane sorgen dafür, dass die Darstellung auch über Radar- und Satellitenlayern sichtbar bleibt.
- Die Legende des Kompositbilds wurde passend ergänzt und erläutert nun sowohl die Zellprognose als auch den Wahrscheinlichkeitskegel.
- Neuer Regressionstest schützt Wahrscheinlichkeitskegel, Prognosepunkt, Overlay-Pane und Legendenhinweis.

# MID v0.7.109.1

- Tagesdetaildiagramm im Tablet-Hochformat verbessert: Alle stündlichen Wetterpiktogramme und Windrichtungspfeile bleiben sichtbar.
- Wetterpiktogramme und Richtungspfeile werden im Tablet-Hochformat abhängig vom verfügbaren Stundenabstand kompakter skaliert, damit sich die 24 Stunden nicht überdecken.
- Querformat- und Smartphone-Verhalten bleiben unverändert; ein neuer Regressionstest schützt den zusätzlichen Tablet-Hochformatmodus.

# MID v0.7.109.0

- Dezenter, einmaliger Hinweis zur Nutzung als Web-App ergänzt. Der Hinweis kann über das X dauerhaft geschlossen werden; die Auswahl wird lokal gespeichert und erscheint bei späteren Neustarts nicht erneut.
- PWA-Status aus dem Footer in die Kopfzeile verlagert: links neben Einstellungen steht nun ein kleines „App“-Feld; bei installierter MID-App wird es kompakt als installiert markiert. Die vollständigen Installationshinweise bleiben über dieses Feld erreichbar.
- 7-Tage-Trend als belastbarer Standard abgesichert: Ohne gespeicherte Präferenz ist er nach jedem Neustart aktiv; nur eine ausdrücklich gespeicherte Deaktivierung hält ihn ausgeschaltet.
- Neue Regressionstests schützen die persistente Hinweis-Ausblendung, den kompakten Kopfzeilenstatus und die Standardaktivierung des 7-Tage-Trends.

# MID v0.7.108.3

- Aktuelles Wetter mobil: Die kompakte Tmin-/Tmax-Pille besitzt nun eine feste geringe Höhe; Beschriftungen, Trennpunkt und Temperaturwerte sind vertikal sauber zentriert.
- Kompositbild: Isobaren und 500-hPa-Isohypsen werden unabhängig vom globalen Leaflet-Canvasmodus über einen eigenen SVG-Renderer im Modelllinien-Pane gezeichnet. Linienkontrast, Strichstärke und Halo wurden erhöht, damit vollständige Konturen über Radar- und Satellitenflächen sichtbar bleiben.
- Mobile Komposit-Overlays neu angeordnet: Das Feld „Scrollen“ steht links oberhalb des Kartenfußes und kollidiert nicht mehr mit dem rechts unten liegenden, verkleinerten „Jetzt“-Overlay.
- Neuer Regressionstest schützt mobile Tmin/Tmax-Zentrierung, explizite SVG-Modellkonturen und die kollisionsfreie Overlay-Anordnung.

# MID v0.7.108.2

- Ensemble-Temperaturdiagramm: Achsentitel analog zum Niederschlagsdiagramm aus der Recharts-SVG-Fläche herausgelöst. „Temperatur“/„°C“ und „Vorhersagetag“ besitzen nun reservierte Layoutbereiche und bleiben auf Desktop, Mobilgeräten sowie im PNG-Export lesbar.
- Temperatur-Exportgeometrie angepasst: Der feste 1096-px-Bereich enthält einen 1000-px-Diagrammkern mit getrennten Achsentitel- und Ausgleichsspalten; dadurch bleiben Plot und Achsenticks sauber ausgerichtet.
- Aktuelles Wetter mobil: Tmin/Tmax wird als kleine, dezente Pille am oberen Modulrand dargestellt und aus dem normalen Gridfluss genommen. Dadurch entsteht keine zusätzliche breite Hero-Zeile und kein unnötiger Höhenbedarf.
- Neue bzw. angepasste Regressionstests schützen die externen Temperatur-Achsentitel, die feste Exportgeometrie und die platzsparende mobile Tmin-/Tmax-Anzeige.

# MID v0.7.108.1

- Ensemble-Niederschlagsdiagramm: Achsentitel aus der Recharts-SVG-Fläche herausgelöst und als eigenständige, reservierte Layoutbereiche umgesetzt. Dadurch können „Niederschlag“, „Wahrscheinlichkeit“ und „Vorhersagetag“ weder von Achsenticks noch vom Teilen-/Infobereich überlagert oder abgeschnitten werden.
- Responsive Darstellung angepasst: Auf Desktop stehen die beiden y-Achsentitel in festen seitlichen Spalten; auf schmalen Mobilgeräten wechseln sie in eine kompakte horizontale Kopfzeile über dem Plot.
- Exportgeometrie erweitert: Der 1096-px-Exportbereich wird in feste Achsentitelspalten und einen 992-px-Diagrammkern aufgeteilt, sodass die Titel auch in mobil erzeugten PNGs korrekt positioniert bleiben.
- Neuer Regressionstest schützt Desktop-, Mobil- und Exportposition der Niederschlagsachsen; bestehender Test für die feste Ensemble-Exportgeometrie wurde auf den variablen Diagrammkern erweitert.

# MID v0.7.108.0

- Aktuelles Wetter: Tmin/Tmax aus der frei schwebenden Kicker-Zeile entfernt und als eigener, sauber begrenzter Grid-Bereich zwischen Wettertext und Analysekarte angeordnet. Die Darstellung folgt auf Desktop, Tablet und Mobil nun festen Modulgrenzen.
- Wind-/Böen-Kachel: Wert und Einheit werden als zusammenhängende, responsive Zeile dargestellt; ein unschöner Umbruch innerhalb der Böeneinheit wird verhindert.
- 7-Tage-Trend: Rechtschreibung der Hazard-Sätze korrigiert. Substantive wie „Sturmböen“ bleiben großgeschrieben; nur tatsächlich vorangestellte Adjektive werden im Satzkontext kleingeschrieben.
- Berg-/Wintersport: dezenter, direkt bedienbarer Saisonumschalter Auto/Sommer/Winter im Anzeigebereich ergänzt und dauerhaft im zugehörigen Favoritenprofil gespeichert.
- Wassersport: Gewässertyp und Aktivität als kompakte Direktoptionen in den Anzeigebereich aufgenommen; Änderungen werden ebenfalls dauerhaft im Favoritenprofil gespeichert.
- Neuer Regressionstest schützt Hero-Raster, Windumbruch, Trend-Rechtschreibung und die persistenten Direktoptionen beider Spezialmodule.

# MID v0.7.107.0

- Grundlegendes Performance-Audit ohne Funktionsabbau: Ensemble-Aufrufe nutzen nun einen 20-minütigen Frischcache, Open-Meteo-Modellabfragen werden regional priorisiert und doppelte globale ECMWF-Abfragen in Europa vermieden.
- Kompositdarstellung entlastet: Statt mehrerer gleichzeitig überblendeter Konturframes wird nur der zeitlich maßgebliche Frame gerendert; vorberechnete Konturgeometrien, wiederverwendete Datumsformatierer und verzögertes Speichern der Kartenoptionen reduzieren Rechen-, DOM- und Speicherlast.
- Isobaren und 500-hPa-Isohypsen wieder deutlich sichtbar: eigener Leaflet-Layer oberhalb der Wetterebenen, kontrastreiche Doppelkontur mit dunklem Halo, stärkere Hauptlinien und besser lesbare Beschriftungen sowie Druckzentren.
- Open-Meteo-Modellbestand aktualisiert: regionale ECMWF-IFS- und AIFS-Ensembles für Europa einschließlich offizieller Ensemble-Mittel integriert und gegenüber redundanten globalen Varianten bevorzugt.
- Abrufstrategie an die Open-Meteo-Aktualisierung angepasst: Konturdaten werden client- und worker-seitig 30 Minuten zwischengespeichert, im sichtbaren Modul stündlich geprüft und bei kurzzeitigen Abruffehlern nicht mehr sofort aus der Karte entfernt.
- Neuer Regressionstest schützt die Performanceoptimierungen, aktuellen Open-Meteo-Modellkennungen sowie die sichtbaren Isobaren/Isohypsen. Insgesamt 93 automatische MID-Regressionstests bestanden.

# MID v0.7.106.3

- Berg-/Wintersport-Favoriten robuster gespeichert: automatisch ermittelte Lift-/Stationsprofile werden synchron sowohl im Favoritenbestand als auch separat je Standort gesichert und unmittelbar in die persistente IndexedDB-/Cache-Sicherung übernommen.
- Automatische Lift-/Stationssuche erhält einen zweiten Abrufdurchlauf. Bei einem vorübergehenden Dienstfehler bleibt ein bereits erfolgreich ermitteltes automatisches Profil erhalten, statt durch abgeleitete Standardwerte überschrieben zu werden.
- Wind- und Schneedeckendaten in den Höhenkacheln räumlich getrennt und als eigenständige Informationsblöcke beschriftet.
- Desktopdarstellung von Tmin/Tmax im aktuellen Wetter zu einer größeren, klar gegliederten Tagesbereichskarte mit Temperaturverlauf aufgewertet; mobile Darstellung bleibt kompakt.
- Neuer Regressionstest schützt Bergprofil-Persistenz, Abruffallback, getrennte Wind-/Schneedaten und die überarbeitete Desktop-Tagesbereichsanzeige.

# MID v0.7.106.2

- Ensemble-PNG-Export grundlegend stabilisiert: Während des Exports werden Temperatur- und Niederschlagsdiagramm nicht mehr nachträglich über einen bereits gerenderten responsiven Recharts-Container verbreitert, sondern in einer festen, geräteunabhängigen Plot-Geometrie neu gerendert.
- Ursache der fehlerhaften Exporte beseitigt: Beim Wechsel von der Bildschirmbreite auf 1180 px konnten Achsen bereits die neue Breite verwenden, während Kurven, Flächen oder deren Clip-Pfad noch auf der alten Mobil- bzw. Desktopbreite beruhten. Das führte mobil zur Stauchung/Abschneidung und am Desktop zum Überlaufen rechts über den Achsenbereich.
- Exportmodus nutzt nun einen festen 1096-px-Plot, Desktop-Achsenabstände unabhängig vom Geräte-Viewport, einen expliziten Export-Renderzustand und wartet auf den tatsächlich neu aufgebauten Recharts-Wrapper.
- Recharts-Animationen für die statischen Ensemblekurven und -flächen deaktiviert, damit während der PNG-Aufnahme keine Zwischengeometrie oder unvollständiger Clip-Pfad erfasst wird.
- Exportbereich wird streng beschnitten; Metadaten bleiben wie gewünscht als Fußnote unter dem Diagramm. Neuer Regressionstest schützt die feste Desktop-/Mobil-Geometrie, animationsfreie Aufnahme und den vollständigen Plotbereich.

# MID v0.7.106.1

- Tagesdetaildiagramm: Ursache für Windwerte oberhalb der Böen eingegrenzt. MID verwendet Wind und Böen aus demselben Open-Meteo-Best-Match-Abruf, in identischer Einheit und am identischen Stundenindex; bekannte Modell-/Interpolationskonstellationen können dennoch `wind_gusts_10m < wind_speed_10m` liefern.
- Plausibilitätsbehandlung angepasst: Der Windwert bleibt unverändert. Eine fehlende oder kleinere Böe wird ausschließlich punktweise für denselben Zeitpunkt auf das Windniveau gesetzt – ohne zeitliche Glättung, Mittelwertbildung oder Veränderung benachbarter Stunden.
- Wind- und Böenlinie bleiben im Diagramm erhalten. Bei identischen Werten bleibt die grüne Windlinie durch die Lücken der gestrichelten Böenlinie sichtbar; der Stunden-Tooltip kennzeichnet eine vorgenommene Angleichung.
- Neue Regression schützt die punktweise Angleichung, die endlichen Diagrammwerte und die Sichtbarkeit beider Kurven.

# MID v0.7.106.0

- 7-Tage-Trend fachlich neu gewichtet: Die ersten Prognosetage erhalten deutlich mehr Einfluss als das Ende des Zeitraums; kurze spätere Ausreißer verdrängen damit nicht mehr den unmittelbar bevorstehenden Wettercharakter.
- Wetterverlauf differenzierter ausgewertet: heiter/sonnig, Sonne und Wolken, stark bzw. meist bewölkt, regnerisch, gewittrig und winterlich werden als eigene zeitliche Regime behandelt. Bewölkungstexte haben Vorrang vor einer isoliert hohen Sonnenscheindauer; die Sonnenscheindauer wird zusätzlich relativ zur astronomischen Tageslänge bewertet.
- Temperaturbeschreibung an DWD-Kenntage angelehnt: Sommertag ab 25 °C, heißer Tag ab 30 °C, sehr heiß ab 35 °C, extrem heiß ab 40 °C, Tropennacht ab 20 °C Mindesttemperatur sowie Eistag bei einem Tagesmaximum unter 0 °C. Verfügbare ERA5-Land-Klimamittel 1991–2020 fließen für markante Abweichungen vom örtlichen Klimamittel ein.
- Markante automatische DWD-nahe Warnsignale werden priorisiert in den Kurztrend aufgenommen; dafür bleibt bei einem Hazard stets Platz im maximal dreisätzigen Text.
- Klimamittel werden nun bereits für die aktivierte 7-Tage-Kurzinterpretation geladen und nicht erst nach dem Öffnen des Ensemble-Moduls.
- Quellengetreue Wind-/Böenbehandlung nachgezogen: keine Glättung und keine künstliche Anhebung der Böe mehr. Ist ein Böenwert kleiner als der zugehörige Wind, wird er als unplausibel behandelt und als nicht verfügbar dargestellt.
- Neue und angepasste Regressionstests schützen Frühgewichtung, DWD-Kenntage, Klimavergleich, Hazard-Priorität, Bewölkungsverlauf und die unverfälschte Wind-/Böenprüfung.

# MID v0.7.105.5

- Exportdarstellung der Ensemble-Diagramme stabilisiert: Temperatur- und Niederschlagsgrafiken erhalten ausgewogenere Außenabstände, damit Achsen und Kurven in Desktop- und Mobil-Exports nicht mehr nach rechts verrutschen.
- Export-Metadaten neu angeordnet: „Darstellung“, „Quellen“, „Modellstände“ und „MID“ stehen nun als Fußnote unter dem Diagramm statt oberhalb der Grafik.
- Neuer Regressionstest schützt die Fußnotenposition und die exportstabilen Diagrammmargen; der bestehende Interaktionstest akzeptiert die angepassten Außenmaße.

# MID v0.7.105.4

- Bergmodul sprachlich auf „Berg-/Wintersport“ umgestellt und die Kachelstruktur saisonal aufgewertet: UVI erscheint wieder als eigenständige Kachel; zusätzlich zeigt der Sommermodus das Gewitterpotenzial und der Wintermodus den prognostizierten Neuschnee +24 h.
- Bergindikatoren layoutseitig flexibilisiert, damit die zusätzlichen saisonalen Kacheln auf Desktop und Mobil sauber umbrechen.
- Wind- und Böenwerte appweit für Stunden- und Tagesmapping sowie in den aktuellen und bergbezogenen Anzeigen geglättet: Böen werden nun niemals kleiner als der zugehörige Wind dargestellt.
- Neuer Regressionstest schützt Berg-/Wintersport-Kacheln und die Wind/Böen-Normalisierung; bestehender Wind-Test wurde auf die normalisierte Darstellung erweitert.

# MID v0.7.105.3

- Kachel „Luftqualität“ gestalterisch an die übrigen Aktuell-Wetter-Kacheln angenähert: Die große Primärschrift ist kompakter, EU-AQI steht nun in der Überschrift und die doppelte Wiederholung der Einstufung entfällt.
- AQI-Kachel inhaltlich gestrafft: Primärwert zeigt nur noch die Stufe, die Detailzeile nennt kompakt den maßgeblichen Stoff mit Konzentration und Quelle.
- Neuer Regressionstest schützt die kompaktere AQI-Kachel mit EU-AQI in der Überschrift und ohne doppelte Statusanzeige.

# MID v0.7.105.2

- Desktop-Darstellung der 7-Tage-Vorhersage überarbeitet: Die Temperaturbalken erhalten auf Desktop etwas kompaktere Spalten, damit Niederschlags-, Sonnen- und Windtext nicht mehr von den Temperaturwerten überdeckt wird.
- Die Forecast-Zeile verteilt den verfügbaren Platz auf Desktop nun textfreundlicher; auf mittleren Desktopbreiten darf die Metazeile bei Bedarf umbrechen, auf großen Desktopbreiten bleibt sie weiterhin einzeilig.
- Neuer Regressionstest schützt das Desktop-Layout der 7-Tage-Vorhersage mit schmaleren Temperaturbalken und den angepassten Spaltenbreiten.

# MID v0.7.105.1

- Radar-Nowcast: Die Niederschlagssumme für die nächsten zwei Stunden wird nun konsistent aus allen künftig sichtbaren 5-Minuten-Segmenten der Diagrammleiste gebildet. Dadurch erscheinen heranziehende bzw. unsichere Treffer nicht mehr mit Balken, aber gleichzeitig mit 0,00 mm in der Summenzeile.
- 7-Tage-Kurzinterpretation sprachlich und meteorologisch verfeinert: Der Text wertet jetzt den tatsächlich dargestellten Tagescharakter gröber aus, vermeidet doppelte Formulierungen wie „wechselhaft, danach wechselhaft“ und beginnt am aktuellen ersten Tag natürlich mit „Heute“ statt „bis Montag“.
- Neue Regressionstests schützen die korrigierte Radar-Summenlogik sowie die verbesserte deutsche Satzbildung der 7-Tage-Kurzinterpretation.

# MID v0.7.105.0

- Neue, standardmäßig aktive 7-Tage-Kurzinterpretation vor dem ersten Prognosetag. Zusammenhängende Wetterphasen werden zu einem möglichst kurzen deutschen Satz verdichtet, etwa „Bis Dienstag wechselhaft, ab Mittwoch sonnig, trocken und heiß.“
- Eigener Schalter unter Einstellungen → Ansicht zum vollständigen Deaktivieren der Kurzinterpretation; Auswahl wird dauerhaft lokal gespeichert.
- Tagesdetaildiagramm erkennt zusätzlich sämtliche Querformat-Displays und zeigt dort sämtliche stündlichen Wetterpiktogramme sowie alle Windrichtungspfeile.
- Piktogramme und Richtungspfeile werden abhängig vom verfügbaren Punktabstand dynamisch verkleinert, statt Zeitpunkte auszudünnen.
- Neuer Regressionstest schützt Einstellungs-Persistenz, Position vor dem ersten Prognosetag, phasenbasierte Kurzinterpretation sowie vollständige Hoch- und Querformatmarker.

# MID v0.7.104.0

- Radar-Nowcast als durchgehend horizontal erkundbarer 5-Minuten-Scrubber umgesetzt: Fingerbewegung nach links/rechts aktualisiert den MID-typischen Portal-Tooltip am jeweils berührten Zeitschritt; Außenklick, erneutes Antippen und Escape schließen ihn.
- 5-Minuten-Mengen fachlich korrigiert: Standortwert und Umgebungsecho werden getrennt; ein stärkeres Echo im Suchumfeld ersetzt nicht mehr den tatsächlichen Standortwert. Unsichere Prognoseersatzwerte werden begrenzt und transparent gekennzeichnet.
- +2-h-Niederschlagssumme deutlich zurückgenommen und nur aus zukünftigen Standorttreffern gebildet; Umgebungsechos fließen nicht in die Standortsumme ein.
- Radar-Analyse auf einen progressiven Schnellpfad umgestellt: zuerst wenige WMS-Punktwerte ohne aufwendige Bewegungsfelder/KONRAD-Kontext, anschließend vollständige DWD-/OPERA-Analyse im Hintergrund. Letzte erfolgreiche Analyse wird ortsbezogen kurzzeitig zwischengespeichert.
- Hyperlokale Analyse progressiv beschleunigt: sofortige Kernnetzauswertung mit reduziertem Kandidatenbudget, danach vollständige Mehrnetz-/Restfeldanalyse im Hintergrund; letzte erfolgreiche Ortsanalyse wird kurzzeitig zwischengespeichert.
- Aktuelle Wetterdaten um RADOLAN-Rückschau ergänzt: letzte Stunde aus angeeichtem RW, bei noch nicht ausreichend aktuellem RW aus nicht angeeichten RY-5-Minuten-Produkten; letzte 24 Stunden aus dem aktuellen angeeichten SF-Produkt.
- Neue Worker-Endpunkte `radolan-history-meta` und `radolan-history-file` mit DWD-Produktprüfung, Caching und ortsbezogener Browserauswertung ergänzt.
- Neuer Regressionstest schützt Touch-Scrubbing, progressive Schnellpfade, Trennung von Standort-/Umgebungsecho und die RADOLAN-Rückschau.

# MID v0.7.103.4

- EEA-Messstationssuche auf die aktuellen offiziellen ArcGIS-Dienste `air.discomap.eea.europa.eu` und `eeha.discomap.eea.europa.eu` umgestellt.
- Der bisherige einzelne Legacy-Host, der HTTP 403 lieferte, ist nicht mehr alleinige Datenquelle.
- Worker probiert nun zwei EEA-Spiegelserver und zwei räumliche Abfragestrategien (Umkreissuche und Bounding-Envelope).
- Browserseitiger direkter EEA-Fallback ergänzt, falls der Cloudflare-Worker oder dessen Upstream vorübergehend nicht erreichbar ist.
- Letzte erfolgreich gefundene EEA-Messstation wird ortsbezogen bis zu 30 Tage als Rückfall gespeichert und im Tooltip transparent gekennzeichnet.
- Stationsklasse des aktuellen EEA-Layers wird als Messumfang statt irreführend als Verkehrs-/Umgebungsklasse erklärt.
- Technische Rohfehlermeldungen werden im AQI-Tooltip durch eine verständliche Statusmeldung ersetzt.
- Neuer Regressionstest für EEA-Hostwechsel, Spiegelserver, Geometrie-Fallback, Browser-Rückfall und Cache.

# MID v0.7.103.3

- GitHub-/TypeScript-Buildfehler `TS2540: Cannot assign to current because it is a read-only property` im Radar-Nowcast behoben.
- Der dynamische Popover-Anker der 5-Minuten-Balken verwendet nun ein ausdrücklich schreibbares `useRef<HTMLButtonElement | null>`.
- Das MID-typische Verhalten bleibt vollständig erhalten: Antippen eines Balkens öffnet dessen Tooltip; erneutes Antippen, Außenklick oder Escape schließen ihn.
- Neuer Regressionstest schützt die schreibbare Ref-Typisierung und die Zuordnung des aktiven Balkens als Popover-Anker.

# MID v0.7.103.2

- Radar-Nowcast deutlich verdichtet und auf durchgängige 5-Minuten-Balken umgestellt. Jeder Balken öffnet per Klick/Tippen einen MID-typischen Portal-Tooltip mit Zeitraum, Status, Intensität in mm/h und abgeleiteter 5-Minuten-Menge; Außenklick und Escape schließen den Tooltip.
- Erklärtexte und zusätzliche Ereigniskarten unter der Nowcast-Leiste entfernt; die numerische Intensitätsskala bleibt kompakt erhalten.
- Standortmarker im Kompositbild auf die halbe bisherige Größe reduziert, Blickrichtung und Sensorfunktion bleiben erhalten.
- Ensemble-Diagramme nach Einführung der Export-Wrapper wieder strikt an die verfügbare Viewportbreite gebunden. Der historische globale Mindestwert von 760 px wird innerhalb beider Diagramm-Wrapper aufgehoben.
- Achsen, Ränder, Legenden und Diagrammhöhen werden auf schmalen Displays kompakt angepasst, sodass Temperatur- und Niederschlagsdiagramm vollständig im Bildschirm bleiben.
- Neuer Regressionstest für 5-Minuten-Nowcast, Portal-Tooltip, Markergröße und mobile Ensemblebreite.

# MID v0.7.103.1

- Tagesdetail-Tooltip neu angeordnet: **Taupunkt / Feuchte** steht vor **Wind / Böen**; innerhalb des Feuchtefelds wird zuerst der Taupunkt und danach die relative Feuchte angezeigt.
- Aktuelle Windkachel an die Tagesdetaildarstellung angeglichen: Windrichtungspfeil, Windgeschwindigkeit und Böen stehen gemeinsam im Hauptwert; Richtung und Datenquelle folgen getrennt in der Detailzeile.
- Zentrale Sprühregen-/Schneegriesel-Plausibilisierung verschärft, ohne die Niederschlagsphase zu verändern. Neben Luftfeuchte und tiefer Bewölkung werden Taupunktspreizung, geschätzte beziehungsweise beobachtete Wolkenbasis, Niederschlagsrate und Schauersignal berücksichtigt.
- Sprühregen bei geschätzter/erfasster Wolkenbasis über 3000 ft GND wird innerhalb der flüssigen Phase zu Regen verallgemeinert; bei gleichzeitigem Schauersignal zu Regenschauern. Schneegriesel wird unter unplausiblen Bedingungen ausschließlich zu Schnee beziehungsweise Schneeschauern verallgemeinert.
- Taupunktinformationen werden nun in aktuellem Wetter, Tagesdetail, Meteogramm sowie Berg-/Wintersport an dieselbe zentrale Plausibilisierung übergeben.
- Push-Mitteilungen nennen statt des generischen Wortes „Favorit“ den gegebenenfalls manuell geänderten Ortsnamen; beim dynamischen Standort lautet der Bezug **„am Standort“**. Dies gilt für Titel und Texte von Niederschlags- und Gewittermeldungen.
- Neuer Regressionstest schützt Feldreihenfolge, Winddarstellung, appweite Taupunkt-/Wolkenbasisprüfung und ortsbezogene Push-Texte.

# MID v0.7.103.0

- Ensemble-Datenpfad grundlegend stabilisiert: statt bis zu 14 parallelen Mitgliedermodellfamilien werden höchstens acht priorisierte, räumlich passende Modelle mit maximal zwei gleichzeitigen Abrufen geladen.
- Neuer Cloudflare-Proxy für Open-Meteo-Ensemble- und Modellmetadaten ergänzt, um Browser-/CORS-/Rate-Limit-Ausfälle zu reduzieren und Modellstände zuverlässig bereitzustellen.
- Offizielle Ensemble-Mittel-/Spread-Reserve verwendet Temperatur- und Niederschlagsspreizung zur Rekonstruktion belastbarer Quantile, falls einzelne Mitgliedermodelle ausfallen.
- Letzter erfolgreicher Ensemble-Stand wird ortsbezogen 24 Stunden lokal vorgehalten, sodass Diagramme und Modelllauf-Radar bei vorübergehender API-Störung nicht vollständig verschwinden.
- KONRAD3D-Annäherungslogik korrigiert: Eine Zelle gilt nur als näherkommend, wenn das prognostizierte Zellzentrum tatsächlich näher liegt; eine größere Unsicherheitsellipse darf keine scheinbare Annäherung erzeugen.
- Radar-Nowcast auf 5- bis 15-minütige Einzelintervalle erweitert. Die Balkenhöhe nutzt eine dynamische mm/h-y-Achse; zusammenhängende Zeiträume zeigen maximale Intensität und grob abgeleitete Niederschlagsmenge.
- Neuer Regressionstest schützt Ensemble-Recovery, Worker-Proxy, Modellmetadaten, Zellzentrum-Plausibilisierung sowie Nowcast-y-Achse und Intervallmengen.

# MID v0.7.102.1

- Ensemble-Ladezustand repariert: Ein geöffnetes 14-Tage-Ensemble bleibt während des Wetterladens und bei Ortswechseln aktiv und startet für den neuen Ort zuverlässig einen neuen Ensemble- und Klimadatenabruf.
- Der gespeicherte Offen-Zustand des Ensemble-Moduls initialisiert die Datenanforderung bereits beim App-Start.
- Die PNG-Exportbibliothek wird erst beim tatsächlichen Antippen von „Teilen“ dynamisch geladen. Ein Fehler des optionalen Exportpfads kann Diagramme, Modellstände und Modelllauf-Änderungsradar dadurch nicht mehr gemeinsam ausblenden.
- Modellstände und Modelllauf-Änderungsradar bleiben auch im vorläufigen Ensemble-/Ladezustand sichtbar.
- Neuer Regressionstest schützt die Ensemble-Sichtbarkeit, den Ladepfad und die Entkopplung der Teilen-Funktion.

# MID v0.7.102.0

- Standortmarker im Kompositbild durch ein richtungsabhängiges Symbol mit blauem Positionsring und Pfeil in Blickrichtung ersetzt.
- Gerätekompass nutzt auf iPhone/iPad `webkitCompassHeading` und fordert die notwendige Bewegungssensor-Berechtigung erst nach einem bewussten Antippen des Markers an. Auf anderen Geräten wird ein absoluter Device-Orientation-Wert verwendet; die Anzeige wird geglättet.
- Fehlende oder verweigerte Kompassfreigabe wird transparent im Standort-Popup erklärt, ohne die Karten- oder Positionsfunktion einzuschränken.
- Beide Ensemble-Diagramme erhalten einen eigenen Teilen-Button: Temperaturtrend und Niederschlagsdiagramm können als PNG über das native Teilen-Menü ausgegeben werden.
- Der Export übernimmt exakt die aktuell ausgewählte Diagrammdarstellung, einschließlich ENS-Mittel, Klimamittel, P25–P75 und Niederschlagswahrscheinlichkeit.
- Exportbilder enthalten MID-Name und Version, Standort, aktive Modellfamilien, Initialisierungs-/Verfügbarkeitszeiten, Darstellungsoptionen und Quellenhinweis.
- Fallback für Browser ohne Datei-Teilen: Das PNG wird lokal heruntergeladen.
- Neuer Regressionstest schützt Standort-Blickrichtung, iOS-Berechtigung, beide Teilen-Buttons und den vollständigen Quellenblock.

# MID v0.7.101.1

- Widersprüchliche Gewitter-Pushmeldung korrigiert: Der sichtbare Abstand stammt nun ausschließlich aus der tatsächlichen aktuellen Zellposition und nicht mehr aus dem durch Prognoseunsicherheit reduzierten Relevanzabstand.
- Aktuelle Nähe und künftige Annäherung werden getrennt behandelt. Befindet sich eine Zelle bereits höchstens 20 km entfernt, wird keine zusätzliche spätere Annäherungszeit mehr angezeigt.
- Bei weniger als 1 km Abstand lautet der Hinweis „unmittelbar am Favoriten“ statt „0 km entfernt“.
- Bei einer noch entfernten Zelle nennt die Pushmeldung aktuelle Entfernung, Annäherungszeit und prognostizierten Rohabstand getrennt.
- Dieselbe Grenzlogik wurde in der sichtbaren Gewitterkarte und in der KONRAD3D-Kurzbeschreibung vereinheitlicht.
- Neuer funktionaler Regressionstest bildet den problematischen Fall „aktueller Abstand 42 km, effektiver Prognoseabstand 0 km, Annäherung in 30 min“ sowie unmittelbare und nahe Zelllagen ab.

# MID v0.7.101.0

- Luftqualitätskachel auf die offiziellen sechs Stufen des European Air Quality Index der EEA umgestellt. PM2,5, PM10, NO₂, O₃ und SO₂ werden anhand ihrer aktuellen Konzentration klassifiziert; die schlechteste Einzelstufe bestimmt die Gesamtstufe.
- Offizielle EEA-Farbpalette übernommen: Gut, Mittelmäßig, Mittel, Schlecht, Sehr schlecht und Äußerst schlecht.
- Erweiterter AQI-Tooltip zeigt sämtliche Einzelkonzentrationen, deren jeweilige EU-AQI-Stufe und die nächstgelegene EEA-Messstation mit Name, Entfernung, Klasse und EoI-Kennung.
- Neuer Worker-Endpunkt für die nächstgelegene EEA-Luftgütemessstation; die zusätzliche Abfrage läuft nur im erweiterten Modus.
- KONRAD3D-Abfrage auf primären und offiziellen DWD-Spiegelserver erweitert und als eigener fünfminütiger Liveabruf aus dem initialen Wetter-Ladebündel entkoppelt.
- NowCastMIX prüft sowohl Accumulated Flash Geometry als auch Accumulated Flash Area über primären und redundanten DWD-WFS-Dienst. Eine erfolgreiche Nullmenge wird nun als „Dienst erreichbar, keine Objekte“ statt als Fehler behandelt.
- Kompositbild zeigt für K3D und NowCastMIX eindeutig Datenstand, erreichbaren Leerdatensatz oder Dienstfehler.
- App-weite Performanceprüfung: doppelte Stunden-/Tageskartierung in der aktuellen Wetterkachel entfernt, Detaildiagramm-Uhr nur bei sichtbarem geöffnetem Tageschart aktiv und sämtliche Komposit-Pollings/Animationen außerhalb des Sichtbereichs pausiert.
- Neuer Regressionstest schützt EU-AQI, EEA-Station, Offscreen-Pause und K3D-/NowCastMIX-Fallbacks.

# MID v0.7.100.5

- Großes textliches Zugrichtungs-Overlay im Kompositbild entfernt. Richtung und Geschwindigkeit bleiben im kompakten Layerbutton, im Infofenster und im Standort-Popup verfügbar.
- Niederschlags-Zugpfeile als hoch liegende weiße Div-Marker neu umgesetzt. Dadurch bleiben sie unabhängig vom Canvasrenderer und von Radar-/Satellitenrastern sichtbar.
- KONRAD3D-Zellen als deutliche farbige Marker mit K3D-Stufe und verfügbaren Hagel-, Starkregen-, Blitz- und Böensymbolen neu gerendert.
- NowCastMIX-Blitzobjekte als violette Blitzmarker in einer eigenen, gut sichtbaren Markerebene dargestellt.
- Layerbuttons oberhalb der Karte deutlich verdichtet. Kurze Bezeichnungen wie „Radar · 1 km“, „K3D / MIX“ und „Zugpfeile“ zeigen darunter den aktuellen Datenstand beziehungsweise Objektzahlen.
- Scrollen auf Touchgeräten verbessert: Die Karte startet mobil im Scrollmodus und fängt Ein-Finger-Seitenscrollen nicht mehr ab. Über „Karte aktiv“ lässt sich Verschieben/Zoomen jederzeit wieder einschalten.
- Blitz- und NowCastMIX-Vektoren werden räumlich ausgedünnt und auf ein gerätegerechtes Renderingbudget begrenzt. Die Daten bleiben abrufbar; nur überlagerte Marker werden zusammengefasst.
- Laufende Kompositanimation stoppt beim Seitenscrollen, um Layer-Neuaufbau während der Scrollbewegung zu vermeiden.
- Neuer Regressionstest für kompaktes Layerband, sichtbare Zugpfeile/Nowcast-Symbole und touchfreundliches Karten-Scrolling.

# MID v0.7.100.4

- GitHub-Produktionsbuild repariert: `ChevronDown` wird für die einklappbare Komposit-Legende wieder vollständig aus `lucide-react` importiert. Dadurch ist der TypeScript-Fehler `TS2304: Cannot find name ChevronDown` beseitigt.
- Die Gewitterinformation verwendet nun exakt dieselbe sichtbare Ortsbezeichnung wie der Seitenkopf. Ein manuell vergebener Favoritenname beziehungsweise Alias (z. B. „Rheidt“) ersetzt damit auch in Kurztext und KONRAD3D-Tooltip die automatisch rückwärtsgeocodierte Bezeichnung (z. B. „Mondorf“).
- Änderungen des Favoritennamens lösen unmittelbar eine Neuberechnung der memoisierten Gewittertexte aus. Koordinaten, Entfernungsberechnung und KONRAD3D-Abfrage bleiben unverändert auf dem tatsächlichen Standort.
- Zwei Regressionen schützen die Favoriten-Ortsbezeichnung und den zuvor fehlenden Icon-Import.

# MID v0.7.100.3

- Laufende Ortszeit aus dem großen App-Renderpfad isoliert, sodass nicht mehr alle 30 Sekunden das vollständige Dashboard neu aufgebaut wird.
- Dashboard-, Karten- und Vektorbereiche memoisiert sowie Radar-/Starkregen-Abrufe bei Fokuswechsel entdoppelt.
- Leaflet-Canvas und reduzierte Touch-Effekte verbessern die Responsivität ohne Funktionsabbau.

# MID v0.7.100.2

- Die Kompositbild-Legende startet nun standardmäßig in einer sehr kompakten Ansicht mit Zeitangabe und aktiver Radarquelle. Per Klick oder Tippen lässt sie sich aufklappen und wieder minimieren.
- Die aufgeklappte Legende enthält weiterhin aktive Layer, Niederschlagsfarbskala, Blitzalter sowie KONRAD3D-/NowCastMIX-Erklärung, wurde aber in Abständen und Bedienfläche möglichst kompakt gehalten.
- Die zentrale Plausibilitätsprüfung für Sprühregen und Schneegriesel wurde fachlich eingegrenzt: Sie verallgemeinert nur die seltene Unterart, verändert aber niemals die vom WMO-Code vorgegebene flüssige, gefrierende, gemischte oder feste Niederschlagsphase.
- Unplausibler Sprühregen wird zu Regen, unplausibler gefrierender Sprühregen zu gefrierendem Regen und unplausibler Schneegriesel zu Schnee beziehungsweise Schneeschauern. Schnee- und Schneeschauercodes bleiben unabhängig von bodennaher Temperatur oder parallelen Regenfeldern fest.
- Neuer Regressionstest schützt einklappbare Legende und phasenerhaltende Niederschlagslogik.

# MID v0.7.100.1

- TypeScript-Buildfehler `TS18047: loc is possibly null` in der Gewitterinformation behoben. Der Ortsname wird nun nullsicher aus `loc?.name` abgeleitet und fällt während der initialen Standortauflösung auf „Standort“ zurück.
- Die Ortsbezeichnung wurde in die Abhängigkeiten der memoisierten Gewitterauswertung aufgenommen, damit ein später aufgelöster oder gewechselter Ort zuverlässig neu bewertet wird.
- Neuer Regressionstest verhindert direkte Zugriffe auf `loc.name` innerhalb der Gewitterauswertung und schützt damit exakt den in GitHub Actions aufgetretenen Fehler.

# MID v0.7.100.0

- Die Gewitterinformation trennt jetzt die **aktuelle Entfernung** einer KONRAD3D-Zelle sauber von der prognostizierten größten Annäherung. Zuvor konnte der um die Unsicherheitsellipse verminderte Prognoseabstand wie eine aktuelle Entfernung wirken.
- Jede KONRAD3D-Zelle erhält einen vom ausgewählten MID-Ort aus berechneten Richtungswinkel. Die Kurzkarte nennt aktuelle Distanz, relative Himmelsrichtung, erwartete Annäherungszeit und den unverfälschten Prognoseabstand.
- Neuer schließbarer Info-Tooltip in der Gewitterkarte mit Zellkennung, aktuellen und prognostizierten Koordinaten, Zellstufe/Trend, Zugrichtung und -geschwindigkeit, Blitzrate, Hagel-/Starkregen-/Böensignalen, Unsicherheitsradius, Datenalter und Zahl erkannter Zellen.
- Die KONRAD3D-Karten-Popups wurden um dieselben verfügbaren Zellinformationen erweitert.
- Das Kompositbild besitzt eine eigene Legende für KONRAD3D-Stufen, Zellprognosebahnen und NowCastMIX-Blitzgeometrien.
- Das Verlagerungsoverlay ist nun als eigener, dauerhaft gespeicherter Schalter verfügbar. Er blendet Niederschlagspfeile, Zughinweis und Standort-Zuglabel gemeinsam ein oder aus, ohne Radar oder Nowcast-Objekte abzuschalten.
- Neuer Regressionstest schützt Ortsbezug, Distanztrennung, Unsicherheitsangabe, Objektlegende und Verlagerungsschalter.

# MID v0.7.99.2

- Im Untermenü **Benachrichtigungen** eine dauerhaft gespeicherte Auswahl für den Mindestabstand zwischen Push-Mitteilungen ergänzt. Verfügbar sind 15, 30, 60, 120 und 180 Minuten; Standard ist 30 Minuten.
- Das Intervall gilt geräteweit für Niederschlagsbeginn, Gewitterannäherung und materielle Modelllaufänderungen. Der Cloudflare-Cron darf weiterhin alle fünf Minuten prüfen, der Worker sendet innerhalb des gewählten Zeitraums jedoch höchstens eine Mitteilung an dieses Gerät.
- Der Mindestabstand wird zusammen mit dem Push-Abonnement im privaten Cloudflare-KV-Eintrag gespeichert und bei jeder Einstellungsänderung automatisch synchronisiert.
- Während der Sperrzeit erkannte Ereignisse werden nicht als bereits gemeldet verbucht. Sie bleiben ausstehend und werden nach Ablauf des Intervalls erneut geprüft, sofern das Signal noch relevant ist.
- Bestehende Abonnements ohne gespeicherten Wert verwenden im Worker vorsichtshalber 60 Minuten, bis die aktualisierte App das gewählte Intervall synchronisiert.
- Neue funktionale Regression prüft UI-Auswahl, lokale Persistenz, Client-Übertragung sowie die serverseitige Zeitprüfung.

# MID v0.7.99.1

- Automatische Berg-/Wintersport-Profilermittlung von der Auswahl eines einzelnen Liftpaares auf das zusammenhängende Wander-/Skigebiet umgestellt. MID wählt nun die niedrigste plausible Talstation, eine explizite beziehungsweise vernetzte Mittelstation und die höchste verbundene Bergstation. Der Referenzfall Sölden schützt Giggijoch-Talniveau, Gaislachkogl-Mittelstation und 3.340-m-Bergniveau.
- Höhenhülle für hochalpine, aber noch lokal verbundene Bergstationen erweitert; ortsfremde Gruppen bleiben über Nähe, Geländeanker, Clusterverbindung und maximale Gebietsspanne ausgeschlossen.
- Modelllauf-Änderungsradar speichert die einzelnen eingebundenen Modellstände im Snapshot. Bei identischen Sammelzeiten zeigt es nun das tatsächlich geänderte Modell sowie dessen alten und neuen Initialisierungs- beziehungsweise Verfügbarkeitsstand.
- Push-Deep-Links repariert: fehlende Koordinatenparameter werden nicht mehr durch `Number(null)` als 0°/0° interpretiert. Koordinaten, Ortsname und Land werden zusätzlich im Notification-Payload gespeichert und beim Öffnen durch beide Service Worker erneut in die Ziel-URL geschrieben.
- Dynamischer Standort und nahezu deckungsgleicher statischer Favorit können gleichzeitig aktiv sein. Die Zuordnung berücksichtigt horizontale Entfernung und, sofern vorhanden, die Höhendifferenz.
- Neue funktionale Regression prüft Skigebiets-Extremhöhen, Modelllaufidentifikation, Push-Koordinaten und Favoriten-Gleichsetzung.

# MID v0.7.98.1

- GitHub-Produktionsbuild repariert: Die optionale Radar-Nowcast-Leiste greift während des initialen Wetterladens nicht mehr direkt auf einen möglicherweise noch nicht verfügbaren Wetterdatensatz zu.
- Der Zeitzonenwert wird nullsicher an die Nowcast-Leiste übergeben; bis zum Eintreffen der Wetterdaten verwendet die Darstellung den vorhandenen lokalen Fallback.
- Neue Regression schützt den exakten TS18047-Fall (`w` möglicherweise `null`) und verhindert eine erneute nicht-nullgesicherte Übergabe in der Ortskopfzeile.

# MID v0.7.98.0

- Kompositbild um ein flächiges Niederschlags-Bewegungsfeld erweitert. Richtungspfeile werden nicht mehr nur am ausgewählten Ort, sondern an aus dem aktuellen Radarbild ermittelten Niederschlagsankern dargestellt.
- DWD-RV erzeugt dafür ein zusätzliches großräumiges Bewegungsfeld aus dem neuesten Radarstand; RainViewer- und OPERA-Raster liefern ebenfalls räumliche Niederschlagsanker als Fallback.
- OPERA-CIRRUS vergleicht aufeinanderfolgende Rasterstände jetzt auch flächig, um Zugrichtung und Geschwindigkeit außerhalb der DWD-Abdeckung abzuleiten.
- Pfeildesign an die gewünschte Radaroptik angepasst: helle, kontrastgerahmte Bewegungsvektoren direkt auf den Niederschlagsfeldern.
- Zugrichtung und Zuggeschwindigkeit am ausgewählten Ort werden zusätzlich als permanentes Standortlabel und als frei platzierte Statuskarte angezeigt. Die Anzeige liegt unterhalb der Karten-Schaltflächen und wird nicht mehr von Zoom-, Kartenbasis- oder Standortsteuerung verdeckt.
- Radar-Nowcast-Zeitreihe um standortbezogene Beobachtungs- und Vorhersageframes ergänzt.
- Neue, in den Einstellungen aktivierbare „Radar-Nowcast-Leiste“ in der Kachel „Aktuelle Niederschlagswahrscheinlichkeit“. Sie erscheint nur bei erkanntem oder heranziehendem Radarecho und zeigt eine Zeitachse von −1 bis +2 Stunden mit Jetzt-Markierung und Intensitätssegmenten.
- Einstellung wird versionsunabhängig unter `mid:radarDisplaySettings` gespeichert.
- Neue Regression schützt flächige Echoanker, Standortkennzeichnung, Nowcast-Datenreihe, Einstellungspersistenz und responsive Zeitachse.

# MID v0.7.97.1

- Automatische Bergprofil-Ermittlung gegen ortsfremde Liftkombinationen gehärtet. Der bisherige 25-km-Suchraum und die unbeschränkte Kombination beliebiger Tal- und Bergpunkte konnten extreme, nicht zusammengehörige Profile erzeugen.
- Suchradius auf 18 km begrenzt und Kandidaten zusätzlich an die Geländehöhe des gewählten Ortes gekoppelt. Bei normalen Bergorten darf das automatische Talniveau höchstens 500 m unter beziehungsweise 450 m über der Ortshöhe liegen; der Gipfelpunkt muss oberhalb liegen und bleibt ebenfalls höhenbegrenzt.
- Liftstationen werden nur noch innerhalb räumlich zusammenhängender Liftgruppen kombiniert. Endpunkte derselben Liftanlage werden bevorzugt; Einzelkandidaten aus verschiedenen Skigebieten dürfen nicht mehr allein wegen großer Höhendifferenz gekoppelt werden.
- Stationsknoten werden nahe gelegenen Liftenden zugeordnet, damit Tal-/Bergrollen und Anlagenzusammenhang belastbarer erkannt werden. Eine Mittelstation wird nur noch bei expliziter Mittelrollen-Kennzeichnung oder tatsächlichem Bezug zur gewählten Liftanlage übernommen.
- Zusätzliche Maximalgrenzen für Höhendifferenz, horizontale Spannweite und Entfernung zum Favoriten verhindern Profile wie 490 m Talhöhe bei einem Ort auf rund 1.958 m.
- Bereits gespeicherte automatische Altprofile werden beim Versionswechsel geprüft. Unplausible Höhen oder Koordinaten werden auf sichere lokale Ausgangswerte zurückgesetzt; manuell bearbeitete Profile bleiben unangetastet.
- Neue Regression bildet den gemeldeten Obergurgl-/Hochgurgl-Fall nach und schützt Suchradius, lokale Höhenhülle, Liftcluster und Altprofilmigration.

# MID v0.7.97.0

- Berg-/Wintersportmodus vollständig geprüft und auf Schema 2 gehärtet: Saisonprofile Automatisch/Sommer/Winter, Lift-/Stations- und Geländehöhenprofil, optionale Mittelstation, editierbare Stationsdaten und höhenbezogene Einzelkoordinaten bleiben erhalten.
- Winterdaten je Höhenstufe erweitert: Schneedecke wird getrennt als GeoSphere-Messwert und Open-Meteo-Modellwert dargestellt; Neuschnee der vergangenen 24 Stunden sowie Prognosen für +24 und +48 Stunden bleiben separat sichtbar.
- GeoSphere-Schneemessungen für Österreich über den MID-Worker ergänzt. Messwerte werden nur bei höchstens 25 km Entfernung, höchstens 350 m Höhendifferenz, maximal drei Stunden Alter und plausibler Schneehöhe übernommen.
- Sommerliche Bergparameter wie UV-Index, Sicht, Wind/Böen und Gewitterpotenzial sowie die automatische Migration älterer Favoritenprofile auf das neue Bergschema abgesichert.
- Cloudflare Web Analytics wieder funktionsfähig verdrahtet: Bei vorhandener GitHub-Buildvariable erzeugt MID den offiziellen Beacon im Produktionsbuild selbst und zeigt den Lade-/Blockierstatus im Systembereich an.
- Untermenü „Benachrichtigungen“ optisch an die übrigen Einstellungen angeglichen: gruppierte Auswahlkarten, aktive Zustände und einheitliche Abstände/Radien.
- Push-Mitteilungen enthalten nun einen Zielort-Deep-Link. Beim Antippen öffnet beziehungsweise navigiert die installierte App direkt zum betroffenen Favoriten; Koordinaten dienen als sicherer Rückfall.
- Normales Öffnen der App lädt wieder den zuletzt geöffneten Ort. Automatische Standortverfolgung aktualisiert nur die Benachrichtigungsposition und überschreibt den sichtbaren Ort nicht mehr.
- Kompositbild um aus Radarbildfolgen abgeleitete Zugrichtung ergänzt. Mehrere Richtungspfeile werden direkt auf dem Radarbild angezeigt; Richtung, Geschwindigkeit und Sicherheitsstufe stehen zusätzlich in der Quelleninformation.
- Modelllauf-Änderungsradar auf ein versionsunabhängiges Sammelarchiv umgestellt. Je Ort bleiben mehrere Stände in localStorage sowie der bestehenden IndexedDB-/Cache-Sicherung erhalten und werden aus älteren Einzelständen migriert.
- Neue Gesamtsuite schützt Berg-/Wintersport, GeoSphere-Schnee, Analytics, Benachrichtigungsdesign und Deep-Links, letzten Ort, Radar-Zugrichtung sowie das versionsfeste Modellarchiv.

# MID v0.7.95.30

- Niederschlags-Plausibilisierung appweit vereinheitlicht: aktuelles Wetter, 7-Tage-Vorhersage, stündliche Detailansicht, Ensemble, Meteogramm und Berg-/Wintersportmodul verwenden nun dieselbe zentrale Ableitung für Wettertext, Piktogramm und Niederschlagsart.
- Regen/Sprühregen-Prüfung vollständig wiederhergestellt: Sprühregen-Codes werden nur noch bei plausibler feuchter tiefer Stratuslage und schwacher nicht-konvektiver Rate übernommen; andernfalls erfolgt eine konsistente Umstufung zu Regen, Schauer oder trockener Bewölkung.
- Plausibilitätsprüfung auf Schnee und Schneegriesel erweitert. Bodentemperatur, explizite Schneemenge, Feuchte, tiefe Bewölkung, Niederschlagsrate und konvektiver Anteil verhindern warme oder dynamisch unplausible Schneesymbole; valide nasse Schneefälle mit explizitem Schneefeld bleiben erhalten.
- Auch trockene Fehlcodes werden korrigiert: Ein unplausibler Niederschlagscode ohne messbaren Niederschlag fällt auf einen zur Bewölkung passenden trockenen WMO-Code zurück.
- Meteogramm-Abfrage um Gesamt- und tiefe Bewölkung ergänzt, damit die zentrale Plausibilitätsprüfung dort dieselben Eingangsdaten wie die übrige App verwendet.
- Tagesbezogene DWD-Hazard-Auswertung korrigiert: Warnungen werden nur aus Startstunden des angezeigten Tages gebildet, erhalten aber bis zu 72 Stunden Vorlaufdaten für Schwellen und nächtliche Abkühlung. Dadurch entspricht der Temperaturwert im Wärme-Warnbutton wieder der maximalen gefühlten Temperatur des Tages.
- Neue appweite Regression schützt Niederschlagskonsistenz und den Tageshöchstwert der gefühlten Temperatur; synthetischer Testfall 34 °C am Vormittag und 36 °C am Nachmittag erwartet korrekt 36 °C im Warnhinweis.

# MID v0.7.95.29

- Einstellungsdialog wieder vollständig an das geschützte Design von MID v0.7.95.26 angeglichen: zweispaltiger Desktopdialog, mobile Bereichsnavigation, Auswahlkarten, Einheitenauswahl und eingebettete Detailbereiche.
- Design der erweiterten Funktionen auf die v0.7.95.26-Kartenstruktur zurückgestellt; das Modelllauf-Änderungsradar besitzt wieder die ursprünglichen Gruppen-, Auswahl- und Konfigurationselemente.
- Sämtliche Ensemble-Hilfe- und Modellstände-Popover wieder nach v0.7.95.26 umgesetzt: Body-Portale, Außenklick/-tippen, Escape, erneutes Antippen sowie responsive Positionierung.
- Prognosekonsistenzpunkte verwenden wieder den geschützten v0.7.95.26-Tooltip mit Hover auf Mausgeräten, Ein-Tap-Bedienung und sicherem Außenklick-Schließen.
- Temperaturtrend-Tooltip wieder als sehr kompakte Tmin/Tmax-Matrix von v0.7.95.26 hergestellt, einschließlich P25–P75, P10–P90, ENS-Mittel, Klima, Sonne, Modellzahl und Hazards.
- Veraltete Regressionserwartungen an die wiederhergestellte v0.7.95.26-Darstellung angepasst und neuer verbindlicher Referenztest für Einstellungen und Ensemble-Tooltips ergänzt.

# MID v0.7.95.28

- GitHub-TypeScript-Buildfehler der Luftdrucktendenz behoben: `Hour.pressure` ist wieder typisiert, `pressure_msl` wird stündlich geladen und in `mapHours()` übernommen.
- Eigener Regressionstest schützt API-Feld, Typdefinition, Mapping und dreistündige Drucktendenz gemeinsam.
- Verbindliche maschinenlesbare Quellbasis `MID_BASELINE.json` ergänzt; sie verankert den vollständigen Referenzstand v0.7.95.26 am Commit `213ab6a52a48dcd073066e95551b5d7f057570be`.
- Release-Workflow aktualisiert nach erfolgreichem Build und Pages-Deployment automatisch den Zweig `mid-stable`; manuelle Deployments verwenden ausschließlich diesen letzten erfolgreich veröffentlichten Stand.
- Neuer Quellbasis-Test verhindert fehlende Referenzverträge, unsynchronisierte Releaseversionen und einen Rückfall auf unbestätigte App-Basen.

# MID v0.7.95.27

- Vollständige Funktionskontinuität auf Basis des Referenzstands v0.7.95.26 wiederhergestellt; der fehlerhafte Funktionsabbau der nachfolgenden Paketbasis wurde nicht übernommen.
- Info-Schaltflächen und Modellstände in Best-Match- und Ensemble-Bereichen als robuste Body-Portale abgesichert; Außenklick/-tippen, Escape, erneutes Antippen, Scrollen und Größenänderungen funktionieren zuverlässig.
- Tooltips der farbigen Prognosekonsistenzpunkte schließen bei Klick oder Tippen außerhalb; Interaktionen auf Punkt und Tooltip selbst bleiben erhalten.
- Luftdrucktendenz, Sonne/Mond, Modelllauf-Änderungsradar, Benachrichtigungen, erweitertes Bergprofil, Web-Analytics-Diagnose und die zugehörige Worker-/Service-Worker-Unterstützung wieder vollständig verdrahtet.
- Automatischer v0.7.95.26-Funktionsvertrag und Popover-Regression ergänzt; alle vorhandenen MID-Regressionstests werden weiterhin automatisch erkannt.

# MID v0.7.90.4

- Luftqualitätskarte um einen kompakten Info-Button zur Zusammensetzung des europäischen AQI ergänzt.
- Der Gesamt-AQI wird als höchster Teilindex aus PM2,5, PM10, NO₂, O₃ und SO₂ erläutert; die unterschiedlichen Bezugszeiträume von Feinstaub und Gasen werden genannt.
- Eigenständiger sechsstufiger AQI-Indikator mit Rautenmarkierung, Kategorienbezeichnung und farbiger Segmentleiste ergänzt. Er unterscheidet sich bewusst vom runden grünen Stationsabgleich-Punkt der hyperlokalen Analyse.
- Die fünf europäischen AQI-Teilindizes sowie SO₂ werden zusätzlich von Open-Meteo geladen; der aktuell maßgebliche Schadstoff wird in der Kartenzeile genannt.
- Neuer Regressionstest für AQI-Datenfelder, Erklärung und Indikatordesign.
- README, Changelog, Service-Worker-Cache und Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.90.3

- Layout der Metadaten in der 7-Tage-Vorhersage korrigiert.
- Niederschlagsmenge und -wahrscheinlichkeit, Sonnenscheindauer sowie Windsymbol, exakter 360°-Pfeil, Windgeschwindigkeit und Böen stehen wieder gemeinsam in einer Zeile.
- Auf schmalen Displays nutzt die Metazeile die Breite bis zum rechten Kartenrand und eine responsive Schriftgröße, statt die Windangabe in eine zweite Zeile zu zwingen.
- Hazard-Hinweise bleiben separat in der zweiten Kartenzeile.
- Regressionstest für das einzeilige Windlayout aktualisiert.
- README, Changelog, Service-Worker-Cache und Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.90.2

- Ursache unpassender Wetterpiktogramme im stündlichen Detaildiagramm behoben.
- Open-Meteo liefert `weather_code` als Momentaufnahme, Niederschlagsmengen dagegen als Summe des vorangegangenen Stundenintervalls. Deshalb konnte ein trockener Momentcode über einem vorhandenen Niederschlagsbalken erscheinen.
- Aus Mengenfeldern abgeleitete Niederschlagsarten erhalten jetzt immer einen passenden repräsentativen WMO-Anzeigecode für Regen, Schauer, Schnee, Schneeregen, gefrierenden Niederschlag oder Gewitter.
- Bei responsiv ausgedünnten Wetterpiktogrammen repräsentiert jedes Symbol nun sein umliegendes Zeitfenster. Ein kurzes Niederschlagsereignis zwischen zwei bisherigen Abtaststunden wird dadurch nicht mehr übersprungen.
- Die Piktogrammpositionen bleiben konfliktfrei gleichmäßig verteilt; jedes Symbol repräsentiert das zugehörige Zeitfenster und übernimmt darin ein vorhandenes Niederschlagsereignis.
- Neuer ausführbarer Regressionstest für Intervallbezug, Fallback-Anzeigecodes und kurze Niederschlagsereignisse.
- README, Changelog, Service-Worker-Cache und Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.90.1

- Verrutschte Windangabe in den mobilen Karten der 7-Tage-Vorhersage korrigiert.
- Wind-Symbol, 360-Grad-Richtungspfeil, Geschwindigkeit und Böen werden als untrennbare, eigene zweite Metazeile dargestellt.
- Niederschlagsmenge und Sonnenscheindauer bleiben in der ersten Metazeile und können sich bei sehr schmalen Displays weiterhin responsiv anordnen.
- Neuer Regressionstest verhindert das erneute Aufteilen der Windangabe.
- README, Changelog, Service-Worker-Cache und Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.90

- Sichtbaren Info-/Installationsbutton „MID als App nutzen“ im App-Footer ergänzt.
- Unterstützte Chromium-Browser öffnen über `beforeinstallprompt` den nativen Installationsdialog.
- iPhone und iPad erhalten eine integrierte Safari-Anleitung für „Zum Home-Bildschirm hinzufügen“ und „Als Web-App öffnen“.
- Standalone-Erkennung berücksichtigt CSS-Display-Mode und den iOS-Navigatorstatus; bereits installierte Instanzen werden erkannt.
- Responsiver, zugänglicher Dialog mit Escape-/Hintergrund-Schließen, Installationsstatus und klaren Vorteilen.
- Neuer Regressionstest prüft Manifest, Apple-PWA-Metadaten, Installationsereignisse und responsive Oberfläche.
- README, Changelog, Service-Worker-Cache und Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.89.5

- Die Felder unter dem Detaildiagramm wurden vollständig auf die Regen-/Sprühregen-Plausibilitätsprüfung umgestellt.
- Das Niederschlagsfeld nutzte bereits die plausibilisierte Form; nun verwenden auch Wettertext, Wettersymbol und die Wetterpiktogramme im Detaildiagramm denselben korrigierten Anzeigecode.
- Ein unplausibler Open-Meteo-Sprühregencode erscheint damit überall in der Detailansicht konsistent als leichter, mäßiger oder starker Regen.
- Die Niederschlagsarten der Detaillegende werden nicht mehr als dünne Linien, sondern als kompakte Balken im jeweiligen Farb- und Musterdesign dargestellt.
- Neuer Regressionstest für die Konsistenz der Detailansicht und ihrer Niederschlagslegende.
- README, Changelog, Service-Worker-Cache und Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.89.4

- Windrichtungspfeile in aktueller Lage, Tageskarten, Stunden-Detailansicht, Tooltips, Bergmodus und Widget verwenden jetzt den exakten Winkel von 0 bis 359,9 Grad statt eines Acht-Richtungen-Rasters in 45-Grad-Schritten.
- Die bisherige MID-Konvention bleibt erhalten: Der Pfeil zeigt in die Richtung, in die der Wind weht; im zugänglichen Titel werden Herkunfts- und Zielrichtung in Grad genannt.
- Das Meteogramm nutzte bereits die vollständige 360-Grad-Drehung und bleibt unverändert konsistent.
- Neuer Regressionstest verhindert die Rückkehr der diskreten Unicode-Pfeile.
- README, Changelog, Service-Worker-Cache und Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.89.3

- Kritischen Laufzeitfehler nach dem Start von v0.7.89.x behoben.
- Die manuelle Aufteilung von React, Icons, Diagramm-, Karten-, Export- und HDF5-Bibliotheken wurde vollständig zurückgenommen. Sie brachte bei den überwiegend statischen Importen keinen verlässlichen Bedarfsladevorteil und konnte eine fehlerhafte Initialisierungsreihenfolge der erzeugten Browser-Chunks verursachen.
- Das bewährte Vite-Standard-Bundling ist wieder aktiv. Das echte Lazy-Loading der großen MID-Module bleibt unverändert erhalten.
- Sichere Optimierungen bleiben bestehen: ES2020-Ziel, CSS-Code-Splitting, deaktivierte Produktions-Source-Maps, Rendering-Containment, Touch-Scrolling, mobile Tooltip-Begrenzung und reduzierte Bewegung.
- Der Performance-Test verhindert künftig ausdrücklich die erneute Aktivierung manueller Vendor-Chunks.
- Service-Worker-Cache auf v0.7.89.3 erhöht, damit fehlerhafte Assets der vorherigen Version nicht weiterverwendet werden.
- README, Changelog und sämtliche Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.89.2

- Zweiten GitHub-Buildfehler in `vite.config.ts` behoben.
- Die vorherige Ersetzung hatte `indexOf(...) >= 0` falsch geklammert und dadurch einen Vergleich innerhalb des Funktionsarguments erzeugt.
- Sämtliche Pfadprüfungen der manuellen Chunk-Aufteilung verwenden nun korrekt `id.indexOf('...') >= 0`.
- README, Changelog und Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.89.1

- GitHub-Buildfehler in `vite.config.ts` behoben.
- Die Chunk-Aufteilung verwendet nun `indexOf(...) >= 0` statt `String.prototype.includes(...)` und ist damit mit der im Node-TypeScript-Projekt verwendeten Bibliothekskonfiguration kompatibel.
- Die Performance-Optimierungen und die funktionale Aufteilung der Ladepakete bleiben unverändert erhalten.
- README, Changelog und Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.89

- Intensive Code- und Release-Revision mit Schwerpunkt auf Responsivität, Ladeverhalten und Paketgröße ohne Funktionsabbau.
- Vite-Build in getrennte, bedarfsgerecht ladbare Bibliotheks-Chunks für Diagramme, Karten, Export, HDF5, React und Icons aufgeteilt; Source-Maps im Produktionsbuild deaktiviert.
- Unterhalb des sichtbaren Bereichs liegende Module werden browserseitig über `content-visibility` und intrinsische Platzhalter effizienter dargestellt.
- Horizontale Diagramm- und Zeitachsen erhalten stabileres Touch-Scrolling, begrenztes Overscrolling und mobile Scroll-Snap-Unterstützung.
- Tooltips und Informationsdialoge wurden für schmale Displays gegen Überbreite, abgeschnittene Inhalte und unkontrollierte Umbrüche abgesichert.
- Unterstützung für `prefers-reduced-motion` ergänzt und unnötige Build-Artefakte aus dem Release-ZIP entfernt.
- README, Changelog und sämtliche Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung; Versionsnummer nur synchronisiert.

# MID v0.7.88.3

- Darstellungsfehler im Tooltip des 14-Tage-Ensemble-Trends behoben.
- Der Prozentwert der Prognosekonsistenz wird nun als untrennbare Einheit dargestellt und bricht auch auf schmalen Bildschirmen nicht mehr zwischen Zahl und Prozentzeichen um.
- README, Changelog und Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.88.2

- Die mit v0.7.88.1 eingeführte Sprühregen-Plausibilisierung gilt nun konsequent auch für die Wettertexte und Wettersymbole der 7-Tage-Vorhersage, des Widgets und des 14-Tage-Ensemble-Trends.
- Unplausible WMO-Sprühregen-Codes 51–55 werden in Tageszusammenfassungen nicht mehr als „Sprühregen“ weitergereicht, sondern anhand der DWD/WMO-Stundenschwellen als leichter, mäßiger oder starker Regen behandelt.
- Tagesereignisse, Zeitangaben und repräsentative Wettersymbole greifen jetzt auf dieselbe zentralisierte Niederschlagsform-Auswertung wie die Stundenansicht zurück.
- README, Changelog und sämtliche Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.88.1

- Plausibilitätsprüfung für Open-Meteo-Sprühregen ergänzt: WMO-Codes 51–55 werden nur noch bei hoher relativer Feuchte, ausgeprägter tiefer Bewölkung und schwacher stratiformer Niederschlagsrate als Sprühregen dargestellt.
- Fehlen die typischen Stratus-/Feuchtemerkmale oder ist die Niederschlagsrate zu hoch, wird der Niederschlag als Regen klassifiziert.
- Regenintensitäten werden nach den DWD/WMO-Stundenschwellen als leicht, mäßig, stark oder sehr stark bezeichnet; Sprühregen nutzt seine eigenen DWD-Intensitätsstufen.
- `cloud_cover_low` wird jetzt in der Best-Match-Stundenprognose geladen und zusammen mit relativer Feuchte, Gesamtbewölkung, Schauersignal und Niederschlagsmenge ausgewertet.
- Regressionstests sichern plausiblen Sprühregen und die Umklassifizierung unplausibler Sprühregen-Codes ab.
- Cloudflare Worker ohne funktionale Änderung; Versionsnummer lediglich synchronisiert.

# MID v0.7.87.1

- Release-Pipeline korrigiert: `package-lock.json` enthält keine internen OpenAI-Paketserver mehr; `jsfive` und `pako` werden über die öffentliche npm-Registry bezogen.
- ZIP-Installation und GitHub-Pages-Deployment sind im Installationsworkflow direkt verkettet, weil ein Bot-Commit mit `GITHUB_TOKEN` keinen weiteren Push-Workflow startet.
- Pages-Actions auf `configure-pages@v6`, `upload-pages-artifact@v5` und `deploy-pages@v5` aktualisiert; vorzeitiges Deployment beim reinen ZIP-Upload wird verhindert.
- OPERA-Nutzung erneut gehärtet: Der Worker ermittelt aktuelle CIRRUS-DBZH-Dateien jetzt primär über die offizielle MeteoGate-ORD-API und parallel über den offenen S3-Index.
- Falls beide Verzeichnisdienste ausfallen, bleibt der begrenzte HDF5-Range-Probe-Fallback aktiv. Dadurch hängt OPERA weder allein vom S3-Listing noch von geschätzten Zeitstempeln ab.
- Kompositbild und aktuelle Niederschlagswahrscheinlichkeit verwenden weiterhin denselben validierten HDF5-Rasterpfad; DWD bleibt in Deutschland primär, OPERA ist sichtbare Unterlage und unabhängiger Abgleich.
- OPERA-Regressionstest um den ORD-API-Pfad erweitert.

# MID v0.7.87

- Belastbare erste Ausbaustufe des automatischen Starkregen-/Überflutungsindikators ergänzt: RADOLAN-YW-Summen für 15/30/60/180/360 Minuten, DWD-RV-Nowcast-Summen bis +120 Minuten, KONRAD3D-Starkregenflag und Zellzug, KOSTRA-DWD-2020-Einordnung für 30/60/360 Minuten sowie DWD-Stationsabgleich.
- Die Starkregenkarte erscheint ausschließlich bei einem tatsächlichen Mess-, Nowcast-, KONRAD-, KOSTRA- oder nahen Stationssignal und bleibt vollständig von amtlichen Warnungen getrennt.
- OPERA-CIRRUS-Georeferenzierung korrigiert: Das offizielle LAEA-Raster verwendet eine Oberkante von y=0 m und den negativen Projektionsursprung y_0=-2.100.000 m. Die frühere Ersatzgeometrie verschob Standortabfragen um 4.400 km und führte dadurch zu NoData.
- Das Kompositbild deklariert OPERA erst nach erfolgreichem Download, HDF5-Dekodierung und realer Standortabdeckungsprüfung als bereit. OPERA wird als europäische Unterlage dargestellt, DWD liegt in Deutschland darüber.
- Die aktuelle Niederschlagswahrscheinlichkeit prüft DWD und OPERA parallel. DWD bleibt in Deutschland primär; OPERA dient als unabhängiger Abgleich und übernimmt bei DWD-Ausfall. RainViewer bleibt der letzte Fallback.
- OPERA-Bereitschaft, Datenstand und Fehlergrund werden im Infodialog des Kompositbildes ausgewiesen.

# MID v0.7.86.1

- Fehler im isolierten Ensemble-Nullability-Regressionstest behoben: Der Test verwendet nun eine eigene temporäre TypeScript-Konfiguration mit `moduleResolution: Bundler`, `skipLibCheck: true` und leerer `types`-Liste.
- Dadurch werden bei der kleinen Testdatei keine projektexternen Ambient-Typdefinitionen aus `node_modules/@types` mehr unnötig mitkompiliert.
- Die im GitHub-Lauf gemeldeten TS2792-Fehler zu `@babel/parser`, `@babel/types` und `csstype` treten nicht mehr auf; der eigentliche strikte Nullability-Test bleibt erhalten.
- Keine funktionale Änderung an Wetterdarstellung oder Cloudflare Worker.

# MID v0.7.86

- Ausführliche Quellen-, Produkt-, Auflösungs-, Zeit-, Alters-, Status- und Lizenzangaben des Kompositbildes in einen barrierefrei beschrifteten Infodialog verschoben.
- OPERA-CIRRUS-Erkennung korrigiert: Der Worker liest nun die tatsächlich vorhandenen DBZH-HDF5-Objekte aus dem offiziellen S3-Index, statt Zeitstempel zu erraten.
- Nur real vorhandene OPERA-Frames werden an Karte und aktuelle Niederschlagswahrscheinlichkeit übergeben; bei einem nicht verfügbaren Index folgt ein kontrollierter Range-Probe-Fallback.
- OPERA-Dateiproxy verwendet validierte Objektschlüssel und liefert Diagnoseheader für Quelle, Produkt, Schlüssel und Worker-Version.
- Regressionstest für Infodialog, reale OPERA-Objektliste, fehlertolerante Erkennung und CORS-HDF5-Proxy erweitert.

# MID v0.7.85

- Z-Zeit unter dem Ortsnamen einheitlich als `hhmmZ` ohne Doppelpunkt dargestellt.
- Separate Gewitterinformation neben der aktuellen Niederschlagswahrscheinlichkeit ergänzt.
- DWD KONRAD3D wird fünfminütig für Zellposition, Zugrichtung, Schweregrad, Trend, Blitzrate, Hagel-, Starkregen- und Böenflags ausgewertet.
- Amtliche DWD-WFS/CAP-Gewitterwarnungen haben Vorrang; Radar, Best-Match und Stationsniederschlag dienen ergänzend der Plausibilisierung.
- Neue Workerroute `thunderstorm-nowcast` und Regressionstest ergänzt.

# MID v0.7.84.1

- GitHub-Buildfehler TS18048 im OPERA-Rasteroverlay behoben.
- Statt des optional typisierten `pixelBounds.min` verwendet die Darstellung nun Leaflets eindeutig typisierten Karten-Pixelursprung.
- Regressionstest verhindert die erneute Verwendung des optionalen Bounds-Minimums.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.84

- Phase 1 der europäischen Radarintegration auf Basis von MID v0.7.83.3 umgesetzt.
- Das Kompositbild lädt das echte EUMETNET-OPERA-CIRRUS-DBZH-Komposit als ODIM-HDF5-Raster mit 1 km Rasterweite und fünfminütigem Produktzyklus.
- Radarpriorität vereinheitlicht: DWD-HX/PX250 beziehungsweise DWD-RV → OPERA CIRRUS → RainViewer als letzter Fallback.
- Die frühere OPERA-Punkt-/Stützstellenauswertung wurde vollständig entfernt.
- Karte und aktuelle Niederschlagswahrscheinlichkeit verwenden denselben OPERA-Rasterdecoder; Standortpixel und 30-km-Umfeld fließen in die Radar-/Best-Match-Kombination ein.
- Neue Worker-Routen `opera-raster-meta` und `opera-raster-file` liefern validierte Metadaten und CORS-sichere HDF5-Dateien.
- Regressionstest für OPERA-Raster, Quellenreihenfolge und Entfernung der Altlogik ergänzt.

# MID v0.7.83.3

- Achsentick-Beschriftungen im Ensemble-Temperaturdiagramm vertikal korrigiert.
- Die zusätzliche CSS-Baseline `dominant-baseline: hanging`, die X- und Y-Achsenwerte leicht nach unten verschob, wurde entfernt.
- Recharts übernimmt wieder die vorgesehene mittige Standardausrichtung der Tickwerte.
- Regressionstest für die Achsenausrichtung ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.83.2

- GitHub-Actions-Warnung zur erzwungenen Node.js-24-Ausführung entfernt: `actions/checkout` und `actions/setup-node` wurden in Installations- und Deployment-Workflow von v4 auf v6 aktualisiert.
- Der Installer-Workflow ist zusätzlich als Wiederherstellungs-/Referenzkopie Bestandteil des vollständigen MID-Projekts.
- Regressionstest verhindert künftig die erneute Verwendung der Node-20-basierten Action-Versionen v1 bis v4.
- Das Projekt selbst wird weiterhin bewusst mit Node.js 22 gebaut; geändert wurde ausschließlich die interne Laufzeit der GitHub-Actions-Bausteine.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.83.1

- GitHub-Buildfehler in `src/EnsemblePanel.tsx` behoben: optionale Klimawerte werden vor der Formatierung gemeinsam als endliche Zahlen eingegrenzt.
- Die Temperatur-Skalierung filtert `number | undefined` nun über einen echten TypeScript-Type-Guard statt über einen unzulässigen `number`-Callback.
- Eine leere optionale Klimareihe fällt für die Skalenberechnung sicher auf die Best-Match-Werte zurück.
- Strikter Regressionstest für die Ensemble-Nullability ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.83

- Warnfreie Tage werden in der 7-Tage-Vorhersage kompakt als „Keine Hazards“ gekennzeichnet.
- Sonnenscheindauer, Prognosekonsistenz und Best-Match-Hazards verwenden im Ensemble-Tooltip einen einheitlichen Abschnittsaufbau.
- Gemeinsame Popover- und Diagrammhilfen reduzieren redundante Listener und doppelte Skalenlogik.
- Ensemble-Diagramm- und Tooltip-Daten wurden stärker typisiert; stabile React-Schlüssel und ein automatischer CodeCheck wurden ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.82.2

- Die 7-Tage-Vorhersage zeigt an warnfreien Tagen wieder einen dezenten Hinweis „Keine Warnhinweise“.
- Best-Match-Hazards ab interner Intensitätsstufe 2 erscheinen im Ensemble-Temperaturtrend wieder als kompakte, farbcodierte Piktogramme direkt oberhalb des Sonnenschein-/Bewölkungsbands; die vollständigen Angaben bleiben im Tages-Tooltip.
- Schriftart und Textfarben des Ensemble-Temperatur-Tooltips wurden vereinheitlicht.
- Aus sämtlichen automatisch erzeugten Warntexten und Windschwellen-Tooltips wurden ausgeschriebene Hinweise auf DWD-Warnstufen entfernt; die interne Farbcodierung und Schwellenlogik bleiben unverändert.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.82.1

- Die ausgeschriebene Bezeichnung zeigt die Anfangsbuchstaben **M**, **I** und **D** innerhalb von „Meteorological Information Dashboard“ fett.
- Das Rückfallsystem versucht eine neuere, vollständig gecachte MID-Version nun automatisch erneut; die Rückfallleiste verschwindet beim manuellen erneuten Test sofort und bleibt nicht dauerhaft an einer älteren Version hängen.
- Warnfelder der 7-Tage-Vorhersage zeigen nur noch den prognostizierten Wert in der gewählten Einheit, ohne zusätzliche Umrechnung oder Beaufortangabe; der vollständige Warntext bleibt im Tooltip.
- Best-Match-Warnhinweise ab Warnstufe 2 wurden im Ensemble-Temperaturtrend aus der Diagrammfläche entfernt und platzsparend in den Tages-Tooltip integriert.
- Im Detaildiagramm besitzt die Niederschlagswahrscheinlichkeit eine unabhängige rechte 0-/50-/100-%-Achse. Niederschlagsbalken werden an den Plotgrenzen beschnitten und können die rechte Achse nicht mehr überdecken.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.82

- Warntexte und kompakte Hazardwerte verwenden die gewählte Windeinheit; bei kt, m/s oder mph wird der km/h-Wert ergänzt, bei km/h die Beaufortstärke.
- Warntexte zeigen prognostizierte Temperaturen und Mengen ausschließlich als ganze Werte ohne Dezimalkomma.
- Die 7-Tage-Vorhersage zeigt ab DWD-Warnstufe 1 nur noch kompakte, stufenfarbige Symbole mit erwartetem Wert; die ausführliche Erläuterung bleibt im Tooltip.
- Best-Match-Warnmarker wurden aus dem stündlichen Detaildiagramm entfernt. Die dezenten Windwarnflächen und horizontalen DWD-Schwellenlinien bleiben bestehen.
- Im Ensemble-Temperaturtrend erscheinen oberhalb des Sonnenschein-/Bewölkungsbands stufenfarbige Best-Match-Hazards ab Warnstufe 2.
- Allgemeine Best-Match-Gefahrenkarten verwenden dieselbe ganzzahlige und einheitenbewusste Warntextformatierung.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.81.1

- DWD-Warnstufe 1 in der zentralen Best-Match-Auswertung ergänzt und fachlich korrigiert.
- Windböen werden ab Überschreiten von 50 km/h als Stufe 1 erkannt; der Windbereich besitzt nun zusätzlich die gelbe Schraffur und Trennlinie zwischen 50 und 65 km/h.
- Einfache Gewitter, leichter Schneefall, Glätte bei Niederschlag und Frost, Frost unter 0 °C bis 800 m, Nebel unter 150 m Sichtweite und starke Wärmebelastung über etwa 32 °C bei geringer Abkühlung werden als Stufe 1 berücksichtigt.
- Die kompakte Warnsymbolzeile oberhalb des Sonnenschein-/Bewölkungsbands zeigt gemäß Vorgabe weiterhin ausschließlich Stufen 2 bis 4; Stufe 1 fließt in die allgemeine 24-Stunden-Gefahrenauswertung und Windskalierung ein.
- UV-Warnstufe 1 wird nicht künstlich aus dem UVI allein erzeugt, weil das DWD-Kriterium zusätzlich eine regionale beziehungsweise klimatologische Abweichung verlangt.
- Regressionstests um sämtliche automatisch ableitbaren Stufe-1-Kriterien und die Filterung der Symbolzeile erweitert.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.81

- Best-Match-basierte Warnhinweise wurden in beiden Modi als eigene Symbolzeile unmittelbar oberhalb des Sonnenschein-/Bewölkungsbands ergänzt.
- Es werden ausschließlich modellseitig überschrittene DWD-Warnstufen 2 bis 4 dargestellt; Ereignisart, Warnfarbe und Stufennummer sind direkt unterscheidbar.
- Warnmarker fassen zusammenhängende Zeiträume zusammen und öffnen per Klick, Tippen oder Tastatur einen kurzen Tooltip; sie sind ausdrücklich keine amtlichen Warnungen.
- DWD-Warnkriterien für Wind, Gewitter, Stark- und Dauerregen, Schneefall, Schneeverwehung, markante Glätte/Glatteis, strengen Frost und extreme Wärmebelastung zentralisiert.
- Windwarnbereiche auf die offiziellen Schwellen 65, 90, 105, 120 und über 140 km/h umgestellt; jede neue Schwelle wird zusätzlich durch eine dezente horizontale Linie markiert.
- Automatische Hazard-Karten und Tagesindikatoren verwenden dieselbe zentrale DWD-Logik und keine bisherigen Mischschwellen aus DWD, Meteoalarm und NWS mehr.
- Regressionstest für DWD-Schwellen, Warnmarker, Intensitäten, Tooltips und horizontale Schwellenlinien ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.80

- Im Windbereich der erweiterten stündlichen Detailansicht werden die vorhandenen DWD-/Meteoalarm-Warnschwellen ab 50, 75, 89 und 103 km/h als dezente gelbe, orangefarbene, rote und violette Schraffurbereiche dargestellt.
- Die Warnflächen werden ausschließlich innerhalb des tatsächlich sichtbaren Windbereichs gezeichnet und liegen hinter Wind-, Böen- und Richtungselementen.
- Meteogramm und Widget-/PNG-Generator besitzen keine eigene zweite Ein-/Ausklappsteuerung mehr; beide werden ausschließlich über den jeweiligen äußeren Modulschalter geöffnet und geschlossen.
- Beim Schließen der Module werden die enthaltenen Komponenten weiterhin ausgehängt und laufende Meteogrammabrufe abgebrochen.
- Regressionstest für Windwarnflächen und eindeutige Modulsteuerung ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.79.3

- Die Zahl der Wetterpiktogramme in der stündlichen Detailansicht wird nun aus der tatsächlich verfügbaren Diagrammbreite bestimmt und bis zur konfliktfrei möglichen Höchstzahl erhöht.
- Auf breiten Tablet- und Desktopansichten können alle stündlichen Piktogramme erscheinen; auf schmaleren Displays werden sie gleichmäßig über den Tag verteilt.
- Der bisher sehr großzügige feste Mindestabstand wurde durch eine an Symbolgröße und Ansichtsbreite angepasste Verteilung ersetzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.79.2

- In beiden Ansichtsmodi folgt der Kopfbereich der stündlichen Detailansicht nun der Reihenfolge: JETZT-Zeitmarkierung, Wetterpiktogramme, Sonnenschein-/Bewölkungsband, eigentliche Diagrammfläche.
- Die blaue Markierung des ausgewählten Zeitschritts reicht jetzt bis in die Piktogramm-Lane und wird hinter den Wetterpiktogrammen gezeichnet, damit diese lesbar bleiben.
- Vertikale Abstände und Diagrammhöhe wurden für schmale und breite Ansichten gemeinsam angepasst.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.79.1

- In der stündlichen Detailansicht wurden Wetterpiktogramme und Sonnenschein-/Bewölkungsband vertikal getauscht: Die Piktogramme stehen nun oben, das Band direkt darunter.
- Abstände zur Jetzt-Zeitmarkierung und zur eigentlichen Diagrammfläche wurden entsprechend angepasst, damit alle Elemente weiterhin getrennt bleiben.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.79

- Im Erweiterten Modus zeigt die Ortszeile nun die aktuelle Ortszeit mit GMT-Abweichung und zusätzlich die Z-Zeit in Klammern; die einzeilige Darstellung passt ihre Schriftgröße responsiv an.
- Erklärungen der stündlichen Detailansicht, der 14-Tage-Ensemble-Übersicht sowie der Temperatur- und Niederschlagsdiagramme wurden auch im Erweiterten Modus in dezente, bei Außenklick schließbare Info-Popover verschoben.
- P10–P90-Fehlerbalken im Ensemble-Niederschlagsdiagramm werden unabhängig vom Best-Match-Wert exakt zwischen P10 und P90 gezeichnet.
- Oberen Bereich der Detailansicht in getrennte Ebenen für Sonnenschein-/Bewölkungsband, Wetterpiktogramme und aktuelle Uhrzeit gegliedert, damit keine Überdeckungen entstehen.
- Temperatur-, Niederschlags- und Windachsen verwenden nun möglichst glatte, an runden Schrittweiten ausgerichtete Werte.
- Dichte der Windrichtungspfeile wird anhand der tatsächlich verfügbaren Diagrammbreite automatisch maximiert, ohne benachbarte Pfeile zu überdecken.
- Regressionstests für Z-Zeit, Info-Popover, exakte P10–P90-Spanne, adaptive Kopfleiste, Achsenskalierung und Windpfeildichte ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.78.1

- TypeScript-Buildfehler TS2367 in der Niederschlagsdarstellung der erweiterten Detailansicht behoben.
- Den Niederschlagstyp `none` vor der Verwendung des engeren `DetailPrecipType` jetzt über einen expliziten Type-Guard ausgeschlossen.
- Dieselbe typsichere Prüfung wird auch für die dynamische Niederschlagsskala verwendet.
- Regressionstest erweitert, damit die fehlerhafte Kombination aus Exclude-Typcast und anschließendem `none`-Vergleich nicht erneut eingeführt wird.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.78

- Open-Meteo-Modellkatalog um CHMI ALADIN Seamless, ALADIN Mitteleuropa 2,3 km und ALADIN Tschechien 1 km ergänzt, damit aktuelle Modellstände im Best-Match-Status korrekt benannt werden.
- Die jüngsten serverseitigen Open-Meteo-Korrekturen für ECMWF-Solarinterpolation, AIGEFS-Abruf und GFS-Niederschlags-Deakkumulation werden automatisch über die bestehenden APIs genutzt; hierfür ist keine eigene MID-Datenumrechnung erforderlich.
- Im Erweiterten Modus lassen sich Temperatur, gefühlte Temperatur, Taupunkt, einzelne Niederschlagsarten, Niederschlagswahrscheinlichkeit, Wind, Böen und Windrichtung unmittelbar über die Legende ein- und ausblenden.
- Taupunkt als zurückhaltende Linie ergänzt; unter dem Niederschlagsbereich erscheinen Wind und Böen sowie darunter Richtungspfeile.
- Nicht mehr benötigte Temperatur-, Niederschlags- und Windbereiche werden dynamisch entfernt. Das SVG passt ViewBox und Höhe per ResizeObserver an Hoch-/Querformat und verfügbare Bildschirmbreite an, ohne die Darstellung zu verzerren.
- Legendenmuster der gefühlten Temperatur in Standard- und Erweitertem Modus an die gestrichelte Diagrammlinie angeglichen.
- Auswahl der erweiterten Detailparameter wird lokal gespeichert.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.77.1

- Beschriftung der gelb-grauen Sonnenschein-/Bewölkungslegende in allen Farbdesigns mit einer festen dunklen Schriftfarbe lesbar gemacht.
- Deutsche Wortstellung bei später einsetzenden Schauern korrigiert, z. B. `Stark bewölkt, abends Schauer` statt `Stark bewölkt, Schauer abends`.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.77

- Widget-/PNG-Generator und Druckniveau-Meteogramm stehen ausschließlich im Erweiterten Modus zur Verfügung.
- Quellen bleiben in beiden Modi über die Fußzeilen-Schaltfläche `Quellen` erreichbar und öffnen sich als bei Außenklick, Touch oder Escape schließbares Popover.
- Beim erstmaligen Öffnen des Standardmodus werden die stündliche Detailansicht sowie alle nachfolgenden einklappbaren Module geschlossen initialisiert.
- Bestehende Modulzustände bleiben nach der Erstinitialisierung weiterhin lokal gespeichert.
- Der Zusatz `Ortsname aus Geodatenbank` wurde in beiden Ansichtsmodi entfernt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.76

- Modellstände-Popover in Best-Match- und Ensemble-Bereichen schließen nun zuverlässig bei Klick oder Tippen außerhalb sowie mit Escape.
- Bisherigen Kompaktmodus in `Standardmodus` umbenannt und als Erststartmodus festgelegt; bestehende Compact-Einstellungen werden automatisch übernommen.
- Bisherigen Vollständig-Modus durch den `Erweiterten Modus` ersetzt. Dieser verwendet weiterhin einklappbare Module, ergänzt jedoch meteorologische und technische Hintergründe direkt in der Oberfläche.
- Im Standardmodus werden ausgewählte Bedien- und Datenerklärungen über dezente Info-Schaltflächen geöffnet und bei Außenklick, Touch oder Escape wieder geschlossen.
- Ausführliche Stationsanalyse, Ensemble-Methodik, Bedienhinweise und lange technische Quellen-/Haftungserklärungen werden im erweiterten Modus direkt angezeigt.
- Alte gespeicherte Vollansicht wird automatisch in den erweiterten Modus migriert.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.75

- Dezente Tagespfeile der stündlichen Detailansicht stehen nun auf Handy, Tablet im Hoch- und Querformat sowie Desktop dauerhaft bereit.
- Die Pfeile bleiben responsiv: Auf kleinen Smartphones nur als Symbole, auf größeren Displays zusätzlich mit abgekürztem Wochentag.
- Neu angelegte Favoriten werden nicht mehr vorne einsortiert, sondern am Ende der bestehenden Reihenfolge ergänzt.
- Auch importierte, bisher noch nicht vorhandene Favoriten werden hinter den vorhandenen Einträgen angefügt; die Reihenfolge innerhalb des Imports bleibt erhalten.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.74

- Favoriten-Schnellleiste platzsparend als eigene zweite Reihe unter der Kopfleiste reaktiviert.
- Aktuelle Position und alle gespeicherten Favoriten sind wieder direkt auswählbar; aktiver Ort, Standardort, Gruppe sowie Berg-/Ski- und Wassersportprofile bleiben erkennbar.
- Reihenfolge lässt sich unmittelbar in der Schnellleiste per Maus-Drag&Drop und auf Touchgeräten über den Griff verschieben; die neue Reihenfolge wird wie bisher lokal gespeichert.
- Das kleine Verwaltungssymbol öffnet direkt den Favoriten-Unterbereich der zentralen Einstellungen. Umbenennen, Gruppen, Regeln, Import/Export, Standardort und Profile bleiben ausschließlich dort.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.73

- Ensemble-Temperaturtooltip horizontal wieder an Diagramm und Viewport begrenzt; am rechten beziehungsweise linken Rand wechselt die Position automatisch zur sichtbaren Seite.
- METAR-Wolkenhöhe fachlich differenziert: `Ceiling` erscheint nur bei mindestens 5/8 Bewölkung aus BKN/OVC/VV, bei 1/8 bis 4/8 wird die niedrigste FEW-/SCT-Lage als `Wolkenuntergrenze` in hft angezeigt.
- Hyperlokale Stationsanalyse um die separate Wolkenuntergrenze erweitert, ohne aus dünner Bewölkung fälschlich eine Ceiling abzuleiten.
- Stündliche Detailansicht auf Handy und Tablet um dezente Randtasten für den tageweisen Wechsel ergänzt; die gewählte Uhrzeit wird beim Tageswechsel beibehalten.
- Konsistenzpunkte im mobilen 14-Tage-Ensemble-Trend reagieren nun beim ersten Tippen. Hover wird ausschließlich auf Geräten mit echter Maus-/Trackpad-Hoverfunktion verwendet.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.72

- Zentrales Einstellungsmenü ergänzt und die bisher verteilten Kopfbereichsregler dort logisch zusammengeführt.
- Ansichtsoptionen, Farbdesign (Auto/Hell/Dunkel), Windeinheit, Favoritenverwaltung und MID-Systemstatus besitzen eigene Unterbereiche.
- Favoritenverwaltung vollständig als Untermenü eingebettet; Gruppen, Reihenfolge, Standardort, Import/Export sowie Berg-/Ski- und Wassersportprofile bleiben erhalten.
- Permanenten Favoritenstreifen sowie direkte Ansicht-, Design-, Einheiten- und Systemstatusregler aus dem Kopfbereich entfernt. Favoriten bleiben über die Ortssuche schnell erreichbar.
- Kopfbereich auf allen Plattformen auf Ortssuche, Standort, Einstellungen und Neuladen reduziert; responsive Vollbilddarstellung des Einstellungsmenüs auf Mobilgeräten ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.71

- Update-System grundlegend erweitert: Eine neue Version wird vor der Aktivierung vollständig in einen eigenen App-Shell-Cache geladen, einschließlich der tatsächlich im produktiven `index.html` referenzierten JavaScript- und CSS-Dateien.
- Die zuletzt geprüfte Vorversion bleibt erhalten. Schlägt der Start der neuen App fehl und wird innerhalb von 20 Sekunden keine Laufzeit-Gesundheitsmeldung gesendet, schaltet MID automatisch auf die vorherige Version zurück.
- Manuelle Systemverwaltung ergänzt: App-/Worker-/aktive Version anzeigen, MID-Cache neu aufbauen, vorherige Version wiederherstellen und Service Worker samt App-Caches zurücksetzen. Favoriten und Einstellungen bleiben beim Reset erhalten.
- Rückfallversion erhält eine feste Wiederherstellungsleiste, über die die aktuelle Version erneut getestet werden kann.
- Datenabrufe entkoppelt: Best Match, Stationsanalyse, Luftqualität, Radar, amtliche Warnungen und Modellinformationen verwenden getrennte AbortController und blockieren einander nicht.
- Ensemble und Klimatologie laden unabhängig voneinander. Ortswechsel, manuelles Neuladen und Ansichtswechsel brechen veraltete Requests ab, damit alte Ergebnisse keinen neuen Standort überschreiben.
- Such-, Meteogramm- und PX250-Metadatenabrufe zusätzlich gegen überholte Antworten und weiterlaufende Netzwerkzugriffe abgesichert.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.70.4

- Weltweiten NOAA-AviationWeather-/METAR-Abruf korrigiert: Die geografische Bounding-Box wird entsprechend der aktuellen API-Reihenfolge als Breitengrad/Längengrad übergeben.
- METAR-Zeitfenster auf drei Stunden erweitert und internationale Suchweite außerhalb Deutschlands von 140 auf 220 km erhöht.
- Mehrfachmeldungen derselben ICAO-Station werden auf die jeweils neueste Beobachtung reduziert.
- METAR-Sichtweite wird nun auch über den Worker vollständig an die hyperlokale Analyse weitergereicht.
- Eigener Regressionstest für internationale METAR-Orte ergänzt; funktionale Worker-Änderung, daher Worker vor dem Hauptprojekt bereitstellen.

# MID v0.7.70.3

- Im Ensemble-Niederschlagsdiagramm die getrennten P10-/P90-Kurven durch einen dunkelgrauen P10–P90-Fehlerbalken über dem Best-Match-Niederschlagsbalken ersetzt.
- Fehlerbalken werden nur an Tagen mit Best-Match-Niederschlag angezeigt.

# MID v0.7.70.2

- Mausradnavigation der stündlichen Detailansicht auf die eigentliche SVG-Diagrammfläche begrenzt; Legende, Überschrift, Quickfacts und Stunden-Tooltip scrollen die Seite wieder normal.
- Ursache der ausgefallenen Ensemble-Auswertung behoben: veraltete Open-Meteo-Modellkennungen für Mitgliedsmodelle und Ensemble-Mittel durch die aktuellen API-Kennungen ersetzt.
- Ensemble-Abrufe auf vier parallele Modellanfragen begrenzt und bei HTTP 429/5xx mit kurzen Wiederholungsversuchen abgesichert.
- Ensemble-Mittel-Reserve vollständig auf die aktuellen DWD-, NOAA-, ECMWF-, GEM-, BOM-, UKMO-, MeteoSwiss- und Google-Kennungen aktualisiert.
- Diagnose bei vollständigem Ausfall präzisiert; keine funktionale Worker-Änderung, nur Versionssynchronisierung.

# MID v0.7.70.1

- Ensemble-Diagramm-Tooltip präzisiert: Bei der Sonnenscheindauer heißt der Klammerzusatz nun `P10–P90` statt des unspezifischen Ausdrucks `Bandbreite`.
- Versionsschema auf aufwertungsabhängige Releases umgestellt: Funktionsstände verwenden `0.7.x`, eng begrenzte Wartungsänderungen `0.7.x.y`.
- Versionssynchronisierung, Anzeigeersetzung und Updater-Vergleich für vierteilige Wartungsversionen abgesichert.
- Keine funktionale Worker-Änderung; nur einheitliche Versionssynchronisierung auf `0.7.70.1`.

# MID v0.7.70

- Sichtbare Mess- und Prognosewerte auf einheitliche deutsche Dezimaldarstellung geprüft und erweitert.
- Aktuelle Bewölkung um die METAR-Ceiling in hunderten Fuß über Grund (`hft`) ergänzt; geeignete BKN-, OVC- und VV-Lagen fließen stationsgewichtet in die hyperlokale Analyse ein.
- Desktop-Kacheln der aktuellen Einzelparameter platzsparender angeordnet, sodass bei ausreichender Breite alle Parameter in einer Zeile stehen.
- Cloudflare Worker funktional um strukturierte Wolkenlagen, vertikale Sichtweite und METAR-Rohmeldung erweitert.

# MID v0.7.69

- Sonnenscheindauer in der 7-Tage-Vorhersage und im Ensemble-Tooltip mit maximal einer Nachkommastelle formatiert: volle Stunden erscheinen ohne unnötige Dezimalstelle (`15 h` statt `15,0 h`), Zwischenwerte weiterhin mit deutschem Dezimalkomma.
- Gelb-graue Sonnenscheinlegende im Ensemble-Temperaturdiagramm verkleinert und optisch zurückgenommen, ohne das eigentliche Datenband zu verändern.
- Aktuelle Messwerte um die Karte „Sichtweite“ zwischen Niederschlag und Bewölkung ergänzt.
- Hyperlokale Analyse um Sichtweite erweitert und zugleich Bewölkung sowie Niederschlag in die modellgestützte Restfeldanalyse aufgenommen; Temperatur, Feuchte, Taupunkt, Luftdruck, Wind, Böen, Sichtweite, Bewölkung und Niederschlag nutzen nun alle verfügbaren geeigneten Stationsmessungen.
- Bright-Sky-Sichtweite wird in Metern übernommen; METAR-Sichtweiten werden aus Statute Miles zuverlässig in Meter normalisiert. METAR-Wolkenlagen werden zusätzlich in eine Flächenbedeckung überführt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.67

- Niederschlagsform im stündlichen Detaildiagramm vereinheitlicht: WMO-Wettercode steuert nun Wettertext, Symbol, Balkenmuster, Legende und Stunden-Tooltip konsistent.
- Fehler behoben, durch den reiner Schneefall beziehungsweise Schneeschauer wegen des Wasseräquivalents im Feld `precipitation` fälschlich als Schneeregen oder Schneeregenschauer dargestellt wurde.
- Mischformen werden bei fehlendem geeigneten WMO-Code nur noch dann abgeleitet, wenn gleichzeitig ein messbarer fester und flüssiger Niederschlagsanteil vorliegt.
- Niederschlagsklassifikation in ein separat testbares Modul ausgelagert und mit Regressionstests für Schnee, Schneeschauer, Schneeregen, Schneeregenschauer, Regen und gefrierenden Regen abgesichert.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.66

- Bewölkungs-/Sonnenband im Temperaturtrend farblich an die Referenzskala angepasst: kräftiges Gelb für viel Sonne, abgestufte Beige-Töne und neutrales Grau für wenig Sonne.
- Die Bandfarbe wird ausschließlich aus der täglichen Best-Match-Sonnenscheindauer gebildet; ungültige oder physikalisch zu hohe Werte werden auf das lokale Intervall zwischen Sonnenauf- und Sonnenuntergang begrenzt.
- Ensembleabruf um `sunshine_duration` je Mitglied erweitert; tägliche Summen werden modellgewichtet zu P10, Mittel und P90 aggregiert. Modelle ohne diese Variable bleiben durch einen automatischen Fallback weiterhin für Temperatur und Niederschlag nutzbar.
- Tooltip ersetzt „Bewölkung“ durch die Best-Match-Sonnenscheindauer in Stunden sowie die P10–P90-Bandbreite in Stunden mit deutschem Dezimalformat und responsivem Zeilenumbruch.
- Kompakte Sonnen-/Wolken-Farbskala nach Referenzmuster direkt in die Diagrammlegende aufgenommen, ohne die Außenhöhe des Diagramms zu verändern.
- Regressionsprüfung um Best-Match-Datenpfad, Ensemble-Sonnenbandbreite, Tooltiptext und Farbskala ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.65

- Temperatur- und Niederschlagsdiagramm verwenden nun dieselbe symmetrische Tagesachse mit je einem halben Zeitschritt Abstand zu linker und rechter y-Achse; erste und letzte Werte liegen nicht mehr auf den Achsen.
- Abstand, Beschriftung und Innenränder der x-Achsen wurden vereinheitlicht; Bewölkungsband, Temperaturkurven, Niederschlagsbalken und Wahrscheinlichkeitskurve bleiben taggenau deckungsgleich.
- Einheitenfehler der hyperlokalen Windanalyse behoben: Bright-Sky/DWD-Windwerte werden von km/h nach kt umgerechnet, bevor sie mit dem in kt angeforderten Open-Meteo-Hintergrundfeld verrechnet werden.
- Zusätzliche zentrale Normalisierung fängt künftig sämtliche Stationsdatensätze mit `windUnit: kmh` vor Restfeldanalyse und robuster Mittelung ab.
- Regressionsprüfung um symmetrische Diagrammachsen, identische Achsenabstände und Stationswind-Normalisierung ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.64

- Tooltip und interaktive Temperaturlegende räumlich getrennt, sodass der Tooltip die Legende nicht mehr überdeckt.
- Temperatur- und Niederschlagsdiagramm zunächst auf ein gemeinsames Tagesraster ausgerichtet.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.63

- Buildfehler `TS2304: Cannot find name 'RainTooltip'` in der Ensemble-Niederschlagsgrafik behoben.
- Fehlende `RainTooltip`-Komponente wiederhergestellt und gegen nicht numerische beziehungsweise fehlende Diagrammwerte abgesichert.
- Semantische TypeScript-Prüfung der geänderten Ensemble-Komponente sowie die vorhandenen Updater-, Interaktions- und Radarprüfungen erfolgreich ausgeführt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.62

- Ensemble-Konsistenztooltips werden über ein viewportfestes Portal gerendert, an allen Bildschirmrändern automatisch eingerückt und nicht mehr durch horizontal scrollende Kartenbereiche abgeschnitten.
- Hover und Tastaturfokus öffnen den Konsistenztooltip unmittelbar; beim Verlassen schließt er automatisch, Touch/Klick bleibt ergänzend nutzbar.
- Im Diagramm „Temperaturtrend und Prognoseunsicherheit“ zeigt ein tägliches Bewölkungsband direkt oberhalb der x-Achse Grau für wenig Sonne bis Gelb für viel Sonne.
- Das Bewölkungsband wird aus der Best-Match-Sonnenscheindauer relativ zur astronomischen Tageslänge berechnet und im Diagrammtooltip zusätzlich erläutert.
- Höhe, Außenabstände und Achsenreserven des Temperaturdiagramms bleiben unverändert.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.61

- Tageswechsel im Desktop-Detaildiagramm bewahrt die ausgewählte Ortsstunde: Pfeil hoch springt zum Folgetag und Pfeil runter zum Vortag jeweils auf denselben stündlichen Zeitschritt; an Zeitumstellungstagen wird der nächstliegende vorhandene Stundenwert verwendet.
- Native Dropdownlisten übernehmen das aktive Hell-/Dunkel-Farbschema einschließlich expliziter Hintergrund- und Schriftfarben für Optionen und Optionsgruppen.
- Interaktionsprüfung um Regressionstests für Stundenerhalt beim Tageswechsel und Dropdown-Kontrast ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.60

- Updatearchitektur bereinigt: nur noch ein zentral registrierter Service Worker; Installation und Aktivierung sind getrennt, der Seitenwechsel erfolgt erst nach `controllerchange` und anschließend cachefrei per `location.replace`.
- Such-/Favoritenbereich schließt zuverlässig bei Außenklick, Fokuswechsel, Escape, Ortswahl und über einen dauerhaft erreichbaren Schließen-Button.
- Ensemble-Konsistenzpunkte besitzen einen CSS-gesteuerten Hover-/Fokus-Tooltip, der ohne Klick erscheint und beim Verlassen automatisch verschwindet.
- Desktop-Detaildiagramm erhält native, nicht-passive Eingabehandler: Pfeil hoch/runter wechselt den Tag, Pfeil links/rechts und Mausrad wechseln stündlich.
- Radarabgleich korrigiert DWD-Kartenpixel durch GetFeatureInfo-Punktwerte auch bei scheinbar trockenem PNG-Pixel, begrenzt Teilabrufe, prüft Aktualität und 3-Stunden-Horizont und aktualisiert alle fünf Minuten sowie bei Sichtbarkeit/Fokus.
- GitHub-Pages-Build übernimmt explizite Radar-, Same-Origin- und Fallback-Worker-Endpunkte.
- Automatisierte Prüfungen für Updater, UI-Interaktionen und den konkreten DWD-Radarfehler ergänzt.

# MID v0.7.59

- Updateablauf stabilisiert: kein automatischer Reload beim Aktivieren der Option, keine Update-URL-Schleife und aktualisierter Service-Worker-Cache.
- Such-/Favoritenmenü schließt bei Klick außerhalb und mit Escape.
- Konsistenzpunkte zeigen ihren Tooltip bereits beim Hover/Fokus und schließen beim Verlassen.
- Desktop-Detaildiagramm: Pfeil hoch/runter wechselt tageweise; Mausrad navigiert stündlich.
- Radarabgleich mit Cache-Buster, Wiederholungsversuch und automatischer Aktualisierung alle fünf Minuten robuster gemacht.

# Changelog

## 0.7.59
- Widget: Der Wettertext erhält einen festen, zweizeiligen Bereich mit sauberem Umbruch; beide Textzeilen bleiben vollständig sichtbar und kollidieren nicht mehr mit den Temperaturwerten.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

## 0.7.55
- Desktop: Ansichtswahl aus der breiten Favoriten-/Suchspalte entfernt und als kompakte Auswahl direkt neben Suchfeld und Standortbutton platziert; auf schmalen Ansichten bleibt der gut bedienbare Segment-Schalter erhalten.
- Worker-Aufrufe verwenden nun mehrere konfigurierbare Endpunkte mit automatischem Failover, Zeitlimit und gespeichertem zuletzt erfolgreichen Endpunkt.
- Optionaler gleichursprünglicher Worker-Pfad und zusätzliche Fallback-Adressen schützen insbesondere gegen gesperrte `workers.dev`-Domains; vollständiger Schutz gegen lokale, DNS- oder Unternehmensnetz-Blockaden ist technisch nicht erzwingbar.
- METAR behält den direkten AviationWeather-Fallback; das Meteogramm fällt bei blockiertem Worker automatisch auf Open-Meteo direkt zurück.
- Warnungen, Radar-Nowcast, Kompositdaten, Blitz, 250-m-Radar und Modellkonturen melden nach Ausschöpfen aller Endpunkte eine eindeutige Blockade-/Netzwerkdiagnose.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

## 0.7.54
- Buildkorrektur: Typdeklaration für `import.meta.env` ergänzt, damit `src/pwa.ts` im GitHub-Workflow kompiliert.
- Buildkorrektur: ungenutzten Tageszeit-Helfer entfernt; TypeScript-Prüfung mit `noUnusedLocals` läuft wieder fehlerfrei.
- Tagesbeschreibung, Wetter-Icon und Tagescharakter werden konsequent aus denselben stündlichen Daten abgeleitet; die tägliche Sonnenscheindauer dient nur noch als schwacher Plausibilitätsfaktor.
- Bewölkte Stunden können dadurch nicht mehr zugleich zu einem unpassenden Tagescharakter wie „Heiter“ führen.
- Wettertexte besitzen feste, semantisch gekürzte Längenlimits: Haupttext maximal 30, Zusatztext maximal 28 Zeichen.
- Unnatürliche Zeitspannen wie „nachts bis abends“ entfallen; getrennte Ereignisfenster erscheinen kurz als „nachts/abends“, längere Verteilungen als „zeitweise“.
- Niederschlagswahrscheinlichkeiten werden nicht mehr doppelt im Beschreibungstext wiederholt, da sie bereits in den Tageswerten stehen.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

## 0.7.53
- PWA-Manifest, Apple-Web-App-Metadaten und vorsichtiger Service Worker mit Network-First für Navigation und version.json.
- Favoriten und Einstellungen werden zusätzlich in IndexedDB und Cache Storage gespiegelt und bei leerem localStorage automatisch wiederhergestellt.
- Wettercharakter und Icon werden vorrangig aus der stündlichen Tagesbewölkung abgeleitet; Sonnenstunden dienen nur noch als Plausibilitätsfaktor.
- Favoriten-Griff links zwischen Rand und Stern verlegt.
- Updater um Service-Worker-Aktualisierung ergänzt und durch automatisierten Konsistenztest geprüft.

## 0.7.52

- Wetter-Icons werden nun mit der vollständigen Tagesbeschreibung einschließlich Bewölkungstrend abgeglichen.
- Bei „Stark bewölkt, ab Mittag auflockernd“ erscheint ein Sonne-Wolken-Symbol statt einer reinen Sonne.
- „Heiter“ nutzt ein leicht bewölktes Sonnensymbol; „Heiter, später wolkiger“ und ähnliche Übergänge ein repräsentatives Mischsymbol.
- Niederschlags- und Gewittersymbole bleiben bei dominanten oder markanten Ereignissen vorrangig.

## 0.7.51

- Kurze Tagesbeschreibungen berücksichtigen nun markante Wetteränderungen im Tagesverlauf.
- Später einsetzende Schauer, Regen, Schnee oder Gewitter werden direkt mit Tageszeit genannt, z. B. „Sonnig, ab Nachmittag Schauer“.
- Deutliche Bewölkungstrends erscheinen knapp als „ab Mittag wolkiger“ oder „ab Mittag auflockernd“.
- Früh endender Niederschlag wird als Verlauf wie „Schauer am Morgen, später heiter“ beschrieben.

## 0.7.50

- Mobile Detailansicht ohne technische Kürzel wie „NS“ oder „NS-Wkt.“; stattdessen eindeutige Wetter-Symbole und kurze Klartextangaben.
- „UV“ und „UV-Index“ in der Oberfläche konsequent durch „UVI“ ersetzt.
- UVI-Werte werden für Standorte oberhalb von 500 m transparent näherungsweise höhenkorrigiert (+10 % je weitere 1000 m, gedeckelt auf +35 %).
- Die aktuelle UVI-Kachel weist eine aktive Höhenkorrektur samt Zuschlag und Standortshöhe aus.

# v0.7.46

## 0.7.49

- Tagescharakter der 7-Tage-Vorhersage präzisiert: Sonnenscheindauer, Tageslänge und effektive Tagesbewölkung werden gemeinsam bewertet.
- Statt pauschalem „Stark bewölkt“ erscheinen je nach Verhältnis nun kurze Abstufungen wie „Heiter“, „Wolkig, oft sonnig“, „Sonne und Wolken“, „Meist bewölkt“ oder „Bedeckt“.
- Mobile Detailansicht platzsparender beschriftet, unter anderem mit „Σ NS“, „max. NS-Wkt.“, „Temp.“ und „NS-Wkt.“ in der Legende.
- Desktop-Beschriftungen bleiben ausgeschrieben.

## 0.7.48

- Ansichtswahl direkt unter der Favoritenleiste als kompakte Auswahl „Kompakt“ oder „Vollständig“ mit Kurzbeschreibung.
- Höhenkachel aus den aktuellen Wetterdaten entfernt.
- Sonnenscheindauer der letzten Stunde als aktuelle Kennzahl ergänzt.
- Sonnenscheindauer platzsparend in die Tageswerte der 7-Tage-Vorhersage aufgenommen.

## 0.7.47

- Kompakte Startansicht als neuer Standard mit dauerhaft sichtbarer 7-Tage-Vorhersage.
- Stündliche Details der 7-Tage-Vorhersage sind in der kompakten Ansicht einblendbar.
- Kompositbild, 14-Tage-Ensemble, Meteogramm und Widget-Generator sind einklappbar und werden erst beim Öffnen vorbereitet.
- Modulzustände und gewählte Ansichtsart werden lokal gespeichert.
- Fallback-Schalter zur bisherigen vollständigen Ansicht ergänzt.


- Meteogramm-Höhenachsen: Flight Levels werden konsequent nach unten auf volle Zehner gerundet; hft-Angaben nach unten auf durch fünf teilbare Werte.

# 0.7.44 — stabiler heller Meteogramm-Export

- Problematischen geklonten Theme-Export entfernt.
- Meteogramm-PNG wird direkt aus dem sichtbaren Diagrammbaum in einem temporären, festen hellen Export-Theme erzeugt.
- iOS/Safari erhält damit keine leeren schwarzen oder weißen Exportbilder mehr.

## 0.7.42

- Theme-Auswahl um Auto erweitert; folgt der Betriebssystemeinstellung und reagiert live auf Systemwechsel.
- Bestehende Hell-/Dunkel-Auswahl bleibt gespeichert und kompatibel.

# v0.7.41

- Vollständiger TypeScript- und Worker-Check; ungenutzte Imports, Variablen und Hilfsfunktionen entfernt.
- `noUnusedLocals` und `noUnusedParameters` als dauerhafte Build-Prüfungen aktiviert.
- Versionsnummer zentral aus `package.json` synchronisiert (`src/version.ts`, `public/version.json`, Worker), um erneute Updater-Abweichungen zu verhindern.
- Überdimensioniertes Logo von 1672×941 auf 512×288 px reduziert; Darstellung bleibt bei maximal 42 px unverändert, Download- und Projektgröße sinken deutlich.
- Build-Abhängigkeit `@vitejs/plugin-react` korrekt in die Entwicklungsabhängigkeiten verschoben.
- Generierte lokale Build-Artefakte werden nicht mehr ausgeliefert. Keine Funktionsänderung am Worker.

## v0.7.40 – 2026-07-21

- Updater: lokale Laufzeitversion und veröffentlichte `version.json` werden wieder aus demselben Versionsstand erzeugt; die in v0.7.37 verbliebene interne Kennung v0.7.36 wurde korrigiert.
- Ensembles: P25–P75 besitzt in der Legende getrennte farbige Flächenfelder für Tmax und Tmin.

## v0.7.37 – 2026-07-21

- Ensembles: zusätzliches, etwas dunkleres P25–P75-Temperaturband für die Vorhersagetage 1–7; über die Legende ein- und ausblendbar.
- Ensemble-Aggregation liefert dafür gewichtete 25- und 75-Prozent-Quantile für Tagesminimum und Tagesmaximum.
- Kompositbild: aktive Layer (Niederschlag, 250-m-Radar, Satellit, Blitze und Modelllinienmodus) werden separat und dauerhaft im Browser gespeichert und beim nächsten Öffnen wiederhergestellt.
- Worker: keine funktionale Änderung; nur einheitliche Versionsanhebung.

# Changelog

## v0.7.37 — Meteogramm-Datenkonsistenz, exportfeste Linien und kompaktere Mobilkarten

- Fehlende API-Werte werden nicht mehr irrtümlich als `0` interpretiert; die Meteogrammzeitachse endet am letzten zusammenhängenden Boden- und Druckniveau-Datensatz.
- Best Match verwendet für das Druckniveau-Meteogramm eine durchgängige ECMWF-IFS-HRES-Zeitreihe, statt nach kurzer Regionalmodelllaufzeit leere Profilfelder zu erzeugen.
- Linien, Niederschlagsbalken, Schneehöhenkurve und Niederschlagsfarben werden im SVG direkt gesetzt und bleiben dadurch auch im iOS-PNG-Export sichtbar.
- QFF-Achsenwerte werden ohne Tausenderpunkt ausgegeben; die Schneehöhenachse entfällt vollständig, wenn keine messbare Schneehöhe vorliegt.
- Tagesbezeichnungen werden über dem jeweiligen Tagesabschnitt zentriert und überlappen am ersten unvollständigen Tag nicht mehr.
- Mobile 7-Tage-Kacheln enthalten unverändert alle Angaben, benötigen durch kleinere Abstände, kompaktere Typografie und eine flachere Temperaturzeile aber deutlich weniger Höhe.
- NOAA GFS für Druckniveauprofile auf die druckniveaugeeignete 0,25°-Variante vereinheitlicht.

## v0.7.35 — stabiler Meteogramm-Export, echte Tooltips und feste Satellitenstände

- Meteogramm-Export erzeugt nur noch eine PNG-Datei und sperrt Mehrfachauslösungen.
- Export verwendet `toBlob`, einen festen 1120-px-Arbeitsbereich, ein kompaktes Layout und blendet unsichtbare Interaktionsflächen aus.
- Diagramme besitzen sichtbare Hover-/Touch-Tooltips mit Zeit, Niveau und Messwerten.
- Modellabhängige Meteogramm-Laufzeiten werden bereits im Worker angefordert und im Frontend zusätzlich begrenzt.
- Satellitenraster werden während des Zoomens ausgeblendet und danach mit neuem Cache-Schlüssel vollständig geladen.

## v0.7.34 — Kompositkarte und Meteogramm-Feinschliff

- Aktivieren der Modelllinien verändert den Kartenausschnitt nicht mehr.
- Bodendruckzentren werden aus dem Modellfeld erkannt und als H beziehungsweise T mit Druckwert markiert.
- Satelliten-, Radar- und Blitzraster werden nach Zoomwechsel mit eindeutigem Layerstand neu aufgebaut; zeitlose Satellitenlayer werden, sofern möglich, auf den letzten exakten Produktzeitpunkt fixiert.
- Meteogramm-Isolinien dürfen wieder regulär am Diagrammrand oder an Datenlücken enden.
- Relative Feuchte farblich von trockenem Gelb bis feuchtem Grün abgestuft.
- Horizontale Hilfslinien auf sämtlichen Druckniveaus, Hauptflächen stärker hervorgehoben.
- Schneehöhenachse zeigt bei kleinen Werten passende Dezimalstellen statt gerundeter Doppelwerte.
- Worker funktional erweitert: Druckzentren und fixer letzter Satellitenzeitpunkt.

## v0.7.33 — Meteogramm-Konturen, Windfiedern und Download

- Unvollständige Isolinien an internen Datenlücken wurden verworfen; Konturen auf den Datenbereich begrenzt.
- Horizontale Hilfslinien auf ausgewählten Hauptdruckflächen.
- Relative Feuchte mit Isolinien im 20-Prozentpunkte-Raster.
- WMO-Windfiedern zur Herkunftsrichtung verlängert und Windstille als Kreis dargestellt.
- Tooltips für Profil-, Linien-, Niederschlags- und Risikodiagramme erweitert.
- Download mit „Speichern unter…“, System-Freigabe oder Browser-Fallback.
- Worker funktional unverändert; nur Versionsanhebung.


## v0.7.32 — Updater- und Modelllinien-Korrektur

- Zentrale Versionskonstante für App, Zusatzmodul und Meteogramm; der Updater vergleicht nicht mehr irrtümlich die aktuelle Veröffentlichung mit einer veralteten internen Versionsnummer.
- Modelllinien: ungültigen Parameter `elevation=nan` entfernt.
- Modelllinien-Raster weiterhin in kurzen Zeilenabfragen; maximal vier parallele Abrufe.
- Europa: ICON-EU bleibt erste Wahl, bei unvollständiger Modellabdeckung automatischer einheitlicher Fallback auf ICON Global.
- Nordamerika verwendet für Druckniveaukarten GFS 0,25° statt des Modells ohne benötigte Druckniveauvariablen.
- Upstream-Fehlermeldungen werden konkret ausgewertet statt nur als pauschales HTTP 400 angezeigt.

## 0.7.31

- Meteogrammprofile und optionale Risikoebenen vertikal gedreht: hohe Atmosphäre oben, Boden bzw. bodennahe Druckflächen unten
- Wind- und Böenachsen beginnen zwingend bei 0 kt; eingehende Windwerte werden defensiv auf nichtnegative Werte begrenzt
- Windpfeile für helle und dunkle Ansicht mit kontrastreicher Kontur neu gezeichnet
- Cloudflare Worker funktional unverändert, nur einheitliche Versionsanhebung

## 0.7.29

- Modelllinien auf großräumige, ortsabhängige Kartenausschnitte erweitert; für Standorte in Deutschland wird der europäische ICON-EU-Ausschnitt verwendet
- Konturen bilinear verdichtet, zu durchgehenden Pfaden verbunden und geglättet
- Isobarenabstand dynamisch auf 1, 2 oder 4 hPa nach dem Druckgradienten angepasst; Ziel ist eine auch bei schwachen Gradienten erkennbare Liniendichte von ungefähr 100 km
- 500-hPa-Isohypsen auf den meteorologischen Abstand von 8 gpdm umgestellt
- Konturbeschriftungen vergrößert, kontrastreicher gestaltet und entlang langer Linien wiederholt
- EuCom als DWD-Flugwetterprodukt geprüft; mangels öffentlicher, lizenzierter Abrufschnittstelle nicht in den öffentlichen Worker integriert

## v0.7.29

- neue, beim Start geschlossene Kachel „Meteogramm“ unmittelbar vor dem Widget-/PNG-Generator
- Modellauswahl mit Best Match sowie ausgewählten regionalen und globalen deterministischen Modellen
- siebentägiges beziehungsweise auf die verfügbare Modelllaufzeit begrenztes Vertikalprofil von Stationsniveau bis 300 hPa
- relative Feuchte als Höhen-Zeit-Querschnitt sowie kombinierte Temperatur-/Winddarstellung mit Richtungspfeilen
- zusätzliche Zeitreihen für 2-m- und 850-hPa-Temperatur, QFF, Wind/Böen sowie Niederschlag, Niederschlagsform und Schneehöhe
- optional einblendbare diagnostische Höhenbänder für Vereisung sowie Turbulenz/CAT; ausdrücklich nicht als amtliche Flugwetterprodukte gekennzeichnet
- Druckniveaus unterhalb des Geländes werden zeitabhängig ausgeblendet
- Meteogramm wird als eigener Lazy-Load-Chunk geladen; Modelldaten werden erst beim Öffnen der Kachel abgerufen und im Worker zwischengespeichert
- Cloudflare Worker um die Route `mode=meteogram` erweitert; Frontend und Worker einheitlich auf v0.7.29 angehoben

## v0.7.29

- Kompositfilm auf eine feste relative Achse von −1 Stunde bis +2 Stunden umgestellt; nicht vorhandene Layerstände werden weich ausgeblendet, reale benachbarte Frames überblendet.
- RainViewer-Metadaten über eine gecachte Workerroute angebunden; letzter realer Radarstand bleibt mit Zeitstempel sichtbar und wird ohne erfundene Zukunftsframes ausgefadet.
- Satelliten-Aktualitätsprüfung um einen Publikationspuffer erweitert; bis 150 Minuten Historie und verspätet veröffentlichte nominal ältere Bilder bleiben nutzbar.
- DWD-/MTG-LI-Blitzzeitachsen auf bis zu 130 Minuten Historie erweitert; Rasterfallback wird auch dann genutzt, wenn Punktdaten am ausgewählten historischen Zeitschritt fehlen.
- H-SAF-Satellitenniederschlagsrate als ergänzende Radarfläche integriert; automatischer MTG-H40B-Vorrang, sobald der Layer im öffentlichen EUMETView-WMS erscheint, mit MSG-H60B als aktuellem Fallback.
- Ortsabhängige Isobaren und 500-hPa-Isohypsen aus Open-Meteo Best Match ergänzt.
- Gemeinsame `CompositeTimeline`-Logik, Worker-Caching und Rendering von maximal zwei Blendframes reduzieren doppelte Berechnungen und Kartenlast.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.29 angehoben.

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
