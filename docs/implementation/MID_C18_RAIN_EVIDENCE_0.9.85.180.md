# MID C18 · Stark-/Dauerregenhinweise · 0.9.85.180

Zusätzlicher Responsive-Vertrag: Die alte mobile `display:flex!important`-Scrollerregel wird ausdrücklich durch `display:grid!important` überschrieben. Die Pflichtregression prüft unter CI zwölf echte Chromium-Viewport-/Theme-Fälle (Telefon, Querformat, Tablet, Desktop) mit der vollständigen kanonischen CSS-Kaskade: Kartenbreite, Textüberlauf und Seitenüberlauf. Der PR blieb während dieser Nachprüfung Entwurf; neue SHA-Prüfungen werden nicht aus dem alten Kopf übernommen.

Nach dieser Responsive-Ergänzung erneut 921/921 lokale Regressionen und Produktionsbuild/Typecheck grün (06.10.2026, 10:58 UTC). Chromium ist lokal nicht installiert; die tatsächlichen zwölf Browserfälle sind deshalb ausdrücklich Bestandteil der serverseitigen Pflichtregression und noch kein lokaler Live-/Browserbeleg.

Integrierter Freigabekandidat auf .179: 921/921 Regressionen, Produktionsbuild/Typecheck, Worker-Syntax und Capacitor-Copy/iOS-Shell grün (06.10.2026, 10:50 UTC). Widget-Automation und sämtliche kanonischen/aktiven Workflows gegenüber der .179-Basis unverändert. Veröffentlichung nur über den normalen Source-PR-/Installer-Pfad. Der ältere Entwurf PR271 wird durch den Source-PR auf dieser frisch freigegebenen Basis ersetzt; keine Historie wird überschrieben.

Releasebasis: main = mid-stable = `519f28fe5637c28c91032cf75e29768c7e7a9c5a` (0.9.85.179), regulärer Installer und öffentliche Versionsprüfung erfolgreich. Beide parallelen Widget-Erweiterungen bleiben unverändert enthalten.

## RUC-Rückstand am 06.10.2026

Run 37447697068 prüfte um 10:08:35 UTC den 0900Z-Kandidaten. T_2M fehlte für 23:00 UTC (T+14); der bestehende fail-closed Vollständigkeitscheck verwarf diesen Kandidaten und bereitete 0700Z vollständig auf. Um 10:20:04 UTC bestätigte der Publish-Job Pages und Worker mit run=0700Z und ageHours=3.33. Ein erfolgreicher Workflow bedeutet deshalb nicht automatisch einen neueren Modelllauf. Der folgende reguläre Run 37447994238 bereitete 0900Z um 10:28:48 UTC vollständig auf: die Pflichtstunde war nun verfügbar. Keine Absenkung des Horizonts, kein zusätzlicher Dispatch oder kostenpflichtiger Schritt. Die Live-Publikation dieses 0900Z-Laufs wird separat verifiziert; erfolgreiche Aufbereitung allein ist kein Live-Beleg.

## Screenshot und belegte Ursache

Live-Abschluss der RUC-Prüfung: Run 37447994238 / Publish-Job 112224520335 bestätigt am 06.10.2026 um 10:31:43 UTC Pages und Worker mit `run=2026-10-06T09:00`, `ageHours=1.53`, 542040 Punkten und 20 EPS-Mitgliedern. Frischer Abruf der öffentlichen `https://www.midwx.app/ruc/latest.json` bestätigt denselben Lauf. Der Rückstand über drei Stunden ist damit im regulären Workflow aufgeholt; kein manueller Dispatch oder Gate-Workaround.

Der Screenshot zeigt ein niederschlagsfreies 24-h-Profil, aber „Dauerregen, Stufe 2“ ab 07.10.03 Uhr und orange Hazard-Stunden. Ort, vollständiger Hinweistext und zugrunde liegender Modelllauf sind im Bild nicht enthalten; die exakte ursprüngliche Niederschlagsreihe lässt sich daraus nicht rekonstruieren. Der folgende systemische Fehler ist unabhängig davon im aktuellen Quellcode reproduziert.

`ForecastCockpit` berechnet seine Profileinschränkung aus `hazards(hours, ...)`. Der App-Aufruf liefert dieselben finalisierten `displayHours`, die Modellfusion, Wetterzwilling, Radar und hyperlokale Korrektur enthalten. Die allgemeine MID-Warnübersicht verwendet diese Reihe ebenfalls. `dwdWarnings.ts` klassifiziert rollierende Mengen nach DWD-Schwellen: Starkregen 15/25/>40 mm in 1 h und 20/35/>60 mm in 6 h; Dauerregen 25/40/>70 mm in 12 h, 30/50/>80 mm in 24 h, 40/60/>90 mm in 48 h und 60/90/>120 mm in 72 h. Das sind MID-Modellhinweise, keine direkt eingelesenen amtlichen DWD-Warnungen.

Bis .177 wurde das gesamte rollierende Berechnungsfenster als Gültigkeit verwendet: ein trocken beginnendes 48-h-Fenster konnte durch Regen erst am Ende die Schwelle überschreiten. Mehrere überlappende Fenster erweiterten die Gültigkeit zusätzlich. Danach konnte die probabilistische Präsentation anhand weiterer Vorwärtssummen von Standort-/Umfeld-Ensemblequantilen noch früher beginnen oder später enden. Das Zeitfenster beschrieb damit den Suchraum der Berechnung statt die Regenphase.

Reproduktion: stündliche Reihe ab 06.10.2026 09 UTC, erste 48 Stunden trocken, danach 24 Stunden jeweils 2 mm Regen, anschließend trocken. Vorher Dauerregen 48 mm/48 h von **07.10.05 UTC bis 09.10.23 UTC**, obwohl der Regen nur **08.10.09 UTC bis 09.10.09 UTC** fällt. Diese falsche frühe Markierung liegt bereits im trockenen 24-h-Profil. Nachher bleiben Menge und Schwellensignal erhalten, die Gültigkeit umfasst genau die nassen Beiträge.

## Weitere bestätigte Systematikfehler

- Der Erklärungssatz „Ensemble-Läufe und die räumliche Umfeldprüfung stützen dabei auch zeitlich versetzte Treffer“ wurde schon bei bloß vorhandenem Ensemble ausgegeben, ohne den Treffer für das konkrete Signal zu belegen. Er entfällt app-weit zugunsten einer neutralen Aussage über abweichende Szenarien.
- Ein heuristischer Mengenbereich einer einzelnen deterministischen Modellsumme war als „Wahrscheinlichkeitsbereich“ beschriftet. Regen zeigt jetzt die tatsächliche Modellsumme einschließlich Summendauer und „Modellsumme · DWD-Schwellen“; keine erfundenen Quantile oder Eintrittswahrscheinlichkeiten.
- Die Summenfunktion zählte Arrayeinträge als Stunden, auch bei Lücken oder Mehrstundenabständen. Vorhandene Zeitachsen müssen jetzt vollständig und im Stundenraster liegen; sonst entsteht aus dieser Summe kein Schwellensignal. Ungetaktete bestehende Legacy-Inputs behalten den bisherigen Vertrag. Diese gemeinsame Summe schützt auch Schnee-/Schneeverwehungsfenster vor derselben falschen Zeitinterpretation.

## Umsetzung und Verbraucher

Die Schwellenberechnung bleibt erhalten. Für Stark-/Dauerregen wird die Warnzeit aus den tatsächlich nassen Beiträgen innerhalb des jeweiligen geprüften Summenfensters bestimmt (mindestens 0,05 mm/h). Vorhandene explizite Niederschlagsintervallgrenzen haben Vorrang vor einem bloßen Stundenzeitpunkt. Dadurch verschwindet auch der systematische Versatz bei rückwärts akkumulierten Modellwerten. Die Zahlen bleiben vollständige N-h-Modellsummen; die markierte Regenphase ist nicht mit der mathematischen Summendauer gleichzusetzen.

Regenfenster werden nicht durch vorwärts summierte marginale Ensemblequantile gepolstert. Stundenquantile zu addieren ergibt ohne gemeinsame Member-Zeitreihen keine belegte Quantilverteilung der Gesamtsumme. Solche Daten dürfen weder einen trockenen Zeitpunkt als Regen markieren noch als Bestätigung beschriftet werden. Wind-/Konvektionsmethodik und die echten Modell-Ensemble-Verteilungen bleiben ansonsten erhalten.

Im 24-h-Profil werden Regen-Einschränkungen außerdem nur an tatsächlich nassen dargestellten Punkten übernommen. Das schützt auch trockene Pausen innerhalb einer längeren Regenphase und lokal durch Radar korrigierte trockene Stunden; andere vorhandene Gefahren bleiben sichtbar.

Die Korrektur sitzt in den gemeinsamen `summarizeDwdWarnings`-/`hazards`-Funktionen; sie erreicht Warnübersicht, Warn-Timeline, 24-h-Profileinschränkung, Tageshinweise und weitere Verbraucher. In der Warnübersicht beschreibt der Regen-Tooltip nun die Regenphase des Summenfensters statt pauschal ein probabilistisches Zeitfenster. Kanonisches Weather-Fragment und Aggregat sind synchron.

## Warum Extremwettervorschau und MID-Hinweis abweichen können

Die Extremwettervorschau ist ein eigenständiges räumliches, modell-/ensemblegestütztes Produkt, kein Spiegel der deterministischen Standort-DWD-Klassifikation. Aktuelle native Regen-Ausblickfenster: 1/6/24 h, erste Intensitätsgrenzen 15/20/40 mm; höhere Stufen haben andere Ausprägungs- und Wahrscheinlichkeitsschwellen. Die Standort-DWD-Hinweise prüfen zusätzlich 12/48/72 h und bereits 30 mm/24 h. Beispielsweise kann ein Standort-Modellhinweis bei 35 mm/24 h oder 45 mm/48 h existieren, ohne die native Ausblick-Schwelle zu erreichen. Andere Modellläufe, Regionalabdeckung und Wahrscheinlichkeitsfilter können ebenfalls Unterschiede erklären. Ein fehlender Ausblick-Treffer widerlegt deshalb allein keinen Standort-Modellhinweis. Es berechtigt aber auch nicht zur Behauptung einer übereinstimmenden Ensemble-/Umfeldbestätigung.

Diese produktspezifischen Grenzen werden nicht heimlich vereinheitlicht und keine regionalen Signale erfunden. Amtliche Warnungen behalten ihre eigene Quelle, geografische Zuordnung und Gültigkeit. Die App löscht bei echtem Ortswechsel Wetter, Warn-Ensemble, amtliche Warnungen und Fusionsdaten; asynchrone Rückgaben sind durch Sequenz und Abort geschützt. Im untersuchten Pfad ist keine Übernahme eines alten Orts-Ensembles als Ursache belegt.

## Grenzen

Die Regenphase umfasst den ersten bis letzten nassen Beitrag eines warnrelevanten Ereignisfensters. Kurze Pausen innerhalb eines Ereignisses sind möglich; der Hinweis sagt nicht, dass die Warnschwelle in jeder markierten Stunde überschritten wird. Hydrologische Folgen und amtliche Warnungen können außerdem nach Regenende fortbestehen; diese amtlichen Gültigkeiten werden nicht verkürzt. Nichtstündliche Daten werden nicht künstlich auf eine Stunde heruntergerechnet.

## Validierung und Quellen

Vier ältere statische Signaturprüfungen sind auf den bewusst ergänzten optionalen Punktparameter angepasst; ihre übrigen Anforderungen bleiben erhalten. Der neue Verhaltenstest prüft zusätzlich trockene Profilpausen und widersprüchlich zurückbleibende Phasenkomponenten.

Neue ausführbare Regression prüft trockenen Vorlauf, erhaltene spätere Warnung, explizite Akkumulationsintervalle, Zeitlücken/Mehrstundenraster, komplett trockene Reihen, unveränderte Regenzeiten trotz großer Umfeldquantile sowie echte Modellsumme und korrekte Quellenbeschriftung. Build/Typecheck, Worker-Syntax und Capacitor Copy/iOS-Shell grün; vollständige Regressionen und Source-/Installer-/Worker-/Pages-/Stable-Gates bleiben verbindlich.

- DWD Warnkriterien: https://www.dwd.de/warnkriterien
- DWD Faktenpapier Niederschlag, Stand 2025: https://www.dwd.de/DE/leistungen/faktenpapier_extremwetter/niederschlagstrend-entwicklung_2025.pdf?__blob=publicationFile&v=1
- DWD RADKLIM-Bulletin 2024: https://www.dwd.de/DE/fachnutzer/wasserwirtschaft/radarniederschlag/radklim-bulletin/radklimbulletin2024download.pdf?__blob=publicationFile&v=3

## Ergänzung: kompakter Profilkopf und RUC-Laufanzeige
Der redundante Drucktrend-Kopf entfällt; Luftdruckspur und Einzeldaten bleiben. Nur belastbare Sicht-/Gefahrenhinweise erscheinen, in einer vollbreiten automatisch umbrechenden Zeile; ohne Hinweise kein Leerraum. CSS-Kaskadenfixture aktualisiert ausschließlich für die autorisierte Kopfgestaltung, übrige extrahierte Implementierungen unverändert.
RUC meldet jeden tatsächlich versuchten Kandidaten und den vollständig dekodierten Lauf mit Datum und HHMMZ im Log und GitHub Step Summary. Kandidatenfehler bleiben sichtbar; Aufbereitung wird ausdrücklich nicht als Veröffentlichung bezeichnet. Der Freshness-Guard zeigt separat den auf Pages bereits veröffentlichten Lauf. Keine Scheduler-, Download-, Publish-, Berechtigungs- oder Gateänderung.

## Release-Koordination
Parallel-PR268 veröffentlicht zuerst die Widget-Automation als .178. Diese Änderungen werden anschließend von dessen verifiziertem Stable als .179 integriert; niemals konkurrierender Installer oder manuelle Promotion. Lokaler .178-Abschluss: 918 bestehende Tests grün; ein Kopftext-Vertrag durch weiterhin vorhandenen Drucktrend-Titel an der Druckkurve erfüllt und fokussiert grün. Nach Versionsumstellung wird die gesamte Suite im abschließenden .179-Integrationsstand erneut geprüft. RUC-Fetch-Resilienz: 8/8 offline; Laufmeldung mit UTC-Konvertierung und unbekannten Metadaten geprüft. Live-Übernahme erst nach regulärem Publish belegbar.

Validierter .179-Kandidat: Produktionsbuild/Typecheck und 919/919 vollständige Regressionen grün (2026-10-06, 09:56 UTC), RUC-Fetch-Resilienz 8/8. Noch keine Live-Veröffentlichung dieses Kandidaten.
