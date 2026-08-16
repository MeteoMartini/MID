# MID Hyperlokal-Analysevertrag

Dieser Vertrag gilt ab MID v0.9.51.0 für alle bestehenden und neuen Module, die aktuelle Stationswerte, lokale Beobachtungen oder lokale Modellnachkorrekturen verwenden.

## 1. Repräsentativität vor Quellenrang
Eine amtliche oder professionelle Quelle darf einen Wert nicht allein wegen ihres Quellenrangs dominieren. Für jedes Feld werden Aktualität, Entfernung, Höhendifferenz, Standorttyp, Qualitätsstatus und zeitliche Auflösung getrennt bewertet.

## 2. Parameterbezogene Aktualität
Ein globaler Stationszeitstempel darf nicht als Aktualitätsnachweis für alle Parameter dienen, wenn feldbezogene Zeitstempel vorhanden sind. Eine jüngere Windmeldung darf beispielsweise eine ältere Temperaturmessung nicht künstlich verjüngen.

Dynamische Felder besitzen harte Ausschlussgrenzen. Insbesondere darf 2-m-Temperatur ab 75 min Alter oder 45 km Entfernung nicht mehr als hyperlokaler Beobachtungsanker dienen; Niederschlag ist noch enger begrenzt. QFF/Luftdruck darf aufgrund seiner größeren räumlichen Glätte länger und weiter stützen.

## 3. Keine Mindestkorrektur ohne Evidenz
Die modellgestützte Restfeldanalyse darf keinen festen Mindestanteil einer Stationsabweichung übernehmen. Die Korrekturstärke muss gegen null gehen, wenn Beobachtungsgewicht, Aktualität oder räumliche Repräsentativität schwach sind.

## 4. Hochaufgelöster Modellhintergrund
Die lokale Restfeldanalyse verwendet, soweit verfügbar, das für das Land geeignete hochaufgelöste Regionalmodell (z. B. ICON-D2, HARMONIE-AROME, AROME, ICON-CH1, Nordic PP, HRRR) und erst danach Best Match als Rückfall. Ein bloßer Verfügbarkeitsnachweis eines Modells darf nicht als numerischer Punktwert ausgegeben werden.

## 5. Standortanpassung
Stadt/Land/Suburban und Höhendifferenz werden feldabhängig gewichtet. Temperatur, Feuchte und Taupunkt reagieren stärker auf Standortmismatch als QFF. Generische Ortsklassen dürfen nicht pauschal als urban interpretiert werden, wenn Einwohnerzahl oder Orts-/POI-Typ dies nicht stützen.

## 6. Hochfrequente Beobachtungen
Wo amtliche Netze höherfrequente Werte bereitstellen, werden diese bevorzugt und ihre native zeitliche Auflösung in der Feldprovenienz mitgeführt. Niedrigfrequente Spezialfelder (z. B. stündliche Böe) behalten ihren eigenen Zeitstempel und dürfen nicht den Zeitstempel eines minutenaktuellen anderen Feldes übernehmen.

## 7. Niederschlag
Punktstationsniederschlag ist nur eine lokale Stütze. Radar/Nowcast und die bereits bestehende zentrale Niederschlagslogik bleiben für die räumliche Kurzfristbeurteilung führend.

## 8. Appweite Verwendung
Aktuelles Wetter, Kurzfristprognose, Events und neue Module müssen für Stationsanker dieselbe feldbezogene Verwendbarkeitsprüfung nutzen. Neue pauschale Frischekonstanten für eine ganze Station sind nicht zulässig.

## 9. Transparenz
Die `(i)`-Herkunft zeigt je Feld soweit verfügbar Quelle, Station, Entfernung, Beobachtungsstand, Datenintervall und Gewicht. Das verwendete Modell des hyperlokalen Hintergrunds bleibt als Diagnoseinformation erhalten.

Der Required-Test `scripts/test-hyperlocal-parameter-relevance-09510.mjs` schützt diese Regeln gegen spätere Regressionen.

## 10. Operative Prognosewirkung und Konsistenz aus einem Guss
Eine fachlich verwendbare hyperlokale Beobachtung ist nicht auf die Karte „Aktuelles Wetter“ beschränkt. Soweit der jeweilige Parameter und sein zeitlicher Gültigkeitshorizont eine Extrapolation erlauben, wird die Korrektur zentral in die operative Forecast-Zeitreihe übernommen und wirkt dadurch in 90-Minuten-Ansicht, Kurzfristprognose, Stunden-/Tagesgrafiken, Hazards, Widgets, Events und Aktivitäten konsistent mit.

Hierfür gilt zusätzlich verbindlich `MID_FORECAST_CONSISTENCY_CONTRACT.md`. Sichtbare Module dürfen Stationsanker, Radar-/Nowcast- oder andere hyperlokale Korrekturen nicht eigenständig erneut anwenden oder rohe 15-Minuten-/Stundenwerte an der kanonischen Endstufe vorbei anzeigen.

## 11. Direkter Temperatur-Messkonsens gegen fehlerhafte Zielpunktgradienten (ab v0.9.53.37)

Die modellgestützte Restfeldanalyse bleibt der Primärpfad. Sie darf jedoch nicht fälschlich eine Nullkorrektur als Bestätigung des Zielpunktwerts interpretieren, wenn das Regionalmodell an den umliegenden Messstationen jeweils nahe an den Beobachtungen liegt, aber der räumliche Modellgradient zum Zielpunkt selbst erkennbar unplausibel ist.

Für 2-m-Temperatur gilt deshalb zusätzlich eine begrenzte direkte Beobachtungs-Stütze:

- mindestens zwei bereits räumlich/identitär deduplizierte, feldbezogen frische und hinreichend nahe Temperaturmesspunkte,
- robuste Konsistenzprüfung gegen Ausreißer und starke räumliche Streuung,
- parameterbezogene Gewichtung nach Aktualität, Distanz, Höhe, Standorttyp, zeitlicher Auflösung und Gelände-/Oberflächenkompatibilität,
- zusätzliche Dämpfung einer Flughafen-/Aviation-Messung bei nicht-ruralem Zielort,
- keine Aktivierung durch einen einzelnen Flughafen, eine einzelne Privatstation oder einen einzelnen Messpunkt,
- keine pauschale Nachtkorrektur; Richtung und Betrag müssen aus den tatsächlich eingehenden Beobachtungen stammen,
- evidenzadaptive Rückführung auf den direkten Messkonsens: bei schwacher oder widersprüchlicher Stützung bleibt die Korrektur eng begrenzt; bei mehreren frischen, nahen und kohärenten Messpunkten darf ein klarer Zielpunkt-Gradientenfehler mehrere Kelvin korrigiert werden, ohne den Messkonsens vollständig zu übernehmen.

Der insgesamt resultierende Temperatur-Offset – Restfeld plus ggf. Messkonsens-Rückführung – ist die appweit kanonische lokale Temperaturkorrektur und wird über den bestehenden Forecast-Konsistenzvertrag in die betroffenen Kurzfrist-/Forecastpfade übernommen.

Die UI muss Temperaturstützung separat ausweisen. Ein globaler Wert wie „7 Messpunkte“ aus der Vereinigung von Wind-, Druck-, Wolken- und Temperaturquellen darf nicht suggerieren, dass alle diese Punkte die Temperatur bestimmt haben. Für Temperatur werden tatsächliche Temperatur-Messpunktzahl, gewichteter Radius, Quellen/Intervalle und ggf. die zusätzliche Messkonsens-Rückführung transparent diagnostiziert.

Required Regressionen: `scripts/test-hyperlocal-direct-temperature-consensus-095337.mjs` und `scripts/test-hyperlocal-source-freshness-095338.mjs`.
