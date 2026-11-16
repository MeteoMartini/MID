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
