# MID v0.9.85.502

- Die RUC-Fast-Lane kann die aktuelle Pages-Auslieferung auch bei einer vollen GitHub-Deploymentliste prüfen und für neue DWD-Daten verwenden.

# MID v0.9.85.501

- Die unabhängige DWD-ICON-D2-RUC-Fast-Lane wird für einen SHA-authentifizierten, R2-freien GitHub-Pages-Vertrauenspfad vorbereitet. Neue zusätzliche Cloudflare-R2-Kosten oder Abonnements sind dafür nicht vorgesehen.
- Die geplante Fast-Versorgung prüft originale 0–6-Stunden-DWD-Daten, veröffentlicht einen kryptografisch gebundenen Herkunftsbeleg und verwendet nur nach erfolgreicher Worker-Prüfung gültige Wetterwerte; fehlende EPS-Daten bleiben nicht verfügbar.
- Das bisherige 27-Stunden-RUC/EPS-Produkt, amtliche Warnungen und die Unterscheidung zwischen fehlenden und tatsächlichen Nullwerten bleiben geschützt. Die produktive Fast-Lane gilt erst nach den vorgeschriebenen Release- und echten End-to-End-Prüfungen als aktiv.

# MID v0.9.85.500

- Die Einstellungen laden die Bedienbereiche Ansicht, Wetter, Navigation und Einheiten erst beim Öffnen des jeweiligen Bereichs. Alle neun Einstellungsregister und gespeicherten Präferenzen bleiben erhalten.
- Beim Umordnen der Dashboard-Module werden Status und Änderungen für Tastatur, Maus und Touch einheitlicher zugänglich angesagt. Die bestehende Modulreihenfolge bleibt gespeichert.
- Wetterprognosen, Originalwerte, amtliche Warnungen sowie die getrennten RUC-Voll- und Fast-Lane-Produktionswege bleiben unverändert; fehlende Werte werden nicht zu Null umgedeutet.

# MID v0.9.85.499

- Der Prognose-Cache unterscheidet jetzt exakt passende Ortsdaten von Daten aus nahegelegenen Orten. Ein räumlich abweichender Cache-Eintrag wird nicht länger als ortsgenaue frische Vorhersage dargestellt.
- Das Ensemble-Temperaturdiagramm trennt Wetter- und Gefahrenstreifen vom eigentlichen Datenplot und schützt Beschriftungen sowie Best-Match-Werte vor Überlagerung auf schmalen Displays.
- Der WMS-Kartenproxy begrenzt große Rasteranfragen und prüft Bounding-Boxen, Bildabmessungen und doppelte Parameter, bevor externe Kartendienste angesprochen werden.
- Die Taupunkt-Legende verwendet wieder das gleiche gestrichelte Linienmuster wie die zugehörige Kurve.
- Die vorhandenen DWD-RUC-Fast-Lane-Funktionen, amtlichen Warnungen und meteorologischen Originalwerte bleiben erhalten. Fehlende Daten werden nicht als gemessene Nullwerte ausgegeben.

# MID v0.9.85.498

- Die DWD-ICON-D2-RUC-Fast-Lane kann qualifizierte, eigenständige Prognosen für die nächsten sechs Stunden bereitstellen, ohne auf einen vollständigen 27h-Ensemble-Lauf zu warten.
- Originale Temperatur-, Wind-, Wolken- und Niederschlagswerte bleiben mit Laufzeit und Herkunft erkennbar; schnelle Niederschlagsdaten verwenden echte 5-Minuten-Schritte, Konvektionsdaten echte 15-Minuten-Schritte.
- Fehlende EPS-Ensemblewerte bleiben ausdrücklich nicht verfügbar und werden nicht als null Prozent Regenwahrscheinlichkeit oder Trockenheit ausgegeben.
- Die Fast-Pages-Veröffentlichung erhält den bisherigen Voll-RUC-Stand und kann bei fehlgeschlagener Prüfung zurückrollen.
- Bei einem neueren authentifizierten Modelllauf nutzt MID die eigenständige 0–6h-Fast-Lane; ein gleich aktueller oder neuerer Voll-RUC-Lauf behält seinen 27h-Horizont. Unbestätigte Fast-Daten verdrängen nie einen geprüften Voll-Lauf.
- Der Worker akzeptiert Fast-Daten ausschließlich mit einem extern gesetzten, SHA-geprüften Manifest-Digest: entweder über die ausdrücklich konfigurierte administrative Bindung oder über den nach erfolgreicher Pages-Prüfung gesicherten R2-Publisher-Beleg. Der unveränderte Datenpfad bleibt als Rückfall erhalten.

# MID v0.9.85.497

- Lange Ladehinweise bleiben auch auf schmalen Displays und bei vergrößerter Schrift vollständig lesbar.
- Ensemble-Detailinformationen umbrechen besser und die Erklärung der Methodik lässt sich leichter per Touch öffnen.
- Die 7-Tage-Kurve unterscheidet Tageslicht und Nacht deutlicher. Sonnenzeiten und Wetterprognosen bleiben unverändert.
- Nachtbänder behalten im Widget-SVG-Export eine ausfallsichere Ersatzfarbe.

# MID v0.9.85.496

- Eine rein lesende Eingangsprüfung für neue Pull Requests ist vorbereitet. Ihr aktiver Einsatz gilt erst nach erfolgreicher Stable-Veröffentlichung und geprüftem Echt-PR-Ereignis als nachgewiesen; sie erteilt selbst keine Merge- oder Releasefreigabe.
- Hyperlokale Stationsanalysen verwenden nur belegte ursprüngliche Messzeiten und unterscheiden fehlende Messwerte zuverlässig von tatsächlich gemessenen Nullwerten.
- Beim Wiederherstellen von RUC-Datensnapshots werden doppelte oder nichtkanonische Manifest-Schlüssel vor parallelen Schreibvorgängen zurückgewiesen.

# MID v0.9.85.495

- Aufsummierte Ensemble-Niederschlagsmengen verwenden nur vollständig belegte aufeinanderfolgende Tageswerte. Fehlende Werte erscheinen nicht mehr als 0 mm oder vermeintliche Trockenheit.
- Stationswerte ohne gültige Angaben zu Messalter, Entfernung oder Höhenunterschied werden nicht mehr als frische hyperlokale Messanker gewertet.
- Negative Rohwerte einer Niederschlagsmessung gelten als nicht verfügbar; tatsächlich gemessene 0 mm bleiben erhalten.

# MID v0.9.85.494

- Lange Orts- und Favoritennamen brechen auf kleinen Bildschirmen um und bleiben vollständig lesbar.
- Die Quellenangaben lassen sich leichter antippen. Die Bezeichnungen der Prognosereihen sind verständlicher.
- Schaltflächen für Wetterinfos sind für assistive Technik eindeutig mit ihrem jeweiligen Dialog verbunden.

# MID v0.9.85.492

- Wenn der neueste gemeinsame DWD-RUC- und RUC-EPS-Lauf nachweislich zu alt ist, bricht MID die Aufbereitung frühzeitig ab. Der zuletzt veröffentlichte Datenstand bleibt erhalten.

# MID v0.9.85.491

- Die Prognosespannen der Ensemble-Ansicht werden einmal je Darstellung skaliert. Fehlende oder ungültige Quantile fließen nicht als Nullwerte in die Skala ein.
- Die Legende nativer Modellkarten passt sich der Breite ihres Kartenbereichs an und ordnet ihre Bedienelemente bei wenig Platz untereinander an.
- EC46- und GEFS-Wochenwerte und ihr Klimavergleich verwenden vollständige Sieben-Tage-Zeiträume. Fehlende Tage und unvollständige Randwochen werden nicht als vollständige Wochensummen ausgegeben.

# MID v0.9.85.490

- Auf Touch-Geräten wird die neue Reihenfolge beim Loslassen über einem anderen gültigen Modul gespeichert. Ein ungültiges Loslassen oder ein Abbruch verwirft die Vorschau.
- Der Wetterzwilling zeigt fehlende Temperatur- und Niederschlagsmessungen ausdrücklich als fehlend an. Tatsächlich gemessene 0 mm bleiben als Messwert sichtbar.

# MID v0.9.85.489

- Der Wetterzwilling wertet archivierte Modellvorläufe nur aus, wenn Ausgabezeit, örtlicher Zielmittag und tatsächliche Zeitdifferenz zusammenpassen. Unplausible Horizonte beeinflussen die Prognosegüte nicht.
- Sicherheitswartung im vorbereiteten Build: Für GHSA-fc5q-39xc-vjpf / CVE-2026-112366 wird die betroffene Build-Abhängigkeit durch das gepinnte Community-Fork-Paket `@ryotsu/picomatch@4.0.7-a` ersetzt. Dies ist kein offizieller Upstream-Fix; Prognosewerte und amtliche Warnungen bleiben unverändert.

# MID v0.9.85.488

- Fehlende, fehlerhafte oder negative beobachtete Niederschlagsmengen zählen bei der Verifikation weder als trockene Tage noch als gültige Brier- oder Kalibrationsbelege.
- Wetterzwilling-Vergleiche verwenden für Temperatur, Windböen und Sonnenschein nur tatsächlich gültige Messwerte; fehlende Beobachtungen bleiben fehlend.
- Die mobile Bottom-Navigation vermeidet redundante Style-Änderungen bei unveränderter Bildschirmtastatur-Geometrie und bewahrt fremde Inline-Einstellungen.

# MID v0.9.85.487

- Die Wetterzwilling-Auswertung berücksichtigt für den Volltagesvergleich nur Prognosen, die spätestens zu Beginn des Zielorts-Tages vorlagen.
- Ungültige archivierte Regenwahrscheinlichkeiten zählen weder als 0 % noch für Brier-Score oder Kalibrierung. Die Anzeige nennt den Brier-Score und die Vergleichstage ohne unbelegte Güteklasse.
- Die Anzeige der Modellfrische fasst fehlende Zeitnachweise kompakter zusammen. Die ausführliche Modellliste bleibt verfügbar.

# MID v0.9.85.486

- **Karten-Zeitachse mit zuverlässigeren Home-/End-Tasten:** Nach asynchronen Terminwechseln wird eine neue Tastatureingabe nicht mehr durch einen veralteten internen Seek-Cache unterdrückt. Gültige Originalzeiten und Screenreader-Zeitangaben bleiben unverändert.
- **14-Tage-Prognose auf weiteren Smartphonegrößen lesbarer:** Für 393–430 CSS px ordnen sich Wetterbeschreibung, Temperatur und Ensemble-Vertrauen platzsparend über zwei Zeilen an. Sehr kleine Zusatzwerte werden auf mindestens 10,5 CSS px angehoben.
- **Zusätzliche responsive Qualitätskontrollen:** 32 echte Chromium-Layoutfälle einschließlich simulierter 200%-Textvergrößerung und 14-Tage-Cockpit-Ansicht schützen Textumbruch, Touchziele und Überlauf.
- **Wetterdaten und amtliche Warnungen unverändert:** Keine neuen Modelle, gefälschten 15-Minuten-Wolkenbilder, geänderten Einheiten oder Warnungsregeln.

# MID v0.9.85.485

- 14-Tage-Vorhersage: Wetterbeschreibungen werden in der kompakten Ansicht vollständig umbrochen statt mit Auslassungspunkten abgeschnitten.
- Die kompakte 14-Tage-Darstellung nutzt besser lesbare Zahlen und Beschriftungen; kleine Smartphones erhalten eine geordnetere Kopfzeile.
- Die technische CSS-Prüfung erkennt gemeinsame Navigations-, Berg- und Vorhersageregeln, bevor eine spätere Lazy-Auslagerung diese versehentlich entfernt.

# MID v0.9.85.484

- **Offline-Assets transparent geprüft:** Die technische Qualitätsprüfung trennt tatsächlich deklarierte Offline-Shell-Dateigrößen von Start-JavaScript und Start-CSS und erkennt außerdem unzulässige Preload-Mischdeklarationen. Es wird keine ungemessene Beschleunigung behauptet.
- **Verlässlichere Startasset-Prüfung:** Die technischen Startbudgetkontrollen weisen auch kodierte unzulässige Dateipfade zurück und verwechseln sie nicht mit tatsächlich ausgelieferten JavaScript- oder CSS-Dateien.
- **Umfeldkarte auch bei Radar-Ersatzdaten korrekt:** Die unabhängige europäische OPERA-Radarquelle sowie ihre Niederschlagsart verwenden jetzt eine an Ort, Kartenausschnitt und tatsächlichen Beobachtungstermin gebundene Bildidentität. Beim Wechsel wird kein altes Bild als neues ausgegeben.
- **Lüftungsassistent startet gezielter:** Seine Bedienoberfläche wird erst beim Öffnen der bestehenden Sektion geladen. Nach vollständiger Offline-Installation bleibt der benötigte Code über den vorhandenen Offline-Mechanismus verfügbar; Wetter-/Sensorlogik und gespeicherte Einstellungen bleiben erhalten.
- **Karten-Originale ohne Altbild:** Beim Zeit- oder Ortswechsel werden Radar- und Wolkenbilder erst nach vollständiger Prüfung von Quelle, Zeitpunkt und Ausschnitt angezeigt; alte Bilder erscheinen nicht kurz unter falscher Zeit.
- **CSS-Diagnose robuster:** Die verpflichtende CSS-Quellprüfung verwendet den tatsächlichen Repositorypfad, auch wenn sie aus einem anderen Arbeitsverzeichnis gestartet wird; fehlende Daten bestehen die Prüfung nicht.
- **Umfeld-Radar im Viertelstundenraster:** Radar/Satellit erhalten eine kompakte −15-/+15-Minuten-Zeitachse mit persistent gewählter Darstellungsart. Die Quellenzeit bleibt getrennt vom gewünschten Termin; fehlende Beobachtungs- oder Nowcast-Bilder werden nicht ersetzt.
- **Echte Wolken-/SigWx-Zeitstempel:** Die Umfeldkarte zeigt nur nachgewiesene Originaltermine und meldet fehlende Viertelstunden als nicht verfügbar. Die native lückenlose Viertelstunden-Datenpipeline ist weiterhin offen.
- **Schonendere Kartenbedienung:** Gleichzeitig geladene Kartenlayer benötigen weniger unnötige Sortierungen. Optionale Kartenflüge berücksichtigen die Geräteeinstellung für reduzierte Bewegung.
- **Verlässliche Kartenzeiten:** Die Zeitregler der Wetter- und Kompositkarten geben ihren tatsächlichen Gültigkeitszeitpunkt und die Phase (Beobachtung, Nowcast oder Modellprognose) auch für Screenreader verständlich an. Die sichtbare Kartenzeit bleibt kompakt.
- **Korrekte Temperatur am gewählten Termin:** Beim schnellen Wechsel zwischen Viertelstunden und Orten blendet die Umfeldkarte keine Temperatur mehr ein, die noch zu einer vorherigen Anfrage gehört. Modellherkunft und Original- beziehungsweise Zwischenwert bleiben unterscheidbar; fehlende Daten werden nicht als null angezeigt.
- **Flüssigeres PseudoSat-Bedienen:** Schnell überstrichene Zeitpunkte lösen erst nach einer kurzen Ruhephase teure Wolken-/Wetterbild-Abrufe aus. Die tatsächlichen Originalfelder und die fachlichen Grenzen ihrer Darstellung bleiben bestehen.
- **Sicherere Wartung:** GitHub-Checkout-Schritte speichern in 13 weiteren Fällen keine Zugangsdaten dauerhaft. Der Codeprüfer protokolliert Sicherheitsbefunde vollständig statt sie zu verkürzen, ohne daraus eine Freigabe abzuleiten.

# MID v0.9.85.483

- **Startmodule entlastet:** Benachrichtigungen, iCloud-Sicherheitskopie, Wetterzwilling und Verbindungsdiagnose laden ihre Einstellungsoberflächen erst bei Bedarf. Bestehende Bedienung, Push-/Datenfachlogik und gespeicherte Einstellungen bleiben erhalten.
- **Performancebudgets erweitert:** SHA-gebundene Produktionsbuild-Messung für Start-CSS und HTML-referenziertes JavaScript, mit zusätzlichen Obergrenzen und Negativtests. Fehlende Mess- und Herkunftsdaten gelten nicht als bestanden.
- **Quellen und Warnungen unverändert:** Keine Änderung an Wettermodellen, amtlichen Warnungen, Prognose-Originalwerten oder physikalischen Einheiten. Bei der Performancearbeit wurden CSS-Änderungen nur mit gesondertem Vergleich geprüft.
- **Umfeldwetter im Viertelstundentakt:** Die Wolken-/SigWx-Karte wählt feste UTC-Viertelstunden-Ziele mit gültigem Originalfeld-Vorrang, kompakter Quellenzeit und konsistenter Übergabe in die große Karte; Wettercodes und extreme Werte werden nicht künstlich interpoliert. Die ortsbezogene Temperatur wird von eigenen Best-Match-Stundenwerten abgeleitet und ist nicht als natives 15-Minuten-Original ausgewiesen.

# MID v0.9.85.482

- **Wetterdatenqualität verständlicher prüfen:** Die interne Datenquellenkontrolle unterscheidet jetzt technische Verbindungsprobleme von HTTP-Störungen des Wetterdienstes und tatsächlich fehlerhaften API-Antworten. Ein nicht erreichbarer Anbieter wird nicht länger fälschlich als geändertes Datenformat bezeichnet.
- **Keine falschen Erfolgsmeldungen:** Fällt ein erforderlicher Datenabruf aus, bleibt der Qualitätscheck fehlgeschlagen. Fehlende Werte bleiben fehlend; die vorhandenen begrenzten Wiederholungsversuche bleiben unverändert.
- **Datensparsame Diagnose:** Netzwerkfehler werden ohne sensible URL- oder Tokeninhalte protokolliert. Prognosemodelle, Wetterkarten, Warnungen und Bedienoberfläche sind unverändert.

# MID v0.9.85.481

- **Wetter im Umfeld:** Im Wolken-/SigWx-Modus sind „Jetzt“ sowie +15, +30, +45, +60, +75, +90, +105 und +120 Minuten auf einer kompakten, gut bedienbaren Zeitachse auswählbar. Die absolute Zielzeit wird nur einmal sichtbar angegeben und beim Öffnen der großen Karte übergeben.
- **Meteorologisch nachvollziehbar:** 15-Minuten-Zwischenbilder der Wolkendecke entstehen ausschließlich zwischen zwei zeitlich höchstens eine Stunde getrennten, SHA-geprüften Originalfeldern desselben Modelllaufs auf identischem Raster. Die kategorischen WMO-SigWx-Codes werden nicht interpoliert; rasche Wolkenwechsel, fehlende Zellen und nicht passende Originalfelder werden nicht künstlich geglättet. Modell- und Originalgültigkeiten sowie Zwischenberechnung werden kenntlich gemacht.
- **Temperaturen:** Die farbigen 2-m-Zahlen sind klarer konturiert, größer und weiterhin ohne deckende Hintergrundplatten. Die Basiskarte zeigt Ortsnamen nur einmal. Orts- und zukünftige Standorttemperaturen stammen aus realem Open-Meteo-Best-Match-Abruf; Zwischenwerte erfordern vollständige Stundenoriginale und plausible Änderungen. Fehlende Daten werden nicht als 0 dargestellt.
- **Responsive und sicher:** Touchbedienung und Zeitanzeige auf schmalen Smartphone-, Tablet- und Desktopansichten berücksichtigt; Radar/Satellit bleiben ausschließlich nach ausdrücklicher Auswahl aktiv. Kein neuer kostenpflichtiger Dienst, keine Anpassung amtlicher Warnstufen oder Schutzregeln.

# MID v0.9.85.480

- Umfeldwetter startet mit der hochwertigen MID-Kartenbasis und einer geprüften Modellkarte für Wolken + signifikantes Wetter (SigWx) statt langsamer Radar-/Satelliten-Vorababrufe. Beobachtungsradar und Satellit bleiben auf Wunsch über eine separate Ansicht erreichbar.
- Gut erkennbare Temperaturzahlen mit der appweiten ECMWF-orientierten Farbskala werden direkt an geografisch belegten Orten gezeigt; der ausgewählte Standort ist zusätzlich markiert. Farbige und schwarze Hintergrundplatten um die Zahlen entfallen.
- Karten-Zeitleiste: Der relative Zeitschritt und die absolute Gültigkeitszeit stehen gemeinsam im Zeitband, auch auf schmalen Displays. Überflüssige doppelte Zeitangaben und eine zusätzliche Karten-Pille werden vermieden.
- MID unterscheidet Modellvorhersage, Beobachtung, Modelllauf und Gültigkeitszeit eindeutig. Fehlende Wolken-/SigWx-Felder werden nicht als wolkenfrei oder als amtliche Warnungen ausgegeben.

- Ortsbezogener Modell-Fallback: Fehlt ein brauchbares, zeitlich gültiges ICON-D2-Wolken-/SigWx-Feld, werden weitere SHA-überprüfte regionale und überregionale Modelle geprüft. Unbekannte Daten bleiben als solche gekennzeichnet.
- Widget-PNG-Export robuster: Eine vollständig überprüfte neue PNG-Datei ersetzt die vorherige atomar. Fehlgeschlagene Schreibvorgänge oder Wiederholungsversuche löschen die bisher gültige Ausgabe nicht.

# MID v0.9.85.479

- Changelog direkt in MID öffnen und über „Zurück zu MID“ zur bisherigen App-Ansicht zurückkehren – ohne neuen Browser-Tab oder PWA-Fenster.
- Bedienbarkeit: Schließen über Escape, Wiederherstellung des Fokus, mobile Safe Areas, Light/Dark-Modus und verständliche Fehlermeldung mit weiterhin nutzbarem Rückweg.
- Codequalität: Bestehende Prüfwerkzeuge, deren Status und deren Grenzen verbindlich dokumentiert. actionlint, zizmor, Biome und axe bleiben optionale Diagnosen mit nachvollziehbarer Befundpflicht; alle bisherigen Release- und Schutzgates bleiben erhalten.

# MID v0.9.85.478

- Wetter im Umfeld: dieselbe hochwertige OpenFreeMap-/MapLibre-Kartengrundlage wie im MID-Kartenbereich mit Wasser, Länder- und Regionalgrenzen sowie Orts- und Flussbeschriftungen statt schematischer SVG-Grenzlinien.
- Temperaturwerte erscheinen bei bis zu vier tatsächlich benannten, nach regionaler Bedeutung ausgewählten Städten bzw. Orten. Die bisherigen frei gewählten Modellrasterpositionen entfallen. Werte stammen aus echten ortsbezogenen Open-Meteo-Best-Match-Abfragen; fehlende und unplausible Werte werden nicht als 0 dargestellt.
- Niederschlagsradar und Satellitenbilder liegen georeferenziert auf der Kartenbasis. Der gewählte Ort bleibt als dezente Standortmarkierung mit seinem eigenen aktuellen Temperaturwert erkennbar.

# MID v0.9.85.477

- Stabilere GitHub-Actions-Artefaktübertragung bei HTTP-429-Drosselung: Die offizielle GitHub-Action `actions/download-artifact` verwendet jetzt v8.0.2 mit berücksichtigt­em `Retry-After`, ohne MID-Daten, Wetterberechnungen oder Benutzeroberfläche zu ändern.
- Sicherheitswartung: SHA-verifizierte Action in zehn kanonischen Workflow-Paaren, im Installer-Spiegel, im Workflow-Synchronisierer und in den zugehörigen Regressionen aktualisiert. Herkunfts-/Digest-Fehler bleiben blockierend; die vollständigen Release- und Stable-Gates bleiben verpflichtend.

# MID v0.9.85.476

- Extremwetter-Ausblick: Kurz- und Mittelfrist können mit einer validierten lokalen Vorschau sofort geöffnet werden. Kürzere begrenzte zentrale Abruffristen und kontrollierter serieller Direkt-Fallback vermeiden doppelte Datenanforderungen; fehlende Modelllauf-Metadaten und unvollständige Gefahrenfelder bleiben ausdrücklich gekennzeichnet. Eigene MID-Diagnostik ist keine amtliche Warnung.

- Wetter im Umfeld: vier echte, georeferenzierte Modelltemperaturen rund um den gewählten Ort, ergänzt durch Kartengrenzen und Ortsnamen. Bei fehlenden Daten erscheinen keine erfundenen Nullwerte.
- Open-Meteo Best Match als eigenständiger, begrenzter Vierpunktabruf: Quelle, tatsächliche UTC-Gültigkeitszeit und verfügbare Punkte werden ausgewiesen; ein unbekannter individueller Modelllauf wird nicht behauptet. Radar und Niederschlagsphase beeinflussen die Temperaturabfrage nicht.
- Dezente, kontrastgesicherte Orts- und Temperaturbeschriftungen auf heller und dunkler Karte, einschließlich Schnee- und Wolkenbildern.
- Kostenneutrale, optionale P1-Qualitätsprüfungen für actionlint, zizmor und Biome sowie axe-core/Playwright im Revisionsworkflow. Die neuen Piloten verändern oder ersetzen keine bestehenden Source-/Review-/Release-Gates; ihre Findings sind unabhängig zu bewerten.

# MID v0.9.85.475

- Sicherheits-/Qualitätswartung: CodeQL-Workflow auf die offiziell verifizierte GitHub-Action v4.39.3 aktualisiert. Initialisierung und Analyse verwenden denselben festgeschriebenen Commit.
- MID hält beide GitHub-Workflowspiegel und den Pin-Generator synchron. Eine neue Pflichtregression schützt vor einem erneuten Rückfall auf die alte Action-Version.
- Wetterdaten, Warnungen, Bedienoberfläche und bestehende Funktionen bleiben unverändert.

# MID v0.9.85.474

Der Release-Bot kann nach einem nachgewiesenen Installerfehler vor dem Deployment einen vollständig geprüften Folge-PR übernehmen.

# MID v0.9.85.473

- „Wetter im Umfeld“ ergänzt die Startseite um Radar, Satellit und zeitlich passende Temperaturwerte.
- MID lädt den Systemstatus erst beim Öffnen des Einstellungsbereichs, um das Startpaket zu verkleinern.

# MID v0.9.85.472

- Unter Aktuell zeigt „Wetter im Umfeld“ eine kompakte Radar- und Satellitenvorschau. Bestätigte DWD-Nowcast-Termine sind auswählbar.
