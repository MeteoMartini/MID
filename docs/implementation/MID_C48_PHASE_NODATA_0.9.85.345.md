# MID-C48 · Modell-Phasenraster NoData

Basis .344 `3199af000d03e1a90e8708db52ecd743f249134e`. Der in Draft #480 dokumentierte produktive Worker-Befund wird isoliert behoben. Kein SYNOP-/Glyphenimport.

`precipitationPhaseGridData` transportiert Missing und negative ungültige Mengen als NaN intern/null in JSON. Echte Null bleibt Null. Wettercodes werden nur bei ganzen Zahlen 0..99 erhalten, nicht gerundet. Nicht angeforderte showers bleiben Missing. Boolesche und leere Eingaben werden nicht numerisch als Null akzeptiert. Bestehende Client-finite-Prüfung und Radar-Phasenklassifikation bleiben unverändert: interne neutrale Summanden sind keine ausgegebenen Messwerte; fehlende Thermik liefert keine erfundene kalte Phase.

Der vorhandene echte Worker-Routentest prüft JSON-Transport, reale Null, negative Mengen, fraktionalen Wettercode und unveränderte Missing-Werte im begrenzten Rate-Limit-Stalecache. Native-RUC-/Rendererregressionen bleiben Pflicht. Cachelebensdauer, API-Budget, Zeitabnahme, RUC-Fusion und amtliche Warnungen bleiben unverändert. Worker-Neudeploy über regulären Installer erforderlich; bestehende Isolate-Speichercaches werden dabei ersetzt. Kein Beleg neuer Vorhersagegüte oder physischer iOS-Abnahme.

Die historische statische Regression erwartete showers=0 ohne API-Feld. Sie wird ausdrücklich auf den korrigierten NoData-Vertrag umgestellt; der Routentest prüft das tatsächliche JSON samt Stalecache. Keine Testpflicht entfällt.

Lokaler Nachweis: Produktionsbuild/Types und Produktionsaudit (0 Vulnerabilities) erfolgreich. Voller Lauf 1028 Tests: 1027 erfolgreich, ausschließlich die historische showers=0-Quelltextannahme schlug fehl. Nach dokumentierter Anpassung bestehen diese Regression, der erweiterte echte Worker-Routentest und native RUC-/Rendererprüfung erneut. Frisches vollständiges Source-/Installer-Gate bleibt verbindlich.

## Tablet und Screenshot-Skybar
Die geerbte composite-playback-speed grid-row:2 kollidiert bei Tabletspalten mit dem Slider. Explizite getrennte Gridzeilen bis 1200 CSS-Pixel, mindestens 44px Bedienelementhöhe; keine Änderung der Zeitachse oder Schrittwerte.

Screenshot 1 allein enthält keine numerische Gesamtbewölkung für 18–19 Uhr. Zentraler Solar-Segmenttest belegt: bekannte Nachtbewölkung 50/75/100% deckt den ganzen Slot; 49% lässt vertragsgemäß das Band frei. Damit ist die exakte Ursache im konkreten Screenshot ohne dessen Quelldaten nicht abschließend belegt. Kein künstliches Auffüllen, keine Änderung fachlicher Schwellen. Prüfung bleibt offen, falls dort tatsächlich >=50% Gesamtbewölkung vorlag.

Chromium: 16 CSS-Fixture-Fälle über 320/390/768/820/834/1024/1180/1366px Light/Dark mit Bounding-Box-Kollisionstest sowie echter Select-/Range-Fokusbedienung bestanden. WebKit lokal durch fehlende Systembibliotheken blockiert; apt scheitert an setgroups-Berechtigung. Keine WebKit-/iOS-Abnahme behauptet. Der vorhandene verpflichtende heavy-browser-state-Test ruft zusätzlich die neue Chromium/WebKit-Fixture auf; beide Engines bleiben im CI verpflichtend. Es handelt sich um eine CSS-/Bedienfixture, keine vollständige Live-Radar- oder physische iPad-Abnahme.

Die Tablet-Korrektur ist eine neue abschließende C48-Styleschicht. Der ursprüngliche .169-CSS-Fingerprint bleibt unverändert vorgeschrieben. Die Konsolidierungsregression prüft weiterhin dessen exakte Gleichheit, 117 Extraktionen und 1122 Duplikate. Die neue Schicht wird ausdrücklich außerhalb der historischen Referenz geführt.

## Modellstandsanzeige
Die bisherige Initialisierungsalter-Regel erklärt strukturell häufiges Gelb bei spät bereitgestellten, gerade erst gelieferten Modellen. Kein empirischer Nachweis, dass dies jeder bisherige gelbe Screenshot war. Open-Meteo model-updates definiert availability als tatsächliche API-Bereitstellung, im Unterschied zur Initialisierung und Downloadmodifikation; Metadaten sind kein direkter Best-Match-Inhaltsnachweis. Bestehende usedInCanonical-Zulassung bleibt bindend.

Bei vorhandener, kohärenter Bereitstellungszeit wird deren Alter gegen den ausgewiesenen Quellrhythmus bewertet: grün bis ein Zyklus plus technische Toleranz max(15min,min(1h,0.15Zyklus)); gelb bis1.6Zyklen plus Toleranz; danach rot. Das sind explizite MID-Betriebsheuristiken, keine Qualitäts-/WMO-Schwellen. Bereitstellung vor Initialisierung, >5min Zukunft oder Lieferabstand über min(48h,max(6h,2Zyklen)) liefert unbekannt, nicht grün. Fehlt die Zeit vollständig, bleibt das bisherige konservative Initialisierungsalter. Unbekannte beitragende Modelle verhindern weiterhin pauschales Grün. Keine Änderung von Datengewichtung, RUC-Freshness, Warnungen oder Prognosegüte. Hinweistext legt die Bewertungsbasis offen. Regressionen prüfen frische spät gelieferte Läufe, Zykluswechsel, Überfälligkeit, alte/neue inkohärente Zeitstempel und unbekannte Modelle.

Zusätzliche Provenienzgrenze: Der Cockpit-Inventaradapter übernimmt eine verfügbare Metadaten-Bereitstellungszeit nur, wenn deren Initialisierung zum tatsächlich verwendeten Source-Lauf passt. Ein neuerer Metadatenlauf darf einen älteren verwendeten Lauf nicht durch seine neue Bereitstellungszeit grün erscheinen lassen. Explizite Source-Bereitstellung hat weiterhin Vorrang.
