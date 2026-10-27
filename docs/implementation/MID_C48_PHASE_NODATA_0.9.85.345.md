# MID-C48 · Modell-Phasenraster NoData

Basis .344 `3199af000d03e1a90e8708db52ecd743f249134e`. Der in Draft #480 dokumentierte produktive Worker-Befund wird isoliert behoben. Kein SYNOP-/Glyphenimport.

`precipitationPhaseGridData` transportiert Missing und negative ungültige Mengen als NaN intern/null in JSON. Echte Null bleibt Null. Wettercodes werden nur bei ganzen Zahlen 0..99 erhalten, nicht gerundet. Nicht angeforderte showers bleiben Missing. Boolesche und leere Eingaben werden nicht numerisch als Null akzeptiert. Bestehende Client-finite-Prüfung und Radar-Phasenklassifikation bleiben unverändert: interne neutrale Summanden sind keine ausgegebenen Messwerte; fehlende Thermik liefert keine erfundene kalte Phase.

Der vorhandene echte Worker-Routentest prüft JSON-Transport, reale Null, negative Mengen, fraktionalen Wettercode und unveränderte Missing-Werte im begrenzten Rate-Limit-Stalecache. Native-RUC-/Rendererregressionen bleiben Pflicht. Cachelebensdauer, API-Budget, Zeitabnahme, RUC-Fusion und amtliche Warnungen bleiben unverändert. Worker-Neudeploy über regulären Installer erforderlich; bestehende Isolate-Speichercaches werden dabei ersetzt. Kein Beleg neuer Vorhersagegüte oder physischer iOS-Abnahme.

Die historische statische Regression erwartete showers=0 ohne API-Feld. Sie wird ausdrücklich auf den korrigierten NoData-Vertrag umgestellt; der Routentest prüft das tatsächliche JSON samt Stalecache. Keine Testpflicht entfällt.

Lokaler Nachweis: Produktionsbuild/Types und Produktionsaudit (0 Vulnerabilities) erfolgreich. Voller Lauf 1028 Tests: 1027 erfolgreich, ausschließlich die historische showers=0-Quelltextannahme schlug fehl. Nach dokumentierter Anpassung bestehen diese Regression, der erweiterte echte Worker-Routentest und native RUC-/Rendererprüfung erneut. Frisches vollständiges Source-/Installer-Gate bleibt verbindlich.
