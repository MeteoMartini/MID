# MID v0.9.85.220

- Abgebrochene RUC-Snapshot-Downloads werden direkt mit begrenztem Backoff wiederholt.
- Nur vollständig geladene und per Größe/SHA geprüfte Dateien werden übernommen.
- Bei dauerhaftem Fehler bleibt der vorhandene Snapshot erhalten; Teilbytes werden nicht veröffentlicht.

# MID v0.9.85.219

- RUC-EPS-Mitglieder müssen an allen benötigten Vorhersageterminen vorhanden sein.
- Vollständig leere Termine einzelner Mitglieder stoppen den Lauf vor der Aggregation.
- Maskierte Randzellen, trockene Nullwerte und die bisherigen Ensemble-Schwellen bleiben erhalten.

# MID v0.9.85.218

- RUC-Daten werden vor Veröffentlichung zusätzlich auf vollständig leere Vorhersagetermine geprüft.
- Alle stündlichen Kernfelder müssen dieselben Zeit- und Gitterdimensionen besitzen.
- Gültige maskierte Randzellen und trockene Nullwerte bleiben erhalten; fehlerhafte Läufe werden nicht veröffentlicht.

# MID v0.9.85.217

- Kartenwerte bleiben zum Lesen geöffnet, bis sie bewusst geschlossen werden oder sich der Kartenkontext ändert.
- Die gemeinsame Wertanzeige erhält Dialogsemantik und Tastaturführung mit Escape und Rückkehr zum Auslöser.
- Wetterwerte, Einheiten, Quellen und Kartenfarben bleiben unverändert.

# MID v0.9.85.216

- Widget-Exporte warten auf tatsächlich geladene Schriften, Bilder und sichtbares Layout.
- Automatische Renderläufe bewahren den ersten Fehler mit Screenshot, Build-Bezug und begrenzter Netzwerkdiagnostik auch bei erfolgreichem Retry.
- Fehlerartefakte bleiben getrennt vom öffentlichen Widget-Paket; bestehende Daten- und Release-Gates bleiben erhalten.

# MID v0.9.85.215

- Gleiche Skybar-Zustände erscheinen als durchgehendes Band, auch in der kompakten 7-Tage-Ansicht. Die künstlichen Stundennähte entfallen.
- Die gemeinsame Darstellung gilt auch für Kurzfristansichten, Tageskarten und Widgets. Unterschiedliche Wetterzustände und einzelne Stundeninformationen bleiben erkennbar.

# MID v0.9.85.214

Die Wetterkarte erhält zusätzliche automatische Langzeitprüfungen: wiederholte Modellwechsel werden auf stabile Kartendarstellung und Speicherentwicklung untersucht. Das erleichtert gezielte Verbesserungen bei Geschwindigkeit und Zuverlässigkeit. Alle bisherigen Wetterfunktionen und die Korrektur fehlender RUC-Gitterwerte bleiben erhalten.

# MID v0.9.85.213

Die DWD-RUC-Kurzfristdaten werden bei der Aufbereitung jetzt zuverlässiger behandelt. Bereiche ohne gültige Modellwerte sind klar als fehlende Daten gekennzeichnet; falsche Extremtemperaturen entstehen dadurch nicht mehr. Die strengen Prüfungen meteorologischer Werte bleiben bestehen. Verfügbare Radar-, Kurzfrist- und Ensemblefunktionen sowie die Bedienoberfläche werden nicht verändert.

# MID v0.9.85.212

**Karten im Dark Mode:** Die Terminwahl für Radar und Karten passt ihre Schaltflächen und das Auswahlmenü jetzt korrekt an helle und dunkle Designs an. Auch auf schmalen Smartphones bleiben die Bedienelemente besser lesbar und erreichbar. Tastaturfokus und deaktivierte Zustände sind klarer erkennbar.

**Datenqualität:** Im Hintergrund werden unerwartete DWD-RUC-Temperaturwerte präziser diagnostiziert. Ungültige Wetterdaten werden weiterhin nicht veröffentlicht.

# MID v0.9.85.211

Niederschlagsarten sind eindeutiger: Gefrierender Regen und Schneeregen haben jetzt unterscheidbare Symbole. Bei nicht durch kalte Oberflächen bestätigtem gefrierendem Regen wird ein Modellhinweis vorsichtiger formuliert, während bestätigtes Glätterisiko sichtbar bleibt. Der Kurzfristtext orientiert den Niederschlagsbeginn an der dargestellten Stunden-/15-Minuten-Zeitachse. Die 90-Minuten-Kacheln zeigen keine redundanten Wolkenprozente mehr; die Skybar bleibt unverändert.

# MID v0.9.85.210

MID misst jetzt bei automatisierten Karten-Browsertests zusätzlich die tatsächliche Ladebereitschaft, den Bildaufbau und längere Berechnungsphasen. Die Messwerte werden für verschiedene Displaygrößen, helle und dunkle Ansichten sowie die beiden Designs dokumentiert. Sie dienen zunächst als Vergleichsbasis; Wetterprognosen, Kartenfunktionen und die Bedienoberfläche ändern sich nicht.

# MID v0.9.85.209

Die Prüfung der DWD-RUC-Wetterdaten wurde weiter verschärft: MID kontrolliert jetzt auch, ob GRIB2-Felder tatsächlich vom erwarteten DWD-Erzeugungszentrum stammen und die richtige Modellinitialisierung besitzen. Verwechslungen verschiedener Wetterparameter, Höhenniveaus oder Gitter innerhalb eines Modelllaufs sowie doppelte Prognosewerte werden vor der Veröffentlichung erkannt. Vorhandene Wetterfunktionen und die Bedienoberfläche bleiben unverändert.

# MID v0.9.85.208

Die Verarbeitung der DWD-RUC-Wetterdaten erhält zusätzliche fachliche Sicherheitsprüfungen: Unpassende Modellläufe, doppelte Zeitstempel, deutlich zurückspringende Niederschlagsakkumulationen und physikalisch widersprüchliche Feuchte-, Wolken- oder Taupunktwerte werden vor der Datenveröffentlichung erkannt. Kleine Rundungsabweichungen bleiben zulässig. Die Wetteransichten und die Bedienung ändern sich nicht.

# MID v0.9.85.207

Der technische Prüfpfad wurde erweitert: MID kann nun für jeden neu erzeugten Web-Build seine Versionsnummer und einen Fingerabdruck der tatsächlich ausgelieferten Dateien nachvollziehen. Die Wetterfunktionen, Karten, Prognosen und Bedienoberfläche bleiben unverändert.

# MID v0.9.85.206

Die 90-Minuten-Kacheln zeigen zusätzlich den Bewölkungswert ihres jeweiligen Zeitschritts. Die Skybar erklärt ihre Schwellen und die breite Nacht-Hinterlegung. Vorhandene Werte unter den Bandschwellen bleiben als solche erkennbar und werden nicht als fehlende Daten bezeichnet.

Fehlende Bewölkungswerte werden in gemeinsamen Wetterzeichen, Periodenmitteln, Wolkenschichten und Kurzfrist-Fallbacks nicht mehr als 0 % ausgewertet. In den 3-Stunden-Details folgen trockene Wetterbeschreibung und Wetterzeichen nun demselben Bewölkungsmittelwert. Das 24-h-Profil besitzt einen korrigierten Erklärungstext und kompakter angeordnete Hinweise auf breiten Bildschirmen. Echte Nullwerte, Bandfarben und meteorologische Schwellen bleiben erhalten.

# MID v0.9.85.205

Die Kartennavigation reicht jetzt bis zum letzten tatsächlich veröffentlichten Modelltermin. Eine bisherige feste 204-Stunden-Grenze konnte die neuen IFS- und GFS-Endpunkte im Dropdown abschneiden. Ausschließlich verifizierte vorhandene Termine werden angeboten; Beobachtungs- und Nowcastregeln bleiben erhalten.

# MID v0.9.85.204 · Bewölkung und längere Synoptik

Das 24-Stunden-Profil verwendet für Bewölkungswerte, Wetterzeichen und Skybar denselben Stundenstand. Die 90-Minuten-Ansicht behält ihre feinere Auflösung. Nachtfelder nennen den tatsächlichen Bewölkungswert und werden bei unbekannten Daten nicht als klare Nacht ausgegeben.

Die Synoptik prüft zusätzlich ICON Global sowie modellabhängige längere Horizonte: ICON-EU bis +120 h, ICON Global laufabhängig bis +120/+180 h, IFS bis +360 h und GFS bis +384 h. Angeboten werden ausschließlich vollständige Termine desselben Laufs, soweit Daten und das unveränderte Speicherbudget verfügbar sind. Spätere Termine nutzen ein gröberes, gekennzeichnetes Übersichtsraster. Navigation und Terminauswahl zeigen den zweibuchstabigen Wochentag.

# MID v0.9.85.203 · Synoptik-Katalog ohne Terminverlust aktualisieren

Beim Neuladen bleibt der letzte geprüfte und noch gültige Synoptikkatalog sichtbar. Modellwahl, Kartenzeitachse und manuell gewählte Gültigkeitszeit bleiben während einer verzögerten Antwort erhalten. Das angebotene Zeitfenster hängt vom bestätigten Modellkatalog ab, auch wenn der bisherige Termin außerhalb eines neu gewählten Modells liegt.

Die Kartenprüfung kontrolliert feste Gültigkeitszeiten statt veränderlicher Listenpositionen und hält die Katalogantwort gezielt zurück. Die Synoptikdarstellung, erweiterten Modelltermine und RUC-Recovery aus .202 bleiben erhalten.

# MID v0.9.85.202 · Synoptik-Komposit und Kartenzeitsteuerung

Theta-E 850 hPa erhält dezente graue Konturen; die Linienbeschriftung erscheint nur bei Vielfachen von 12 °C. Die blauen Feuchtelinien in 700 hPa bleiben ohne Linienbeschriftung.

Die fokussierte Wetterkarte wechselt mit den Pfeiltasten links/rechts zum vorherigen/nächsten bestätigten Termin. Eingabefelder und Regler behalten ihre eigene Bedienung.

Für ICON-EU, GFS und IFS werden zusätzlich +60 und +72 Stunden angeboten, soweit vollständige Felder aus demselben Lauf verfügbar sind und das bestehende Datenbudget ausreicht. ICON-D2 bleibt auf seinen regionalen Ausschnitt und 48 Stunden begrenzt. Der große Europa-Ausschnitt und die 6-Grad-Farbstufen aus .200 bleiben erhalten.

# MID v0.9.85.201

RUC-Kurzfristdaten werden nach erfolgreichen MID-Veröffentlichungen automatisch auf Aktualität geprüft und bei Bedarf nachgeholt. Ein erfolgreicher Verarbeitungslauf ohne tatsächlich veröffentlichte Daten unterdrückt die Wiederaufnahme nicht mehr.

RUC-Übergabeartefakte erhalten pro Ausführungsversuch eindeutige Namen. Der bestehende Vier-Stunden-Frischevertrag, Datenbudgets sowie Release- und Sicherheitsprüfungen bleiben erhalten.

Basis: main = mid-stable c3f3abebfd5e3da86013063d7b051b05399e3876 (v0.9.85.200). Details: docs/implementation/MID_C22_RUC_RECOVERY_0.9.85.201.md.

# MID v0.9.85.200

- Synoptik/Theta-E: Europaausschnitt bis zur ICON-EU-Abdeckung (29,5–70,5° N, 23,5° W–62,5° O); ICON-EU als klar benannte 0,125°-Übersicht. ICON-D2 bleibt auf seinem tatsächlichen Regionalgebiet.
- Wind 300 hPa ab 60 kt, Stärke über Pfeillänge und -dicke; räumlich lesbare Pfeildichte.
- Theta-E mit 6-Grad-Farbstufen und dezenten Konturen, Beschriftung alle 12 °C. Feuchte 700 hPa: 60 % blau gestrichelt, 80 % blau durchgezogen.
- Bis zu 13 statt neun vollständige Synoptik-Termine bis +48 h. Zusätzliche Termine bleiben vom unveränderten freien Datenbudget abhängig.
- Bildwechsel: vorheriges Bild bis zum geladenen Nachfolger erhalten und 350 ms überblenden. Gemeinsamer Bild-/Canvas-Renderer, native Modelle, WMS, OPERA und 250-m-Radar; gültige Zeit bleibt während des Abrufs erkennbar.
- Prüfungen: echte GRIB-Dekodierung, meteorologische Referenzen, Budgetgrenzen und langsame/fehlerhafte Bildwechsel in der vollständigen Karten-Browsermatrix.

# MID v0.9.85.199

Die 7-Tage-Kurven-Widgets verzichten auf die beiden bisherigen Unterüberschriften „7-Tage-Kurvenübersicht“ und „Wetterstreifen, Temperaturtrend & Niederschlag“. So beginnt die Grafik ohne unnötigen Zwischenraum direkt unter den Ortsangaben.

Die normale 7-Tage-Prognose, die Wetterwerte, Kurven, Piktogramme und der Wetterstreifen bleiben unverändert.

Basis: main = mid-stable 36110a193328b0e4a5978e742e3768a8fcd9664f (v0.9.85.198). Details: docs/implementation/MID_C21_CURVE_WIDGET_COMPACT_0.9.85.199.md.

# MID v0.9.85.198

MID-C21: sichtbare Küsten und Ländergrenzen über den Wetterflächen; direkte Kartenzeitwahl mit Vor/Zurück, Terminliste und Aktuell. Synoptik zeigt fehlende Kataloge und Ladefehler mit erneutem Abruf.

RUC-Veröffentlichung bindet den vorbereiteten Snapshot an seine Artefakt-ID. Pages-Artefakte sind je Ausführungsversuch eindeutig. Alte Scheduler-Einträge ohne Jobs blockieren die Wiederaufnahme erst nach überprüfter Jobs-Abfrage nicht mehr; laufende Jobs und Schutzgates bleiben erhalten.

Basis: verifiziertes main = mid-stable b27bd472e228c59a9cc36e7305307b775623288a (.197). Details: docs/implementation/MID_C21_MAP_RUC_0.9.85.198.md.

# MID v0.9.85.197

- Aktuelles Wetter: vier einheitliche Parameterfelder mit passenden Symbolen und lesbarer Typografie. Die Skybar liegt oberhalb des 12-Stunden-Temperaturgraphen mit gemeinsamer Zeitachse.
- Kartendetails lassen sich einzeln auswählen: Ländergrenzen, Regionen, Städte, Flüsse und Straßen. Eine gemeinsame OSM-Geometrie ersetzt doppelte und schematische Grenzen.
- Höhenlinien 500 hPa werden aus dem vollständigen Modellraster als zusammenhängende Konturen berechnet. Die alte gestufte Darstellung entfällt.
- Das Synoptik-Komposit kombiniert Theta-E 850 hPa, Höhenlinien 500 hPa, Bodendruck, Feuchte 700 hPa und Wind 300 hPa aus demselben Modelllauf und Termin. ICON-D2, ICON-EU, GFS und IFS werden nur mit vollständigen, geprüften Rohdaten angeboten.
- Bei App-Rückkehr bleibt die gewählte Inhaltsansicht erhalten. Das temporäre Mehr-Menü startet geschlossen und schließt beim Wechsel in den Hintergrund.

# MID v0.9.85.196

- Die vollständige Replit-Übergabeprüfung erhält ausreichend Zeit für alle bestehenden Browser- und Regressionstests.
- Die geplante MID-C21-Wetterkartenanpassung wird erst nach erneut erfolgreicher Übergabeprüfung freigegeben.

# MID v0.9.85.195

- Karten: dezente Verwaltungsgrenzen statt heller Doppelkonturen; Parameter in sechs fachlichen Kategorien.
- Neues Synoptik-Komposit: Temperatur 850 hPa, Höhenlinien 500 hPa und MSL-Isobaren ausschließlich aus demselben ICON-Lauf und Termin.
- ECCC GDPS Global ergänzt Gesamtbewölkung über freie GeoMet-Karten mit eigenem Lauf und Termin, glatter Originaldarstellung und erhaltener Herkunft.
- ICON-EU ergänzt die 2-m-Temperatur; verifizierte 12-h-Niederschlagskarten aus ICON-EU und ICON Global. Druckflächenabhängige Farbskalen werden passend gewählt.

- Warnungs-Timeline: vollbreite Ereigniskarten und ein gemeinsamer Tageszeitstrahl mit Wochentag, Datum und Ereigniszahl in allen Ansichten und beiden Designs.
- Die Jetzt-Markierung zeigt Datum und Uhrzeit in Ortszeit. Tagesgruppierung berücksichtigt Zeitzonen; Ereignisse über Mitternacht behalten ihren vollständigen Zeitraum.
- Die horizontale Layout-Kollision und der große Leerraum links entfallen. Amtliche Warnstufen und MID-Quellen bleiben unverändert getrennt.

# MID v0.9.85.194

- Inhaltlich gleiche, überlappende MID-Windhinweise werden nach der probabilistischen Fensterbildung als ein zusammenhängendes Ereignis dargestellt. Unsicherheit und längerer Prognosehorizont bleiben kenntlich.
- Unterschiedliche Warnstufen, Windrichtungen, konvektive Risiken und getrennte Ereignisse bleiben erhalten. Amtliche Warnungen und Niederschlagssummen werden nicht zusammengeführt.

# MID v0.9.85.193

- Der Installer prüft Core und Heavy-Regressionen parallel auf getrennten Runnern, ohne Tests auszulassen.
- Alle 24 Karten-Browserfälle werden verlustfrei auf drei isolierte Gruppen verteilt.
- Event-SHA, Manifest-, Archiv- und Datei-Hashes binden sämtliche Jobs an dasselbe validierte Release-Paket. Commit und Deployment bleiben bis zum Erfolg aller Prüfungen gesperrt.
- Laufzeitberichte je Test und Kartenfall machen Verzögerungen messbar. Keine Testergebnisse werden zwischen Releases wiederverwendet; sämtliche bestehenden Deployment-/Stable-Gates bleiben erhalten.

# MID v0.9.85.194

- Inhaltlich gleiche, überlappende MID-Windhinweise werden nach der probabilistischen Fensterbildung als ein zusammenhängendes Ereignis dargestellt. Unsicherheit und längerer Prognosehorizont bleiben kenntlich.
- Unterschiedliche Warnstufen, Windrichtungen, konvektive Risiken und getrennte Ereignisse bleiben erhalten. Amtliche Warnungen und Niederschlagssummen werden nicht zusammengeführt.

# MID v0.9.85.193

- Der Installer prüft Core und Heavy-Regressionen parallel auf getrennten Runnern, ohne Tests auszulassen.
- Alle 24 Karten-Browserfälle werden verlustfrei auf drei isolierte Gruppen verteilt.
- Event-SHA, Manifest-, Archiv- und Datei-Hashes binden sämtliche Jobs an dasselbe validierte Release-Paket. Commit und Deployment bleiben bis zum Erfolg aller Prüfungen gesperrt.
- Laufzeitberichte je Test und Kartenfall machen Verzögerungen messbar. Keine Testergebnisse werden zwischen Releases wiederverwendet; sämtliche bestehenden Deployment-/Stable-Gates bleiben erhalten.

# MID v0.9.85.193

- Der Installer prüft Core und Heavy-Regressionen parallel auf getrennten Runnern, ohne Tests auszulassen.
- Alle 24 Karten-Browserfälle werden verlustfrei auf drei isolierte Gruppen verteilt.
- Event-SHA, Manifest-, Archiv- und Datei-Hashes binden sämtliche Jobs an dasselbe validierte Release-Paket. Commit und Deployment bleiben bis zum Erfolg aller Prüfungen gesperrt.
- Laufzeitberichte je Test und Kartenfall machen Verzögerungen messbar. Keine Testergebnisse werden zwischen Releases wiederverwendet; sämtliche bestehenden Deployment-/Stable-Gates bleiben erhalten.

# MID v0.9.85.192

- Kurven-Widgets zeigen denselben Ortskopf wie Tageskarten: Ortsname, Koordinaten, Höhe und Ortszeit.
- Ein gemeinsamer Kopf innerhalb der Exportfläche hält Vorschau, URL-Widget, PNG und Zwischenablage konsistent; Ensemble bleibt unverändert.
- Zusätzliche Render- und Browserprüfungen sichern beide Profile, alle drei festen Orte und beide Themes. Release- und Sicherheitsgates bleiben unverändert.

# MID v0.9.85.191

- Warnungscenter: Amtliche Warntexte und MID-Hinweise sind beim Öffnen sofort sichtbar und bleiben einzeln einklappbar. Beim erneuten Öffnen werden beide Gruppen wieder aufgeklappt.
- Der Hinweisstatus unterscheidet aktuelle und anstehende Prognosehinweise; die Zahl anstehender Hinweise bleibt auch mobil im Status sichtbar.
- Auf Smartphones bleiben Timeline-Karten über die volle Breite lesbar. Die Ereignis-Timeline benennt amtliche Warnungen und MID-Hinweise gemeinsam, ohne ihre Herkunft oder Warnstufen zu vermischen.
- Die Bundle-Prüfung vermeidet unnötige Kompressionsberechnungen. Alle Regressions-, Budget-, Sicherheits- und Releaseprüfungen bleiben vollständig erhalten.

- Kurvenwidget: Der Erklärungstext oben rechts entfällt. Wind und Böen stehen mit klar getrennten Textzeilen ohne Überdeckung.

# MID v0.9.85.190

- Die Veröffentlichung erhält ausreichend Zeit für die vollständige Prüfung. Ein Zeitabbruch nach bereits bestandenen Tests blockiert dadurch nicht mehr die Freigabe und nachfolgende RUC-Aktualisierungen.
- Enthält die jüngsten Favoritenkorrekturen, Tmin und beide Unsicherheitsbereiche im 14-Tage-Diagramm sowie kompaktere Phasenfelder.
- Die Saisonvorhersage öffnet und lädt ausschließlich nach ausdrücklicher Auswahl, unabhängig von der 46-Tage-Ansicht.
- Alle Sicherheits-, Wetterdaten- und Veröffentlichungsgates bleiben verbindlich.

# MID v0.9.85.189

- 14 Tage: Tmax und Tmin mit echten P10–P90- und P25–P75-Ensembleintervallen, kompakter Phasenübersicht und vollständigen Intervall-Details.
- 46 Tage und Saison öffnen und laden unabhängig. Saisonmodelle werden erst bei ausdrücklicher Auswahl abgerufen; beim Wechsel zurück werden laufende Abrufe abgebrochen.
- Ortswechsel bleiben auch bei einem vollen oder gesperrten Browserspeicher bedienbar. Der vorhandene dauerhafte Speicher-Fallback wird direkt genutzt.
- Die Favoritenleiste unterdrückt nur das doppelte Folgeereignis desselben Touch-Taps; neue Maus-/Touch-Gesten und Tastaturaktivierungen bleiben erreichbar.
- Horizontales Wischen löst keinen Ortswechsel aus. Ein Fehler kann keine dauerhafte Klicksperre mehr hinterlassen.

# MID v0.9.85.188

- Die serverseitigen MID-Widgetbilder werden automatisch nur noch viermal täglich aktualisiert statt stündlich und zusätzlich nach Releases.
- Die vier automatischen Läufe liegen gleichmäßig sechs Stunden auseinander; die geprüften Widgetprofile und das rollierende Downloadpaket bleiben unverändert.
- Ein manueller Start bleibt für Diagnose- oder Notfallzwecke verfügbar.
- Wetterdaten, Prognoselogik und Darstellung in der MID-App bleiben unverändert.

# MID v0.9.85.187

- Karten: kompakte Ortswert-Tabelle auch für DWD-WMS-Layer, gebunden an ausgewählten Lauf, Termin, Parameter und Höhe.
- Layer-Schalter, Icons und Ortsbuttons verwenden in allen Designs konsistente Light-/Dark-Farben und umbrechende Rasterlayouts.
- Gefrierender Regen und Schneeregen bleiben getrennte WMO-Phasen. Warme, feuchte Fehlprognosen werden geprüft; kalte Oberflächen, native Feuchttemperatur und Beobachtungen bleiben geschützt.
- Extremwetter leitet Eisregen nicht mehr aus Gesamtniederschlag und Kälte allein ab. Explizite gefrierende Phase erforderlich; Schneewasser wird ausgeschlossen. Routen unterscheiden Schneeregen von gefrierendem Regen.

# MID v0.9.85.186 · 06.10.2026 · Karten-Layer

- Radar und Satellit bevorzugen Modelllinien; Flächen bleiben ausdrücklich optional auswählbar.
- Isobaren werden unabhängig von einem Flächenraster gezeichnet. DWD-Linien und Windfiedern verwenden die tatsächlich angebotenen Katalogstile.
- Kartenebenen mit klareren aktiven Zuständen, gut erreichbaren Schaltern und vollständigen Quell- und Terminangaben.
- Mobile Layer-Auswahl ohne Überlappung, Radar und Satellit komplett abwählbar; einzelne Ortsbeschriftung und kompakte Favoriten bei reiner Ortsauswahl.

Intern:

- Modell-Darstellung Automatisch/Linien/Flächen persistiert; vorhandene bewusst deaktivierte Layer bleiben deaktiviert.
- Native Zwei-Punkt-Isobarensegmente unabhängig von Rastererzeugung; GeoJSON-Koordinatenreihenfolge, gleicher Lauf/Termin und bedarfsgesteuerte Daten bleiben geschützt.
- Worker-Metadaten enthalten geprüfte DWD-WMS-Stilnamen. Kein stiller Flächen-Fallback bei fehlender Linienfähigkeit; EPS-Spread ist keine Druck-Isobare.

# MID v0.9.85.185

- Das Same-Origin-DNS-Gate verwendet jetzt ausschließlich das separate Repository Secret `CLOUDFLARE_DNS_API_TOKEN` für den bestehenden `www.midwx.app`-CNAME.
- Worker-Upload, Worker-Promotion und die Same-Origin-Workers-Route verwenden weiterhin den bestehenden `CLOUDFLARE_API_TOKEN`; DNS- und Worker-Rechte bleiben damit strikt getrennt.
- Fehlt der separate DNS-Token oder besitzt er nicht die erforderliche zonenbegrenzte Berechtigung, stoppt der Release weiterhin vor Pages und Stable-Promotion. Es gibt keinen breiter berechtigten Fallback.
- Meteorologische Datenlogik und Darstellung bleiben unverändert.

# MID v0.9.85.184

- Der bestehende Webhost `www.midwx.app` wird im Release-Gate jetzt kontrolliert über Cloudflare proxied, damit der Same-Origin-Datenpfad `/api/mid-worker` tatsächlich erreichbar ist.
- Dabei bleibt der vorhandene DNS-Zielwert unverändert; MID legt keinen neuen DNS-Record an und verändert weder TLS noch andere DNS-Einträge oder Worker-Routen.
- Warnungen, ICON-D2-RUC, Radar, Satellit und die moderne Kartenbasis können damit auch in restriktiven Unternehmensnetzen über dieselbe bereits erreichbare MID-Domain geladen werden.
- Fehlen die eng begrenzten Cloudflare-DNS-Rechte oder ist der bestehende `www`-Record nicht eindeutig, stoppt die Veröffentlichung weiterhin fail-closed.

# MID v0.9.85.183

- Warnungen, ICON-D2-RUC sowie Radar- und Satellitendaten laufen im produktiven Web jetzt über denselben MID-Host statt über vom Browser direkt angesprochene Wetterdaten-Domains.
- Die moderne Kartenbasis wird in restriktiven Netzen ebenfalls über MID bereitgestellt; externe Direktpfade bleiben nur außerhalb des produktiven Webs als Plattform-/Entwicklungsfallback erhalten.
- Unter „Daten & Qualität“ zeigt eine neue Verbindungsdiagnose getrennt, ob Datendienst, Warnungen, RUC und Kartenquellen erreichbar sind.
- Die Veröffentlichung stoppt automatisch, wenn die geschützte Same-Origin-Route nicht eindeutig auf den geprüften MID-Worker zeigt oder der Health-Check dort fehlschlägt.


# MID v0.9.85.182

- Die automatische Widget-Erzeugung wiederholt einzelne fehlgeschlagene Renderings jetzt kontrolliert, statt den gesamten 12er-Satz wegen eines einmaligen Daten-Timeouts sofort abzubrechen.
- Pro Widget sind höchstens drei Render-Versuche mit erweitertem Daten-/Render-Zeitfenster zulässig; nach dem dritten Fehlschlag bleibt der Export weiterhin fail-closed.
- Widget-Inhalte, Standorte, Profile und die SharePoint-Übergabe bleiben unverändert.

# MID v0.9.85.181

- Die automatische Erzeugung der zwölf festen MID-Widget-PNGs läuft jetzt plattformübergreifend auch auf den Linux-GitHub-Runnern.
- Der Export prüft vor dem Rendern explizit auf Chrome/Chromium und bricht bei fehlendem Browser sofort mit einer klaren Fehlermeldung ab.
- Windows-/macOS-Fallbacks für Edge, Chrome und Chromium bleiben erhalten; die Widgetinhalte selbst wurden nicht verändert.

# MID v0.9.85.180

- Stark-/Dauerregenhinweise markieren die tatsächlich nasse Phase statt trockener Vor- und Nachlaufstunden rollierender Summenfenster.
- Regenhinweise nennen die Standort-Modellsumme und DWD-Schwellen; unbelegte Ensemble-Bestätigung und erfundene Wahrscheinlichkeitsbereiche entfallen.
- Zeitlücken und Mehrstundenwerte dürfen keine Stunden-Warnschwellen vortäuschen. Amtliche Warnungen und Extremwettervorschau behalten ihre eigenen Quellen und Kriterien.

# MID v0.9.85.179

- Der automatische Widget-Export startet jetzt zusätzlich direkt bei jeder erfolgreichen Promotion auf `mid-stable`.
- Dadurch werden die zwölf festen PNGs unmittelbar nach einem neuen Stable-Build neu erzeugt; Stundenplan, Release-Folge und manueller Start bleiben als Redundanz erhalten.
- Keine meteorologische Fachlogik und keine Widgetdarstellung wurden verändert.

# MID v0.9.85.178

- MID erzeugt die zwölf festen Widgets für Malatya, Kürecik und Ämari jetzt automatisch serverseitig.
- Die Widget-PNGs werden nach erfolgreichen MID-Releases und zusätzlich stündlich aus dem verifizierten Stable-Stand neu gerendert.
- Ein festes, rollierendes ZIP stellt immer den zuletzt vollständig geprüften Bildsatz mit Manifest und SHA-256-Prüfsummen bereit.
- Für Windows steht ein Downloader ohne Administratorrechte, OneDrive oder lokale Node-Installation bereit.

# MID v0.9.85.177

- Bergwetter: Die Höhenwahl allein verändert keine geografische Modellzelle mehr; Nullgrad- und Schneefallgrenzen bleiben für dieselbe atmosphärische Säule konsistent.
- Wolkenuntergrenze und lokale Kondensationshöhe werden fachlich getrennt; tiefer liegende Wolkenschichten bleiben auch bei gewählter Bergstation erhalten.
- Räumliche Unterschiede und mehrere Wolkenschichten bleiben erhalten. Fehlende Grenzhöhen und Koordinaten werden nicht zu künstlichen Nullwerten.

# MID v0.9.85.176

- Bergwetter: getrennte Tagesmaxima für Wind und Böen; fehlende Werte bleiben unbekannt.
- Dezente Wind- und Neuschneefarben in Tages-, Stunden- und Periodenansichten.
- Gleichmäßige Tablet-Spalten für Sonnenstunden; vollständige Wettertexte.
- Gemeinsame Prüfung klar warmer Gefrierregen-Prognosen mit Feuchte; kalte Böden, Beobachtungen und Grenzlagen bleiben geschützt.
- Neuschnee-Methodik transparent: Modell-Schneewasser und feste Anbieterumrechnung, getrennt von der Schneedecke.

# MID v0.9.85.175

Die festen MID-Widget-Exporte sind auf Malatya, Kürecik und Ämari (59,26°N, 24,20°E) ausgerichtet. Pro Ort werden 7 Tage Kurve mit Wind, Niederschlag, Sonne und ECMWF-Temperaturfarben sowie 5 Tage Kompakt mit Wind und ECMWF-Temperaturfarben erzeugt – jeweils in Hell und Dunkel. Die Exportautomatik erzeugt damit exakt zwölf aktuelle PNGs.

# MID v0.9.85.174

Nebel-/Dunsttexte bleiben mit den Wetterpiktogrammen konsistent. Bergwetter verwendet vorhandene Modell-Schneefallgrenzen vor der vereinfachten Höhenableitung. Temperatur und Taupunkt erreichen die bestehende Kurzfrist-Phasenprüfung.

# MID v0.9.85.173

- Wetterdaten-Veröffentlichung und Worker-Übernahme werden getrennt geprüft.
- App-Updates schützen vor einem zwischenzeitlich veralteten RUC-Datenstand.
- Automatische Wetterdatenläufe zeigen eindeutiger an, ob Daten aktuell, aufbereitet oder veröffentlicht wurden.

# MID v0.9.85.172

- Die Wetterdaten-Aufbereitung wiederholt vorübergehende DWD-Verbindungsfehler gezielt und verwirft unvollständige Modellläufe früher.
- Unterbrochene Downloads können keine unvollständigen Dateien als fertige Daten hinterlassen.
- Die bereits eingeführten Verbesserungen für Bergwetter, Widgets, Karten und schnellere Freigabeprüfungen bleiben erhalten.

# MID v0.9.85.171

- Veröffentlichungen werden weiter beschleunigt, ohne Regressionen wegzulassen: besonders zeitintensive Karten- und Bergdarstellungsprüfungen laufen im Quell-Gate nun voneinander isoliert parallel.
- Die vollständige Testabdeckung bleibt verbindlich. Der Freigabecheck wird nur grün, wenn der Kern und alle drei schweren Prüfläufe erfolgreich abgeschlossen sind.
- Produktfunktionen, Wetterlogik und Darstellung wurden mit diesem Build nicht verändert.

# MID v0.9.85.170

- Bergwetter und Widget-/PNG-Generator laden erst beim Öffnen der jeweiligen Ansicht.
- Gemeinsame Wetterdarstellung, Einstellungen und PNG-Ausgabe bleiben über alle Ansichten hinweg erhalten.
- Globale Styles werden aus einer geordneten Quelle konsolidiert geladen; redundante Deklarationen entfallen aus der Laufzeitausgabe.
- Startpaket und Stylesheet verkleinert, ohne Wetterparameter oder Bedienfunktionen zu entfernen.

# MID v0.9.85.169

- Häufige Kopfzeilen- und Favoritenaktionen auf kleinen Displays sind leichter zu treffen.
- Optionale Ansichtseinstellungen und Apple-Widget-Einstellungen laden erst beim Öffnen.
- Redundante Stilblöcke und eine ungenutzte temporäre iOS-Datei entfernt.
- Kompatible kleinere Updates für die iOS-Anbindung und den HDF5-Datenleser.

# MID v0.9.85.168

- Veröffentlichungen werden schneller, ohne Prüfungen auszulassen: sicher als read-only erkannte Regressionen können parallel laufen, risikobehaftete Prüfungen bleiben seriell.
- Unnötige vollständige Git-Historien werden im normalen Releasepfad vermieden; bei einem parallelen main-Update wird weiterhin automatisch auf die vollständige Race-Prüfung eskaliert.
- Das Pages-Paket wird bereits während der Worker-Prüfung vorbereitet, aber weiterhin erst nach erfolgreichem Worker-Gate veröffentlicht.
- Die Stable-Freigabe bleibt ein verifizierter Fast-Forward ohne Force-Update und prüft den finalen SHA weiterhin ausdrücklich.

# MID v0.9.85.167

- Eine gemeinsame Wetterkarte statt getrennter Radar-, Satelliten-, Synoptik- und Modellansichten.
- Ruhige Vektorkartenbasis mit Grenzen und Ortsnamen über den Wetterflächen; Radar, hochauflösender Satellit und Modellfelder unabhängig schaltbar.
- Direkte ICON-D2- und RADOLAN-Raster aus der Publikationsstrecke der Niederschlagssummen; weitere Modelle als bestätigte DWD-Feldkacheln statt statischer Übersichtsbilder.
- Parameter und Modelle filtern sich gegenseitig. Druckflächen, Niederschlagsfenster und Ensemble-Wahrscheinlichkeiten bleiben fachlich getrennt.
- Gemeinsame Produktzeitleiste, transparente Datenstände, lokale Rasterabfrage, Favoriten und PNG-/SVG-Rasterexport bleiben verfügbar.
- Abbrechbare Abrufe, begrenzter Feldcache und Vorladen des nächsten Termins; große Summenraster werden erst bei Bedarf geladen.
- Die neue Layerauswahl wird unmittelbar gespeichert. Die ECMWF-Farbwahlkorrektur der 7d-Vorhersage bleibt erhalten.

# MID v0.9.85.166

- Die ECMWF-Farbwahl der 7-Tage-Vorhersage wird unmittelbar gespeichert und bei Neustarts zuverlässig wiederhergestellt.
- Ältere Speicher- und Gerätestände überschreiben eine neuere Farbwahl nicht mehr.
- Die kompakten 14-/46-Tage- und Saisonansichten aus dem vorherigen Update bleiben unverändert erhalten.

# MID v0.9.85.165

## MID-C16 · kompakte Prognoseansichten
- 14-Tage-Entwicklung mit drei kurzen Phasen; fachliche Einordnung bleibt im Infohinweis verfügbar.
- Wochenvergleich für Tag 15–46 startet eingeklappt. Methodik, Modellläufe, Mitgliederzahlen und Quellen bleiben erreichbar.
- Alle Saisonmonate gleichzeitig sichtbar, ohne horizontales Scrollen; auf schmalen Displays zweizeilige Monats-/Jahreslabels.
- Witterungstrend mit konkreten Kalenderdaten an Achsen, Kopfzeile und Modellvergleich.
- Einheitliche Überschriften, Zusatztexte und Abstände für 14d, 46d und Saison; Mitgliedsanomalien bleiben in K/%.
- Responsive Gestaltung der Detailansichten in der gepflegten CSS-Quelle; keine Änderung der Prognosedaten oder Ensemblegewichtung.

# MID v0.9.85.164

- Die Skybar bleibt nach nachgeladenen RUC-/Modellkorrekturen mit der Viertelstundenprognose konsistent.
- Saison-Niederschlagsabweichungen erscheinen in Prozent zum zugehörigen Monatsmittel; Temperatur-Mitgliedskurven zeigen Abweichungen in K.
- Alle Monate bleiben auf den Zeitachsen sichtbar; kurze Monatslabels und bei Bedarf horizontales Scrollen erhalten die Lesbarkeit.
- Saisoninstrumente verwenden lesbare Monatslabels und passende Einheiten; Modellvergleiche behalten auch Quellen ohne Prozentreferenz.
- Die gespeicherte ECMWF-Farbwahl bleibt bei einem Neustart erhalten.

# MID v0.9.85.163

- Skybar und Wetter übernehmen lokale Bewölkungskorrekturen auch in der Viertelstundenreihe. Alte Modell-Sonnenscheinwerte werden bei deutlich geändertem Himmel verworfen.
- 14d-, 46d- und Saisoninstrumente mit einheitlicher Gestaltung und runden Achsenwerten.
- Saisonmonate bleiben auf kleinen Displays lesbar; beide Rauchfahnen messen ihre eigene Diagrammbreite.

# MID v0.9.85.162

MID-C15: Eigenständige Horizonte. 14 Tage mit Entwicklungsabschnitten und Tages-Temperaturbandbreite statt wiederholtem 7d-Kalender; Entwicklung, Konfidenz und Ensemble-Grafiken bleiben erhalten, Tagesdetails aufklappbar. 46d standardmäßig mit Wochenabweichungen und Unsicherheit um Null; absolute Wochenwerte bleiben umschaltbar.

Saison: zusätzliche echte SEAS5-Einzelmitgliedskurven für vollständige Kalendermonate, reale P10–P90/P25–P75-Bänder. Alle numerisch geladenen unabhängigen Saisonmodelle zusätzlich als Linien in den Haupt-Anomaliegrafiken. Keine Rauchfahnenbehauptung aus bloßen Mittelwerten. Monatsniederschlag korrekt nach tatsächlicher Monatslänge in mm/Tag normalisiert; Cache aktualisiert. Modellstreuung, Roh-Mitglieder und Klimareferenz bleiben fachlich getrennt.

# MID v0.9.85.161

MID-C15: Nachtstunden der 7d-Kurve sind wieder deutlich sichtbar, auch im Widget und PNG. Gemeinsame opake Nachtfarbe mit einmaliger Deckkraft statt unbeabsichtigter doppelter Transparenz; astronomische Grenzen und sanfte Übergänge bleiben erhalten. Dieselbe Korrektur erreicht die übrigen SVG-Nachtflächen.

Der Wetterstreifen im 12h-Diagramm unter Aktuell verwendet die volle SVG-Höhe von 16 px, wie die 90-Minuten-Ansicht. Die vier Bedeckungsstufen werden nicht mehr vertikal gestaucht; gemeinsame Zeitachse, Niederschlagszustände und Quadrateinstellung bleiben erhalten.

# MID v0.9.85.160

MID-C15: ECMWF-Temperaturfarben sind in Einstellungen wieder optional für 7d-Tageswerte und die stündliche 7d-Kurve verfügbar; Standard bleibt die 24h-Parameterpalette. Widget und PNG verwenden denselben Renderer mit ihrem vorhandenen Farbschalter. Eindeutige Gradienten-IDs verhindern Wechselwirkungen zwischen gleichzeitig sichtbaren Diagrammen.

24h-Profil und aufgeklapptes 7d-Tagesdetail verwenden einen gemeinsamen Linienvertrag für Farbe, Stärke, Strichmuster, Deckkraft und Rundung aller sieben Parameter. Der ursprüngliche 24h-Goldton für UTCI ist auch im Tagesdetail wiederhergestellt. Coverage-Pilot installiert Vite, Vitest und Coverage gemeinsam in einem isolierten Verzeichnis, ohne MID-Lockfile oder Release-Gates zu verändern.

# MID v0.9.85.159

MID-C15: Widget-Kurvenübersicht mit echtem stündlichem Temperaturensemble P25–P75 wie in der App. Gemeinsame astronomische Nachtflächen einschließlich Skybar, gemeinsame Skybar-Einstellung auch im Widget und URL-Export. Abruf beim Öffnen der Kurvenansicht; URL-Export wartet auf den Ensembleabruf. Fehlende Mitglieder erzeugen kein künstliches Band.

90-Minuten-Skybar: dieselbe gerenderte Dicke der vier Bedeckungsstufen wie im 24h-Profil; Schwellen und Viertelstunden bleiben unverändert. Vitest-/Coverage-Pilot unter Node 22/npm 10 mit explizit gepinntem Vite-Peer reproduzierbar ausführbar.

# MID v0.9.85.158

MID-C15: 7d-Temperaturkurve, Tageswerte und Legende verwenden nun die sichtbaren Parameterfarben des 24h-Diagramms. Tmin blau, Tmax rot; keine abweichende wertabhängige Palette in der Tagesübersicht. Wind grün, Böen ohne Warnstufe oliv, Niederschlagssymbol und Wahrscheinlichkeit blau. Bestehende Warnfarben bleiben erhalten.

# MID v0.9.85.157

- Die aufgeklappte 7-Tage-Tagesansicht verwendet nun für UTCI dieselbe Parameterfarbe wie das 24-Stunden-Profil; Linie, Auswahlpunkt und Legende bleiben einheitlich in Hell, Dunkel und Kontrast.
- Der Coverage-Workflow führt die Unit-Tests nur noch einmal mit Coverage aus. Alle Release-Sicherungen und vorhandenen Regressionen bleiben erhalten.
- Code-, Workflow- und Regressionsaudit mit dokumentierten Folgearbeiten.

# MID v0.9.85.161

MID-C15: Nachtstunden der 7d-Kurve sind wieder deutlich sichtbar, auch im Widget und PNG. Gemeinsame opake Nachtfarbe mit einmaliger Deckkraft statt unbeabsichtigter doppelter Transparenz; astronomische Grenzen und sanfte Übergänge bleiben erhalten. Dieselbe Korrektur erreicht die übrigen SVG-Nachtflächen.

Der Wetterstreifen im 12h-Diagramm unter Aktuell verwendet die volle SVG-Höhe von 16 px, wie die 90-Minuten-Ansicht. Die vier Bedeckungsstufen werden nicht mehr vertikal gestaucht; gemeinsame Zeitachse, Niederschlagszustände und Quadrateinstellung bleiben erhalten.

# MID v0.9.85.160

MID-C15: ECMWF-Temperaturfarben sind in Einstellungen wieder optional für 7d-Tageswerte und die stündliche 7d-Kurve verfügbar; Standard bleibt die 24h-Parameterpalette. Widget und PNG verwenden denselben Renderer mit ihrem vorhandenen Farbschalter. Eindeutige Gradienten-IDs verhindern Wechselwirkungen zwischen gleichzeitig sichtbaren Diagrammen.

24h-Profil und aufgeklapptes 7d-Tagesdetail verwenden einen gemeinsamen Linienvertrag für Farbe, Stärke, Strichmuster, Deckkraft und Rundung aller sieben Parameter. Der ursprüngliche 24h-Goldton für UTCI ist auch im Tagesdetail wiederhergestellt. Coverage-Pilot installiert Vite, Vitest und Coverage gemeinsam in einem isolierten Verzeichnis, ohne MID-Lockfile oder Release-Gates zu verändern.

# MID v0.9.85.159

MID-C15: Widget-Kurvenübersicht mit echtem stündlichem Temperaturensemble P25–P75 wie in der App. Gemeinsame astronomische Nachtflächen einschließlich Skybar, gemeinsame Skybar-Einstellung auch im Widget und URL-Export. Abruf beim Öffnen der Kurvenansicht; URL-Export wartet auf den Ensembleabruf. Fehlende Mitglieder erzeugen kein künstliches Band.

90-Minuten-Skybar: dieselbe gerenderte Dicke der vier Bedeckungsstufen wie im 24h-Profil; Schwellen und Viertelstunden bleiben unverändert. Vitest-/Coverage-Pilot unter Node 22/npm 10 mit explizit gepinntem Vite-Peer reproduzierbar ausführbar.

# MID v0.9.85.158

MID-C15: 7d-Temperaturkurve, Tageswerte und Legende verwenden nun die sichtbaren Parameterfarben des 24h-Diagramms. Tmin blau, Tmax rot; keine abweichende wertabhängige Palette in der Tagesübersicht. Wind grün, Böen ohne Warnstufe oliv, Niederschlagssymbol und Wahrscheinlichkeit blau. Bestehende Warnfarben bleiben erhalten.

# MID v0.9.85.157

- Die aufgeklappte 7-Tage-Tagesansicht verwendet nun für UTCI dieselbe Parameterfarbe wie das 24-Stunden-Profil; Linie, Auswahlpunkt und Legende bleiben einheitlich in Hell, Dunkel und Kontrast.
- Der Coverage-Workflow führt die Unit-Tests nur noch einmal mit Coverage aus. Alle Release-Sicherungen und vorhandenen Regressionen bleiben erhalten.
- Code-, Workflow- und Regressionsaudit mit dokumentierten Folgearbeiten.

# MID v0.9.85.160

MID-C15: ECMWF-Temperaturfarben sind in Einstellungen wieder optional für 7d-Tageswerte und die stündliche 7d-Kurve verfügbar; Standard bleibt die 24h-Parameterpalette. Widget und PNG verwenden denselben Renderer mit ihrem vorhandenen Farbschalter. Eindeutige Gradienten-IDs verhindern Wechselwirkungen zwischen gleichzeitig sichtbaren Diagrammen.

24h-Profil und aufgeklapptes 7d-Tagesdetail verwenden einen gemeinsamen Linienvertrag für Farbe, Stärke, Strichmuster, Deckkraft und Rundung aller sieben Parameter. Coverage-Pilot installiert Vite, Vitest und Coverage gemeinsam in einem isolierten Verzeichnis, ohne MID-Lockfile oder Release-Gates zu verändern.

# MID v0.9.85.159

MID-C15: Widget-Kurvenübersicht mit echtem stündlichem Temperaturensemble P25–P75 wie in der App. Gemeinsame astronomische Nachtflächen einschließlich Skybar, gemeinsame Skybar-Einstellung auch im Widget und URL-Export. Abruf beim Öffnen der Kurvenansicht; URL-Export wartet auf den Ensembleabruf. Fehlende Mitglieder erzeugen kein künstliches Band.

90-Minuten-Skybar: dieselbe gerenderte Dicke der vier Bedeckungsstufen wie im 24h-Profil; Schwellen und Viertelstunden bleiben unverändert. Vitest-/Coverage-Pilot unter Node 22/npm 10 mit explizit gepinntem Vite-Peer reproduzierbar ausführbar.

# MID v0.9.85.158

MID-C15: 7d-Temperaturkurve, Tageswerte und Legende verwenden nun die sichtbaren Parameterfarben des 24h-Diagramms. Tmin blau, Tmax rot; keine abweichende wertabhängige Palette in der Tagesübersicht. Wind grün, Böen ohne Warnstufe oliv, Niederschlagssymbol und Wahrscheinlichkeit blau. Bestehende Warnfarben bleiben erhalten.

# MID v0.9.85.157

- Die aufgeklappte 7-Tage-Tagesansicht verwendet nun für UTCI dieselbe Parameterfarbe wie das 24-Stunden-Profil; Linie, Auswahlpunkt und Legende bleiben einheitlich in Hell, Dunkel und Kontrast.
- Der Coverage-Workflow führt die Unit-Tests nur noch einmal mit Coverage aus. Alle Release-Sicherungen und vorhandenen Regressionen bleiben erhalten.
- Code-, Workflow- und Regressionsaudit mit dokumentierten Folgearbeiten.

# MID v0.9.85.159

MID-C15: Widget-Kurvenübersicht mit echtem stündlichem Temperaturensemble P25–P75 wie in der App. Gemeinsame astronomische Nachtflächen einschließlich Skybar, gemeinsame Skybar-Einstellung auch im Widget und URL-Export. Abruf beim Öffnen der Kurvenansicht; URL-Export wartet auf den Ensembleabruf. Fehlende Mitglieder erzeugen kein künstliches Band.

90-Minuten-Skybar: dieselbe gerenderte Dicke der vier Bedeckungsstufen wie im 24h-Profil; Schwellen und Viertelstunden bleiben unverändert. Vitest-/Coverage-Pilot unter Node 22/npm 10 mit explizit gepinntem Vite-Peer reproduzierbar ausführbar.

# MID v0.9.85.158

MID-C15: 7d-Temperaturkurve, Tageswerte und Legende verwenden nun die sichtbaren Parameterfarben des 24h-Diagramms. Tmin blau, Tmax rot; keine abweichende wertabhängige Palette in der Tagesübersicht. Wind grün, Böen ohne Warnstufe oliv, Niederschlagssymbol und Wahrscheinlichkeit blau. Bestehende Warnfarben bleiben erhalten.

# MID v0.9.85.157

- Die aufgeklappte 7-Tage-Tagesansicht verwendet nun für UTCI dieselbe Parameterfarbe wie das 24-Stunden-Profil; Linie, Auswahlpunkt und Legende bleiben einheitlich in Hell, Dunkel und Kontrast.
- Der Coverage-Workflow führt die Unit-Tests nur noch einmal mit Coverage aus. Alle Release-Sicherungen und vorhandenen Regressionen bleiben erhalten.
- Code-, Workflow- und Regressionsaudit mit dokumentierten Folgearbeiten.

# MID v0.9.85.158

MID-C15: 7d-Temperaturkurve, Tageswerte und Legende verwenden nun die sichtbaren Parameterfarben des 24h-Diagramms. Tmin blau, Tmax rot; keine abweichende wertabhängige Palette in der Tagesübersicht.

# MID v0.9.85.157

- Die aufgeklappte 7-Tage-Tagesansicht verwendet nun für UTCI dieselbe Parameterfarbe wie das 24-Stunden-Profil; Linie, Auswahlpunkt und Legende bleiben einheitlich in Hell, Dunkel und Kontrast.
- Der Coverage-Workflow führt die Unit-Tests nur noch einmal mit Coverage aus. Alle Release-Sicherungen und vorhandenen Regressionen bleiben erhalten.
- Code-, Workflow- und Regressionsaudit mit dokumentierten Folgearbeiten.

# MID v0.9.85.157

- Die aufgeklappte 7-Tage-Tagesansicht verwendet nun für UTCI dieselbe Parameterfarbe wie das 24-Stunden-Profil; Linie, Auswahlpunkt und Legende bleiben einheitlich in Hell, Dunkel und Kontrast.
- Der Coverage-Workflow führt die Unit-Tests nur noch einmal mit Coverage aus. Alle Release-Sicherungen und vorhandenen Regressionen bleiben erhalten.
- Code-, Workflow- und Regressionsaudit mit dokumentierten Folgearbeiten.

# MID v0.9.85.156

- Vorhinweise bleiben auf Tag 3–7 begrenzt. Böen erhalten hinter dem kürzeren ICON-Horizont eine getrennte ECMWF-Ensembleergänzung, sofern ein vollständiges Tagesfenster verfügbar ist.
- Fertig berechnete regionale Ausblicke werden auch nach einem Neustart des Datendienstes wiederverwendet. Bei einem Ausfall bleibt ein höchstens 24 Stunden alter Stand ausdrücklich als veraltet gekennzeichnet.
- Die Fehlermeldung unterscheidet ein ausgeschöpftes Tageskontingent von einem nicht verfügbaren Ersatzabruf.
- Die 7-Tage-Diagramme übernehmen das Farbkonzept der 24-Stunden-Ansicht.

# MID v0.9.85.155

- Der Extremwetter-Ausblick „Vorhinweise · Tag 3–7“ wertet jetzt die tatsächlich verfügbaren ICON-EPS-Ensemblemitglieder aus. Leere Streuungsfelder blockieren den gesamten Ausblick nicht mehr.
- Regen und Schnee bleiben über vollständige Tagesfenster auswertbar. Böen werden ausschließlich für Zeiträume mit vollständigen Modelldaten bewertet; fehlende Böenwerte erscheinen ausdrücklich als Datenlücke.
- Die Änderungen aus den parallel veröffentlichten Versionen .153 und .154 bleiben erhalten.

# MID v0.9.85.154

- Der Extremwetter-Ausblick „Vorhinweise · Tag 3–7“ bleibt auch dann nutzbar, wenn der zentrale Wetterdatenweg vorübergehend sein Tageslimit erreicht: MID wechselt kontrolliert auf die gleiche ICON-EPS-Berechnung direkt im Browser.
- Der letzte vollständige Langfristausblick kann bei einer vorübergehenden Störung weiter angezeigt werden, statt eine Datenlücke wie Entwarnung wirken zu lassen.
- Die Langfristdaten werden deutlich länger zwischengespeichert. Das reduziert unnötige externe Abrufe, ohne Warnschwellen oder die meteorologische Bewertungslogik zu verändern.

# MID v0.9.85.153

- Der zusätzliche lange Erklärungstext auf der Warnungsseite wurde wieder entfernt; Warnstatus, amtliche Warnungen, MID-Hinweise und Ereignis-Timeline bleiben die primären Informationsebenen.
- Der neue Extremwetterbereich „Vorhinweise · Tag 3–7“ verwendet den Bereichsparameter wieder korrekt und bricht nicht mehr wegen eines undefinierten URL-Bezeichners ab.
- Technische JavaScript-/Worker-Fehler werden im Extremwetter-Ausblick nicht mehr als Rohtext angezeigt; bei einer echten Quellenstörung erscheint eine verständliche, neutrale Fehlermeldung mit erneutem Ladeversuch.

# MID v0.9.85.152

- Der Wetterstreifen im 24-h-Profil behält die Viertelstunden der Kurzfrist bei, damit wechselnde Bewölkung und Sonne zur 90-min-Ansicht passen.
- Fehlende Kurzfristwerte fallen auf die Stundenprognose zurück und werden nicht mehr als Nullwerte behandelt.
- Die optionalen Stundenquadrate behalten ihre stündliche Auflösung.

# MID v0.9.85.151

- MID-Prognosehinweise im Warnzentrum bis sieben Tage; ab 48 Stunden Vorhinweise, ab Tag 6 Gefahrenausblick.
- Extremwetter: zusätzliche Auswahl Tag 3–7 mit regionalem ICON-EPS-Potenzial für Regen, Sturm und Schnee.
- Amtliche Vorabinformationen bleiben kenntlich; fehlende Langfristdaten werden nicht als Entwarnung dargestellt.

# MID v0.9.85.150

- Die mobile Hauptnavigation erhält auf iPhone/iPad eine gesonderte Verankerung am sichtbaren unteren Bildschirmrand, damit sie nach Scroll- und Tastaturänderungen nicht in die Seitenmitte wandert.
- Safe-Area-Abstand, fünf Navigationstasten und die bisherige Tablet-/Desktop-Navigation bleiben erhalten.
- Browserprüfungen kontrollieren zusätzlich den tatsächlichen unteren Rand, Scroll-Rückkehr, Größenänderungen und veraltete iOS-Viewport-Offsets.

# MID v0.9.85.149

- Beide Karten-Farbskalen verwenden gut lesbare, nach außen gerundete Grenzen in der ausgewählten Einheit; Raster, Legende und Export bleiben deckungsgleich.
- Antippen einer direkten Modell- oder Niederschlagskarte zeigt den geprüften Rasterwert kurzzeitig an. Die Anzeige schließt automatisch, beim Bewegen der Karte, per Außenklick, Escape oder Schließen.
- Unterstützte DWD-WMS-Karten liefern geprüfte Ortswerte für den gewählten Termin, Modelllauf und die gewählte Höhe; nicht verfügbare Werte werden nicht geschätzt.
- Eine zusätzliche Mittelpunkt-Abfrage ermöglicht die Bedienung per Tastatur; Datenlücken bleiben ausdrücklich ohne Wert.
- Favoriten-Auswahl und Export-Rückmeldung sind in den Kartenansichten vereinheitlicht.

# MID v0.9.85.148

- Modellkarten verwenden die gewählte Windeinheit konsistent in Ortswerten, Farblegenden und PNG-/SVG-Exporten.
- Direkte DWD-Karten und Niederschlagssummen erhalten kontinuierliche Farbverläufe und eine an den tatsächlichen Wertebereich angepasste Kontrastdarstellung.
- Eine feste Vergleichsskala bleibt auswählbar und wird für Animationen verwendet; Wettercodes sowie fehlende und trockene Rasterpunkte behalten ihre eigene Bedeutung.
- Die parallel vorbereitete Navigation bleibt auch innerhalb transformierter Dashboard-Flächen fest am Viewport; Smartphone-, Tablet- und Desktop-Stile bleiben erhalten.

# MID v0.9.85.147

- Die mobile Bottom-Bar bleibt beim Scrollen stabil an ihrer Position und wechselt nicht mehr in einen scrollabhängigen Verschiebezustand.
- Die Modellkarten zeigen Modell, Produktfamilie, Quelle und Analyse-/Vorhersagestatus in einer klareren Kopfzeile.
- Ältere DWD-WMS-/Rasterkarten erhalten dieselbe ruhige, responsive Bedienhierarchie wie die neueren Niederschlags- und Direktkarten.

# MID v0.9.85.146

- „Untergang“ bleibt in der Sonne-/Mond-Kachel auch auf schmalen Displays vollständig in einer Zeile.
- Die Bergwetter-Stundentabelle passt ihre Breite an die tatsächlich verfügbaren Uhrzeitspalten an; große Leerflächen zwischen Feldnamen und erster Uhrzeit entfallen.
- Das Stundenraster bleibt bei tatsächlichem Überlauf horizontal scrollbar; ohne Überlauf wird kein künstlicher Leerraum erzeugt.

# MID v0.9.85.145

- Kleine Niederschlagsmengen wie <0,1 mm bleiben in den 7-/14-Tage-Ansichten vollständig lesbar.
- Dezente Spannengrenzen erscheinen ohne P25/P75-Kürzel vor den Zahlen; Einheiten und echte Ensemble-Mediane bleiben erhalten.
- 7 Tage verbindet Tmin/Tmax in einer kompakten gemeinsamen Temperaturdarstellung; 14 Tage betont langfristige Ensemble-Spannen und Trends.

# MID v0.9.85.144

- Die 7-Tage-Temperaturgrafik zeigt den P25–P75-Bereich auch über die ganze Woche, sobald tatsächliche stündliche Mitgliederdaten vorliegen. Datenlücken bleiben erkennbar.
- Der 7-Tage-Trend berücksichtigt den Regenbeginn am Tag auch bei anschließender nasser Nacht.
- Dezente Zahlen ordnen die Unsicherheitsbalken für Temperatur, Niederschlag und Böen ein.
- Die direkte DWD-Kartenaufbereitung behandelt relative Feuchte oberhalb der Sättigung korrekt, sodass die bisherigen ICON-D2-Karten wieder gemeinsam mit den Summenkarten bereitgestellt werden können.

# MID v0.9.85.143

- Kurzfrist-Hinweis entfernt; Unsicherheitsbänder deutlich kompakter.
- Echte Ensemble-Mediane statt gemischter Einzelwert-/Mittelwertmarker; Böen statt Mittelwind, Tmax/Tmin getrennt gefärbt.
- Stündliches Temperatur-P25–P75-Band nur mit verfügbaren echten Quantilen; künstlicher Halo entfällt. Niederschlagsnullwert als 0.

# MID v0.9.85.142

- Vollständige neue ICON-D2-Kartenraster verlustfrei verdichtet: deutlich weniger Speicher und Downloadvolumen bei unveränderten Werten und unveränderter Auflösung.
- Das kostenlose 900-MB-Datenbudget bleibt verbindlich. Größen- und SHA256-Prüfung erfolgen auch für komprimierte Felder; ältere Safari/WebViews erhalten einen kompatiblen Decoder.
- Enthält die Wetterkarten-, Messsummen- und parameterbezogenen Prognosespannen aus .141.

# MID v0.9.85.141

- Wetterkarten: gefallener Niederschlag aus DWD RADOLAN RW für vollständige 1-/6-/12-/24-/48-h-Fenster; fehlende Messzellen bleiben grau und unbekannt.
- Direkte ICON-D2-Raster für Temperatur, Wind, Böen, Bewölkung, Druck, ThetaE, Wettercode und einstündlichen Niederschlag: bestätigte Modelltermine, Favoritenwerte, PNG-/SVG-Export.
- Parameterweise P10–P90-/P25–P75-Bänder in 7-/14-Tage-Prognosen, mit vergleichbaren Skalen und ausgewählter Windeinheit. Keine erfundenen Stunden- oder Parameterintervalle.
- Niederschlagsnull kompakt als 0; kleine positive Mengen bleiben als Spurenwerte erkennbar.
- Drei nicht mehr im DWD-WMS-Katalog verfügbare Wettercodekarten werden nicht mehr angeboten. Andere regionale/globale WMS-Karten bleiben erhalten.

# MID v0.9.85.140

- Niederschlagsphasen kompakt mit Zeitspannen, Radar und Modellfortsetzung klar gekennzeichnet.
- Radar-Nowcast: kompakte Summe, getrennte Hinweise und Achsen; gegen geerbte Pillenregeln abgesichert.
- Bright-Sky-RV-Import korrigiert: aktuelle Quellkennung wird erkannt statt verworfen.
- Vollständige native DWD-RV-Fünfminutenreihen über Bright Sky bleiben unabhängig vom WMS-Diagnoseweg erhalten. Zusätzliche Beobachtungen dienen bei diesen Reihen als Kontrollabgleich.

# MID v0.9.85.142

- Vollständige neue ICON-D2-Kartenraster verlustfrei verdichtet: deutlich weniger Speicher und Downloadvolumen bei unveränderten Werten und unveränderter Auflösung.
- Das kostenlose 900-MB-Datenbudget bleibt verbindlich. Größen- und SHA256-Prüfung erfolgen auch für komprimierte Felder; ältere Safari/WebViews erhalten einen kompatiblen Decoder.
- Enthält die Wetterkarten-, Messsummen- und parameterbezogenen Prognosespannen aus .141.

# MID v0.9.85.141

- Wetterkarten: gefallener Niederschlag aus DWD RADOLAN RW für vollständige 1-/6-/12-/24-/48-h-Fenster; fehlende Messzellen bleiben grau und unbekannt.
- Direkte ICON-D2-Raster für Temperatur, Wind, Böen, Bewölkung, Druck, ThetaE, Wettercode und einstündlichen Niederschlag: bestätigte Modelltermine, Favoritenwerte, PNG-/SVG-Export.
- Parameterweise P10–P90-/P25–P75-Bänder in 7-/14-Tage-Prognosen, mit vergleichbaren Skalen und ausgewählter Windeinheit. Keine erfundenen Stunden- oder Parameterintervalle.
- Niederschlagsnull kompakt als 0; kleine positive Mengen bleiben als Spurenwerte erkennbar.
- Drei nicht mehr im DWD-WMS-Katalog verfügbare Wettercodekarten werden nicht mehr angeboten. Andere regionale/globale WMS-Karten bleiben erhalten.

# MID v0.9.85.140

- Niederschlagsphasen kompakt mit Zeitspannen, Radar und Modellfortsetzung klar gekennzeichnet.
- Radar-Nowcast: kompakte Summe, getrennte Hinweise und Achsen; gegen geerbte Pillenregeln abgesichert.
- Bright-Sky-RV-Import korrigiert: aktuelle Quellkennung wird erkannt statt verworfen.
- Vollständige native DWD-RV-Fünfminutenreihen über Bright Sky bleiben unabhängig vom WMS-Diagnoseweg erhalten. Zusätzliche Beobachtungen dienen bei diesen Reihen als Kontrollabgleich.

# MID v0.9.85.140

- Niederschlagsphasen kompakt mit Zeitspannen, Radar und Modellfortsetzung klar gekennzeichnet.
- Radar-Nowcast: kompakte Summe, getrennte Hinweise und Achsen; gegen geerbte Pillenregeln abgesichert.
- Vollständige native DWD-RV-Fünfminutenreihen über Bright Sky bleiben unabhängig vom WMS-Diagnoseweg erhalten. Zusätzliche Beobachtungen dienen bei diesen Reihen als Kontrollabgleich.

# MID v0.9.85.139

## Radar-Nowcast und sichtbare Vorhersagespannen

- Radar-Balken und der unsichtbare Auswahlanker sind Grafikmarkierungen statt Buttons. Globale Touch-Mindesthöhen können Mengenunterschiede nicht mehr verdecken. Die gesamte Zeitachse bleibt per Berührung und Tastatur bedienbar.
- Ein kompakter nativer DWD-RV-Abruf über Bright Sky liefert Fünfminutenwerte ohne Ausdünnung. Einheiten, Referenzlauf, Aktualität und fehlende Werte werden geprüft; der direkte DWD-Pfad bleibt als Reserve erhalten. Fehlende Daten werden nicht interpoliert oder als trocken bilanziert.
- Summen, Hinweise, Achsen und Jetzt-Markierung erhalten ein abschließendes, eng begrenztes Layout. Auswahlanker werden auf einen unsichtbaren Pixel begrenzt.
- 7- und 14-Tage-Übersichten zeigen verfügbare P10–P90-Modellspannen für Tageshöchsttemperatur und Niederschlag. Das Temperaturband markiert zusätzlich P25–P75 und den angezeigten Wert auf einer gemeinsamen Skala. Fehlende Ensemblewerte erzeugen keine erfundenen Spannen.
- Eine aufklappbare Erklärung trennt Modellübereinstimmung von Trefferwahrscheinlichkeit und erläutert den zunehmenden Stellenwert von Tendenzen.

## Prüfung

- Basis: `main == mid-stable == 72c19e18f48cc9997d3ad65c69e3b00d8d723bf4` (v0.9.85.138).
- Neue Pflichtregression prüft native Einheiten, 24 Prognoseintervalle, Summen, Referenzläufe, fehlende/veraltete Werte und echte Mengenunterschiede.
- Im CI werden zusätzlich echte Browserprüfungen mit vollständiger CSS-Kaskade auf sechs Displaygrößen in Hell und Dunkel ausgeführt.
- UTCI-, Quellen-, Niederschlagsintervall- und gemeinsame Modellkartenänderungen aus .138 bleiben erhalten.

Native Quelle: https://github.com/jdemaeyer/brightsky/issues/144 und https://github.com/jdemaeyer/brightsky/blob/master/brightsky/query.py. Pixelwerte sind 0,01 mm/5 min; Prognosen werden nur aus dem neuesten frischen RV-Referenzlauf übernommen. Die verwendete öffentliche API benötigt keinen kostenpflichtigen Schlüssel. DWD-Daten und Bright-Sky-Bereitstellung werden in der Herkunft getrennt angegeben.

# MID v0.9.85.138

## Radarintensität, konsistente Niederschlagsstufen und UTCI appweit

- Die 5-Minuten-Balken des Radar-Nowcasts folgen jetzt der tatsächlichen DWD-RV-Intensität des jeweiligen Zeitschritts. Unterschiedlich starker Niederschlag wird deshalb wieder durch unterschiedlich hohe Balken sichtbar; Datenlücken bleiben ausdrücklich schraffiert und werden nicht als trocken interpretiert.
- Die Radar-y-Achse zeigt Maximum, halbe Skala und Null gleichmäßig am selben Raster wie die Balken. Die Einheit bleibt fachlich eindeutig mm/5 min.
- Niederschlagsangaben verwenden appweit dieselbe zentrale WMO-/DWD-basierte Intensitätsklassifikation. Angezeigte Rate und Textstufe stammen aus demselben Intervall; 1,9 mm/h Dauerregen wird beispielsweise als „mäßig“ eingeordnet.
- UTCI (Universal Thermal Climate Index) ist nun der kanonische Index für die gefühlte Außentemperatur in Aktuell, Kurzfrist, 24-h-Profil/Cockpit, Event- und Wassersportansichten sowie Bergwetter. Temperatur, Feuchte, Wind und Strahlungseinfluss werden gemeinsam berücksichtigt; die sichtbaren Belastungsstufen folgen den Standard-UTCI-Klassen.
- Wo keine direkte mittlere Strahlungstemperatur verfügbar ist, schätzt MID sie transparent aus Tageszeit, Bewölkung, UVI und Höhe. Unbrauchbare Eingangsdaten erzeugen keinen erfundenen UTCI-Wert.

# MID v0.9.85.137

## DWD-Radar im Fünfminutentakt und gemeinsame Modellkarten

- DWD GetFeatureInfo wertet RV_ANALYSIS, RV_FORECAST und RV_PREDICTION als native mm/5 min aus und normalisiert korrekt nach mm/h. Die bisher nicht erkannten numerischen Bandwerte verursachten Lücken zwischen den ausgedünnten Kartenbildern. Der bestehende kostenlose DWD-Pfad bleibt erhalten.
- Native Fünfminutenintervalle erhalten explizite Start-/Endzeiten. Die Forecast-Fusion zählt bei 15 Minuten genau drei native Intervalle. Lücken werden weder verbreitert noch als trocken interpretiert oder über RS-Mengenanker aufgefüllt.
- Die sichtbare Summe verwendet die tatsächlich verfügbaren zentralen, final kalibrierten Mengen eines ausdrücklich angegebenen 120-Minuten-Fensters. Nur 24 gültige Schritte ergeben eine vollständige Zweistundensumme und Ensemble-Spanne; ansonsten stehen Teilsumme, auswertbare Minuten und Datenlückenhinweis im Vordergrund. Frühere Summen bei Lücken sind nicht als vollständige Zweistundensummen belastbar.
- Unter Karte bleiben zwei Einstiege: Radar/Satellit/Blitz und Modellkarten. Niederschlagssummen sind ein ICON-D2-Kartenprodukt innerhalb der gemeinsamen, nach Wetterparameter gruppierten Auswahl. Alte Summen-Einstiege und gespeicherte Auswahl werden migriert; Favoriten, Zeitfenster und PNG-/SVG-Downloads bleiben erhalten.
- Kostenlose Natural-Earth-Grenzen (Public Domain) liegen über sämtlichen Modellfeldern. Ländergrenzen immer, Bundesländer ab Zoom 4,8 und kollisionsgeprüfte Ortsnamen ab Zoom 5,7. Bundeslandgrenzen sind auch im PNG-/SVG-Export sichtbar. Auf Smartphones sind die Auswahlfelder mindestens 44 px hoch.
- Neue funktionale Regression prüft Datenfeld/Einheit, 37 Fünfminutenabfragen, Intervallgrenzen, vollständige/partielle Mengen, RS-Lückenschutz, Intervallfusion, Navigationmigration und Zoomstufen. Betroffene historische Oberflächentests werden wegen der ausdrücklich gewünschten Zusammenführung und korrigierten Summenbasis angepasst; alle übrigen Assertions bleiben erhalten.

# MID v0.9.85.136

## ICON-D2-Abgrenzung und konsolidierte Regressionen

- Extremwetter-Ausblick: Außenbereich der gekrümmten ICON-D2-Modellabdeckung dunkel eingefärbt; Grenzpolygon entspricht exakt der bestehenden Analyse. Dunkler Bereich in der Kartenlegende erklärt, unabhängig von Hazard-Auswahl, Zeitraum und temporären Datenlücken.
- Alle 894 Regressionen bleiben unverändert wirksam. Automatische Dateierkennung und beide Baseline-Pflichtlisten werden jetzt als vollständige identische Inventare geprüft; fehlende, veraltete und doppelte Registrierungen brechen die Suite ab.
- Ein gemeinsamer Runner meldet Fortschritt, Gesamtdauer und langsamste Prüfungen; Fehler enthalten weiter die vollständige Ausgabe. MID_REGRESSION_VERBOSE=1 zeigt auch erfolgreiche Einzelausgaben. Ausführung bleibt isoliert und seriell, damit gemeinsam verwendete Artefakte keine Rennen verursachen.
- Neue Regression schützt die identische Modellgeometrie sowie positive und negative Fälle der Testregistrierung. Keine bestehenden Assertions entfernt, keine zusätzlichen Kosten oder Datenquellen.

# MID v0.9.85.135

## Unveränderliche DWD-Karten-Snapshots

- Niederschlagssummen aus ICON-D2 erhalten eine eigene, vom tatsächlichen Datei-Hash abgeleitete Objektadresse innerhalb des bestehenden RUC-/Pages-Manifests.
- Ein neuer ICON-D2-Lauf oder eine Wiederholung der Aufbereitung kann dadurch keine bereits gecachte Raster-URL überschreiben, auch wenn der RUC-Lauf unverändert bleibt.
- Die Auswahl des aktuellen Kartenobjekts lädt das DWD-Manifest mit einer frischen Anfrage, damit ein Browser-/CDN-Cache keinen alten Lauf festhält.
- Snapshot-Erhalt, Kartenansicht, Favoriten, PNG-/SVG-Downloads und alle Änderungen aus v0.9.85.134 bleiben erhalten. Kein zusätzlicher Anbieter oder Workflow; bestehende kostenlose DWD-Pipeline.
- Regression prüft zwei unterschiedliche ICON-D2-Läufe bei identischem RUC-Lauf und verschiedene unveränderliche Objektadressen.

# MID v0.9.85.134

## Gemeinsamer Kartenbereich und echte DWD-Niederschlagssummen

- „Karte“ bündelt Radar/Satellit/Blitz, Modellkarten und Niederschlagssummen. Bestehende Wetterkarten-Einstiege öffnen weiterhin die Modellkarten; Radartimeline und Echo-/ETA-Markierungen bleiben erhalten.
- Direkte kostenfreie DWD-ICON-D2-TOT_PREC-Raster für 6/12/24/48 Stunden ab Laufstart, geprüft auf denselben Lauf, Einheiten, Rasterabdeckung und akkumulierte Endfelder. Keine Verlängerung der 14-Stunden-RUC-Daten.
- Deutschlandausschnitt, einheitliche mm-Farbskala, Favoritenwerte am nächsten DWD-Rasterpunkt, Kartenmaximum und tatsächlicher Gültigkeitszeitraum. PNG-/SVG-Download mit Legende, Favoriten, Quellen- und Lizenzangaben; auf unterstützten Mobilgeräten als Datei teilbar.
- Der vorhandene kostenlose DWD-/Pages-Prozess veröffentlicht die zusätzlichen Raster als geprüfte unveränderliche Objekte; App-Releases erhalten sie über den bestehenden Snapshot-Restore.
- Veraltete, unvollständige oder fehlende Raster werden nicht angezeigt oder exportiert. Die zusätzliche Karte wird erst nach erfolgreicher DWD-Aufbereitung freigegeben.
- Redundante Standort-Kartenbox entfernt. Die Änderungen und Zeitsteuerungen der veröffentlichten v0.9.85.131–.133 bleiben erhalten.

## Quellen und Kosten

DWD Open Data (CC BY 4.0), OpenStreetMap (ODbL 1.0), Natural Earth (Public Domain). Kein kostenpflichtiger Kartenanbieter, kein zusätzlicher API-Key und keine Bright-Sky-Abhängigkeit. Bright Sky ist eine kostenlose DWD-API, ersetzt jedoch keine vollständige ICON-D2-GRIB-Rasterschnittstelle; unbegrenzte Verfügbarkeit wird nicht zugesichert.

# MID v0.9.85.133

## Niederschlag und Kurzfrist
- Radar-Zeitschritte, die technisch nicht ausgewertet werden konnten, werden nicht mehr als trockene 5-Minuten-Phasen dargestellt.
- Die Niederschlagsaussage oberhalb des Radar-Nowcasts berücksichtigt nun den gesamten 24-h-Prognoseverlauf und mehrere Niederschlagsphasen statt nur des ersten zusammenhängenden Abschnitts.
- Niederschlagsart und -intensität werden intervallgerecht bewertet: 15-Minuten-Mengen werden auf ihre tatsächliche Dauer bezogen. Ein hoher 15-Minuten-Wert kann deshalb nicht mehr als „leichter Sprühregen“ erscheinen.
- Frische lokale Niederschlagsbeobachtungen können die Niederschlagsart in der unmittelbaren Kurzfrist stützen, damit beobachtete Schauer nicht sofort durch einen widersprüchlichen Modellcode verdrängt werden.

## Pollenflug
- „Heute“ wird jetzt über das tatsächliche lokale Datum bestimmt; gestrige DWD-Zeilen können nicht mehr als heutige Prognose erscheinen.
- Angezeigt wird nach Möglichkeit der fachliche DWD-Produktstand statt lediglich der technischen Abrufzeit.
- Der Pollenabruf wird rund um Produktaktualisierungen schneller erneuert.

## Navigation
- Beim Neustart ist der zuletzt gewählte Hauptbereich maßgeblich. Ein veralteter Unterbereich darf ihn nicht mehr auf „Vorhersage“ zurücksetzen.
- Forecast-Horizon-Ereignisse dürfen nur innerhalb des tatsächlich aktiven Prognosebereichs persistieren.

# MID v0.9.85.132

## Niederschlag · einheitliche Zeitangaben
- Aussagen wie „Niederschlag voraussichtlich bis …“ verwenden jetzt dieselbe Intervallzeit wie die sichtbaren Niederschlagsdiagramme.
- Die bisher mögliche stündliche Verschiebung der Endzeit um eine zusätzliche Stunde wurde entfernt.
- Innerhalb der Kurzfrist wird die finalisierte 15-Minuten-Reihe bevorzugt; sie enthält bereits die operative RUC-/Radar-/Modellfusion. Nur bei fehlender vollständiger 15-Minuten-Abdeckung wird auf die intervallkorrigierte Stundenreihe zurückgefallen.
- Reine Niederschlagswahrscheinlichkeit ohne dargestellte messbare Niederschlagsmenge verlängert keine vermeintliche Niederschlagsdauer mehr.
- Niederschlagsphasen hinter dem +2-Stunden-Radarfenster werden aus derselben kanonischen Zeitreihe abgeleitet wie Kurzfrist, 24-h-Profil und weitere Prognosedarstellungen.

## Konsistenz
- Open-Meteo-Akkumulationen am Intervallende werden vor sichtbaren Zeitaussagen auf den zugehörigen Vorwärtsslot normalisiert.
- Die Endzeit eines letzten nassen Stundenintervalls wird dadurch nicht mehr pauschal um eine weitere Stunde verlängert.

# MID v0.9.85.131

## Aktuell · Radar-Nowcast
- Die Radar-Nowcast-Auswertung startet früher und verwendet für die erste Echoentscheidung einen schlanken DWD-Rasterpfad; die vollständige 5-Minuten-Punktserie wird unmittelbar danach nachgeladen.
- Die Grafik erscheint weiterhin nur, wenn am Standort oder im relevanten Umfeld ein Niederschlagsecho erkannt wird.
- Regelmäßige scheinbare „Trockenphasen“ aus der ausgedünnten Schnellserie werden nicht mehr als 0-Niederschlag dargestellt. Eine unvollständige Schnellserie wird transparent als noch zu vervollständigende 5-Minuten-Auswertung behandelt.
- Echte trockene 5-Minuten-Abschnitte bleiben sichtbar, wenn der vollständige DWD-Punktpfad für den jeweiligen Zeitschritt tatsächlich kein relevantes Echo liefert.

## Wetterkarten
- Der MID-C11-Handoff vereinheitlicht und verdichtet die Zeitsteuerung in den Kartenansichten.
- Ausgewählte Zeitpunkte und Navigationskontrollen bleiben auf Smartphone, Tablet und Desktop klarer lesbar und beanspruchen weniger Kartenfläche.

## Fachlichkeit und Leistung
- DWD-Radarquelle, saisonale Echoprofile und bestehende Niederschlagsschwellen bleiben unverändert.
- Kurzer Radar-Kurzcache, früherer Preload und größere parallele Pakete für die exakten 5-Minuten-Punktwerte reduzieren unnötige Wiederholungs- und Wartezeiten.

# MID v0.9.85.130

## Einstellungen
- Unter „Inhalte & Navigation“ ist **Gesundheitswetter** jetzt tatsächlich sichtbar und steht vor den übrigen optionalen Inhaltsmodulen.
- **Pollenflug** kann dort separat ein- oder ausgeschaltet werden. Die Auswahl bleibt gerätelokal gespeichert.
- Die Modulreihenfolge bleibt darunter separat konfigurierbar.

## Navigation
- MID merkt sich wieder den zuletzt verwendeten Hauptbereich: **Aktuell**, **Heute**, **Vorhersage**, **Karten** oder **Mehr**.
- „Mehr“ wird nach einem erneuten App-Aufruf wieder geöffnet, wenn die App dort beendet wurde.
- Wird „Mehr“ bewusst geschlossen, gilt wieder der darunter aktive Hauptbereich.
- Explizite MID-Deep-Links haben beim Start weiterhin Vorrang vor dem gespeicherten Bereich.

## Fachlichkeit
- DWD-Pollendaten, Belastungsstufen, Regionen und Vorhersagewerte bleiben unverändert.

# MID v0.9.85.129

## Gesundheitswetter kompakter
- Pollenflug erscheint im Standardzustand jetzt als sehr kompakter Gesundheitswetter-Block mit heutiger Belastung, Region und DWD-Stand.
- Direkt sichtbar sind nur Pollenarten mit tatsächlicher heutiger Belastung. Die erste geöffnete Detailstufe zeigt höchstens vier Pollenarten mit der höchsten relevanten 3‑Tage-Belastung.
- Die vollständige Übersicht aller acht DWD-Pollenarten wird erst nach „Alle 8 Pollenarten anzeigen“ eingeblendet.
- Die mobile 3-Tage-Ansicht passt ohne abgeschnittene dritte Spalte oder erzwungene horizontale Mindestbreite in die Karte.

## Fachliche Korrektur
- DWD-Zwischenstufen wie „keine bis gering“, „gering bis mittel“ und „mittel bis hoch“ werden nicht mehr fälschlich als „keine Belastung“ behandelt.
- Grundlage bleiben die sieben Belastungsstufen des amtlichen DWD-Pollenflug-Gefahrenindex; DWD-Datenquelle, Regionen und Vorhersagewerte bleiben unverändert.

## Bedienung
- Der Hauptschalter bleibt mindestens 44 px hoch, tastaturbedienbar und mit aria-expanded/aria-controls versehen.
- Region und Aktualitätsstand werden platzsparend dargestellt; geöffnete Details erhalten sicheren Abstand zur festen Bottom-Bar.

# MID v0.9.85.128

## Sichtbar
- „Pollenflug“ steht unter „Inhalte & Navigation“ jetzt in einer eigenen Sektion „Gesundheitswetter“ und bleibt vollständig optional.
- Die kompakte Pollenvorhersage priorisiert heute tatsächlich belastende Pollenarten; bei keiner Belastung erscheint eine ruhige Zusammenfassung. Die Drei-Tage-Details bleiben aufklappbar und sind besser per Touch und Tastatur bedienbar.
- DWD-Quelle, Aktualitätsstand und die bestehenden Belastungsbegriffe bleiben sichtbar und unverändert.

## Technisch
- CodeQL-Eingabepfade für amtliche Warnwahrscheinlichkeiten und den Bergwetter-Browsertest wurden gehärtet.
- Der aktuelle High-Severity-`brace-expansion`-Befund wird innerhalb des kompatiblen 5.x-Pfads geschlossen; der bekannte `uuid`-Dev-/iOS-Werkzeugpfad wird nicht mit einem inkompatiblen Force-Upgrade umgangen.
- `actions/download-artifact` ist im RUC-Publishpfad auf v8.0.1 und einen vollständigen Commit-SHA aktualisiert.
- Meteorologische Prognose-, Warn-, DWD-Pollen- und Worker-Datenlogik bleiben unverändert.

# MID v0.9.85.127

## Sichtbar
- Pollenflug-Einstellung und Aktuell-Ansicht stabilisiert.
- Dezente Datenqualitätsindikatoren direkt an zentralen Wetterparametern.
- Versionsanzeige und ausgelieferter Funktionsstand wieder synchron.

## Technisch
- Referenzbewusste Root-Dokumentmigration, sicherer Branch-Cleanup und Vertragsregistry.
- KNMI-Diagnoseworkflows bereinigt; Vitest/V8-Coverage ergänzend eingeführt.
- Keine meteorologische Fachlogik geändert.

## v0.9.85.127 · 2026-09-30

- Die Pollenflug-Einstellung und die aktuelle Wetteransicht bleiben nach den jüngsten Korrekturen stabil; die Qualitätsanzeige sitzt dezent direkt an den wichtigsten Wetterparametern.
- Die Versionsanzeige ist wieder mit dem tatsächlich ausgelieferten Funktionsstand synchron.
- Technische Repository-, Vertrags- und CI-Bereinigungen verändern keine meteorologischen Schwellen, Warnlogik oder Prognosewerte.

# MID v0.9.85.126

- Behoben: „Aktuell"-Ansicht sprang nach Wetterdaten-Laden automatisch auf „Vorhersage" zurück, wenn die zuletzt gespeicherte Ansicht „Vorhersage" war und der Nutzer zuvor auf „Aktuell" getippt hatte.
- Ursache: Der Startup-Restore-Effekt lief nach dem Laden der Wetterdaten und überschrieb die explizite Nutzer-Navigation mit der gespeicherten Sektion.
- Fix: Ein `userNavigatedRef` verfolgt, ob der Nutzer bereits aktiv navigiert hat. Der Startup-Restore wird übersprungen, wenn der Nutzer vorher eine andere Ansicht gewählt hat.

# MID v0.9.85.125

- App-Absturz beim Start behoben: PollenForecast-Komponente führte Datenabruf während der Render-Phase durch (React-Side-Effect) statt in useEffect. Dies konnte zu Endlos-Schleifen und Abstürzen führen.
- UTCI-Windgeschwindigkeits-Übergabe abgesichert: Math.max(0.5, NaN) gab NaN zurück statt 0.5. Jetzt mit Number.isFinite-Prüfung.

# MID v0.9.85.124

- UTCI (Universal Thermal Climate Index) ersetzt die gefühlte Temperatur in der Aktuell-Ansicht. Korrekte Polynom-Koeffizienten nach Brode et al. (2012). Keine separate Sektion mehr — UTCI-Wert und Belastungskategorie direkt in der aktuellen Wetteranzeige.
- Pollenflug-Vorhersage kompakter: Chip-basierte Anzeige statt großer Tabelle. Details aufklappbar.

# MID v0.9.85.123

- UTCI (Universal Thermal Climate Index) als gefühlte Temperatur in der Aktuell-Ansicht: wissenschaftlich fundiertes thermisches Komfortmodell nach WMO/ISB mit 10 Belastungskategorien.
- Pollenflug-Einstellung und weitere Inhaltsmodule unter "Inhalte & Navigation" umgruppiert (zuvor in allen Einstellungsbereichen sichtbar).
- Pollenflug-Einstellung dauerhaft gespeichert (gerätelokal, nicht von Gerätesynchronisation überschrieben).

# MID v0.9.85.122

- Fehler behoben: Pollenflug-Einstellung wurde beim App-Neustart nicht dauerhaft gespeichert (Gerätesynchronisation hat Schlüssel entfernt).
- Fehler behoben: Zuletzt angezeigte Ansicht wurde beim Wiederaufrufen der App nicht wiederhergestellt (IntersectionObserver und Forecast-Horizon-Event haben gespeicherte Ansicht beim Start überschrieben).

# MID v0.9.85.121

- Pro-Parameter Datenqualitätsindikator in der Aktuell-Ansicht: kompakte Qualitäts-Badges für Temperatur, Wind, Niederschlag, Feuchte und Luftdruck mit Quellen- und Altersangabe.
- Erweiterte Ansicht zeigt aktive Modellläufe mit Initialisierungszeit, Auflösung und Vorhersagehorizont.

# MID v0.9.85.120

- Pollenflug-Vorhersage kann in den Einstellungen ein- und ausgeschaltet werden.
- Pollenflug-Komponente an das MID-Designsystem angeglichen (forecast-entry-head, Card-Oberfläche, Parameter-Farben).

# MID v0.9.85.119

- Pollenflug-Vorhersage für Deutschland: DWD-Pollendaten (8 Allergene, 27 Regionen, 3 Tage) in der Aktuell-Ansicht.
- Hoher-Kontrast-Modus (WCAG 2.1 AA) als vierte Theme-Option in den Einstellungen.
- Fehler behoben: Changelog-Link aus der App startete die App neu statt den Changelog zu öffnen.

# MID v0.9.85.116

- Nachtstunden sind im Dark-Design in Skybar und Temperaturverlauf deutlicher erkennbar.
- Die Nachtflächen bleiben weich an Sonnenuntergang und Sonnenaufgang ausgeblendet und überdecken Temperaturkurve oder Wetterfarben nicht.
- Das Light-Design bleibt unverändert; meteorologische Logik, Solarberechnung, Wetterfarben und Datenquellen bleiben unangetastet.

# MID v0.9.85.125

- App-Absturz beim Start behoben: PollenForecast-Komponente führte Datenabruf während der Render-Phase durch (React-Side-Effect) statt in useEffect. Dies konnte zu Endlos-Schleifen und Abstürzen führen.
- UTCI-Windgeschwindigkeits-Übergabe abgesichert: Math.max(0.5, NaN) gab NaN zurück statt 0.5. Jetzt mit Number.isFinite-Prüfung.

# MID v0.9.85.124

- UTCI (Universal Thermal Climate Index) ersetzt die gefühlte Temperatur in der Aktuell-Ansicht. Korrekte Polynom-Koeffizienten nach Brode et al. (2012). Keine separate Sektion mehr — UTCI-Wert und Belastungskategorie direkt in der aktuellen Wetteranzeige.
- Pollenflug-Vorhersage kompakter: Chip-basierte Anzeige statt großer Tabelle. Details aufklappbar.

# MID v0.9.85.123

- UTCI (Universal Thermal Climate Index) als gefühlte Temperatur in der Aktuell-Ansicht: wissenschaftlich fundiertes thermisches Komfortmodell nach WMO/ISB mit 10 Belastungskategorien.
- Pollenflug-Einstellung und weitere Inhaltsmodule unter "Inhalte & Navigation" umgruppiert (zuvor in allen Einstellungsbereichen sichtbar).
- Pollenflug-Einstellung dauerhaft gespeichert (gerätelokal, nicht von Gerätesynchronisation überschrieben).

# MID v0.9.85.122

- Fehler behoben: Pollenflug-Einstellung wurde beim App-Neustart nicht dauerhaft gespeichert (Gerätesynchronisation hat Schlüssel entfernt).
- Fehler behoben: Zuletzt angezeigte Ansicht wurde beim Wiederaufrufen der App nicht wiederhergestellt (IntersectionObserver und Forecast-Horizon-Event haben gespeicherte Ansicht beim Start überschrieben).

# MID v0.9.85.121

- Pro-Parameter Datenqualitätsindikator in der Aktuell-Ansicht: kompakte Qualitäts-Badges für Temperatur, Wind, Niederschlag, Feuchte und Luftdruck mit Quellen- und Altersangabe.
- Erweiterte Ansicht zeigt aktive Modellläufe mit Initialisierungszeit, Auflösung und Vorhersagehorizont.

# MID v0.9.85.120

- Pollenflug-Vorhersage kann in den Einstellungen ein- und ausgeschaltet werden.
- Pollenflug-Komponente an das MID-Designsystem angeglichen (forecast-entry-head, Card-Oberfläche, Parameter-Farben).

# MID v0.9.85.119

- Pollenflug-Vorhersage für Deutschland: DWD-Pollendaten (8 Allergene, 27 Regionen, 3 Tage) in der Aktuell-Ansicht.
- Hoher-Kontrast-Modus (WCAG 2.1 AA) als vierte Theme-Option in den Einstellungen.
- Fehler behoben: Changelog-Link aus der App startete die App neu statt den Changelog zu öffnen.

# MID v0.9.85.116

- Nachtstunden sind im Dark-Design in Skybar und Temperaturverlauf deutlicher erkennbar.
- Die Nachtflächen bleiben weich an Sonnenuntergang und Sonnenaufgang ausgeblendet und überdecken Temperaturkurve oder Wetterfarben nicht.
- Das Light-Design bleibt unverändert; meteorologische Logik, Solarberechnung, Wetterfarben und Datenquellen bleiben unangetastet.

# MID v0.9.85.124

- UTCI (Universal Thermal Climate Index) ersetzt die gefühlte Temperatur in der Aktuell-Ansicht. Korrekte Polynom-Koeffizienten nach Brode et al. (2012). Keine separate Sektion mehr — UTCI-Wert und Belastungskategorie direkt in der aktuellen Wetteranzeige.
- Pollenflug-Vorhersage kompakter: Chip-basierte Anzeige statt großer Tabelle. Details aufklappbar.

# MID v0.9.85.123

- UTCI (Universal Thermal Climate Index) als gefühlte Temperatur in der Aktuell-Ansicht: wissenschaftlich fundiertes thermisches Komfortmodell nach WMO/ISB mit 10 Belastungskategorien.
- Pollenflug-Einstellung und weitere Inhaltsmodule unter "Inhalte & Navigation" umgruppiert (zuvor in allen Einstellungsbereichen sichtbar).
- Pollenflug-Einstellung dauerhaft gespeichert (gerätelokal, nicht von Gerätesynchronisation überschrieben).

# MID v0.9.85.122

- Fehler behoben: Pollenflug-Einstellung wurde beim App-Neustart nicht dauerhaft gespeichert (Gerätesynchronisation hat Schlüssel entfernt).
- Fehler behoben: Zuletzt angezeigte Ansicht wurde beim Wiederaufrufen der App nicht wiederhergestellt (IntersectionObserver und Forecast-Horizon-Event haben gespeicherte Ansicht beim Start überschrieben).

# MID v0.9.85.121

- Pro-Parameter Datenqualitätsindikator in der Aktuell-Ansicht: kompakte Qualitäts-Badges für Temperatur, Wind, Niederschlag, Feuchte und Luftdruck mit Quellen- und Altersangabe.
- Erweiterte Ansicht zeigt aktive Modellläufe mit Initialisierungszeit, Auflösung und Vorhersagehorizont.

# MID v0.9.85.120

- Pollenflug-Vorhersage kann in den Einstellungen ein- und ausgeschaltet werden.
- Pollenflug-Komponente an das MID-Designsystem angeglichen (forecast-entry-head, Card-Oberfläche, Parameter-Farben).

# MID v0.9.85.119

- Pollenflug-Vorhersage für Deutschland: DWD-Pollendaten (8 Allergene, 27 Regionen, 3 Tage) in der Aktuell-Ansicht.
- Hoher-Kontrast-Modus (WCAG 2.1 AA) als vierte Theme-Option in den Einstellungen.
- Fehler behoben: Changelog-Link aus der App startete die App neu statt den Changelog zu öffnen.

# MID v0.9.85.116

- Nachtstunden sind im Dark-Design in Skybar und Temperaturverlauf deutlicher erkennbar.
- Die Nachtflächen bleiben weich an Sonnenuntergang und Sonnenaufgang ausgeblendet und überdecken Temperaturkurve oder Wetterfarben nicht.
- Das Light-Design bleibt unverändert; meteorologische Logik, Solarberechnung, Wetterfarben und Datenquellen bleiben unangetastet.

# MID v0.9.85.123

- UTCI (Universal Thermal Climate Index) als gefühlte Temperatur in der Aktuell-Ansicht: wissenschaftlich fundiertes thermisches Komfortmodell nach WMO/ISB mit 10 Belastungskategorien.
- Pollenflug-Einstellung und weitere Inhaltsmodule unter "Inhalte & Navigation" umgruppiert (zuvor in allen Einstellungsbereichen sichtbar).
- Pollenflug-Einstellung dauerhaft gespeichert (gerätelokal, nicht von Gerätesynchronisation überschrieben).

# MID v0.9.85.122

- Fehler behoben: Pollenflug-Einstellung wurde beim App-Neustart nicht dauerhaft gespeichert (Gerätesynchronisation hat Schlüssel entfernt).
- Fehler behoben: Zuletzt angezeigte Ansicht wurde beim Wiederaufrufen der App nicht wiederhergestellt (IntersectionObserver und Forecast-Horizon-Event haben gespeicherte Ansicht beim Start überschrieben).

# MID v0.9.85.121

- Pro-Parameter Datenqualitätsindikator in der Aktuell-Ansicht: kompakte Qualitäts-Badges für Temperatur, Wind, Niederschlag, Feuchte und Luftdruck mit Quellen- und Altersangabe.
- Erweiterte Ansicht zeigt aktive Modellläufe mit Initialisierungszeit, Auflösung und Vorhersagehorizont.

# MID v0.9.85.120

- Pollenflug-Vorhersage kann in den Einstellungen ein- und ausgeschaltet werden.
- Pollenflug-Komponente an das MID-Designsystem angeglichen (forecast-entry-head, Card-Oberfläche, Parameter-Farben).

# MID v0.9.85.119

- Pollenflug-Vorhersage für Deutschland: DWD-Pollendaten (8 Allergene, 27 Regionen, 3 Tage) in der Aktuell-Ansicht.
- Hoher-Kontrast-Modus (WCAG 2.1 AA) als vierte Theme-Option in den Einstellungen.
- Fehler behoben: Changelog-Link aus der App startete die App neu statt den Changelog zu öffnen.

# MID v0.9.85.116

- Nachtstunden sind im Dark-Design in Skybar und Temperaturverlauf deutlicher erkennbar.
- Die Nachtflächen bleiben weich an Sonnenuntergang und Sonnenaufgang ausgeblendet und überdecken Temperaturkurve oder Wetterfarben nicht.
- Das Light-Design bleibt unverändert; meteorologische Logik, Solarberechnung, Wetterfarben und Datenquellen bleiben unangetastet.

# MID v0.9.85.122

- Fehler behoben: Pollenflug-Einstellung wurde beim App-Neustart nicht dauerhaft gespeichert (Gerätesynchronisation hat Schlüssel entfernt).
- Fehler behoben: Zuletzt angezeigte Ansicht wurde beim Wiederaufrufen der App nicht wiederhergestellt (IntersectionObserver und Forecast-Horizon-Event haben gespeicherte Ansicht beim Start überschrieben).

# MID v0.9.85.121

- Pro-Parameter Datenqualitätsindikator in der Aktuell-Ansicht: kompakte Qualitäts-Badges für Temperatur, Wind, Niederschlag, Feuchte und Luftdruck mit Quellen- und Altersangabe.
- Erweiterte Ansicht zeigt aktive Modellläufe mit Initialisierungszeit, Auflösung und Vorhersagehorizont.

# MID v0.9.85.120

- Pollenflug-Vorhersage kann in den Einstellungen ein- und ausgeschaltet werden.
- Pollenflug-Komponente an das MID-Designsystem angeglichen (forecast-entry-head, Card-Oberfläche, Parameter-Farben).

# MID v0.9.85.119

- Pollenflug-Vorhersage für Deutschland: DWD-Pollendaten (8 Allergene, 27 Regionen, 3 Tage) in der Aktuell-Ansicht.
- Hoher-Kontrast-Modus (WCAG 2.1 AA) als vierte Theme-Option in den Einstellungen.
- Fehler behoben: Changelog-Link aus der App startete die App neu statt den Changelog zu öffnen.

# MID v0.9.85.116

- Nachtstunden sind im Dark-Design in Skybar und Temperaturverlauf deutlicher erkennbar.
- Die Nachtflächen bleiben weich an Sonnenuntergang und Sonnenaufgang ausgeblendet und überdecken Temperaturkurve oder Wetterfarben nicht.
- Das Light-Design bleibt unverändert; meteorologische Logik, Solarberechnung, Wetterfarben und Datenquellen bleiben unangetastet.

# MID v0.9.85.121

- Pro-Parameter Datenqualitätsindikator in der Aktuell-Ansicht: kompakte Qualitäts-Badges für Temperatur, Wind, Niederschlag, Feuchte und Luftdruck mit Quellen- und Altersangabe.
- Erweiterte Ansicht zeigt aktive Modellläufe mit Initialisierungszeit, Auflösung und Vorhersagehorizont.

# MID v0.9.85.120

- Pollenflug-Vorhersage kann in den Einstellungen ein- und ausgeschaltet werden.
- Pollenflug-Komponente an das MID-Designsystem angeglichen (forecast-entry-head, Card-Oberfläche, Parameter-Farben).

# MID v0.9.85.119

- Pollenflug-Vorhersage für Deutschland: DWD-Pollendaten (8 Allergene, 27 Regionen, 3 Tage) in der Aktuell-Ansicht.
- Hoher-Kontrast-Modus (WCAG 2.1 AA) als vierte Theme-Option in den Einstellungen.
- Fehler behoben: Changelog-Link aus der App startete die App neu statt den Changelog zu öffnen.

# MID v0.9.85.116

- Nachtstunden sind im Dark-Design in Skybar und Temperaturverlauf deutlicher erkennbar.
- Die Nachtflächen bleiben weich an Sonnenuntergang und Sonnenaufgang ausgeblendet und überdecken Temperaturkurve oder Wetterfarben nicht.
- Das Light-Design bleibt unverändert; meteorologische Logik, Solarberechnung, Wetterfarben und Datenquellen bleiben unangetastet.

# MID v0.9.85.120

- Pollenflug-Vorhersage kann in den Einstellungen ein- und ausgeschaltet werden.
- Pollenflug-Komponente an das MID-Designsystem angeglichen (forecast-entry-head, Card-Oberfläche, Parameter-Farben).

# MID v0.9.85.119

- Pollenflug-Vorhersage für Deutschland: DWD-Pollendaten (8 Allergene, 27 Regionen, 3 Tage) in der Aktuell-Ansicht.
- Hoher-Kontrast-Modus (WCAG 2.1 AA) als vierte Theme-Option in den Einstellungen.
- Fehler behoben: Changelog-Link aus der App startete die App neu statt den Changelog zu öffnen.

# MID v0.9.85.116

- Nachtstunden sind im Dark-Design in Skybar und Temperaturverlauf deutlicher erkennbar.
- Die Nachtflächen bleiben weich an Sonnenuntergang und Sonnenaufgang ausgeblendet und überdecken Temperaturkurve oder Wetterfarben nicht.
- Das Light-Design bleibt unverändert; meteorologische Logik, Solarberechnung, Wetterfarben und Datenquellen bleiben unangetastet.

# MID v0.9.85.119

- Pollenflug-Vorhersage für Deutschland: DWD-Pollendaten (8 Allergene, 27 Regionen, 3 Tage) in der Aktuell-Ansicht.
- Hoher-Kontrast-Modus (WCAG 2.1 AA) als vierte Theme-Option in den Einstellungen.
- Fehler behoben: Changelog-Link aus der App startete die App neu statt den Changelog zu öffnen.

# MID v0.9.85.116

- Nachtstunden sind im Dark-Design in Skybar und Temperaturverlauf deutlicher erkennbar.
- Die Nachtflächen bleiben weich an Sonnenuntergang und Sonnenaufgang ausgeblendet und überdecken Temperaturkurve oder Wetterfarben nicht.
- Das Light-Design bleibt unverändert; meteorologische Logik, Solarberechnung, Wetterfarben und Datenquellen bleiben unangetastet.

# MID v0.9.85.116

- Nachtstunden sind im Dark-Design in Skybar und Temperaturverlauf deutlicher erkennbar.
- Die Nachtflächen bleiben weich an Sonnenuntergang und Sonnenaufgang ausgeblendet und überdecken Temperaturkurve oder Wetterfarben nicht.
- Das Light-Design bleibt unverändert; meteorologische Logik, Solarberechnung, Wetterfarben und Datenquellen bleiben unangetastet.

# MID v0.9.85.115

- Der kurzfristige Temperaturverlauf übernimmt lokale Messkorrekturen jetzt zeitgenau und ohne künstliche Gegenbewegung durch ein zu schnelles Ausblenden des Temperatur-Bias.
- Dadurch wird insbesondere ein unplausibler Stundenanstieg vermieden, der allein aus der Rückführung einer starken hyperlokalen Temperaturkorrektur entstehen konnte.
- Die +12-h-Temperaturkurve bleibt an dieselbe kanonische, hyperlokal finalisierte Stundenreihe gebunden; es gibt keine separate grafische Glättung.
- Im Berg-/Wintersportbereich zeigt die horizontale Stundenprognose jetzt die nächsten 12 statt 24 Stunden. Die 7-Tage-Ansicht und eigenständige 24-h-Schneeangaben bleiben erhalten.

# MID v0.9.85.114

- Der Trendtext der mobilen 7-Tage-Ansicht kann vollständig umbrechen; Modellstand und Legende erhalten eine eigene Zeile.
- Die Kopfzeilen von Komposit- und Wetterkarten ordnen Titel und Status auf schmalen Ansichten untereinander an.
- Bei ausgewähltem Standort erscheint kein fester PWA-Installationshinweis mehr über dem Wetterinhalt. Die Installation bleibt über die Kopfzeile erreichbar.
- Die Korrekturen betreffen ausschließlich Darstellung und Bedienung; Wetter- und Warnlogik bleiben unverändert.

# MID v0.9.85.113

- In der Kurzfristvorhersage ist das Detail nach Auswahl eines Zeitpunkts wieder sichtbar.
- Wetterkarten-Playback, „Jetzt“ und „Neu laden“ besitzen auf Touch-Ansichten mindestens 44 × 44 px große Ziele. Standort-Popups öffnen auch durch Tippen; der gewählte Standort ist zusätzlich per Tastatur aufrufbar.
- Die Szenarioübersicht der 14-Tage-Ansicht zeigt ihre Kurzlabels lesbar und ohne Abschneiden auf schmalen Displays.
- Die untere Hauptnavigation ist für Screenreader als Navigation ausgezeichnet.
- Meteorologische Berechnungen, Datenquellen und Warnstufen bleiben unverändert.

# MID v0.9.85.112

- Die Kartensteuerung ist auf Smartphone und Touch-Geräten ruhiger und einheitlicher angeordnet: Zoom, Positionszentrierung und Layersteuerung besitzen konsistente Größen, Abstände und eine gemeinsame rechte Ausrichtung.
- Die Bedienelemente berücksichtigen weiterhin Safe Areas und ausreichend große Touch-Ziele.
- In der 7-Tage-Kurvenübersicht sind die sieben Tagesbereiche auf Desktop wieder vollständig sichtbar und sauber an der gemeinsamen Zeitachse ausgerichtet.
- Meteorologische Berechnungen, Datenquellen und Warnlogik bleiben unverändert.

# MID v0.9.85.111

- Die automatische MID-Revision behandelt kurzzeitige Netzwerk- und Providerfehler robuster, ohne den fachlichen Fail-Closed-Schutz zu lockern.
- Kritische API-Verträge erhalten höchstens drei begrenzte Abrufversuche bei Transportfehlern, HTTP 408/425/429 oder 5xx.
- Inhaltlich ungültige Antworten und nicht-transiente 4xx bleiben sofort echte Vertragsfehler; nach dem letzten erfolglosen Versuch bleibt die Revision rot.
- Die Änderung betrifft ausschließlich die Prüfautomatik. Wetterlogik, Berg-/Wintersportdaten, Worker-Fachlogik und sichtbare App-Funktionen bleiben unverändert.

# MID v0.9.85.110

- Berg-/Wintersport nutzt im Kurzfristbereich nach Möglichkeit ein einheitliches hochaufgelöstes Regionalmodell für alle Höhenstufen; Best Match bleibt die vollständige 7-Tage-Basis und der robuste Fallback.
- Die tatsächlich verwendete Höhenprognosequelle wird sichtbar benannt. DWD ICON-D2-RUC wird als ergänzendes standortbezogenes 15-Minuten-Signal klar von getrennten Tal-/Mitte-/Berg-Reihen abgegrenzt.
- Tagespiktogramme der Höhenprognose verwenden keine Mond-Darstellung mehr; geöffnete Stunden- und 3-Stunden-Werte behalten weiterhin die astronomisch korrekte Tag-/Nacht-Darstellung.
- Neuschnee wird im Tagesüberblick ausdrücklich als „Neuschnee“ bezeichnet. In der Sommerdarstellung entfällt ein redundantes „0 cm“, positive Mengen bleiben sichtbar; im Winter bleibt ein echter Nullwert erhalten.
- Räumlich versetzte Höhenpunkte werden transparent gekennzeichnet: Niederschlagsunterschiede können neben der Höhe durch Exposition und Luv-/Lee-Effekte entstehen. Eine künstliche monotone Niederschlagskorrektur nach Höhe findet nicht statt.
- Die Höhenzonenanalyse wird typografisch und farblich an die übrige Berg-/Wintersportsektion angeglichen.

# MID v0.9.85.109

- Aktuelles Wetter, Wetterpiktogramm und Bewölkungskarte verwenden jetzt denselben kanonischen Bewölkungszustand; widersprüchliche Kombinationen wie „Bedeckt“ bei 6/8 werden vermieden.
- Die sichtbaren Bewölkungsbezeichnungen folgen app-weit der DWD-Oktas-Systematik: 0/8 wolkenlos, 1–3/8 leicht bewölkt, 4–6/8 wolkig, 7/8 stark bewölkt und 8/8 bedeckt.
- Auch ohne frische lokale Wolkenmessung wird ein trockener Best-Match-Wettercode mit der tatsächlich dargestellten Gesamtbewölkung abgeglichen.
- Kurzfrist-, Piktogramm-, Bergwetter- und Forecast-Fusion-Fallbacks verwenden dieselben aus Oktas abgeleiteten Bewölkungsgrenzen.
- Event-, Routen-, Wasser- und Periodenansichten verwenden bei trockenem Wetter dieselben kanonischen Bewölkungsbezeichnungen.
- Die Kurzbezeichnung des UV-Index ist in den sichtbaren Wetteransichten einheitlich „UVI“, unter anderem in 7-/14-Tage-, Bergwetter- und Eventdarstellungen.

# MID v0.9.85.108

- Berg-/Wintersport zeigt für die gewählte Höhenstufe jetzt eine stündliche Prognose statt der bisherigen Kennwert-Kacheln.
- Die 7-Tage-Höhenprognose ist deutlich kompakter; ein Tag lässt sich weiterhin für die Stundenwerte öffnen.
- Beim Laden erscheint sofort eine strukturierte Vorschau, während Zusatzdaten im Hintergrund ergänzt werden.
- Der bisherige separate „Höhenvergleich“ entfällt. Weitere Kennwerte, Schnee-/Eishinweise, Schneefallgrenzen, Lawinenquelle und Methodik sind ruhiger in das MID-Design eingeordnet.
- Aktuelle hyperlokal analysierte Bewölkung wird knapp unter vollständiger Bedeckung nicht mehr allein durch Rundung als „Bedeckt“ ausgegeben.
- Open-Meteo liefert für Sonne/Mond zusätzlich Mondaufgang, Monduntergang und Mondphase; MID nutzt diese Tageswerte vorrangig und behält die lokale Astronomieberechnung als robusten Fallback.

# MID v0.9.85.107

- Die 7- und 14-Tage-Übersichten sind kompakter aufgebaut; Sonnenstunden und UVI bleiben auch auf kleinen Displays gut lesbar.
- Nachtpiktogramme erhalten ausreichend Platz und werden in den kompakten Tageszeilen nicht abgeschnitten.
- Das Berg-/Wintersportprofil ist dichter und tabellarischer aufgebaut. Schnee und Flüssigniederschlag werden getrennt dargestellt; die Schneeflächen skalieren ausschließlich die dargestellte Schneemenge und sind keine amtlichen Warnstufen.
- Schnee-/Eiswarnungen, amtliche Lawinenquelle und Methodik sind kompakter strukturiert. Lange Warntexte bleiben über Details zugänglich.
- Der ChatGPT/GitHub-Vertrag entspricht jetzt dem geschützten Source-first-Veröffentlichungsweg.

# MID v0.9.85.106

- Replit bleibt die gezielte MID-Werkbank für Design- und UI-Anpassungen; konkrete MID-Arbeitsaufträge an Replit werden ausschließlich von ChatGPT erteilt.
- Replit übergibt Änderungen nur über geprüfte `replit/*`-Handoffs. Prüfung, Integration und Veröffentlichung bleiben bei ChatGPT und dem geschützten GitHub-Releasepfad.
- Ein fehlender lokaler SSH-Deploy-Key wird nicht durch einen neuen Schreibschlüssel oder gelockerte Hostprüfung ersetzt; der vorhandene GitHub-Integrationsweg nutzt SHA-Verifikation vor und nach dem Handoff.
- Persistente Replit-Regeln und ein projektgebundener MID-Handoff-Skill machen den Ablauf auch nach neuen Replit-/ChatGPT-Sitzungen reproduzierbar.
- Das Replit-Handoff-Gate schützt zusätzlich Governance-, Agent-, CI-/Release-, Worker-, iOS-, Versions- und zentrale Build-/Deploy-Dateien vor direkten Replit-Änderungen.

# MID v0.9.85.105

- Zusatzdaten der Bergprognose bleiben nach einem Diagnosefehler korrekt als „Nicht verfügbar“ markiert, auch wenn der 3-Minuten-Cache erneut geöffnet wird.
- Die geöffnete Quellenübersicht zeigt Diagnostik, Messungen, Ensemble und Cachehinweise in einer kompakten Statusliste; die Kernprognose bleibt unabhängig davon sichtbar.
- Die bestehenden kompakten 7-/14-Tage-Sonnen- und UVI-Werte verwenden weiterhin die vorhandenen Tagesdaten und fehlende Werte als „–“.

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
