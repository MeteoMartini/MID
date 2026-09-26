# MID v0.9.85.104

- Berg-/Wintersportwetter ist auf schmalen Smartphones kompakter und besser lesbar.
- Wochentage bleiben vollständig sichtbar; Schnee-, Sonnen- und Windwerte überlagern sich nicht mehr.
- Schneemengen werden einheitlich als „0 cm“, „<1 cm“ oder „–“ dargestellt.
- Aktuelle Bergwerte erscheinen als kompakte horizontale Instrumentleiste; die 7-Tage-Zeilen bleiben ohne horizontales Scrollen bedienbar.
- Die 3-Stunden-Detailansicht ist für kleine Displays neu ausbalanciert.

# MID v0.9.85.103

- Berg-/Wintersportwetter zeigt Tal-, Mittel- und Bergstation als klare Höhenwahl mit jeweils eigenen aktuellen Bedingungen.
- Die 7-Tage-Übersicht ist kompakt, standardmäßig geschlossen und pro Tag einzeln aufklappbar.
- Geöffnete Tage zeigen 3-stündliche Tag-/Nachtwerte mit MID-Piktogrammen, Wind/Böen sowie Niederschlags- und Schneemengen.
- Die Höhenprognose umfasst sieben Tage; fehlende Schneefalldaten werden nicht als 0 cm ausgegeben.

# MID v0.9.85.102

- „Heute“ bleibt nach dem Antippen zuverlässig im Kurzfristbereich und springt nicht mehr auf „Vorhersage“ zurück.
- Die Bottom-Bar bleibt auf Smartphone und Querformat mit den bestehenden Safe-Area- und Touchzielregeln responsiv.

# MID v0.9.85.101

- Aktuelles Wetter verwendet für Himmelszustand und großes Wettersymbol konsequent dieselbe aktuelle Bewölkungsquelle.
- Nachtstunden werden auch in den Skybars der 7- und 14-Tage-Tageszeilen dezent astronomisch markiert.
- Im Kartenbereich verdeckt der automatische App-Installationshinweis keine Karte oder Kartenbedienelemente mehr.

# MID v0.9.85.100

- Der aktive Bereich der mobilen Einstellungen bleibt auf kleinen Smartphones vollständig sichtbar.
- Die einzeilige Tab-Leiste führt den gewählten Bereich automatisch ins Sichtfeld und zeigt dezent weitere Inhalte links oder rechts an.
- Touchziele, Safe Areas und Light-/Dark-Darstellung wurden für 360×800 und 390×844 geprüft; Wetter- und Prognoselogik bleiben unverändert.

# MID v0.9.85.99

- Die Prognose-Zeithorizonte bleiben auf kleinen Smartphones und im schmalen Querformat nach dem Navigationssprung vollständig sichtbar.
- Die Horizontleiste überdeckt weder Prognosekopf noch erste Tageszeile und berücksichtigt die obere Safe Area.
- Wetterdaten, Modellfusion, Schwellen, Parameterfarben sowie die 7-/14-Tage-Fachlogik bleiben unverändert.

# MID v0.9.85.98

- Die 90‑Minuten‑Skybar unter „Heute / Ab jetzt“ kennzeichnet Nachtstunden jetzt genauso dezent wie die Skybar unter „Aktuell“.
- Die Nachtfläche wird minutengenau aus der gemeinsamen Sonnenauf‑/untergangslogik abgeleitet und liegt hinter den Wettersegmenten, sodass Niederschlags-, Bewölkungs- und Sonnenfarben unverändert lesbar bleiben.
- Übergänge an Sonnenaufgang und Sonnenuntergang blenden weich ein bzw. aus; vollständig nächtliche und teilweise nächtliche 90‑Minuten‑Fenster werden korrekt dargestellt.

# MID v0.9.85.97

- Forecasts für denselben Ort unterscheiden Cache-Stände jetzt zuverlässig nach Höhe und Ortszeitzone. Ein Wechsel zwischen Tal und Gipfel oder zwischen Zeitzonen kann deshalb keinen unpassenden alten Kernforecast mehr übernehmen.
- Direkte und Worker-basierte Kernprognosen verwenden dieselbe angeforderte Höhe und Zeitzone.
- Dialoge, Popover und Sheets besitzen eine gemeinsame Tastatur-Fokusführung: Tab bleibt in der geöffneten Ebene, Escape schließt nur die oberste Ebene und der Fokus kehrt anschließend zum auslösenden Bedienelement zurück.
- Tages- und Folgenachtlogik orientiert sich an lokalen Kalendertagen und realen Prognose-Epochen statt an einem festen UTC-Mittag; dies schützt insbesondere Mitternacht, Sommerzeitwechsel und weit von UTC entfernte Zeitzonen.

# MID v0.9.85.96

- Aktuelle METAR-Beobachtungen werden strikt vom nachfolgenden Trendteil getrennt. TEMPO-/BECMG-/FM-Angaben können dadurch kein aktuelles Wetterphänomen oder aktuelle Bewölkung mehr vortäuschen.
- Ein trockener METAR mit nachfolgendem `TEMPO SHRA` führt nicht mehr zu einem aktuellen Regenschauer in MID.
- Die 14-Tage-Ansicht ist auf Smartphones deutlich kompakter: pro Tag eine Tageszeile mit Datum, Wetter, Tmin/Tmax, genau einer Skybar, Niederschlag, Wind/Böen und Konfidenz.
- Sonnenscheindauer, Temperaturabweichung und erweiterte Konfidenz erscheinen nur noch nach Antippen des jeweiligen Tages; eine zweite Skybar entfällt.

# MID v0.9.85.95

- Gewitterhinweise zeigen diagnostische Modellwerte durchgehend als Signalstärke und nicht mehr als scheinbar kalibrierte Prozentwahrscheinlichkeit.
- Die Kurzfristdiagnose respektiert die native zeitliche Auflösung der DWD-RUC-Parameter: 15-minütige ML-CAPE/CIN-Werte und stündliche MU-CAPE/CIN-Werte werden nur zeitlich passend kombiniert.
- Die Skybar trennt Sonnenscheindauer und Gesamtbewölkung fachlich sauber. Wolkenlücken werden nicht mehr als Sonnenscheindauer ausgegeben.
- Ensembleinformationen berücksichtigen die native Zeitauflösung der Modelle. WeatherNext 2 bleibt für Tages- und Szenarioaussagen erhalten, wird aber nicht für überpräzise stündliche Warn-/Ereignisaussagen verwendet.
- Zusätzliche Performance-Grenzen schützen große Karten-, Radar-, Ensemble- und Vendor-Module vor schleichendem Wachstum.

# MID v0.9.85.94

- MID behandelt die native Zeitauflösung von ICON-D2-RUC jetzt eindeutig und nachvollziehbar: 5-Minuten-Niederschlag, 15-Minuten-Felder nur dort, wo der DWD sie tatsächlich so liefert, und stündliche Felder bleiben stündlich.
- CAPE_MU und CIN_MU werden nicht mehr fälschlich als 15-Minuten-Rapidfelder angefordert. Dadurch sinkt unnötiger RUC-Aufwand und die Datenherkunft bleibt fachlich korrekt.
- Gewitter-Mehrparameterdiagnosen werden nicht mehr wie kalibrierte Prozentwahrscheinlichkeiten dargestellt. Sichtbar ist jetzt eine klar bezeichnete Signalstärke; amtliche und echte probabilistische Angaben bleiben davon getrennt.
- Trockene Wetterpiktogramme werden zusätzlich gegen die finalisierte Gesamtbewölkung plausibilisiert, damit „stark bewölkt“, „bedeckt“, Skybar und Symbolik nicht durch einen zu groben Wettercode auseinanderlaufen.
- Radar-, Gewitter- und Starkregen-Aktualisierungen teilen sich einen gemeinsamen Vordergrund-Refresh-Broker. Fokus-, Sichtbarkeits- und Online-Wechsel lösen dadurch weniger doppelte Arbeit aus.
- Identische gleichzeitige Worker-Abfragen ohne eigenen Abbruchkontext werden zusammengeführt, bevor der gemeinsame Cache greift.
- Ein automatisches Bundle-Budget schützt den bereits großen Haupt-JavaScript- und Haupt-CSS-Pfad vor weiterem unbeabsichtigtem Wachstum. Eine tiefere CSS-Konsolidierung bleibt dadurch messbar und regressionsgeschützt.

# MID v0.9.85.93

- Die 14-Tage-Ansicht bleibt eine vertikale Liste aus 14 Tageskarten; der bisherige horizontale Karten-Scroll auf Smartphone und Tablet entfällt.
- Innerhalb jeder Tageskarte passt sich die Informationsanordnung nun fluid an: eine Spalte auf Smartphones, zwei auf Tablets und vier auf Desktop.
- Wochentag, Datum und Wetterbeschreibung werden nicht mehr zeichenweise gequetscht; Temperaturfaden, Skybar, Niederschlag, Wind/Böen und Sonnenscheindauer nutzen die verfügbare Breite.
- Jede Tageskarte behält eine sichtbare Details-Steuerung.
- Geöffnete Tagesdetails enthalten zusätzlich eine interaktive „Skybar · 24 Einzelstunden“ mit 00–23 Lokalzeit, auswählbaren Stunden und Wetterinformation zur gewählten Stunde.
- 7-/14-Tage-Datenlogik, Ensemble-/Konfidenzberechnung, Warnlogik und meteorologische Schwellen bleiben unverändert.
- Der Replit-Stand wurde dort bereits für Mobil, Tablet und Desktop sowie Light/Dark, Overflow, Tagesdetails und Bottom-Bar-Abstand geprüft; eine zusätzliche MID-Regression schützt den übernommenen Vertrag.

# MID v0.9.85.92

- Nebel wird in der Vorhersage und im aktuellen Wetter grundsätzlich nur noch bei einer Sichtweite unter 1.000 m angezeigt.
- Sichtweiten von 1 bis 8 km werden bei feuchter Luft als feuchter Dunst, Sichtweiten von 1 bis 5 km bei trockener Luft als trockener Dunst unterschieden.
- Bodennebel, Nebelbänke, partieller Nebel und Nebel in der Umgebung werden nur übernommen, wenn eine geeignete vertrauenswürdige lokale Wetterbeobachtung dies ausdrücklich meldet.
- Ein Modell-Nebelcode kann eine belastbare Sichtweite über 1.000 m nicht mehr überstimmen.
- Temperaturen unter 0 °C machen aus normalem Nebel nicht automatisch Reif- oder gefrierenden Nebel.
- Aktuelles Wetter, Kurzfrist, 24-Stunden-Profil und die daraus abgeleiteten Tagesansichten verwenden denselben Sicht- und Nebelvertrag.
- Der Hinweisbereich heißt nun neutral „Sichttrübung“ und unterscheidet vorhandenen Dunst/Nebel von einem erst prognostizierten Nebelrisiko.

# MID v0.9.85.91

- Die 14-Tage-Ansicht bleibt auf Smartphones lesbar: Tageskarten haben wieder eine stabile Breite und lassen sich horizontal durchblättern.
- „Klima“ hat in Menüs und Navigation wieder ein eindeutiges, einheitliches Symbol.
- Die amtliche DWD-Bodenanalyse ist im Kartenbereich unter „Synoptik · DWD-Bodenanalyse“ direkt auffindbar und klar von Modellkarten getrennt.
- Für Favoriten mit aktiviertem Berg- oder Wasserprofil erscheinen dezente Direktzugänge am Ortsbereich.
- Die mobile Einstellungsnavigation ist kompakter. Helles und dunkles MID-Logo werden in passenden Vorschauflächen sichtbar unterschieden.
- Darstellung, Wetterdarstellung, Inhalte & Navigation sowie Einheiten & Zeit zeigen wieder jeweils die zugehörigen Einstellungen.
- Die wirkungslosen Auswahlmöglichkeiten „Klassisch“, „Cockpit · Register“ und „Cockpit · Ribbons“ wurden entfernt; die aktuelle Vorhersageansicht bleibt eindeutig.

# MID v0.9.85.90

- Das Menü „Mehr“ ist jetzt nach Aufgaben geordnet und zeigt keine doppelten oder missverständlich mehrfach einsortierten Bereiche mehr.
- 14-Tage-Prognose und Ensemble bleiben gemeinsam im Vorhersagebereich; Wetter- und Modellkarten sind im Kartenbereich gebündelt.
- Die Einstellungen sind klarer nach Darstellung, Wetterdarstellung, Navigation, Einheiten, Orten, Benachrichtigungen, Datenqualität, Synchronisation und System gegliedert.
- Zentrale Wetter- und Warnbereiche bleiben zuverlässig erreichbar und können nicht versehentlich aus der Kernnavigation entfernt werden.
- Warnlage und Benachrichtigungen, Prognosekonfidenz und Gefahr sowie lokale Korrektur und Datenquelle sind klarer voneinander getrennt. Die missverständliche Rot-/Gelb-/Grün-Auswahl für Prognosekonfidenz entfällt.
- „Mehr“ und Einstellungen wurden für Smartphone, Tablet im Hoch- und Querformat sowie Desktop mit sicheren Abständen, kontrolliertem Scrollen und stabilen Bedienelementen abgesichert.

# MID v0.9.85.89

- Die 7-Tage-Prognose ist auf Desktop wieder als kompakte, untereinander angeordnete Tagesliste aufgebaut; der große ungenutzte Leerbereich entfällt.
- Die ausgewählte Tagesansicht erscheint nach allen sieben Tageszeilen als gemeinsame Detailfläche und verdrängt die übrigen Tage nicht mehr.
- Meteogramm-, Wasser- und Gezeitenflächen bleiben auf Smartphone, Tablet und Desktop innerhalb des Viewports; notwendige Tabellen-/Zeitachsenbereiche scrollen nur lokal.
- Touchziele, Umbrüche und Querformatdarstellung wurden für die H-Responsive-Abnahme zusätzlich abgesichert.

# MID v0.9.85.88

- Ensemble-Ansichten sind ruhiger aufgebaut; Legenden und Tooltips bleiben auch auf kleinen Displays vollständig lesbar.
- Die 14 Ensemble-Tage besitzen weiterhin individuelle Tagesinformationen zu Temperatur, Niederschlag sowie Wind/Böen; die Darstellung wurde responsiv abgesichert.
- Die Klimaansicht ordnet ihre Kennwerte auf Smartphone, Tablet und Desktop klarer und ohne unnötiges horizontales Scrollen.
- Widget-Einstellungen und Exportflächen sind kompakter, besser lesbar und behalten die bestehenden Light-/Dark- und Exportvarianten.

# MID v0.9.85.87

- Die 14-Tage-Prognose ist auf Smartphones luftiger aufgebaut: Tag, Datum und Wetterzustand erhalten mehr Platz und werden nicht mehr durch die Konfidenzanzeige zusammengedrückt.
- Die Konfidenzpille bleibt vollständig lesbar und klar als sekundäre Information getrennt.
- Wesentliche Wettertexte dürfen umbrechen statt abgeschnitten zu werden; horizontales Scrollen der Tageszeilen bleibt ausgeschlossen.
- Ensemble-, Konfidenz-, Wetter-, Skybar- und Tagesdatenlogik bleiben unverändert.

# MID v0.9.85.86

- Die Heute-Ansicht erzeugt auf Smartphones keinen zusätzlichen horizontalen Außen-Scrollbereich mehr.
- Das 24-h-Wetterprofil passt im Hochformat vollständig in die verfügbare Breite und muss nicht mehr horizontal verschoben werden.
- Die untere Zeitachse mit ihren Beschriftungen bleibt im Hoch- und Querformat vollständig sichtbar.
- Bottom Bar und Safe Areas überdecken das Wetterprofil nicht.

# MID v0.9.85.85

- Unter „Aktuell“ zeigt Wind/Böen nun denselben klaren Windrichtungspfeil wie die Detailansicht unter „Mehr“.
- Die +12-h-Temperaturdifferenz ist auf Desktop, Tablet und Smartphone räumlich klar vom Titel getrennt und bleibt in Hoch-/Querformat sowie Light/Dark gut lesbar.
- Das 24-h-Wetterprofil verwendet nur noch die stündliche Darstellung; die separate 3-h-Ansicht wurde entfernt. Auf schmalen Smartphones bleibt das Diagramm durch eine ausreichend breite, horizontal bedienbare Profilfläche lesbar.
- Die aktiven Prognosezeiträume „7 T“ und „14 T“ bleiben auf Desktop sichtbar. Die 7-Tage-Zeilen wurden gegen Überlagerungen und ineinander verschobene Inhalte stabilisiert.
- In der 14-Tage-Ansicht entfällt die gedoppelte zweite „24-Stunden-Wetter“-Zeile; die vorhandene Skybar bleibt die einzige Stundenübersicht.
- Konfidenz-Pillen erhalten mehr Mindestbreite und Innenabstand. Der Hauptwert der Sonnenscheindauer wird ganzzahlig angezeigt; P10/P90- und weitere Spannendarstellungen behalten ihre nötige Dezimalgenauigkeit.
- Meteorologische Datenquellen, Warn-/Hazard-Logik, Skybar-Fachlogik, Temperaturfarben und die hyperlokal korrigierte +12-h-Temperaturreihe bleiben fachlich unverändert.

# MID v0.9.85.84

- **Arbeitspaket F:** Radar, Satellit, Komposit, Modellkarten und Synoptik arbeiten jetzt konsequenter map-first: Die Wetterkarte erhält deutlich mehr Raum, die Bedienung tritt optisch zurück.
- Radar, Satellit und Komposit verwenden eine einheitlichere Zeit- und Playback-Sprache. Bestätigte Zeitstände sowie die Trennung von Beobachtung, Nowcast und Modell bleiben unverändert.
- Deckkraftregler sind visuell vereinheitlicht; die vorhandenen Werte bleiben weiterhin getrennt je Layer beziehungsweise Kartenprodukt gespeichert.
- Die interaktive MID-Synoptik steht nun vor der amtlichen DWD-Referenzkarte. Das DWD-Original bleibt unverändert als klar gekennzeichnete Referenz erhalten.
- Smartphone, Tablet hoch/quer und Desktop wurden für Light/Dark, Safe Areas, Bottom Bar und Overlay-Grenzen optimiert.
- Meteorologische Datenquellen, Zeitauflösungen, Farbskalen, Isobaren/Isohypsen, Fronten, Warn-/Hazard-Logik sowie die unabhängige Skybar-/Stundenquadrat-Auswahl bleiben fachlich unverändert.

# MID v0.9.85.83

- **Arbeitspaket E:** Die 7- und 14-Tage-Prognose verwenden nun dieselbe ruhige Tageszeilen-Darstellung statt unterschiedlich aufgebauter Kartenbereiche.
- Pro Tag bleiben Wochentag/Datum, Wetterzeichen, Tmin/Tmax mit ECMWF-Farben, Wetterstreifen, Niederschlag sowie Wind/Böen direkt erfassbar.
- Nur der ausgewählte Tag öffnet sich unmittelbar unter seiner Zeile; alle übrigen Tage bleiben kompakt.
- Die 7-Tage-Stundenansicht besitzt keinen zusätzlichen unabhängigen Öffnungszustand mehr. In 14 Tagen ist die bisher getrennte Detailkarte der ausgewählten Tageszeile zugeordnet.
- Die bestehende Wetter-, Warn-, Ensemble-, Niederschlags-, Wind- und Skybar-Fachlogik sowie die Datenquellen bleiben unverändert.
- Smartphone, Tablet hoch/quer und Desktop verwenden dieselbe Informationsstruktur mit angepasster Anordnung; horizontales Seitenoverflow wird vermieden.

# MID v0.9.85.82

- **D.2-Korrektur:** Die sichtbare Temperaturdifferenz vergleicht wieder ausschließlich die hyperlokal korrigierte Temperatur der aktuellen **vollen Stunde** mit dem ebenfalls hyperlokal korrigierten Wert exakt **+12 volle Stunden** später.
- Minutengenaue Startpunkte und mehrphasige Trendtexte sind entfernt; angezeigt wird nur noch eine auf ganze Kelvin gerundete Differenz T(+12 h) − T(0 h).
- Die 12-h-Zeitachse startet mit der tatsächlichen vollen Uhrzeit statt mit einem missverständlichen „Jetzt“.
- Nachtstunden sind hinter Temperaturkurve, Skybar/Stundenquadraten und im 24-h-Profil etwas deutlicher markiert, bleiben aber transparent, theme-adaptiv und untergeordnet gegenüber den meteorologischen Farben.
- Stündliche Skybar-Auflösung, Niederschlags-/Bewölkungs-/Sonnenlogik und die gemeinsame Sonnengeometrie bleiben unverändert.
- Replit hat die Korrektur einschließlich Regressionen, Typecheck, Produktionsbuild sowie Light/Dark auf 360×800, 390×844, 430×932, 768×1024, 1024×768 und 1440×900 geprüft.

# MID v0.9.85.81

- **D.2:** Der 12-h-Temperaturtrend verwendet jetzt ausschließlich die bereits kanonisch lokal beziehungsweise hyperlokal angepasste Stundenreihe. Ein isolierter Messwert wird nicht mehr als Startwert in eine anders korrigierte Kurve gemischt.
- **D.2:** Wenn die Temperatur innerhalb des 12-h-Fensters ihre Richtung deutlich ändert, zeigt MID die Entwicklung in zwei Phasen, etwa zuerst Abkühlung und danach Erholung, statt nur Endwert minus Startwert.
- **D.2:** Nachtstunden werden in der Temperaturkurve und in der Skybar beziehungsweise den Stundenquadraten dezent über dieselbe minutengenaue Sonnengeometrie hinterlegt.
- Die Nachtkennzeichnung blendet an Sonnenuntergang und Sonnenaufgang weich ein beziehungsweise aus und bleibt in Light/Dark zurückhaltend.
- Stündliche Skybar-Auflösung, Wetterfarben, Niederschlagsphase/-intensität und die zentrale Sonne-/Bewölkung-/Niederschlagslogik bleiben unverändert.
- Replit hat D.2 einschließlich Light/Dark auf 360×800, 390×844, 430×932, 768×1024, 1024×768 und 1440×900 geprüft. Veröffentlichung und Stable-Promotion erfolgen ausschließlich durch ChatGPT.

# MID v0.9.85.80

- Das 24-h-Wetterprofil verwendet eine gemeinsame Zeitbasis für Temperatur, Skybar beziehungsweise Stundenquadrate, Niederschlag, Wind/Böen, Luftdruck, Wolken und Hazards.
- Senkrechte Hilfslinien bleiben stündlich; sichtbare Zeitangaben folgen einem ruhigen Drei-Stunden-Raster.
- Die wählbaren 24-Stundenquadrate liegen jetzt auf denselben realen Zeitpositionen wie die übrigen Profilspuren; Skybar und Quadrate verwenden weiterhin dieselbe fachliche Wetterlogik ohne Normalisierung.
- Die ausgewählte Stunde wird über alle Spuren synchron markiert. Der Niederschlag wird in den Einzeldaten zusätzlich als intervallbezogene Rate in mm/h angegeben.
- Fehlende Wolkenschichtwerte werden nicht mehr als 0 % beschrieben, sondern ausdrücklich als nicht verfügbar gekennzeichnet.
- Auf schmalen Smartphones scrollt nur die Diagrammfläche intern horizontal; die Seite selbst bleibt viewportfest. Tablet und Desktop nutzen weiterhin die verfügbare Breite.
- Wetterfachlogik, Datenquellen, Warnungen, Favoriten, RUC/Nowcast, Radar/Satellit/Komposit, Ensemble, Klima und Prognoseberechnung bleiben unverändert.
- Replit hat Arbeitspaket D umgesetzt und geprüft; Veröffentlichung und Stable-Promotion erfolgen ausschließlich durch ChatGPT.

# MID v0.9.85.79

- Der überflüssig gewordene Einstellungspunkt für die dauerhaft sichtbare Bottom-Bar wurde entfernt. Die fünf Hauptziele bleiben verbindlicher Bestandteil des neuen MID-Designs.
- Die Favoriten-Schnellleiste dient nur noch zur Ortsauswahl. Ihre Reihenfolge lässt sich ausschließlich im Einstellungsmenü „Favoriten verwalten“ ändern.
- Drag-Griffe und Reorder-Logik entfallen aus der Schnellleiste; dadurch werden Favoriten kompakter, bleiben einzeilig und scrollen auf schmalen Geräten intern horizontal.
- „Aktuelles Wetter“ wurde als zusammenhängende Atmosphärenkarte weiter verdichtet: Temperatur und Wetterzustand bilden die klare Hauptaussage, Kernparameter sind als ruhige Instrumentfläche angeordnet.
- Taupunkt ist in der Feuchtehierarchie primär; relative Feuchte bleibt sekundärer Kontext.
- Der Bereich „mehr“ ist als gemeinsame Informationsfläche mit feinen Trennlinien statt vieler gleichgewichtiger Einzelkacheln aufgebaut. Dadurch sinken Fragmentierung und mobiler Platzverbrauch.
- Wetterfachlogik, Datenquellen, Warnungen, RUC/Nowcast, Skybar/24-Stundenquadrate, Radar/Karten und Prognoseberechnung bleiben unverändert.
- Replit implementiert und prüft; Veröffentlichung und Stable-Promotion erfolgen ausschließlich durch ChatGPT.

# MID v0.9.85.78

- Die fünf mobilen Hauptziele **Aktuell, Heute, Vorhersage, Karten und Mehr** bleiben dauerhaft sichtbar; das frühere Scroll-Auto-Hide der Bottom-Bar entfällt.
- Navigation über die Bottom-Bar springt ohne verzögerten Smooth-Scroll direkt in den gewählten Arbeitsbereich.
- Bottom-Bar und Favoritenleiste verwenden nun dieselbe ruhige, schwebende MID-Materialität.
- Die Favoritenleiste bleibt einzeilig. Auf schmalen Geräten scrollt sie intern horizontal, statt Ortsnamen umzubrechen oder die Seite zu verbreitern.
- Der aktive Favorit wird dezent über Rand, Hintergrundton und Signaturkante markiert, nicht mehr über eine überstarke Vollfläche.
- Die mobile Safe-Area-Reserve wurde vereinheitlicht, damit Home-Indikator, Footer und Inhalte nicht doppelt Abstand reservieren oder sich überlagern.
- Die Umsetzung wurde in Replit vorbereitet und geprüft; Veröffentlichung, Deployment und Stable-Promotion erfolgen ausschließlich durch ChatGPT über den kanonischen Releasepfad.
- Wetter-, Warn-, RUC-/Nowcast-, Skybar-/24-Stundenquadrate-, Prognose- und Kartenfachlogik bleiben unverändert.

# MID v0.9.85.77

- Warnungen sind jetzt als ruhige, zeitlich sortierte Ereignis-Timeline aufgebaut: Eine „Jetzt“-Marke trennt den aktuellen Zeitpunkt klar von laufenden und kommenden Ereignissen.
- Amtliche Warnungen bleiben fachlich führend und vollständig abrufbar; MID-Prognosehinweise sind optisch und inhaltlich klar als Ergänzung gekennzeichnet.
- Abgelaufene Warnungen erscheinen nicht mehr als aktive Ereignisse. Aktive und kommende Meldungen werden nach ihrem Beginn sortiert.
- Die Warnstufe wird ausschließlich über den farbigen Warnmarker codiert; bloße Hinweise erhalten keine amtliche Warnfarbe.
- Eine Störung der amtlichen Quelle wird ausdrücklich als „Warnstatus nicht bestimmbar“ angezeigt und niemals als Entwarnung dargestellt.
- Soweit die amtliche Meldung eine Eintrittswahrscheinlichkeit liefert, wird sie direkt am Ereignis angezeigt.
- Warnungen sind aus dem Ortskopf direkt erreichbar; „Extremwetter“ besitzt im Warnbereich einen eigenen Einstieg.
- Die neue Warnansicht wurde für schmale und breite Smartphones, Tablet Hoch-/Querformat sowie Desktop in Hell und Dunkel geprüft.

# MID v0.9.85.76

- Ein reproduzierter Veröffentlichungs-Race ist behoben: Ein bereits laufender RUC-Pages-Lauf konnte nach einem neuen App-Deploy noch den älteren `mid-stable`-App-Shell zurück auf Pages schreiben.
- RUC prüft jetzt zusätzlich, ob `main` bereits eine neuere MID-Version als `mid-stable` trägt. In diesem Releasefenster wird der RUC-Publish sicher übersprungen und erst nach Stable-Promotion mit der neuen App-Version fortgesetzt.
- Die Prüfung erfolgt zweimal: beim Eintritt in den kurzen Pages-Publish-Lock und unmittelbar vor dem Upload. Dadurch kann auch ein während der RUC-Aufbereitung gestarteter MID-Release nicht mehr durch einen älteren App-Shell-Publish überschrieben werden.
- Auch der manuelle Stable-Pages-Deploy wird blockiert, solange `main` und `mid-stable` unterschiedliche MID-Versionen tragen.
- Die RUC-Datenlogik und Parameterpriorisierung bleiben unverändert.

# MID v0.9.85.75

- Das neue MID-Redesign ist jetzt die einzige produktive Gesamtoberfläche; die bisherige Auswahl zwischen „Design 2.0.1“ und „Klassisch“ wurde aus den Einstellungen entfernt.
- Alte lokal gespeicherte Designauswahlen werden beim Start bereinigt und können die App nicht mehr auf die frühere Gesamtansicht zurückschalten.
- Bottom-Navigation und moderner Forecast-Arbeitsraum sind damit appweit verbindlich.
- **Unverändert erhalten bleibt die fachliche Auswahl „Skybar ↔ 24 Stundenquadrate“.** Beide Varianten nutzen weiterhin dieselben Einzelstunden und dieselbe meteorologische Logik.
- Standard/Erweitert, Informationsdichte, Light/Dark und die übrigen fachlichen Anzeigeoptionen bleiben unabhängig davon erhalten.

# MID v0.9.85.74

- Der RUC-Pages-Fehler oberhalb der 950-MB-Sicherheitsgrenze ist behoben: Das kostenlose RUC-Profil erhält zusätzlich ein eigenes 900-MB-Datenbudget und stoppt Übergrößen künftig bereits vor Artefakt-Upload und Pages-Publish.
- Native 15-Minuten-Zustandsdaten werden auf **Sicht und Ceiling** konzentriert. Beide können sich bei Nebel/Stratus rasch ändern und profitieren meteorologisch von der höheren Kadenz.
- Nullgrad- und Schneefallgrenze bleiben stündlich; die eigentliche Niederschlagsphase (Regen/Schnee/Graupel) bleibt separat nativ 15-minütig. Dadurch geht keine relevante kurzfristige Phaseninformation verloren.
- Die drei 15-Minuten-Solarvollfelder werden im kostenlosen Produktionspfad nicht mehr geladen bzw. auf Pages publiziert, weil der sichtbare MID-Kurzfristpfad sie derzeit nicht konsumiert.
- Der reale DWD-RUC-Lauf zeigte Gesamt-/Schichtbewölkung, Temperatur, Druck und Wind für 0…+6 h weiterhin stündlich. MID behauptet dafür deshalb keine native 15-Minuten-Auflösung; die 15-Minuten-Anzeige interpoliert diese Zustände weiterhin transparent.
- Erwartete RUC-Pages-Größe sinkt anhand des fehlerhaften Laufs von rund 1.020 MB auf rund **884 MB**; zusammen mit dem aktuellen App-Build auf rund **897 MB**.
- Der CodeQL-Hinweis „Incomplete URL substring sanitization“ in einem reinen Dependency-Audit-Test wurde als Testmuster bereinigt; Produktions-URL-Validierung war davon nicht betroffen.

# MID v0.9.85.73

- Die operative RUC-Kurzfrist verwendet nun parameter-native Zeitauflösungen statt einer pauschalen Stundenauflösung.
- Niederschlag bleibt im RUC-Pfad 5-minütig. Für 0…+6 Stunden werden Temperatur, Taupunkt/Feuchte, Druck, Wind/Böen, Gesamt-/Schichtbewölkung, Sicht, Ceiling sowie weitere kurzfristig relevante Zustandsgrößen automatisch in nativer 15-Minuten-Auflösung übernommen, **wenn der jeweilige DWD-Lauf diese Folge vollständig bereitstellt**.
- Fehlt für einen Parameter eine vollständige native 15-Minuten-Folge, bleibt dessen bisheriger stündlicher Pfad aktiv. MID kennzeichnet stündliche Werte nicht künstlich als 15-Minuten-Daten.
- 90-Minuten-Karten, Wettertext, Piktogramme und Skybar greifen gemeinsam auf den finalisierten 15-Minuten-Zustand zurück. Damit kann insbesondere native RUC-Gesamtbewölkung direkt in die Skybar einfließen, sobald sie für den Lauf in 15-Minuten-Kadenz verfügbar ist.
- Radar/Nowcast und belastbare lokale Beobachtungen behalten in ihrem verlässlichen Zeitraum Vorrang; die RUC-Zustandsfelder ergänzen die kohärente Leitprognose mit abnehmendem Gewicht bis +6 h.
- Der stündliche RUC-Zustandsvektor bleibt als robuster Fallback und für den längeren Kurzfristbereich erhalten.

# MID v0.9.85.72

- Die 15-Minuten-Kurzfrist verwendet für trockene Wettertexte und Piktogramme jetzt dieselbe Gesamtbewölkung wie die Skybar. Eine dünne/mittlere graue Wolkenstufe kann dadurch nicht mehr gleichzeitig als „Bedeckt“ beschriftet werden.
- Gesamtbewölkung ist für die Himmelsklassifikation primär; tiefe Bewölkung dient nur als Fallback, wenn Gesamtbewölkung fehlt. „Bedeckt“ setzt bei trockener Lage mindestens 87,5 % Gesamtbewölkung voraus.
- Nebel- sowie Niederschlags-/Gewittercodes bleiben von der reinen Wolkenkorrektur fachlich getrennt.
- ICON-D2-RUC CLCT/CLCL fließen weiterhin in den kanonischen stündlichen Forecastkern ein. Die 15-Minuten-Skybar interpoliert diese Zustandsfelder; sie wird nicht fälschlich als native 15-Minuten-CLCT-Ausgabe bezeichnet.
- Ein eigener Regressionstest schützt die Kohärenz zwischen Skybar, Wettertext und Piktogramm.

# MID v0.9.85.71

- Lange Ortsnamen bleiben im modernen Kopf vollständig lesbar und werden nicht mehr mit einer Ellipse abgeschnitten.
- Ein erneutes Öffnen von „Heute“ über die Bottom-Bar startet zuverlässig am Kopf der Kurzfristansicht; frühere interne Scrollpositionen werden bei dieser expliziten Navigation nicht wiederhergestellt.
- Der moderne Radar-/Satellit-Arbeitsraum wurde weiter verdichtet: weniger Rahmenabstand, kompaktere Moduswahl und Timeline, mehr visuelles Gewicht für die eigentliche Karte.
- Die produktive Radar-, Satelliten-, Nowcast-, DWD- und Synoptiklogik bleibt unverändert. Die bereits vorhandene amtliche DWD-Bodenanalyse und die getrennte MID-Modellanalyse werden ausdrücklich nicht durch Replit-Demodaten ersetzt.
- Die Änderungen sind durch einen eigenen MID-18.2.1-Regressionstest geschützt und werden über den üblichen Source-PR-/Release-Gate-Pfad ausgeliefert.

# MID v0.9.85.70

- Die 14-Tage-Ensemble-Auswahl auf Smartphones wurde verdichtet: Temperatur, Niederschlag und Wind/Böen bleiben einzeilig, die Mini-Grafiken sind deutlich größer und der vertikale Leerraum wurde reduziert.
- Der Temperatur-Mini-Plot nutzt eine stärkere, weiterhin rein visuelle Skalierung der Abweichung zum Klimamittel; die Ensemble-Daten selbst bleiben unverändert.
- Das mobile Ensemble-Detailoverlay ordnet Sekundärangaben zweispaltig statt über eine extrem schmale Labelspalte an. Begriffe wie „Sonnenscheindauer“ und „Niederschlag“ werden nicht mehr unleserlich zerbrochen; das Overlay bleibt oberhalb der Bottom-Bar und kann bei Bedarf intern scrollen.
- Die Synoptik startet als Bodenanalyse nun mit Isobaren als Standard-Modelllinien. 500-hPa-Isohypsen bleiben optional zuschaltbar.
- Kaltfronten werden blau mit Dreiecken, Warmfronten rot mit Halbkreisen und Okklusionen violett mit alternierenden Symbolen auf derselben Seite dargestellt. Symbolabstände orientieren sich an der tatsächlichen Frontlänge statt an Rasterpunkten.
- Typisierte Fronten erhalten eine stärkere, aber halo-gestützte Linienführung; neutrale θe-850-Frontalzonen bleiben visuell nachgeordnet.
- Die bestehende Frontdiagnose, θe-850-Erkennung, Isobarenberechnung, Wetterdaten und Warnlogik wurden fachlich nicht verändert.
- Replit-Redesign wurde parallel für dieselben Ensemble-/Synoptik-Probleme und die vollständige Viewport-/Light-/Dark-Abnahme fortgesetzt.

# MID v0.9.85.69

- Der 14-Tage-/Ensemble-Block wurde nach dem mobilen Screenshot-Audit weiter poliert: Die Mini-Grafiken der Umschalter „Temperatur“, „Niederschlag“ und „Wind/Böen“ liegen auf Tablet/Smartphone jetzt in einer eigenen Zeile unter dem Text und können die Bezeichnungen nicht mehr überdecken.
- Ensemble-Legenden umbrechen innerhalb ihrer Fläche, statt rechts abgeschnitten oder in den Plot gedrückt zu werden.
- Beim Schließen eines Temperatur-, Niederschlags- oder Wind/Böen-Tooltips werden aktive Recharts-Interaktionsmarker ausdrücklich unterdrückt. Beim nächsten Tippen werden sie regulär neu aktiviert; es bleiben keine Auswahlpunkte aus dem vorherigen Overlay stehen.
- Nebenlinien wie ENS-Mittel und Klimamittel erzeugen keine zusätzlichen aktiven Punkte.
- Die fachliche Ensembleberechnung, P10–P90/P25–P75-Spannen, Best-Match-Werte, Sonnenscheinband und zeitliche Auflösung bleiben unverändert.
- Responsive Ziel: keine äußere horizontale Überbreite; dichte Metrikumschalter dürfen auf sehr schmalen Geräten ausschließlich innerhalb ihrer eigenen Leiste horizontal verschoben werden.

# MID v0.9.85.68

- Der MID-18.2-Abschluss für „Ab jetzt“, 90-Minuten-Vorhersage und 24-h-Wetterprofil wurde auf die gemeinsame professionelle MID-Flächenhierarchie gebracht.
- Status, 90-Minuten-Instrument, 24-h-Profil und kompakte 24-Stunden-Leiste bleiben vollständig erhalten, sind aber klarer voneinander gegliedert und können die Seite auf kleinen Displays nicht mehr horizontal verbreitern.
- Das 24-h-Profil hält Toolbar, Legende, Diagramm, Auswahlzustand und Einzeldaten auch auf schmalen Geräten innerhalb ihrer Instrumentfläche; lange Labels und Detailtexte dürfen umbrechen statt abgeschnitten zu werden.
- Mobile Safe-Area und Bottom-Bar-Abstand werden für die Kurzfrist- und Profilflächen verbindlich berücksichtigt.
- Sichtbare Preview-/Demo-/Mockup-Entwicklungsmarker sind im produktiven Wetter-/Forecastpfad nicht vorhanden.
- Replit-Abnahme: Wetter/Aktuell, Heute/24-h-Profil, Forecast, Radar/Karten, Warnungen, Wasser/Tide und Mehr auf 390×844, 430×932, 834×1112, 1112×834 und 1440×900 jeweils Light/Dark bestanden; Typecheck, Produktionsbuild und Diff-Prüfung grün.
- Keine Änderung an Wetterdaten-, RUC-, Warn-, Radar-, Nowcast-, Tide- oder Forecast-Fachlogik.

# MID v0.9.85.67

- Der in Replit vollständig abgenommene MID-18.2-Finish für Meteogramm, Warnungen, Wasser/Tide und „Mehr“ wurde in den kanonischen MID-Build übernommen.
- Meteogramm: Diagramme bleiben die dominante Instrumentfläche; dichte Zeitreihen scrollen ausschließlich innerhalb des Diagramms, Quellen- und Steuerbereiche bleiben vollständig lesbar.
- Warnungen: amtlicher Warnstatus bleibt visuell priorisiert; Ereignisspur, ergänzende MID-Hinweise, Herkunft und lange Texte können auf mobilen Geräten nicht mehr abgeschnitten oder in Ellipsen gedrückt werden.
- Wasser/Tide: Bewertung, Tide/Pegel, Wellen, Strömung und Wetterwerte bilden eine zusammenhängende responsive Instrumentfläche; dichte Matrizen scrollen nur intern.
- „Mehr“: Schnellzugriffe und Themenmodule sind als ruhige progressive Gruppen strukturiert; auf sehr schmalen Geräten wechselt die Schnellzugriffsebene in eine einspaltige Darstellung.
- Bottom-Bar-Safe-Area sowie Light/Dark bleiben geschützt.
- Replit-Abnahme: 390×844, 430×932, 834×1112, 1112×834 und 1440×900 jeweils in Light/Dark; Typecheck und Produktionsbuild erfolgreich.
- Keine Änderung an Warnlogik, Wetterdaten, Tide-/Wasserfachlogik, Forecast, Radar oder Nowcast.

# MID v0.9.85.66

- Der in Replit vollständig geprüfte MID-18.2-Redesign-Block für Vorhersage und Karten/Radar wurde in den kanonischen MID-Build übernommen.
- Die gemeinsame Desktop-Shell verwendet nun appweit eine maximale Breite von 1580 px; Prognose- und Kartenarbeitsräume folgen derselben Breiten- und Oberflächenlogik.
- Dichte 7-/14-Tage- und Kurzfrist-Zeitreihen bleiben vollständig erhalten und scrollen ausschließlich innerhalb ihrer Instrumentflächen, statt die gesamte Seite horizontal zu verbreitern.
- Karten/Radar erhalten denselben begrenzten Arbeitsraum; Layer-, Zeit-, Status- und Quellenbereiche bleiben funktional unverändert und können auf schmalen Displays nicht mehr die Seitenbreite sprengen.
- Bottom-Bar-Safe-Area und responsive Innenränder bleiben erhalten.
- Replit-Abnahme: 390×844, 430×932, 834×1112, 1112×834 und 1440×900 jeweils in Light/Dark; Typecheck und Produktionsbuild erfolgreich.
- Keine Änderung an Forecast-, Radar-, Nowcast-, Layer-, Warnungs- oder Wetterdatenlogik.

# MID v0.9.85.65

- Der mobile Bereich „Weitere aktuelle Werte“ wurde nach dem Screenshot-Audit neu verriegelt: Überschrift/Info-Schalter, Primärwert und Detailtext liegen nun in eindeutig getrennten Zeilen und können sich auf schmalen Smartphones nicht mehr überlagern.
- UVI und EU-AQI nutzen eine eigene vierzeilige Hierarchie aus Kopf, Bewertung, Skala und Detailwert; Sonnenschein sowie Sonne/Mond folgen derselben konsistenten Ordnung.
- Auf 391–620 px bleiben die kompakten Werte zweispaltig; bis 390 px wechselt der Bereich automatisch in eine einspaltige Darstellung, statt Inhalte zu quetschen.
- Sonne/Mond erhält größere, sauber ausgerichtete Auf-/Untergangswerte und eine lesbare Mondphasenzeile.
- Die Änderung ist auf den MID-Next-„Aktuell“-Mehrbereich begrenzt; Wetterlogik, RUC/Nowcast, Warnungen und Prognosedaten bleiben unverändert.
- Parallel wurde das professionelle Redesign im Replit-Projekt „MID Weather Intelligence“ mit Fokus auf dieselbe responsive Kartenhierarchie fortgesetzt.

# MID v0.9.85.64

- Die mobile Bottom-Bar startet ohne ausdrücklich gewählten Auto-Modus fixiert sichtbar. Im Auto-Modus blendet sie erst nach einer längeren Abwärtsbewegung aus und reagiert bereits auf einen kurzen Aufwärtsscroll wieder sichtbar.
- Taps auf die fünf Hauptziele wechseln den Arbeitsbereich unmittelbar statt mit verzögertem Smooth-Scroll.
- „Weitere aktuelle Werte“ ordnet auf Smartphonebreiten Beschriftung/Info-Schalter und Messwert in getrennten Zeilen an. Lange Werte wie Wind/Böen oder Luftdruck können dadurch keine Beschriftungen mehr überdecken.
- Der 12-h-Temperaturtrend besitzt eine besser erkennbare ECMWF-farbige Linie, ein dezentes farbiges Flächenband und ein klareres Hilfsraster – ohne zeitliche Glättung oder Resampling.
- Tmin und Tmax im Aktuell-Kopf verwenden jetzt jeweils die wertbasierte ECMWF-Temperaturfarbe des tatsächlichen Werts.
- Der ICON-D2-RUC-Kurzfristaudit bestätigt: CLCT/CLCL sowie verfügbare CLCM/CLCH/VIS/CEILING laufen bereits über die kanonische Forecast-Fusion in die Kurzfrist. Eine zweite RUC-Bewölkungsmischung wird deshalb bewusst vermieden; nativer 15-min-CEILING bleibt als gezielter +0…6-h-Ausbaukandidat dokumentiert.
- Wetterdaten-, Warnungs-, Niederschlags-, Skybar-, Nowcast- und 90-Minuten-Fachverträge bleiben unverändert.

# MID v0.9.85.63

- Warnungen, Extremwetter-Ausblick und Lüftungsassistent bleiben beim Öffnen im primären Bottom-Bar-Kontext „Aktuell“; „Mehr“ wird nicht mehr irreführend als aktives Hauptziel markiert.
- Die Warnlage bleibt direkt über den Ortskopf erreichbar und zusätzlich im „Mehr“-Bereich auffindbar.
- Der kanonische Navigationsvertrag benennt nun durchgängig exakt fünf Hauptziele; die widersprüchliche Formulierung „sechs Ziele“ ist korrigiert.
- Release-, PWA-, Worker- und iOS-Versionsmarker sind auf v0.9.85.63 synchronisiert. Wetterdaten, Skybar-, Niederschlags-, Warnfach-, Nowcast- und 90-Minuten-Logik bleiben unverändert.

# MID v0.9.85.62

- Der 12-h-Temperaturtrend und die darunterliegende Skybar/Stundenquadrate verwenden jetzt exakt dieselbe horizontale Zeitbasis und dieselben Plotränder.
- Die Temperaturkurve nutzt die bereits vorhandene ECMWF-inspirierte 2-m-Temperaturpalette: kühlere Werte erscheinen blau/türkis, milde gelblich und wärmere orange/rot – ohne eine zweite Farbskala einzuführen.
- Die bisher oval verzerrt wirkenden Start-/Endmarker („Linsen“) wurden im Aktuell-Trend entfernt. Sie hatten keine zusätzliche meteorologische Bedeutung.
- Die stündlichen Hilfslinien sowie die mindestens 3-stündlichen Zeitmarken bleiben erhalten und sind nun exakt zur Skybar ausgerichtet.
- Der in v0.9.85.61 korrigierte Footer-/Bottom-Bar-Abstand bleibt unverändert: Bottom-Bar-Clearance wird nur einmal reserviert.
- Skybar-/Stundenquadrate-, Niederschlags-, Warnungs- und 90-Minuten-Fachlogik bleiben unverändert.

# MID v0.9.85.61

- Der große Leerraum zwischen dem letzten Wetterinhalt und dem App-Footer auf Smartphones wurde entfernt. Die Bottom-Bar-/Safe-Area-Reserve wird nicht mehr gleichzeitig in mehreren Layout-Ebenen sichtbar addiert.
- Der letzte Inhaltsblock folgt dem Footer wieder mit normalem MID-Seitenabstand; der notwendige Sicherheitsraum für die feste Bottom-Bar liegt ausschließlich hinter dem Footer beziehungsweise als Scroll-Padding für Fokus- und Sprungziele.
- Quellen- und Aktualitätsangaben im Prognose-Footer können auf kleinen Bildschirmen vollständig umbrechen und werden nicht mehr als abgeschnittener Einzeiler dargestellt.
- Der globale Footer reagiert auf schmale Gerätebreiten mit einer ruhigeren mehrzeiligen Anordnung für Version, Impressum und Quellen.
- Wetterdaten, Warnlogik, Skybar/Stundenquadrate und die 90-Minuten-Regel bleiben fachlich unverändert.

# MID v0.9.85.60

- Der 12-h-Temperaturtrend unter „Aktuell“ besitzt jetzt stündliche vertikale Hilfslinien und beschriftete Hauptzeitpunkte mindestens alle drei Stunden. Sichtbare Temperatur- und Trendwerte werden ganzzahlig dargestellt.
- Der aufgeklappte „Mehr“-Bereich unter „Aktuell“ ist als kompakter, klar gegliederter Informationsbereich für Atmosphäre, Umwelt und Astronomie gestaltet. Einzelwerte, UVI, Luftqualität, Sonnenschein und Sonne/Mond erhalten konsistente Flächen, Abstände und Typografie statt einer großen grauen Restfläche.
- Der erste Prognose-Untertab heißt jetzt „Ab jetzt“ statt „Kurzfrist“. Damit bleibt die Bottom-Bar „Heute“ das übergeordnete Ziel, während „Ab jetzt“ eindeutig die 90-Minuten-/24-h-Linse bezeichnet.
- Skybar-/Stundenquadrate-, Niederschlags- und 90-Minuten-Verträge bleiben fachlich unverändert.

# MID v0.9.85.59

- Favoriten reagieren auf Smartphones jetzt zuverlässig mit einem einzelnen Tap. Horizontales Wischen zum Scrollen und Ziehen am separaten Griff bleiben davon getrennt; die gesamte Favoritenkarte ist ein ausreichend großes Touchziel.
- Das MID-Logo wird im App-Kopf ohne zusätzliche Hintergrundkachel oder Schatten transparent eingebettet. Auf schmalen Geräten erscheint nur das kompakte Logo, auf breiteren Flächen weiterhin die horizontale Logo-Variante aus dem LogoSet.
- Wetterquadrate sind in den kompakten 12-h- und 90-min-Bereichen deutlich größer und klarer erkennbar.
- Sonne und Bewölkung nutzen nun innerhalb der bestehenden Skybar-Stufen deutlich unterscheidbare Gelb-/Grautöne; Niederschlagsart und -intensität bleiben an die bestehende MID-/DWD-Skybar-Logik gekoppelt.
- Der bisherige kleine Punkt für klare Nacht wurde entfernt. Klare Nacht wird nun als ruhige Flächenzelle dargestellt, damit keine zusätzliche, unklare Punktkodierung entsteht.
- Die bestehenden Verträge zu Skybar/Stundenquadraten, Niederschlagsphasen und exakt sechs vollständigen 15-Minuten-Intervallen der 90-Minuten-Kurzfrist bleiben unverändert.

# MID v0.9.85.58

- Der 12-h-Temperaturtrend unter „Aktuell“ besitzt jetzt eine klar erkennbare Zeitachse mit einfachen Hilfslinien; der Wetterstreifen ist bewusst flacher und ordnet sich der Temperaturkurve unter.
- In der 90-Minuten-Kurzfrist teilen Wetterstreifen, 15-Minuten-Zeitachse und die sechs Zeitschritt-Felder denselben horizontalen Raster- und Scrollraum. Damit bleiben Zeitpositionen auch auf schmalen Smartphones exakt synchron.
- Die sieben Tagesfelder der 7-Tage-Prognose werden im Hochformat nicht mehr in sieben Mini-Spalten gequetscht, sondern als vollständige, lesbare Tageszeilen dargestellt.
- Die bestehende stündliche Skybar-/Stundenquadrate-Logik sowie die exakt sechs vollständigen 15-Minuten-Intervalle der Kurzfrist bleiben fachlich unverändert.

# MID v0.9.85.57

- Die 90-Minuten-Kurzfrist beginnt jetzt am nächsten runden 15-Minuten-Zeitpunkt und umfasst exakt sechs vollständige 15-Minuten-Intervalle. Ein zusätzlicher Endpunkt dient nur der zeitlichen Orientierung und fließt nicht als siebtes Intervall in die 90-Minuten-Bilanz ein.
- Die gewählte Stundenanzeige „Skybar“ oder „Stundenquadrate“ gilt nun auch im 12-h-Trend unter „Aktuell“, im 24-h-Wetterprofil, in der 7-Tage-Kurvenübersicht und in den einzelnen Tageskarten.
- In der 90-Minuten-Ansicht zeigt MID die Wetterzustandsentwicklung passend zur Auswahl als 15-Minuten-Wetterstreifen oder als sechs 15-Minuten-Quadrate. Sonne, Bewölkung sowie Niederschlagsart und -intensität stammen aus derselben MID-/DWD-Logik; eine zeitliche Normalisierung findet nicht statt.
- Ortszeit und Zeitzone bleiben auf schmalen Smartphone-Breiten zusammen, sodass z. B. „GMT+2“ nicht mehr isoliert in eine neue Zeile fällt.
- Stundenquadrate skalieren in längeren Mehrtagesansichten so, dass einzelne Zellen nicht überlappen; die reduzierte Wetterzustandsleiste bleibt auch auf schmalen Geräten kompakt.

# MID v0.9.85.56

- Der mobile Radar-Nowcast in „Aktuell“ wurde neu ausbalanciert: Beschreibungstexte werden nicht mehr abgeschnitten, die 5-Minuten-Grafik erhält deutlich mehr Höhe und Achsen-, Uhrzeit- sowie Quantilangaben kollidieren nicht mehr mit den Niederschlagsbalken.
- Das technische Nowcast-Detailfenster nutzt auf Smartphones die verfügbare Breite besser. Begriffe und Werte wie „Standorttreffer“, „Wachstum/Zerfall“ oder die Mengenbasis brechen nicht mehr mitten im Wort um.
- Schriftgrößen und Zeilenhöhen im Niederschlags-/Nowcast-Bereich wurden angehoben, ohne die Karte unnötig zu vergrößern.
- Unter Einstellungen gibt es neu „Stundenanzeige“ mit den Optionen „Skybar“ und „24 Stundenquadrate“. Die bisherige Skybar bleibt Standard.
- Die Stundenquadrate verwenden exakt dieselbe MID-/DWD-Logik für Sonne, Bewölkung, Niederschlagsphase und Intensität wie die Skybar. Jede verfügbare Einzelstunde bleibt eine eigene Zelle; es gibt keine Normalisierung oder Mehrstunden-Zusammenfassung.
- Die ausgewählte Stunde wird in der Quadratansicht klar markiert; Light und Dark verwenden kontrastangepasste Zellränder.
- Alle Schutzregeln aus v0.9.85.50–55 bleiben bestehen, insbesondere Taupunkt primär, Bottom-Bar/Safe-Area, Favoriten, kein horizontaler Overflow und die vollständige stündliche Wetterauflösung.
- Keine meteorologische Datenlogik, Warnsemantik oder Niederschlagsklassifikation wurde verändert.

# MID v0.9.85.55

- Die mobile Bottom-Bar erhält eine ruhigere optische Abschlusszone und mehr Scroll-/Inhaltsreserve, ohne ihre Position oder Funktion zu verändern.
- Auf schmalen Smartphones wirken lange Inhalte dadurch weniger so, als würden sie direkt unter der Navigation weiterlaufen.
- Gezeitenereignisse werden auf kleinen Phones als horizontale Snap-Reihe dargestellt statt als gedrängtes 2×2-Raster; Werte und Zeiten bleiben vollständig lesbar.
- Header und Favoritenleiste sind flacher und ruhiger gestaltet: weniger Schatten, keine starke äußere Karten-/Pillenfassung, dafür feine Trennlinien und eine dezente aktive Markierung.
- Ortsname, Suche, Favoriten-Vollständigkeit, Favoritenverwaltung und Bottom-Bar-Signatur bleiben unverändert funktionsfähig.
- Die Schutzregeln aus v0.9.85.50–54 bleiben bestehen: Niederschlagslesbarkeit, ruhiger mobiler Kartenhintergrund, Taupunkt primär, C9-Forecast-Scroll, kein horizontaler Overflow und 24-stündige nicht normalisierte Skybar.
- Keine meteorologische Datenlogik, Tide-Zeitskala oder Warnsemantik wurde verändert.

# MID v0.9.85.54

- Aktuell, Vorhersage und Tide/Wasser wurden optisch weiter an die ruhigere Hierarchie von Meteogramm, Radar und Warnungen angeglichen.
- In „Aktuell“ bleibt die Wetter-Hauptfläche klar dominant; die nachgelagerten Metriken wirken nun als flacher Instrumentstreifen statt als zweite große Karte.
- In der Vorhersage sind ausgewählter Tag, Zeitlupe und Quellen-/Diagnostikbereich als eingebettete Sekundärsektionen gestaltet und treten hinter den eigentlichen Forecast-Flow zurück.
- Im Wasser-/Tide-Bereich werden Pegel-, Messwert- und Metadatengruppen weiter entgewichtet; Gezeitenereignisse und Wasser-/Tide-Signal bleiben visuell führend.
- Auf Smartphone, Tablet und Desktop werden starke Zusatzkonturen, Schatten und übergroße Rundungen in diesen Sekundärbereichen reduziert, ohne Informationen auszublenden.
- Die Schutzregeln aus v0.9.85.50–53 bleiben bestehen: mobile Niederschlagslesbarkeit, ruhiger Kartenhintergrund, Bottom-Bar/Safe-Area, Taupunkt primär, Favoriten, kein horizontaler Overflow und 24-stündige nicht normalisierte Skybar.
- Keine meteorologische Datenlogik, fachliche Zeitskala oder Warnsemantik wurde verändert.

# MID v0.9.85.53

- App-weite Typografie überarbeitet: Mikrotexte in Labels, Quellenstatus, Warnzeitbahn, Wasser-/Meteogramm-Metadaten und Bedienelementen erhalten eine höhere, konsistente Lesbarkeitsbasis.
- Versalsatz und Zeichenabstände werden zurückgenommen, damit die Oberfläche weniger technisch und gedrängt wirkt.
- Wichtige Status- und Wetterinformationen dürfen auf schmalen Geräten umbrechen, statt durch Ellipsen oder weitere Schriftverkleinerung verloren zu gehen.
- Bedienelemente in Vorhersage, Radar/Karten, Meteogramm und Wasser erhalten einheitlichere Schriftgrößen und Zeilenhöhen.
- Auf Touch-Geräten verhindern die wichtigsten Select-Felder mit 16-px-Schrift das automatische Safari-Zoomen beim Fokussieren.
- Die Schutzregeln aus v0.9.85.50–52 bleiben bestehen: Niederschlagslesbarkeit, ruhiger mobiler Kartenhintergrund, Bottom-Bar/Safe-Area, Taupunkt primär, Favoriten, kein horizontaler Overflow und 24-stündige nicht normalisierte Skybar.
- Keine meteorologische Datenlogik, fachliche Zeitskala oder Warnsemantik wurde verändert.

# MID v0.9.85.52

- Mobile Bottom-Bar-Freistellung app-weit vereinheitlicht: Der letzte Inhalt bleibt in Aktuell, Vorhersage, Tide/Wasser, Meteogramm, Radar/Karten und Warnungen oberhalb der fixierten Navigation plus Safe-Area erreichbar.
- Die bestehende C9-Scrollarchitektur der Vorhersage bleibt unverändert; die neue Reserve wird außerhalb der gemessenen Forecast-Arbeitsfläche gesetzt.
- Quellen-, Modell- und Aktualitätsinformationen bleiben vollständig vorhanden, treten im Normalzustand aber sichtbar hinter das Wettersignal zurück. Begrenzte, ausstehende oder gestörte Quellenzustände bleiben ausdrücklich hervorgehoben.
- Sekundärflächen werden weiter entgewichtet: 24-h-Metriken, Forecast-Detail, Warnzeitbahn, Wasser-Messwertgruppen, Meteogramm-Nebenblöcke und Radar-Zusatzsteuerungen nutzen ruhigere Hintergründe und weniger dominante Konturen.
- Schutzregeln aus v0.9.85.50/51 bleiben bestehen: Niederschlagslesbarkeit, ruhiger mobiler Kartenhintergrund, Taupunkt primär, Favoriten, kein horizontaler Overflow und 24-stündige nicht normalisierte Skybar.
- Keine meteorologische Datenlogik, Warnsemantik oder fachliche Zeitskala wurde verändert.

# MID v0.9.85.51

- Der Redesign-Schwerpunkt liegt nun app-weit stärker auf einer klaren fachlichen Primärfläche statt auf vielen gleichgewichtigen Karten.
- Vorhersage: Horizontwahl kompakter, aktive Tages-/Zeitraumflächen deutlicher hervorgehoben, Kontext- und Quellenbereiche optisch nachgeordnet.
- Meteogramm: Diagramme erhalten mehr visuelles Gewicht; Steuerung, Datenquelle und einzelne Diagrammblöcke sind als zusammenhängender Analysebereich statt als Kartenstapel gestaltet.
- Radar/Karten: Die Karte wird deutlich als Hauptarbeitsfläche priorisiert; Schnellwahl, erweiterte Layersteuerung und Legende treten optisch zurück.
- Warnungen: Warnstatus und amtliche Warnungen stehen klar vor Zeitbahn und ergänzenden MID-Hinweisen; „Quelle nicht verfügbar“ bleibt sichtbar von „keine Warnung“ getrennt.
- Tide/Wasser: Eignung sowie Tide-/Wasserinformation werden priorisiert; die zahlreichen Messwertkarten werden zu ruhigeren Gruppen zusammengeführt.
- Die Schutzregeln aus v0.9.85.50 bleiben bestehen: mobile Niederschlagslesbarkeit, ruhiger Kartenhintergrund, Bottom-Bar/Safe-Area, Taupunkt primär, Favoriten, kein horizontaler Overflow und 24-stündige nicht normalisierte Skybar.
- Keine meteorologische Datenlogik, fachliche Zeitachse oder Warnsemantik wurde verändert.

# MID v0.9.85.50

- Die mobile Niederschlagsfläche in „Aktuell“ ist wieder vollständig und ruhig lesbar: Beschriftung und Hauptwert stehen klar getrennt, die Zusammenfassung erhält die volle verfügbare Breite und Quellen-/Detailtext wird nicht mehr abgeschnitten.
- Die bisherige enge 104-Pixel-Aufteilung des trockenen Niederschlagsstatus entfällt auf Smartphones; die Darstellung bleibt kompakt, ohne Text oder Werte zusammenzuquetschen.
- Die rein dekorative helle Ecke im oberen Bereich der aktuellen Wetterkarte wird auf Smartphones entfernt. Hinter Temperatur, Beschreibung und Messwerten liegt nun eine ruhige, kontrastreiche Fläche.
- Die 24-Stunden-Skybar bleibt vollständig stündlich und unverändert unnormalisiert. Bottom-Bar/Safe-Area, Favoriten sowie Taupunkt als primärer Feuchteparameter bleiben erhalten.
- Replit-Sichtprüfung: 390×844 und 430×932 jeweils Light/Dark sowie Tablet hoch/quer und Desktop bestanden.

# MID v0.9.85.49

- Die mobile Vorhersage erhält einen eigenen, sauber begrenzten Scrollbereich oberhalb der dauerhaft sichtbaren Bottom-Bar. Tageskarten und Detailinhalte werden dadurch nicht mehr von der Navigation überdeckt.
- Die verfügbare Höhe wird aus der tatsächlichen Position der Bottom-Bar berechnet und bei Größen- oder Layoutänderungen neu angepasst; iOS-Safe-Area und unterschiedliche Smartphone-Höhen werden berücksichtigt.
- Favoriten, Ortskopf und die bereits reparierte Niederschlagsdarstellung bleiben unverändert sichtbar; es entstehen keine zusätzlichen unbegründeten Leerflächen.
- Taupunkt bleibt der primäre Feuchteparameter, die relative Feuchte nachgeordnet. Die Skybar bleibt vollständig stündlich mit 24 Positionen und wird nicht normalisiert.
- Light/Dark und die bestehenden meteorologischen Datenpfade bleiben unverändert; die Korrektur betrifft die mobile Komposition und Scrollgrenze.

# MID v0.9.85.48

- MID-C9 schließt den Smartphone-Blocker aus Ortskopf und Nowcast: Standort und Warnlage konkurrieren nicht mehr mit der aktuellen Niederschlagsfläche um dieselbe Grid-Zeile; lange Ortsnamen bleiben horizontal lesbar.
- Favoriten bleiben auf schmalen Geräten vollständig horizontal erreichbar, während der Verwaltungszugang außerhalb der Scrollfläche sichtbar bleibt.
- Der echte Platzbedarf der schwebenden Bottom-Bar einschließlich iOS-Safe-Area wird reserviert. Inhalte, Skybar-Beschriftungen und Nowcast lassen sich dadurch vollständig oberhalb der Navigation erreichen, ohne horizontalen Seitenüberlauf.
- Taupunkt ist in der kompakten Hauptkarte eindeutig der Primärwert; die relative Feuchte bleibt als nachgeordnete Zusatzinformation erhalten.
- Die Änderung ist ausschließlich grafisch. MID verwendet unverändert seine kanonischen Echtzeit-, Nowcast- und Stundenreihen; Replit-Vorschauwerte wurden nicht übernommen.

# MID v0.9.85.47

## Design 2.0.1 · 12-h-Temperaturtrend wissenschaftlich nachgeschärft

- Die 12-h-Kurve unter „Aktuell“ ist nicht mehr nur beschriftet, sondern wird jetzt auch **skalentreu und zeitlich ehrlich** dargestellt.
- Der linke Punkt ist am tatsächlich angezeigten aktuellen Temperaturwert verankert; die weiteren Punkte bleiben die vorhandenen stündlichen MID-Prognosewerte.
- Zusätzlich wird die Temperaturänderung bis zum Ende des Fensters als Richtung und Delta in Kelvin angezeigt.
- Die Kurve verwendet mindestens **4 K Darstellungsbereich**. Kleine Änderungen von z. B. 0,5–1 K werden dadurch nicht mehr künstlich über die gesamte Diagrammhöhe aufgeblasen.
- Die gestrichelte Referenzlinie liegt auf dem aktuellen Temperaturwert statt auf einer bedeutungslosen geometrischen Mitte.
- Fehlende Stunden werden nicht mehr optisch überbrückt: Datenlücken unterbrechen die Linie, statt eine scheinbare Zwischenentwicklung zu erzeugen.
- Die 13 Stundenpositionen von jetzt bis +12 h bleiben erhalten; fehlende Werte werden nicht herausgefiltert und dadurch zeitlich zusammengeschoben.
- Taupunkt bleibt der primäre Feuchtewert, relative Luftfeuchte die sekundäre Zusatzinformation.
- Klassisch, Wetterlogik, Skybar, RUC/Nowcast, Warnungen und Datenquellen bleiben unverändert.

# MID v0.9.85.46

## Design 2.0.1 · kritischer iPhone-Pass und aussagekräftiger 12-h-Wetterfaden

- Der bisher nahezu dekorative 12-h-Temperaturfaden wurde fachlich und visuell aufgewertet: Er zeigt nun **Jetzt**, einen mittleren Zeitanker und das Ende des 12-Stunden-Fensters jeweils mit Temperaturwert.
- Das Fenster umfasst exakt **Jetzt bis +12 Stunden** und verwendet dafür 13 vorhandene stündliche Temperaturpunkte. Es werden keine Zwischenwerte erfunden oder zeitlich verschoben.
- Die markierte Messposition liegt jetzt korrekt am **aktuellen** Stundenwert; der frühere hervorgehobene Punkt am rechten Ende konnte fälschlich wie ein aktueller Messpunkt wirken.
- Zusätzlich werden Min/Max der nächsten 12 Stunden kompakt ausgewiesen; die Kurve bleibt bewusst schlicht und datengetreu.
- Taupunkt bleibt im Hauptbereich der primäre Feuchteparameter; relative Luftfeuchte ist die sekundäre Zusatzinformation.
- Trockene Kurzfristlagen werden als kompakte Statuszeile statt als zweite große Karte dargestellt.
- Die geöffneten Zusatzwerte wurden weiter verdichtet: UVI und Luftqualität erhalten kollisionsfreie volle Breite, Sonnenschein sowie Sonne/Mond sind kompakte Zeilen, Beschriftungen werden nicht mehr unnötig abgeschnitten.
- Der Warnstatus im Ortskopf wird auf kleinen Geräten vollständig im Viewport gehalten.
- Die Bottom-Bar blendet bei Abwärtsscrollen früher aus und erscheint erst nach einem deutlicheren Aufwärtsscrollen wieder, damit sie laufende Inhalte weniger verdeckt.
- Klassisch, Skybar, Warnlogik, Modellfusion, RUC/Nowcast und Datenquellen bleiben fachlich unverändert.

# MID v0.9.85.45

## Design 2.0.1 · iPhone-QA und Feinschliff „Aktuell“

- Die mobile Aktuell-Ansicht wurde anhand der realen iPhone-Darstellung erneut kritisch überarbeitet.
- **Taupunkt steht jetzt vor der relativen Luftfeuchte**: In den vier Kernwerten wird der Taupunkt in °C groß angezeigt, die Feuchte in % bleibt als Sekundärwert erhalten.
- Der Ortskopf wurde korrigiert: Der Warnstatus bleibt vollständig im Viewport und soll „Keine Warnung“ nicht mehr abschneiden.
- Die vier Kernwerte wurden auf normalen iPhones in eine kompakte Viererzeile verdichtet; nur auf sehr schmalen Geräten fällt MID auf 2×2 zurück.
- UVI und Luftqualität erhalten volle Breite, damit Einstufung, Info-Schaltfläche und Skalen nicht mehr miteinander kollidieren.
- Sonne/Mond und Sonnenscheindauer wurden als kompakte Zeilen neu gewichtet; der große blaugraue Leerraum der geöffneten Zusatzwerte entfällt.
- Sichtbare Info-Schaltflächen bleiben klein, die Touchfläche bleibt ausreichend groß.
- Der doppelte untere Sicherheitsabstand wurde entfernt; dadurch verschwindet der übergroße Leerraum zwischen Footer und Bottom-Bar. Die Navigation bleibt weiterhin safe-area-sicher.
- Klassisch, meteorologische Fachlogik, Warnschwellen, Modelle, Skybar und Datenquellen bleiben unverändert.

# MID v0.9.85.44

## Design 2.0.1 · mobile Aktuell-Ansicht deutlich nachpoliert

- Der erste produktive Design-2.0.1-Transfer wurde anhand der iPhone-Screenshots korrigiert: Die Aktuell-Ansicht ist jetzt als eine zusammenhängende Wetter-/Instrumentenfläche aufgebaut statt als große, fast leere Karte.
- Wetterpiktogramm, Temperatur, Wetterzustand, Tmin/Tmax und 12-h-Wetterfaden wurden enger und klarer hierarchisiert.
- Tmin/Tmax ist keine großflächige weiße Überlagerung mehr, sondern eine kompakte Inline-Angabe.
- Die vier unmittelbar sichtbaren Kernwerte sind wieder klar lesbar und in einer kompakten 2×2-Matrix angeordnet.
- Zusatzparameter wurden zu einem ruhigen Datenfeld verdichtet; sichtbare Info-Schaltflächen bleiben klein, besitzen auf Touch-Geräten aber weiterhin eine 44-px-Trefferfläche.
- Kopf, Suche und Favoritenleiste wurden mobil verkleinert und an die Materialität der Bottom-Bar angeglichen.
- Die Bottom-Bar wurde niedriger und leichter gestaltet; zugleich wurde der untere Inhaltsabstand vergrößert, damit abschließende Inhalte vollständig oberhalb der Navigation erreichbar bleiben.
- Eigene Regeln für schmale iPhones, Smartphone-Querformat und Tablet-Hochformat schützen die neue Komposition.
- Klassische Ansicht, Wetterlogik, Datenquellen, Warnschwellen und Modellfusion bleiben unverändert.

# MID v0.9.85.43

## Design 2.0.1 · Heute und 24-h-Wetterprofil

- „Heute“ erhält im neuen Designpfad eine zusammenhängende meteorologische Arbeitsfläche: 90-Minuten-Kontext oben, darunter das vollständige gleitende 24-h-Wetterprofil als dominantes Instrument.
- Das Profil läuft weiterhin exakt von jetzt bis +24 Stunden auf einer gemeinsamen Zeitachse für Wetter, Temperatur, Niederschlag, Wind/Böen, Luftdruck, Bewölkung, Sonnenereignisse und Einschränkungen.
- Die Skybar bleibt in jedem Darstellungsmodus **stündlich aufgelöst**. Die optionale 3-h-Ansicht verdichtet nur Kurven, Marker und Beschriftungen; die Skybar wird nicht gemittelt, interpoliert oder zeitlich verschoben.
- Legende, Zeit-Lupe/Einzeldaten und Signale wurden grafisch beruhigt und auf Mobil, Tablet hoch/quer und Desktop neu gewichtet.
- Die klassische Oberfläche und sämtliche meteorologischen Fachverträge bleiben unverändert.

# MID v0.9.85.42

## Design 2.0.1 · Aktuell, Kopf und Favoriten

- Die neue Oberfläche erhält einen deutlich kompakteren, professionellen Kopf mit responsivem Original-MID-Logo, ruhiger Suche und einer Favoritenleiste im gleichen Instrumentenstil.
- „Aktuell“ wird zu einer zusammenhängenden Wetterfläche: Wetterzeichen, Temperatur und Zustand stehen klar im Vordergrund; vier Kernwerte bleiben direkt sichtbar.
- Ein dezenter 12-Stunden-Temperaturfaden ergänzt die aktuelle Lage. Er verwendet ausschließlich die bereits vorhandenen stündlichen MID-Werte und verändert keine Prognosedaten.
- Niederschlags-/Gefahrenlage und Datenstatus bleiben in derselben Arbeitsfläche integriert; zusätzliche Messwerte werden als sekundäre Instrumentfläche dargestellt.
- Mobil, Tablet hoch/quer und Desktop erhalten eigene Anordnungen, ohne die klassische Oberfläche zu verändern.
- Meteorologische Logik, Warnschwellen, Skybar-Auflösung, Modellfusion und Datenquellen bleiben unverändert.

# MID v0.9.85.41

## Design 2.0.1 parallel zur klassischen Oberfläche

- MID besitzt jetzt zwei klar getrennte Darstellungswege: **Klassisch** behält die bisherige Dashboard-Struktur und Navigation, **Design 2.0.1** nutzt die neue responsive Arbeitsflächen- und Bottom-Navigation.
- Der Umschalter in den Einstellungen ändert nur Darstellung und Navigation. Ort, Favoriten, Wetterdaten und Fachlogik bleiben gemeinsam und werden nicht neu erfunden oder dupliziert.
- Die Redesign-Styles der bereits umgesetzten Arbeitsflächen sind auf Design 2.0.1 begrenzt, damit spätere grafische Änderungen die klassische Oberfläche nicht unbeabsichtigt verändern.
- Ohne bereits gespeicherte Auswahl startet MID vorerst sicher in **Klassisch**. Die neue Oberfläche kann jederzeit persistent gewählt werden.
- Meteorologische Logik, Skybar-Zeitauflösung, Warnschwellen, Modellfusion, Parameterfarben und Datenquellen bleiben fachlich unverändert.

# MID v0.9.85.40

## MID-C9 · Prognose- und Kartenflächen weiter poliert

- Die 7-Tage-Vorhersage bleibt auf Smartphones ein kompaktes horizontales Tagesband. Die frühere lange Einspaltenliste entfällt; Stundendetails öffnen weiterhin direkt im selben Arbeitsraum.
- Die Parameterwahl der 14-Tage-Ensembleansicht ist eine ruhige, zusammenhängende Instrumentleiste. Touch-Tooltips zeigen ihre vollständigen Werte mit größerer, lesbarer Schrift und sicherem Bildschirmrand.
- Karten-Layer bleiben auf kleinen Displays in einer horizontal bedienbaren Werkzeugleiste. Die Kartenhöhe passt sich in Hoch- und Querformat besser an, während Zeitachse, Legende und mindestens 44 px große Touchziele erreichbar bleiben.
- Wetterdaten, Ensemblewerte, Parameterfarben, Kartenebenen und die DWD-Georeferenzierung bleiben fachlich unverändert.

# MID v0.9.85.39

## MID-C9 · Mobile Layoutkorrektur nach Screenshots

- Aktuell: vier Kernparameter tatsächlich als 2×2-Raster; alte übergreifende Zellbelegungen zurückgesetzt. Wetterkopf, Quellenzeile und Niederschlagsinformation kompakter; doppelte Freifläche vor dem Footer reduziert.
- Kurzfrist: alle Zeitpunkte bleiben in genau einer horizontal scrollbareren Zeile. Die feste Sechs-Spalten-Begrenzung entfällt, auch der siebte Zeitpunkt bleibt oben.
- Favoriten: einzeilige Anordnung mit klarer Auswahl, separater Verwaltung und einmaliger Standard-Kennzeichnung; keine überlagerten Grid-Bereiche oder doppelte Abkürzung.
- Aktiver Kurzfrist-Schalter mit lesbarem Textkontrast. Wetterwerte, Quellen und Bedienfunktionen bleiben erhalten.

# MID v0.9.85.38

## MID-C9 · Einheitlicheres Design und ruhigere Bildsteuerung

- Die 90-Minuten-Vorschau bildet eine durchgehende Zeitleiste mit klar hervorgehobenem Zeitpunkt.
- Auf Tablets passen Seitenleiste und Inhaltsabstand zusammen; auf großen Bildschirmen sind die Navigationsziele wieder beschriftet. Lange Ortsnamen bleiben lesbar.
- „Mehr“ erhält übersichtliche Einstellungszeilen und einen beim Scrollen erreichbaren Kopf. Flächen und Abstände sind ruhiger und einheitlicher.
- Das DWD-Originalbild lässt sich in feineren Schritten von 50 bis 500 Prozent zoomen. Der betrachtete Ausschnitt bleibt beim Zoomen erhalten; „Standort“ und „100 %“ führen gezielt zurück.
- Verzögerte Zentrierungssprünge entfallen. Die eingebettete Originallegende wird nicht mehr durch allgemeine Bildgrößenregeln verkleinert.
- Wetterwerte, Warnschwellen, Parameterfarben und die bisherige geografische Bildkalibrierung bleiben unverändert.

# MID v0.9.85.37

## DWD Wolken/Niederschlagsart wieder standorttreu zentriert

- Der zoombare Ausschnitt des amtlichen DWD-Originalbilds wird nach Öffnen, Größenänderung und Bildladen wieder zuverlässig auf den tatsächlich gewählten Standort zentriert.
- Die seit v0.9.76.11 an 17 sichtbaren DWD-Stadtankern kalibrierte Georeferenzierung bleibt unverändert; korrigiert wurde die mobile Darstellungs- und Zentrierungslogik.
- Der Standortmarker besitzt jetzt einen eindeutigen exakten Ankerpunkt statt eines plattformabhängigen Emoji-Pins. Zusätzlich gibt es einen direkten „Standort“-Knopf zum erneuten Zentrieren, ohne den gewählten Zoom zu verlieren.
- Der Bildausschnitt wird während der Zentrierung nicht mehr durch eine Breitenanimation verschoben. Die Originallegende bleibt erhalten, nimmt auf kleinen Displays aber weniger Kartenfläche ein.

# MID v0.9.85.36

## Heute: 24-h-Diagramm wieder in passenden Proportionen

- Das 24-h-Wetterprofil war auf schmalen Smartphone-Displays zuletzt sichtbar zu hoch gestreckt. Die vertikale Diagrammgeometrie wird jetzt responsiv verdichtet, während alle Wetterspuren, Skalen, Zeitbezüge und Warnschwellen erhalten bleiben.
- Überschrift und Kurzfristtexte umbrechen wieder sauber statt am rechten Rand abgeschnitten zu werden. Der Zusatztext der 90-Minuten-Leiste entfällt auf sehr schmalen Displays, wenn er nur bereits sichtbare Informationen wiederholt.
- Das amtliche DWD-Originalprodukt bleibt vollständig verfügbar, startet in „Heute“ jetzt aber zuverlässig geschlossen und öffnet die große Bildfläche nur nach einer bewussten Nutzeraktion. Die Klappzeile bleibt auch im Dark Mode auf der regulären dunklen MID-Fläche statt in eine helle Ersatzfläche zu kippen.
- Smartphone, Tablet und Desktop verwenden weiterhin dieselben meteorologischen Daten und dieselbe 24-h-Zeitlogik; geändert wurden ausschließlich Proportionen, Textfluss und progressive Darstellung.

# MID v0.9.85.35

## Heute ruhiger und kompakter

- Das amtliche DWD-Bild „Wolken + Niederschlagsart“ bleibt vollständig verfügbar, öffnet sich in „Heute“ aber erst auf Wunsch. Dadurch dominiert das Originalbild nicht mehr den 24-Stunden-Verlauf und lädt erst beim Öffnen.
- Das 24-h-Wetterprofil benötigt auf Smartphones weniger Höhe oberhalb des Diagramms: Drucktrend und weitere Signale liegen kompakt in einer horizontalen Leiste; Auflösung, Legende und Info bleiben erreichbar.
- Breite Diagramme, Hilfetexte und das geöffnete DWD-Original bleiben an ihren eigenen Viewport gebunden. Die fachlichen Wetterspuren, DWD-Warnschwellen, Parameterfarben, Quellen und Zeitlogik wurden nicht verändert.

# MID v0.9.85.34

## Karten nutzen den Bildschirm als Arbeitsraum

- Radar, Satellit, Nowcast und Synoptik bekommen auf Smartphones, Tablets und Desktop deutlich mehr zusammenhängende Kartenfläche. Überschriften, Umschalter und Zeitleiste treten gegenüber der Karte zurück.
- Die Kartenzeit bleibt eine gemeinsame, durchgehende Steuerung. Beobachtungen, Nowcast und Modelltermine werden weiterhin fachlich getrennt gekennzeichnet, ohne zusätzliche doppelte Zeitauswahl.
- In den DWD-Wetterkarten bleiben nur Modell und Kartenprodukt direkt sichtbar. Druckfläche beziehungsweise Höhe, Kartenbasis, Deckkraft sowie Quellen- und Laufdetails sind bei Bedarf einklappbar erreichbar.
- Der Startbereich auf Smartphones ist nochmals verdichtet: Kopf, Suche, Favoriten, Ortskopf und aktuelle Kernwerte folgen jetzt tatsächlich der Redesign-Hierarchie statt von älteren Layoutregeln wieder vergrößert zu werden.
- Das Impressum bleibt auch im Smartphone-Hochformat vollständig innerhalb des Displays; der Schließen-Button bleibt jederzeit erreichbar.
- Zoombare DWD-Originalbilder und breite Diagramme dürfen nur noch innerhalb ihrer eigenen Darstellungsfläche wachsen oder scrollen und nicht mehr die gesamte App über den Displayrand hinaus verbreitern.
- Die gemeinsame Kartenzeitachse ist für einen späteren fachlich gekennzeichneten Übergang von echten Satellitenbeobachtungen zu modellbasierten Pseudo-Satellitenbildern vorbereitet. Solche Zukunftsbilder werden erst angezeigt, wenn dafür reale Modellprodukte angebunden sind; MID erzeugt keine künstlichen Zwischenbilder.
- Datenquellen, Modell-/Nowcastlogik, Warnregeln, meteorologische Ebenen und Farbcodierungen wurden dabei nicht verändert.

# MID v0.9.85.33

## Kompakter Startbereich auf Smartphones

- Ort und Warnstatus stehen wieder direkt vor dem aktuellen Wetter statt am Ende des Abschnitts.
- Der mobile Kopf ist deutlich kleiner und scrollt mit der Seite. Suche und Favoriten bleiben am Seitenanfang verfügbar, während die kompakte Bottom-Navigation dauerhaft erreichbar bleibt.
- „Mehr“ blendet ergänzende aktuelle Werte jetzt tatsächlich ein und aus. Geöffnete Zusatzwerte erscheinen als ruhige Detailliste statt als Kachelmatrix.
- Aktuelles Wetter, Radar-Nowcast und Quellenhinweis benötigen auf kleinen Displays weniger Höhe. Meteorologische Daten, Parameterfarben, Warnlogik und Quellenbewertung bleiben fachlich unverändert.

# MID v0.9.85.32

## Vorhersage als zusammenhängender Arbeitsraum

- Die 7-Tage-Vorhersage führt nun zuerst den Wetterverlauf; die Tage bilden darunter ein zusammenhängendes Band statt einzelner gleichgewichteter Karten.
- Stündliche Details erscheinen direkt beim gewählten Tag und bleiben Teil derselben Vorhersagefläche.
- Die 14-Tage-Ansicht bleibt ensemblegestützt, zeigt die Tage aber als fortlaufende Spalten. Unsicherheit, Modellkonsistenz, Wetterpiktogramme und Parameterfarben bleiben erhalten.
- Smartphone-, Querformat-, Tablet- und Desktopansichten wurden so abgestimmt, dass Auswahl, Texte und Detailbereiche ohne abgeschnittene Inhalte bedienbar bleiben.

# MID v0.9.85.31

## Heute als durchgehender 24-h-Wetterfaden

- Wetterfaden und 24-h-Zeitmatrix bilden eine zusammenhängende Wetterfläche.
- Einzelne Zeitpunkte zeigen zusätzliche Details erst nach Auswahl; auf Mobilgeräten bleibt die Detailansicht oberhalb der schwebenden Navigation.
- Nowcast-/RUC-Zeitlogik, DWD-Niederschlagsart, Warnungen, Wetterpiktogramme und Parameterfarben bleiben fachlich unverändert.

# MID v0.9.85.30

## Aktuell klarer gegliedert

- Der Ortsbereich ist nun ein kompakter Kontextkopf statt einer zusätzlichen Wetterkarte.
- Die aktuelle Wetterfläche bleibt die fachliche Primärdarstellung; doppelte Niederschlags- und Hazard-Angaben im Ortskopf wurden entfernt.
- Vier Kernparameter stehen sichtbar im Vordergrund. Ergänzende Messwerte bleiben erreichbar, wiederholen die Kernwerte aber nicht noch einmal gleichrangig.
- Mobile Safe-Areas, Bottom-Bar-Abstände, Suche und Favoriten wurden für die kompakte Darstellung weiter abgesichert.

# MID v0.9.85.29

## Durchgehender Kartenzeitraum

- Bestätigte Radar- und Satellitenbeobachtungen, amtliche Nowcast-Stände und vorhandene Modelltermine liegen auf einer durchgehenden Kartenzeitachse.
- Der Übergang zum Modell erfolgt ohne zusätzlichen Ansichtsschalter. Modelltermine werden eindeutig als solche gekennzeichnet.
- Radar, Satellit und Blitze enden an ihren echten Produktzeiten; MID erzeugt keine künstlichen Übergangsbilder.

# MID v0.9.85.28

## Sichtbarer Konzeptumbau

- Der Startbereich ist als zusammenhängende Wetterbühne aufgebaut: Ortslage, Wetterkern und Messwerte sind klar getrennte Ebenen statt einer Folge gleichrangiger Kacheln.
- Kopf, Ortsschnellzugriff und Navigation sind kompakter; die schwebende Bottom-Bar bleibt auf Mobilgeräten erreichbar.
- Kurzfrist, Vorhersage und Karten erscheinen als durchgehende Arbeitsflächen statt als gestapelte Einzelkarten.

# MID v0.9.85.27

## Navigation und Kurzfristdarstellung

- Die Bottom-Bar markiert immer genau einen Hauptbereich; „Heute“ und „Vorhersage“ können nicht gleichzeitig aktiv sein.
- Eine lokale Speicherquota wird datenerhaltend bereinigt, ohne technische Browsermeldungen zwischen Wetterinhalten anzuzeigen.
- Die Kurzfristdarstellung ist eine fortlaufende Zeitmatrix mit gemeinsamer Hierarchie für Zeit, Wetter, Temperatur, Niederschlag und Wind.

---

Der Changelog beschreibt bewusst die sichtbaren Änderungen für Anwendende. Meteorologische Fachlogik, Datenquellen und Warnschwellen werden nur genannt, wenn sie sich tatsächlich geändert haben.
