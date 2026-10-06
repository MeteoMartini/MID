# MID-C18 · Kartenlinien · v0.9.85.186

Verifizierte Basis main = mid-stable = c33588bd76a7a169cbaad0bf98539f3c99080471 (.185). Offene PRs 260/253/252 sind unabhängige Dependabot-Änderungen; keine parallele Kartenimplementierung offen. Die regulär veröffentlichten Paralleländerungen PR273–277 (.181–.185), einschließlich Widget-Renderer und Corporate-Safe-Same-Origin-Datenpfad, sind vollständig erhalten.

## Befund und fachlicher Vertrag

In der gemeinsamen Karte sind die alten RadarPanel-Modelllinien bewusst deaktiviert. Die neue Isobarenanzeige war an `active` gekoppelt, das ein erzeugtes Flächenraster verlangte. Native veröffentlichte Isobaren bestehen zudem aus gültigen Zwei-Punkt-Segmenten. Diese werden ausdrücklich als Linien akzeptiert und in GeoJSON nach Lon/Lat übertragen. Die alten Open-Meteo-Synoptikkonturen und groben Bildquellen werden nicht reaktiviert.

Darstellung ist separat Automatisch / Linien / Flächen. Automatisch bevorzugt Linien, sobald Radar oder Satellit aktiv ist. Explizit ausgewählte Flächen und bewusst deaktivierte Modell-Layer bleiben erhalten. Neue Einstellungen starten mit aktiviertem Bodendruck und Automatisch. Alte Einstellungen bekommen Automatisch; keine pauschale Umschreibung von Parametern oder Aktivierungen.

Native Isobaren aus demselben verifizierten Lauf und Termin benötigen kein Flächenraster mehr. Zusätzliche Isobaren anderer nativer Felder bleiben optional. Deckkraft wirkt auch auf Linien; Druckwert erscheint beim Antippen/Überfahren. Native Raster-/PNG-/SVG-Exporte bleiben in der Flächenansicht unverändert und werden dort angeboten, ohne eine Linienmontage vorzutäuschen.

DWD-WMS-Stile werden im Worker aus dem konkreten GetCapabilities-Layer gelesen. Nur ausgeschriebene Isolinien/Windfiedern werden als Linien angeboten. Druckflächenspezifische 250-/850-hPa-Wind-Isolinien werden nicht auf anderen Ebenen verwendet. Isolinien und EPS-Streuung sind fachlich getrennt. Ohne passenden Stil bleibt die Ebene leer mit Erklärung und Isobaren-Empfehlung; keine stille Fläche. Flächen verwenden bestätigte Isoarea-/LAWA-Stile; reine Linienprodukte werden nicht als Flächen ausgegeben.

## Quellenprüfung 06.10.2026

Direkt gelesen: https://maps.dwd.de/geoserver/ows?service=WMS&request=GetCapabilities&version=1.3.0

ICON/ICON-EU/AICON-Druck und ICON-/EPS-Geopotential bieten echte Isolinien. ICON-Höhen-/10-m-Wind bietet Windfiedern. EPS-Höhenwind-Isolinien sind auf 250 bzw. 850 hPa beschränkt. Temperatur, Feuchte, Omega und die meisten Niederschlagsprodukte bieten Flächen; sie bekommen keine erfundenen Konturen. EPS-Geopotential/Druck bietet daneben Spread-Flächen, deren Bedeutung nicht mit Mittelwertlinien vertauscht wird.

Radar/Satellit bleiben georeferenzierte Beobachtungsbilder mit echter Zeit und unabhängiger Deckkraft. Es werden keine künstlichen Radar-/Satellitenkonturen erzeugt. DWD/OPERA/MTG-Quellen und harte zeitliche/auflösungsbezogene Ausschlüsse bleiben erhalten. Modell-, Mess-, Nowcast- und Beobachtungstermine bleiben getrennt.

## Bedienung und Prüfung

Einheitlichere Layer-Karten mit klaren aktiven Zuständen und Tastaturfokus; Automatisch/Linien/Flächen direkt am Modell-Layer. Mobile Schalter mindestens 44 px; Quelltexte umbrechen. Eine Karteninstanz, begrenzte Feldcaches, Abort-Verträge und benutzergesteuerte Flächen bleiben erhalten.

Neue Verhaltenstests prüfen Darstellungswahl, keine erfundenen WMS-Stile, EPS-Spread-Trennung, Höhenrestriktionen, Zwei-Punkt-Segmente und Koordinatenordnung. Bestehende gemeinsame Browserprüfung wird um Standardlinien und manuelle Flächen ergänzt; alter Einstellungsvertrag um die absichtlich neue Darstellungsoption ergänzt. Vollständige Regressionen und Source-/Installer-Gates bleiben Pflicht.

## Screenshot-Nachtrag

Die alte `display:flex!important`-/Scroller-Kaskade verdrängte die neue Layer-Grid-Regel und quetschte Schalter. Der Unified-Bereich überschreibt diese Regeln gezielt: 2 Spalten mobil, 3 auf breiten Ansichten, vollständig umbrechende Quelltexte, mindestens 44 px Touchziele und skalierte Schriftgrößen. Radar und Satellit bleiben beide abwählbar und persistiert. Gemeinsame Kartengrenzen behalten ihre Canvas-Referenz; Ortsnamen werden in dieser Ansicht ausschließlich einmal vom deutschen Vektor-Label-Layer gezeichnet. Andere Karten und Exporte behalten ihre vorhandenen Ortslabels. Die Favoritenansicht verwendet ohne Ortsraster kompakte Zentrierungsbuttons statt sieben bedeutungsloser Fehlermeldungen. Statuskontrast auf der Karte wird explizit gesichert.

Die DNS-Token-Regression aus .185 prüft nun die aktuelle Wartungsversion und unverändert alle Token-, Spiegel- und Gate-Reihenfolgeverträge, statt jeden folgenden Release durch eine feste Paketversion .185 zu blockieren.

Die Browser-Fixture bedient zusätzlich die neuen Same-Origin-Vektorkachel-/Glyph-Modi aus .183; die Prüfung auf vollständig fehlerfreie Browserkonsole bleibt unverändert verpflichtend.

Die erweiterte Browsermatrix behält alle zwölf Viewport-/Theme-Fälle und sämtliche Konsolen-, Persistenz-, Quellen- und Renderprüfungen. Light/Dark laufen je Viewport unabhängig in getrennten Browserkontexten parallel, damit zusätzliche Abwahl-/Reload-Prüfungen innerhalb des unveränderten 360-s-Heavy-Gates bleiben. Die Source-Shards und Installer-Gates bleiben unverändert.

## Gemeinsamer nativer Bild-Lifecycle

Die strenge Browserkonsole deckte beim schnellen Layerwechsel einen ImageSource-Ladeabbruch auf: MapLibre lud bereits lokal erzeugte Data-URL-Modellbilder erneut per fetch. ImageQuadLayer dekodiert diese jetzt einmal über HTMLImageElement und übergibt das fertige Bild mit der offiziellen ImageSource.updateImage({image})-API. Ein nach Layer-Abwahl fertig dekodiertes Bild wird durch den aktiven Lifecycle-Guard nicht mehr installiert. Entfernte Quellen haben keinen offenen Data-URL-Fetch mehr. Der gemeinsame Renderer erreicht alle bestehenden Kartenverbraucher; externe Bild-URLs behalten ihren bisherigen Ladeweg. Fehler beim nativen Dekodieren werden in der Unified-Karte sichtbar gemeldet. Die Browsermatrix prüft zusätzlich exakt null Data-URL-Fetches bei weiterhin erzeugten und dargestellten Flächen.
