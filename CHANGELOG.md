## v0.9.78.12

- CI-Hotfix für GitHub Release-Run #850: TypeScript-7-Prüfung und Vite-Produktionsbuild waren vollständig grün; ausschließlich drei Regressionstests erwarteten nach der v0.9.78.10-Niederschlagsintervallkorrektur bzw. dem v0.9.78.11-TS6133-Hotfix noch supersedierte Quelltextanker.
- Kurzfrist-Regression auf den trailing-interval-Vertrag migriert: das erste laufende 15-Minuten-Fenster zeigt nur den tatsächlich noch zukünftigen Anteil ab jetzt (z. B. 7 min), danach folgen volle 15-Minuten-Intervalle.
- Sonne/Niederschlag-Kohärenztest auf die aktuelle fachliche Erläuterung migriert; PoP bleibt Eintrittswahrscheinlichkeit und wird nicht als Regendauer interpretiert.
- 24-h-Zellgeometrietest schützt nun die aktive intervalgebundene `profileBandGeometry` direkt und verbietet ausdrücklich die Rückkehr des in v0.9.78.11 entfernten toten `probabilityCellGeometry`-Helpers.
- Keine fachliche App-, Forecast-, Niederschlags- oder Workerlogik geändert; ausschließlich Regressionen an den bereits aktiven Fachvertrag angepasst.

## v0.9.78.11

- CI-Hotfix für GitHub Release-Run #849: unbenutzten Resthelfer `probabilityCellGeometry` aus `ForecastCockpit.tsx` entfernt.
- Der Fehler war rein typseitig (`TS6133`) und blockierte `verify:types`; die Niederschlags-Intervall-/Nowcast-Fachlogik aus v0.9.78.10 bleibt unverändert erhalten.
- Neuer Regression-Lock verhindert die erneute Einführung des unbenutzten Helpers.
- Keine fachliche Workeränderung; Worker nur versionssynchronisiert.

## v0.9.78.10

- Niederschlags-Intervallsemantik appweit korrigiert: Open-Meteo-/MOSMIX-Akkumulationen werden als rückblickende Intervalle mit Zeitstempel = Intervallende behandelt; Radarfenster sind nicht mehr um den Modellzeitpunkt zentriert.
- 24-h-Wetterprofil „ab jetzt“ zeigt keine bereits vollständig vergangene Stundenmenge mehr. Das erste laufende Intervall wird nur mit seinem Zukunftsanteil bilanziert; finalisierte 15-Minuten-/Radarwerte speisen die ersten Stundenblöcke.
- Niederschlagsbalken und PoP liegen auf ihren realen Intervallgrenzen, während Temperatur, Wind und Druck punktbezogen bleiben.
- Radar-NWP-Blend gehärtet: trockene Standort-Radarstrecken dämpfen auch Modellmengen >1 mm; Echo nur im Umfeld darf die PoP stützen, aber keine ungestützte Standortmenge unverändert durchreichen.
- Kurzfrist-Fallback und hyperlokale Niederschlagsassimilation verwenden das Akkumulationsintervall, das den Ziel-/Beobachtungszeitpunkt enthält.
- Resttages-Niederschlag zählt nur zukünftige Intervallanteile; Tmin/Tmax bleiben unverändert.
- Neuer verbindlicher Vertrag `MID_PRECIPITATION_INTERVAL_CONTRACT.md` und Regression `test-precipitation-trailing-interval-nowcast-097810.mjs`.
- Keine fachliche Workeränderung.

## v0.9.78.9

- Weather Icon System 2.0 visuell appweit verriegelt: H/M/L-Wolkendiagnostik darf die Hauptglyphe nicht mehr in wellige Cirrus-/Altostratusformen umformen; Bedeckt, Niederschlag, Schauer, Gewitter und Nebel folgen nun unabhängig davon der freigegebenen Symbolfamilie.
- Appweite Wetterzustands-Pfade für Aktuell, Kurzfrist, 7/14 Tage, Ensemble, Event, Reise, Route, Wasser und Widget bleiben auf `WeatherPictogram`; Radar-/Komposit-Schalter und Forecast-Parametericons wurden von Wetter-Emoji-Darstellungen auf Vektor-/Lucide-Symbole bereinigt.
- 14-Tage-Desktopdarstellung ab 1025 CSS-px mit 224-px-Karten, horizontalem Scrollband, lesbarer Typografie und klar getrennten Wetter-/Temperatur-/Niederschlags-/Sonnenschein-/Windbereichen. Das 7×2-Mikrolayout bleibt auf Mobil-/Tablet-Querformat bis 1024 px beschränkt.
- Keine fachliche Workeränderung.

## v0.9.78.8

- GitHub-Regression `test-location-thunder-water-tide-layout-09644.mjs` auf den aktuellen Nachfolgevertrag migriert: die separate Kachel „Gewitterrisiko“ bleibt entfernt; relevante Gewitterinformationen werden kompakt in der Niederschlagskachel geführt, während Aktuell und Wassersport weiterhin dieselbe kanonische 6-h-Ortsanalyse verwenden.
- 14-Tage-Desktopdarstellung repariert: der extrem verdichtete 7×2-Querformatmodus greift nur noch bis 1024 CSS-Pixel. Desktopbreiten erhalten wieder mindestens 190 px breite, horizontal scrollbar angeordnete Tageskarten.
- 14-Tage-Kartenkopf und Parameterzeilen kollisionsfrei neu gegliedert; keine Mikroschrift bzw. übereinanderliegenden Tmin/Tmax-, Wind- oder Konsistenzwerte mehr auf Desktop.
- Keine fachliche Workeränderung.

## v0.9.78.5

- GitHub-Installer-Run #843 gezielt korrigiert: Produktionsbuild, TypeScript 7, Vite und 645 von 646 Regressionen waren bereits grün; ausschließlich `test-tmin-tmax-number-tone-097717.mjs` erwartete noch die vor v0.9.78.4 gültige stärkere Tmin/Tmax-Hintergrund-/Rahmenintensität.
- Regression auf den verbindlichen v0.9.78.4-Vertrag migriert: 7-Tage-ECMWF-Tmin/Tmax behalten den bewusst schwachen 10-%-Hintergrund ohne Min/Max-Zusatzlabel; 14-Tage-Tmin/Tmax reagieren weiterhin nichtlinear auf Klimaabweichungen, jedoch mit der gedämpften 5–16-%-Hintergrund- und 20–46-%-Rahmenskala.
- `MID_PARAMETER_COLOR_CONTRACT.md` präzisiert: im 14-Tage-/Ensemblebereich bleibt die signierte Klimareaktion erhalten, während der 7-Tage-Modus ausschließlich absolute ECMWF-Farben ohne Klimadelta verwendet.
- Keine fachliche App-, Forecast-, RUC- oder Workerlogikänderung; Worker nur versionssynchronisiert.

## v0.9.78.4

- 7-Tage-Kurvenübersicht geometrisch auf die gleiche Tagesbreite wie der Piktogramm-/Tageskopf fixiert: die oberen Tagessegmente verwenden jetzt exakt dieselben linken/rechten Plotränder wie die 00–24-h-Tagesabschnitte im Diagramm. Dadurch liegen Tageskopf und Kurventeil pro Kalendertag deckungsgleich übereinander.
- 7-Tage-Tageskarten im Forecast-Cockpit zeigen Tmin/Tmax jetzt kompakter ohne die zusätzlichen "Min"/"Max"-Beschriftungen.
- Klassische 7-Tage-Listenansicht ebenfalls auf die kompakte Tmin/Tmax-Darstellung ohne "Min"/"Max" umgestellt.
- Hintergrundflächen der Tmin/Tmax-Badges in 7 und 14 Tagen bewusst abgeschwächt, damit Zahlen bei warmen und kalten Extremen besser lesbar bleiben; Farbcharakter und Warnwirkung bleiben erhalten.
- Keine fachliche Workeränderung; Worker nur versionssynchronisiert.

## v0.9.78.3

- GitHub-Installer-Run #841 gezielt korrigiert: TypeScript 7, Vite-Build, npm-Installation und Dependency-Audit waren bereits grün; ausschließlich zwei veraltete Regressionen blockierten den Release.
- `test-cockpit-hourly-climate-redundancy-09140.mjs` auf den verbindlichen v0.9.78.1-Nachfolgevertrag migriert: 7 Tage nutzen absolute ECMWF-Temperaturfarben ohne Klima-Delta, stündliche Temperaturen bleiben neutral, 14 Tage behalten signierte Tmin/Tmax-Klimadeltas.
- `test-ruc-pages-free-storage-09700.mjs` verlangt während des ZIP-Installers keine unzulässige Bytegleichheit mehr zwischen aktiver `.github/workflows/install-mid.yml` und der neu installierten kanonischen Kopie. Stattdessen wird der sichere Mindestvertrag der aktiven Pipeline geprüft; der bewusste `.github`-Self-Modification-Schutz bleibt damit erhalten.
- Keine fachliche App-, Forecast-, Wetterpiktogramm-, RUC- oder Workerlogikänderung.

## v0.9.78.2

- Installer-Hotfix für GitHub Release-Run #840: die im Release mitgeführte Spiegeldatei `workflow-patches/install-mid.yml` ist wieder bytegleich zur kanonischen Pipeline unter `ci/github/workflows/install-mid.yml`.
- Damit sind Race-Schutz auf `main`, Ausschluss der automatischen `.github`-Selbstmodifikation, serieller `mid-pages`-Lock ohne Cancellation sowie der gestufte Worker-/Pages-/Stable-Promote-Vertrag wieder konsistent regressionsgeschützt.
- Keine fachliche App-, Forecast- oder Workerlogikänderung; der Fix betrifft ausschließlich die mit dem Release transportierte Installer-Spiegeldatei und die Versionsfortschreibung auf v0.9.78.2.

## v0.9.78.1

- Weather Icon System 2.0 als echter appweiter Screenshot-3-Lock: Wetterglyphen standardmäßig standalone ohne eingebettete Sky-Plate; zusätzliche CSS-Sperre verhindert die Rückkehr alter quadratischer Piktogrammplatten.
- Tagespiktogramme in klassischer 7-Tage-Ansicht und Forecast Cockpit verwenden die kanonisch korrigierte Niederschlagsphase; Regenschauer, Regen, Schnee usw. können nicht mehr durch einen rohen cloud-only Stunden-Code dasselbe Symbol wie trockene Bedingungen erhalten.
- 7-Tage-Kurvenübersicht auf reale Stundenwerte umgestellt: gemeinsame 00/12-Zeitachse für Temperatur und Niederschlag, stündliche Niederschlagsbalken, horizontale Temperaturhilfslinien und geglättete Stundenkurve.
- 7-Tage-Temperaturen nutzen eine zentral interpolierte ECMWF-inspirierte Absoluttemperaturskala in Kurve, Tmin/Tmax und Rangebar; Klimaabweichungen/±K sind im 7-Tage-Modus entfernt. 14-Tage-Klimaanomalien bleiben bestehen.
- Piktogramm-, Farb- und Source-of-Truth-Verträge sowie Regressionen auf v0.9.78.1 erweitert. Keine fachliche Workeränderung.

## v0.9.78.0

- Verbindlicher appweiter Wetterpiktogramm-Standard 2.0: ein zentraler skalierbarer SVG-Renderer für Forecast-, Tages-, Stunden-, Event-, Reise-, Wasser-, Berg-, Routen-, Ensemble- und kompakte Widgetdarstellungen.
- Tag/Nacht und Hell/Dunkel zentralisiert; keine getrennten Rasterassets.
- Niederschlagsarten und -stärken nach WMO-/synoptischer Present-Weather-Logik erweitert: u. a. Sprühregen, gefrierender Sprühregen/Regen, Regen/Schauer, Schnee, Schneegriesel, Schneeschauer, Schneeregen, Eiskristalle, Eiskörner, Graupel, Hagel sowie Gewitter-/Hagelvarianten.
- Leicht/mäßig/stark wird über Dichte, Anzahl, Größe und Strichgewicht unterscheidbar, nicht nur über Farbe.
- SYNOP-/BUFR-/METAR-Brücke für dekodierte Present-Weather-Kürzel ergänzt; alter Forecast-Emoji-Hilfspfad entfernt.
- Keine fachliche Workeränderung; Worker nur versionssynchronisiert.

## v0.9.77.29

- Witterungstrend Tag 15–46 gegen hängende ERA5-Klimatologie entkoppelt: EC46/GEFS erhalten feste Quellbudgets, Klima ein separates Kurzbudget; vorhandene Modellwerte werden nicht mehr dauerhaft hinter „wird geladen …“ versteckt.
- Stale-Witterungsfallback auf 36 h erweitert.
- Langfristvertrag erweitert: numerische Ensemble-Mittel und geeignete deterministische Läufe dürfen wie EPS-Systeme beitragen; weiterhin exakt eine Stimme je unabhängiger Modelllinie. DWD Subseasonal EPISODES zählt als regionaler ECMWF-Downscaling-/Qualitätsanker, nicht als zweite EC46-Stimme.
- Neue responsive 7-Tage-Kurvenübersicht direkt oberhalb der Tageskarten: Wetterpiktogramme, Tmin/Tmax, geglätteter Temperaturverlauf, Niederschlagsbalken und direkte Tagesauswahl.
- Keine fachliche Workeränderung gegenüber v0.9.77.28; Worker nur versionssynchronisiert.

## v0.9.77.26

- Hotfix Langfristtrend: Saison-Rauchfahnen bleiben bereits bei einer numerisch verfügbaren Modellfamilie sichtbar; der reine Single-Model-Hinweiskasten ersetzt die Grafik nicht mehr.
- Bei einer Quelle zeigt MID deren echte Temperatur-/Niederschlags-Ensemble-Streuung; ab zwei Quellen wird automatisch wieder das gleichgewichtete Poor-Man’s-Ensemble plus gemeinsamer Einzelmodellvergleich verwendet.
- Fehlerursache war ausschließlich die Frontend-Gate-Logik aus v0.9.77.25; saisonale Workerquellen und Multi-Modell-Vertrag bleiben unverändert.
- Keine fachliche Workeränderung; Worker nur versionssynchronisiert.

## v0.9.77.25

- Witterungstrend Tag 15–46 bestätigt und regressionsgeschützt: Temperatur ist Standard, die letzte gültige Parameterauswahl wird dauerhaft gespeichert.
- Season auf ein transparentes Poor-Man’s-Ensemble umgestellt: alle tatsächlich numerisch verfügbaren unabhängigen Modellfamilien erhalten je eine Stimme; alle Einzelmodelle werden zusätzlich gemeinsam in einer skalierenden Grafik gezeigt.
- Nicht-numerische Katalog-/Status-/Zusatzmodellkästen und der redundante Einzelmodell-Kartenstreifen aus der Season-Hauptansicht entfernt.
- Tmin/Tmax in 7-/14-Tage wieder als kleine blaue/rote Kästchen; nichtlineare Klimamittelreaktion macht bereits kleine Abweichungen deutlich sichtbar.
- Keine fachliche Workeränderung; Worker nur versionssynchronisiert.

## v0.9.77.24

- KNMI-HARMONIE-EPS Abschnitt 4/4 kostenneutral bis zum reproduzierbaren ecCodes-Wasm32/MEMFS/Nearest-Point-Quellprototyp fortgeführt.
- Direkte In-Memory-GRIB1-ABI über `codes_handle_new_from_message_copy` und native `codes_grib_nearest_find`; kein Vollgittertransfer nach JavaScript.
- Forschungsbuild pinnt ecCodes 2.48.1, verzichtet auf wasm64/NODEFS, begrenzt Wasm auf 24 MiB initial / 96 MiB maximal und reserviert 2,5 MB gzip als fail-closed Bundlebudget.
- Keine npm-Wasm-Dependency, keine Queue, kein neues Cloudflare-Binding, kein Paid-Plan und keine fachliche Workeränderung. Reale P4a-Build-/CPU-/RAM-/Numerikverifikation bleibt offen.

## v0.9.77.23

- 24-h-Wertepillen am aktiven Auswahlcursor leicht transparent (`fill-opacity: .8`), damit darunterliegende Diagramminhalte sichtbar bleiben.
- Gesamtbewölkungs-Grauzellenzeile im 24-h-Profil durch exakt dieselbe Sonne-/Gesamtbewölkungs-Leiste wie in der Tagesansicht ersetzt.
- `detailSkyBarSegments` in `src/detailSkyBar.ts` zentralisiert; Tagesansicht und 24-h-Profil teilen Farben, vier Stärken sowie Tag-/Nacht-Semantik.
- H/M/L-Wolkenintensitätsbänder und gemeinsame `profileXForEpoch`-Zeitachse bleiben erhalten.
- Keine Worker-/Forecast-/KNMI-Fachlogikänderung.
- Abschnitt 4/4 bleibt fail-closed, erhält aber einen geprüften kostenfreien Forschungspfad: fokussierter ecCodes-Wasm32/MEMFS/Nearest-Point-Prototyp und optional asynchroner Cloudflare-Queues-Free-Consumer; in diesem Release werden weder Wasm-Dependency noch Queue/Ressource aktiviert.

## v0.9.77.22

- Dritter der vier verbleibenden KNMI-HARMONIE-EPS-Hauptabschnitte: externer GRIB1-Punktdecoder unter `tools/knmi_eps_decoder/`, strikt an das Worker-Rolling-Manifest und HTTP-206-Ranges gebunden.
- P4a-Rolling-Regen wird batchweise am ersten gemeinsamen Zeitpunkt baselined und in stündliche Mengen differenziert; Signed-URLs bleiben aus Logs und persistenten Caches heraus.
- KNMI-P4a-Europe-Metadaten auf 5,5 km und stündliche Aktualisierung korrigiert; höher aufgelöste 2–2,5-km-HARMONIE-Domänen bleiben davon getrennt.
- Kein Hosting/Cloudflare-Dienst/Workflow aktiviert; reale End-to-End-Aktivierung bleibt Abschnitt 4/4 und unterliegt der Kostenfreigabe.

## v0.9.77.21

- Installer #830 korrigiert: `test-api-contract-health-resilience-09778.mjs` erwartet nicht länger den alten generischen Namen „Hourly Min/Max Aggregation“, sondern den seit v0.9.77.20 tatsächlich geprüften Kernvertrag `ECMWF IFS native 3h Min/Max`.
- Die Regression schützt zusätzlich `models=ecmwf_ifs`, `forecast_hours=24` sowie `temperature_2m_min` und `temperature_2m_max`; damit wird der Healthcheck nicht durch bloßes Umbenennen grün.
- Keine fachliche Forecast-/Workeränderung gegenüber v0.9.77.20; Temperaturglättung und KNMI-HARMONIE-EPS-Produktivpfad bleiben unverändert.

## v0.9.77.20

- Installer #829 korrigiert: zwei veraltete String-/Einpunkt-Regressionen auf den bereits gültigen zentralen Current-/Radar-Endstufenvertrag migriert; Produktionslogik der v0.9.77.19-Temperaturglättung bleibt erhalten.
- Nächtliche Revision / Issue #28: `browserslist` auf den sicherheitskorrigierten 4.28.7-Pfad (plus kompatibles `baseline-browser-mapping`) angehoben; High-Audit GHSA-73wf-gq98-2v4g und GHSA-c83g-rgw3-j3cx beseitigt.
- Open-Meteo-Min/Max-Healthcheck an den dokumentierten ECMWF-IFS-3-h-Vertrag gebunden statt die nicht allgemein garantierten Best-Match-`hourly_6`-Min/Max zu erzwingen.
- KNMI-HARMONIE-EPS-/produktiver-Cache-/Workerstand aus v0.9.77.18/19 bleibt vollständig erhalten.

## v0.9.77.19

- Zweiter der vier verbleibenden Hauptabschnitte: KNMI HARMONIE EPS nutzt den produktiven TAR-Indexcache jetzt im Worker für sechs stündliche 5er-Batches, 30 Rolling-Member, 0–54-h-Alignment und exakte Sparse-Range-Manifeste; GRIB-Dekodierung bleibt außerhalb Cloudflare.
- Current-Temperatur wird mit dem echten standortlokalen Beobachtungszeitpunkt als weiche 120/180-min-Brücke in `displayHours` assimiliert statt einen einzelnen Stundenpunkt zu ersetzen; die sichtbare Delle in 24-h-Profil und Tagesansicht entfällt.
- GitHub Installer #828: veraltete Modularisierungsregression um `worker-src/05-knmi-eps-cache.js` ergänzt; TypeScript/Vite waren im fehlgeschlagenen Run bereits erfolgreich.
- Keine neue Cloudflare-Ressource und kein neuer Workflow; Worker-Fachänderung erfordert den regulären gestagten Worker-Deploy.

## v0.9.77.17

- Klimatische Tmin/Tmax-Abweichung wird ausschließlich über die **Zahlfarbe** sichtbar; Hintergrund und Rahmen der Werte bleiben neutral/transparent.
- Blaue Tmin- und rote Tmax-Zahlen behalten die signierte Klimasättigung, ohne farbige Pillen/Hinterlegungen zu erzeugen.
- 7-Tage-Legende und Parameter-Farbvertrag auf „Zahlfarbe = Abweichung vom jeweiligen Klimamittel“ präzisiert.
- Neuer Regressionstest schützt die reine Zahlfarben-Codierung appweit; keine fachliche Worker-Änderung.

## v0.9.77.16

- 24-h-Wert-Pills im Hell-/Dunkeldesign kontrastfest: definierte Meteogramm-Tooltipfarben statt ungültiger SVG-Hintergrundvariablen.
- Tmin/Tmax- und aktiver Temperaturmarker im 24-h-Wetterprofil deutlich verkleinert.
- Redundanten „Modellstand“ im Header des Witterungstrends entfernt; tatsächliche Läufe bleiben in den Modell-Pills, Datenabruf/Cache bleibt separat sichtbar.
- Langfristige Temperatur-/Niederschlags- und Schneelinien-Diagramme skalieren ohne horizontales Scrollen vollständig auf die verfügbare Breite.
- Keine fachliche Worker-Änderung; manueller Worker-Upload nicht erforderlich.

## v0.9.77.15

- Extremwetter-Popups nennen jetzt die konkrete Gefahr der dargestellten Fläche (z. B. „Gewitter“) statt generisch „Modellierte Gefahrenfläche“.
- Aktuelle und stündliche Temperaturwerte einschließlich „Nächste 90 Minuten“, Tagesdetail und ausgewähltem 24-h-Zeitwert werden neutral in der Theme-Textfarbe dargestellt.
- Tmin/Tmax in 7-/14-Tage-Ansichten verwenden ausschließlich Blau/Rot; die Sättigung folgt jetzt der signierten Abweichung vom jeweiligen klimatologischen Tmin/Tmax.
- Parameter-Farbvertrag und veraltete Regressionen auf die neue, im Anhang definierte Semantik migriert.
- Keine fachliche Worker-Änderung; manueller Worker-Upload nicht erforderlich.

## v0.9.77.14

- Regionale Modellwahl auf reale/konservative Modell-BBoxen vereinheitlicht: BBox gilt vor Länderkennung; grenzüberschreitende Nutzung innerhalb des Modellgebiets ist erlaubt.
- MeteoSwiss ICON-CH1/CH2 und GeoSphere AROME Austria können damit auch im abgedeckten angrenzenden Mitteleuropa als zusätzliche Wetterzwilling-Quellen einfließen, ohne die nationale Priorisierung zu verdrängen.
- App-Modellstandfilter für ALADIN CZ, AROME France/HD, KNMI HARMONIE NL, UKV, MET Nordic sowie HRRR/NAM/NBM an die Worker-Gebiete angeglichen.
- DMI HARMONIE AROME Europe konsistent auf 2 km und 2,5 Tage gestellt; UWC-West-Unabhängigkeitsgruppe bleibt mit KNMI gemeinsam.
- Neuer Regressionstest schützt Modellgebiete, grenzüberschreitende Fusion und Doppelgewichtung.

## v0.9.77.13

- Open-Meteo Rapid-Refresh/RUC-Quellenvertrag korrigiert: echter DWD ICON-D2-RUC bleibt ausschließlich direkt über die MID-DWD-Pipeline; nicht vorhandene Open-Meteo-RUC-Modellalias-Probes entfernt.
- Open-Meteo ICON-D2-15-min wird korrekt als 3-stündlich aktualisiertes Regionalmodell behandelt; HRRR-/AROME-15-min-Rapidpfade explizit geschützt.
- Neuer Regressionstest schützt Best-Match-`minutely_15`, direkte RUC-Frische und die Quellenabgrenzung.

# Changelog

## 0.9.77.12

- Appweiter Parameter-Farbvertrag auch in Tagesdetail/24-h vollständig durchgesetzt.
- Warnstufen färben Windpfeile; Tmin/Tmax-Töne bleiben Blau/Rot und werden klimatologisch nur in ihrer Intensität gewichtet.
- 24-h-Auswahlwerte an der blauen Zeitlinie als lesbare Parameter-Pills; stündliche Temperaturpunkte reduziert.


## v0.9.77.11 - 2026-09-01

- Trend 14d+: Klimareferenz von einem unvollständigen ERA5-Land-Gesamtabruf auf ERA5-Seamless 1991–2020 umgestellt; fachlicher ERA5-Land/ERA5-Fallback schützt Temperatur sowie Niederschlag, Luftdruck, Bewölkung und Wind.
- Appweiter Parameter-Farbvertrag verbindlich eingeführt und 24-h-Wetterprofil sowie 7-Tage-Tagesansichten auf die zentralen `--param-*`-Farben vereinheitlicht.
- Lokale absolute Temperaturfarbskalen und Klimaabweichungsfarben überschreiben tatsächliche Tmin/Tmax-/Temperaturwerte in den betroffenen Ansichten nicht mehr.

## v0.9.77.10 - 2026-09-01
- Install-/Deploy-Run #817: fünf TypeScript-Blocker im Berg-/Witterungstrend-Pfad behoben.
- Witterungstrend zeigt den tatsächlichen Open-Meteo-Modellinitialisierungsstand für EC46/GEFS; Datenabruf wird separat ausgewiesen.
- Kurzfristdiagramm zeigt an der blauen ausgewählten Zeitlinie Werte für Wolken, Temperatur/gefühlt/Taupunkt, Niederschlag, Wind/Böen und Luftdruck in Parameterfarben.

## v0.9.77.8 - 2026-09-01
- CI-Hotfix nach Installer #815: TypeScript und Vite waren bereits grün; 617/618 Regressionen bestanden. `test-extreme-rain-profile-night-097628.mjs` wurde vom veralteten Quelltext-Stringvertrag auf den aktuellen semantischen v0.9.77.8-Vertrag umgestellt: I-Schwelle + tatsächliches Modellsignal sowie identifier-unabhängiger RUC-Regenfallback. Produktionslogik unverändert.
- CI-Hotfix nach Installer #814: ungenutzter `height`-Parameter im Trend-14d+-Chart entfernt; TypeScript-`noUnusedParameters`-Gate wieder erfüllbar.
- Produktivprüfung nach Issue #27 gehärtet: kritische Kern-APIs bleiben fail-closed, regionale Météo-France-/JMA-Einzelmodellstörungen werden als Provider-Degradation statt als kompletter MID-Ausfall bewertet.
- JMA-Druckniveauprüfung auf den expliziten MSM-Profilpfad getrennt; GSM/Seamless werden nicht mehr pauschal an denselben Profilvertrag gekoppelt.
- Extremwetter I/P-Audit: Schwellenreferenz und tatsächliches Modellsignal werden getrennt dargestellt; P1–P4 bezeichnet ausdrücklich die Wahrscheinlichkeit der jeweiligen I-Stufe.
- Regen-/Schnee-Rollfenster sind periodengrenzenfest; Werte aus dem vorherigen Zeitraum können die nächste Periode nicht mehr hochstufen.
- ICON-D2-RUC-Extremwetterpfad auf Schema v3 erweitert: native 5/15-min-Diagnostik +0–6 h, stündlicher Zustandskern +6–12 h und +12–14 h; keine RUC-Unterstellung ab +14 h.
- Subthreshold-RUC-Werte erzeugen keine höhere I-Stufe mehr. Regen/Wind werden an realen I-Schwellen gegatet; Gewitter bleibt ingredient-basiert.
- C3S/Extremflächen-UI aktualisiert Schwellenreferenzen zusammen mit der dargestellten Konturintensität.
- PR #24/#25/#26 fachlich als erledigt identifiziert; GitHub-Connector verweigert das Schließen mit HTTP 403. #6/#18/#20/#21 bleiben bewusst zurückgestellt.
- Worker-Fachlogik und RUC-Payload geändert: Worker-Upload erforderlich.

## v0.9.77.7 - 2026-09-01
- Witterungstrend kombiniert Tmax/Tmin und bereinigt Klimamittel-/Farbkonzept sowie numerisch aktive Langfristmodellquellen.
- Keine fachliche Worker-Änderung.

## v0.9.77.6 - 2026-09-01
- GitHub-Installer Run #812 gefixt: exakt definierter RUC setup-python-v5→v7-Admin-Sync-Übergang wird als pending-admin-sync akzeptiert.
- Jede zusätzliche RUC-Workflow-Abweichung bleibt fail-closed.
- Neuer Regressionstest schützt den Pin-only-Übergang und lehnt kombinierte Drift ab.

# v0.9.77.5

- CI-Hotfix für GitHub Actions Run #811: ZIP-Entpacken, `npm ci` und Dependency-Audit waren grün; ausschließlich der TypeScript-Build des neuen Trend-14d+-Panels schlug fehl.
- `SubseasonalTrendPanel` verwendet wieder den kanonischen MID-`WindUnit` (`kn` intern, Anzeige weiterhin `kt`), wodurch die Übergabe aus `LongRangePanel` wieder typsicher ist.
- Nicht vorhandenes Lucide-Icon `Rain` durch `CloudRain` ersetzt; Tmin nutzt `Snowflake`, Windböen den bereits verwendeten Wind-Iconpfad.
- Lucide-Icon-Typisierung und die Nullability der Klimadifferenz wurden TypeScript-sicher korrigiert.
- Tmin/Tmax, Windböen, EC46-Klimamittel-Zeitachsenfix und Punkt-Tooltips aus v0.9.77.4 bleiben vollständig erhalten.
- Keine fachliche Worker-Änderung; manueller Worker-Upload nicht erforderlich.

# Changelog

## v0.9.77.4 - 2026-09-01
- Witterungstrend Tag 15-46 fachlich nachgeschärft: EC46-Klimamittel werden jetzt über die Wochen-Zeitachse statt über starre Indexe zugeordnet, damit Teilwochen und Endbereiche konsistent bleiben.
- Temperatur-Slot in der Subseasonal-Ansicht in Tmax und Tmin aufgeteilt; Wind um Windböen erweitert, jeweils mit dem appweiten Farbkonzept.
- Hauptdiagramm des Witterungstrends um Klick-/Tipp-Tooltips pro Kurvenpunkt ergänzt, analog zum 24d-Ensemble.
- Wind- und Böenwerte im Witterungstrend auf kn-basierte API-Abfrage vereinheitlicht, damit die Einheiten appweit konsistent bleiben.
- Release-Upload-Budget erneut geprüft; Professional- und Worker-ZIP bleiben innerhalb des vorgesehenen Größenrahmens.

# v0.9.77.3

- RUC-Infrastrukturwartung separat durchgeführt: Dependabot-PR #26 MID-konform übernommen; `actions/setup-python` ist im kanonischen RUC-Workflow und im administrativen Sync auf 7.0.0 / SHA `5fda3b95a4ea91299a34e894583c3862153e4b97` angehoben.
- Python 3.12, pip-Cache, RUC-Scheduler :11/:41, Guard, Pages-Storage und meteorologische RUC-Fachlogik bleiben unverändert.
- Neuer fokussierter PR-Wartungstest schützt #25/#24/#26 gemeinsam und hält React 19, React DOM 19, react-is 19 sowie plugin-react 6 ausdrücklich zurückgestellt.
- Keine fachliche Worker-Änderung; Worker-Upload nicht erforderlich.

# v0.9.77.2

- GitHub-Actions-Wartung: Dependabot-PR #25 MID-konform übernommen; `actions/upload-artifact` ist kanonisch auf 7.0.1 / SHA `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` angehoben.
- CodeQL-PR #24 korrigiert übernommen: `init` und `analyze` werden gemeinsam auf 4.37.9 / SHA `cdf488f595d80d6e07e03d4674febd5ab45fa938` gepinnt; der im Original-PR entstandene Versionsmix ist ausgeschlossen.
- Expliziter Workflow-Sync und Regressionen schützen nun auch `upload-artifact`; `.github` bleibt im normalen Release-Installer unverändert.
- React-19- und plugin-react-6-Majors bleiben bewusst zurückgestellt.
- Keine fachliche Worker-Änderung; Worker-Upload nicht erforderlich.

# v0.9.76.35

- P0 Gewittersemantik: Blitznachweis klassifiziert weiterhin den **aktuellen Radar-/KONRAD3D-Zustand**, ist aber keine Voraussetzung mehr für eine numerische Gewitterprognose.
- ICON-D2-RUC: Der alte numerische Blitz-Gate wurde entfernt; RUC-/RUC-EPS-Kalibrierung darf bestehende WMO-Gewittercodes nicht mehr zu Schauercodes herabstufen.
- ICON-D2-RUC Rapid: neue ingredient-basierte Mehrparameterdiagnostik aus CAPE/MU-CAPE, CIN/MU-CIN, 5-/15-min-Niederschlag, modellierter Reflektivität, LPI, UH, EchoTop und Aufwind. Kein einzelnes Rapid-Feld allein erzeugt einen synthetischen Gewittercode.
- 15-min-Prognose: hinreichend stark und mehrfach gestützte Rapid-Konvektion darf prognostisch WMO 95 erzeugen; 96/97/99 werden nicht heuristisch erfunden.
- Gewitterinformation: numerische Gewitterprognosen bleiben auch ohne Rapid-Daten möglich. Eine blitzlose aktuelle K3D-Zelle bleibt zugleich korrekt als starke Schauerzelle bezeichnet; numerische Gewitterentwicklung wird davon getrennt dargestellt.
- Worker-Fachlogik geändert; aktualisierter Worker ist erforderlich.

# v0.9.76.34

- CI-Hotfix für GitHub-Run #805: Sechs veraltete Regressionserwartungen wurden an den bereits freigegebenen 24-h-Profilvertrag aus v0.9.76.33 angepasst.
- Die Tests erwarten jetzt die neue Wetterpiktogramm-Höhe `y=78`, die nach oben verlegten Wolkenbänder (`cloudTop=101`), den darunter liegenden Temperaturbereich (`tempTop=150`), die verschobene Luftdruckspur (`498–550`) sowie die dünnere Temperaturkurve (`2.75`).
- Produktcode und fachliche Wetterlogik bleiben unverändert; kein Rollback der neuen Wolkenanordnung oder des 23→00-Uhr-Fixes.
- Keine fachliche Worker-Änderung.

# v0.9.76.33

- Tagesdetail-Stundennavigation: Der Schritt von 23:00 Uhr springt beim Weiterklicken nun korrekt auf 00:00 Uhr des Folgetags statt auf den 12-Uhr-Fallback. Die gewünschte Zieluhrzeit bleibt dabei so lange vorgemerkt, bis der neue Tag tatsächlich den passenden Zeitslot ausgewählt hat.
- 24-h-Wetterprofil: Die Wolkenbänder (Gesamt/H/M/L) sitzen jetzt direkt unter den Wetter-Piktogrammen und damit vor dem Temperaturbereich.
- 24-h-Wetterprofil: Temperatur- und gefühlte Temperaturkurve wurden bewusst etwas dünner ausgeführt, um den oberen Profilbereich ruhiger und präziser wirken zu lassen.
- Keine fachliche Worker-Änderung; nur Versionssynchronisierung des gekoppelten Notfall-/Audit-Artefakts. Ein neuer manueller Worker-Upload ist nicht erforderlich.

# v0.9.76.32

- Release-Gate-Sicherung für die v0.9.76.31-Korrekturen ergänzt.
- Reiseplaner-Vertrag schützt nun explizit den aktuell ausgewählten MID-Ort als Standardziel und verhindert die Wiederkehr eines alten persistenten Reiseziels als Startwert.
- Komposit-Vertrag schützt den robusten Boundary-Fallback sowie numerische/stringbasierte `admin_level`-/`maritime`-Werte, damit oberhalb des Wetterbilds nicht nur Städte, sondern auch Grenzen sichtbar bleiben.
- Keine fachliche Worker-Änderung; kein neuer manueller Worker-Upload erforderlich.

# v0.9.76.31

- Reiseplaner: Das ausgewählte Ziel startet standardmäßig wieder mit dem aktuell gewählten MID-Ort. Ein zuvor lokal gespeichertes Reiseziel überschreibt den Startzustand nicht mehr ungewollt.
- Reiseplaner: Solange kein alternatives Reiseziel gewählt wurde, bleibt die Zielkarte automatisch mit dem aktuellen MID-Ort synchron.
- Kompositbild: Der obere Referenzlayer zeichnet Grenzen robuster. Zusätzlich zum hervorgehobenen Länder-/Regionsrahmen wird ein allgemeiner Boundary-Fallback eingeblendet, und `admin_level`/`maritime` werden sowohl numerisch als auch als String akzeptiert.
- Keine fachliche Worker-Änderung; ein neuer Worker-Upload ist für diese Korrektur nicht erforderlich.

# v0.9.76.30

- CI-Hotfix: Zwei veraltete 24-h-Wetterprofil-Regressionen wurden an den seit v0.9.76.28 gültigen Nacht-Fade-Vertrag angepasst.
- Geschützt bleiben eine einzige 24/00-Uhr-Tagesgrenze sowie der dezente Nacht-Hintergrund mit weichem Fade an Sonnenuntergang und Sonnenaufgang; die frühere Schraffur wird nicht wieder eingeführt.
- Keine fachliche oder sichtbare Rücknahme der v0.9.76.28/29-Änderungen.

# v0.9.76.29

- Release-Gate-Hotfix nach GitHub-Actions-Run #801: TypeScript, Vite-Build und 604 von 605 Regressionen waren grün; ausschließlich `test-thunder-affected-places-route-09151.mjs` erwartete noch den vor v0.9.76.26 verwendeten Text `+{hidden} weitere im (i)`.
- Der historische Gewitter-Orts-/Zugbahntest schützt nun den aktuellen Vertrag: sichtbarer Restzähler, Rest-Pille und `Weitere Orte anzeigen (...)`-Disclosure bei unverändert vollständiger Now/likely/possible/corridor-Fachlogik.
- Kein Rollback der verdichteten mobilen Gewitterdarstellung. Die Extremregen-, Geländehöhen- und 24-h-Nachtprofil-Korrekturen aus v0.9.76.28 bleiben vollständig enthalten.
- Fachlicher Worker-Diff aus v0.9.76.28 bleibt enthalten; aktualisierter Worker ist weiterhin erforderlich.

# v0.9.76.28

- Extremwetter-Ausblick: Bei Regenlagen im 0–6-h-Fenster übernehmen Regionsliste und Detailkarte nun bevorzugt die verfügbare ICON-D2-RUC-Akkumulation, sodass irreführende `0 mm`-Anzeigen trotz vorhandener Rapid-Signale entfallen.
- Extremwetter-Details: Geländehöhen werden lesbarer auf 10 m bzw. 100 m gerundet.
- 24-h-Wetterprofil: Es wird nur noch eine einzige senkrechte Tagesgrenze für 24/00 Uhr gezeichnet; zusätzliche hervorgehobene Vollhöhenlinien entfallen.
- 24-h-Wetterprofil: Nachtstunden erhalten einen dezenten Hintergrund mit weichem Fade an Sonnenuntergang und Sonnenaufgang statt der bisherigen harten Schraffur.
- Fachliche Worker-Änderung enthalten; ein aktualisierter Worker-Upload ist erforderlich.

# v0.9.76.25

- CI-Hotfix nach Release-Run #799: TypeScript 7.0.2, Vite 6.4.3, Dependency-Audit und 602 von 603 Regressionen waren grün; ausschließlich der historische RUC-Watchdog-Test erwartete noch zwei getrennte `:18/:48`-Cron-Einträge.
- Der bestehende Watchdog-Test schützt nun die fachlich bereits aktive Scheduler-Resilienz: eine sechsfach gestaffelte `:08/:18/:28/:38/:48/:58`-Cron-Expression, Active-Run-Sperre, 18-Minuten-Cooldown, `force=false`, `trigger_source=github-watchdog` und Push-Self-Test.
- Primärer RUC-Vertrag `:11/:41` unverändert; GitHub-Watchdog bleibt ausdrücklich same-provider. Der optionale Cloudflare-Cron-Watchdog bleibt nur quellseitig vorbereitet.
- Kein Produktcode-Rollback und keine fachliche Worker-Änderung; manueller Worker-Upload bleibt unnötig.

# v0.9.76.22

- CI-Vertragshotfix nach Release-Run #795: TypeScript 7.0.2, Vite 6.4.3 und Dependency-Audit waren bereits grün; vier veraltete Regressionserwartungen wurden an die bewusst freigegebenen v0.9.76.21-Verträge angepasst.
- Wolkenprofil-Tests schützen nun die kollisionsfreie `cloudCellGeometry` statt frühere randberührende/überlappende Rechteckmaße zu verlangen.
- Szenariocluster-Test schützt die Resume-Recovery, bei der eine transiente leere Teilantwort den letzten erfolgreichen Ensemble-Stand nicht mehr löscht.
- Pages-/Installer-Test schützt jetzt den neuen `MID / release-candidate-quality`-Status, die Vorfahrprüfung und die ausschließlich Fast-Forward erfolgende Stable-Promotion ohne Force-Push.
- Kein Produktcode-Rollback und keine fachliche Worker-Änderung. Die UI-/Budget-/Stable-Härtung aus v0.9.76.21 bleibt vollständig erhalten.

# v0.9.76.21

- Parallelkonsolidierung ohne Rollback: die separat auf v0.9.76.20 erstellten UI-Änderungen werden unter der eindeutigen nächsten Releaseversion übernommen. Das 24-h-Wetterprofil nutzt echte Zellzwischenräume, einheitliche Achsenwert-Abstände und eine dünnere Temperaturkurve; der DWD-Ortsausschnitt zeigt nur noch die kompakte Stecknadel, und Tages-/Stunden-Windpfeile übernehmen die appweiten DWD-Böenwarnfarben.
- Auto-Revision/Build-Budget: komprimierbarer Webcode und bereits komprimierte statische Medien werden getrennt budgetiert. 5,2 MB Code/Text-gzip, 7,0 MB statische Medien und 8,5 MB Gesamt-gzip bilden getrennte Sicherheitsnetze.
- Stable-Härtung: der kanonische Installer setzt nach Build/Audit/Regressionen/Worker-Gate/Pages zuerst `MID / release-candidate-quality` und promotet anschließend ausschließlich per Fast-Forward ohne Force-Push nach `mid-stable`; divergierende Historien brechen fail-closed ab.
- Startperformance: der Boot-Logo-Preload erhält seinen `href` erst nach synchroner Theme-/Logoauflösung und lädt damit nicht unnötig zuerst die Light-Variante.
- Regression: der Parallel-UI-Test bleibt vollständig erhalten und wird mit den drei Budget-/Stable-Hardening-Tests gemeinsam geschützt. Keine fachliche Worker-Änderung; nur Versionssynchronisierung, daher kein manueller Worker-Upload erforderlich.

# v0.9.76.20

- CI-Hotfix nach Install-Run #793: drei veraltete Regressionserwartungen wurden auf den bereits erfolgreich mit TypeScript 7.0.2 und Vite 6.4.3 gebauten Produktvertrag migriert.
- Wolkenprofil-Regressionen schützen nun ausdrücklich die nicht überlappenden Gesamt/H/M/L-Zellen (`x = columnLeft + 0,7`, `width = columnWidth - 1,4`) statt die frühere überlappende Geometrie zu verlangen.
- Szenariocluster-Regression schützt jetzt den Resume-Recovery-Vertrag: eine transiente Teilantwort darf vorhandene Ensemble-Szenarien nicht mit einem leeren Array überschreiben.
- Kein Produktcode-Rollback, keine fachliche Worker-Änderung. Der Ensemble-Resume-Fix und die 24-h-/DWD-UI-Finalisierung aus v0.9.76.19 bleiben vollständig erhalten.

# v0.9.76.19

- 14-Tage-Ensemble: same-location Resume/Reload startet Ensemble-Daten zuverlässig neu; der bisherige Lebenszyklusfehler, bei dem der Ensemble-State geleert und der Request nicht erneut ausgelöst wurde, ist behoben.
- Letzter erfolgreicher Ensemble-Stand bleibt bei transienten Fehlern sichtbar; bei sichtbarer Online-App folgt nach 45 s automatisch ein neuer Versuch.
- 24-h-Profil-Finalisierung: Nacht-Schraffur wieder sichtbar, rote Jetzt-Linie/„JETZT“ entfernt, gewählte Uhrzeit an der blauen Auswahlachse, kein „gleitend ab …“, keine überlappenden Thermik-/Wolken-/Hazard-Zellen.
- DWD Wolken/Niederschlagsart: dünnere Stecknadel als Ortsmarker. Kein fachlicher Worker-Upload erforderlich.

# v0.9.76.18

- CI-Hotfix: zwei überholte 24-h-Wetterprofil-Regressionen an den bereits produktiv gültigen kompakten Profilvertrag angepasst (vollzählige Stundenpiktogramme, aktuelle SVG-Position und responsive 2/4/8-px-Dateninsets).
- Kein Rückbau des neuen 24-h-Layouts und keine fachliche Worker-Änderung.

# v0.9.76.17

- DWD „Wolken + Niederschlagsart“: Zentrierung des standortbezogenen Originalbild-Ausschnitts nach Zoomwechsel robuster gemacht, indem der Ortsmittelpunkt nach Layout-/Scroll-Updates mehrfach nachgeführt wird. Bei höheren Zoomstufen bleibt der Zielort damit deutlich zuverlässiger im Fokus.
- DWD-Ortsmarker optisch entschärft (kleiner, transparenter) und die fest eingebettete Originallegende weiter verkleinert, damit weniger Bildinhalt verdeckt wird.
- 24-h-Wetterprofil: obere Zeitmarker näher an die Zeitachse gerückt, linke/rechte Diagrammränder weiter verdichtet und die Lane „Therm. Empfinden“ zweizeilig ausgeführt, sodass die Nutzbreite insbesondere mobil besser ausgenutzt wird.
- Achsenpolitur im 24-h-Profil: Niederschlags-, Wind- und Luftdruck-Skalen erhalten mehr Abstand zur Achse; Wetterpiktogramme werden nun vollständig, etwas kleiner und mit besserer Konturierung dargestellt.
- Nachtstunden im 24-h-Profil werden jetzt als zusammenhängende, hellere Flächen statt unruhiger Streifen hervorgehoben; gemeinsamer Browser/PWA/iOS-Fachkern bleibt erhalten. Keine fachliche Worker-Änderung und kein manueller Worker-Upload erforderlich.

# v0.9.76.16

- Lucide React 1.34.0 → 1.35.0 nach isoliertem Dependabot-Kandidatenlauf; TypeScript/Vite und CodeQL waren grün.
- Zwei historische Versionspin-Regressionen auf den qualifizierten Lucide-Stand aktualisiert; neue Regression schützt den isolierten Wartungsschritt.
- React 18.3.1, Vite 6.4.3 und plugin-react 4.7.0 bleiben unverändert; keine funktionale Wetter-, UI-, Karten-, Worker- oder iOS-Änderung.

# v0.9.76.15

- MapLibre GL JS 6.6.0 qualifiziert und übernommen; die bisherigen 6.5.0-Pin-Regressionen folgen dem neuen reproduzierbaren Vertrag.
- `uuid@7.0.3` als transitiver Dev-/iOS-Tooling-Pfad `@capacitor/cli -> xcode -> uuid` dokumentiert und gegen riskante Overrides geschützt.
- `MID_BRANCH_RULESET.json` als konkrete Stable-Schutzvorlage mit `MID CI verify`, Release-Evidenzstatus und gezieltem Workflow-Bypass gehärtet.
- Keine fachliche Wetter-, Karten-, Radar-, Worker-, React- oder Vite-Major-Änderung.

## v0.9.76.14

- CI-Hotfix nach Run #788: drei historische 24-h-Profil-Regressionen auf den bereits fachlich freigegebenen, kompakteren v0.9.76.13-Achsenvertrag migriert; kein Produktcode-Rollback.
- Die Tests erwarten nun die reduzierten mobilen Seitenränder, die vereinfachte obere Zeitachse ohne dominante Kalenderzeile, kompakte Tageswechselmarker sowie den aktuellen `major`-/`profile-bottom-date`-Vertrag.
- TypeScript 7.0.2 und Vite 6.4.3 waren in #788 bereits vollständig grün; DWD-Ortsausschnitt, Originalpixel-Auswertung und 24-h-Profil-Feinschliff bleiben unverändert erhalten.
- Gemeinsamer Browser/PWA/iOS-Fachkern bleibt erhalten; keine Worker-Fachänderung.

## v0.9.76.13

- Buildfix für den einzigen Fehler aus GitHub-Release #787: nach Entfernung der redundanten 24-h-Zeitpille verblieb `profileWindowEndLabel` als unbenutzte Konstante und wurde von TypeScript 7 mit TS6133 abgewiesen.
- Die Konstante ist entfernt und die zugehörige 24-h-Profil-Regression schützt den Fehler künftig explizit. Die in v0.9.76.12 zusammengeführten DWD-Ortsausschnitt- und 24-h-Profiländerungen bleiben vollständig erhalten.
- Keine funktionale Worker-Änderung.

## v0.9.76.12

- Konsolidiert die beiden nahezu zeitgleich auf v0.9.76.10 entstandenen v0.9.76.11-Linien ohne Rollback: der DWD-Ortsausschnitt mit Originallegende/Originalpixel-Auswertung und der mobile Feinschliff des 24-h-Wetterprofils sind gemeinsam enthalten.
- 24-h-Profil: redundante Zeit-Pille entfernt, linke/rechte Diagrammränder deutlich verdichtet, Achsen-/Einheiten-/Wolkenbeschriftungen gegen Überdeckung gehärtet, Nachtstunden weniger dominant und obere/untere Zeitachse auf eine sparsame gemeinsame Struktur reduziert.
- DWD „Wolken + Niederschlagsart“: standortzentrierter Deutschland-Ausschnitt, feste Originallegende, Originalpixel-Klickauswertung, Georeferenzierungs-/Randtests und zugehörige UI-Geometrie aus dem hochgeladenen parallelen v0.9.76.11-Stand bleiben vollständig erhalten.
- Gemeinsamer Browser/PWA/iOS-Fachkern bleibt erhalten; keine Worker-Fachänderung und kein manueller Worker-Upload erforderlich.

## v0.9.76.11

- „Wolken + Niederschlagsart“ startet für deutsche Standorte und Favoriten als standortzentrierter, verschieb- und zoombarer Ausschnitt des unveränderten amtlichen DWD-Originalbilds.
- Standortmarker und freie Bildklicks bleiben an den normierten Originalpixeln des vollständigen DWD-PNG gebunden. Die reine Ansichtsabbildung wurde an 17 sichtbaren DWD-Stadtankern sowie fünf deutschen Randorten geprüft und erzeugt keinen Kartenlayer.
- Die im amtlichen DWD-Bild eingebettete Originallegende bleibt fest am Ausschnitt sichtbar und stammt aus derselben Bildantwort. Reisewetter v0.9.76.9 und das modernisierte 24-h-Wetterprofil v0.9.76.10 bleiben vollständig erhalten.
- Keine Änderung an Worker-Fachlogik oder iOS-Architektur; kein manueller Worker-Upload erforderlich.

## v0.9.76.10

- 24-h-Wetterprofil grafisch nach dem klareren Prinzip der Tagesansicht neu geordnet: rollend von jetzt bis +24 h, alle Parameter exakt auf denselben senkrechten Zeitschritten und ohne mobile Verkleinerung eines künstlich überbreiten Diagramms.
- Windbereich ergänzt um die appweit identischen DWD-Böenwarnschwellen mit dezenten Warnbändern/-linien; die Windskala zeigt mindestens die erste Warnschwelle.
- Nachtstunden werden über alle Bahnen gemeinsam abgedunkelt; Sonnenaufgang und Sonnenuntergang stehen dezent an ihrer exakten Zeitposition. Einheitliche Parameter-/Einheitenspalte, sparsamere Skalen und eine zweite kompakte Zeitreferenz am unteren Rand verbessern die vertikale Lesbarkeit.
- Gemeinsamer Browser/PWA/iOS-Fachkern bleibt erhalten; keine Worker-Fachänderung.

## v0.9.76.9

- Reisewetter/Fester Zeitraum: historische modellierte ERA5-Schneehöhe wird jetzt immer mit ausgewertet; Schneefall bleibt getrennte Zusatzinformation und wird bei einem Schneehöhen-Ausfall nicht als Ersatzwert ausgegeben.
- Wunschzeitraum: Alternative Reisezeiträume werden nicht mehr in nahezu identische, tageweise verschobene Fenster verdichtet. Neuer editierbarer Mindestabstand; Standard = Reisedauer, Untergrenze = 50 % der Reisedauer.
- Bei 7 Tagen Reisedauer beträgt der Standardabstand damit 7 Tage; der Nutzer kann ihn bis minimal 4 Tage korrigieren. Browser/PWA/iOS teilen weiterhin denselben Fachkern; keine Worker-Fachänderung.

## v0.9.76.7

- Kurzfristtexte sprachlich geglättet: relative Uhrzeiten werden satzgrammatisch statt durch bloßes Voranstellen einer Präposition erzeugt. Dadurch heißt es z. B. „morgen um 19:00 Uhr“ und „morgen ab 14:00 Uhr“ statt „um morgen 19:00“ bzw. „ab morgen 14:00“.
- Derselbe Zeitphrasen-Helfer gilt für trockene, Niederschlags- und Böen-Zusammenfassungen im Prognose-Cockpit; Tagesbezug und „Uhr“ bleiben auch für übermorgen bzw. spätere Tage eindeutig.
- Keine Änderung an Forecast-Daten, RUC-Fusion, Worker-Fachlogik oder iOS-Architektur.

## v0.9.76.5

- Modellstände: Best Match wird nicht mehr irreführend mit `Init –` dargestellt, sondern als modellabhängiger Laufverbund. Bei tatsächlich verwendeten Quellen ohne publizierten Init-Zeitstempel steht explizit „von Quelle nicht ausgewiesen“; bekannte Einzelmodell-Inits bleiben in UTC erhalten.
- 24-h-Wetterprofil: Maximum und Minimum werden robust aus der vollständigen kanonischen stündlichen 24-h-Temperaturkurve bestimmt und immer am tatsächlichen Kurvenpunkt markiert. Sichtbar steht nur noch der Wert (`21°`, `15°`) ohne `Tmax`/`Tmin`-Präfix; der 3-h-Modus verliert die Extrema nicht.
- Reisewetter „Hohe Schneelage“: Optimierung basiert zwingend auf historischer Schneehöhe und Schneedeckendauer. Kumulierter Schneefall ist nur noch Zusatzinformation und ersetzt die Schneehöhe bei einem Quellfehler nicht. Die Schneelage-Kachel zeigt primär Ø Schneehöhe und zusätzlich die Schneefallsumme.
- Langfrist: kostenneutraler Ausbaupfad für C3S-CDS, DWD GCFS2.2/EPISODES, NOAA NMME und eine getrennte Extended-Range-Ebene dokumentiert; keine zusätzlichen kostenpflichtigen Dienste aktiviert.

## 0.9.76.4
- CI/iOS-Status: `MID_IOS_STATUS.json.releaseVersion` wird bei Versionsänderungen nun idempotent durch `sync-version.mjs` mitgeführt; damit kann ein Patch-Bump die iOS-Strukturregressionen nicht mehr durch veraltete Release-Metadaten blockieren.
- Release #778 bestätigte bereits TypeScript 7.0.2 und Vite 6.4.3; der Patch ändert keinen Forecast-, RUC-, Worker-, 24-h-, Modellstand- oder Komposit-Fachcode.

## 0.9.76.3

- Mitigiert die fünf verbliebenen Regression-Gate-Fehler aus GitHub-Run #777, nachdem TypeScript 7.0.2 und Vite bereits vollständig grün waren.
- Akzeptiert im RUC-Sync-Vertrag ausschließlich den real aktiven, bekannten `:11/:41`-Pre-Watchdog-Zwischenstand; unbekannte Workflow-Drift bleibt fail-closed.
- Entkoppelt den TypeScript-7-Meilensteintest von einer hart codierten Patchversion und hält Compiler/Lockfile/Strada-Vertrag weiterhin exakt.
- Entfernt die veraltete SEO-Erwartung eines sichtbaren `kostenlos`-Hinweises; Discoverability bleibt unverändert geschützt.

## v0.9.76.1

## 0.9.76.2

- Behebt die vier im realen GitHub-TypeScript-7-Gate von Release #776 gefundenen Strict-Compilerfehler.
- Korrigiert die `timezone`-Übergabe im Modellstand der ForecastCockpit-Ansicht.
- Entfernt drei nach den UI-/Diagnosebereinigungen ungenutzte TypeScript-Symbole, ohne Fachlogik zu verändern.
- TypeScript bleibt 7.0.2; die TS7-/Capacitor-JSON-Migration aus v0.9.76.1 bleibt vollständig bestehen.

- Kanonische Tmin-/Tmax-Konsistenz appweit geschlossen: vollständig abgedeckte Tage beziehen ihre Extrema aus `displayHours`; im 24-h-Profil stehen `Tmin` und `Tmax` wieder direkt an den tatsächlichen Punkten der T-Kurve, auch bei 3-h-Anzeigedichte.
- Modellstände fachlich präzisiert: `Init`, `Quelle bereit` und `Eingeflossen` sind getrennte Zustände; nur tatsächlich in der kanonischen Forecast-Fusion verwendete Quellen erhalten `Eingeflossen`. Dieselbe Transparenz wird auch für die Kurzfristvorhersage bereitgestellt.
- Sichtbare Entwicklungs-/Hosting-/Kosteninterna aus Produkttexten entfernt, ohne interne Architektur-, Kosten- oder Deploymentverträge anzutasten.
- Kompositbild repariert: oberster Referenzlayer ist transparent und vektorbasiert und zeichnet nur Grenzen/Orte über das weiterhin sichtbare Satellitenbild.
- RUC-Resilienz erweitert: Primärslots `:11`/`:41` bleiben bestehen; kanonischer `force=false`-Recovery-Dispatch und unabhängiger Watchdog sind für den expliziten GitHub-Workflow-Sync vorbereitet.
- TypeScript bleibt exakt 7.0.2; den unter Node 22.16 gescheiterten Capacitor-Konfigurationspfad beseitigt, indem die äquivalente reine Metakonfiguration von `capacitor.config.ts` nach `capacitor.config.json` verschoben wurde. Kein TypeScript-Downgrade und kein iOS-Fork.
- Worker-Metadaten zur tatsächlichen Modellnutzung sind semantisch geändert; der bestehende semantische Release-Gate soll den automatischen Worker-Deploy auslösen. Kein manueller Worker-Upload vorgesehen.

## v0.9.76.0

- Eigenständigen TypeScript-7-Kompatibilitätsmeilenstein abgeschlossen: Compiler und Lockfile von 5.9.3 auf exakt 7.0.2 angehoben.
- App- und Node-Typecheck bleiben artefaktfrei und bestehen ohne fachliche Quellcode- oder `tsconfig`-Änderung; React/React DOM/react-is 18.3.1, Vite 6.4.3 und @vitejs/plugin-react 4.7.0 bleiben bewusst unverändert.
- Die von TypeScript 7 entfernte Strada-JavaScript-Compiler-API wird für API-basierte Regressionen über den offiziell vorgesehenen Side-by-side-Alias `typescript-strada` 6.0.3 bereitgestellt; Produkt-Typecheck und alle `tsc`-Aufrufe bleiben ausschließlich auf 7.0.2.
- Dependency-Policy und historische Wartungswächter auf den qualifizierten TypeScript-7-Stable-Vertrag umgestellt; neue Required Regression schützt Compiler-/Lockfile-Stand, No-Emit-Konfiguration, Plattformgleichlauf und die Abgrenzung zu React 19/Vite 8/plugin-react 6.
- Gemeinsamer Browser/PWA/iOS-Fachkern und Worker-Semantik unverändert; kein iOS-Fork und kein manueller Worker-Upload erforderlich.

## v0.9.75.0

- 24-h-Wetterprofil auf eine verbindliche gemeinsame Zeitgeometrie umgestellt: Wetterpiktogramme, Stundenraster, Sonnenereignisse, Kurven, Windpfeile, Wolken, Hazards und Auswahlcursor stehen jetzt senkrecht exakt übereinander.
- Bewölkung als vier schmale, kontinuierlich ein-/ausfadende Grauintensitätsbänder in der Reihenfolge Gesamt/H/M/L umgesetzt. Rechte Wolken-Prozentbeschriftung entfernt; exakte Werte bleiben in Tooltips und Einzeldaten erhalten.
- Luftdruckbahn vergrößert und Kurve in Hell-/Dunkelmodus deutlich kontrastreicher ausgeführt; responsive Hochformat- und Querformat-Master-/Detailansicht bleibt erhalten.
- Grundlage ist der verbindliche letzte Build-Stand v0.9.74.10 einschließlich PNG-Integritäts- und 24-MB-Uploadbudget-Verträgen. Gemeinsamer Browser/PWA/iOS-Fachkern, keine Worker-Fachänderung und kein manueller Worker-Upload erforderlich.

## v0.9.74.10

- RUC-/Release-Pages-Collision behoben: alle drei Release-Pages-Jobs teilen `mid-pages` nun mit `cancel-in-progress: false`; laufende RUC-Publikationen werden dadurch nicht mehr von einem Release abgebrochen. Release-Supersession auf `mid-install-${{ github.ref }}` bleibt bewusst aktiv.
- RUC-Resilienz unverändert: versetzte `:11`-/`:41`-Schedule-Slots plus Freshness-/Catch-up-Guard; ein von GitHub verworfener best-effort-Schedule-Event kann weiterhin erst durch den nächsten Slot aufgefangen werden.
- GitHub-Browser-Upload wieder ermöglicht: native Light-/Dark-Splashscreens auf je eine vollständige 2732×2732-Asset-Catalog-Quelle dedupliziert und reproduzierbaren Professional-Packer ergänzt. Generiertes `ios/App/App/public` wird nicht transportiert, sondern im Installer nach grünem Build via `cap copy ios` neu erzeugt.
- Professional-Packer erzwingt 24.000.000 Byte Sicherheitsbudget; Forecast-/Worker-/RUC-Fachlogik und Apple-Capabilities unverändert, kein manueller Worker-Upload erforderlich.

## v0.9.74.9

- iOS-Light-Splash-Hotfix: alle drei zuvor abgeschnittenen `2732 × 2732`-PNG-Dateien aus dem verbindlichen Light-Splash-Asset vollständig neu erzeugt.
- Neuer echter PNG-Integritätsvertrag prüft Signatur, Chunkgrenzen, CRC, IEND und IDAT-Dekompression für native Light-/Dark-Splashscreens und App-Icons; reine IHDR-Abmessungsprüfungen reichen nicht mehr aus.
- Keine fachliche Worker-, RUC-, Forecast-, PWA- oder Apple-Capability-Änderung; nächstes Gate bleibt die macOS-/Xcode-Simulator-Qualitätssicherung.

## v0.9.74.8

- Verbindliche Light-/Dark-Logo-Sets für Header, Web-Bootscreen, Favicons, Social Card, PWA-Icons sowie native iOS-App-Icons und Splashscreens eingeführt; Auto folgt dem wirksamen Theme, manuelle Auswahl bleibt persistent.
- Einsatzspezifische Kompakt-, Horizontal-, Icon- und Splash-Assets ersetzen die bisherige Mehrfachverwendung eines quadratischen Logos; beide Theme-Sets werden offline vorgehalten.
- iOS-Webcontainer mit demselben geprüften React/Vite-Build synchronisiert; kein Plattformfork und keine neue native Berechtigung.
- TypeScript, Vite, Worker-Syntax und alle 579 Regressionen bestanden. Worker-Fachlogik unverändert; kein manueller Worker-Upload erforderlich.

## v0.9.74.7

- Release-CI Run #771 mitigiert: npm ci, Dependency-Audit, TypeScript und Vite waren grün; 576/577 Regressionen bestanden. Ausschließlich `test-ruc-dwd-pipeline-09690.mjs` enthielt noch ein v0.9.74.5-only Übergangsfenster.
- Drei verteilte, versionsgebundene RUC-Workflow-Ausnahmen durch einen gemeinsamen zustandsgebundenen Sync-Vertrag ersetzt: bytegleich synchron oder exakt bekannter geschützter Legacy-.github-Zustand bei vollständig validiertem kanonischem :11/:41-Catch-up-Workflow.
- Unbekannte Workflow-Drift und unvollständiger kanonischer Catch-up-Stand bleiben fail-closed. Neue Regression prüft synced, pending-admin-sync, unsafe-drift und invalid-canonical.
- RUC-Fachdaten, Pages-Free/950-MB-Grenze, Forecast-Fusion, iOS und Worker-Semantik unverändert; manueller Worker-Upload bleibt unnötig.

## v0.9.74.6

- Release-CI Run #770 mitigiert: npm ci, Dependency-Audit, TypeScript, Vite und 576/577 Regressionen waren grün; ausschließlich `test-ruc-pages-free-storage-09700.mjs` erwartete trotz bewusst geschütztem `.github`-Self-Modification-Block noch Bytegleichheit zum bereits aktualisierten kanonischen RUC-Workflow.
- Release-vor-Admin-Sync-Ausnahme konsistent auf beide RUC-Workflow-Regressionen angewendet und exakt auf v0.9.74.5/.6 sowie den bekannten Legacy-Workflowzustand begrenzt. Ab v0.9.74.7 ist die Ausnahme automatisch wieder geschlossen.
- RUC-Catch-up (:11/:41), 950-MB-Pages-Limit, Forecast-/Worker-Semantik und Kostenvertrag unverändert. Nach grünem v0.9.74.6-Release ist der explizite Workflow-Sync auf `main` und `mid-stable` unmittelbar nachzuholen; manueller Worker-Upload bleibt unnötig.

## v0.9.74.5

- Release-CI Run #769 mitigiert: npm ci, Audit, TypeScript und Vite waren grün; die einzigen 2/576 Fehler waren historische CARTO-Token-Regressionsasserts. Sie schützen nun den seit v0.9.74.3 gültigen schlüsselfreien OSM+MapLibre-Tone-Vertrag statt entfernte CARTO-URLs.
- DWD-RUC-Scheduler gegen ausgelassene GitHub-`schedule`-Ereignisse gehärtet: bestehender :41-Slot plus versetzter :11-Recovery-Slot, äußeres `cancel-in-progress: false` und billiger exact-run Catch-up/Freshness-Guard vor apt/ecCodes/pip.
- Der Guard überspringt nur bei strukturell gültigem, exakt aktuellem Pages-Free-RUC; neuer/stale/unklarer Stand läuft fail-open in die vollständige Verarbeitung. `fetch_and_build_ruc.py` bleibt authoritative Completeness-Gate.
- Pages-Free-Projektion, 950-MB-Grenze, Post-Deploy-Health-Convergence, Forecast-Fusion und Worker-Runtime bleiben unverändert. RUC-Workflow-Sync ist explizit erforderlich; manueller Worker-Upload nicht.

## v0.9.74.4

- DWD-RUC Run #12 analysiert: RUC/RUC-EPS-Build, Pages-Free-Prüfung, 918-MB-Seitenzusammenstellung, Artifact-Upload und Pages-Deployment waren erfolgreich; ausschließlich der unmittelbar folgende Worker-Health-Probe sah noch den vorherigen stale `latest.json`.
- Post-Pages-Healthcheck um ein kurzes begrenztes Konvergenzfenster mit eindeutigen No-Cache-Probes und Backoff ergänzt. Der neue veröffentlichte Lauf muss weiterhin exakt `ready + fresh + schemaValid` werden; stale/falsche Runs werden niemals akzeptiert.
- Persistiert der stale Zustand nach dem Retry-Budget, bleibt der Workflow fail-closed. Neue Required Regression simuliert sowohl `stale -> stale -> fresh` als auch dauerhaft stale.
- Keine Änderung an RUC-Fachlogik, Forecast-Fusion, Pages-Free-Profil, Worker-Runtime oder iOS-Nativfähigkeiten; kein manueller Worker-Upload erforderlich.

## v0.9.74.3

- Kompositbild: die anonym inzwischen gesperrten CARTO-Positron-/Dark-Matter-Kacheln samt "API KEY REQUIRED"-Wasserzeichen vollständig entfernt; bestehende Kartenbasis-IDs bleiben für Persistenz erhalten.
- Schlüsselfreie OpenStreetMap-Kacheln bilden nun Standard, "Schlicht hell" und "Schlicht dunkel". Die beiden schlichten Varianten werden ausschließlich lokal über MapLibre-Raster-Sättigung, Kontrast und Helligkeit aufbereitet; kein API-Key, Konto oder kostenpflichtiger Kartendienst erforderlich.
- Gleichen Schutz appweit auf Wetterkarten und Synoptikkarte ausgeweitet, damit der bereits bei der Extremwetterkarte behobene CARTO-Ausfall nicht in anderen Kartenmodulen wiederkehrt.
- Neue Required Regression verhindert produktive `basemaps.cartocdn.com`-Rückfälle und schützt die persistierten hell/dunkel-Auswahlvarianten sowie den lokalen Raster-Tone-Vertrag. Worker- und Wetterdatenlogik bleiben unverändert.

## v0.9.74.2

- Pages-Release-Restore gegen transiente `HTTP 429/500/502/503/504`- und Netzwerkfehler gehärtet: begrenzte Retry-/Backoff-Logik mit `Retry-After`-Beachtung statt sofortigem Abbruch eines kompletten Release-Versuchs.
- RUC-Snapshot-Restore intern auf maximal 8 parallele Chunk-Downloads begrenzt, um Lastspitzen auf `midwx.app`/GitHub Pages zu vermeiden; Workflow-Selbsterneuerung ist dafür nicht erforderlich.
- Fail-closed bleibt erhalten: persistente Fehler brechen nach dem Retry-Budget weiterhin ab; Größe und SHA-256 jedes Chunks werden unverändert geprüft, unvollständige temporäre Restores werden verworfen.
- Anlass war Run #766: Versuch 1 traf einen transienten HTTP 503, Versuch 2 war erfolgreich; der Gesamt-Release v0.9.74.1 war bereits grün.

## v0.9.74.1

- Release-CI-Hotfix nach Run #765: `midCloud` und `highCloud` bleiben im ShortTermForecastPoint optional; die neue SVG-Wolkenstruktur akzeptiert daher korrekt `number | undefined` und normiert fehlende Werte auf 0 %.
- Keine Änderung am visuellen Wolkenkonzept, an Forecast/RUC/Worker-Semantik oder an nativen iOS-Fähigkeiten.
- Regression des 24-h-Wolkenprofils um den optionalen H/M-TypeScript-Vertrag erweitert; zwei ältere Texttoken-Regressionsprüfungen auf die seit v0.9.74.0 korrekte Beschriftung Gesamt/H/M/L synchronisiert.

## v0.9.74.0

- 24-h-Wetterprofil: Wolkenbereich nach dem abgestimmten Konzept neu aufgebaut – Gesamtbewölkung plus höhentypische H/M/L-Strukturen statt optisch gleichartiger Wolkenblöcke.
- Hohe Wolken cirrusartig/faserig, mittlere Wolken altocumulus-/schichtartig und tiefe Wolken cumulus-/stratocumulusartig; 0–100-%-Bedeckung steuert sichtbar Dichte, Breite, Masse und Opazität.
- Nachbarstunden-Fading gilt nun für Gesamt + alle drei Wolkenhöhen; Randwerte und Einzeldaten zeigen Gesamt/H/M/L.
- Kanonischer Forecast-/RUC-Datenvertrag unverändert; Pages-Free-Speichermitigation aus v0.9.73.13 bleibt enthalten, kein zusätzlicher Worker-Fachpfad und keine kostenpflichtige Infrastruktur.

## v0.9.73.13

- Release-Run #762 vollständig analysiert: ZIP, Dependencies, TypeScript, Vite, Regressionen und Capacitor waren grün; der einzige Fehler lag im separaten Worker-Smoke, weil ein stale RUC-Snapshot die Promotion blockierte.
- Zirkuläres RUC-Bootstrap-Gate behoben: Ein **schema- und metadatenvalider** Snapshot mit exakt `RUC-Lauf nicht frisch` darf den Worker-Release einmalig bootstrap-sicher passieren; alle anderen RUC-Healthfehler bleiben fail-closed.
- Stale RUC-Daten bleiben im Forecast weiterhin deaktiviert; der RUC-Preprocessor verlangt nach Veröffentlichung unverändert einen echten `ready + fresh`-Lauf.
- Automatischer 0-%-Worker-Smoke, Rollback und Kostenvertrag bleiben unverändert; kein manueller Worker-Upload und kein R2 erforderlich.

## v0.9.73.12

- Release-CI-Hotfix nach Run #761: veraltete exakte Extremwetter-Funktionssignatur-Regression an die bereits gültige `env`-Verdrahtung angepasst; fachlicher Mitteleuropa-Extremwetterpfad unverändert.
- Der parameter-native ICON-D2-RUC-Multiproduktpfad aus v0.9.73.11 bleibt unverändert: stündlicher Zustandskern, 5-minütiges `TOT_PREC` sowie separate 15-minütige Konvektions-/Diagnostikprodukte.
- Produktionsvalidierung bleibt fail-closed: erst grüner Release-CI-Lauf, danach automatischer semantischer Worker-Deploy und frischer RUC-Workflow; kein manueller Worker-Upload und keine kostenpflichtige Infrastruktur.

## v0.9.73.11

- DWD ICON-D2-RUC appweit auf parameter-native Taktung umgestellt: gemeinsamer Zustandskern stündlich bis +14 h, `TOT_PREC` nativ 5-minütlich bis +6 h und Konvektions-/Reflektivitäts-/Phasenprodukte 15-minütlich bis +6 h.
- 114 aktuell gelistete RUC-v1-Parameter appweit auditiert; hochwirksame Severe-, Strahlungs- und Specialist-Diagnostik gezielt ergänzt, große/mehrdimensionale oder redundante Felder bewusst zurückgestellt.
- 0–6-h-Extremwetterpfad um räumliche RUC-Rapid-Signale für Niederschlagsrate, CAPE/CIN und optionale DBZ/UH/LPI/EchoTop/Hagel-Diagnostik erweitert.
- `VIS`, `CEILING`, `HZEROCL`, `SNOWLMT`, `CLCM`, `CLCH`, `T_G`, `H_SNOW` als stündliche Specialist-Diagnostik; Sicht mit 10-m-Wireauflösung ohne 32,7-km-Clipping.
- `SRH` und `WSHEAR_U/V` wegen zusätzlicher DWD-`lvt1`-Layersemantik bewusst nicht blind importiert; separater Layer-Audit vorgesehen.
- RUC-Strahlungsfelder werden diagnostisch geführt, ersetzen aber den appweiten Sunshine-Duration-Contract nicht ohne DNI-/Sonnengeometrie-Validierung.

## v0.9.73.10

- Produktiven RUC-Run #6 repariert: gemeinsames ICON-D2-RUC-Mehrparameterbundle nutzt die tatsächlich gemeinsame native Stundenachse 0…+14 h statt nicht vorhandene Viertelstundenwerte für Temperatur/Wind/Druck/Wolken zu verlangen.
- Kein künstliches Interpolieren auf :15/:30/:45; native 15-Minuten-/Radar-/Nowcast-Quellen bleiben für die feine Kurzfrist zuständig, RUC bleibt kanonischer stündlicher Kurzfristkalibrator.
- RUC-EPS bleibt stündlich; Worker-/Modellmetadaten melden für den gemeinsamen RUC-Punktadapter korrekt 3600 s.
- Neuer Common-Hourly-Axis-Regressionsschutz; letzter fehlerhafter Run #6 ist im RUC-Status dokumentiert und wird nicht auf dem alten SHA erneut ausgeführt.

## v0.9.73.9

- Beide neuen MID-Logovarianten integriert und in den Einstellungen als Auto / Dunkles Logo / Helles Logo wählbar gemacht; Auto folgt dem Layoutkontrast und greift auch im Startbildschirm.
- Wolkenkästchen im 24-h-Wetterprofil wieder sauber an die Stundenwerte gekoppelt: H/M/L als eingerückte Rasterzellen mit dezenten Frames statt losgelöster Vollbandoptik.

## v0.9.73.8

- Release-Gate-Hotfix: veralteten Integrationsassert zur früheren RUC-„Verfügbarkeitsquelle“ auf den produktiven DWD→Pages→Worker-Vertrag umgestellt.
- Run #759 hatte TypeScript, Vite und 567/568 Regressionen grün; der einzige Fehler war dieser historische Wortlaut-Test.
- v0.9.73.7-Fachstand bleibt vollständig erhalten: RUC 0–6 h / 15 min, danach stündlich bis +14 h; RUC-EPS stündlich; appweite Modelltexte/Badges und Wolkenprofil unverändert.

## v0.9.73.7

- DWD-RUC-Hybridraster: deterministisch 0–6 h in 15-Minuten-Schritten, danach stündlich bis +14 h; RUC-EPS bleibt stündlich.
- Wolkenprofil vereinheitlicht: ein neutraler Grauton für H/M/L, Intensität ausschließlich nach jeweiligem Bedeckungsgrad und weichere Fade-in/Fade-out-Übergänge.
- Modellstand-/RUC-Texte app-weit an den produktiven DWD Open Data → GitHub Pages → Worker-Pfad angepasst.
- `RUC`-Badge nur noch für echte DWD ICON-D2-RUC/RUC-EPS-Zeilen; andere Rapid-Update-Modelle tragen `Rapid`.
- RUC-Downloader konsistent zum Hybridraster nachgezogen; bestehende Modellmeta-/RUC-/Pipeline-Regressionen aktualisiert und bestanden.

## v0.9.73.6

- DWD ICON-D2-RUC: native triangular-grid lookup now derives coordinates from authoritative `CLAT`/`CLON` fields instead of unavailable ecCodes `latitudes`/`longitudes` arrays.
- RUC preprocessing keeps v0.9.73.5 hourly preselection and bounded parallel downloads (`TOT_PREC` 15/325; RUC-EPS 300/6500 observed in run #4).
- Added fail-closed coordinate, point-count and radians-to-degrees validation.

## v0.9.73.5

- Release-Gate-Hotfix: historische Extremwetter-Persistenzregression auf den aktuellen semantischen StorageSafety-Revisionsvergleich angepasst.
- RUC-Workflow-Spiegel wieder byteidentisch zum geschützten produktiven `.github`-Workflow; die Beschleunigung bleibt vollständig im Python-Fetcher und benötigt keine Workflowänderung.
- v0.9.73.4-Favoriten- und RUC-Fachfixes unverändert beibehalten; keine Worker-/R2-/Apple-/Kostenänderung.

## v0.9.73.4

- RUC-Preprocessing beschleunigt: Für das 0–14-h-Bundle werden aus DWD-`PTxxxHyyM`-Bäumen vor dem Download nur die 15 benötigten vollen Stunden ausgewählt; 5-/15-Minuten-Zwischenstände und spätere Leads werden nicht mehr unnötig geladen.
- RUC-Download mit begrenzten 8 parallelen Transfers und sichtbarem Fortschritt; ecCodes extrahiert das native Lat/Lon-Gitter pro Parameter/EPS-Gitter nur einmal.
- Favoriten-Dauerhaftigkeit repariert: StorageSafety vergleicht Primär-/Shadow-Favoriten jetzt über `mid:favorites:updated-at`, sodass ein älterer IndexedDB-Mirror einen neueren nativen Favoritenstand nach Suspend/Reload nicht mehr zurücksetzen kann.
- Keine fachliche Worker-, R2-, Apple-Capability- oder Kostenänderung.

## 0.9.73.1

## v0.9.73.3

- RUC-Bootstrap-Hotfix: iOS-Statusversion mit Release synchronisiert; keine fachliche RUC-/Worker-Änderung.
- Generierte Python-`__pycache__`-Artefakte aus dem Release entfernt.

## 0.9.73.2
- RUC Pages bootstrap: ein noch nicht vorhandenes `/ruc/latest.json` (HTTP 404) blockiert den allerersten Release nach Aktivierung der kostenlosen RUC-Pipeline nicht mehr. Andere Restore-Fehler bleiben fail-closed.


- Hotfix für die kostenlose DWD ICON-D2-RUC/RUC-EPS-Pipeline: URL-kodierte DWD-Laufverzeichnisse (`%3A`) werden vor der Run-Erkennung dekodiert.
- Verhindert den falschen Fehler `No common DWD RUC/RUC-EPS run directories found` bei vorhandenen stündlichen Läufen.
- Fail-safe-Vollständigkeitsprüfung, gemeinsamer RUC/RUC-EPS-Lauf, Pages-Pfad und deaktiviertes R2 bleiben unverändert.

## 0.9.73.0

- iOS Privacy: Haupt-App und `MIDWidgets` besitzen jeweils ein eigenes, im Target gebündeltes `PrivacyInfo.xcprivacy`; Tracking bleibt überall deaktiviert.
- App-Manifest: Precise Location, optionaler zufälliger Device-Sync-Identifier, verschlüsselter portabler Nutzerinhalt sowie Cloudflare-RUM Produktinteraktion/Performance sind mit passenden AppFunctionality-/Analytics-Zwecken deklariert.
- Required Reason API: `@capacitor/filesystem` wird mit `NSPrivacyAccessedAPICategoryFileTimestamp` / `C617.1` abgedeckt.
- Widget-Manifest: ausschließlich Precise Location und frei eingegebener Standortinhalt für `mid.native.widget.v1`; keine Tracking-Domains und keine Required-Reason-API.
- iOS Regression: historische Adaptertests verwenden nun eine zentrale semantische Next-Milestone-Funktion, damit abgeschlossene Apple-Meilensteine nicht erneut durch harte Altvergleiche blockiert werden.
- Keine neue Apple-Berechtigung oder Capability: kein ATT, kein Push-Opt-in, kein Background Mode, kein `aps-environment`, keine Signierung. Nächstes Gate ist macOS/Xcode-Simulatorqualität.

## 0.9.71.1

## 0.9.72.0

- iOS: APNs-Callback- und BGAppRefresh-Quellen im Haupt-App-Target vorbereitet, ohne Berechtigungs-, Entitlement-, Token-Upload- oder Scheduling-Aktivierung.
- iOS: `BGTaskSchedulerPermittedIdentifiers` enthält den vorbereiteten Identifier `app.midwx.weather.background-refresh`; `UIBackgroundModes` und `aps-environment` bleiben absichtlich deaktiviert.
- Vertrag: `MID_APPLE_PUSH_BACKGROUND_CONTRACT.md` schützt den gemeinsamen React/Vite-/Worker-Fachkern und das Apple-/Kosten-Gate.
- RUC/Push/Widget: v0.9.71.1-Auditfixes bleiben enthalten; Ortsforecast-Schattenpfade nutzen die kanonische Forecast-Fusion.


- Vier veraltete iOS-Regressionen erwarten ab v0.9.71.0 korrekt `apple-push-background-refresh-source-preparation`; die WidgetKit-Xcode-Struktur bleibt vollständig erhalten.
- RUC-Appweit-Audit: Lüftungsassistent/-Push und Prognoseänderungs-Push verwenden die kanonische `forecast-fusion` statt eigener Best-Match-Ortsprognosen.
- Der native `mid.native.widget.v1`-Feed übernimmt stündliche/tägliche Forecastwerte aus der kanonischen Mehrmodell-/RUC-Fusion; Current und Astronomie bleiben als Rohhülle erhalten.
- DWD ICON-D2-RUC/ICON-D2 teilen weiterhin das DWD-ICON-Familienbudget; KNMI/DMI HARMONIE werden konservativ unter `uwc-west-harmonie` gruppiert, ohne Anbieterdiagnostik zu verlieren.
- Wasser-/Warnquellen benennen die kanonische MID-Ortsprognose korrekt; Druckniveau-, Berg-, Marine-, Radar-/Raster- und Mitteleuropa-Extremwetterpfade bleiben fachlich getrennte Spezialdaten.
- KNMI Direkt-GRIB wird nicht zusätzlich aktiviert: vorhandener kostenloser Open-Meteo-Pfad deckt die stündliche HARMONIE-Rapid-Quelle ab, während ein zweiter Datei/API-Key-/Dekodierpfad derzeit nur Betriebsaufwand duplizieren würde. R2 bleibt deaktiviert.

## 0.9.71.0

- Das vorbereitete Apple-Widget-Gerüst ist als echtes `MIDWidgets`-App-Extension-Target in `ios/App/App.xcodeproj` integriert und wird über `Embed Foundation Extensions` samt Target-Abhängigkeit in die bestehende Capacitor-App eingebettet.
- Die Widget-Swiftquellen liegen nun kanonisch unter `ios/App/MIDWidgets`; parallele alte Swift-Kopien unter `native/apple` wurden entfernt. Der gemeinsame Wetter-/Worker-Fachkern bleibt unverändert.
- Der unveränderte Datenvertrag `mid.native.widget.v1` wird beim Decodieren explizit validiert; der Widget-Provider nutzt den produktiven HTTPS-Endpunkt `mid-data-proxy.midwx.workers.dev`.
- Die Widget Extension verwendet iOS/iPadOS 17.0 für `AppIntentConfiguration`; das Haupttarget bleibt auf iOS 15.0. iOS unterstützt systemSmall/Medium/Large und die Lock-Screen-Familien Inline/Circular/Rectangular; `accessoryCorner` ist für ein späteres watchOS-Target per Compile-Grenze geschützt.
- Keine App Group, kein Apple-Entitlement, keine Signierung und kein kostenpflichtiger Dienst werden in diesem Quellmilestone aktiviert. Neue Regression schützt Xcode-Target, Einbettung, Info.plist, Bundle-ID, Plattformgrenzen und den Feedvertrag.

## 0.9.70.2

- Release-Hotfix für den Lifecycle-/Offline-Meilenstein: die historische v0.9.53.14-Core-Cache-Regression prüft nicht länger eine einzelne alte Quelltextzeile, sondern den aktuellen dreistufigen Cachevertrag aus Offline-Warmstart, Fresh-Cache und Stale-Netzfallback.
- Die Laufzeitlogik selbst bleibt unverändert: Offline wird vor jedem Netzpfad auf einen lokalen Kernforecast zurückgegriffen; frische Cachewerte werden normal wiederverwendet und ein belastbarer letzter Stand bleibt nach Netz-/Rate-Limit-Ausfall als begrenzter Fallback verfügbar.
- Run #749 bestätigte vor dem Testabbruch TypeScript und Vite-Build für v0.9.70.1 sowie 563 von 564 Regressionen; Worker, Pages und `mid-stable` blieben fail-closed unangetastet.

## 0.9.70.1

- Gemeinsamer Browser/PWA-/Capacitor-Lifecycle-Bridge: `pagehide`, Sichtbarkeit und nativer `appStateChange` sichern den lokalen Persistenzstand best-effort, ohne Favoriten, Events, Einstellungen oder Wetterzwilling-Daten zu löschen oder zurückzusetzen.
- Offline-Warmstart: ein höchstens 18 Stunden alter erfolgreicher Kernforecast wird ohne aussichtslosen Netzwerkversuch sofort aus dem lokalen Cache geliefert; ohne Cache endet der Ladevorgang unmittelbar mit einer verständlichen Offline-Meldung statt in einem Endlos-Ladezustand.
- Die Oberfläche kennzeichnet Offline-Betrieb kompakt samt Standzeit des gespeicherten Wetterstands; bei Netzrückkehr und nach längerer Wiederaufnahme wird derselbe gemeinsame Forecast-Loader gezielt neu angestoßen.
- Bestehende Browser-/PWA-Sichtbarkeits-Refreshpfade werden beim nativen Resume weiterverwendet; es entsteht kein iOS-Fachlogik-Fork und keine neue native Datenhaltung.
- Neue Required Regression schützt Lifecycle, Offline-Short-Circuit, Cache-Metadaten, lokalen Datenbestand und Dark-Mode-Offlinestatus.

## 0.9.70.0

- DWD ICON-D2-RUC/RUC-EPS kann ohne Cloudflare R2 über den kostenfreien GitHub-Pages-Pfad `pages-free-v1` veröffentlicht werden; GRIB-Decodierung bleibt vollständig im GitHub-Actions/ecCodes-Vorprozessor.
- Deterministischer RUC, voraggregierte RUC-EPS-Wahrscheinlichkeiten/Quantile und räumlicher Lookup werden als kleine immutable Chunks publiziert; der Worker benötigt für Pages keine HTTP-Range-Requests.
- Normale MID-Pages-Releases bewahren einen vorhandenen RUC-Snapshot mit Größen-/SHA-256-Prüfung und brechen bei aktivierter Pipeline fail-closed ab, statt RUC-Daten lautlos zu löschen.
- Tagesansicht: Niederschlagswahrscheinlichkeit bleibt nun auch bei gleichzeitig sichtbaren Niederschlagsbalken als kontrastierte cyanfarbene Kurve sichtbar.
- Tagesansicht: Windrichtungspfeile erhalten in der dunklen Ansicht einen hellen, leicht konturierten Kontrast; eine zuvor globale dunkle Cockpit-CSS-Regel ist auf das Cockpit begrenzt.
- R2 bleibt vollständig optional und inaktiv; für diesen Meilenstein wird kein kostenpflichtiger Speicher aktiviert.

## 0.9.69.7

- Extremwetter-Ausblick vom versehentlich wiederverwendeten v0.9.66.19-DACH-Stand auf den bereits in v0.9.67.7–v0.9.67.11 eingeführten vollständigen Mitteleuropa-/ICON-D2-Vertrag zurückgeführt.
- Native ICON-D2-Gebietsmaske, erweitertes Regionsnetz, resilienter Batch-/Teilcache und 0–6-h-KONRAD3D-/Meso-Beobachtungsabgleich wiederhergestellt; Browser-Direktpfad bleibt derselbe Fachkern.
- Freie OSM-Kontextlage wird über sämtlichen Gefahrenflächen erneut gezeichnet; Ländergrenzen, Kartenlinien und Städtenamen bleiben auch bei mehreren überlagerten Gebietslayern sichtbar.
- Neue Required Regression verhindert einen erneuten DACH-/v4-Rückfall und schützt die Karten-Layerreihenfolge.

## 0.9.69.6

- Worker-Auto-Deploy: reale `cloudflare/wrangler-action`-Ausgabe wird über den dokumentierten `command-output` statt über eine nicht erzeugte `/tmp`-Datei ausgewertet.
- Version-ID-Erkennung bleibt fail-closed und akzeptiert exakt eine Worker-Version-ID.
- Regression deckt die echte Wrangler-4.125.0-Zeile `Worker Version ID: ...` ab.

## 0.9.69.5

- Worker-Auto-Deploy-Hotfix: der in einer temporären `/tmp`-Wrangler-Konfiguration gespeicherte Worker-Einstiegspfad ist jetzt absolut und zeigt sicher auf den ausgecheckten Release-Arbeitsbaum.
- Regression schützt davor, `worker/metar-proxy.js` künftig wieder relativ zum Speicherort der temporären Config statt zum Repository aufzulösen.
- Der v0.9.69.4-Fehlversuch stoppte erneut vor Staging/Traffic; Pages und `mid-stable` blieben korrekt blockiert.

## 0.9.69.4

- Worker-Auto-Deploy-Hotfix: ein leeres Cloudflare-`placement` wird nicht mehr als ungültiges `placement: {}` an Wrangler übergeben.
- Gültiges Smart Placement bzw. genau ein expliziter Placement-Hinweis bleibt erhalten; unbekannte oder widersprüchliche Remote-Angaben brechen weiterhin fail-closed ab.
- Der fehlgeschlagene v0.9.69.3-Erstlauf änderte keinen produktiven Traffic; Pages und `mid-stable` blieben korrekt blockiert.

## 0.9.69.3

- Sicherer automatischer Cloudflare-Worker-Deploy mit fachlicher Änderungserkennung, Remote-Konfigurationsspiegel, 0-%-Staging, Versionsoverride-Smoke, 100-%-Promotion und automatischem Rollback.
- Dashboard-Variablen/Secrets bleiben erhalten; unbekannte Bindings und mehrdeutige Split-Deployments blockieren fail-closed.

## 0.9.69.2

- Cloudflare-R2-Betrieb auf **private-by-default** gehärtet: `r2.dev` wird beim einmaligen Bootstrap deaktiviert; ein Custom Domain bleibt optional und benötigt weiterhin eine gesonderte Freigabe.
- Bootstrap validiert Cloudflares aktuelle kleingeschriebene R2-Location-Hints (`weur`, `eeur`, …); der bisherige vorbereitete Großschrift-Default wird nicht mehr an die API gesendet.
- Lifecycle-Leckschutz für verwaiste `runs/` auf 48 h gesetzt. Die unmittelbare Vier-Run-Bereinigung bleibt Aufgabe des atomaren Publishers, der den aktuell durch `latest.json` referenzierten vollständigen Lauf vor dem Pointerwechsel niemals löscht.
- Neuer `ruc-health`-Workerpfad prüft Binding, Metadatenschema, Laufalter, Punkt-/Zeit-/EPS-Vertrag und die tatsächliche Existenz aller vier Laufobjekte, ohne Bucketnamen, Tokens oder URLs offenzulegen.
- GitHub-Stundenpublisher bleibt auf einen bucket-spezifischen R2-Object-Read-&-Write-Zugang begrenzbar; Bucket-/Lifecycle-Administration bleibt vom laufenden Publisher getrennt.
- Browser/PWA und iOS bleiben auf demselben React/Vite-/Worker-Fachkern; keine native Sonderlogik oder Persistenzänderung.

## 0.9.69.1

- Kostenfreien DWD-RUC-Produktionspfad gehärtet: der GitHub-Actions/ecCodes-Vorprozessor versucht mehrere gemeinsame RUC/RUC-EPS-Laufkandidaten und veröffentlicht nur einen vollständig dekodierten 0–14-h-Lauf.
- RUC-EPS wird für den normalen Forecast bereits im Vorprozessor zu >0,2-mm- und >5-mm-Wahrscheinlichkeit, Mittel sowie Q25/Q50/Q75 verdichtet; native Member bleiben ausschließlich für die kurzfristige Event-Ensembleauswertung abrufbar.
- Alle Laufobjekte einschließlich `lookup.bin` liegen unveränderlich unter `runs/<run>/`; `latest.json` wird erst nach Remote-Größenprüfung zuletzt ersetzt. Ein identischer vollständiger Lauf verursacht beim nächsten Workflow keine neuen Schreiboperationen.
- Alte RUC-Läufe werden erst nach erfolgreichem Pointerwechsel entfernt; vier vollständige Läufe bleiben als Rückfallreserve erhalten. Best Match/ICON-D2/ICON-D2-EPS bleiben jederzeit sichere Fallbacks.
- Cloudflare-R2-Bootstrap als Dry-Run/Fail-Closed-Werkzeug ergänzt. R2-Erstellung erfordert `MID_RUC_COST_APPROVED=true`; ein öffentliches Custom Domain zusätzlich `MID_RUC_PUBLIC_DOMAIN_APPROVED=true`. Ohne ausdrückliche Freigabe wird nichts im Cloudflare-Konto verändert.
- Browser/PWA und iOS verwenden weiterhin denselben React/Vite-/Worker-Fachkern; der nächste native Lifecycle-/Offline-Meilenstein bleibt unverändert.

## 0.9.68.1

- Netatmo-OAuth wird im nativen Container über Capacitor Browser im iOS-Systembrowser geöffnet; Browser/PWA behalten den bestehenden externen beziehungsweise Same-Window-Pfad.
- Der eng begrenzte Rücksprung `midwx://oauth/netatmo` verarbeitet Warm- und Kaltstarts, validiert Callback-Daten und öffnet anschließend die vorhandene MID-Stationsansicht.
- Fremde Deep Links, unsichere externe Zieladressen und ungültige Stationskennungen werden verworfen; Fachwerte und Stationspersistenz bleiben außerhalb des Adapters.

## 0.9.68.0

- Der gemeinsame React-/Vite-Kern verwendet für eine ausdrückliche Standortaktion im nativen Container den Capacitor-Geolocation-Adapter; Browser/PWA behalten den bisherigen `navigator.geolocation`-Pfad.
- Berechtigungen werden erst bei Bedarf angefordert. Es gibt weder einen Standort-Watcher noch Hintergrund-Ortung oder neue Koordinatenpersistenz.
- Nicht berechtigungsbedingte Brückenfehler können auf den bestehenden Browserpfad zurückfallen; eine Ablehnung wird nicht mit einem zweiten Prompt umgangen.
- Die iOS-Berechtigungsbeschreibungen und eine neue Required Regression schützen den Adaptervertrag.

## 0.9.67.5

- MapLibre GL JS 6.5 erhält im Vite-Produktionsbuild wieder den vorgeschriebenen selbstständigen ESM-Worker; dadurch erscheinen die modellierten DACH-Gefahrenflächen wieder, während Browser/PWA und iOS denselben Kartenkern behalten.
- Ein neuer Required-Test prüft die Worker-URL vor der ersten Karte sowie den gebündelten Produktions-Worker und verhindert einen erneuten lautlosen Ausfall der GeoJSON-Flächen.

## 0.9.67.4

- Release-Hotfix für den v0.9.67.3-Installer: Der Dependency-/Actions-Wartungstest verlangt nicht länger, dass der absichtlich vor Workflow-Selbstmodifikation geschützte aktive `.github`-Stand bereits innerhalb desselben ZIP-Installationslaufs aktualisiert wurde.
- `sync-github-workflows.mjs` synchronisiert beim ausdrücklich administrativen Lauf nun neben checkout v7.0.1 und setup-node v7.0.0 auch CodeQL `init`/`analyze` auf 4.37.7 (`ff2f1c621b7f889edc0d3c761ac2e6a3f8cdb0dd`).
- Der Installer-Sicherheitsvertrag bleibt unverändert: `.github` wird weder durch das Release-Overlay noch durch den automatischen Release-Commit selbst verändert; die Workflow-Aktualisierung erfolgt getrennt über den expliziten Sync.
- Versionssynchronisierung gehärtet: `sync-version.mjs` aktualisiert nun auch die kanonische Worker-Teilquelle, damit der Aggregate-Neubau den Release-Worker nicht auf die Vorversion zurücksetzen kann.
- Keine Änderung an Wetterlogik, UI, MapLibre/Lucide-Versionen oder Datenquellen gegenüber v0.9.67.3.

## 0.9.67.3

- PR #16 übernommen: Lucide React 1.31.x → 1.34.0; Package/Lockfile, Dependency-Policy und Freigabetest sind gemeinsam auf den neuen Stable-Pin umgestellt.
- PR #17 übernommen: MapLibre GL JS 5.24.0 → 6.5.0 einschließlich synchronisierter Transitivreihen und MapLibre-Pin-Regression; der verwendete Stand enthält die DOM-Sanitizing-Korrektur aus der 6.4.1-Linie.
- PR #15 übernommen: CodeQL 4.37.7 ist für `init` und `analyze` auf `ff2f1c621b7f889edc0d3c761ac2e6a3f8cdb0dd` SHA-gepinnt.
- PR #1/#2 nicht blind gemergt: `sync-github-workflows.mjs` synchronisiert alle Workflows auf checkout v7.0.1 (`3d3c42e5aac5ba805825da76410c181273ba90b1`) und setup-node v7.0.0 (`820762786026740c76f36085b0efc47a31fe5020`).
- React 18.3.1, TypeScript 5.9.3, Vite 6.4.3 und @vitejs/plugin-react 4.7.0 bleiben unverändert; die größeren Toolchain-Sprünge sind weiterhin separat zurückgestellt.

## 0.9.67.2

- Ein vollständig gecachtes Browser-/PWA-Update wird nun kontrolliert aktiviert und lädt offene App-Fenster auf den neuen Stand. Die vorherige geprüfte Version bleibt bis zur erfolgreichen Laufzeit-Gesundheitsmeldung als Rückfallversion erhalten.
- Dadurch kann nach einem erfolgreichen Release-Upload nicht länger unbemerkt eine wartende neue Version neben der weiterhin sichtbaren Altversion laufen.
- Die kompakte Event-Center-Übersicht zeigt neben Niederschlagsart und -wahrscheinlichkeit wieder die für den gesamten Eventzeitraum berechnete Niederschlagsmenge in mm.

## 0.9.66.19

- Regionsnamen von modellierten Gefahrenflächen werden ausschließlich aus der räumlichen Lage der jeweiligen Kontur bestimmt; meteorologische Spitzenwerte einer entfernten Rasterzelle können das Popup nicht mehr falsch benennen.
- „Stärkste Regionen“ fasst nur noch identische Kombinationen aus Region, Gefahr und Intensität zusammen und behält dabei die höchste Wahrscheinlichkeit. Mehrfache gleichlautende Einträge wie „Ostschweiz“ entfallen.
- Flug-Events behandeln fehlende Wolkenuntergrenzen strikt nullsicher. Ein noch nicht vorhandener TAF-/Ceiling-Wert wird nicht mehr durch `Number(null)` zu 0 und anschließend als „unter 100 ft AGL“ formatiert.
- Sehr niedrige diagnostische Untergrenzen bleiben zusätzlich gegen Sichtweite, tiefe Bewölkung und Wettercode plausibilisiert; ältere Flugwetter-Zwischenspeicher werden über einen neuen Cachevertrag entwertet.

## 0.9.66.18

- DACH-Extremwetterkarte und „Stärkste Regionen“ verwenden nun denselben flächenbezogenen Konturdatensatz. Zwei getrennte Gefahrenflächen bleiben auch dann zwei Listeneinträge, wenn ihre frühere grobe Regionsbezeichnung identisch war.
- Jede modellierte Gefahrenfläche erhält eine stabile ID; Auswahl, Marker, Prozentwert und Detailkarte sind dadurch eindeutig gekoppelt.
- Karten-Popups zeigen wieder die zur jeweiligen Fläche gehörende Regionsbezeichnung vor Prognosestufe und Wahrscheinlichkeit.
- Alpenregionen feiner zugeordnet: Wallis, Zentralschweiz, Tessin, Graubünden, Vorarlberg und Tirol ersetzen zu grobe Sammelzuordnungen.

## 0.9.66.17

- DACH-Extremwetterkarte: Beschriftungen werden nun aus den tatsächlich dargestellten, getrennten Konturkomponenten erzeugt. Zwei räumlich getrennte Felder derselben zusammengefassten Region erhalten damit jeweils eine eigene Stufen- und Prozentangabe; eingebettete stärkere Kerne verdrängen doppelte Hüllenbeschriftungen.
- Die in der Extremwetterkarte anonym nicht mehr nutzbaren CARTO-Kacheln wurden durch eine schlüsselfreie OpenStreetMap-Kartenbasis mit transparentem Orientierungslayer ersetzt. Das von CARTO gelieferte Wasserzeichen „API KEY REQUIRED“ erscheint dort nicht mehr.
- Flug-Events: Standortbezogene Zusammenfassungen für Wolkenuntergrenze, Sicht und Böen bleiben strikt auf dem lokalen Modell-/Druckniveaupfad. Räumlich entfernte METAR-/TAF-Hazards bleiben im amtlichen Hazard-Screening sichtbar, dürfen aber lokale Eckwerte nicht mehr überschreiben.
- Ungültige bzw. nicht spezifizierte Terminal-Cloud-Basen unter 100 ft und außerhalb des physikalischen Wertebereichs werden bereits im Worker verworfen. Die bestehende Low-Cloud-/Sicht-/Wettercode-Plausibilisierung bleibt zusätzlich aktiv.

## 0.9.66.16

- Vier veraltete Extremwetter-DACH-Regressionen an die seit 0.9.66.14 getrennte Kontur-/GeoJSON-Architektur angepasst. Die Tests prüfen nun `extremeOutlookAreaGeoJson.ts` und `buildExtremeOutlookContourGeoJson` statt entfernte Implementierungsstrings im Overlay.
- Keine Rücknahme der fachlichen Flächenkorrektur: Multipolygone, Lochringe, >60-%-Kerne und Schraffur bleiben unverändert.
- Korrekturen aus 0.9.66.15 für GeoJSON-TypeScript-Build, Wolkenuntergrenzen-Plausibilität und chronologische amtliche Warnungen bleiben erhalten.

## 0.9.66.15

- Produktionsbuild repariert: Extremflächen-GeoJSONs sind nun explizit als `FeatureCollection<MultiPolygon, ...>` typisiert; der TypeScript-Fehler `type: string` gegen `type: "Feature"` ist beseitigt.
- Flug-Events: sehr niedrige modell-diagnostische Wolkenuntergrenzen werden gegen `cloud_cover_low`, Sicht und Wettercode plausibilisiert; insbesondere wird `unter 100 ft AGL` bei guter Sicht ohne stützendes Low-Cloud-Signal nicht mehr ausgegeben.
- Amtliche Wetterwarnungen werden chronologisch nach Beginn, dann Ende sortiert; Warnstufe oder Provider-Reihenfolge übersteuern die Zeitachse nicht mehr.

## 0.9.66.14
- Flug-Event-Plausibilität für Wolkenuntergrenzen verbessert: diagnostische Angaben wie "unter 100 ft AGL" werden nur noch gezeigt, wenn Low-Cloud-, Sicht- oder Wettercode-Signale diese niedrige Untergrenze stützen; bei guter Sicht ohne Low-Cloud-Support bleibt die Angabe nun aus.
- Build-Fix für Extremflächen-GeoJSON: `buildExtremeOutlookContourGeoJson` liefert nun explizit typisierte GeoJSON-FeatureCollections/MultiPolygons, damit der Produktionsbuild nicht mehr an `Feature<Geometry, GeoJsonProperties>` scheitert.

- DACH-Extremwetterkarte: rechteckig wirkende >60-%-Teilflächen ursächlich behoben. Die bereits fachlich korrekten Konturringe werden nun als sauber verschachtelte GeoJSON-Multipolygone an MapLibre übergeben, statt Außenringe, Lochringe und innere Inseln implizit zu vermischen.
- Schraffur unter 60 % und ungeschraffte Kerne über 60 % bleiben auch bei geschachtelten Flächen korrekt getrennt; Inseln innerhalb einer Aussparung werden als eigene Fläche erhalten.
- Das Overlay aktualisiert seine GeoJSON-Quellen nun auch für leere Zwischenzustände sauber weiter. Veraltete Restgeometrien bleiben dadurch nicht auf der Karte stehen.
- Meteorologische Feldberechnung, Schwellen, Diagnostik und Worker-Fachlogik bleiben unverändert; fachlich ist dies ein Frontend-Fix.

## 0.9.66.13

- Fachlich falsche Umrechnung der stündlichen Niederschlagswahrscheinlichkeit in Niederschlagsminuten entfernt: 66 % werden nicht mehr als 40 Minuten Regen ausgegeben. Ohne zeitlich aufgelöste Teilintervalle zeigt MID keine Scheindauer.
- Sonnenscheindauer appweit nach der letzten Modell-, Wetterzwilling-, Lokal- und Radarstufe plausibilisiert: Nacht sowie mehrfach gestützter Nebel, geschlossene tiefe Bewölkung und stratiformer Niederschlag begrenzen widersprüchliche Werte; Wahrscheinlichkeit allein und Schauer-/Gewitterlagen tun dies ausdrücklich nicht.
- Fehlende Sonnenscheinwerte bleiben fehlend. Die 3-Stunden-Ansicht summiert die drei Stundenwerte korrekt und kann bis 180 Minuten anzeigen, statt einen Mittelwert auf 60 Minuten zu begrenzen.
- Aktuelle Ansicht, 15-Minuten-/Stundenprofil, Tagesaggregation, Events und native Widgets verwenden denselben Zeitkonsistenzvertrag. Für native Apple-Widgets ist der synchronisierte Worker erforderlich.

## 0.9.66.12

- Aktuelle Radar-Nowcast-Karte gegen Breitenüberlauf abgesichert: Summen- und Ensembleangaben ordnen sich abhängig von der tatsächlichen Kartenbreite neu an, statt Diagramm, Balken oder Info-Schaltfläche zu überdecken.
- Zeitmarken und die Jetzt-Markierung besitzen getrennte Lesebereiche; der komplette Nowcast-Rahmen bleibt innerhalb seiner Karte.
- Derselbe responsive Kartenvertrag gilt für Gewitter-, Starkregen- und Sturzflut-Zusatzfelder: lange Überschriften, Statusangaben, Ortszeilen, Fakten und Quellen brechen innerhalb der verfügbaren Breite um.

## 0.9.66.11

- Der lange Methodik- und Einschränkungstext unter der DACH-Gefahrenkarte wurde aus dem normalen Layout entfernt. Er ist vollständig über einen kompakten, appweit standardisierten Info-Button abrufbar.

## 0.9.66.10

- Kartenlegende des DACH-Extremwetter-Ausblicks deutlich verkleinert: I1–I4 stehen nun in einem zweispaltigen Raster mit kurzen Kartenbezeichnungen; die vollständigen fachlichen Benennungen bleiben in der ausführlichen Legende unterhalb der Karte erhalten.
- Der redundante Erklärungstext zu Farbe, Prozent und Deckkraft wurde aus der Kartenlegende entfernt. Die Schraffur wird dort nur noch kompakt als Wahrscheinlichkeit unter 60 % ausgewiesen.
- Länder-, Verwaltungs- und Verkehrsgrenzen werden über einen transparenten Karten-Kontextlayer oberhalb der Gefahrenflächen nachgezeichnet; der separate Beschriftungslayer bleibt als oberste Orientierungsebene erhalten.
- Wahrscheinlichkeitsband und Prozentanzeige verwenden dieselbe Rundungsbasis. Der Grenzfall eines intern knapp unter 10 % liegenden Signals kann daher nicht mehr gleichzeitig als `10 %` und `P0` erscheinen; angezeigt wird konsistent `10 % · P1`.

## 0.9.66.9

- Extremwetterkarte auf die kontrastreichere CARTO-Voyager-Orientierungskarte umgestellt. Beschriftungen bleiben als eigener Vordergrundlayer oberhalb der Gefahrenflächen; geringere Flächendeckkraft hält Länder- und Verwaltungsgrenzen besser erkennbar.
- MID-Prognosestufen fachlich an die DWD-Warnlogik angenähert, ohne eine amtliche Warnung vorzutäuschen: Wettergefahr, markante Wettergefahr, Unwetterpotenzial und extremes Unwetterpotenzial. Die frühere grüne Stufe entfällt zugunsten der gelb–orange–rot–violetten Gefahrenskala.
- Schraffur korrigiert: Sie folgt nun dem interpolierten Wahrscheinlichkeitsfeld innerhalb eines Gefahrengebiets und kennzeichnet exakt die Teilflächen unter 60 %, nicht mehr pauschal den Spitzenwert der gesamten zusammenhängenden Fläche. Legende und Kartenerklärung nennen die Bedeutung ausdrücklich.
- Dashboard-Reihenfolge erhält einen eigenen Änderungszeitpunkt. Neu hinzugekommene Sektionen werden einmalig verlustfrei migriert; die Migration wird gespeichert. Beim Start gewinnt ein neuerer synchroner Wert gegen einen veralteten IndexedDB-Spiegel, und der Geräteabgleich schützt die lokal neuere Sektionsreihenfolge vor älteren Remote-Ständen.

## 0.9.66.8

- DACH-Kartenbeschriftungen wurden als eigener Vordergrundlayer über die Gefahrenpolygone gelegt; Gültigkeits- und Popuptexte erhielten mehr Kontrast.
- Datumsübergreifende Vorhersagefenster nennen Start- und Enddatum. `Gefrierhöhe` heißt im Ausblick nun `Nullgradgrenze`.
- Sektionsänderungen werden funktional und synchron geschrieben; 0.9.66.9 ergänzt die notwendige Revisions- und Spiegelkonfliktbehandlung.

## 0.9.66.7

- Fehlende Wassertemperatur im Reiseplaner ursächlich behoben: Der bisherige Open-Meteo-/ERA5-Ocean-Aufruf lieferte real ausschließlich leere SST-Werte und wurde vollständig entfernt.
- Küstennahe Wassertemperaturen stammen nun aus dem täglichen NOAA-OISST-v2.1-Langzeitmittel der Normperiode 1991–2020. MID wählt für den konkreten Reisezeitraum die nächste vollständige 0,25°-Meereszelle innerhalb von 80 km; Binnenland erhält weiterhin keinen Ersatzwert.
- Neuer CORS-sicherer Workervertrag `travel-water-climate` mit strikt validiertem Schema, gezielten OPeNDAP-Zeit-/Raumausschnitten, Land-/Fehlwertfilter, Schaltjahrbehandlung und transparenter NOAA-Kennzeichnung in der Oberfläche.
- Alte leere SST-Caches werden durch `noaa-oisst-1991-2020:v5` invalidiert. Nur positive Ergebnisse werden langfristig gespeichert; Fehler und saubere Nichtverfügbarkeit bleiben wiederholbar. Ein alter Worker wird sichtbar diagnostiziert.
- Der konkrete Nutzerfall Iberostar Waves Creta Panorama, 18.–27.10.2026, wurde gegen den realen NOAA-Datensatz verifiziert: 22,66 °C am 3,6 km entfernten Meeresgitter. Professional-App und Worker müssen gemeinsam auf 0.9.66.7 aktualisiert werden.

## 0.9.66.6

- Wiederholt gleichförmige Sechseck-/Stützkernflächen im DACH-Extremwetter-Ausblick entfernt. Gefahrengebiete entstehen nun als Schwellenkonturen aus dem vollständigen räumlichen I1–I4-Wahrscheinlichkeitsfeld und nicht mehr als Puffer um ausschließlich sichtbare Stützpunkte.
- Der Datenvertrag liefert für jedes Rasterfeld auch Wahrscheinlichkeiten unterhalb der Darstellungsschwelle. Dadurch bestimmen reale Modellgradienten Lage, Ausrichtung, Ausdehnung und Rand der Gebiete; benachbarte Signale verschmelzen fachlich, stärkere Intensitätskerne können innerhalb größerer Flächen liegen.
- Die bestehenden Schwellen bleiben unverändert: 40 % in der Gesamtlage, 10 % je Einzelgefahr und 5 % für I4-Ausnahmesignale. Farbe, Deckkraft, Schraffur, appweite Einheiten, Mehrparameterdiagnostik und Trennung von amtlichen Warnungen bleiben erhalten.
- Worker und kostenloser Browser-Direktweg nutzen dieselbe erweiterte Feldberechnung ohne zusätzliche Modellabrufe. Ein älterer Worker bleibt kompatibel; die volle durch Unterschwellenwerte geformte Geometrie setzt Worker 0.9.66.6 oder den Direktweg voraus.
- Vollständig auf MID 0.9.66.5 aufgebaut: Die dort reparierte klimatologische Reise-Wassertemperatur und ihre SST-v4-Regression bleiben unverändert Bestandteil beider neuen Builds.

## 0.9.66.5

- Reiseplaner: klimatologische Wassertemperatur für Küstenziele robust gemacht. Alle acht ERA5-Ocean-Referenzjahre werden unabhängig geprüft; 1991 ist kein harter Gatekeeper mehr.
- Alte SST-Negativcaches werden durch den neuen v4-Cachevertrag invalidiert; negative/unvollständige Ergebnisse werden nicht mehr über Jahre gespeichert und können sich beim nächsten Abruf erholen.
- Küstenradius an das native ERA5-Ocean-0,5°-Raster angepasst (80 km statt 45 km), ohne binnenländische Ersatzwerte zu erfinden. Technische SST-Ausfälle werden im Reiseergebnis sichtbar, während die übrige Klimatologie verfügbar bleibt.
- Neue dynamische Regression prüft fehlendes Referenzjahr, grobe gültige Meereszelle und Wiederherstellung nach einem negativen SST-Versuch.

## 0.9.66.4

- Der DACH-Extremwetter-Ausblick bleibt auch bei ausgeschöpftem täglichem Cloudflare-Worker-Kontingent verfügbar: Nach dem bevorzugten Worker-Abruf berechnet die App dieselbe Prognose kostenfrei direkt im Browser aus DWD ICON-D2-EPS und ICON-D2.
- Die Direktberechnung wird automatisch aus derselben kanonischen Worker-Fachquelle erzeugt. Raster, Schwellen, Mehrparameterdiagnosen, Wahrscheinlichkeiten, Intensitäten, appweite Einheiten und Zeitdarstellung bleiben daher identisch.
- Ein persistenter lokaler Ausfallcache hält gültige Prognosen über App-Neustarts hinweg vor. Erkanntes Worker-Tageslimit wird bis zum Tageswechsel lokal vorgemerkt; aussichtslose Wiederholungsaufrufe entfallen.
- Datenweg und Ausfallstatus werden verständlich auf Deutsch ausgewiesen. Die pauschale DNS-/CORS-/Netzwerkdiagnose erscheint nicht mehr als Endzustand des Moduls.
- Worker-Fachcache und Antwortcache wurden auf 30 Minuten verlängert; Browser-Direktabruf und bestehende Open-Meteo-Schutzlogik verursachen keine zusätzlichen Kosten oder kostenpflichtigen Abhängigkeiten.

## 0.9.66.3

- Rechteckige DACH-Rasterzellen durch geglättete, georeferenzierte Isoplethenflächen ersetzt. Direkt und diagonal benachbarte Stützfelder gleicher Intensität verschmelzen zu unregelmäßigen, zusammenhängenden Gefahrengebieten; isolierte Signale erhalten abgerundete Konturen.
- Farbe bleibt an I1–I4 gekoppelt, Deckkraft und Prozentmarker bleiben an die Wahrscheinlichkeit gekoppelt. Gebiete unter 60 % werden zusätzlich dezent schraffiert; eine helle Außen- und farbige Innenkontur hält die Abgrenzung auf der Basiskarte lesbar.
- Auch die unsichtbaren Popup-Trefferflächen sind nicht mehr rechteckig. Kartenlegende und Erläuterung unterscheiden die geglättete Regionalprognose ausdrücklich von amtlichen Warnpolygonen und gemeindescharfen Aussagen.
- Keine Änderung an DACH-Raster, Modellen, meteorologischen Schwellen, Diagnosen, Datenquellen, Abrufzahl oder appweiten Einheiten. Professional-App und Worker sind gemeinsam auf 0.9.66.3 synchronisiert.

## 0.9.66.2

- DACH-Extremwetterkarte zeigt die Gefahrenfelder nun zuverlässig als flächig eingefärbtes Regionalraster: Intensität bestimmt die Farbe, Wahrscheinlichkeit die Deckkraft; klare farbgleiche Konturen erhalten die räumliche Abgrenzung.
- Die Flächen werden über ein eigenes, mit Zoom, Bewegung und Größenänderung synchronisiertes Karten-Canvas gerendert und hängen damit nicht mehr von der Sichtbarkeit des MapLibre-Vektorfülllayers ab.
- Prozent-/Intensitätsmarker sind auf höchstens sechs regionale Maxima begrenzt. Sie verdecken damit nicht mehr nahezu jede Rasterfläche, während alle betroffenen Felder und die vollständige Rangliste erhalten bleiben.
- Keine Änderung an DACH-Raster, Modellen, Schwellen, Wahrscheinlichkeiten, Intensitäten, Datenquellen oder Einheiten. Professional-App und Worker sind gemeinsam auf 0.9.66.2 synchronisiert.

## 0.9.66.1

- Startfehler des neuen DACH-Extremwetter-Ausblicks behoben: Dezimalwerte für Niederschlag, Schnee, Glatteis, Schichtung, Scherung und Aufwind verwenden nun die korrekte Reihenfolge der appweiten Nachkommastellenparameter.
- Der zentrale deutsche Zahlenformatierer normalisiert ungültige oder vertauschte Nachkommastellenbereiche defensiv. Ein einzelner fehlerhafter Aufruf kann MID dadurch nicht mehr mit `minimumFractionDigits > maximumFractionDigits` am Start hindern.
- Keine Änderung an Modellen, Schwellen, Wahrscheinlichkeiten, Intensitäten, Datenquellen oder appweiten Einheiten. Professional-App und Worker sind gemeinsam auf 0.9.66.1 synchronisiert.

## 0.9.66.0

- Neuer „MID Extremwetter-Ausblick · DACH“ als eigener, konfigurierbarer Hauptbereich direkt nach den Warnungen: Gesamtlage sowie Gewitter, Stark-/Dauerregen, Sturm, Schnee und Glätte/Eisregen für 0–6, +6–12, +12–24 und +24–48 Stunden.
- Eigene probabilistische MID-Prognose aus DWD ICON-D2-EPS und deterministischer ICON-D2-Diagnostik; amtliche Warnungen bleiben fachlich und optisch getrennt.
- Feste Wahrscheinlichkeitsklassen P1–P4 und Wirkungsintensitäten I1–I4 mit transparenten Schwellen. Die Gesamtkarte blendet unter 40 % aus, Einzelgefahren unter 10 %; mögliche I4-Extremereignisse werden vorsorglich ab 5 % gezeigt.
- Gewitterbewertung verwendet CAPE nicht allein, sondern zusammen mit CIN, 850–500-hPa-Temperaturgradient, 700-hPa-Feuchte, vektorieller Scherung, Aufwind/LPI, Niederschlag und Gefrierhöhe; Hagel-, Downburst- und Starkregenpotenzial werden als Umfeldsignale ausgewiesen.
- Regen wird über 1-/6-/24-h-Akkumulationen, Sturm über EPS-Böen und höhenabhängige Exposition, Schnee über 6-/24-h-Neuschnee und Höhenzonen sowie Eisregen über Niederschlags-, Feuchttemperatur-, Wettercode-, Dauer- und Glatteisindikatoren bewertet.
- Übersichtliche MapLibre-DACH-Karte mit Intensitätsfarben, Prozentmarken, Liste der stärksten Regionen, Detailparametern, barrierefreier Textlegende, Mobilansicht, Fehler-/Stale-Zustand und manueller Aktualisierung.
- Appweite Vorgaben werden übernommen: Wind in der gewählten MID-Einheit, Niederschlag in mm, Schnee in cm, Höhe in m sowie Zeitangaben gemäß Lokal-/Z-Zeit-Einstellung.

## 0.9.65.16

- Kurzfrist-Wetterprofil: Windrichtungspfeile deutlich schlanker dimensioniert, damit sie die Windkurve nicht mehr optisch überdecken.
- Pfeile erhalten eine schmale, kontrastierende Kontur (Halo) hinter einem dünnen farbigen Kern; dadurch bleiben Richtung und Pfeilspitze in Hell- und Dunkelmodus auch bei Kurvenkreuzungen klar erkennbar.
- Keine meteorologische Daten-, Warn-, Forecast- oder Worker-Fachlogik geändert.

## 0.9.65.15

- Streckenbriefing: Höheneingabe mit expliziter Wahl zwischen FL und ft AGL repariert; keine Einheitssprünge während der Eingabe.
- Unter FL050 sind 100-ft-genaue AGL-Eingaben möglich; ab FL050 wird erst beim Commit auf 10-FL-Schritte gerundet.
- Neue Regression schützt die Flugniveau-Eingabe.


## 0.9.65.14

- Reiseplaner: historische Wassertemperatur auf die korrekte Open-Meteo Marine API / ERA5-Ocean umgestellt; fehlerhaften SST-Archive-Pfad entfernt und Wasserklima-Cache auf v3 migriert.
# v0.9.65.13

- Reiseplaner: Wassertemperatur wird bei Küstenzielen nicht mehr über einen sehr großen 30-Jahres-Stundenabruf nachgeladen. Stattdessen nutzt MID kleine, exakt auf die Kalendertage des geplanten Reisezeitraums begrenzte historische ERA5-SST-Ausschnitte aus gleichmäßig über 1991–2020 verteilten Referenzjahren. Der alte v1-Wasserklimacache wird invalidiert.
- Das erste Reiseergebnis wartet auf die klimatologische Wassertemperatur-Auswertung, sodass die Wassertemperatur-Kachel bei erfolgreicher Küstenprüfung direkt mit dem Ergebnis erscheint statt erst nachträglich. Aktuelle Marinewerte bleiben ausgeschlossen.
- Event-Center: Sonnenscheindauer wird wieder aus der kompakten Übersichtszeile entfernt. Die Übersicht bleibt bei Temperatur, Niederschlag/PoP, Wind und Böen.
- Sunshine-Duration-Contract präzisiert: stündliche Event-Zeitfenster zeigen Sonnenscheindauer in Minuten; die über ein mehrstündiges Event aggregierte Sonnenscheindauer erscheint in Detail-/Ratansichten in Stunden.
- Neue Regression schützt Reise-SST-Sichtbarkeit, Cachemigration und Event-Sunshine-Einheiten.

# v0.9.65.12

- Automatische Warnlage: laufende Stundenwarnungen werden nicht mehr nach der halben Stunde durch den nächstgelegenen Folgestundenwert verdrängt.
- Warnhorizont verwendet jetzt den letzten bereits begonnenen Stundenwert (`epoch <= jetzt`); Wechsel erst zum tatsächlichen Beginn der nächsten Stunde.
- Neue Regression für Warnzustände an Stunden-/Halbstundengrenzen.

# v0.9.65.11

- Aktuelle Niederschlagskarte: Bei trockenem Radar-/Modellkonsens und höchstens 5 % Rest-PoP wird kein künstlicher 5-%-Wert mehr angezeigt, sondern 0 %. Echte niedrige Prognosewahrscheinlichkeiten außerhalb dieses klar trockenen Nowcast-Falls bleiben erhalten.
- Reisewetter: erwartete Niederschlagstage werden in der Oberfläche und im Narrativ auf ganze Tage gerundet; die interne kontinuierliche Erwartung bleibt für Bewertung und Optimierung erhalten.
- Küstenreiseziele erhalten eine klimatologische Wassertemperatur für den tatsächlich gewählten Reisezeitraum. MID bildet dazu aus historischen ERA5-Stundenwerten der Meeresoberflächentemperatur 1991–2020 Tagesklimatologien am nächsten geeigneten Meeresgitter; aktuelle Marinewerte werden dafür nicht verwendet.
- Reisebeginn, Reiseende und Reisedauer bleiben lokal gespeichert; nach Änderung des Startdatums kann das Enddatum weder per Picker noch per Zustandslogik vor dem Start liegen.
- Der aktuelle automatische Warnkopf bleibt strikt gültigkeitszeitbezogen: Ein erst künftig beginnendes Warnfenster ist bis zu seinem `validFrom` keine aktuelle Warnlage.
- Neue Regression schützt trockenen Nowcast, Reise-SST, ganze Niederschlagstage und den zeitstrengen Warnkopf; Professional- und Worker-Version sind synchron.

# v0.9.65.10

- Appweiter Niederschlagswahrscheinlichkeitsvertrag korrigiert: Es gibt keine künstliche 5-%-Untergrenze mehr. 0 %, 1 %, 2 %, 3 % und 4 % bleiben als echte Modell-/Fusionswerte erhalten und werden entsprechend angezeigt.
- Kurzfristfusion und 24-h-Wetterprofil übernehmen die kanonische PoP unverfälscht; Darstellungslogik darf niedrige Wahrscheinlichkeiten weder anheben noch als Niederschlagssignal erfinden.
- Prognose-Kompass und Ensemble-Kompass verwenden eine gemeinsame Trockenheitsformulierung: Bei höchstens 0,1 mm im betrachteten Folgeabschnitt und maximal 5 % PoP lautet die Tendenz eindeutig „trocken“ statt „überwiegend trocken“.
- Geringes, aber reales Restniederschlagsrisiko behält die abgestufte Formulierung „überwiegend trocken“; erhöhte Regenneigung und wechselhaftes Risiko bleiben unverändert abgestuft.
- Neue Regression schützt Nullboden und Wortlaut appweit; Professional-/Worker-Versionen bleiben synchron.

# v0.9.65.6

- Das rollierende 24-h-Wetterprofil ergänzt zwischen Wind und Wolken eine sehr kompakte Luftdruckspur mit dynamischer hPa-Skala, Verlaufslinie und selektiertem Wert. Die Gesamt-SVG-Höhe bleibt unverändert.
- Wetter-Hazards werden aus derselben finalen Stundenreihe und mit derselben `summarizeDwdWarnings(..., 24)`-Logik wie die appweite Warnübersicht abgeleitet. 1 h/3 h verdichtet nur die Anzeige.
- Hazardfarben sind an die zentralen DWD-Stufen gekoppelt; warnungsfreie Stunden werden grün dargestellt.
- Keine zusätzlichen API-, Radar-, Cache- oder KV-Zugriffe. Worker-Fachlogik unverändert; Worker nur auf 0.9.65.6 synchronisiert.

# v0.9.65.5

- Appweiter Sunshine-Duration-Contract: 15-Minuten-Werte bilden vollständige Stunden; vollständige lokale Stunden bilden den Kalendertag. Daily bleibt Fallback und Qualitätsreferenz.
- Physikalische Grenzen gelten zentral: höchstens 15 min je Viertelstunde, 60 min je Stunde und je Tag höchstens die astronomische Zeit zwischen Sonnenauf- und -untergang. Fehlende Werte bleiben fehlend statt 0.
- Tageskacheln, Detailansicht, 7 Tage, 14 Tage/Ensemble, Events/Aktivitäten sowie Web- und Apple-Widgets verwenden dieselbe kanonische Sonnenscheindauer. Stündliche Darstellungen zeigen Minuten, Tages-/Ensemblewerte Stunden.
- Best Match bleibt in der Ensembleansicht der Hauptwert; P10–P90 zeigt die Modellbandbreite. Tooltips verwenden die vollständige Bezeichnung „Sonnenscheindauer“.
- Der Worker-Widgetfeed liefert optionale Sonnenscheinwerte mit Intervall-/Tageslichtbegrenzung. Professional-App und Worker bilden gemeinsam Release 0.9.65.5.

# v0.9.65.4

- Der Ortskopf verwendet die freigegebene Compact-Variante: aktuelles Wetter, Tmin/Tmax, Niederschlagswahrscheinlichkeit, Radarkurzlage und Datenbasis sind in einer gemeinsamen responsiven Karte zusammengeführt; der Detailschalter sitzt platzsparend in der Quellenzeile.
- Lokale Gewitter-/Starker-Schauer- und Starkregen-/Sturzflutkarten sind generische Compact-Disclosures. Alle bisherigen Status-, Orts-, Zugbahn-, Fakten-, technischen Detail- und Quelleninformationen bleiben erreichbar.
- Die automatische Warnübersicht ist eine gemeinsame, nach Tagen gruppierte Karte. Zeitfenster öffnen ihre Details unmittelbar unter der jeweiligen Zeile und kehren beim Zuklappen zur kompakten Ansicht zurück; DWD-Stufenfarben und Kennwerte bleiben erhalten.
- Amtliche CAP-Warnungen sind optisch direkt angebunden, ohne Textverlust: Originalbeschreibung, Handlungsanweisung, Gebiet, Sprache, Quelle und Gültigkeit werden weiterhin vollständig dargestellt.
- Eigene Hoch-/Querformatregeln verhindern abgeschnittene Information. Wetter-, Radar-, Warn- und KV-Abfragebudgets bleiben unverändert; Professional-App und Worker bilden gemeinsam Release 0.9.65.4.

# v0.9.65.3

- Das Wetterprofil verwendet ein exakt ab der aktuellen Zeit laufendes 24-h-Fenster; die Ansicht aktualisiert den Zeitanker automatisch und bietet eine persistente 1-h-/3-h-Darstellungswahl, ohne die stündlichen Rohdaten zu verändern.
- Nachtstunden, Tageswechsel sowie Sonnenauf- und -untergang werden dezent, aber eindeutig markiert. Eigene vertikale Bahnen und responsive Hoch-/Querformatlayouts verhindern das Überdecken von Zeittexten, Wettersymbolen, Pfeilen und Messwerten.
- Temperatur, gefühlte Temperatur und Taupunkt stehen gemeinsam auf einer Skala; das thermische Empfinden verwendet zentral dieselben DWD-Farben wie die übrige App.
- Niederschlagsmenge und -wahrscheinlichkeit besitzen getrennte Balken-/Kurvendarstellungen. Hohe, mittelhohe und tiefe Bewölkung bleibt mit eigenständigen 0–100-%-Zellen und selektierten Prozentwerten klar erkennbar.
- Sämtliche Warngebiets-, KV-/Sync-, Info-Button- und ERA5-Seamless-Reiseplaneränderungen aus v0.9.64.8 bis v0.9.65.2 bleiben erhalten. Der Open-Meteo-Audit ergänzt lediglich den aktuellen UKMO-Seamless-Fallback; zusätzliche Kernabfragen oder KV-Schreibvorgänge entstehen nicht.

# v0.9.65.2

- Reiseplaner-Klimatologie von einem fachlich unvollständigen ERA5-Land-Basisabruf auf Open-Meteo ERA5-Seamless umgestellt: ERA5-Land liefert die feinere Landtemperatur, ERA5 ergänzt Niederschlag, Solarstrahlung/Sonnenschein und Wind; optionale historische Schneehöhe bleibt separat auf ERA5-Land.
- Reise-Klimacache auf v3 migriert, damit bereits lokal gespeicherte fehlerhafte 0-h-/0-Wind-Datensätze nicht wiederverwendet werden.
- Nullwerte historischer API-Felder werden nicht länger per `Number(null)` als meteorologische 0 interpretiert; Plausibilitätsguards verwerfen unvollständige Reihen sowie unmögliche durchgehende 0-h-Sonnenschein- bzw. 0-Wind-Serien statt daraus Texte wie „eher sonnenarm“ abzuleiten.
- Appweiter Einheitenvertrag auf den Reiseplaner übertragen: Wind wird intern wie im übrigen MID in Knoten geführt, Ausgabe und Wind-Grenzwerte folgen der globalen Auswahl kt/km/h/m/s/mph; Temperatur bleibt °C, Niederschlag mm und Schnee cm.
- Quellen-/Methodentexte auf ERA5-Seamless standardisiert und irreführende reine ERA5-Land-/10-km-Aussagen entfernt. Worker-Fachlogik bleibt unverändert.

# v0.9.65.1

- Installations-Hotfix für die drei in v0.9.65.0 aufgedeckten Regressionen.
- Benannte Worker-Testexports für synoptische Richtungsprüfung und Gewitter-Push-Konsistenz wiederhergestellt, ohne Produktionslogik zu verändern.
- 36-px-Touchvertrag bleibt erhalten, wird bei Info-Buttons aber ausschließlich über eine unsichtbare Trefferfläche erfüllt; sichtbare Buttons bleiben kompakt.
- Sämtliche KV-/Sync-/Wetterzwilling-Einsparungen aus v0.9.65.0 bleiben unverändert bestehen.

# v0.9.65.0

- KV-Scheduler-Index reduziert reguläre `list()`-Operationen bei unveränderter 5-Minuten-Push-Kadenz auf vier automatische Reconciliations pro Tag plus Bootstrap/Recovery.
- Wetterzwilling speichert fachlich identische Beobachtungs-/Capture-/Referenzstände nicht erneut und bündelt Cloud-Vollarchive über zehn Minuten.
- Geräte-Sync erhält SHA-256-Inhaltssignaturen und 3-s-Burst-Deduplizierung; identische portable Zustände bleiben write-frei.
- Touch-Regressionsfix: sichtbare Info-Buttons wieder kompakt, Trefferfläche weiterhin groß und layoutneutral.
- Push-Unsubscribe-Routerpfad ist nun vollständig implementiert und bereinigt den Scheduler-Index.

# v0.9.63.1

- CI-Kompatibilität: die Flugbriefing- und Wartungsvertragsregressionen werden unter dem festgelegten Node.js 22.16.0 über das projektlokale TypeScript transpiliert statt `.ts`-Dateien direkt zu importieren.
- Wartungsregressionen: isolierte Forecast-Fusion-Tests berücksichtigen den gemeinsamen Cachevertrag; historische Persistenz- und Radar-Zeitpfeilprüfungen validieren die ausgelagerten Nutzerverträge statt frühere Quelltextformen.
- Keine Änderung an Wetterzwilling, Modellfusion, Radar-/Nowcast-Fachlogik, Kompositdarstellung, Persistenzsemantik oder Worker-Datenquellen gegenüber v0.9.63.0.

# v0.9.60.2

- CI/TypeScript: TS7006 im eventbezogenen Ensemble-Frischecallback dauerhaft in der kanonischen weather-Teilquelle behoben.
- Regression schützt, dass `maintain:aggregates` die Typisierung nicht wieder entfernt.

# v0.9.60.1

- Wetterzwilling: stabile Modellfamilien, gruppengeteilte Modellbudgets und effektive Stichprobengröße aus eindeutigen Zieltagen.
- P0: abgeleitete MID-Fusionen aus dem Modelllernen ausgeschlossen und tägliche Niederschlagswahrscheinlichkeit semantisch vereinheitlicht.
- P1: tatsächliche Lauf-Frische, horizonweise Variantenwahl und MeteoSwiss-CH1/CH2-Reichweiten konsolidiert.
- P2: Auflösungsprior gedämpft/parameterspezifisch; Mean/Spread klar von nativer Member-PoP getrennt.

# v0.9.59.2

- Flugmeteorologie: Cross Section als nicht-grafisches Streckenbriefing für 2–8 Flugplätze reaktiviert; Route, Flight Level sowie Start-/Landezeiten steuern orts- und zeitbezogene Gefahrenhinweise.
- Flugstrecke: Modellprofil-Diagnosen für Vereisung, Windscherung/Turbulenz, Konvektion, Höhenwind, Niederschlag, Sicht und Wolkenuntergrenze plus verfügbare amtliche/operative Signale an Start, En-route und Ziel.
- Kompositbild: Zeitpfeil verwendet primär eine wolkengewichtete vertikale Schwerpunktströmung aus dem 950–300-hPa-Profil; Radar-/KONRAD-Verlagerung dient als Plausibilisierung/Fallback.
- Kompositbild: Bewegungsachse und Pfeilspitze werden explizit in eigenen Leaflet/MapLibre-Kompatibilitätspane gerendert, damit der Zeitpfeil oberhalb der Wetter-/Referenzlayer sichtbar bleibt.

# v0.9.58.4

- Ortsfavoriten-Reihenfolge erhält eine eigene persistente Order-Revision und wird bei Appstart/Shadow-Recovery wiederhergestellt.
- Geräte-Sync migriert die lokale Reihenfolge vor dem ersten Pull und merged konkurrierende Reihenfolgen nach eigener Revision, ohne Favoriten zu verlieren.

# v0.9.58.3

- Regression-Hardening: zwei historische Radar-/Zeitpfeiltests auf den aktuellen Schwerpunktströmungs-Vertrag migriert.
- Keine funktionale Änderung an Zeitpfeil, Radar-Nowcast oder Workerlogik.

# v0.9.58.2

- TypeScript-Fix für den neuen Komposit-Zeitpfeil: `CompatBounds` stellt nun Südwest-/Nordost-Ecken typisiert bereit.
- Keine fachliche Änderung an Zeitpfeil, Schwerpunktströmung oder Radar-/Nowcast-Logik.
- Neue Regression gegen erneute TS2339-Fehler im MapLibre-Kompatibilitätsadapter.

# v0.9.58.1

- Komposit-Zeitpfeil vollständig neu aufgebaut: lange viewportbezogene Achse, kleine nordreferenzierte Zielpfeilspitze am gewählten Ort, zwei dezente Zeitmarken und Schwerpunktströmung aus der OPERA-Mehrframe-Regressionsbewegung; der frühere 90°-Darstellungsversatz der Pfeilspitze ist ausgeschlossen.
- Kurzfrist-Nebelrisiko verschärft: ein 2-K-Spread allein erzeugt tagsüber/bei guter Sicht kein erhöhtes Nebelrisiko; echte Sichtbeschränkung, WMO-Nebelcode und schwachwindige Nachtsättigung bleiben wirksam.
- lucide-react kontrolliert auf 1.31.0 aktualisiert; React 19, Vite/plugin-react 6 und TypeScript 7 bleiben zurückgestellt.

# v0.9.58.0

- Release-Pipeline gegen GitHub-Codeload-429 gehärtet: configure-pages entfernt; Pages-Deployment vom Release-Build entkoppelt und mit drei frischen Runner-Versuchen sowie 75/180-s-Backoff abgesichert.
- Pages-Artefakte je Versuch eindeutig benannt; fehlgeschlagene Versuche 1/2 sind recoverable, Versuch 3 bleibt harter Fehler.
- Stable-Finalisierung läuft erst nach tatsächlich erfolgreichem Pages-Versuch; Status-API bleibt 429/5xx-resilient.
- Manueller Stable-Deploy erhält denselben Pages-Retry-Vertrag.

# v0.9.57.4

- Installer: Release-ZIP wird vor dem Entpacken auf Dateigröße, SHA-256, ZIP-Signatur und CRC-Integrität geprüft.
- Wartung: kanonische Worker-Teilquelle auf denselben Release-Stand synchronisiert, damit `maintain:aggregates` die Worker-Version nicht zurückstuft.
- Regression: Installer-ZIP-Schutz wird sowohl im Workflow-Patch als auch in der kanonischen Workflowquelle geprüft.

# v0.9.57.3

- Stable-Release-Abschluss gegen temporäre GitHub-API-/Transport-5xx gehärtet: harter mid-stable-SHA-Vertrag mit Retry sowie Quality-Status mit fünf Backoff-Versuchen.
- Ein ausschließlich temporärer GitHub-Status-API-5xx markiert einen bereits gebauten, deployten und SHA-verifizierten Release nicht mehr fälschlich als fehlgeschlagen; 4xx/Auth-Fehler und SHA-Abweichungen bleiben harte Fehler.

# v0.9.57.2

- Installer gegen paralleles Weiterlaufen von `main` gehärtet: eventgebundener Checkout, sicherer Fetch/Rebase nur für `.github`, Abbruch bei neueren fachlichen Änderungen und Push-Retry ohne Force-Push.

# v0.9.57.1

- Regressionsverträge für den finalen Komposit-Zeitpfeil auf lange sichtbare Achse, Zielspitze am Standort und reduzierte Zeitlabels aktualisiert.
- Flug-Event-Einheitenregression auf die amtliche METAR/TAF-Priorisierung vor der Modell-Diagnose aktualisiert.
- Keine fachliche Rücknahme der Funktionen aus v0.9.57.0.

# v0.9.57.0

- Kompositbild auf einen einzelnen langen Zeitpfeil mit Zielspitze am gewählten Ort umgestellt.
- Lucide React auf 1.30.0 und Recharts kontrolliert auf 3.10.1 aktualisiert.
- GitHub Actions checkout auf 7.0.1 und setup-node auf 7.0.0 angehoben und SHA-gepinnt.
- React 19, TypeScript 7 und Vite/plugin-react 8/6 bleiben zurückgestellt.

# v0.9.56.0

- Funktionsneutrales Wartungsrelease: 7-Tage-Trend und App-Laufzeitcaches aus `App.tsx` ausgelagert.
- Styles, `weather.ts` und Worker besitzen nun kanonische, kleinere Quellfragmente; die bisherigen Aggregate werden vor Typecheck/Regression bytegleich generiert, sodass CSS-Kaskade, Weather-Importoberfläche, Cloudflare-Deployment und bestehende Verträge unverändert bleiben.
- Veraltete Regressionen für heutigen Niederschlag und die neue einzelne Radar-Zugbahn auf den aktuellen Vertrag migriert.
- Keine Datenquellen-, UI-, Persistenz- oder Wetterlogikänderung.

# v0.9.55.4

- 7-Tage-Trend: Der aktuelle Kalendertag berücksichtigt Niederschlag aus 00–24 Uhr, auch wenn Niederschlagsphasen bereits vor „Jetzt“ liegen.
- Für die Wettercharakteristik bleibt der verbleibende Tagesverlauf maßgeblich; vergangener Tagesniederschlag wird jedoch nicht mehr aus der Trendklassifikation entfernt.

# v0.9.55.3

- Flug-Events verwenden konsistente flugmeteorologische Einheiten: Wind/Böen folgen der gewählten MID-Windeinheit, Sicht wird in m bzw. km dargestellt und Wolkenuntergrenzen in ft AGL.
- Die kompakte Flug-Event-Übersicht zeigt Sicht und Wolkenuntergrenze statt des für Flugplanung weniger relevanten UVI-Felds.
- Amtliche METAR/TAF-Wind-, Sicht- und Ceiling-Signale liefern zusätzlich strukturierte Rohwerte; Sicht wird nicht mehr in Statute Miles ausgegeben.

# v0.9.55.2

- Kompositbild: Zugpfeile in „Zugbahn“ umbenannt.
- Deutlicher Zielpfeil mit lesbarer Achsenbeschriftung ergänzt; Pfeil wird nun oberhalb des Standortmarkers gerendert.
- Zugrichtung gegen das aktuelle Echofeld verifiziert und bei deutlichen Abweichungen aus den lokalen Bewegungsankern korrigiert bzw. gemischt.

# v0.9.55.1

- Produktions-Typecheck des Kompositbilds repariert: ungenutzte Altpfade `motionTimeMarkers`/`displayMotionAnchors` samt ausschließlich dafür benötigter Hilfstypen entfernt.
- Die neue einzelne Zugspur aus v0.9.55.0 bleibt unverändert aktiv: Pfeilspitze am gewählten Ort, Zeitmarken stromaufwärts entgegen der Zugrichtung.
- Neue Buildfix-Regression verhindert künftig die Rückkehr toter Motion-Altpfade.
- Keine funktionale Worker-Änderung; Worker nur versionssynchronisiert.

# v0.9.55.0

- 14-Tage-Modellstand zeigt Ensemblemodelle und deterministische Best-Match-/Kontrollmodelle getrennt; JMA MSM/Seamless/GSM werden dort fachlich korrekt als deterministische Modelle statt als nicht existentes JMA-Ensemble geführt.
- Ensemble-/Mean-Spread-Katalog app-weit vervollständigt: zusätzliche DWD-ICON-EPS- und GEFS-Mean/Spread-Reservevarianten sowie regionale MeteoSwiss-ICON-CH-Ensembles in der alpinen Schneefallgrenzenanalyse.
- Kompositbild besitzt eine oberste transparente Referenzkartenebene für Grenzen und Ortsnamen mit eigenem Deckkraftregler.
- Das bisherige Mehrpfeilfeld wurde durch genau eine Zugspur ersetzt: Pfeilspitze am gewählten Ort, Zeitlabels entgegen der Zugrichtung stromaufwärts.
- Die Stable-/Dependency-/Recharts-Hardening-Verträge aus v0.9.53.57 und die Open-Meteo-Auditverträge aus v0.9.54.x bleiben Bestandteil der Regression.

# v0.9.54.2

- CI-Regressionsfix für den in v0.9.54.1 übernommenen Vendor-Chunking-Vertrag: `test-performance-budget.mjs` akzeptiert jetzt ausschließlich die auditierte `ReactVendor`-/`ChartsVendor`-Aufteilung.
- Generisches oder zusätzliches manuelles Vendor-Chunking bleibt gesperrt; MapLibre darf weiterhin nicht manuell gechunkt werden und behält seine bestehende Lazy-Importgrenze.
- Keine Änderung an Open-Meteo-, AQI-, JMA-, Météo-France-, Ensemble-, Favoriten-, Event- oder Worker-Wetterlogik.

# v0.9.54.1

- Audit-Nachtrag aus v0.9.53.57 übernommen: React sowie Recharts/D3 werden als stabile Vendor-Chunks vom Hauptbundle getrennt; die bestehende MapLibre-Lazy-Grenze bleibt erhalten.
- Dependency-Audit sichert den vollständigen npm-Auditbericht auch bei Befund für 30 Tage als Artefakt; das High-Severity-Gate bleibt hart.
- Release-CI verifiziert nach Pages-Deployment den tatsächlich veröffentlichten `mid-stable`-SHA und setzt darauf `MID / stable-release-quality`.
- Recharts-Wartungsvertrag verlangt weiterhin einen exakt reproduzierbaren 3.x-Lockstand, blockiert kompatible 3.x-Minor-/Patch-Kandidaten aber nicht mehr durch einen historischen 3.8.1-Literal.
- Eigene Stable-Hardening-Regression schützt Vendor-Chunking, Audit-Artefakt, Stable-SHA-Status und Recharts-3-Kompatibilitätsvertrag dauerhaft.
- Historischer Buildstabilitätsvertrag akzeptiert nur die auditierte React-/Charts-Aufteilung; generisches Vendor-Chunking und erzwungenes MapLibre-Chunking bleiben verboten.

# v0.9.54.0

- Open-Meteo-Audit 17.08.2026 übernommen: AIFS-Europe-Ensemble mit Cloud-/Niederschlags-Plausibilitätsgate.
- Météo-France-Migrationsvertrag aktualisiert: AROME/ARPEGE, Seamless, 15-Minuten-Varianten sowie Niederschlag/Wind/Bewölkung/Sonnenschein regressionsgeschützt.
- JMA MSM/GSM/Seamless ergänzt; japanischer Meteogramm-Best-Match-, Höhen- und Druckniveaupfad vereinheitlicht.
- EU-AQI auf Open-Meteo-Gesamt-/Teilindizes erweitert; stündliche PM-/AQI-Reihen werden mitgeführt, Konzentrationsschwellen bleiben Fallback.
- API-Regression für getrennte 6-h-Min/Max-Aggregationen, Mondfelder und DWD-ICON-Begleitverträge ergänzt.

# v0.9.53.56

- Niederschlagswarnungen: einstellbare Vorwarnzeit (15–120 min) und Mindestmenge (0,1–5,0 mm); keine verspätete Beginnwarnung erst bei bereits laufendem Niederschlag. Bestehende Meldungspause bleibt verbindlich.
- Aktuelle Niederschlagswahrscheinlichkeit: textlicher Hinweis auf erwarteten Niederschlag jenseits des betrachteten +2-h-Nowcastfensters.

## 0.9.53.54

- Netatmo OAuth-Rücksprung auf iOS/PWA gehärtet: Callback bleibt als sichtbare Erfolgs-/Fehlerseite stehen statt sofort zur App zurückzuspringen.
- Letztes OAuth-Ergebnis wird 30 Minuten serverseitig je MID-Verbindung gespeichert und vom Stationsstatus zurückgegeben; Fehler gehen beim Wechsel zwischen Safari und installierter PWA nicht mehr verloren.
- Callback-Information wird zusätzlich in sessionStorage und localStorage gespiegelt.

## 0.9.53.53

- Netatmo OAuth auf iOS/PWA: Autorisierungs-URL wird vor dem Nutzertap vorbereitet und in Standalone-PWAs direkt in einem externen Browserkontext geöffnet.
- OAuth-Callback transportiert die `connectionId`, damit die Verbindung auch bei getrennten Safari-/PWA-Storage-Kontexten korrekt zugeordnet wird.
- Rückkehr aus dem OAuth-Browser aktualisiert den Netatmo-Status automatisch.

## 0.9.53.52

- Netatmo-OAuth-Start für iOS/PWA synchronisiert: der Nutzer-Tap navigiert ohne vorgeschaltetes `await` unmittelbar zum Worker; der bereits geladene Worker-Status entscheidet vor dem Tap über die Verfügbarkeit.
- Jeder OAuth-Versuch erhält einen eindeutigen Cache-Buster; Worker- und Callback-302-Antworten tragen explizit `no-store/no-cache`, damit Safari bzw. Edge keine frühere Fehlweiterleitung wiederverwenden.
- OAuth-Rückkehr wird vor dem Öffnen der Einstellungen in `sessionStorage` gesichert; Fehler/Erfolg gehen dadurch auch bei verzögertem Mount des Stationsbereichs nicht verloren.
- Netatmo-Status liefert die tatsächlich laufende Worker-Version zur sichtbaren Diagnose in den Einstellungen.

## 0.9.53.51

- Netatmo OAuth auf browserfeste direkte Worker-Weiterleitung (HTTP 302) umgestellt; damit wird die externe Netatmo-Seite insbesondere auf iOS/PWA nicht mehr von asynchronen UI-Schritten abhängig.
- OAuth-Fehler werden nach dem Rücksprung mit Phase und sanitisiertem Netatmo-Fehlertext sichtbar statt still durch den Status-Refresh überschrieben.
- Neue Regression für Direkt-Redirect und Callback-Fehlerdiagnose.

# v0.9.53.47

- CI-Regressionsvertrag gehärtet: `test-mid-followups-095323.mjs` prüft Default-Closed-Hauptmodule jetzt mengenbasiert statt über eine fragile feste Array-Reihenfolge.
- Veraltete Sensor-Deaktivierungsannahme aus `test-weather-twin-stages-0800.mjs` entfernt; eigene Sensoren sind seit der reaktivierten Stations-/Lüftungsintegration wieder zulässig und werden durch dedizierte Funktionsregressionen abgesichert.
- Keine Änderung an Wetter-, OAuth-, Stations-, Wetterzwilling- oder Lüftungslogik.

# v0.9.53.46

- GitHub-Actions-Regressionsfix: zwei veraltete Testverträge an die bereits beabsichtigten Änderungen aus v0.9.53.45 angepasst.
- `test-mid-followups-095323.mjs` akzeptiert den neuen default-closed Hauptmodulvertrag mit vorangestelltem Lüftungsassistenten.
- `test-weather-twin-stages-0800.mjs` erwartet wieder die bewusst reaktivierte private Sensorintegration statt des historischen Deaktivierungszustands.
- Keine funktionale Änderung an Wetter-, Stations-, OAuth-, Wetterzwilling- oder Lüftungslogik.

# v0.9.53.45

- Eigene Wetterstationen wieder aktiviert: Netatmo wird per OAuth/Login statt manueller Token-Eingabe verbunden; Tokens bleiben Worker-seitig verschlüsselt.
- Netatmo-Innenraumsensoren werden als Räume erkannt und liefern Temperatur, Feuchte und CO₂ für den neuen Lüftungsassistenten.
- Neuer Lüftungsassistent Stufe 1: pro Raum erlaubte Zeiten, absolute-Feuchte-/Kühlpotenzial, CO₂-Dringlichkeit sowie Wetter-Sicherheitsprüfung aus Niederschlag, Gewitter und Böen.
- Lüftungsfenster erscheinen im Dashboard und können über den bestehenden Web-Push angekündigt werden. Stufe 1 steuert ausdrücklich keine Fenster, Lüfter oder Anlagen.
- Plausible private Außenmessungen können wieder „Aktuelles Wetter“ ergänzen und in die lokale Wetterzwilling-Verifikation einfließen.

# MID v0.9.53.36

- Ensemble-Modellauswahl success-driven: fehlgeschlagene Quellen und nicht konfigurierte optionale Regionaladapter verbrauchen keinen Erfolgsplatz.
- ECMWF IFS/AIFS ENS verwenden in Europa einen Native-Europe→Global-Fallback innerhalb derselben Variantengruppe, ohne Doppelgewichtung.
- Modellstanddiagnose zeigt numerisch aktive Modelle auch bei fehlenden Laufmetadaten und kennzeichnet Aktiv, Fallback, Nicht verfügbar, Adapter fehlt und Reserve.
- Open-Meteo Mean/Spread-Reserve um NOAA AIGEFS, UKMO Global/UK, MeteoSwiss CH1/CH2 und BOM ACCESS erweitert.
- Worker-Capability-Endpunkt für KNMI HARMONIE-AROME EPS und ECCC REPS sowie verbindlicher Modellquellen-/Adaptervertrag ergänzt.

# MID v0.9.53.33

- App-weiter astronomischer Tag-/Nachtsymbolvertrag: zeitpunktbezogene Wetterpiktogramme wechseln exakt an Sonnenaufgang/Sonnenuntergang des jeweiligen Prognoseortes.
- 90-Minuten-/15-Minuten-Punkte übernehmen nicht mehr blind `is_day` der nächstgelegenen vollen Stunde; minutengenaue Sonnenstandsgrenzen werden in den kanonischen Forecast-Reihen mitgeführt.
- Aktuelles Wetter, Komposit/Radar, Kurzfrist-/Stundenpfade und Berg-/Höhenwetter auf denselben zentralen `astronomicalIsDayAt()`-Entscheider vereinheitlicht.
- Native Widgets verwenden `sunrise`/`sunset` statt Provider-`is_day` als primäre Symbolgrenze; Worker-Update erforderlich.
- Neuer verbindlicher `MID_SOLAR_SYMBOL_CONTRACT.md` und Required Regression `test-solar-symbol-contract-095333.mjs`.

# MID v0.9.53.32

- Langfrist-/Hauptsektions-Startzustand nachhaltig repariert: Modul-Offenzustände sind jetzt aus Recovery-Snapshot und StorageSafety-IndexedDB-Spiegel ausgeschlossen.
- Alte Spiegelwerte werden beim Start verworfen; `mid:module-open-contract:v5` setzt alle Hauptsektionen einmalig geschlossen.
- Öffnen/Schließen wird synchron mit der Nutzeraktion gespeichert, nicht erst in einem nachgelagerten React-Effect.
- Neue Required Regression `test-module-open-recovery-isolation-095332.mjs`.

# MID v0.9.53.31

- Favoritenstern auf einen einzigen semantischen Click-Pfad umgestellt; verspätete iOS-Synthetic-Clicks können einen neu gespeicherten Favoriten nicht mehr unmittelbar wieder entfernen.
- Mutierende Favoritenidentität von großzügiger Navigationsnähe getrennt; Koordinaten-/Namensnähe darf keine Löschung auslösen.
- Derselbe Ort kann ausdrücklich gleichzeitig Event/Event-Favorit und Ortsfavorit sein. Event-Metadaten werden aus Ortsfavoriten defensiv entfernt.
- Favoriten-Authoritätsref wird nur noch commit-sicher synchronisiert, nicht während des Renderns zurückgesetzt.
- Neue Required Regression `test-favorite-event-coexistence-touch-095331.mjs`.

# MID Changelog

## v0.9.53.30

- Favoriten werden bei jeder Änderung sofort und atomar in Primär-/Shadow-Snapshot geschrieben; Start-Recovery wendet Lösch-Tombstones zwingend an.
- Tombstones verfallen nicht mehr still und Geräte-Sync arbeitet bei Pending-Änderungen mit Favoriten-pull/merge/push.
- Push-Status prüft Browser, Workerregistrierung und Scheduler-Heartbeat statt nur das lokale Browser-Abonnement.
- Ende-zu-Ende-Testmitteilung und Reparatur der Workerregistrierung ergänzt.
- Niederschlagsbeginn auf kanonische 15-Minuten-Reconciliation inkl. Wahrscheinlichkeit und 45-Minuten-Vorwarnfenster umgestellt.
- Push-Scheduler paginiert alle KV-Empfänger; stilles 24-Favoriten-Limit entfernt.

## 0.9.53.29

- Produktionsbuild-Fix für den verlustfreien Favoriten-/Geräte-Sync: `mergeFavoriteSnapshots` akzeptiert einen fehlenden Remote-Snapshot nun explizit als `null`.
- Behebt GitHub Actions `TS2345` in `src/deviceSync.ts` aus v0.9.53.28, ohne Favoriten-Union, Shadow-Recovery, Tombstones oder Event-/Ortsfavoriten-Trennung zu verändern.
- Neue Required Regression `test-device-sync-nullability-buildfix-095329.mjs` typecheckt genau den zuvor fehlerhaften Nullability-Pfad.

## 0.9.53.28

- Dezente, platzneutrale Wetter-Ampel in den kompakten Eventdarstellungen ergänzt: grün = gut umsetzbar, gelb/amber = mögliche Beeinträchtigung, rot = deutlich beeinträchtigt/kritisch, neutral = noch nicht analysiert.
- Glocken-Popover und Event-Center-Kurzkarte zeigen den Punkt als Overlay direkt am bestehenden Wetterpiktogramm; Kartenhöhe und Zeilenanzahl bleiben unverändert.
- Ausführliche Eventbewertung nutzt dieselbe gemeinsame Komponente in der vorhandenen Statusplakette.
- Die Ampel verwendet ausschließlich den zentralen `EventAdvice.status`; kein zusätzlicher paralleler Wetterscore oder neue Schwellenwertlogik.
- Barrierearme Textbeschreibung sowie zusätzliche Musterunterscheidung für kritische/ungeklärte Zustände ergänzt.
- Dauerhaft im UI-Architekturvertrag und als Required Regression `test-event-feasibility-indicator-095328.mjs` geschützt.

## 0.9.53.27

- Favoritenintegrität app-weit verschärft: keine stille 20er-Kappung oder Verdrängung beim Hinzufügen, Laden oder Import.
- Ortsfavoriten und Event-Favoriten dauerhaft getrennt; Event-artige Datensätze können `mid:favorites` nicht ersetzen oder überlagern.
- Ortsfavoriten erhalten Shadow-Recovery sowie explizite Lösch-Tombstones; Geräte-Sync vereinigt konkurrierende Favoritenstände statt komplette Listen gegeneinander auszutauschen.
- Einheitlicher Hauptsektionsvertrag v4: alle großen `CollapsibleModule`-Sektionen starten bei Vertragsmigration geschlossen und bewahren danach nur die jeweilige lokale Nutzerentscheidung.
- Alte `#mid-section-*`-Hashes werden bei jedem App-Bootstrap neutralisiert; Hauptmodul-Offenzustände sind bewusst gerätelokal und werden nicht über Geräte-Sync überschrieben.
- Neuer verbindlicher `MID_STATE_INTEGRITY_CONTRACT.md` sowie Required Regression `test-state-integrity-contract-095327.mjs`.

## 0.9.53.26

- Verbindlicher appweiter Prognose-Konsistenzvertrag: sichtbare Forecastmodule verwenden die kanonischen Reihen `displayHours` und `displayMinutes15`.
- Hyperlokale Beobachtungskorrekturen werden feldbezogen und zeitlich abklingend zentral in die operative Stundenprognose übernommen.
- Erhöhte lokale Niederschlagswahrscheinlichkeit, Radar-/Nowcast- und Konvektivsignale fließen konsistent in 90-Minuten-, Kurzfrist-, Stunden-/Tagesdarstellungen, Widget, Hazards sowie Event-/Aktivitätsauswertungen ein.
- 15-Minuten-Daten werden vor der sichtbaren Verwendung zentral finalisiert; ansichtsspezifische Doppel-Assimilation von Radar oder Stationsankern ist entfernt.
- Architekturregel dauerhaft in `MID_FORECAST_CONSISTENCY_CONTRACT.md`, Hyperlokalvertrag und Source-of-Truth verankert; Required-Regression ergänzt.

## 0.9.53.24

- Aktuelles Wetter wieder kompakter: marginale Temperatur-/Gelände-Windkorrekturen werden als „Temp./Wind nahe Modell“ zusammengefasst; relevante Abweichungen bleiben numerisch sichtbar.
- Einzelparameter-Kacheln von redundanten Modell-/Korrekturhinweisen entlastet.
- Datenbasis-Infos erweitert: Modellhintergrund, Analyseverfahren, Kontextquellen und parameterbezogene Messwertquellen bleiben über die Info-Dialoge vollständig nachvollziehbar.
- Ohne geeignete aktuelle Messwertquelle kennzeichnet MID ausdrücklich den Modellhintergrund als Datenbasis.
- Buildfix: `forecastSourceLabel` wird vor der Hyperlokal-Datenbasis deklariert; die Required-Regression schützt diese Deklarationsreihenfolge künftig ausdrücklich.

## 0.9.53.23

- Hauptmodul-Öffnungszustand auf v3 migriert; insbesondere `Langfrist` wird nicht mehr durch einen alten gespeicherten Offen-Zustand als Standard geöffnet.
- Eventhinweise sachlicher formuliert und in Lagehinweise sowie empfohlene Maßnahmen gegliedert; Hitzehinweise nennen Trinkwasserversorgung, Erholungspausen und reduzierte direkte Sonnenexposition.
- 7-Tage-PoP: DWD-6-h-Zeitfenster nur bei klarer Abweichung vom Mittel der Tagesfenster; 0 % weiterhin ohne Zeitfenster, ansonsten 00–24 h ohne markanten Schwerpunkt.
- Events: Niederschlagswahrscheinlichkeit gilt über das vollständige Eventfenster; Ensemble-Member werden über den Zeitraum aufsummiert, der Stundenfallback ist zeitgewichtet statt Maximum einer Einzelstunde.
- Aktuelles Wetter und Parameterkacheln zeigen den hyperlokalen Modellhintergrund (z. B. DWD ICON-D2) sowie Temperatur- und Gelände-/Oberflächen-Windkorrekturen wieder transparent an.

## 0.9.53.22

- AQI-Erklärung sprachlich neutralisiert: sichtbare Prompt-/Gestaltungsbegriffe entfernt.
- Standort-Rückkehr appweit auf Request-Reuse umgestellt: Stationsanalyse, Luftqualität, Radar, Radarhistorie, amtliche Warnungen, Gewitter- und Starkregenbasis werden innerhalb fachlich geeigneter Frischefenster räumlich tolerant wiederverwendet, statt beim Zurückwechseln unnötig komplett neu geladen zu werden.
- Automatische Standortbestimmung nutzt einen 14-Tage-Cache für Reverse-Geocoding mit GPS-Jitter-Toleranz; Open-Meteo/CAMS-Luftqualität erhält 15 Minuten Fresh-Cache plus 2 Stunden Stale-if-error.
- EEA-Messstationsmetadaten sind cache-first; Push-Abonnementssync erfolgt nur noch bei tatsächlich geändertem Payload.
- Manueller Reload bleibt ausdrücklich force-fresh; periodische Hazard-Aktualisierung und alle Funktionen bleiben erhalten.
- Neue Required-Regression `test-location-return-request-reuse-095322.mjs`.

## 0.9.53.21

- EU-AQI-Detaildialog erweitert: Jeder Einzelparameter (PM2,5, PM10, NO₂, O₃, SO₂) zeigt jetzt eine kompakte horizontale Vergleichsskala mit offizieller sechsstufiger EU-AQI-Einteilung.
- Ein Positionsmarker verdeutlicht zusätzlich die relative Lage des Messwerts innerhalb der jeweiligen Stufe; die aktive Belastungsstufe wird visuell hervorgehoben.
- Luftqualitätsdialog auf schmaleren Ansichten responsiv verdichtet.

## 0.9.53.20

- Hauptmodule verwenden einen einheitlichen persistenten Öffnen-/Schließen-Vertrag. Ein beim letzten Navigieren verbliebener `#mid-section-*`-Hash öffnet beim App-Neustart kein Modul mehr automatisch.
- Einmalige Migration bereinigt den aus älteren Versionen potenziell erzwungenen Offen-Zustand der standardmäßig geschlossenen großen Module; danach gilt ausschließlich die jeweilige Nutzerauswahl.
- Modulzustände werden über denselben zentralen Schlüsselvertrag gespeichert und optional zwischen offenen Tabs synchronisiert.

## 0.9.53.19

- Hyperlokale Analyse fachlich geprüft: sehr kleine Restfeldkorrekturen sind zulässig und bedeuten, dass Messung und Modellhintergrund bereits eng übereinstimmen. Die kompakte Ergebniszeile hebt deshalb Temperaturkorrekturen erst ab 0,2 K und Gelände-/Oberflächen-Windkorrekturen erst ab 1 % hervor; kleinere Werte werden als „Temp./Wind nahe Modell“ zusammengefasst. Die Detailinfo behält die exakten Werte und kennzeichnet sie als vernachlässigbar.
- Event-Glocke: jedem Eintrag ist nun dasselbe Wetterpiktogramm wie im Event-Center vorangestellt. Glocke und Event-Center verwenden dabei den gespeicherten Tag-/Nachtstatus des repräsentativen Event-Wetters.

## 0.9.53.18

- Datenabruf wieder foreground-first stabilisiert: sichtbare Best-Match-Kernvorhersage erhält exklusiven Vorrang; automatische Event-/Favoritenjobs warten auf einen erfolgreichen Core-Forecast und eine ruhige Netzwerkphase.
- Aggressive Event-Hintergrundlogik aus v0.9.53.8 zurückgebaut: kein 5-Minuten-Modellmetadatenpolling je Eventort und kein erzwungener 30-Minuten-Fullrefresh mehr. Events werden passiv stündlich fällig, alle 15 Minuten geprüft, höchstens vier pro Hintergrundzyklus und strikt seriell aktualisiert.
- Nur manuelle Event-Reloads erzwingen `forceFresh`; automatische Pflege nutzt Cache-/Freshness-Verträge.
- Best-Match-Modellmetadaten werden als Aggregat 20 Minuten gecacht (6 h stale-if-error), statt bei jedem Eventlauf erneut viele Einzelabfragen auszulösen.
- Open-Meteo-429-Cooldown wird PWA-neustartfest gespeichert; während eines aktiven Cooldowns versucht der sichtbare Forecast zuerst Worker/Cache statt den limitierten Direktpfad erneut zu belasten.
- Automatisches Wetterzwilling-Lernen aller Favoriten ist wieder Opt-in und läuft bei Aktivierung über dieselbe globale Hintergrund-Netzwerkbremse.
- Neue Required-Regression `test-background-fetch-stability-095318.mjs`; ältere Event-Regressionen auf den ressourcenschonenden Vertrag aktualisiert.

# 0.9.53.17

- Vollständige Best-Match-Vorhersage und etablierte Kacheldarstellung wiederhergestellt: kein feldärmerer Fremdprovider mehr als Ersatz für die Standard-Kernprognose.
- Foreground-Prognose wieder direkt Best-Match-priorisiert; appweiter Open-Meteo-Guard, 429-Cooldown und gestaffelte Hintergrundabrufe bleiben erhalten.
- Worker dient für `forecast-core` nur noch als Cache/Resilienzpfad für vollständiges Open-Meteo Best Match; alte MET-Norway-Fallback-Caches werden verworfen.
- Standard-Herkunft der Stunden-/Tagesdaten, PoP, Sichtweite und Kachelsemantik wiederhergestellt; DWD-nahe Tages-PoP-Zeitfenster aus 0.9.53.14 bleiben erhalten.
- Neue Required-Regression `test-core-forecast-restoration-095317.mjs`.

## 0.9.53.16

- Kernvorhersage ohne Single-Provider-Ausfallpunkt: alle Core-Abrufe worker-first; Open-Meteo bleibt Primärquelle, MET Norway Locationforecast dient bei 429/5xx/Timeout und fehlendem Cache als unabhängiger globaler Ersatzpfad.
- Worker-Fallback wird transparent als tatsächliche Kernquelle ausgewiesen; Zeitzone/Höhe werden appweit an sichtbare, Event- und Favoriten-Core-Abrufe weitergegeben.
- Fehlende Niederschlagswahrscheinlichkeit des unabhängigen Ersatzproviders wird als `–` statt als künstliche `0 %` dargestellt; deterministische Niederschlags-/Wetterdaten bleiben nutzbar und die Quelle wird transparent ausgewiesen.
- Open-Meteo-429 aus dem Worker setzt zugleich den zentralen Browser-Cooldown, damit Hintergrundmodule den limitierten Dienst nicht weiter belasten.
- Neue Runtime-Regression simuliert ausdrücklich Cold Start ohne Cache bei Open-Meteo-429 und verlangt trotzdem einen nutzbaren Kernforecast.

## 0.9.53.15

- Kernvorhersage gegen anhaltende Open-Meteo-HTTP-429 nach App-Reaktivierung gehärtet: foreground-first Worker-Proxy mit Edge-Cache und 18-h-Stale-Fallback.
- Forecast-Cache toleriert GPS-Jitter und migriert vorhandene v1-Cacheeinträge; ein Neustart verliert den letzten belastbaren Stand nicht mehr wegen geringfügig veränderter Standortkoordinaten.
- Direkter Open-Meteo-Zugriff bleibt als Rückfallpfad erhalten.

# 0.9.53.14

- Buildfix nach fehlgeschlagenem Installerlauf: TravelPlanner-Regressions lösen den neu zentralisierten `openMeteoGuard` im temporär kompilierten ESM-Test korrekt als `.js` auf; Produktionscode und Open-Meteo-Guard bleiben unverändert.

- TypeScript-Buildfix für den Open-Meteo-Guard: `RequestInit.signal` wird vor Queue-/Wait-Helfern von `AbortSignal | null | undefined` auf `AbortSignal | undefined` normalisiert; behebt den GitHub-TS2345-Produktionsbuild ohne funktionale Änderung der Rate-Limit-Logik.

- 7-Tage-PoP wieder DWD-nah: 00–24 h oder nur bei klar isoliertem Schwerpunkt ein klassisches 6-h-Fenster; bei 0 % ohne Zeitfenster.
- Appweiter Open-Meteo-Request-Guard mit Priorisierung, Deduplizierung, begrenzter Parallelität und gemeinsamem 429-Cooldown.
- Favoriten-/Resume-Resilienz: Kernvorhersage mit Fresh-/Stale-Cache; bei Rate Limit bleibt die letzte erfolgreiche Wetterlage sichtbar und MID versucht automatisch erneut, statt rohes `HTTP 429` als Vollfehler zu zeigen.
- Wetterzwilling, Event-Flugwetter, Meteogramm, Berg-/Wintersport, Referenzdaten, Saison- und Reise-Klimadaten auf denselben Open-Meteo-Schutzpfad gezogen.
- Neue Required-Regression `test-dwd-pop-and-openmeteo-rate-guard-095314.mjs`; Worker fachlich unverändert.

# 0.9.53.13

- Event-Favoriten und normale Ortsfavoriten strikt getrennt; gleiche Orte dürfen gleichzeitig in beiden Favoritenarten geführt werden.
- Geräte-Sync führt Event-Favoritenrevision und Wetterplan unabhängig zusammen.
- Event-Ortssuche auf appweite Live-Suche mit Debounce, Request-Abbruch, PLZ/ICAO/POI und mobiler Search-Semantik umgestellt.
- Neue Required-Regression `test-event-favorite-search-independence-095313.mjs`; Worker fachlich unverändert.

# 0.9.53.12

- Event-Persistenz an der eigentlichen Speicherursache korrigiert: quota-sicherer Durable-Store ist für Eventdaten und Refresh-Marker nun direkt maßgeblich, statt von einer überschreibbaren `localStorage`-Methode abzuhängen.
- Bei iOS/Safari konnte ein Quota-Fallback bereits den neuen Eventplan in IndexedDB/Fallback speichern, während ein älterer nativer `localStorage`-Wert weiter bevorzugt gelesen wurde. Dadurch erschien dauerhaft z. B. „Stand 13.08., 07:41“, obwohl Refreshes tatsächlich liefen.
- Durable Reads priorisieren jetzt den gespiegelt neuesten Wert; Event-Center liest und schreibt seine Daten explizit über diese Schicht. Cross-Tab-Storage-Änderungen synchronisieren den Fallback mit.
- Alle bisherigen Reload-, Modelllauf-, Hintergrund- und Geräte-Sync-Regeln bleiben bestehen; neue Required-Regression `test-event-durable-storage-fallback-095312.mjs`.
- Worker fachlich unverändert.

# 0.9.53.11

- Event-Refresh grundlegend korrigiert: ein erfolgreich später gestarteter Fresh-Reload ist nun die maßgebliche Persistenzfrische; optionale/partielle Modellmetadaten dürfen einen neuen Plan nicht mehr wegen einer niedrigeren Quellenrevision blockieren.
- Der konkrete Rücksprung auf alte Event-Stände (z. B. 13.08., 07:41) wird damit an der eigentlichen Ursache behoben: Quellenrevision ist nur noch Provenienz/Tie-Breaker, nicht Commit-Autorität.
- Nach jedem Event-Refresh wird der Plan aus LocalStorage erneut gelesen; erst ein tatsächlich dauerhaft gespeicherter neuer Transaktionsstand gilt als erfolgreicher Reload.
- Geräte-Sync und geöffnete Eventdetails verwenden dieselbe transaktionsbasierte Frischeordnung, sodass ältere Remote-/UI-Snapshots den neuen Stand nicht zurücksetzen können.
- Modelllaufüberwachung bleibt vollständig aktiv: neue Läufe lösen weiterhin die zentrale Event-Neuberechnung aus, ohne selbst die Persistenzreihenfolge zu dominieren.
- Neue Required-Regression `test-event-refresh-transaction-authority-095311.mjs`; bestehende Event-Refresh-/Sync-Regressionen auf den korrigierten Frischevertrag aktualisiert.
- Security-Patches aus v0.9.53.10 (nanoid 3.3.18, protocol-buffers-schema 3.6.1) bleiben enthalten. Worker fachlich unverändert.

# 0.9.53.10

- Security-Wartung nach nächtlichem Dependency-Audit: nanoid im kompatiblen 3.x-Pfad auf 3.3.18 und protocol-buffers-schema auf 3.6.1 angehoben.
- Bestehende nächtliche Dependency-Regression verschärft und um protocol-buffers-schema ergänzt; keine Major-/Toolchain-Migration.
- Dependency-Upgrade-Policy um sofortige kompatible Security-Patches ergänzt.
- Worker fachlich unverändert; kein funktionaler Worker-Upload erforderlich.

# 0.9.53.9

- Event-Wetteraktualisierung vollständig aus der lazy EventPlanner-UI herausgelöst: zentraler appweiter Refresh-Broker und eigenständige Event-Wetterengine.
- Alle Reload-Wege (App-Kopfzeile, Event-Center-Popover, Event-Übersicht, Einzelkarte und Detail) verwenden denselben awaitbaren Fresh-Refresh und lesen nach dem Commit den persistenten Stand neu ein.
- Serielle Per-Event-Queue plus 55-s-Transaktionsgrenze verhindert verspätete Rückschreibungen und dauerhaft blockierende Hintergrundrequests.
- Event-Persistenz, geöffnete Details und Geräte-Sync priorisieren Modell-/Quellenrevision und Refresh-Start vor einem bloß späteren `refreshedAt`.
- Event-Monitor startet unabhängig von der geöffneten Sektion; Start/Resume/Fokus/Online, 5-Minuten-Stale-Check, neue Modellläufe und 30-Minuten-Fallback lösen passende Neubewertungen aus.
- Favoriten-Sammelläufe bleiben vollständig; allgemeine 20-Event-Grenze gilt nicht für Favoriten oder explizite Modelllauf-Ziele.
- Neue Required-Regression `test-event-refresh-broker-model-runs-09539.mjs`; bestehende Event-/Modell-/Hyperlokal-Verträge auf die UI-unabhängige Engine umgestellt.
- Worker fachlich unverändert; kein Worker-Upload erforderlich.

# 0.9.53.8

- Aktuelles Wetter: Piktogramme wechseln am standortbezogenen Sonnenauf-/untergang und werden bei Resume/Fokus neu bewertet.
- Event-Refresh-Aufträge werden persistent nachgeführt; 5-Minuten-Fälligkeitsprüfung und geschützter 30-Minuten-Autorefresh ergänzt.
- Frühere Event-Refresh-Koordination blieb noch an einer versteckten/lazy EventPlanner-Instanz gekoppelt und wird mit v0.9.53.9 vollständig ersetzt.

# 0.9.53.7

- Event-Center: verhindert Rücksprung auf alte Wetterstände nach erfolgreichem Reload.
- Geräte-Sync führt Event-Pläne konfliktfest nach `plan.refreshedAt` zusammen und schützt lokale Änderungen, die während eines laufenden Pull/Push entstehen.
- Lokaler Event-Store verwirft verspätete ältere Plan-Schreibvorgänge.

# 0.9.53.6

- Hyperlokale 2-m-Temperatur erkennt stabile, schwachwindige Nächte nur bei tatsächlich erhöhter räumlicher Temperatur-/Residualstreuung.
- Temperaturresiduen werden dann dynamisch enger lokalisiert; nahe standortähnliche Messpunkte gewinnen, entfernte bzw. thermisch unähnliche Stationen werden stärker gedämpft.
- Entfernte Flugplatz-/METAR-Temperaturen werden für urbane/suburbane Zielpunkte im stabilen Nachtregime konservativer gewichtet, ohne METAR-Wind/Sicht/Wolken abzuwerten.
- Kein pauschaler Nachtabschlag: Korrekturen bleiben vollständig beobachtungs- und modellresidualgestützt.
- Hyperlokal-Info zeigt aktives thermisches Nachtregime, Gewichtungsreichweite und Stationsstreuung.
- Neue Required-Regression `test-stable-night-hyperlocal-temperature-09536.mjs`; Tages-, Wind-, Bewölkungs- und Homogenitäts-Gegenproben enthalten.
- Worker fachlich unverändert; kein Worker-Upload erforderlich.

# 0.9.53.5

- Appweiter Reload aktualisiert gespeicherte Events bis zum sichtbar neuen `Stand`; Event-Refresh hängt nicht mehr von einem bereits vollständig geladenen Ortsforecast ab.
- Optionale langsame Zusatzquellen können den Kern-Eventrefresh nicht mehr unbegrenzt blockieren.
- LocalStorage, Event-Ref und sichtbarer Event-State werden nach erfolgreicher Neuberechnung gemeinsam aktualisiert.
- Glockenlogik bleibt meteorologisch relevant: ein neuer Zeitstempel allein erzeugt keine rote Änderung.
- Worker fachlich unverändert; kein Worker-Upload erforderlich.

# 0.9.53.4

- Events & Aktivitäten: alle Reload-Schaltflächen erzwingen jetzt eine echte Neuberechnung statt Wiederverwendung der bereits gerenderten Ortsvorhersage.
- Forecast-Fusion und Event-Ensemble umgehen beim expliziten Reload lokale Fresh-Caches; der Worker unterstützt `refresh=1` und umgeht dabei den 20-Minuten-Upstream-Cache.
- Automatischer 30-Minuten-Eventrefresh nutzt denselben Fresh-Pfad.
- Hyperlokaler Info-Button rechts innerhalb der bestehenden Analysekarte positioniert, ohne zusätzliche Kartenhöhe.
- Worker funktional geändert; Cloudflare-Upload erforderlich.

# 0.9.53.3

- Tages-Niederschlagswahrscheinlichkeit wieder mit 00–24-h- bzw. klar erhöhtem 6-h-Zeitfenster.
- Best-Match-Fallback bleibt als stündliches Maximum transparent gekennzeichnet.
- Niederschlagsdauer wird bei vorhandener Dauer kompakt in ganzen Stunden ergänzt.

# 0.9.53.2

- Hyperlokale Analyse platzsparend verdichtet; Details hinter Info.
- Event-Aktualisierung repariert: echte Neuberechnung und sofortige Synchronisierung des sichtbaren Stand-Zeitpunkts.

# MID Changelog

## 0.9.53.1

- CI-/Regressions-Hotfix für v0.9.53.0: vier veraltete bzw. durch die neue Architektur überholte Assertions an den aktuellen Funktionsvertrag angepasst.
- Event Center: Favoritenlauf prüft alle aktiven Favoriten; die 20er-Grenze gilt nur für den allgemeinen Hintergrundlauf.
- Hyperlokale Analyse: dynamische Ergebniswerte (Modellhintergrund, lokale Korrektur, Gelände, Windexposition und Oberflächenkontext) bleiben im erweiterten Modus direkt sichtbar; nur Methodik/Erklärung liegt hinter dem Info-Hinweis.
- ICON-D2-RUC-Regression an den optionalen Worker-Punktadapter und den weiterhin gültigen Availability-only-Rohdatenpfad angepasst.
- Forecast-Fusion-Regression an den env-fähigen Worker-Aufruf `forecastFusionResponse(u,env)` angepasst.
- Keine neue kostenpflichtige RUC-Infrastruktur und keine Aktivierung eines RUC-Punktdecoders.
- Worker fachlich unverändert; kein Worker-Upload erforderlich.


## 0.9.53.0

- Event Center: automatische Neubewertung aktiver Events bei sichtbarer App sowie Catch-up nach Wiederaufnahme/Fokus; zusätzlicher `Neu laden`-Button direkt im Glocken-Popover.
- Bergwetter: zentrale DWD-Näherung der Schneefallgrenze aus T850 und tatsächlichem Z850 mit 0,65 K/100 m und +2-°C-Schneefallgrenzenansatz; Ensemble-Spread wird in Höhenunsicherheit übertragen.
- Gezeiten: `Flut`/`Ebbe` statt `Hochpunkt`/`Tiefpunkt`.
- Eventplaner: kompakter Niederschlagsblock ohne Zusatzwort `Zeitraum`; Niederschlagsart-Symbol statt `PoP` in den Details.
- Hyperlokale Analyse: statische/methodische Erklärungen der erweiterten Ansicht in appweites Info-Popover verschoben.
- ICON-D2-RUC: optionaler numerischer Worker-Punktadapter (`MID_DWD_RUC_POINT_ENDPOINT`) ergänzt; direkte DWD-Verfügbarkeitsprüfung bleibt erhalten.
- Copernicus CLMS: direkte LCM10-Abfrage über CDSE/Sentinel-Hub Statistical API mit OAuth-Client-Credentials; GIS-Oberflächenkontext vor OSM-Proxy priorisiert.
- Hyperlokale Exposition: acht richtungsabhängige DEM-Sektoren, Interpolation zur aktuellen Modellwindrichtung und konservative dynamische Wind-/Böenkorrektur unter Einbezug der Rauigkeit.
- Synoptik: aktuelle DWD-Synoptische Übersichten Kurz-/Mittelfrist als kontrollierte Fachvokabularquelle; keine Übernahme fremder Textpassagen.
- Neue Required-Regression `test-mid-nine-step-integration-09530.mjs`.
- Worker funktional geändert; Worker-Upload erforderlich.


## 0.9.52.3

- Appweiter Responsivitäts-/Touch-Cleanup ohne Funktionsabbau: native Einzelaktivierung für einklappbare Dashboardmodule statt paralleler Pointer-/Click-Umschaltung.
- Forecast-Cockpit-Hitflächen lösen die Auswahl nur noch einmal über den nativen Click-Pfad aus; redundante PointerDown-/TouchStart-State-Updates entfallen.
- Ortssuche auf iOS stabilisiert: Treffer bleiben beim Fokusverlust des Eingabefelds erhalten und werden erst über den bestehenden Außenklick-/Fokuswechsel-Mechanismus geschlossen, sodass der erste Tap auf einen Treffer zuverlässig ankommt.
- Appweiter Touchvertrag ergänzt (`touch-action: manipulation`, unterdrückte Tap-Highlights/Touch-Callouts, dekorative SVGs ohne eigenes Hit-Target).
- Kompakte Touch-Controls erhalten auf groben Zeigern mindestens 36 px Trefferhöhe/-breite, ohne Desktop-Dichte oder Funktionen zu verändern.
- Neue Required-Regression `test-appwide-touch-responsiveness-09523.mjs`.
- Worker fachlich unverändert; nur Versionssynchronisation.

## 0.9.52.2

- Regression-Hotfix: `test-hyperlocal-quality-audit-08200.mjs` an den seit v0.9.52.0 verpflichtenden Oberflächenkontext angepasst.
- Eine hochwertige Stationsanalyse gilt nur dann als vollständig, wenn `surfaceClass` vorhanden ist; fehlender Oberflächenkontext löst weiterhin bewusst die DGM-/Landnutzungs-/Rauigkeitsanreicherung aus.
- Keine Änderung an meteorologischer Hyperlokal-, DWD-10-Minuten-, DGM-, Versiegelungs-, UHI-, Rauigkeits- oder Wetterzwilling-Logik.

## 0.9.52.1

- Build-Hotfix: `LocalSurfaceContext` erfüllt jetzt den Fehlervertrag von `fetchWorkerJson<T extends WorkerPayload>`.
- Keine Änderung an Hyperlokal-, DGM-, DWD-10-Minuten-, Versiegelungs-, Rauigkeits- oder Wetterzwilling-Logik.
- Neue Required-Regression `test-local-surface-worker-payload-type-09521.mjs`.

## 0.9.52.0

- Hyperlokale Qualitätsstufe 2: direkte DWD-CDC-10-Minuten-Netze für Temperatur/Feuchte, Mittelwind/Windrichtung, Böenspitzen und Niederschlag; zusätzlich das DWD-Stadtklima-10-Minuten-Netz für urbane Thermodynamik.
- Kleine CDC-ZIP-Produkte werden im Worker nativ per `DecompressionStream('deflate-raw')` gelesen; Feldzeitstempel und native 10-Minuten-Auflösung bleiben erhalten.
- Copernicus-DEM-GLO-90-Mikroreliefprofil für Ziel und Stationskandidaten: Hangneigung, Exposition/Aspekt, lokales Relief sowie Kuppen-/Senkenposition beeinflussen parameterabhängig die Restfeldübertragung.
- Oberflächenkontext ergänzt: exakter GIS-Punktadapter für Versiegelung, LCZ, Bebauungsanteil und Rauigkeitslänge; ohne Adapter ausschließlich klar gekennzeichneter OpenStreetMap-Morphologieproxy.
- Thermische Standortähnlichkeit berücksichtigt bei echten GIS-Daten Versiegelungsunterschiede stärker nachts und bei schwachem Wind; kein pauschaler UHI-Temperaturzuschlag.
- Wind-Restfelder werden bei stark unterschiedlicher Oberflächenrauigkeit bzw. Kuppen-/Abschirmungslage deutlicher gedämpft; kein blindes logarithmisches Windprofil ohne bekannte Modell-/Stationsrauigkeit.
- Keine doppelte pauschale Höhenkorrektur: der bereits höhen-downskalierte hochaufgelöste Modellhintergrund bleibt Basis; DEM dient zur Morphologie- und Übertragbarkeitsbewertung.
- Fast-Analyse wird bei fehlendem Oberflächenkontext automatisch durch eine vollständige Qualitätsanalyse angereichert.
- Neuer verbindlicher `MID_HYPERLOCAL_DOWNSCALING_CONTRACT.md` und Required-Regression `test-hyperlocal-downscaling-09520.mjs`.

## 0.9.51.0

- Hyperlokale Analyse konsequent parameterbezogen: harte Alters-, Distanz- und Höhengrenzen verhindern übermäßigen Einfluss alter/weiter Messwerte.
- Feldzeitstempel und native Datenintervalle werden getrennt transportiert; kein künstliches Verjüngen alter Temperatur durch aktuellere andere Stationsfelder.
- Restfeldkorrektur ohne festen Mindestanteil; hochaufgelöste Regionalmodelle dienen landesabhängig als Hintergrund vor Best Match.
- Stadt/Land/Suburban- und Höhenanpassung präzisiert; generische PPL-Orte werden nicht mehr pauschal urban gewertet.
- Hochfrequente amtliche Beobachtungen ausgebaut: DWD/GeoSphere/KNMI/MeteoSwiss-Metadaten sowie SMHI-Minutenparameter.
- Aktuelles Wetter, Kurzfrist und Event-Anker auf gemeinsame feldbezogene Frische-/Repräsentativitätsprüfung umgestellt; die Haupttemperatur gilt nur bei selbst frischer Temperaturquelle als stationsgeprüft.
- Wetterzwilling-Lernreferenzen ebenfalls feldweise abgesichert: alte Temperatur/Niederschlag/Böe/Bewölkung werden nicht mehr über einen jüngeren fremden Stationsparameter mitarchiviert.
- Neuer verbindlicher `MID_HYPERLOCAL_ANALYSIS_CONTRACT.md` und Required-Regression `test-hyperlocal-parameter-relevance-09510.mjs`.

## 0.9.50.0
- UI-/Architekturstandardisierung ohne Funktionsabbau: gemeinsame `AppPortalPopover`-Primitive für appweite verankerte Popover und Forecast-Cockpit.
- `AppInfoHint` nutzt nur noch die gemeinsame Body-Portal-/Außenklick-/Escape-/Scroll-Positionierungslogik.
- Neuer verbindlicher `MID_UI_ARCHITECTURE_CONTRACT.md` für neue Sektionen, Menüs, Tooltips, Drawer, Zeit-/Einheitenformatierung, Responsive-Verhalten und kanonische Fachpfade.
- Neue Regression verhindert künftig generische Portal-/Dismiss-Kopien in neuen Dateien; spezialisierte Ensemble-Charttooltips bleiben eng begrenzte Ausnahme.

## 0.9.49.1

- Event-PoP visuell eindeutig als **Zeitraumwahrscheinlichkeit** gekennzeichnet; ausgewerteter Start-/Endzeitraum steht direkt an der Niederschlagskachel.
- Stündliche Event-Niederschlagswerte an die Open-Meteo-Semantik „vorangehende Stunde“ angepasst: nur tatsächlich mit dem Event überlappende Intervalle werden dargestellt und summiert.
- Teilstunden werden für Mengen zeitanteilig zugeschnitten; Einzelstunden-PoP bleibt als Wahrscheinlichkeit des jeweils ausgewiesenen Stundenintervalls erhalten.
- Der bisherige ±30-Minuten-Punktfilter wurde für Event-Niederschlag entfernt, damit z. B. die 12:00-PoP (11–12 Uhr) nicht fälschlich in ein ab 12:00 Uhr beginnendes Event einfließt.
- Neue Regression `test-event-period-pop-alignment-09491.mjs`.

## 0.9.49.0

- Event-Niederschlagswahrscheinlichkeit jetzt für den **exakten Start-/Endzeitraum** aus echten Ensemble-Mitgliedern mit den appweiten DWD-nahen Schwellen >0,2 mm und >5,0 mm berechnet; Modellfamilien werden entkorreliert, Stunden nur nach tatsächlicher Zeitüberdeckung gewertet.
- Bei unzureichender Ensembleabdeckung bleibt das bisherige Stundenmaximum ausschließlich als klarer Fallback erhalten.
- Wetterzwilling geprüft und an v0.9.48.x-Endstufe angepasst: lokal validierte Temperatur-/Böen-Biases gelten nun auch für abweichende Eventorte mit vorhandenem Lernstand; Events am aktiven Ort übernehmen den bereits angewandten Twin-Status korrekt.
- Doppelten Wetterzwilling-Radarblend entfernt: operativer Radar-/Konvektiv-Nowcast läuft ausschließlich über die gemeinsame `finalizeForecastHours(...)`-Endstufe; der Twin-Schalter steuert nur noch Radarlernen/Rückblick.
- Neue Regression `test-event-pop-weather-twin-09490.mjs`; bestehende Event-/PoP-/Twin-/Radarverträge fortgeschrieben.

## 0.9.48.1

- Release-Pipeline: veraltete versionsfeste TS18048-Regression auf fortlaufenden Schutzvertrag umgestellt.
- Wetterzwilling-Regression an die zentrale finale Forecast-Pipeline von v0.9.48.0 angepasst.
- Keine fachliche Änderung an Event-, Astronomie- oder Hyperlokallogik.

## 0.9.48.0

- Event-Wetter nutzt app-weit dieselbe finale MID-Prognosekette wie die reguläre Ortsvorhersage; am identischen aktiven Ort werden exakt dieselben finalisierten Stundenwerte übernommen.
- Sonne/Mond-Astronomie vollständig auf Astronomy Engine 2.1.19 vereinheitlicht: Auf-/Untergänge, Dämmerung, Mondphase/-beleuchtung/-alter und Finsternis-Sichtbarkeit aus einer gemeinsamen Ephemeridenbasis.
- Hyperlokale Stationsanalyse nach v0.9.47-Quellenausbau neu kalibriert: GMA/Straßenwetter für allgemeine Luftwerte deutlich gedämpft und nahe geeignete Stationen mit sanftem Lokalitätsbonus versehen.
- Neue Regression `test-event-astronomy-hyperlocal-consistency-09480.mjs`; v0.9.47-Quellenbroker-Regression versionsfortschreibungsfest gemacht.

# MID v0.9.47.1

- Build-Hotfix für v0.9.47.0: die parameterbezogene Messquellenanzeige gibt ihre Quellenzeilen jetzt explizit als `StationFieldSource[]` zurück.
- Dadurch sind `rows`, `rows.length`, `rows[0]` und `group.rows.map(...)` unter TypeScript `strictNullChecks` nicht mehr fälschlich als möglicherweise `undefined` typisiert.
- Keine fachliche Wetter-, Quellen-, Ensemble-, UI- oder Worker-Logik gegenüber v0.9.47.0 geändert; der Worker ist nur versionssynchronisiert.
- Neue Regression `test-current-source-info-type-safety-09471.mjs` schützt den Buildvertrag.

# MID v0.9.47.0

- „Aktuelles Wetter“ nutzt für Deutschland direkte DWD-SYNOP/POI-Beobachtungen vor dem bisherigen Bright-Sky-Rückfall.
- Länderabhängiger amtlicher Beobachtungsbroker ergänzt: direkte Pfade für SMHI, FMI, NWS/MADIS und ECCC/SWOB-GeoMet; GeoSphere bleibt für Österreich erhalten; AEMET ist mit Worker-Secret nutzbar. MeteoSwiss, KNMI, Météo-France und DWD-Straßenwetter besitzen explizite numerische Punktadapter.
- Quellenbewertung bleibt parameterbezogen. Straßenwetter/GMA ist als `road-weather` spezialisiert und darf allgemeine Wind-, Sicht-, Wolken- oder Niederschlagswerte nicht wegen bloßer Nähe dominieren.
- Hyperlokale Analyse führt nun je Parameter konkrete Herkunftsmetadaten (Quelle, Station, Entfernung, Messzeit und QC); die erweiterten Info-Popover von „Aktuelles Wetter“ zeigen diese Herkunft an.
- Ensemblekatalog erweitert: HGEFS ausschließlich als Mittel/Spread; KNMI HARMONIE-AROME Cy43 EPS und ECCC REPS als regionale, gebiets- und horizontbegrenzte Ensemblequellen mit Familien-/Abhängigkeitsgruppen.
- Regionale Direktmodelle werden ausschließlich über numerische Punktadapter geladen; es gibt keinen stillen Open-Meteo-Fallback mit unbekannten Modellkennungen und keine erfundenen Einzelmitglieder.
- Bewusst kein allgemeiner BUFR-/GRIB-Decoder im Worker; binäre amtliche Produkte werden nur über dokumentierte numerische Adapter angebunden.
- Worker funktional erweitert; Deployment des neuen Workers ist erforderlich.

# MID v0.9.46.0

- Events & Aktivitäten: kompakte Böenabkürzung **G** statt **B**.
- Aktivität Flug nutzt amtliche ICAO-SIGMET/TAF, bei Nahterminen METAR/SPECI und PIREP/AIREP sowie regionale AWC-Hazardprodukte.
- WAFS-SIGWX beider WAFC wird über den autorisierten WIFS-API-Pfad standort- und zeitbezogen ausgewertet; Polygon- und Punktgeometrien sowie Hazard-/Intensitätskennungen aus IWXXM-Attributen werden berücksichtigt.
- Optionaler direkter KNMI-AIRMET-/SIGMET-Pfad für die Amsterdam FIR ergänzt; weitere nationale SWC-Spezialprodukte werden nur bei dokumentierter API-/Nutzungsfreigabe angebunden.
- Quellenstatus und technische Hintergründe liegen hinter dem Info-Button; die Hauptansicht bleibt kompakt.
- Neuer Worker-Modus `aviation-hazards`; Worker-Deployment ist erforderlich.

# MID v0.9.45.5

- CI-/Regression-Hotfix für den fehlgeschlagenen v0.9.45.4-Installerlauf.
- Historische Funktionssuite `test-feature-suite-0797.mjs` auf den aktuellen Standortvertrag synchronisiert: der veraltete Quellcode-Zwang `locate(false)` wurde entfernt.
- Die aktive Standortlogik bleibt unverändert: gespeicherter/manueller Ort bleibt geschützt; die separate aktuelle GPS-Standortermittlung wird weiterhin durch die neueren Standort-/Favoriten-Regressionen abgesichert.
- Keine fachliche Wetter-, Event-, Planer-, UI- oder Worker-Änderung gegenüber v0.9.45.4.

# MID v0.9.45.2

## Sonne / Mond

- Nächste standortrelevante Sonnen- oder Mondfinsternis mit zukünftigem Maximum, Datum, Detailzeiten und sinnvoller Verdeckungsangabe ergänzt.
- Sonnenfinsternisse werden lokal berechnet; reine Halbschatten-Mondfinsternisse werden ohne irreführende 0-%-Angabe ausgewiesen.

# MID v0.9.45.2

- **Events & Aktivitäten kompakter:** gespeicherte Events zeigen zunächst nur Titel, Rahmen/Aktivität, Termin, Ort und Wetter-Kernwerte.
- Analyseheadline, Bewertung, Änderungsdetails sowie Bearbeiten/Aktualisieren/Löschen liegen jetzt in einer gezielt aufklappbaren Detailansicht.
- Der Favoritenstern bleibt direkt in der Kurzansicht erreichbar; Mehrfachfavoriten bleiben unverändert unterstützt.
- Das Event-Center unter der Glocke nutzt dieselbe progressive Darstellung: kompakte Eventzeile, aufklappbare Zusatzinfo und eindeutiger Sprung in den vollständigen Eventplaner.
- Abstände, Kartenhöhen, Aktionsflächen und Mobile-Layout wurden weiter verdichtet; Hell-/Dunkel-Design bleibt über die bestehenden MID-Themevariablen konsistent.
- Neuer Regressionstest `test-event-progressive-disclosure-09451.mjs`.

# MID v0.9.45.0

- Neue sichtbare Dashboard-Sektion **Planer** bündelt Eventplaner und Reiseplaner.
- Beide Planer bleiben in den Einstellungen weiterhin separat aktivier- und deaktivierbar.
- Eventplaner: **Rahmen** und **Aktivität** jetzt deutlich kompakter als platzsparende, umbrechende Chips statt großflächiger Kacheln.
- Neuer Regressionstest `test-planner-section-compact-event-controls-09450.mjs`.

# MID v0.9.44.0

- Event-Center: chronologische Standardsortierung plus wählbare Sortierung.
- Gespeicherte Events sind nun eindeutig bearbeitbar.
- Wind wird zusammen mit Böen ausgegeben.
- Niederschlags-% werden an die dominante plausibilisierte Niederschlagsform gekoppelt.

# MID v0.9.43.0

- **Event-Center mit echten Mehrfachfavoriten:** mehrere gespeicherte Events können gleichzeitig favorisiert und gemeinsam nacheinander aktualisiert werden; ein zuvor geladenes Event überschreibt beim Anlegen eines neuen Termins keinen anderen Favoriten mehr.
- Event-Center und Eventplaner für **helles und dunkles Design** neu abgestimmt; Status-, Änderungs- und Favoritenfarben verwenden theme-adaptive Kontraste.
- Primäransicht deutlich verdichtet: erklärende Hintergrundtexte, Modellmethodik und Update-Hinweise liegen hinter kompakten Info-Bedienelementen.
- Texte und Statusbezeichnungen vereinheitlicht und professioneller formuliert; unnötige Wiederholungen in Ergebnis- und Eventkarten entfernt.
- Eventparameter an die appweiten Formatregeln angeglichen: gewählte **Windeinheit** wird übernommen, **UVI wird ganzzahlig** dargestellt, Niederschlagswahrscheinlichkeit und Sicht bleiben konsistent formatiert.
- Neue Aktivität **Flug**. Zusätzlich zum normalen Event-Wetter führt MID ein Flugwetter-Screening aus Druckniveau-Daten durch: Gewitter/Konvektion, Vereisung, Turbulenz, CAT, Wolkenuntergrenze, Sicht und Böen; Nullgradgrenze wird ergänzend ausgewiesen.
- Flugwetter-Hazards sind ausdrücklich diagnostische MID-Indikatoren und keine amtliche Flugwetterberatung oder Navigationsgrundlage.
- Neuer Regressionstest `test-event-center-flight-multifavorite-09430.mjs` schützt Mehrfachfavoriten, Flugaktivität, Flugwetter-Hazards, Theme-Kontrast, Info-Verdichtung sowie appweite UVI-/Windeinheiten.

# MID v0.9.42.0

- **Event-Center deutlich unauffälliger:** der große Dashboard-Block entfällt; gespeicherte Events sind jetzt über eine kompakte Glocke in der Top-Leiste erreichbar.
- Bei ungesehenen Änderungen erhält die Glocke einen dezenten roten Statuspunkt und Akzent. Das Popover zeigt die nächsten Events und führt direkt zum jeweiligen Eintrag im Eventplaner.
- Technisches Status-Wording korrigiert: statt „Einschätzung jetzt Achtung statt beobachten“ erscheinen natürliche Formulierungen wie „Bewertung verschärft: jetzt „Achtung“ (zuvor „Beobachten“).“
- Bereits gespeicherte alte Event-Center-Texte werden beim Einlesen automatisch in die neue Form migriert.
- Navigation neu geordnet: Berg-/Wintersport und Wassersport liegen unter **Profile**; **Eventplaner** und **Reiseplaner** gemeinsam unter der neuen Oberkategorie **Planer**.
- Eventplaner und Reiseplaner bleiben in den Dashboard-Einstellungen jeweils separat aktivier- und deaktivierbar.
- Neuer Regressionstest `test-event-center-topbar-planner-group-09420.mjs` schützt die neue Topbar-, Text- und Planerstruktur.

# MID v0.9.41.7

- CI-/Regressionsfix für den fehlgeschlagenen v0.9.41.6-Installerlauf: zehn veraltete Testverträge auf den tatsächlich bereits in v0.9.41.5/v0.9.41.6 eingeführten Stand synchronisiert.
- Forecast-Fusion-Cache v7 und Ensemble-Cache v12 sind nun auch in allen historischen Schutztests konsistent hinterlegt; die beabsichtigte Cache-Migration bleibt unverändert.
- Navigationstest erwartet jetzt `Profile & Planung`; AIFS-Metadatenprüfung nutzt die exakte aktuelle `ecmwf_aifs025_single`-ID.
- Ensemble-Modellprüfung behandelt `bom_access_global` korrekt als gültige deterministische Modellkennung und verwechselt sie nicht mehr mit einer veralteten Ensemble-ID.
- Keine funktionale Wetter-/UI-Änderung gegenüber v0.9.41.6; ausschließlich Build-/CI-Stabilisierung.

# MID v0.9.41.6

- **Wetterplaner auf gemeinsamen MID-Vorhersagepfad umgestellt:** Event-Auswertungen verwenden dieselbe Mehrmodell-Fusion, Radar-/Nowcast-Korrektur, konvektive Plausibilisierung und zentrale `precipitationParts()`-Logik wie Kurzfrist, 7-Tage und Dashboard. Sprühregen, Schauer und konvektiver Niederschlag werden dadurch nicht mehr in einer separaten Parallel-Logik bewertet.
- Wettertitel, Piktogramme und Niederschlagsbeschreibung im Event-Center werden aus dem plausibilisierten Stundenpfad abgeleitet; für Termine im Nowcast-Fenster fließen vorhandene Radar-/Gewittersignale ein.
- **App-weite Modellfamilienprüfung:** Forecast-Fusion, Ensemble und Schneefallgrenze unterscheiden jetzt Modellvarianten/auflösungen von unabhängigen Modellfamilien. Mehrere Varianten derselben Unabhängigkeitsgruppe bleiben als Datenquellen/Fallback sichtbar, erhalten im Konsens aber nicht mehrfaches Gewicht.
- Rapid-Cycle-Modelle werden innerhalb ihrer tatsächlichen Vorhersagereichweite priorisiert. DWD ICON-D2-RUC/RUC-EPS bleiben als Verfügbarkeits-/Ausbaupfad gekennzeichnet, solange kein numerischer Adapter verfügbar ist; es werden keine Ersatzwerte erzeugt.
- NOAA-NBM und DWD-MOSMIX werden als Postprocessing behandelt und nicht als zusätzliche unabhängige Modellstimme gewertet.
- Ensemblegewichtung gruppiert DWD-, NOAA-, ECMWF-, CMC-, UKMO- und MeteoSwiss-Varianten nach Unabhängigkeitsgruppe; Szenarioanteile und Modellzahlen folgen derselben Familienlogik. Ensemblecache auf v12 angehoben.
- Schneefallgrenze gruppiert ECMWF IFS/AIFS und andere Varianten familienweise; die Varianten bleiben sichtbar, verdoppeln aber nicht das Familiengewicht.
- Saison-/Langfristpfad behält die bereits vorhandene Deduplizierung nach Modellfamilie bei.
- Forecast-Fusion-Cache auf v7 angehoben, damit alte Ergebnisse mit früherer Gewichtungslogik nicht wiederverwendet werden.
- Neuer Regressionstest `test-model-family-consistency-09416.mjs` schützt Wetterplaner-Plausibilisierung, Rapid-Cycle-Reichweiten, unabhängige Modellgruppen, Postprocessing-Ausschluss, Ensemble-/Schneefallgrenzengewichtung und saisonale Familiendeduplizierung.

# MID v0.9.41.2

- Mobiles Temperatur-Ensemble-Tooltip korrigiert: Sonne, Niederschlag und Modelle verwenden eine gemeinsame Beschriftungsspalte mit sauber getrennter flexibler Wertspalte.
- Lange Metawerte umbrechen nur rechts und an natürlichen Trennstellen; insbesondere „Niederschlag“ läuft nicht mehr in den Werttext.
- Tooltip-Größe, Padding, Schriftgrößen, Temperaturmatrix und Desktop-Darstellung bleiben unverändert.

# MID v0.9.41.1

- CI-Kompatibilitätsfix: Die Langfrist-Methodik formuliert die gleichgewichtete Modellfamilienlogik wieder vertragskompatibel als „gewichtet Modellfamilien gleich“, ohne die fachliche Einschränkung auf unabhängige Modellfamilien zu verlieren.
- Keine Änderung an C3S-/DWD-Datenpfaden, Ensembleberechnung oder UI-Funktionalität gegenüber v0.9.41.0.

# MID v0.9.41.0

- **C3S numerisch vorbereitet:** Die neun aktuellen C3S-Zentren bleiben als Modellkatalog sichtbar; ein neuer serverseitiger CDS-/Worker-Pfad kann echte lokale monatliche Ensemblewerte von ECMWF, UK Met Office, Météo-France, DWD, CMCC, NCEP, JMA, ECCC und BOM dekodieren. Nicht konfigurierte Zentren bleiben ausdrücklich „Katalog“ und liefern keine Ersatzwerte; Kartenfarben werden niemals zu Zahlen rekonstruiert.
- Für echte C3S-Rauchfahnen ist `seasonal-monthly-single-levels` als numerischer Memberpfad vorgesehen; `seasonal-postprocessed-single-levels` kann die monatliche Anomalie-/Bias-Referenz liefern. Der Browser erhält ausschließlich normalisierte Punktwerte und Verteilungen.
- **DWD GCFS2.2 / EPISODES:** eigener Deutschland-Pfad für 3-Monats-Anomalien (Monate 1–3, 2–4, 3–5, 4–6), `tasAnom`/`prAnom`, Referenz 1991–2020 und `DE-015x01` (~10 km). Roh-QA `mse`/`corr_pea` sowie optional numerisch bezogene MSESS/RPSS werden unterstützt; GCFS2.1-Karten werden nicht als GCFS2.2 ausgegeben.
- Langfristansicht zeigt den Live-/Konfigurationsstatus der neuen Datenpfade, trennt C3S-Rauchfahnen von der DWD-Deutschlandperspektive und kennzeichnet C3S-Zentren eindeutig als **Numerisch** oder **Katalog**.
- Neue globale Einstellung **Informationsdichte: Auto / Kompakt / Komfortabel**. Auto reagiert auf Displaybreite und Hoch-/Querformat; die Einstellung wird über den bestehenden MID-Einstellungs-/Sync-Pfad persistiert.
- Mobile Bedienlogik vereinheitlicht: zentrale Popover reagieren auf Outside-Tap, Escape und Swipe-down; Touchflächen und Abstände folgen gemeinsamen MID-Größenvariablen.
- Dynamische Langfristlegenden: im Standardmodus zunächst kompakt, Details per Tippen; der erweiterte Modus zeigt die vollständige Diagnostik.
- Section-local Sticky Controls für Langfrist, Ensemble-Trend/Wind/Niederschlag und Wetterkarten halten Modell-/Zeitraum-/Layersteuerung in langen Ansichten erreichbar.
- Progressive Disclosure bleibt konsequent erhalten: technische Adapter-/Quellendetails erscheinen im erweiterten Modus statt in primären Bedienflächen.
- Sichtbarkeitsgesteuertes Rendering baut auf dem vorhandenen `ViewportGate` auf und umfasst nun zusätzlich Berg-/Wintersport; vorhandene iOS-Stabilitätsregeln werden nicht durch aggressives `content-visibility` überschrieben.
- Prognose-Cockpit bewahrt horizont-/sektionseigene Scrollpositionen beim Wechsel Kurzfrist/7/14 Tage; bestehende Tages-/Modellauswahlen werden nicht unnötig zurückgesetzt. Langfristmodell und Modellstreifenposition werden standortbezogen gespeichert.
- Release auf **v0.9.41.0** synchronisiert; neuer Regressionstest schützt C3S/DWD-Datenverträge, Informationsdichte, Sticky Controls, Gesten und Scroll-Restore.

# MID v0.9.40.16

- Favoritenleiste in den Einstellungen auf **Auto / Dauerhaft / Aus** umstellbar; Auto bewahrt das bisherige Verhalten.
- Dashboard-Sektionskonfiguration erhält **Standard wiederherstellen** und setzt Reihenfolge sowie Sichtbarkeit auf die MID-Defaults zurück.
- Auf-/Zuklappen von Modulen, insbesondere des Kompositbilds, auf Touchgeräten robuster: Bewegungsfilter und Unterdrückung des nachlaufenden Klicks verhindern Doppel-/Fehlauslösungen beim Scrollen.
- Niederschlagsart-Layer nutzt kompakte meteorologische Schwarzweiß-SVG-Symbole nach der gelieferten Vorlage. Unterstützt werden Schnee, Schneekörner, Schneeregen/Mischphase, gefrierender (Sprüh-)Regen, Graupel/Eiskörner und Hagel; reiner Regen bleibt ohne Zusatzsymbol.
- Technischer Fehlertext im Niederschlagsart-Schalter wird zu **Phasendaten nicht erreichbar** verkürzt; Details bleiben im Status-/Info-Bereich.
- Langfristansicht zu echter Rauchfahnen-Darstellung erweitert: P10–P90 über den gesamten Horizont, P25–P75 in der ersten Hälfte. ECMWF nutzt echte Memberquantile; alle im aktuellen NOAA-NMME-ENSMEAN-Lauf lesbaren unabhängigen Modellfamilien fließen gleichgewichtet in das Multi-Modell ein, CFSv2 E1/E2/E3 bleibt Fallback.
- Niederschlagsanomalien erhalten auch in mm/Tag echte P10/P25/P75/P90-Felder, soweit die Quelle Ensemble-/Initialisierungsdaten liefert.
- C3S-Modellkatalog bleibt als Ausbaupfad für ECMWF, UKMO, Météo-France, DWD, CMCC, NCEP, JMA, ECCC und BOM sichtbar; keine Rekonstruktion numerischer Punktwerte aus Kartenfarben.

# MID v0.9.40.15

- CI-/Regressionsbereinigung: drei veraltete Schutztests wurden auf den aktuellen Niederschlagsart-Vertrag mit Hagel und Graupel/Eiskörnern sowie den aktuellen Rapid-Update-Statuspfad migriert.
- Die neue Symbolerweiterung aus v0.9.40.14 bleibt unverändert erhalten; es wird keine Funktion zurückgenommen.
- Der neue Regressionstest für Layerstatus, Hagel und Graupel/Eiskörner ist nun Bestandteil des Baseline-Vertrags.
- Versionssynchronisierung umfasst jetzt auch package-lock, Service-Worker-Cache, public/version.json, Baseline und Worker.

# MID v0.9.40.14

- Komposit-Niederschlagsart gibt jetzt im Layerstatus eindeutig Rückmeldung, ob der Layer aktiv ist und ob im aktuell sichtbaren Ausschnitt momentan überhaupt feste, gemischte oder gefrierende Niederschlagsarten erkannt werden. So ist auch bei rein flüssigem Niederschlag nachvollziehbar, dass der Layer funktioniert.
- Die Symbolik wurde erweitert: zusätzlich zu Schnee, Mischphase und gefrierendem Niederschlag werden nun auch Hagel sowie Graupel/Eiskörner als kleine semitransparente meteorologische Symbole auf dem ausgewählten Radarbild dargestellt.
- Die Symbolgrößen bleiben bewusst klein, damit Staffelungen der Radarechos erkennbar bleiben; Hagel- und Graupelsymbole erhalten zugleich etwas stärkere Abstandsregeln, damit sie lesbar bleiben.
- Die Legende im Kompositbild erklärt nun auch, dass ein fehlendes Symbol bei aktivem Layer schlicht bedeuten kann, dass im aktuellen Ausschnitt keine feste bzw. gemischte Niederschlagsphase vorliegt.

# MID v0.9.40.9

- Niederschlagswahrscheinlichkeit app-weit vereinheitlicht: Ensemble-Tageswerte werden explizit als 00–24-h-Ereigniswahrscheinlichkeit bezeichnet und zusammen mit dem stärksten 6-h-Zeitfenster angezeigt.
- Mathematische Konsistenz abgesichert: Die 00–24-h-Wahrscheinlichkeit kann nicht unter der Wahrscheinlichkeit eines darin enthaltenen 6-h-Fensters liegen; Entsprechendes gilt für die >5-mm-Schwelle.
- Best-Match-Fallback eindeutig gekennzeichnet: statt eines scheinbaren Tageswerts erscheint „max. Std.“ für das Stundenmaximum.
- Ensembleübersicht, 7-Tage-/Cockpit-Tageskarten, klassische Vorhersage sowie Widget/PNG nutzen denselben 00–24-h-/6-h-Vertrag.
- Alle Komposit-/Radaränderungen aus v0.9.40.8 bleiben vollständig enthalten.

# MID v0.9.40.6

- TypeScript-Buildfix: `RadarPhase` wird wieder als Union-Typ aus `radarColorTables.ts` exportiert; dadurch sind die festen Niederschlagsartfarben ohne `any`-Indexierung typisiert.
- Farbtabellen-Scope unverändert: Auswahl ausschließlich für 1-km-/250-m-Radar, feste klassische Phasefarben im Niederschlagsartmodellradar.

## 0.9.40.5
- Korrektur der Radar-Farbtabellen: Auswahl gilt ausschließlich für das normale 1-km-Radar und das 250-m-PX/HX-Radar.
- Einstellungen enthalten dafür DWD Standard und DWD Starkregen mit kleiner Farbvorschau; beim 1-km-DWD-RV wird der offiziell dokumentierte WMS-Stil `Starkregen` verwendet.
- Das Niederschlagsartmodellradar besitzt keine Farbtabelle-Auswahl mehr und nutzt fest die klassischen meteorologischen Phasenfarben: Regen grün, Mischphase pink/violett, Schnee blau, gefrierender Niederschlag rot.
- Der temporäre v0.9.40.3-Latest-only-Eingriff in den normalen 1-km-Radarpfad wurde zurückgenommen; 1-km-DWD-Zeitframes und 250-m-PX/HX-Pfade bleiben wie im bewährten v0.9.40.2-Vertrag erhalten.

## 0.9.40.4
- Niederschlagsart-Radar erhält wählbare professionelle Farbtabellen (Meteo klassisch, Meteo kräftig, Barrierearm) inklusive kleiner Vorschau in den Komposit-Einstellungen.
- Legende des Niederschlagsart-Layers zeigt jetzt die aktive Farbtabelle samt Vorschau und Phasenfarben direkt im Kompositbild.
- Die Anpassung bleibt auf das Niederschlagsart-Radar begrenzt; die bestehenden 1-km-DWD-, OPERA- und 250-m-PX/HX-Radarpfade bleiben unverändert aktiv.

# MID v0.9.40.3

- Kompositbild: der DWD-Radarpfad behandelt den `dwd:Niederschlagsradar`-Alias jetzt wieder korrekt als Latest-only-WMS-Layer und erzwingt dort keinen fehlerhaften `TIME`-Parameter mehr; dadurch werden die Radarechos im Komposit wieder angezeigt.
- Für Latest-only-DWD-Radar rendert MID genau einen Snapshot mit stabiler Fehlerbehandlung, statt denselben Alias mehrfach als zeitgebundene Frames anzufragen.
- Die Komposit-Legende wird mit aktiven Overlays nun direkt geöffnet und blendet die Niederschlags-/Radar-Skala zuverlässig im Panel ein.
- Neue Regression `test-composite-radar-legend-buildfix-09403.mjs` schützt DWD-Radar-Snapshot und Legendenverhalten dauerhaft.

# MID v0.9.40.2

- 24-h-Wetterprofil: Tmin/Tmax verwenden jetzt exakt dieselben zentral reconcilierten Tageswerte (`displayDays[].min/max`) wie 7-Tage-Ansicht, 14-Tage-Best-Match, Widget und klassische Vorhersage.
- Stundenwerte dienen im Wetterprofil nur noch zur zeitlichen Positionierung des jeweiligen Tagesextrems auf der Kurve; sie erzeugen keine abweichenden Extremwert-Zahlen mehr.
- Tagesminimum/-maximum werden weiterhin nur eingeblendet, wenn der zugehörige Stunden-Proxy des betreffenden Kalendertags innerhalb des sichtbaren 24-h-Intervalls liegt; das sichtbare Fenster selbst wird nicht als falsches Tages-Tmin/Tmax interpretiert.
- Neue Regression `test-weather-profile-daily-extremes-consistency-09402.mjs` schützt die app-weite Konsistenz der Extremwerte.

# MID v0.9.40.0

- App-weite Rapid-Update-Policy: hochauflösende stündliche Regionalmodelle werden im Kurzfristbereich nach Standort, Frische, Auflösung und Datenlatenz priorisiert; mit zunehmendem Vorlauf sinkt ihr Gewicht.
- DWD ICON-D2-RUC/RUC-EPS werden über DWD Open Data als echte Rapid-Läufe erkannt; numerische Verwendung bleibt ehrlich capability-gated, solange kein JSON-/GRIB2-Adapter verfügbar ist.
- Radar-/Modell-Niederschlagsart wählt dynamisch das frischeste geeignete Rapid-/Regionalmodell; Météo-France AROME 15-min nutzt den dedizierten API-Endpunkt, HRRR die dokumentierte Modell-ID.
- Forecast-Fusion reicht Rapid-Provenienz bis ins Frontend durch; KNMI HARMONIE Europe/NL, UKV, MET Nordic, HRRR/NBM werden standort- und vorlaufabhängig berücksichtigt.
- Meteogramme um KNMI HARMONIE Europe und UKV ergänzt; UKMO UK Ensemble 2 km innerhalb seiner Domain höher priorisiert.
- Konservative Phase-/Rate-Limit-Schutzmechanismen aus v0.9.39.13 bleiben bestehen und wurden um laufaltersabhängige Rapid-Freshness ergänzt.

# MID v0.9.39.12

- 7- und 14-Tage-Cockpit: dezente, touch-taugliche Schaltfläche „Modellstand“ mit Best-Match- bzw. Ensemble-Laufmetadaten.
- 14-Tage-Cockpit: Konsistenz-Prozentpillen öffnen per Klick/Tipp einen randfesten Tooltip analog zur klassischen Ensembleansicht mit Klassifikation, Modellzahl, Mitgliederzahl und Streuungshinweis.
- 14-Tage-Tageskarten semantisch entkoppelt, damit die interaktive Konsistenzpille kein verschachtelter Button ist und beim Öffnen nicht gleichzeitig den Tag wechselt.
- Temporäre Regressionstest-Verzeichnisse werden nicht mehr als Releaseinhalt bzw. Commit-Artefakte mitgeführt.

# MID v0.9.39.9

- CI-Regressionsfix: der historische node_modules-Bootstrap-Test untersucht nach `npm ci` nicht mehr das live befuellte Projektverzeichnis.
- Der alte Installervertrag wird isoliert in einem temporaeren Checkout mit `minimist/.git`-Rest reproduziert.
- Der einmalige leere `node_modules/minimist/`-Bootstrap bleibt fuer den noch alten Installer auf `main` erhalten.

## v0.9.39.6

- GitHub-Installer gegen versehentlich versioniertes `node_modules/` gehärtet; lokale Paketinstallation wird vor dem Releasevergleich entfernt bzw. ausgeschlossen.
- `.gitignore` schützt `node_modules/` dauerhaft, und der CI-Prebuild entfernt historische Node-Pakete aus dem Git-Index, ohne die lokale Installation zu löschen.
- Verwaltete GitHub-Workflows werden vor dem Build aus `ci/github` synchronisiert, damit der korrigierte Installer im selben Release-Commit dauerhaft übernommen wird.
- Ein einmaliger ZIP-Bootstrap-Platzhalter erlaubt v0.9.39.6 auch mit dem noch auf `main` aktiven alten Installer zu installieren; `npm ci` entfernt ihn vor dem Build.
- Neue Regression reproduziert den v0.9.39.5-Fehler und schützt die Repository-Hygiene.

## v0.9.39.5

- Komposit-Niederschlagsart: DWD HymecNG vollständig aus dem aktiven Layerpfad entfernt; einzige aktive Variante ist beobachtetes OPERA-CIRRUS-Echo + zeitnahes ICON-D2-Phasenfeld.
- Radar-/Modellfusion gehärtet: konservative Zeitprüfung, mindestens 90 % vollständige Modellstichpunkte, verdichtetes lokales Phasenraster ohne künstliche Unterteilung und transparente Grenzfälle statt erfundener Klassifikation.
- Hagel wird nicht mehr allein aus einem Modell-Wettercode als beobachtete Niederschlagsart ausgegeben.
- 15-minütige ICON-D2-Phasenfelder werden clientseitig zeitlich normalisiert und wiederverwendet, damit 5-min-Radarscrubbing keine redundanten Modellraster lädt.
- 7-Tage-Trend sprachlich korrigiert: vollständige Mischwetter-Sätze, korrekt flektierte Tropennacht-Formulierung und großgeschriebene Wetterereignisse mit finitem Verb (z. B. „In der Nacht zum Sonntag sind Schauer möglich.“).
- Neue Regression schützt exklusiven Radar-/ICON-D2-Pfad und Trend-Grammatik.

## v0.9.39.4

- Fachliche Wetterwerte in kompakten Karten werden nicht mehr per Ellipsis abgeschnitten; enge Ansichten nutzen kürzere Notation, Umbruch und volle verfügbare Breite.
- DWD-nahe 6-h-Niederschlagswahrscheinlichkeit in Tageskarten kompakter dargestellt; redundante `0 min` entfallen, echte Niederschlagsdauer bleibt vollständig sichtbar.
- Appweiter Audit für Warnungen, Wettertexte, Quickfacts, Ensemble-Szenarien, Synoptik-, Radar-/Karten- und Detailwerte; Ellipsis bleibt nur für Navigation bzw. technische Namen zulässig.

## v0.9.39.3

- TypeScript-Buildfix für die MapLibre-Migration: dynamische GeoJSON-Layer werden als `maplibregl.AddLayerObject` an `Map.addLayer()` übergeben.
- Marker-Anchor-Typ von nicht vorhandenem `maplibregl.Anchor` auf den in MapLibre 5.24 exportierten `maplibregl.PositionAnchor` korrigiert.
- Ensemble-Mean/Spread-Fallback erzeugt nun ebenfalls die vier 6-h-Niederschlagsfenster 00–06, 06–12, 12–18 und 18–24 Uhr und erfüllt damit den vollständigen `MemberDay`-Vertrag.
- Neue Pflichtregression schützt die drei GitHub-CI-Buildfehler aus v0.9.39.2 dauerhaft.

## v0.9.39.2

- Niederschlagswahrscheinlichkeit DWD-nah zeitbezogen umgesetzt: Ereignisschwellen > 0,2 mm und > 5,0 mm werden für 24 h sowie die vier Ortszeitfenster 00–06, 06–12, 12–18 und 18–24 Uhr aus Ensemble-Membern berechnet.
- Kompakte Tagesdarstellung zeigt das relevanteste 6-h-Fenster (z. B. `12–18 h · 70%`) statt eines irreführenden Stundenmaximums als Tageswahrscheinlichkeit; vollständige 24-h-/6-h-Aufschlüsselung im Tooltip.
- Ohne Ensembleauswertung wird das Best-Match-Stundenmaximum nur noch als `zeitw. bis … %` gekennzeichnet und ausdrücklich nicht als DWD-Tagesereigniswahrscheinlichkeit ausgegeben.
- Ereigniswahrscheinlichkeiten werden vor der robusten Mengen-Ausreißerfilterung aus allen plausiblen Ensemble-Membern berechnet; Mengenquantile und Eintrittswahrscheinlichkeit sind statistisch getrennt.
- Ensemble-Cache auf v11 invalidiert, damit alte Tages-PoP-Datensätze ohne 6-h-Zeitfenster nicht weiterverwendet werden.

## v0.9.39.1

- Tages-Niederschlagswahrscheinlichkeit auf DWD-Ereignisschwellen > 0,2 mm und > 5,0 mm umgestellt.
- Eigene >= 0,1-mm-Tagesdefinition aus v0.9.39.0 entfernt.
- Zweite DWD-Wahrscheinlichkeit (> 5,0 mm) in Tages-/Ensembleinformationen ergänzt.
- Prognoseverifikation auf dasselbe > 0,2-mm-Ereignis synchronisiert.
- Ensemble-Cache invalidiert (v10), damit alte PoP-Werte nicht fortgeschrieben werden.

## v0.9.39.0

- Kartenengine: MID app-weit von Leaflet/react-leaflet auf MapLibre GL JS 5.24.0 migriert; gemeinsamer Kartenkern für Raster/WMS, GeoJSON, Marker, projektionstreue Canvas-Raster und deterministische Layerreihenfolge.
- Kompositbild: OPERA wird bei verfügbarem DWD-Radar nicht mehr optisch über das DWD-Bild gemischt, sondern als Kontroll- und Phasenquelle genutzt; als sichtbares Radar erscheint OPERA nur, wenn es selbst die aktive Radarquelle ist.
- Niederschlagsart: frisches DWD HymecNG bleibt Primärklassifikation; fehlt es, kombiniert MID beobachtete OPERA-Echos mit zeitnahem ICON-D2 (WMO-Code, Schneefall, bodennahe Temperatur/Feuchte und Feuchtkugeltemperatur). Außerhalb realer Radarechos wird keine Niederschlagsart erzeugt.
- Niederschlagswahrscheinlichkeit: Tageswerte verwenden bei verfügbarer Ensembleauswertung den modellgewichteten Anteil nasser Ensemble-Member ab 0,1 mm/Tag statt des höchsten Stundenwerts; `precipitation_probability_max` bleibt klar gekennzeichneter Fallback. Stündliche und 15-Minuten-Ansichten behalten ihre zeitintervallspezifischen Wahrscheinlichkeiten.
- Tages-PoP in Vorhersage, 7-Tage-Cockpit und Widget kompakt/überlaufsicher integriert; Herkunft ist per Tooltip nachvollziehbar.
- Worker: ICON-D2-Wetterkartenraster liefert zusätzlich 2-m-Temperatur, 2-m-relative Feuchte, Wettercode, Niederschlag und Schneefall für die Radar-Modell-Phasenklassifikation.
- Regressionen: rendererabhängige Leaflet-Prüfungen auf identische MapLibre-Fachverträge migriert und neuer kombinierter Schutztest für Kartenengine, Tages-PoP und Radar-Modell-Niederschlagsart ergänzt.

## v0.9.38.6

- Kompositbild: HymecNG-Projektion wertet ODIM `+ellps=WGS84` und `+ellps=GRS80` nun als echtes Ellipsoid statt als Kugel aus; dadurch wird das aktuelle DWD-HDF5 korrekt in Leaflet/WebMercator zurückprojiziert.
- Satellit: kontrollierter DWD-RGB/IR-Live-Snapshot als Fallback, wenn der offene 3-h-WMS-Layer keine auswertbare TIME-Dimension liefert; EUMETSAT bleibt TIME-pflichtig.
- Satelliten-Live-Snapshot erhält eine eigene Revision und wird über den Worker mit `no-store`/Cache-Buster geladen, ohne benachbarte Frames zu mischen.
- Legacy-HG (BUFR/BZip2) bleibt ausschließlich Diagnosepfad; das kartierte Niederschlagsartenprodukt bleibt das offizielle HymecNG-HDF5.
- Regressionen für WGS84/GRS80-HymecNG und DWD-Satellit ohne TIME-Dimension ergänzt bzw. bestehende Live-/Performance-Verträge angepasst.

## v0.9.38.5

- Komposit-Satellitenbild: produktspezifische Frischefenster statt pauschaler 55-Minuten-Sperre.
- Amtlicher DWD-Meteosat-3h-Layer bleibt bis zum nächsten regulären 3h-Termin als explizit zeitgestempelter Fallback sichtbar.
- EUMETSAT-NRT bleibt streng auf aktuelle explizite Zeitstände begrenzt; Snapshot-Schutz gegen Mischkacheln bleibt erhalten.

## v0.9.38.4

- Komposit/HymecNG: direkter offizieller `composite_HymecNG_LATEST_000-hd5`-Pfad vor Directory-Index, mit Root-Frischevergleich und Cache-Busting.
- HymecNG: interner HDF5-Zeitstempel, defensive 0–10-Klassencodierung und bounds-freies natives Leaflet-Tile-Rendering.
- Legacy-HG (`HG_LATEST_000.bz2`) wird nur diagnostisch geprüft; kein ungeoreferenzierter/undekodierter Ersatzlayer.

## v0.9.38.3

- Kompositbild: HymecNG-Layer-Lifecycle stabilisiert; ODIM-HDF5-Klassencodes werden mit gain/offset dekodiert und vor dem Rendern plausibilisiert.
- HymecNG: beide offiziellen DWD-Open-Data-Roots werden geprüft; nur der jüngste Stand und maximal 25 Minuten alte Live-Daten werden angezeigt.
- Satellit: ausschließlich ein explizit zeitgestempelter, frischer WMS-Snapshot; unzeitgestempeltes latest und Nachbarframe-Preloading entfernt, um alte/neue Tile-Mosaike auszuschließen.
- Neue Regression schützt HymecNG-Frische/Klassendekodierung und Satelliten-Snapshot-Konsistenz.

## v0.9.38.2

- Tagesdetaildiagramm: schlanke Leiste „Thermisches Empfinden“ zwischen Temperatur und Luftdruck, mit denselben Belastungsklassen/Farben wie im 24-h-Wetterprofil.
- Tagesdetail-Einzeldaten: thermisches Empfinden direkt unter „Temperatur / gefühlt“.
- 24-h-Wetterprofil: sichtbare Stunde-zurück/-vor-Steuerung sowie Desktop-Bedienung per Pfeil links/rechts und Mausrad über der Diagrammfläche.
- 24-h-Wetterprofil: dynamische Böen-/Hazard-Details folgen konsequent der gewählten Windeinheit.

## v0.9.38.1

- App-Neustart nach Update korrigiert: normale `midwx.app`-, Update-, Refresh- und Rollback-URLs werden nicht mehr fälschlich als Geräte-Synchronisationscode interpretiert.
- Nur explizite `#mid-sync=…`, `?mid-sync=…`, `mid-sync:…` oder eigenständige Synchronisationscodes öffnen weiterhin Einstellungen → Synchronisation.
- Neuer Regressionstest schützt den normalen Startpfad nach Service-Worker-/Update-Neustarts.

## v0.9.38.0

- Stable-Audit 10.08.2026 vollständig umgesetzt: explizite finale TypeScript- und Vite-Produktionsbuildphasen im Releasevertrag.
- Langfrist/Saisonmodelle: gemeinsamer 4-h-Cache, bis 36 h Stale-if-error und bewusster manueller Refresh für ECMWF sowie NOAA NMME/CFSv2.
- Druckniveau-Meteogramm: 15-min-TTL, 3-h-Stale-Fallback, expliziter Refresh, Memoisierung und Offscreen-Rendering-Containment.
- OPERA-Raster: begrenzter Cache fertig projizierter Viewport-Canvases nach Frame, Zoom, Bounds und Größe zur Vermeidung identischer Neuberechnungen.
- Dependency-Policy: React 18.3.1, Recharts 3.8.1, TypeScript 5.9.3 und Vite 6.4.3 reproduzierbar geschützt; größere Upgrades nur isoliert bzw. als getrennte Kompatibilitätsmigration.
- Bestehende mid-stable-Schedule-Pins und HymecNG-Dormant-/Performance-Verträge bleiben erhalten.

## v0.9.37.3

- CI-/Performance-Fix für HymecNG: die historisch gesperrten Module `HymecNgSource.ts` und `HymecNgOverlay.tsx` bleiben dormant.
- Der echte DWD-HymecNG-Kompositlayer läuft jetzt über einen separaten lazy geladenen Pfad (`CompositeHymecNgSource.ts` / `CompositeHymecNgOverlay.tsx`).
- Regression `test-interaction-performance-cleanup-08155.mjs` und HymecNG-Schutztest entsprechend abgesichert.

## v0.9.37.2

- Kompositbild: neuer echter DWD-HymecNG-Layer für "Niederschlagsart" statt recyceltem WN/Cloud-PNG.
- HymecNG wird im Komposit nativ aus dem aktuellen DWD-HDF5 gerendert, inklusive ODIM-Georeferenzierung und eigener Deckkraftregelung.
- Quellenhinweise, Legende und Komposit-Infos auf HymecNG aktualisiert.

## v0.9.37.1
- Kompositbild: den irreführenden Layer „Niederschlagsart“ vollständig entfernt. Er verwendete kein WN-/HymecNG-Radarraster, sondern recycelte das kombinierte DWD-Webbild „Wolken + Niederschlagsart“ und spannte es über feste Kartenbounds.
- Fachliche Produktkorrektur: DWD WN ist ein Reflektivitätskomposit und darf nicht als Niederschlagsart bezeichnet werden. Das aktuelle echte DWD-Produkt für die bodennahe Hydrometeorklasse ist HymecNG (HDF5).
- HymecNG wird im Komposit bewusst noch nicht aktiviert: Die vorhandene MID-Implementierung besitzt weder eine verifizierte HDF5-Klassencodetabelle noch einen anhand aktueller Dateien nachgewiesenen vollständigen Renderpfad. Es werden keine Klassen oder Georeferenzierungen geraten.
- HymecNG-Parser gehärtet: fehlende native ODIM-Projektionsdefinition führt jetzt zum Abbruch; der historische Kugel-/RADOLAN-Fallback ist entfernt.
- Das eigenständige DWD-Originalbild „Wolken + Niederschlagsart“ bleibt als separat gekennzeichnete optionale Darstellung erhalten, wird aber nicht mehr als Kartenlayer missbraucht.
- Regression `test-composite-precipitation-type-layer-09366.mjs` prüft nun explizit gegen PNG-Recycling, WN-Fehlbezeichnung und Legacy-Georeferenzierung.

## v0.9.37.0
- Radar-Nowcast: DWD-RS wird in der Enrichment-Stufe als amtlicher 1-h-Mengenanker für die ersten zwei Stunden eingebunden; RV bleibt für 5-Minuten-Timing und Intensitätsstruktur maßgeblich. Abwärtskorrekturen sind vollständig möglich, Aufwärtskorrekturen werden begrenzt.
- Radar-Nowcast: DWD-HX 250 m wird ausschließlich bei unsicheren Randtreffern zur Standorttrefferprüfung genutzt und verändert keine Niederschlagsmenge eigenständig.
- Radar-Nowcast: leichtgewichtiges Wachstum-/Zerfallsmodell und lokales Bewegungsfeld aus den bereits geladenen Radarframes ergänzt; dadurch entstehen keine zusätzlichen Radarrequests für diese beiden Schritte.
- Radar-Nowcast: 9-Member-Mikroensemble aus Timing- und Intensitätsvarianten liefert Trefferwahrscheinlichkeit sowie P25/Median/P75 der 2-h-Menge. Die Nowcast-Leiste summiert kalibrierte 5-Minuten-Mengen statt roher mm/h-Werte.
- Radar-Nowcast: frische, nahe DWD-Niederschlagsstationen dürfen die Kurzfristmenge vorsichtig nachkalibrieren; Einfluss sinkt mit Distanz, Alter, Lead Time und Konvektivität.
- Ladezeit: schneller Radar-Erstpfad bleibt unverändert; RS und Stationsabgleich laufen erst im verzögerten Enrichment, HX nur bei tatsächlichen Grenzfällen.

## v0.9.36.9
- Kompositbild: zusätzlicher Layer "Niederschlagsart" ergänzt. MID prüft jetzt vorrangig DWD HymecNG und blendet – solange keine verifizierte Klassenabbildung vorliegt – automatisch das amtliche DWD-WN-Originalprodukt als sichere Ersatzdarstellung ein.
- Für den neuen Layer gibt es einen eigenen Schalter, eine separate Deckkraftregelung sowie eine über die Komposit-Legende ausblendbare Niederschlagsart-Legende.
- Quellen-/Hinweistext des Kompositbilds und die globale Quellenliste wurden um DWD HymecNG bzw. DWD WN erweitert.
- Neue Regression `test-composite-precipitation-type-layer-09366.mjs`.

## v0.9.36.4
- 14-Tage-Ensemble-Niederschlag „kumuliert“: ENS-Mittel ist jetzt unabhängig vom Standard-/Erweitert-Modus immer als eigene gestrichelte kumulierte Linie sichtbar.
- Kumulierte Legende und Tooltip zeigen ENS-Mittel ebenfalls immer; Export-Metadaten enthalten es verbindlich.
- CI-Analyse: der gemeldete Wartungstest ist auf den exakten v0.9.36.2- und v0.9.36.3-Ständen sowie nach allen 188 davor laufenden Regressionen unter simuliertem GitHub-Actions-Umfeld reproduzierbar grün. Der zeitgleiche Dependabot-PR für Recharts 3.10.1 erklärt den roten PR-CI-Lauf, weil der Stable-Vertrag bewusst Recharts 3.8.1 festschreibt. Stable-Code wird deshalb nicht aufgeweicht.
- Neue Regression `test-ensemble-cumulative-ens-mean-09364.mjs`.

## v0.9.36.3
- 14-Tage-Ensemble-Niederschlag „kumuliert“: P10/P25/P75/P90 und ENS-Mittel werden jetzt statistisch korrekt aus den **kumulierten Niederschlagssummen jedes einzelnen Ensemblemitglieds** berechnet. Die in v0.9.36.2 verwendete Addition täglicher Quantile wurde entfernt.
- Dadurch bleibt das innere P25–P75-Band auch bei tageweise stark null-inflationiertem Niederschlag aussagekräftig und kann nicht mehr allein deshalb auf `0,0–0,0 mm` kollabieren, weil die täglichen Quartile jeweils null waren.
- Bestehende Ensemble-Caches ohne memberbasierte kumulierte Quantile werden automatisch verworfen und einmalig frisch berechnet; sonstige Cache-/Favoriten-/Nutzerdaten bleiben unangetastet.
- Tooltip, P10–P90- und P25–P75-Flächen sowie ENS-Mittel verwenden denselben kumulierten Member-Datensatz.
- Neue Regression `test-ensemble-cumulative-member-quantiles-09363.mjs`; die bisherigen kumulierten Niederschlagsverträge auf die fachlich korrekte Member-Trajektorien-Methode aktualisiert.

## v0.9.36.2
- 14-Tage-Ensemble-Niederschlag, Modus „kumuliert“: zusätzliches inneres P25–P75-Unsicherheitsband ergänzt, bewusst dunkler als der äußere P10–P90-Bereich.
- P25/P75 werden bereits in der täglichen gewichteten Niederschlags-Ensembleverteilung berechnet und anschließend analog zu P10/P90 kumuliert.
- Kumulierte Legende, Tooltip, Erklärung und Export-Metadaten um P25–P75 erweitert; die normale Tagesansicht bleibt unverändert.
- Neue Regression `test-ensemble-cumulative-rain-quartiles-09362.mjs`; Navigationsregression releasefest gemacht.

## v0.9.36.1
- Navigationskonzept umgesetzt: Mobile Schnellnavigation „Heute · Kurzfrist · 7 Tage · Mehr“, vollständiger Sektionen-Drawer, einklappbare Desktop/Tablet-Seitenleiste und fachliche Gruppen.
- Navigation nutzt weiterhin ausschließlich die bestehende Dashboard-Modulkonfiguration für Sichtbarkeit/Reihenfolge; bedingte Berg-/Wasser- sowie Profi-Module werden automatisch berücksichtigt.
- Abschnittsanker, Browser-Zurück, Auto-Expand eingeklappter Module und direkte Cockpit-Horizontumschaltung für Kurzfrist/7/14 Tage ergänzt.
- 24-h-Wetterprofil: erster Stundenpunkt erhält einen zusätzlichen inneren X-Abstand zur linken Y-Achse; Achsenbeschriftung und erster Datenpunkt überdecken sich nicht mehr.
- Neue Regression `test-section-navigation-profile-inset-09361.mjs`; ältere Geometrie-/Dashboard-Verträge auf die neue Anker- und Innenabstandslogik synchronisiert.

## v0.9.36.0
- 14-Tage-Ensemble-Niederschlag: neue optionale kumulierte Ansicht mit monoton ansteigender Best-Match-Kurve, kumuliertem P10–P90-Unsicherheitsband und optionalem kumuliertem ENS-Mittel. Die bestehende Tagesansicht bleibt Standard.
- Navigationskonzept für die wachsende Zahl an MID-Sektionen ergänzt: Dashboard beibehalten, zusätzlich Sektionen-Drawer mit fachlichen Gruppen und bestehender Modulverwaltung als Single Source of Truth.

## v0.9.35.2
- 24-h-Wetterprofil: Diagramm verwendet wieder ausschließlich stündliche Werte und beginnt mit der aktuellen Stunde; die 15-Minuten-Schritte bleiben auf Kurzfrist/Nowcast beschränkt.
- Schneefallgrenzen-Ensemble: fehlende API-Werte werden nicht mehr durch `Number(null)` fälschlich als 0 m interpretiert; der Nullgradgrenzen-Fallback greift wieder korrekt.
- Schneefallgrenzendiagramm: feste Y-Achse 0–4,5 km, bestehende Multi-Modell-/10–90-%-Unsicherheitsdarstellung bleibt erhalten.
- Schneefallgrenzendiagramm: Zeitschritte mit erwartbarem Niederschlag werden dezent als vertikale Hintergrundmarkierungen angezeigt und im gewählten Zeitschritt kompakt quantifiziert.

## v0.9.35.1
- 24-h-Wetterprofil: Diagramm startet nun bereits mit dem ersten verfügbaren Kurzfrist-Zeitschritt (15-Minuten-Raster) statt erst nach dem 90-Minuten-Block mit dem ersten reinen Stundenpunkt.
- 24-h-Wetterprofil: X-Achse auf echte Zeitabstände umgestellt, damit 15-Minuten-Punkte am Anfang und spätere Stundenpunkte proportional korrekt verteilt werden.
- 24-h-Wetterprofil: Achsenbeschriftung zeitbasiert statt indexbasiert; volle Kurzfristserie bis zum 24-h-Horizont fließt in Diagramm, Hazards und Einzeldaten ein.

## v0.9.35.0
- Langfrist: echtes numerisches Multi-Modell statt mehrerer ECMWF-Varianten. ECMWF EC46/SEAS5 wird mit allen im aktuellsten verfügbaren NOAA-NMME-ENSMEAN-Lauf direkt numerisch verfügbaren unabhängigen Modellfamilien kombiniert; CFSv2-E1/E2/E3 bleibt als Fallback erhalten.
- Langfrist: Multi-Modell-Rauchfahne gewichtet Modellfamilien gleich. Temperatur zeigt Ensemble-/Intermodell-Spanne in K; Niederschlag wird im gemeinsamen Modellvergleich als Anomalie in mm/Tag relativ zum jeweiligen Modellklima dargestellt. Einzelmodelle bleiben separat auswählbar.
- Langfrist: Monatspositionen mit zusätzlichem linken Innenabstand, damit der erste Monat nicht mit der Y-Achsenbeschriftung kollidiert.
- Berg-/Wintersport: Schneefallgrenze als einklappbare Multi-Modell-Ensemble-Schnellübersicht neu aufgebaut. Auswahl 1/3/7/14 Tage, kompakter selektierter Zeitschritt, vertikale Auswahlmarke, Modell-/Memberzahl sowie 25–75- und 10–90-%-Unsicherheitsband.
- Schneefallgrenze: Bereich oberhalb der Medianlinie blau, darunter grün; konfiguriertes Tal/Mitte/Berg als kontrastreiche Höhenlinien direkt im Diagramm.
- Schneefallgrenzen-Ensemble nutzt Open-Meteo Ensemble Mean/Spread für mehrere Systeme (u. a. ICON-EPS, ECMWF IFS/AIFS, GEFS, GEM/GEPS, WeatherNext soweit am Standort verfügbar); Best Match bleibt als Fallback erhalten.
- Neuer Worker-Endpunkt für NOAA-NMME/CFSv2-Monatsanomalien mit NetCDF-Classic-Punktparser und 6-h-Edge-Cache.
- Neue Regression `test-true-multimodel-snowline-09350.mjs`; bestehende Langfrist-Verträge auf echtes Modellfamilien-Multi-Modell aktualisiert.

## v0.9.34.1
- Buildfix Langfrist: drei ältere Regressionstests prüften fälschlich exakt auf v0.9.33.2 und blockierten dadurch jede spätere Releaseversion. Die Verträge prüfen jetzt Baseline-Synchronität und mindestens den Einführungsstand v0.9.33.2.
- Neuer Schutztest sichert die releasefeste Langfristprüfung, die Multi-Modell-Rauchfahne und die Schneefallgrenzen-Schnellübersicht ab.

## v0.9.32.22

- Niederschlagsformen appweit konsolidiert: Tageskarten verwenden die zentrale phasentreue Niederschlagsart statt pauschal „Regen“/„Schauer“.
- Schneefall wird bei vorhandenem Modellfeld zusätzlich kompakt in cm angegeben (`mm · ❄ x,x cm`) und ersetzt die Niederschlagsmenge in mm nicht.
- Kurzfrist-, 24-h-, Tages-, Detail-, Meteogramm-, Ensemble-, Wasserwetter- und Widgetausgaben auf die gemeinsame Mengenformatierung umgestellt, soweit Schneefalldaten verfügbar sind.
- Neue Regression schützt Schnee, Schneeschauer, Schneeregen, Schneeregenschauer, Schneegriesel, gefrierende Formen und die zusätzliche cm-Ausgabe.

## v0.9.32.20

- Kompositbild: EUMETSAT EUMETView bleibt die direkte Primärquelle für MTG-FCI-RGB/GeoColour; die Produktauswahl priorisiert nun den tatsächlich jüngsten nominellen Satellitenstand vor einer bloßen Quellenpriorität.
- Satelliten-/Radar-/Blitz-WMS-Raster werden während eines Zoomvorgangs wieder vollständig ausgehängt und nach `zoomend` mit einem neuen Cache-/Layer-Schlüssel aufgebaut. Damit wird eine frühere Schutzlogik aus v0.7.34/v0.7.35 wiederhergestellt, die im aktuellen Code versehentlich zu `tileRevision=0` / `rasterZooming=false` zurückgefallen war.
- Satelliten-Layer behalten keine WMS-Kacheln über Zoomstufen hinweg (`keepBuffer=0`, kein Update während Zoom).
- Für EUMETView-Produkte ohne belastbare Zeitdimension wird kein alter `latestTime` mehr als `TIME` erzwungen. Stattdessen wird der offizielle WMS-Default „latest“ genutzt und bei jedem Metadatenrefresh mit einem neuen MID-Token neu geladen.

## v0.9.32.19
- 24-h-Wetterprofil: UVI platzsparend in die bestehende Einzeldatenzeile „Wolken H/M/L + UVI“ integriert; der UVI wird aus demselben Best-Match-Zeitschritt wie die übrigen Einzeldaten übernommen.
- 24-Stunden-Leiste auf Handydisplays deutlich flacher konsolidiert: kleinere Abstände, kompaktere Tages-/Zeit-/Temperaturdarstellung, kleinere Piktogramme und engere Niederschlags-/Windzeilen, ohne Wetterparameter zu entfernen.

## v0.9.32.18
- Buildfix der quota-sicheren Wetterzwilling-Archivwarteschlange: `mirrorStore()` behält seinen Erfolgsstatus für Sicherheitsentscheidungen, die Queue verwirft diesen Rückgabewert jedoch korrekt und bleibt `Promise<void>`-kompatibel.
- Keine funktionale Rücknahme der in v0.9.32.17 eingeführten Storage-/Quota-Sicherung.

## v0.9.32.17
- Nachhaltige Quota-Sicherung: zentrale lokale Speicherverwaltung mit automatischer Bereinigung ausschließlich rekonstruierbarer Caches, Retry des ursprünglichen Schreibvorgangs und zusätzlicher IndexedDB-Spiegelung dauerhafter Nutzerdaten.
- Favoriten und andere dauerhafte Einstellungen bleiben auch dann erhalten, wenn Safari/iOS `localStorage` vorübergehend nicht mehr beschreiben kann.
- Wetterzwilling-Langzeitdaten bleiben vollständig in IndexedDB/Sync erhalten; nur die redundante lokale Schnellstartkopie wurde platzsparend begrenzt.

## v0.9.32.16
- 24-h-Kurzfristkacheln vollständig auf denselben 24-Stunden-Datensatz wie die sichtbare 24-h-Leiste umgestellt; keine 12-h-/Gesamtdatensatz-Mischung mehr.
- Favoriten-Synchronisation mit eigener Favoritenrevision abgesichert: ältere Favoritenlisten aus anderen verbundenen Safari-/PWA-Instanzen können neuere lokale Favoriten nicht mehr zurücksetzen.
- POI-Favoriten erkennen nahe Namensvarianten mit gemeinsamen Kernbegriffen robuster, z. B. Sponsorenpräfixe bei Stadien.

## v0.9.32.15
- Favoriten-Dauerhaftigkeit: Hinzufügen/Entfernen über den Stern wird jetzt sofort in `mid:favorites` persistiert, statt erst nach dem verzögerten Idle-Speicherfenster. Das schließt insbesondere unter iOS/PWA eine Suspend-/Reload-Lücke.
- Favoritenidentität für POIs präzisiert: gespeicherte Orte werden über exakte Koordinaten/stabile ID bzw. gleichen Namen mit enger Toleranz (POI 120 m, sonst 450 m) erkannt. Die bisherige allgemeine 350/900-m-Nahbereichslogik bleibt nur für GPS-/Standorttracking erhalten.
- Dadurch können nahe, aber unterschiedliche POIs nicht mehr gegenseitig als derselbe Favorit behandelt oder versehentlich entfernt werden.
- Neue Regression `test-favorite-durable-poi-093215.mjs`; ältere Favoriten-Navigationstests auf die Trennung zwischen Favoritenidentität und GPS-Nähe synchronisiert.

## v0.9.32.14
- `MID-ribbons-ui-text-cleanup.patch` angewendet: redundante Erklärtexte in Kurzfrist-, 7-/14-Tage-Ribbons und 24-h-Wetterprofil entfernt bzw. gekürzt; Drucktrend-/Nebel-Signalkarten ohne zusätzliche Erklärungssätze.
- DWD „Wolken + Niederschlagsart“: Zoom in festen 100-%-Schritten von 100 bis 500 % erweitert.
- Zoom-Sicherheit auf Touchgeräten verbessert: vertikales Overscroll-Chaining zurück zur App und stets erreichbarer 100-%-Reset über dem Bildfenster verhindern ein Festhängen im vergrößerten Originalbild.

## v0.9.32.13
- CI-/Regression-Fix für die in v0.9.32.12 bewusst auf 5-Minuten-Niederschlagsmengen umgestellte Radar-Nowcast-Skala.
- Drei ältere Schutztests auf den neuen Sollvertrag synchronisiert: Achse `mm/5 min`, Balkenhöhe aus der jeweiligen 5-Minuten-Menge und aktuelle Releaseversion.
- Die neue Radar-Nowcast-Darstellung selbst bleibt unverändert.

## v0.9.32.12
- Radar-Nowcast-Leiste: y-Achse auf Niederschlagsmenge je 5-Minuten-Balken umgestellt (`mm/5 min`) statt auf stündliche Rate.
- Balkenhöhen orientieren sich nun direkt an der prognostizierten bzw. beobachteten 5-Minuten-Menge je Balken; dadurch bleiben schwache Signale sichtbar, ohne überhöht zu wirken.
- Umfeld-/Nahbereichsechos ohne direkten Standorttreffer bleiben weiterhin erkennbar, werden aber deutlich zurückhaltender dargestellt.

## v0.9.32.10
- Buildfix für die kombinierten Kurzfrist-/7-Tage-Mini-Diagramme: `tempMin` wird in beiden Temperatur-Skalierungen wieder korrekt definiert.
- Regression ergänzt, die diesen TypeScript-Buildfehler künftig verhindert.

## v0.9.32.9
- Cockpit-Registerkarten „Kurzfrist“ und „7 Tage“: Mini-Diagramme zu einem kombinierten Verlauf zusammengeführt. Temperaturtrend und Niederschlagsbalken werden nun jeweils in einem gemeinsamen, kompakteren Mini-Chart dargestellt und ersetzen die getrennten Darstellungen.

## v0.9.32.8
- 24-h-Wetterprofil: Tmin- und Tmax-Markierungen im Temperaturfeld vergrößert, mit stärkerem Kontrast/Halo versehen und vertikal etwas weiter vom Kurvenverlauf abgesetzt, damit die Werte auf mobilen Displays besser lesbar sind.

## v0.9.32.7

- 24-h-Wetterprofil: Zeitangaben in den oberen Signalkarten verwenden jetzt wie die unteren Kurzfristfelder „heute“ bzw. „morgen“ vor der Uhrzeit.
- Betrifft insbesondere Nebel-/Sichtsignal und „Stärkste Einschränkung“; Datumsanhänge hinter der Uhrzeit entfallen dort.

## v0.9.32.6

- 24-h-Wetterprofil: „Wetterberuhigung“ vollständig entfernt; stärkstes Warnsignal wird als „Stärkste Einschränkung“ ausgewiesen.
- Wetter-Hazards verwenden nun direkt die zentrale appweite MID/DWD-Warnauswertung samt identischen Warnschwellen und Warnfarben.
- Zustand der 24-h-Legende wird favoritenübergreifend in `localStorage` gespeichert und beim nächsten Standort/Favoriten wiederhergestellt.
- Header-Pille „Stündlich · ein Blick“ entfernt; 24-h-Leiste ohne Hinweis „Seitlich wischbar …“.
- Sämtliche y-Achsenbeschriftungen und Einheiten des Wetterprofils auf die linke Diagrammseite verlegt.
- Temperaturkurve: Tagesmaximum nur bei tatsächlich im Anzeigeintervall liegendem Tagesmaximum; nächtliches Minimum nur einmal je zusammenhängender Nacht.
- Info-Schaltfläche der Einzeldaten platzsparend direkt in die Titelzeile integriert.
- Kurzfrist-Spotlights kennzeichnen Uhrzeiten jetzt explizit mit „heute“ bzw. „morgen“.
- Neue Regression `test-mid-weather-profile-ux-hazards-09326.mjs`; bestehende Wetterprofil-Verträge auf den neuen Sollstand synchronisiert.
- Vollständige Regression: 331/331 Tests bestanden.

## v0.9.32.5

- 24-h-Einzeldaten: Füllwort „signifikant“ aus den negativen Risiko-/Hazard-Angaben entfernt („kein Risiko“, „keine Wettergefahren“).
- Schwüle wird nur noch bei tatsächlich erfüllter Mehrfaktorenlage angezeigt; bei unauffälliger Lage heißt das Feld ausschließlich „Taupunkt“.
- Die frühere starre Schwüleprüfung `Td ≥ 17 °C` wurde durch eine DWD-orientierte Mehrfaktorenbewertung ersetzt: Wasserdampfdruck aus Taupunkt/Feuchte als Feuchtekern, Luft- und gefühlte Temperatur, Windentlastung sowie Strahlungsproxy aus Sonnenscheindauer/Bewölkung.
- Kräftiger Wind kann grenznahe Schwülelagen abschwächen; starke Feuchte bleibt dabei robust berücksichtigt.
- Fachhinweis hinter (i) auf die Grenzen gegenüber dem vollständigen Klima-Michel-Verfahren präzisiert.
- Neue Regression `test-mid-weather-profile-sultry-09325.mjs`; ältere Wetterprofil-Verträge entsprechend synchronisiert.

## v0.9.32.4

- 24-h-Wetterprofil: Info-Schaltfläche bereinigt; nur noch das eigentliche Informationssymbol wird angezeigt.
- Responsivitätsfix für das 24-h-Wetterprofil: Canvas-Höhe passt sich der real verfügbaren Breite an; übergroßer Leerraum auf mobilen Displays entfällt.
- Touch-Bedienung des Wetterprofils robuster gemacht; Zeitschritte reagieren direkter auf Taps/Touches.
- Zeitlabels oberhalb des Profils folgen jetzt einem regelmäßigen Raster statt ungleichmäßiger Abstände.
- Tages-Tmin/Tmax werden je Kalendertag als Zahlenwert am Verlauf markiert, jedoch nur innerhalb des tatsächlich sichtbaren Anzeigeintervalls.
- Wetterpiktogramme im Profil ohne querlaufenden Hintergrundstreifen; Windpfeile etwas dezenter.
- Wolkenbänder H/M/L ohne zusätzlichen kontrastreichen Hintergrund; Kontrast entsteht nur noch durch echte Bewölkungsanteile.
- Versions- und Regressionsstand vollständig auf v0.9.32.4 synchronisiert; 329/329 Tests bestanden.

## v0.9.32.3

- 24-h-Wetterprofil: vertikale Abstände oberhalb des Diagramms reduziert; Stunden-, Kalender- und Piktogramme rücken näher an die Grafik.
- Temperaturachse auf runde Tickwerte umgestellt; Tagesmaximum und -minimum im sichtbaren Zeitraum werden direkt im Temperaturverlauf markiert.
- Stündliche Wetterpiktogramme vollständig dargestellt; Zeitlabels oberhalb des Diagramms auf kleinen Viewports entzerrt.
- Wolkenbänder optisch neutralisiert: gleicher Hintergrund für H/M/L und kontrastreichere Bewölkung, damit die tatsächliche Ausprägung klarer erkennbar bleibt.
- 24-h-Signalkarten nur noch bei fachlichem Bedarf sichtbar; „Ruhiges Fenster“ verständlich in „Wetterberuhigung“ umbenannt.
- Legende jetzt ein-/ausblendbar; Erklärtexte über ein (i) erreichbar.
- Einzeldaten kompakter gefasst: Temperatur+gefühlt, Taupunkt+Schwüle sowie Sichtweite+Nebelrisiko jeweils kombiniert.
- CI-/Regression-Verträge auf den neuen v0.9.32.3-Sollstand synchronisiert; kein Test pinnt mehr die Vorgängerversion v0.9.32.2. Neue Layout-Schutzregression ergänzt.

## v0.9.32.2

- 24-h-Wetterprofil: Achsen optisch und funktional verfeinert.
- Temperatur links mit sauberer °C-Skala und Tickmarken; Niederschlag und Wind rechts mit eigenen Einheiten/Skalen.
- Zeitachse mit Grundlinie, Ticks und klareren Tageswechseln; Rasterlinien ruhiger abgestimmt.

## v0.9.32.0
- 24-h-Wetterprofil mit klickgebundener senkrechter Zeitschrittmarkierung erweitert; Zeitangaben nach Tageswechsel tragen zusätzlich das Datum.
- Wolkenbasis-Näherung entfernt. Temperaturdifferenzen werden fachgerecht in Kelvin ausgewiesen.
- Neues Band „Thermisches Empfinden“: Best-Match-Gefühlte-Temperatur wird nach den DWD-Klassen von sehr kalt bis sehr heiß eingeordnet; Einflussfaktoren wie Windkühlung, Feuchte und Sonneneinstrahlung werden transparent benannt.
- Thermische Belastung und Wetter-Hazards fachlich getrennt; Nebel/Sichteinschränkung, Gewitter, Niederschlagsgefahren und Wind/Böen verbleiben im Hazard-Band.
- Windrichtungspfeile für jeden 24-h-Zeitschritt ergänzt und analog zur bestehenden MID-Warnlogik grün bzw. nach Warnstufe eingefärbt.
- Wolkenschichten als lückenlose H/M/L-Bänder (H oben, L unten) mit zeitlichem Fading dargestellt; markante sprunghafte Bewölkungsänderungen bleiben als schärferer Übergang erhalten.
- Ensemble-Temperaturdiagramm: Sonnenscheinband neu kalibriert; ≤ 50 % der astronomisch möglichen Sonnenscheindauer entspricht bereits Grau, 50–100 % bildet den Verlauf bis Gelb ab.
- Neue Regression `test-mid-weather-profile-thermal-sun-09320.mjs`; v0.9.31.0-Wetterprofilregression auf die bewusst entfernte Wolkenbasis synchronisiert.

## v0.9.31.0
- Wolken + Niederschlagsart: im DWD-Abdeckungsgebiet wieder das amtliche DWD-Kombinationsbild als unveränderte Quelle; 100–300 % Zoom mit verschiebbarem Bildfenster und bildgebundenen Radar-/Satellitenzeitständen.
- 24-h-Meteogramm durch ein gemeinsames Wetterprofil für Temperatur/Gefühlt/Taupunkt, Niederschlag/Wahrscheinlichkeit, Wind/Böen, Wolkenschichten und Wetterbelastung ersetzt.
- Abgeleitete Nutzersignale ergänzt: ruhiges Wetterfenster, 6-h-Drucktrend, Feuchte-/Nebelhinweis, Wetterbelastungsindex und gekennzeichnete T–Td-Wolkenbasis-Näherung.
- Betroffene Altregressionen auf die neue Sollarchitektur synchronisiert; zusätzliche Regression `test-mid-original-dwd-weather-profile-09310.mjs`.

## v0.9.22.1
- Buildfix für das DWD-Niederschlagsarten-Radar: `RadarMeta` und `RadarPointInfo` erfüllen jetzt den `WorkerPayload`-Vertrag von `fetchWorkerJson`, wodurch die TypeScript-Fehler TS2559 im Produktionsbuild beseitigt werden.
- Neue Regression `test-dwd-radar-worker-payload-buildfix-09221.mjs` sichert die WorkerPayload-Kompatibilität dauerhaft ab.

## v0.9.22.0
- DWD-Niederschlagsarten-Radar geometrisch neu kalibriert: Standortposition linear an die geografischen Bildgrenzen gekoppelt, um die bisherige systematische Südverschiebung durch eine ungeeignete Web-Mercator-Interpolation zu beseitigen.
- Radar-Komposit erweitert um Bild-/Kompositzeitstände, semitransparente Legende, transparenten ein-/ausblendbaren Standortmarker und eine Klickanalyse für Niederschlagsklasse sowie Wolkensignal am Bildpunkt.
- Wetterkartenmodul auf reine DWD-Modell-/Nowcastkarten bereinigt: Meteosat/Satellitenkarte entfernt, explizite Zeitschrittauswahl ergänzt, NowCastMIX-Karten für signifikantes Wetter geprüft/erweitert und die öffentlich verfügbaren ICON-, ICON-EU-, ICON-EPS- sowie AICON-WMS-Serien verbreitert.
- DWD-WMS-Layerabgleich im Worker namespace-robust gemacht und Radar-Metadaten-/Punktanalyse-Endpunkte ergänzt.
- Wetterkarten-Regression `test-weather-maps-module-09210.mjs` an die neue reine Modellkartenarchitektur angepasst; zusätzliche Interaktionsregression `test-radar-weather-maps-interaction-09220.mjs` ergänzt.

## v0.9.21.2
- Regression-Fix für das Wetterkartenmodul: `test-weather-maps-module-09210.mjs` prüft die Versionskonsistenz nun dynamisch statt die Ursprungsreleaseversion `0.9.21.0` fest zu verdrahten.
- Package-, Baseline- und Worker-Version müssen übereinstimmen; Folgereleases ab v0.9.21.0 bleiben damit testbar.
- Behebt den GitHub-Actions-Abbruch beim Installieren von v0.9.21.1.

## v0.9.21.1
- DWD-Niederschlagsarten-Radar: Ortsausschnitt und Standortmarker verwenden jetzt dieselbe ungerundete Mercator-/Bounding-Box-Projektion. Das Bild wird über eine echte Bildtransformation exakt auf den aktiven Ort zentriert; die bisherige CSS-Background-Positionierung mit systematischem Versatz entfällt.
- DWD-Niederschlagsarten-Radar: vollständige Klassenlegende gemäß DWD-Produkt hinter einem kompakten `(i)` ergänzt (großer/kleiner Hagel, Graupel, gefrierender Regen/Sprühregen, Schnee/Schneeregen, Regen/Sprühregen, nicht klassifizierbar, kein Niederschlag).
- Kurzfristmeteogramm: Wetterpiktogramme liegen nun direkt im SVG-Koordinatensystem des Temperaturgraphen und verwenden exakt dieselben X-Punkte. Dadurch laufen Piktogramme bei responsiver Skalierung nicht mehr vom Graphen auseinander.

## v0.9.21.0
- Start-/Splashscreen mit deutlich größerem, responsivem MID-Logo und ruhigerem Startbildschirm überarbeitet.
- Optionales Wetterkartenmodul für den erweiterten Modus ergänzt; standardmäßig deaktiviert und über die Dashboard-Einstellungen aktivierbar.
- DWD-WMS-Auswahl für ICON-EU, ICON, ICON-EPS, NowCastMIX und Meteosat mit Karten-, Modell-, Zeitschritt-, Druckflächen-, Basiskarten- und Deckkraftsteuerung ergänzt.
- Worker um freigegebene, validierte Wetterkarten-WMS- und Metadaten-Endpunkte erweitert.

## v0.9.20.1
- Buildfix: drei Cockpit-Meteogrammregressionen an das aktuelle Vollbreitenlayout und Einzeldatenfeld synchronisiert.
- CSS-Prüfungen der betroffenen Regressionen whitespace- und formatierungsrobust gemacht, ohne die fachlichen Layoutverträge abzuschwächen.
- Neue Meta-Regression `test-cockpit-regression-sync-09201.mjs` schützt die Synchronisierung dauerhaft.
- DWD-Niederschlagsarten-Radar aus v0.9.20.0 unverändert beibehalten; dessen Regression akzeptiert nun Folgereleases ab v0.9.20.0 statt nur exakt v0.9.20.0.

## v0.9.19.2
- 24-h-Meteogramm und erweiterte Einzeldaten auf die veröffentlichte Stable-Codeoptimierung v0.9.19.0 portiert.
- Automatisierte Code-Revisions-, Live-, API-, Browser- und Build-Budget-Prüfungen aus v0.9.19.0 beibehalten.

## v0.9.18.7
- Kurzfrist-Meteogramm optisch an der meteorologischen Vorlage ausgerichtet: Hauptzeitachse jetzt mit sauberer 6-Stunden-Beschriftung bei weiterhin stündlicher Datenauflösung.
- Overlay-Positionen für Zeit, Tageslabel, Wetterpiktogramme, Windfiedern und Hitlayer auf prozentuale Breiten-Skalierung umgestellt, damit Mobil- und Desktop-Layout korrekt mit dem SVG mitlaufen.
- Meteorologische Windfiedern im 24-h-Meteogramm präziser an der Zeitachse ausgerichtet; Datum/Zeitachse und Windreihe bleiben nun vollständig sichtbar.
- Neue Regression: responsive Meteogramm-Overlay-Skalierung und 6h-Hauptzeitachse abgesichert (`scripts/test-cockpit-meteogram-overlay-scale-09186.mjs`).

## v0.9.18.5
- Buildfix: Windfiedern verwenden die gültige interne WindUnit `kn`; ungenutzter ForecastCockpit-Windpfeil-Helfer entfernt.
- Fix: Die Screenreader-Hinweistexte der Kurzfrist-Hitlayer werden wieder korrekt versteckt und erscheinen nicht mehr im 24-h-Meteogramm.
- Fix: Die optische Auswahlumrandung im 24-h-Meteogramm wurde entfernt; die Einzeldatenkarte bleibt als primäres Feedback erhalten.
- UI: Plotgeometrie des 24-h-Meteogramms nachgeschärft, um die Darstellung auf schmalen Displays vollständiger und kompakter auszubalancieren.

## v0.9.18.5
- Kurzfrist-Meteogramm: Titel auf „24-h-Meteogramm“ verkürzt.
- Kurzfrist-Meteogramm: überlagernde Auswahlumrandung entfernt und Einzeldatenfeld unter dem Diagramm wiederhergestellt.
- Kurzfrist-Meteogramm: 24-h-Vollansicht für alle Displaybreiten beibehalten und Beschriftung auf Einzeldatenfokus präzisiert.

## v0.9.18.2
- Buildfix: acht veraltete Cockpit-Regressionen auf den bewusst entfernten 1-h/3-h-Schalter, das entfernte Zusatzdatenfeld und das nun vollbreit skalierende Meteogramm synchronisiert.
- Kurzfrist-Meteogramm dauerhaft auf einstündige Darstellung umgestellt; 1 h-/3 h-Schalter entfernt.
- Diagrammbereich bereinigt: zusätzliche störende Textlayer am/über dem Plot entfernt.
- Meteogramm auf vollbreit skalierende Darstellung umgestellt, sodass es ohne horizontales Scrollen vollständig sichtbar bleibt.
- 24-h-Leiste erneut komprimiert und flacher gestaltet.

## v0.9.18.1
- Buildfix: ungenutzten Alt-Helfer `shortTermVisibilityText` nach Entfernung der redundanten Detailkarte beseitigt; TS6133 verhindert.
- Kurzfrist-Meteogramm bereinigt: störenden Detailtext aus dem Diagrammbereich entfernt.
- Zusätzliches Detailfeld zwischen Legende und 24-h-Leiste entfernt.
- Datenfeld unter dem Diagramm komprimiert (ganzzahlige Temperaturen, Wind inkl. Böenspitze, Luftdruck statt Böen-Zeile).
- 24-h-Leiste weiter abgeflacht und kompakter gestaltet.

# MID v0.9.18.0

- Kurzfristdiagramm im Cockpit vollständig als eigenständiges, hochauflösendes Meteogramm neu aufgebaut.
- Dark Mode und Light Mode erhalten nun jeweils eigene, kontraststarke Meteogramm-Farbvariablen.
- Temperatur wird als ECMWF-Farbverlauf dargestellt; die gefühlte Temperatur bleibt als neutrale gestrichelte Vergleichslinie erkennbar und wird nicht als Tmin/Tmax-Farbcodierung interpretiert.
- Desktop zeigt ein echtes Overlay, Mobilgeräte eine separate kompakte Detailbox unterhalb des Diagramms.
- Alte kollidierende Diagramm-CSS-Klassen werden nicht mehr verwendet; dadurch entfallen die schwarze, leere Plotfläche und die seitlich herausgerückte Legende.
- Der TS5076-Regressionscheck ist jetzt vollständig deterministisch und ohne lokale TypeScript-Pfade.

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

## 0.9.66.8

- DACH-Gefahrenflächen sind native MapLibre-MultiPolygone; ein separater Beschriftungs-Rasterlayer rendert Grenzen, Länder-, Regions- und Städtenamen darüber.
- Datumsübergreifende Zeitfenster zeigen Start- und Enddatum eindeutig, „Gefrierhöhe“ heißt im Extremwetter-Ausblick nun „Nullgradgrenze“, und Popup-/Diagnosefelder sind kontrastreicher und größer gesetzt.
- Änderungen an Sichtbarkeit und Reihenfolge der Dashboard-Sektionen werden synchron und mit funktionalen Zustandsänderungen gespeichert, sodass sie einen App-Neustart zuverlässig überstehen.

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

## 0.9.39.10
- Installer erkennt leere, falsche oder CRC-beschädigte Release-ZIPs vor dem Entpacken und protokolliert Größe/SHA-256.

## 0.9.39.11
- Release-Prebuild verändert `.github/workflows` nicht mehr automatisch; damit blockiert GitHub den Release-Push nicht mehr wegen fehlender Workflow-Schreibberechtigung.
- Workflow-Synchronisierung bleibt ausschließlich als expliziter Maintainer-Befehl verfügbar.
- Kanonischer Installer schließt `.github/**` zusätzlich ausdrücklich aus automatischen Release-Commits aus.

## 0.9.40.8
- Kompositbild: „Stand“ der Satellitenebene nutzt bei DWD-Live-Snapshots jetzt den tatsächlichen Produktzeitstempel statt der aktuellen Gerätezeit.
- Niederschlagsart-Radar/Kompositphase robuster gemacht: leichte und grenzwertige Echos werden vorsichtig mitberücksichtigt, die Radar-/Modellfusion sampelt dichter und blendet Signale dadurch deutlich seltener fälschlich aus.
- Radar-Farbtabellen für 1-km-/250-m-Radar erweitert: zusätzliche professionelle Varianten (u. a. DWD Standard, DWD Starkregen, NEXRAD Classic, Canada 14-stufig, Europa Spektrum) mit Vorschau und Auswahl in den Einstellungen.

## 0.9.40.10
- CI-Fix für den v0.9.40.9-Release: die drei fehlgeschlagenen Regressionen für Komposit-Phasensicherheit, MapLibre-Niederschlagswahrscheinlichkeit und kompakte Wetterwerte sind wieder erfüllt.
- Niederschlagsart-Radar: Unsichere/„eingeschränkte“ Phasen bleiben transparent und das Modellraster bleibt ohne künstliche Unterteilung. Die Echoerkennung prüft stattdessen mehrere OPERA-Radarpunkte innerhalb jeder Modellzelle; bei starken Echos kann eine eindeutig warme bzw. kalte thermische Phase konservativ ergänzt werden.
- Niederschlagswahrscheinlichkeit: Ensemble-Tageswerte bleiben kompakt als 00–24 h sichtbar; der ausführliche Titel verwendet wieder die geschützte DWD-24-h-Terminologie und nennt 00–24 h explizit als Zeitraum.
- Best-Match-Fallback in engen Karten wieder auf die kurze Darstellung „bis x %“ zurückgeführt.

## 0.9.40.11
- CI-Fix für die app-weite Niederschlagswahrscheinlichkeit: der Ensemble-Tageswert trägt wieder exakt den geschützten Titel „DWD-Ereigniswahrscheinlichkeit · 00–24 h“.
- Der Best-Match-Stundenfallback ist wieder eindeutig als „max. Std.“ gekennzeichnet; damit wird ein Stundenmaximum nicht als 24-h-Ereigniswahrscheinlichkeit missverstanden.
- Die in v0.9.40.9/10 eingeführte app-weite 00–24-h-/6-h-Logik bleibt unverändert erhalten; ausschließlich die geschützte Semantik der Titel und Fallback-Kurztexte wurde repariert.

## 0.9.40.12
- Tagesübersichten vereinfacht: Niederschlagswahrscheinlichkeit zeigt entweder den 00–24-h-Wert oder – ausschließlich bei einem klar um mindestens 10 Prozentpunkte erhöhten 6-h-Fenster – nur dieses Zeitfenster. Keine Doppelanzeige mehr.
- Dieselbe exklusive 00–24-h-/6-h-Logik gilt in klassischer Prognose, Cockpit, Widget und Ensemble-Tagesübersichten.
- Niederschlagsdauer wird in Tagesübersichten auf ganze Stunden gerundet; Detailansichten behalten die feinere 15-Minuten-Auflösung.

## 0.9.40.13
- Kompositbild: DWD-Satelliten-Live-Snapshots erhalten ihren angezeigten Stand aus dem tatsächlichen DWD-OpenData-Satellitenquellzeitpunkt statt aus der Abfrage-/Gerätezeit; eine künstliche 3-Stunden-Abrundung entfällt.
- Radar-Farbtabellenwahl aus den Einstellungen entfernt. 1-km-WMS sowie lokal gerendertes 250-m-/OPERA-Radar verwenden wieder ihre fest vorgegebenen Standardfarben.
- Neue appweite Zeitbasis unter Einstellungen: Lokalzeit (Standard) oder Z-Zeit/UTC. Wetter-, Radar-, Warn-, Diagramm-, Wasser-, Berg-, Meteogramm- und technische Zeitangaben folgen der Auswahl; die Ortszeit im Standortkopf bleibt bewusst lokal.
- Niederschlagsart im Kompositbild auf ein semitransparentes Symboloverlay umgestellt: kleine Symbole markieren nur Mischphase, Schnee und gefrierenden Niederschlag auf dem jeweils aktiven Radarbild; reiner Regen erhält kein Zusatzsymbol. Die vorhandene Deckkraftregelung unter der Karte steuert die Symboltransparenz.

## 0.9.52.4
- CodeQL-Cleanup: letzter produktiver `Math.random()`-Fallback in der Favoriten-ID-Erzeugung durch Web-Crypto ersetzt.
- Neue Regression verhindert unsichere Zufallsquellen im Produktionscode.

## 0.9.53.34
- Abgelaufene Events appweit erkennbar, ortszeitzonengerecht sortiert und direkt entfernbar; automatische Wetteraktualisierung endet mit Event-Ende.
- Theme-gerechter Splashscreen mit deutlich größerem vollständigem MID-Logo und kurzer kanonischer Startdaten-Vorladung.

## 0.9.53.35
- Produktionsbuild-Fix für v0.9.53.34: unbenutzten `EventCenterRecord`-Typimport in `eventWeatherRefresh.ts` entfernt (`TS6133`).
- Event-Lifecycle und Splashscreen-Funktionen aus v0.9.53.34 bleiben unverändert erhalten.

## 0.9.53.37
- Hyperlokale 2-m-Temperatur um einen robusten, begrenzten direkten Messkonsens gegen fehlerhafte Zielpunktgradienten ergänzt; kein Einzelstations-/Flughafen-Zwang und kein pauschaler Nachtabschlag.
- Current-Diagnose zeigt tatsächliche Temperatur-Messpunkte, temperaturbezogenen Radius, Quellenintervalle und ggf. die zusätzliche Messkonsens-Rückführung.
- Verbindlicher Kosten-Governance-Vertrag: keine kostenpflichtigen MID-Schritte ohne vorherige transparente Kosteninformation und ausdrückliche Freigabe; Free/Open first.

## 0.9.53.39
- Current-Temperatur gegen Rücksprünge zwischen schnellem Beobachtungs- und nachgelagertem Hyperlokal-Full-Pass abgesichert; jüngere feldbezogene Temperaturbeobachtungen werden nicht mehr durch ältere, nur formal reichhaltigere Analysezustände verdrängt.
- Fast-/Full-Stationscaches übergeben frische Rohkandidaten kurzzeitig im Speicher und verwenden eine neue Stationsanalyse-Cachegeneration; `forceFresh` umgeht auch die transienten Stationsanalysecaches, ohne Quellen-TTLs oder periodischen Traffic zu erhöhen.
- Starker, frischer und räumlich kohärenter Mehrstationskonsens darf einen deutlichen Tages-Gradientenfehler stärker korrigieren; schwache/alte/weite oder widersprüchliche Evidenz sowie Einzelstationen bleiben konservativ begrenzt.
- Current-, 90-Minuten- und 24-Stunden-Temperaturpfad explizit vereinheitlicht und regressionsgeschützt. Die gefühlte Current-Temperatur folgt dem lokalen Temperaturversatz; temperaturbezogene Diagnosechips erscheinen nur bei tatsächlich frischem Temperaturanker.

## 0.9.53.41
- CI-Fix für v0.9.53.40: vier veraltete Regressionserwartungen mit dem einmaligen Current-/Hyperlokalpfad synchronisiert.
- 24-h-Wetterprofil verwendet wieder exakt 24 bereits finalisierte Stunden ab der aktuellen Stunde und wendet keinen zweiten synthetischen Current-/Stationsanker an.
- Current, 90-Minuten-Leiste, Kurzfrist und 24-h-Profil bleiben dadurch auf derselben kanonischen Temperaturreihe; Folgetag-Zeitkontext und Cockpit-Redundanzbereinigung aus v0.9.53.40 bleiben erhalten.

## 0.9.53.42
- Produktionsbuild-Fix: verwaisten `bridgeObservedTemperature`-Import aus `ForecastCockpit.tsx` entfernt; verhindert `TS6133` bei aktiviertem `noUnusedLocals`, ohne den kanonischen Current-/90-Minuten-Temperaturpfad zu verändern.
- Appweite Interaktionsstandardisierung ergänzt: konsistente mobile Textskalierung, Touch-/Tap-Verhalten, Disabled-Zustände, native Akzentfarbe sowie Reduced-Motion- und Forced-Colors-Unterstützung.
- Neue Required Regressionen schützen Build-Hygiene und die gemeinsamen UI-Grundregeln; keine zusätzlichen Wetterabrufe oder Worker-Funktionsänderungen.

## 0.9.53.43
- Appweites Designsystem mit zentralen Tokens für Abstände, Radien, dichte Typografie und semantische Statusfarben eingeführt.
- Wiederkehrende Pills/Badges geometrisch vereinheitlicht; Event-, Warn-, Modellquellen-, Wetterzwilling- und Push-Status auf gemeinsame Bedeutungsfarben abgebildet.
- Gemeinsames `MidDisclosure`-Primitiv eingeführt und für Analysewerkzeuge sowie Event-Detail-/Modellstandansichten verwendet; geschützte Spezial-Disclosures bleiben unverändert.
- Keine Wetterdaten-, Cache- oder Worker-Funktionsänderung und keine zusätzlichen Requests.
## 0.9.53.44
- Produktionsbuild-Fix für das gemeinsame `MidDisclosure`: `defaultOpen` wird nicht mehr als ungültiges DOM-Attribut an `<details>` weitergereicht.
- Initialer Öffnungszustand läuft über React-State; `open` und `onToggle` halten native Nutzerinteraktion und React-Zustand synchron.
- Neue Required Regression schützt den konkreten `TS2322`-Rückfall; keine Wetterdaten-, Cache- oder Worker-Funktionsänderung.


## 0.9.53.48
- Ortssuche priorisiert und gegen leere Zwischenzustände/verspätete Antworten gehärtet; Zwei-Zeichen-POI-Suche und Kurzzeitcache ergänzt.
- Netatmo-Verbindung liefert bei fehlender Worker-Konfiguration sofort sichtbares Setup-Feedback statt eines stumm deaktivierten Buttons.

## 0.9.53.50

- Netatmo OAuth-Start korrigiert: `response_type=code` wird nun explizit an den Autorisierungsendpunkt übergeben. Ohne diesen Parameter konnte die externe Netatmo-Freigabeseite übersprungen bzw. der Flow sofort zur App zurückgeführt werden.
- OAuth-Rückkehr wird app-weit erkannt: bei `mid_station` öffnet MID automatisch **Einstellungen → Lokaler Wetterzwilling**, damit Erfolgs-/Fehlermeldung und verbundene Station sichtbar sind, statt nur auf der Startseite zu landen.
- Quellenhinweis zur privaten Stationsintegration an den aktiven Stand angepasst.
- Neue Regression `test-netatmo-oauth-navigation-095350.mjs` sichert Authorization-Code-Parameter, externe Weiterleitung und Rückkehr in den Stationsbereich ab.

## 0.9.53.49
- CI-Fix: veraltete feste Debounce-Erwartung in `test-interactions.mjs` durch einen semantischen Responsivitätsvertrag ersetzt. Die produktive Ortssuche bleibt unverändert bei 35/60 ms.
- Keine Wetter-, Netatmo-, Lüftungs- oder Worker-Funktionsänderung.


## 0.9.60.3
- Kompositbild-Zeitpfeil dauerhaft sichtbar gemacht: Schaft, Querstriche und die Verbindung zu den Zeitlabels werden nicht mehr über ein Canvas-Overlay, sondern als robuste Karten-Polylinien gerendert.
- Zusätzlich erhält jedes Zeitlabel wieder eine klar sichtbare Verbindungsmarke zum Zeitpfeil, damit Linie/Strich auch im mobilen Kompositbild zuverlässig erkennbar bleibt.
- Die vorhandene Zielspitze am gewählten Ort, die wolkengewichtete Schwerpunktströmung und die reduzierte Zeitlabel-Logik bleiben unverändert erhalten.


## 0.9.60.4
- Kompositbild-Zeitpfeil erneut korrigiert: Zeiten beziehen sich jetzt auf den aktuell angezeigten Filmzeitpunkt statt auf eine potenziell abweichende Analysestempelzeit.
- Die Zeitlabels nutzen standardmäßig nachvollziehbare relative Zeiten (z. B. +30m, +1h), absolute Zeiten bleiben intern weiter unterstützt.
- Für langsame Verlagerungen wurde die Pfeilgeometrie auf zeitbasierte Lead-Zeiten umgestellt, damit keine unrealistischen Mehrstunden-Labels mehr entstehen.
- Pfeilschaft, Tick-Marken und Label-Verbindungen wurden farblich deutlich verstärkt und die Labels an echte Label-Anker verlegt, damit der Zeitpfeil im Kompositbild klar sichtbar bleibt.


## 0.9.60.5
- Kompositbild-Zeitpfeil erneut nachgeschärft: Die sichtbare Pfeillinie wird jetzt im regulären Overlay-Pane gerendert, damit der Schaft im Kartenbild zuverlässig tatsächlich sichtbar bleibt.
- Der Zeitpfeil-Schalter wurde auf einen Drei-Stufen-Zyklus umgestellt: erster Tap absolute Zeiten, nächster Tap relative Zeiten, dritter Tap Layer aus.
- Der gespeicherte Zeitmodus wird wieder korrekt als React-State geführt; damit funktionieren Persistenz und zyklisches Umschalten belastbar auch mobil.
- Die Button-Detailanzeige weist den aktiven Zeitmodus (absolut/relativ/aus) direkt aus.


## 0.9.60.7
- Regressionen des Komposit-Zeitpfeils auf den aktuellen sichtbaren Polyline-Vertrag migriert; alte Canvas-/Custom-Pane-Erwartungen entfernt.
- Flug-Korridor- und wolkengewichtete Schwerpunktströmungs-Regressionen auf denselben Zeitpfeil-Vertrag synchronisiert.
- Kanonische Worker-Teilquelle auf den aktuellen Release-Stand synchronisiert, damit `maintain:aggregates` den Worker nicht mehr auf v0.9.60.2 zurückstuft.
- Radar-Niederschlagsart- und Wetterkarten-Verträge bleiben funktional unverändert und bestehen wieder nach dem CI-Aggregat-Vorlauf.


## 0.9.60.8
- Standort-/Blickrichtungsmarker strikt getrennt: Der Richtungs-/Standortpfeil erscheint ausschließlich am echten Gerätestandort.
- Favoriten und manuell gewählte Orte verwenden im Kompositbild nur noch eine neutrale Ortsmarkierung ohne Sichtrichtungsanteil.
- Der meteorologische Zeitpfeil bleibt davon unabhängig und endet weiterhin am aktuell ausgewählten Ort.
- Neuer Pflichtvertrag `test-location-heading-favorites-09608.mjs` schützt die Trennung dauerhaft.


## 0.9.60.9
- Kompositbild-Zeitpfeil nach bestätigter Referenzvorlage von Grund auf als zusammenhängendes SVG-Symbol neu erstellt.
- Zeitlabels nur noch an den vier 15-min-Unterteilungen; keine Zeitmarke direkt am Standort/Favoritenort.
- Pfeilspitze endet am gewählten Ort, Anströmrichtung weiterhin primär aus der wolkengewichteten Vertikalprofil-Schwerpunktströmung.
- Neuer Pflichtvertrag `test-composite-time-axis-template-09609.mjs`.


## 0.9.60.10
- Kompositbild-Zeitpfeil zoomabhängig gemacht: die 60-min-Anströmungsstrecke besitzt nun eine feste geographische Länge aus Schwerpunktströmungs-Geschwindigkeit × 60 min und wird bei jedem Zoom neu in Bildschirmkoordinaten projiziert.
- Die Pfeilachse wächst beim Hineinzoomen und schrumpft beim Herauszoomen entsprechend der Karte; die bisherige feste Bildschirm-Länge wurde entfernt.
- +15/+30/+45/+60-min-Unterteilungen bleiben meteorologisch an derselben geographischen Zugstrecke verankert; Richtung und Geschwindigkeit stammen weiterhin primär aus der wolkengewichteten Vertikalprofil-Schwerpunktströmung.
- Neue Regression schützt ausdrücklich gegen einen Rückfall auf feste Pixel-Längen.


## 0.9.60.11
- EU-AQI-Einzelwertskalen korrigiert: Markerposition und aktiver Farbbereich verwenden nun denselben Open-Meteo-EU-AQI-Vertrag; die Fallback-Konzentrationsschwellen wurden auf den aktuellen Open-Meteo/CAMS-Stand synchronisiert.
- Zeitpfeil-Skala vollständig dynamisiert: runde Zeitstufen werden aus Schwerpunktströmungs-Geschwindigkeit, sichtbarer Strecke bis zum Kartenrand, Zoom, Kartenabmessungen und Displaydichte gewählt.
- Tickanzahl und Gesamtzeitfenster passen sich automatisch an; extreme Zoomstufen erzeugen weder übergroße Pfeile noch überlagerte 15/30/45/60-Minuten-Labels.
- Die Zeitachse bleibt auf maximal zwei Stunden begrenzt und verwendet nur runde Schritte (2/5/10/15/20/30/45/60 min).


## 0.9.60.13
- CI-Härtung: veraltete `geometry.trackMid`-Regressionen auf den aktuellen direkt am gewählten Ort verankerten Zeitpfeil-Vertrag migriert.
- Kanonische Worker-Teilquelle und Baseline versionsfest synchronisiert; neuer Aggregate-Versionstest verhindert Rückfälle durch `maintain:aggregates`.


## 0.9.60.14
- Komposit-Zeitpfeil-Rollback-Schutz: Das zoominstabile Komplett-DivIcon wurde entfernt. Schaft und Unterteilungen werden wieder als echte geographische MapLibre-Vektoren in einer eigenen Pane oberhalb der Referenzkarte gerendert; die Pfeilspitze bleibt als separater Marker exakt am gewählten Ort.
- Die dynamische runde Zeitskala aus Schwerpunktströmungs-Geschwindigkeit, Zoom, verfügbarer Kartenstrecke und Displaydichte bleibt erhalten.
- Standort-/Favoriten-Vertrag verschärft: Der Sichtrichtungspfeil wird nur noch über die tatsächlich aktive Geräteort-Auswahl (`locationSelectionSource === tracked`) freigegeben; ein manuell geöffneter Favorit kann ihn nicht mehr über ein historisches `autolocated`-Flag erben.
- Bestehende Zeitpfeil-/Zoom-/Flug-/Radar-Regressionen auf den geographischen Vektorvertrag migriert.


## 0.9.60.15
- Komposit-Zeitpfeil: Schaft, Ticks, Zeitlabels und Pfeilspitze werden nun gemeinsam in einem dynamisch aus Geo-Projektionen erzeugten DOM/SVG-Marker gerendert. Dadurch kann die Linie nicht mehr unabhängig von den sichtbaren Labels verschwinden.
- Das SVG wird bei Zoom/Move/Resize aus den aktuellen Kartenprojektionen neu aufgebaut; die Pfeilspitze bleibt exakt am ausgewählten Ort und Zeitlabels stehen ausschließlich an den Ticks.


## 0.9.61.0
- Wetterzwilling/Fusion konsolidiert: serverseitige Gewichte berücksichtigen Wetterlage, Horizont, Region, Auflösung, Laufaktualität und Latenz; die lokal gemessene Prognosegüte bleibt eine datensparsame Gerätestufe.
- Rapid-Cycle-Varianten derselben Modellfamilie teilen sich ein Unabhängigkeitsbudget und können die Fusion nicht durch Doppelgewichtung dominieren.
- Erweiterte Quellen-/Gewichtungsdiagnose weist Tagesfaktoren, Gruppenbudgets, lokale Skill-Gewichte und die nachgelagerte Nowcast-Stufe aus.
- Alle Wetteransichten bleiben an die kanonischen `displayHours`/`displayMinutes15` und daraus abgeglichene Tageswerte gebunden.


## 0.9.62.0
- Flugmeteorologie als textuelles Streckenbriefing erweitert: zwei bis acht Wegpunkte, Korridor, Flughöhe sowie Start-/Landezeit bilden einen gemeinsamen Routenvertrag.
- Hazard-Orte werden als größere Räume/Streckenabschnitte mit gerundeten Entfernungen und Eintritts-/Austrittsfenstern beschrieben.
- Neues vertikales Textbriefing für Bewölkung, Vereisung, Turbulenz/Windscherung, Konvektion und Wind; keine Rückkehr zur alten Cross-Section-Grafik.


## 0.9.63.0
- Große Flug-, Radar-/Komposit- und Wetterdiagnosepfade in eigene Fachmodule aufgeteilt; gemeinsame Cache- und Persistenzverträge eingeführt.
- Komposit-Layer-Zustand einschließlich Aktivierung, Kartenstil, Transparenzen und Bewegungszeitmodus bleibt unter dem bestehenden v3-Vertrag dauerhaft erhalten.
- Cloudflare-KV-Last reduziert: regelabhängige Kadenzen, metadata-only Scheduling, zustandsabhängige Writes und gedrosselte Heartbeats ohne Wegfall von Regeln oder Datenquellen.
- Regressionen prüfen die kanonische Prognose, das textuelle Flugbriefing, dauerhafte Nutzerzustände und das KV-Operationsbudget.

## 0.9.77.27
- Saison-/Langfristquellen vollständig neu auditiert und auf kanonische Modell-/Unabhängigkeits-IDs umgestellt.
- C3S führt die 10 aktuell operationellen Systeme getrennt; ECCC CanESM5.1p1bc und GEM5.2-NEMO sind eigenständige Systeme, Met Office GloSea6-GC5.1 System 610 und JMA CPS4 sind aktualisiert.
- NOAA NMME bleibt dynamisch und übernimmt jedes im neuesten ENSMEAN-Lauf tatsächlich verfügbare Modell; CFSv2/ECCC-Dubletten werden anbieterübergreifend nicht doppelt gewichtet.
- Poor-Man’s-Ensemble: eine gleichgewichtete Stimme je unabhängiger Modelllinie; aktuell bis zu 13 unabhängige Systeme bei vollständig aktivem C3S + NMME.
- NMME-Punktentnahme auf Header-Range + HTTP Multi-Range mit Volldownload-Fallback und begrenzter Parallelität umgestellt.
- Gemeinsames Einzelmodell-Diagramm bleibt auch bei >12 Linien eindeutig über Farbe + Linienmuster; keine zusätzlichen Katalog-/Hinweiskästchen.
- WMO LC-LRFMME, APCC, CanSIPS und DWD EPISODES geprüft und nur dort einbezogen, wo Zeitachse, Authentifizierung und Unabhängigkeit eine fachlich saubere numerische Vereinigung erlauben.

## 0.9.77.28
- 7-/14-Tage Tmin/Tmax: individuelle Abweichung zum jeweiligen Klimamittel 1991–2020 wieder direkt im blauen/roten Kästchen sichtbar.
- Klimatologie-Datenbedarf von der optionalen 7-Tage-Kurzinterpretation entkoppelt; aktive Tagesprognose lädt das Klimamittel zuverlässig auch bei deaktivierter Summary.
- Bereits kleine Abweichungen um ±0,5–1 K wirken wieder auf Badge-Text, Hintergrund und Rahmen; bei fehlendem Klimamittel steht sichtbar `Δ –`.
- Vorhandener Klimacache dient bei temporärem Archive-API-Fehler als Stale-Fallback.
