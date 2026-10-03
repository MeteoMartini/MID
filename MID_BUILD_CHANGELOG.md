## MID v0.9.85.151 · 2026-10-03 · Gestaffelte Warnhorizonte und regionaler Langfristausblick

- Basis main = mid-stable = 0d9205720c177243a2dec3f4f8169216cc620162 (.150); keine Überschneidung mit offener Agent-PR.
- Gemeinsame Vorlaufbezeichnung für Warnzentrum, Tagesansichten und Ensemble; bestehender Stundenauflösungs-Schutz bleibt erhalten.
- Separater Worker-Langfristcache und grobes Raster; Regen/Schnee ausschließlich vollständige 24-h-Summen. EPS-Prozentwerte unkalibrierte Näherungen. Keine langfristige Konvektions-/Eisregendiagnostik.
- Neue Laufzeitregression prüft 48–168 h, Schwellenfenster, Herkunft und Fehlerzustand bei fehlenden Feldern. Historische 24-h-Erwartungen bewusst auf neuen beauftragten Vertrag angepasst.

# v0.9.85.150 · iOS Bottom-Bar-Verankerung

Aus veröffentlichter .149, e6386ca6ed8fbab563261e7b78a96ea15e015c17. Narrow-iOS-Dokumentanker hält die bestehende Body-Portal-Navigation am sichtbaren unteren Rand; stale VisualViewport.offsetTop wird geometrisch begrenzt. Safe-Area und Desktop-/Tablet-Regeln unverändert. Browsermatrix ergänzt echten Bottom-Gap sowie Scroll-/Resize-/Keyboard-Rückkehr. Keine meteorologische Logik oder empirische Kalibrierung verändert. Details: docs/implementation/MID_BOTTOM_BAR_ANCHOR_0.9.85.150.md.

# v0.9.85.149 · Runde Kartenskalen und temporäre Ortswerte

Verifizierte .148-Basis c578a947e02a6d06638870d5d762c16ecb9be8bf. Runde Grenzen in der ausgewählten Einheit, gemeinsam für Raster/Legende/Export. Temporäre geografische Portal-Abfrage schließt nach sechs Sekunden oder bewusster Außen-/Karteninteraktion; keine dauerhaften Ortswert-Popups. Favoritenzustand und Exportfortschritt vereinheitlicht. Details: docs/implementation/MID_MODEL_MAP_PROBE_0.9.85.149.md.

## v0.9.85.148 · MID-C12 Modellkarten-Einheiten und Wertebereich

- Verifizierte Ausgangsbasis .147: main = mid-stable = e28fdd42a3e68decf4b2671d3cd71751a3e711af. Paralleländerungen .146/.147 erhalten; Abhängigkeiten, Budgets, CI- und Datenpublikationsregeln unverändert.
- Unveröffentlichte .148-Parallelarbeit e3d9f7ac2567b66bfbd0f769ffc5fa5d415eb5fb abgeglichen: begonnene Einheitenweitergabe vollständig zusammengeführt, Navigation-Portal erhalten und mit neutralem Namespace-Wrapper für bisherige mobile/Desktop-Stile sowie Forecast-Höhenmessung abgesichert. Ursprünglicher Branch bleibt unangetastet.
- Eine kanonische Windumrechnung für Karten, Favoriten, Popups, Legenden und PNG/SVG; Rohfelder bleiben unverändert km/h. Nicht unterstützte Roh-Einheiten werden abgewiesen.
- Ein gemeinsamer kontinuierlicher sRGB-Farbkern für Raster/Legenden/Exports. Relative Wertebereichsskala erfasst alle gültigen Feldextrema ohne Quantilabschneidung; feste Skala für Vergleiche und Animation. Konstante Felder ohne künstlichen Kontrast.
- Kategoriale Wettercodes unverändert diskret; trockene Niederschlagszellen transparent, fehlende RADOLAN-Zellen grau. Originale WMS-Bilder behalten ihre Anbieterpalette; standardisierte Windfiedern erhalten umgerechnete Erklärung.
- Bestehende Pflichtregression um vier Windeinheiten, Skalen-/Exportgleichheit, kontinuierliche Anker und responsive echte Kartenansichten erweitert. Der bestehende Summen-Testloader bündelt die neue Modulabhängigkeit statt einer isolierten data:-Transpilation; sämtliche fachlichen Assertions bleiben erhalten.
- Ungültige Replit-Dormant-Testausnahme nicht übernommen, kein unfreigegebener Handoff promoted. Legende eigenständig im Trusted-Branch fertiggestellt; originale Architekturprüfung bleibt unverändert. Neue Sichtbarkeitsprüfung erfasst auch übergeordnete Paint-/Overflow-Grenzen, nicht nur Elementgeometrie.

## v0.9.85.145 · MID-C12 Unterscheidbare Prognoseansichten

Basis .144, main = mid-stable = 3951e8ce58239634ed48b4f13e5a58ee23c73c91. Nutzerkorrektur: Spurenmengen ohne Abschneiden, keine Quantil-Kürzel vor sichtbaren Werten, 7d mit gemeinsamem Tmin/Tmax, 14d mit eigener Ensemble-Hierarchie. Meteorologische Werte und Median-/Quantilverträge bleiben erhalten. UI-Handoff ccb4800f3d015313dcf3224270dc934f4f640140 auf exakter Stable-Basis und read-only Gate 37030686168 verifiziert: Build/Types, 899 Regressionen, unveränderte Budgets und Web-/iOS-Hülle grün. Vollständige 96 Kartenfälle mit sichtbaren Tmin/Tmax-Feldern und unbeschnittenen Spurenwerten sind zusätzlich in der Source-Freigabe verpflichtend; Zusätzliche vollständige Source-Prüfung fand abgeschnittenes Temperaturfeld bei 1024 px und diagnostizierte eine nur 25 px breite Tageskarte durch geerbte klassische Rasterplatzierung; moderne Tablet-Zeilen setzen Spalte/Zeile explizit zurück, Temperaturspalte im Integrationsstand auf 114 px berichtigt und Beschriftungen im bestehenden Zahlen-Badge oberhalb der Werte angeordnet, mit natürlicher Badge-Größe und unverändert strengen Sichtbarkeits-/Budgetprüfungen. Details im Implementierungsbeleg.

## MID v0.9.85.144 · 2026-10-02 · Wochenunsicherheit, Trend und Karten

- Tatsächliche stündliche P25/P50/P75-Mitgliederquantile in bestehendem Ensemblebundle; eigenständige Familien-/Frischegewichtung, keine Pseudomitglieder oder Extrapolation, Cachegeneration v18.
- Wetterabschnittsauswahl erhält Niederschlagsbeginn trotz reserviertem Nacht-/Hazardsatz; ausführbare Mittwoch-/Donnerstag-Fixture.
- GRIB-RELHUM-Supersättigung getrennt von CLCT-Grenzen; echter GRIB-Regressionsnachweis und 48 Live-Kartenfelder erfolgreich.
- WMS-Terminwahl berücksichtigt das vollständige Akkumulationsfenster des gewählten Modelllaufs.
- Replit-UI-Handoff für kompakte numerische P25–P75-Grenzen; Integration SHA-verifiziert vor Release.
- 899 CI-Regressionen; zusätzliche responsive Wochenband-/Balkenprüfung, aktuelle DWD-Katalog-/PNG-Verifikation.

## MID v0.9.85.143 · 2026-10-02 · MID-C11 kompakte Unsicherheit

- Basis .142 4282232533fc70545d9b64676a9de1b4839f1b2e. Kein überlappender Produkt-PR.
- Kurze Tmax/Tmin/Regen/Böen-Bänder, echte gewichtete P50-Marker, keine Mittelwindzeile. Fehlende P50 nicht ersetzt.
- Echte stündliche P25–P75-Polygone nur im vorhandenen Warnungsensemble-Horizont. Kein künstlicher Halo und keine Tagesquantil-Interpolation. Historische Halo-Tokenprüfung absichtlich migriert.
- Umsetzung und Quellen: docs/implementation/MID_COMPACT_UNCERTAINTY_0.9.85.143.md.

## MID v0.9.85.142 · 2026-10-02 · MID-C11 Verlustfreies Kartenbudget

- Basis: vollständig veröffentlichte .141, main = mid-stable = ff2e310d107a745468d788fcec678693d507a68d.
- Live-Snapshot belegt bereits ca. 864,4 MB; unkomprimierte neue Raster würden das bestehende 900-MB-Budget überschreiten. Native Feldobjekte deshalb gzip-JSON in immutable .bin-Objekten, ca. 5,8 MB statt 39,5 MB; keine Auflösungs-/Wertreduktion.
- SHA256/Bytezahl vor Inflation, deklarierte entpackte Größe mit laufender Obergrenze; Legacy-JSON bleibt lesbar. Stream-Decoder bevorzugt, vorhandenes pako 2.2.0 explizit gepinnt als Lazy-Fallback für ältere Safari/WebViews.
- Pflichtregressionen um native/fallback gzip-, Größen-, Truncation- und Hash-Prüfungen erweitert. Browser prüft komprimierte Niederschlags- und Legacy-Temperaturfelder sowie PNG/SVG.
- Lokale Typ-, Decoder-/Python- und Browserprüfungen bestanden. Vollständige Suite bis mindestens 500/898 ohne Fehler protokolliert; lokale Ausführungsumgebung beim Abschluss ausgefallen. Verbindliches Source-PR-Gate muss den vollständigen Stand vor Veröffentlichung erneut prüfen.

## MID v0.9.85.141 · 2026-10-02 · MID-C11 Adaptive Prognosen und native Karten

- Basis main/mid-stable 87875585c773edf5fcb508cbe3466c7f98c08481, keine überlappende Produkt-PR.
- Parameterunabhängige Tages-Quantilbänder, kanonische Windumrechnung, echte Null kompakt ohne Spurenwerte zu nullen; Kurzfristgrenzen explizit.
- RADOLAN RW :50-Stunden ohne Rollingsummen-Doppelzählung; fehlende Zellen bleiben -1/grau, fehlende Stunden sperren Fenster.
- Acht native ICON-D2-Felder × sechs verifizierte Termine, nur gewähltes SHA256-geprüftes Raster im Browser. Gleiche Karten-/Favoriten-/Downloadergonomie; Bestandsschutz anderer WMS-Modelle.
- Neue Inhalte über bestehendes immutable Pages-Objektmanifest und unverändertes kostenloses Budget, keine neue API-/Schlüssel-/Bezahlabhängigkeit.
- 898 Pflichtregressionen, zusätzliche Python-Decoder-/Publikationstests und Browser-QA. Zwei historische Testauslese-/Formatverträge bewusst auf neue Typstruktur bzw. kompakte Zahlendarstellung migriert, meteorologische Assertions erhalten.
- Einzelheiten und Grenzen: docs/implementation/MID_ADAPTIVE_NATIVE_MAPS_0.9.85.141.md.

## MID v0.9.85.140 · 2026-10-01 · MID-C11 Radar kompakt

- Ursache der leeren Pille: globale `.top`-Headerregeln auf `.radar-nowcast-grid.top`; Gridlines explizit auf Höhe 0 und transparenten Hintergrund zurückgesetzt, Browsertest prüft diese Geometrie.
- Bright-Sky-Livekennung `RADARCOMP::RV` zusätzlich zur historischen `RADOLAN::RV` akzeptiert; Liveabruf Berlin liefert 24/24 verfügbare Prognoseschritte.
- Chart mit eigener ID gegen alte Layoutregeln isoliert; Summenpille entfernt, Phasentext verkürzt.
- Vollständige native RV-Reihen im schnellen und ausführlichen Pfad unmittelbar nutzen; keine WMS-Abhängigkeit für deren Mengen.
- Native Kontrollbeobachtung darf RV-Zeitschritte und Referenzzeit nicht ersetzen. Kein Auffüllen fehlender Werte mit Null.
- Browserfixture um tatsächliches CurrentNowcards-Umfeld erweitert. Historischer Wortlauttest auf ausdrücklich gewünschten kompakten Phasenvertrag aktualisiert.

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

## Technischer Nachweis

- Verifizierte Basis: `main == mid-stable == b013e6664966111fa2c466ba8cabb3520421b435` (v0.9.85.137).
- Radar-Grafik: visuelle Zeitschrittmenge = native Rate × 5/60; Summen-/Coverage-Vertrag bleibt davon getrennt.
- Aktuell-Niederschlag: zentraler Deskriptor hat für die sichtbare Rate Vorrang vor einem separaten Beobachtungslabel; Phasen- und WMO-/DWD-Code bleiben Eingaben der zentralen Klassifikation.
- UTCI: kanonische stündliche Neuberechnung erfolgt nach appweiten Forecast-Korrekturen. Provider-`apparent_temperature` ist nicht mehr die sichtbare fachliche Endgröße der betroffenen Module.
- Fokusregression: `scripts/test-radar-utci-consistency-0985138.mjs`; vollständige Suite und Build laufen im Source-PR-Gate.

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

## v0.9.85.133 · 2026-10-01 · Konsistenzfix Radar/Niederschlag/Pollen/Startnavigation

- Verifizierte Ausgangsbasis: `main == mid-stable == 3816a4332f90be6b73fd04b33bfa46e7918ac66b` (v0.9.85.132). Die Nutzer-Screenshots zeigen ausdrücklich noch diesen Stable-Stand.
- DWD-RV: Die vollständige 5-Minuten-Zeitachse wird gegen die tatsächlich verfügbaren RV-Zeitpunkte vervollständigt. Technisch nicht auswertbare GetFeatureInfo-Zeitschritte bleiben explizite Datenlücken (`dataAvailable=false` / `hitClass=missing`) und zählen weder im Renderer noch in der Forecast-Fusion als trockene Evidenz.
- Niederschlagsdauer: `Aktuell` verwendet dieselbe kanonische 24-h-Niederschlagszeitreihe wie die übrigen Prognosedarstellungen und wertet alle relevanten Phasen aus. Wahrscheinlichkeit allein verlängert keine sichtbare Niederschlagsphase.
- Niederschlagsart/-intensität: 15-Minuten-Mengen werden auf die tatsächliche Intervalllänge normiert. Zusätzlich wird eine frische, vertrauenswürdige lokale SYNOP-/METAR-Niederschlagsart kontrolliert in die kanonischen WMO-Prognosecodes übersetzt und mit expliziter Provenienz durch Stunden-, 15-Minuten- und Kurzfristpfad geführt. Nachgelagerte Modell-`rain/showers`-Heuristiken dürfen diese beobachtete Art im unmittelbaren Zeitfenster nicht zurücküberschreiben.
- Lokalitätsgrenze der beobachteten Niederschlagsart: maximal 40 min alt und maximal 20 km entfernt; die genaue Beobachtungszeit, Entfernung und Quelle werden auch durch die hyperlokale Stationsaggregation erhalten. Diese Grenze ist als MID-Assimilationsregel im Prognosekonsistenzvertrag dokumentiert.
- Pollenflug: Kalender-`Heute` wird vom lokalen Datum abgeleitet, DWD-`EFFECTIVE` als Produktstand ausgewiesen, Worker-Cache verkürzt. Die PWA lädt das Produkt zusätzlich alle 10 min und nach Rückkehr in den Vordergrund neu; ein temporärer Refreshfehler entfernt einen bereits geladenen verwertbaren Produktstand nicht.
- Regression `scripts/test-precipitation-radar-pollen-navigation-0985133.mjs` deckt DWD-RV-Datenlücken, 24-h-Phasen, 15-min-Intensität, beobachteten Schauercharakter, Pollen-Datum/-Refresh und Navigations-Race ab. Der bestehende Hyperlokal-Testharness wurde auf den neuen Beobachtungsvertrag angepasst.
- Worker betroffen: DWD-Radar-Nowcast und DWD-Pollenroute müssen im Release-Gate geprüft/promoviert werden.
- Gesundheitswetter-Platzierung bewusst nicht in diesem funktionalen Patch geändert. Read-only-Replit-IA-Review empfiehlt anschließend `Mehr → Gesundheitswetter` als erweiterbaren Unterbereich; in `Aktuell` höchstens kompakter Tagesstatus/Deep-Link. Umsetzung erst als separater SHA-verifizierter Replit-Handoff auf dem dann freigegebenen Stable-Stand.

## v0.9.85.132 · 2026-10-01 · Niederschlags-Endzeiten appweit vereinheitlicht

- Verifizierte Basis: `main == mid-stable == eb1f8e5bd4dce82a1af18c762a054d5184e51806` (v0.9.85.131), Release- und Stable-Quality jeweils grün.
- Fehlerursache: `precipitationBeyondTwoHours` wertete rohe stündliche Akkumulationswerte aus und addierte auf den letzten nassen Zeitstempel nochmals pauschal eine Stunde. Da die Providerwerte bereits das Ende des vorangegangenen Intervalls markieren, konnte die Aussage bei jedem Stundenwechsel um eine Stunde nach hinten wandern.
- Neue kanonische Funktion: `canonicalPrecipitationTimeline` in `src/precipitationIntervals.ts`.
- Bevorzugte Kurzfristbasis: finalisierte 15-Minuten-Reihe inklusive RUC-/Radar-/Modellfusion; bei unvollständiger Abdeckung vollständiger Fallback auf normalisierte Stundenwerte.
- Sichtbare Dauer wird nur aus messbarem Niederschlag gebildet; Wahrscheinlichkeit allein erzeugt keine künstliche Phase.
- Bestehende `precipitationPresentationHours`/`precipitationPresentationMinutes15` bleiben die gemeinsame Intervallnormalisierung für Aktuell, Prognose, 24-h-Profil und Widgets.
- Regression: `scripts/test-precipitation-timing-consistency-0985132.mjs` schützt insbesondere den früheren +1-h-Endzeitversatz.

## v0.9.85.131 · 2026-10-01 · C11-Kartensteuerung und schneller, korrekter Radar-Nowcast

- Verifizierte Basis: `main == mid-stable == 0daf09160c8f9de514d3fbb3d78c03df275604d1` (v0.9.85.130).
- Verifizierter C11-Replit-Handoff: `37e726c7be865402f4ee348c8b732233e98430fb`, 3 Commits vor Stable und 0 zurück.
- Radar-Preload startet auf normalen Verbindungen nach 20 ms statt 85 ms; Data-Saver/2G bleibt vorsichtiger gestaffelt.
- Der Fast-Path verwendet die bereits geladene DWD-Rasterprobe und vermeidet zusätzliche GetFeatureInfo-Runden pro grobem Schnellzeitschritt.
- Fast-Resultate werden 45 s kurz zwischengespeichert; bei kurzem Upstream-Hänger darf maximal 120 s auf den letzten Fast-Stand zurückgegriffen werden.
- Die vollständige 5-Minuten-Punktserie startet nach dem Fast-Signal nach 40 ms (statt 240 ms) und lädt exakte Punktwerte in 12er- statt 6er-Paketen.
- Fehlerkorrektur: Ausgelassene Fast-Zeitschritte werden nicht länger als künstliche 5-Minuten-Trockenphasen visualisiert. Die periodische Folge „drei Balken, eine Lücke“ war ein Samplingartefakt.
- Echte Trockenphasen des vollständigen DWD-Punktpfads bleiben unverändert erhalten.
- Echo-Gate unverändert: Radar-Nowcast bleibt unter „Aktuell“ verborgen, wenn kein relevantes Standort- oder Umfeldecho vorliegt.
- Regression: `scripts/test-radar-startup-fastpath-0985131.mjs`.

## v0.9.85.130 · 2026-09-30 · Gesundheitswetter sichtbar und Hauptnavigation wiederhergestellt

- Screenshot-Befund reproduziert: `.settings-split-navigation` blendete die gemeinsame Optionssektion vollständig aus; dadurch waren die bereits implementierten Bereiche „Gesundheitswetter“ und „Inhaltsmodule“ unsichtbar.
- CSS-Vertrag korrigiert: Im Navigation-Tab bleiben ausschließlich die navigationseigenen Optionslisten plus Modulreihenfolge sichtbar; Darstellungs-/Wetteroptionen bleiben ausgeblendet.
- Gesundheitswetter steht vor den übrigen optionalen Inhaltsmodulen; Pollenflug bleibt über `mid:pollenDisplaySettings` persistent schaltbar.
- Primärnavigation erhält einen eigenen gerätelokalen Schlüssel für Aktuell / Heute / Vorhersage / Karten / Mehr. Untermodul- und Forecast-Horizon-Zustand bleiben zusätzlich erhalten.
- „Mehr“ kann beim App-Neustart wieder geöffnet werden; bewusstes Schließen stellt den darunter aktiven Hauptbereich als letzten Bereich wieder her.
- Der alte Startpfad entfernt `#mid-section-…` nicht mehr; explizite Deep-Links behalten damit Vorrang.
- Keine Änderung an meteorologischer Logik, Datenquellen, Warnungen oder Worker-Fachlogik.
- CSS-/Budget-Nachgang: Gesundheitswetter und optionale Inhaltsmodule liegen nun als eigene Navigationselemente außerhalb des bewusst ausgeblendeten Darstellungscontainers. Die bestehenden CSS-Splitregeln bleiben unverändert; es entsteht kein zusätzliches CSS-Budget.
- Persistenz-Härtung: Primärbereich dient als Fallback bei fehlendem/ungültigem Modulwert, wird vor Suspend/Schließen erneut gesichert und bleibt gerätelokal.\n- Source-Gate-Nachgang: zwei veraltete Hash-Neutralisierungs-Assertions auf den neuen Deep-Link-Vorrang umgestellt; Pollen-v0.9.85.129-Regressionsvertrag vorwärtskompatibel gemacht.\n- Regression: `scripts/test-health-settings-primary-navigation-0985130.mjs`.

## v0.9.85.129 · 2026-09-30 · Gesundheitswetter/Pollen kompakt

- Reales iPhone-Screenshot-Follow-up: mehrspaltiger Pollen-Kopf entfernt; Region/Quelle/Aktualität als kompakte Metazeile; Defaultzustand auf heutige Relevanz reduziert.
- 3-Tage-Progressive-Disclosure: erste Detailstufe maximal vier relevante Pollenarten, nach höchster 3-Tage-Stufe priorisiert; vollständige 8-Arten-Matrix erst nach explizitem „Alle anzeigen“.
- DWD-Fachkorrektur: siebenstufige Belastungssemantik 0 / 0–1 / 1 / 1–2 / 2 / 2–3 / 3 wird robust aus den gelieferten Text-/Codewerten abgeleitet. „keine bis gering“ ist nicht mehr gleich 0.
- Responsive: keine 420-px-Mindestbreite der Pollentabelle; vier Spalten passen in mobile Karten, Detailblock erhält Bottom-Bar-Scrollabstand.
- DWD-WFS, Regionen, Vorhersagewerte und Worker-Datenlogik bleiben unverändert.
- Replit-Follow-up: zweiter Detailschalter auf ≥44 px angehoben; erste Detailstufe bleibt auch bei acht relevanten Arten auf maximal vier Zeilen begrenzt.
- Source-Gate-Nachgang: CSS-Budget ohne Grenzerhöhung korrigiert; nur nicht notwendige Scrollbar-/Overscroll- und Metazeilen-Deklarationen entfernt.\n- Regression: `scripts/test-pollen-compact-dwd-levels-0985129.mjs`.

## v0.9.85.128 · 2026-09-30 · Screenshot-/Security-Nachgang und Gesundheitswetter

- CodeQL #92–#98: unkontrollierte Textausgabe und dynamische Browser-Testausdrücke entfernt; CDP-Argumente werden strukturiert übergeben und der lokale Chromium-Port wird nicht mehr aus einer Datei in eine Netzwerkadresse übernommen.
- Dependency-Audit: `brace-expansion` lock-only 5.0.9 → 5.0.12; kein `npm audit fix --force` für den getrennten `uuid`-/Capacitor-Tooling-Pfad.
- GitHub Actions: `download-artifact` v4.3.0 → v8.0.1, SHA-gepinnt, kanonischer und aktiver RUC-Workflow identisch.
- Gesundheitswetter: eigener Einstellungsblock; Pollen bleibt gerätelokal optional. Aktive DWD-Pollen werden nach vorhandener Belastungsstufe priorisiert; keine Änderung der DWD-Datenlogik.
- Replit wurde auf Stable v0.9.85.127 synchronisiert und für die Designprüfung eingesetzt; Integration und Release bleiben bei ChatGPT/GitHub.
- Source-Gate-Nachgang: vorbestehenden RUC-Workflow-Drift zugunsten der neueren Release-Race-Sicherung kanonisiert; veraltete Versions-/Action-Assertions aktualisiert; CSS-Budget ohne Grenzerhöhung durch Entfernung ungenutzter Pollen-Legacyregeln korrigiert.
- Required Regression: `scripts/test-security-pollen-maintenance-0985128.mjs`.

## MID v0.9.85.127 · 2026-09-30 · Repository-Hygiene, Versionssynchronisierung und Governance

- Verifizierte Basis: `mid-stable/main 81d2bfb9d872ba97f4e2a3fec82e92a6f8aefab0`.
- PR #208 war funktional bereits integriert, obwohl alle Versionsspiegel auf v0.9.85.126 verblieben; v0.9.85.127 synchronisiert den tatsächlichen Stand.
- Historische, nicht mehr baselinegebundene Root-Dokumente werden nach `docs/` verschoben; eine Regression verhindert neues Root-Wachstum ab diesem Build.
- Branch-Cleanup, Vertragsregistry, KNMI-Workflow-Audit sowie Vitest-/Coverage-Bootstrap werden im selben Wartungsstand regressionsgeschützt.
- Keine Änderung an Wetterdaten, Warnschwellen oder meteorologischer Fachlogik.

## MID v0.9.85.107 · 2026-09-27 · Kompakte Vorhersage- und Bergwetteransichten

- Basis und Source of Truth: mid-stable 17e5fa60e9bee26ec2485a08b33b4ebdc2bfe77e (v0.9.85.106).
- Verifizierter Replit-Handoff: replit/mid-18-2-15-compact-forecast-mountain@59f74d0715e3012ef166030aed21a8718d35ddf8; Handoff-Gate #107 grün mit 873 Regressionen sowie Web-/iOS-Hülle.
- ChatGPT hat den Handoff selektiv in chatgpt/mid-18-2-15-v0985107 integriert und die Diff-Audit-Funde korrigiert: aktive cockpit-fourteen-sun-uvi-Klasse, semantische Schneemengenflächen, kompakte Warn-/Lawinen-/Methodikflächen und bedingungsabhängiger Matrix-Scroll.
- Die Schneemengen-Flächenstaffelung ist reine UI-Skalierung und ausdrücklich keine WMO-/DWD-Warn- oder Intensitätsschwelle.
- MID_CHATGPT_GITHUB_CONTRACT.md wurde auf Source-PR-Gate → kontrollierten Merge → serverseitiges Release-ZIP → Installer → Worker/Pages → Stable-Promotion umgestellt; ZIP-im-PR ist regressionsgeschützt ausgeschlossen.

## MID v0.9.85.105 · 2026-09-26 · Bergwetter kompakter und schneller

- Finaler Replit-Handoff 9d166f7a083aac991f11856608fa0b93178e6aec aus replit/mid-18-2-14-v0-9-85-105-handoff-20260926 selektiv auf den Stable-Quellstand übernommen.
- Kernprognose und 7-Tage-Werte rendern vor GeoSphere-, Schneefallgrenzen-Ensemble- und Diagnose-Enrichments; Fehler und Verzögerungen der Zusatzdaten bleiben isoliert.
- 872/872 Regressionen, Typecheck und Produktionsbuild grün; 6 Viewports × Light/Dark sowie verzögerte und fehlerhafte Enrichment-Szenarien geprüft.
- Replit-Metadaten, Anhänge und vorgebaute dist-Artefakte wurden nicht in den vertrauenswürdigen Source-Branch übernommen.

## MID v0.9.85.105 · 2026-09-26 · Bergwetter kompakter und progressiv geladen

- Finaler Replit-Handoff `9d166f7a083aac991f11856608fa0b93178e6aec` aus `replit/mid-18-2-14-v0-9-85-105-handoff-20260926` selektiv auf den aktuellen Stable-Quellstand übertragen; Replit-Metadaten, Anhänge und vorgebaute dist-Artefakte wurden nicht übernommen.
- Berg-/Wintersportwetter zeigt Kernprognose und 7-Tage-Werte vor GeoSphere-, Ensemble- und Diagnose-Enrichments; verzögerte oder fehlerhafte Zusatzdaten blockieren die Kernansicht nicht.
- Die Hauptansicht ist weiter verdichtet; redundante Analyse-/Methodikblöcke liegen in kompakten Disclosures. Sonnenstunden und Tages-Max-UVI bleiben in 7-/14-Tage-Zeilen kompakt sichtbar.
- Replit-Abnahme: 872/872 Regressionen, Typecheck und Produktionsbuild grün; reale 6-Viewport-×-Light/Dark-Matrix sowie verzögerte/fehlerhafte Enrichment-Szenarien geprüft.
- Veröffentlichung ausschließlich über Source-PR-Gate → Auto-Merge → Release-ZIP → Installer/Pages → Stable-Promotion.

## MID v0.9.85.104 · 2026-09-26 · Berg-/Wintersportwetter responsiv nachgeschärft

- Finaler Replit-Handoff fe80b066739f40b1ede633a1124b3f18d9d366b4 wurde als Remote-Snapshot 155cd7aa11915cdc60229bd1b380d35a9939cd33 verifiziert und selektiv auf den aktuellen Stable-Quellstand übertragen.
- Neue Format- und Schneeabdeckungsregressionen schützen 0 cm, Spurenmengen unter 1 cm und fehlende Daten.
- Die Bergwetter-Visualmatrix prüft iPhone schmal/breit, Android-Breite, iPad hoch/quer und Desktop in Light/Dark sowie Expand/Collapse.
- Meteorologische Datenlogik, Einheitenwahl und Worker-Fachlogik bleiben unverändert.

## MID v0.9.85.103 · 2026-09-25 · Berg-/Wintersportwetter neu strukturiert

- Höhenprognose auf 168 Stunden erweitert; Tagesaggregate stammen aus derselben Höhenzeitreihe wie die geöffneten Details.
- Punktwerte und Intervallsummen bleiben fachlich getrennt; Missing-Snow-Fenster liefern NaN statt künstlichem Nullwert.
- Neue Regression scripts/test-mountain-seven-day-domain-1813.mjs schützt 7-Tage-, Höhen-, Niederschlags- und Schnee-Verträge.
- Replit-Designabnahme 09c3358cfe39f348f866b8f547d91183daebfca7 wurde in den geschützten Sourceweg übertragen.

## MID v0.9.85.103 · 2026-09-25 · MID 18.2.13 · Berg-/Wintersportwetter

- Höhenbezogene Bergprognose auf 168 Stunden erweitert; Tal/Mitte/Berg bleiben getrennte Punktprognosen.
- Zentrale 7-Tage-Aggregation leitet Temperatur, Wind/Böen, Niederschlag, Schnee, Sonnenschein sowie Nullgrad-/Schneefallgrenze aus derselben gewählten Höhenzeitreihe ab.
- Fehlende Schneefallintervalle erzeugen keinen künstlichen Nullwert mehr.
- Neue mobile-first Oberfläche mit Höhenwahl, horizontaler Istwert-Leiste, sieben geschlossenen Tageszeilen und maximal einem geöffneten 3-Stunden-Detail.
- Bestehende MID-Wetterpiktogramme, Windpfeile und DWD-Warnschwellen werden wiederverwendet; Winter-/Sommerpriorisierung ist getrennt.
- Replit-Abnahme: fokussierte Bergwetter-Regressionen, Typecheck, Produktionsbuild und Light/Dark-Viewportmatrix grün; finaler lokaler Design-Handoff 09c3358cfe39f348f866b8f547d91183daebfca7. Übernahme erfolgt in den geschützten GitHub-Sourceweg, nicht per Replit-Publish.

## MID v0.9.85.102 · 2026-09-25 · Bottom-Bar-Tippverhalten und Forecast-Horizont stabilisiert

- Der explizite Forecast-Horizont wird deklarativ aus activeNavSection an ForecastCockpit übergeben und beim Mount vor localStorage priorisiert.
- ForecastCockpit synchronisiert navigationHorizon auch nach dem Mount ohne Timeout- oder Delay-Hacks.
- Neue Regression scripts/test-bottom-bar-forecast-horizon-race-0985102.mjs schützt Mount/Remount und Bottom-Bar-Responsive-Verträge.

## MID v0.9.85.102 · 2026-09-25 · Bottom-Bar-/Forecast-Horizon-Stabilisierung

- Bottom-Bar „Heute“ übergibt den gewünschten Kurzfrist-Horizont deklarativ an das Forecast-Cockpit.
- Explizite Navigation gewinnt beim Mount/Remount vor `mid:forecastCockpit:activeHorizon`; der gespeicherte Wert bleibt nur Wiedereinstiegs-Fallback.
- Bereits gemountete Forecast-Cockpits synchronisieren den Navigationshorizont ohne Timeout-/Delay-Hacks.
- Neue Regression `scripts/test-bottom-bar-forecast-horizon-race-0985102.mjs` schützt Vorhersage→Aktuell→Heute, Heute→Karten→Vorhersage sowie Safe-Area-/Touchzielverträge.
- Wetterdaten, Modellfusion, Warnlogik, Worker und fachliche Prognosewerte werden nicht verändert.

## MID v0.9.85.101 · 2026-09-25 · MID 18.2.13 · Sky-Kohärenz, Nacht-Skybars und Kartenfokus

- Numerische DWD-SYNOP-ww-Codes 0–3 werden nicht als Open-Meteo weather_code 0–3 übernommen; ww=3 kann nicht mehr allein Bedeckt setzen.
- Frische fieldFresh(cloudCover)-Beobachtung steuert aktuellen Code/Label und das Hauptpiktogramm gemeinsam; Modell-Wolkenschichten werden dann nicht in den beobachteten Sky-Visual gemischt.
- 7d day-card und 14d fourteen-row projizieren solarTimelineWindow mit MID-Nachtfarbe und weichen 14/86-Prozent-Fades hinter Band/Squares.
- PwaInstallButton erhält einen transienten, nicht persistenten Kartenfokus-Unterdrückungsvertrag; der manuelle App-Button bleibt aktiv.
- Neue Regression scripts/test-mid-18-2-13-sky-coherence-night-skybars-install.mjs.

## MID v0.9.85.101 · 2026-09-25 · MID 18.2.13 · Aktuelles Wetter, Nacht-Skybars und Kartenfokus

- Aktuelles Wetter nutzt für Zustandslabel und Hauptpiktogramm denselben kanonischen Bewölkungsstand: frische beobachtete Gesamtbewölkung gewinnt gemeinsam; ohne frische Beobachtung greifen Text und Symbol gemeinsam auf den Modellhintergrund zurück.
- Numerische DWD-SYNOP-Wettermeldungen ww=0–3 werden nicht mehr als Open-Meteo-Wettercodes 0–3 interpretiert; insbesondere kann ww=3 nicht fälschlich „Bedeckt“ erzwingen.
- Die Bewölkungs-Info weist verwendete Quelle, Beobachtungsstand/Alter und Modellfallback nachvollziehbar aus.
- 7-Tage-Tageskarten und 14-Tage-Zeilen erhalten astronomisch berechnete Nachtflächen aus der zentralen solarTimelineWindow-Geometrie; Band- und Quadratdarstellung teilen dieselbe Nachtgeometrie.
- Der transiente PWA-Installationshinweis wird im Karten-/Komposit-Fokus temporär unterdrückt, ohne den manuellen „App“-Knopf oder den Installationsstatus zu verändern.
- Neue Regression `scripts/test-mid-18-2-13-sky-coherence-night-skybars-install.mjs`; vollständiger Source-Gate prüft Build, Regressionen und Web-/iOS-Hülle vor Veröffentlichung.

## MID v0.9.85.100 · 2026-09-25 · MID 18.2.12 · Mobile Einstellungsnavigation

- Geprüfter Replit-Handoff `e05bca0aa305a938c886b77e5062ca1c635d4994` vom Branch `replit/settings-mobile-tabs-098599`; read-only Handoff-Gate vollständig grün.
- Die mobile Einstellungsnavigation bleibt einzeilig horizontal scrollbar und führt den aktiven Bereich automatisch vollständig ins sichtbare Scrollfeld.
- Dezente linke/rechte Fortsetzungshinweise zeigen nur dann weitere Tabs an, wenn tatsächlich zusätzlicher Inhalt vorhanden ist; permanente Scrollbars entfallen.
- 44-px-Touchziele und Safe-Area-Abstände bleiben auf 360×800 und 390×844 erhalten; Light/Dark visuell geprüft.
- Neue Regression `scripts/test-settings-mobile-horizontal-tabs.mjs`; bestehender MID-18.2.7-Responsive-Test sowie Handoff-Build/Web-/iOS-Hüllenprüfung grün.
- Keine Änderung an Wetterdaten, Modellfusion, Warnlogik, Schwellen, Parameterfarben, Worker- oder iOS-Fachlogik.

## MID v0.9.85.99 · 2026-09-25 · MID 18.2.11 · Responsive Forecast-Horizontnavigation

- Geprüfter Replit-Handoff dcdfc8c18b1fcc84c19547a8f4d85c163ce07960 über den read-only Handoff-Gate übernommen.
- navigateToDashboardSection verwendet bei modernen Forecast-Modulen die unmittelbar vor dem Modul liegende Horizontnavigation als Scrollziel.
- Mobile Forecast-Horizontnavigation erhält Safe-Area-Scroll-Margin und Abstand zum nachfolgenden Forecast-Modul.
- Neue Regression scripts/test-modern-forecast-horizon-viewport.mjs; Handoff-Build und Web-/iOS-Hüllenprüfung grün.

## MID v0.9.85.99 · 2026-09-25 · MID 18.2.11 · Forecast-Horizontnavigation responsive stabilisiert

- Replit-Handoff aus geprüftem SHA `dcdfc8c18b1fcc84c19547a8f4d85c163ce07960` übernommen; Handoff-Gate vollständig grün.
- Bottom-Tab-Forecastnavigation scrollt bei Prognosemodulen auf die unmittelbar zugehörige Horizontleiste statt den darunterliegenden Modulcontainer, sodass die Leiste nicht oberhalb des Viewports verschwindet.
- Mobiler/Querformat-Abstand und Scroll-Margin berücksichtigen Safe Areas; keine Sticky-/Fixed-Navigation eingeführt.
- Neue Regression `scripts/test-modern-forecast-horizon-viewport.mjs`; vorhandener MID-18.2.7-Responsive-Test und Produktionsbuild grün.
- Reale Sichtprüfung 360×800 Light bestätigt; weitere Zielgrößen sind zusätzlich regressionsgeschützt, die Replit-Browserautomation war dort nicht zuverlässig genug für eine behauptete Sichtabnahme.

## MID v0.9.85.98 · 2026-09-24 · MID 18.2.10 · 90‑Minuten-Skybar mit Nachtkennzeichnung

- ForecastCockpit.ShortTermRibbon leitet now90StartEpoch/now90EndEpoch aus den realen 15‑Minuten-Intervallen ab und nutzt solarTimelineWindow gemeinsam mit Aktuell/24 h.
- now90NightBands werden auf die 120×16-Skybar-Geometrie projiziert und vor SkyBarSegmentsSvg/SkyBarHourCellsSvg gerendert; MID-Nachtfarbe und 14/86-%-Fade entsprechen Aktuell.
- Neue Regression scripts/test-mid-18-2-10-now90-night-098598.mjs schützt Solarquelle, Layer-Reihenfolge, Fade, Farbe und Baseline-Vertrag.

## MID v0.9.85.98 · 2026-09-24 · MID 18.2.10 · 90‑Minuten-Skybar-Nachtkennzeichnung

- 90‑Minuten-Skybar „Heute / Ab jetzt“ nutzt dieselbe zentrale Solar-Geometrie wie „Aktuell“ und das 24‑h‑Profil.
- Nachtbereiche werden aus den realen 15‑Minuten-Intervallen auf die Skybar-Geometrie projiziert und hinter Wettersegmenten bzw. Stundenquadraten gerendert.
- MID-Nachtfarbe und weiche 14/86-%-Fade-Geometrie entsprechen „Aktuell“; Niederschlag, Bewölkung und Sonne behalten ihre bestehende Fachlogik.
- Regression: `scripts/test-mid-18-2-10-now90-night-098598.mjs`.

## MID v0.9.85.97 · 2026-09-24 · MID 18.2.10 · Replit-Audit: Cache, Fokus und lokale Zeitbasis

- Forecast-Core-Cachevertrag Frontend v4 und Worker-Edge v3 dimensionieren Koordinaten, gerundete Höhe und effektive IANA-Zeitzone; unsichere Legacy-Einträge werden nicht migriert.
- Forecast-Fusion-Localcache v10 trennt Höhenstände; Lead-Time-Reconciliation und Tagesfusion nutzen reale lokale Stunden-Epochen.
- forecastPeriods.addForecastDays verwendet reine gregorianische Kalenderarithmetik ohne UTC-Date-Mutation; SevenDayForecastSummary nutzt diesen Vertrag für die Folgenacht.
- AppPortalPopover stellt den gemeinsamen verschachtelbaren Fokusstack bereit; Mehr-Drawer, Event-Center, Impressum und Einstellungen sind angeschlossen.
- Neue Regression test-mid-18-2-10-replit-audit-098597 schützt Cache-Dimensionen, Fokusvertrag, DST-/Datumsgrenzen und Release-Version.

## MID v0.9.85.97 · 2026-09-24 · MID 18.2.10 · Replit-Audit-Fixes

- Forecast-Core-Cache Frontend v4 und Worker-Edge v3 trennen Koordinaten, Höhe und effektive Ortszeitzone; unsichere Legacy-Caches werden nicht mehr als frischer Stand migriert.
- Direktabruf und Worker-Pfad reichen Höhe und Zeitzone konsistent an Open-Meteo weiter; der explizite Worker-Request-Key enthält dieselben Dimensionen.
- Forecast-Fusion-Cache v10 trennt Höhenstände; Tages-Lead-Time basiert auf realen lokalen Stunden-Epochen statt auf festem 12:00Z.
- Gemeinsamer Fokusstack für Dialoge/Popover/Sheets mit Initialfokus, Tab-/Shift-Tab-Fang, Escape nur auf oberster Ebene und Fokus-Rückgabe; Mehr, Event-Center, Impressum und Einstellungen angeschlossen.
- Zivile Kalenderarithmetik für Folgenächte arbeitet ohne UTC-Date-Mutation und ist für CET/CEST, Datums-/Jahresgrenzen sowie weit entfernte IANA-Zeitzonen regressionsgeschützt.
- Neue Regression: `scripts/test-mid-18-2-10-replit-audit-098597.mjs`.

## MID v0.9.85.96 · 2026-09-23 · MID 18.2.9 · METAR-Beobachtung und kompakte 14-Tage-Ansicht

- METAR-Current-Auswertung endet vor Trend-/Remark-Gruppen wie TEMPO, BECMG, NOSIG, INTER, PROB30/40, FM-Zeitgruppen und RMK.
- Der reproduzierende EDDG-Fall `... Q1020 TEMPO SHRA BKN025TCU` kann Current Weather nicht mehr fälschlich auf Regenschauer/Trendbewölkung setzen.
- 14 Tage: Default je Tag nur Wetterkopf, Tmin/Tmax, eine Skybar, Niederschlag, Wind/Böen und Konfidenz; Sekundärwerte ausschließlich im ausgewählten Inline-Detail.
- Doppelte 24-h-Detail-Skybar sowie separate Defaultblöcke für Sonnenscheindauer, Temperaturabweichung und Regime wurden entfernt.
- Replit vor Designänderung auf mid-stable v0.9.85.95 synchronisiert; Veröffentlichung weiterhin ausschließlich über den kanonischen GitHub-Releaseweg.
- Regressionen: `test-metar-trend-observation-boundary-098596.mjs` plus aktualisierter `test-fourteen-day-replit-fluid-grid-098593.mjs`.

## MID v0.9.85.95 · 2026-09-23 · MID 18.2.9 · Gewitter-, RUC-, Skybar- und Performance-Härtung

- J.1: signalScore-only-Vertrag für Detail-/Rapid-Gewitterdiagnose; Legacy-percent-Pfade aus UI und Spezialmodulen entfernt.
- J.2: MU-CAPE/CIN in nativen stündlichen Specialist-Pfad verschoben, Valid-Time-Grenze 35 min eingeführt; VIS/CEILING feldspezifisch als native 15-min-Zustände gekennzeichnet.
- J.3: Skybar trennt direkte Sonnenscheindauer von Wolkenkomplement; alter Komplement-Vertrag und Wissenschaftstest aktualisiert.
- J.4: WeatherNext 2 mit nativeTemporalHours=6/interpolatedHourly markiert, aus stündlichen Warn-/Event-Ensembles ausgeschlossen und in Tagesgewichtung konservativ berücksichtigt.
- J.5: Feature-Chunk-Budgets, Aggregate-Source-of-Truth, Entfernung von weather.tsfrag und dokumentierter Dependency-Review ohne partielle Lockfile-Migration.

## MID v0.9.85.95 · 2026-09-23 · MID 18.2.8 · J.1–J.5 Härtung

- J.1: signalScore-only-Vertrag für Detail-/Rapid-Gewitterdiagnose; Legacy-percent-Pfade aus UI und Spezialmodulen entfernt.
- J.2: MU-CAPE/CIN in nativen stündlichen Specialist-Pfad verschoben, Valid-Time-Grenze 35 min eingeführt; VIS/CEILING feldspezifisch als native 15-min-Zustände gekennzeichnet.
- J.3: Skybar trennt direkte Sonnenscheindauer vom Wolkenkomplement; Wissenschaftsregression entsprechend aktualisiert.
- J.4: WeatherNext 2 mit nativeTemporalHours=6/interpolatedHourly markiert, aus stündlichen Warn-/Event-Ensembles ausgeschlossen und in Tagesgewichtung konservativ berücksichtigt.
- J.5: Feature-Chunk-Budgets, Aggregate-Source-of-Truth, Entfernung von weather.tsfrag und dokumentierter Dependency-Review ohne partielle Lockfile-Migration.

## MID v0.9.85.89 · 2026-09-22 · Arbeitspaket H · Responsive Gesamtabnahme und 7-Tage-Korrektur

- Replit-Abnahme: 7-Tage-Fix sowie H.1/H.2a/H.2b/H.2c umgesetzt; H.1 und H.2c jeweils mit vollständiger Light/Dark-Viewportmatrix grün, Typecheck/Produktionsbuild/Regressionen ohne Befund.
- Produktive Übernahme erfolgt bewusst als Mapping auf ForecastCockpit, MeteogramPanel und WaterSportsPanel statt durch Kopieren des Mockup-Sandbox-Codes.
- Neue finale UI-Schicht midC18WorkPackageH.css erzwingt die vertikale 7-Tage-Tagesliste unabhängig vom früheren Orientierungsvertrag, ordnet die aktive Detailfläche hinter allen sieben Zeilen an und schützt H.2c-Overflow-/Touchverträge.
- Regression test-mid-18-2-6-h-responsive-handoff-098589.mjs schützt die produktiven 7-Tage-, Meteogramm- und Tide-Verträge; meteorologische Daten-, Warn-, Schwellen-, Modellfusions- und Skybar-Fachlogik bleiben unverändert.

## MID v0.9.85.88 · 2026-09-22 · Arbeitspaket G · Ensemble, Klima und Widgets

- Replit-Abnahme vollständig grün: Typecheck, Produktionsbuild, fokussierte Regressionen sowie Light/Dark auf 360×800, 390×844, 430×932, 844×390, 768×1024, 1024×768 und 1440×900.
- Produktintegration verwendet die bestehenden EnsemblePanel-, ClimatePanel- und AppleWidgetSettings-/Export-Verträge; Datenquellen, Schwellen und Berechnungen wurden nicht geändert.
- Neue finale UI-Schicht midC18WorkPackageG.css schützt Umbruch, Tooltipbreite, Touchziele und Overflow; Regression test-mid-18-2-5-g-ensemble-climate-widgets-098588.mjs sichert die Verträge.

## MID v0.9.85.87 · 2026-09-22 · 14-Tage-Zeilen responsiv entzerrt

- Replit-Abnahme: Light/Dark auf 360×800, 390×844, 430×932, 844×390, 768×1024, 1024×768 und 1440×900 sowie längere mobile Detailansichten grün.
- Mobiler 14-Tage-Header nutzt flexiblen Textbereich plus getrennte Konfidenzspalte mit mindestens 132 px; verschachtelte Elemente erhalten min-width:0 und wesentliche Texte keinen Truncate-Vertrag.
- Neuer Regressionstest schützt ForecastRow-Struktur, Konfidenzpille, Umbruch und Overflow-Vertrag.
- Der v0.9.85.86-Heute-/24-h-Viewport-Regressionsvertrag ist vorwärtskompatibel auf 0.9.85.86 oder neuer fortgeschrieben; seine fachlichen Viewport-Assertions bleiben unverändert.

## MID v0.9.85.86 · 2026-09-22 · Heute-/24-h-Viewport-Fix

- Replit-Abnahme für Smartphone, Tablet und Desktop in Light/Dark vollständig grün.
- Künstliche 600/640-px-Mindestbreiten des 24-h-Profils entfernt; der Profiltrack bleibt durchgehend stündlich.
- Außencontainer der Heute-Arbeitsfläche gegen horizontalen Overflow abgesichert; der bewusste 90-Minuten-Innenscroll bleibt lokal begrenzt.
- Untere Profilachse erhält sicheren Rendering- und Padding-Raum; meteorologische Fachlogik und Daten bleiben unverändert.
- Neue Regression test-mid-18-2-5-today-viewport-098586 schützt den Responsive-Vertrag.

## MID v0.9.85.85 · 2026-09-22 · MID 18.2.5 · gesammelte Current-/24-h-/7-/14-Tage-Korrekturen

- Beide Replit-Einschübe gemeinsam abgenommen: Typecheck, Produktionsbuild und fokussierte Regressionen grün.
- Responsive Abnahme für Light/Dark auf Smartphone, Tablet und Desktop inklusive Hoch-/Querformat ohne offene Restpunkte.
- Produktive Übernahme schützt Current-Windrichtungspfeil, getrennten +12-h-Header, ausschließlich stündliches 24-h-Profil, aktive 7-/14-Tabs, kollisionsfreie 7-Tage-Zeilen, lesbare Konfidenz-Pillen und ganzzahlige Haupt-Sonnenstunden.
- Neue Regression scripts/test-mid-18-2-5-ui-fixes-098585.mjs und nach Arbeitspaket F geladener Designlayer src/midC18ResponsiveCorrections.css.

## MID v0.9.85.84 · 2026-09-22 · Arbeitspaket F · Map-first Kartenarbeitsraum

- Replit-F-Abnahme einschließlich Transparenz-Follow-up vollständig grün.
- Neuer Designlayer `src/midC18MapFirstWorkspace.css`, geladen nach Arbeitspaket E.
- Produktive Fachverträge verbleiben in `RadarPanel.tsx`, `WeatherMapsPanel.tsx` und `SynopticPanel.tsx`; keine Änderung der meteorologischen Datenlogik.
- Neue Regression `scripts/test-mid-18-2-5-f-map-first-098584.mjs` schützt Timeline, Playback, Jetzt, Layer-Deckkraft, Synoptik und Responsive-Komposition.
- Light/Dark-Abnahme: 360×800, 390×844, 430×932, 834×1112, 1112×834 und 1440×900.

## MID v0.9.85.83 · 2026-09-22 · Arbeitspaket E

- ForecastCockpit: gemeinsame MidForecastRow-Familie für 7-/14-Tage.
- 7 Tage: selectedDate ist alleiniger Inline-Detailzustand; unabhängiges expandedDate entfernt.
- 14 Tage: bisherige Fokuskarte direkt unter die aktive Tageszeile verschoben; kompakte Skybar und Tmin/Tmax-Faden aus bestehenden Daten ergänzt.
- Neuer zuletzt geladener Designlayer für Desktop, Tablet hoch/quer und Smartphone.
- Neuer Regressionstest schützt gemeinsame Row-Struktur, genau eine Inline-Erweiterung, vorhandene Datenquellen und Responsive-Vertrag.
- Replit-Vorprüfung: Typecheck/Produktionsbuild und Light/Dark-Viewportmatrix grün; kanonischer GitHub-Gate bleibt maßgeblich.

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

# MID Build-Changelog · v0.9.85.37

## Redesign-Stufe C17 · DWD-Ortsausschnitt wieder exakt lokalisiert

- Der reale Mobil-Sichtvergleich zeigte, dass „Wolken + Niederschlagsart“ trotz unveränderter DWD-Georeferenzierung nicht in jedem Öffnungs-/Resize-Zyklus sichtbar auf dem gewählten Ort stehen blieb. Ursache war die Darstellungsfolge: der Bildcanvas konnte nach dem ersten Zentriervorgang noch seine Größe ändern beziehungsweise animieren.
- DwdPrecipitationTypeRadar zentriert jetzt mit der tatsächlich gerenderten Canvas- und Viewportgröße. Ein zusätzlicher ResizeObserver überwacht sowohl Viewport als auch Canvas und zieht den gewählten Standort nach jeder relevanten Größenänderung wieder exakt in die Mitte.
- Bildladen löst nach dem Layout zusätzlich eine Standortzentrierung aus. Die Wiederholungen liegen bei unmittelbarem Layout, zwei Animation Frames sowie 80/180/360 ms, damit iOS-/PWA-Layoutwechsel und aufklappende Bereiche nicht mehr in einem halbverschobenen Zustand enden.
- Der Standortmarker ist nun ein konsistentes MID/Lucide-MapPin mit zusätzlichem 6-px-Ankerpunkt exakt auf dem georeferenzierten Originalpixel. Der bisherige Emoji-Pin entfällt.
- src/midC17DwdLocationFix.css entfernt die Breitenanimation des Originalbild-Canvas, schützt Auto-Scroll-Zentrierung und reduziert die eingebettete Originallegende mobil leicht, ohne DWD-Inhalt oder Pixelanalyse zu verändern.
- scripts/test-c17-dwd-location-centering-098537.mjs schützt die etablierte Kalibrierung einschließlich des realen Elsig-Sichtvergleichs (50,67° N / 6,76° E → normierter Originalbildpunkt 0,33102793 / 0,46836195) und prüft exakte Zentrierbarkeit auf 320/390/430/768 px Viewports.
- Keine Änderung an DWD-Quelle, Originalbild, Niederschlagsartenklassifikation, Pixelanalyse, Radar-/Satellitenzeit, Nowcast-/RUC-Logik oder meteorologischen Schwellen.

# MID Build-Changelog · v0.9.85.36

## Redesign-Stufe C16 · Heute-Proportionen nach realem iPhone-Sichtvergleich

- Der Sichtvergleich mit v0.9.85.35 zeigte, dass das 24-h-Wetterprofil auf schmalen Viewports die volle Desktop-Y-Geometrie von 632 Einheiten beibehielt und dadurch gegenüber der verfügbaren Breite sichtbar überdehnt wirkte.
- `ForecastCockpit` skaliert die komplette Y-Geometrie des 24-h-Profils jetzt gemeinsam und konsistent: Smartphone bis 560 px auf 72 %, mittlere Viewports bis 860 px auf 86 %, Desktop unverändert auf 100 %. Zeitachse, Solarereignisse, Wetterpiktogramme, Wolken-, Temperatur-, Niederschlags-, Wind-, Druck- und Hazardspuren folgen derselben Skalierung.
- `src/midC16TodayProfileFix.css` schützt Textfluss und Containerbreiten. Die Kurzfrist-Zusammenfassung darf umbrechen, die 90-Minuten-Kopfzeile wird auf sehr schmalen Geräten von redundantem Zusatztext befreit.
- Der DWD-Disclosure verwendet nun einen expliziten Button statt des nativen `details`-Zustands. Dadurch kann eine vom Browser wiederhergestellte `open`-Eigenschaft das große DWD-Originalbild nach Rückkehr oder Reload nicht ungefragt erneut öffnen. Das Bild wird weiterhin erst nach Nutzeraktion gerendert. Zusätzlich wurde der nicht definierte helle `--card`-Fallback entfernt; die Disclosure-Fläche verwendet jetzt die aktiven MID-Themeflächen `--surface`/`--s2`.
- Wetterdaten, DWD-Originalprodukt, Pixelanalyse, Zoom, Nowcast-/RUC-Fusion, Warnschwellen, Parameterfarben und Zeitsemantik bleiben unverändert.
- `scripts/test-c16-today-profile-density-098536.mjs` schützt die responsive Profilgeometrie, den Textfluss und den explizit geschlossenen DWD-Startzustand.

# MID Build-Changelog · v0.9.85.35

## Redesign-Stufe C15 · Heute-Dichte und progressive DWD-Ansicht

- `DwdPrecipitationTypeDisclosure` hält das amtliche DWD-Originalprodukt vollständig verfügbar, rendert die große Bildfläche in „Heute“ und Kurzfrist aber erst nach bewusster Öffnung. Originalbild, Radar-/Satellitenzeit, Pixelanalyse und Zoom bleiben unverändert erhalten.
- `ForecastCockpit` und `ShortTermForecast` verwenden denselben Disclosure-Vertrag, damit das DWD-Bild nicht mehr mehrfach als dauerhaft dominante Fläche erscheint.
- `src/midC15TodayDensity.css` wird nach C14 geladen und verdichtet das mobile 24-h-Wetterprofil. Abgeleitete Signale werden auf schmalen Viewports als horizontale, touchfreundliche Leiste geführt; Auflösungswahl, Legende und Info bleiben erhalten.
- Die Profil- und Hilfeflächen sind weiterhin an ihren eigenen Viewport gebunden. Die meteorologischen Spuren, Warnschwellen, Parameterfarben, Quellprovenienz und Zeitsemantik werden nicht verändert.
- `scripts/test-c15-today-density-098535.mjs` schützt die progressive DWD-Ansicht, die C15-Kaskadenposition und die mobile Profil-Dichte. Der bestehende C11-Vertrag wurde ausschließlich auf den gemeinsamen Disclosure-Namen fortgeschrieben.

# MID Build-Changelog · v0.9.85.34

## Redesign-Stufe C14 · Karten als Arbeitsraum und reale Viewport-Korrekturen

- `src/midC14MapWorkspace.css` vereinheitlicht den Kartenbereich als Map-first-Arbeitsraum. Komposit und DWD-Wetterkarten verwenden denselben Dichtevertrag für Smartphone, Querformat, Tablet und Desktop.
- Der bestehende Komposit-Fokus bleibt fachlich unverändert: Radar, Satellit, Nowcast und Modell/Synoptik teilen weiterhin die bestätigte Produktzeitachse. Überschrift, Moduswahl und Zeitleiste werden visuell deutlich kleiner, die Karte erhält den größten Viewport-Anteil.
- `WeatherMapsPanel` entfernt die dauerhaft doppelte Zeitschritt-Auswahl. Direkt sichtbar bleiben nur Modell und Kartenprodukt; die Karte trägt Produkt, Gültigkeit und Lead Time kompakt als Overlay.
- Druckfläche/Höhe, Kartenbasis, Deckkraft und Reload liegen nun in `Darstellung & Ebenen`; Quelle, INIT und Gültigkeit liegen in `Quelle & Lauf`. Beide Bereiche sind standardmäßig eingeklappt und bleiben vollständig zugänglich.
- Die gemeinsame Kartenzeitleiste behält Zurück/Play/Vor/Range und ergänzt einen `Jetzt`-Sprung zum fachlich bevorzugten verfügbaren Termin.
- Der Screenshot-Abgleich zeigte eine zentrale Kaskadenursache: `v078` wurde nach den Redesign-Dateien geladen und konnte C7–C13 auf realen Smartphones teilweise wieder überschreiben. `src/main.tsx` lädt den Legacy-Layer nun vor sämtlichen Redesign-Stufen; C14 bleibt als letzte visuelle Schicht maßgeblich.
- `src/midC14ViewportFixes.css` verdichtet Kopf, Suche, Favoriten, Orts-/Warnkontext und aktuelle Kernwerte. Die primäre Smartphone-Ansicht zeigt vier Kernparameter; Sichtweite bleibt in den Zusatzdetails erreichbar.
- Das Impressum erhält einen strikt viewportgebundenen Dialog mit dauerhaft zugänglichem, sticky Schließen-Kopf und intern scrollendem Inhalt. Hoch- und Querformat verwenden Safe-Areas und `100dvh`.
- DWD-Originalbildzoom und breite Diagramme dürfen ihre äußeren Container nicht mehr verbreitern. Vergrößerung und horizontales Scrollen bleiben auf den jeweiligen Bild-/Diagrammviewport beschränkt; die App selbst wird horizontal geklemmt.
- `CompositeTimelineContract.phaseSources` bereitet die gemeinsame Kartenzeitachse auf einen späteren transparenten Übergang von Satellitenbeobachtungen zu modellbasierten Pseudo-Satellitenbildern vor. Jede Phase kann eine eigene Quelle tragen; weiterhin werden ausschließlich bestätigte Produktzeitpunkte verwendet und keine Zwischenbilder erfunden.
- Datenquellen, DWD-WMS/Raster, Radar-/Satelliten-/Nowcastlogik, Modellkonturen, Warnregeln, Farbcodierungen und Zeitsemantik wurden nicht geändert.
- `scripts/test-c14-map-workspace-098534.mjs` schützt Map-first-Hierarchie, eine gemeinsame Zeitleiste, einklappbare Sekundärsteuerung und Responsive-Verträge. `scripts/test-c14-viewport-fixes-098534.mjs` schützt Kaskadenreihenfolge, Portrait-Impressum, Zoom-Containment, Smartphone-Dichte und den künftigen Quellenwechsel Satellit → Pseudo-Satellit.

## Redesign-Stufe C13 · mobile Dichte und Aktuell

- `src/midC13MobileDensity.css` wird nach C12 geladen und korrigiert die im realen Smartphonebild noch zu große, kachelartige Aktuell-Darstellung.
- Der Orts-/Warnkontext erhält verbindlich die Reihenfolge vor `Aktuell`; die alte CSS-Sortierung darf den Ort nicht mehr ans Abschnittsende verschieben.
- Der bestehende `hidden`-Vertrag der Zusatzwerte wird auf Autorenebene geschützt. `mehr/weniger` blendet die Sektion damit tatsächlich ein bzw. aus.
- Geöffnete Zusatzwerte werden als eine zusammenhängende, ruhige Detailfläche mit Zeilentrennung dargestellt; UVI-/AQI-Skalen und Sonne/Mond bleiben erhalten, ohne wieder eine gleichrangige Kachelmatrix zu bilden.
- Auf Smartphonebreiten scrollt der große Kopf mit der Seite statt den knappen Viewport dauerhaft zu belegen. Logo, Aktionsflächen, Suche, Favoriten, Ortskopf, Atmosphärenkarte, Radar-Nowcast und Bottom-Bar erhalten reduzierte Höhen und Schriftgrößen mit Safe-Area-Schutz.
- Wetterdaten, Nowcast-/RUC-Logik, Warnschwellen, Piktogramme, Parameterfarben, Quellenbewertung und Zeitsemantik bleiben fachlich unverändert.
- `scripts/test-c13-mobile-density-098533.mjs` schützt Reihenfolge, echte Klappung, De-Kachelung, mobile Dichte und die wichtigsten Breakpoint-/Safe-Area-Verträge.

## Redesign-Stufe C12 · Vorhersage

- `src/midC12ForecastRedesign.css` wird nach C11 geladen und setzt die verbindliche visuelle Hierarchie der Vorhersage um.
- 7 Tage: Verlaufsgrafik bleibt Primärvisualisierung; Tageswerte bilden ein zusammenhängendes Band; die stündliche Detailansicht wird in denselben Arbeitsraum integriert.
- 14 Tage: Ensemble-/Konsistenzinformationen bleiben vollständig erhalten; Tagesdarstellung wird als fortlaufende Spalten organisiert; der gewählte Tag erhält eine integrierte Detailtiefe statt einer zweiten gleichgewichteten Karte.
- Responsive Verträge schützen Smartphone Hoch-/Querformat, Tablet, Desktop, Safe-Areas, horizontale Prognosebereiche und reduzierte Bewegung.
- Keine Änderung an Wetterdaten, Nowcast-/RUC-Logik, Warnschwellen, Piktogrammlogik, Parameterfarben oder Zeitsemantik.
- `scripts/test-c12-forecast-redesign-098532.mjs` schützt Struktur, Auswahlzustände, Responsive-Verträge und den ausgelieferten, nichttechnischen App-Changelog.

## Veröffentlichung

Verbindlicher Pfad: **Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → Stable-Promotion**. Der Stand darf erst nach grünem Gate und erfolgreicher Stable-Promotion als veröffentlicht gelten.
