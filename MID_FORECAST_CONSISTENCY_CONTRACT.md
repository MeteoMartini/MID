# MID – verbindlicher Vertrag für eine konsistente Prognose aus einem Guss

Dieser Vertrag gilt ab MID v0.9.53.26 app-weit für alle bestehenden und neuen sichtbaren Prognose-, Analyse-, Warn-, Event-, Aktivitäts-, Widget- und Exportmodule.

## 1. Eine operative Prognose, mehrere Darstellungen

MID darf fachlich relevante Vorhersagewerte nicht pro Ansicht neu zusammensetzen. Nach Abschluss der zentralen Prognosekette existiert für einen Standort nur eine operative MID-Prognose. Karten, 90-Minuten-Ansicht, Kurzfristprognose, Stundenprofil, Tagesgrafiken, 7-Tage-Ansicht, Hazards, Widgets, Events und Aktivitäten sind Verbraucher dieser Prognose und keine eigenständigen Forecast-Engines.

## 2. Kanonische Zeitreihen

Für die sichtbare App gelten zwei kanonische Zeitreihen:

- `displayHours`: finale stündliche MID-Prognose.
- `displayMinutes15`: finale 15-Minuten-Niederschlags-/Wetterreihe für 90-Minuten- und Kurzfristdarstellungen sowie zeitlich feinere Niederschlagsauswertungen.

Rohes `hours` oder `minutes15` darf in sichtbaren Forecast-Verbrauchern nicht an der kanonischen Endstufe vorbei verwendet werden, wenn eine entsprechende finale Reihe verfügbar ist.

## 3. Gemeinsame Reihenfolge der Prognosekette

Die fachliche Reihenfolge lautet grundsätzlich:

1. Best Match / Modellbasis und kohärente Wetterbündel.
2. Zulässige Mehrquellen-/Fusion-Reparaturen.
3. Optional validierte lokale Wetterzwilling-Bias-Korrekturen.
4. Operatives Radar-/Nowcast- und Konvektivsignal.
5. Feldbezogene hyperlokale Beobachtungs-/Stationskorrektur mit zeitlichem Ausblenden.
6. Zentrale Niederschlags-, Wettercode- und Plausibilitätsabstimmung.
7. Ableitung der finalen 15-Minuten-Reihe aus derselben operativen Evidenz.
8. Aggregation der finalen Stunden in Tageswerte und nachgelagerte Verbraucher.

Ein Modul darf diese Reihenfolge nicht lokal neu erfinden oder einzelne Schritte ein zweites Mal anwenden.

## 4. Hyperlokale Anpassungen wirken app-weit

Eine fachlich freigegebene hyperlokale Anpassung ist keine reine Anzeige des Moduls „Aktuelles Wetter“. Soweit der Parameter und der Zeithorizont eine Extrapolation zulassen, fließt sie in die operative Prognose ein.

Das betrifft insbesondere:

- Temperatur und daraus abgeleitete gefühlte Temperatur,
- Feuchte und Taupunkt,
- Luftdruck,
- Wind, Böen und Windrichtung,
- Bewölkung, tiefe Bewölkung und Sicht,
- beobachteten Niederschlag,
- daraus gestützte Niederschlagswahrscheinlichkeit,
- plausiblen Wettercode bzw. Wettercharakter.

Die Korrektur muss parameterbezogen und zeitlich begrenzt auslaufen. Eine aktuelle Beobachtung darf nicht pauschal über viele Stunden oder Tage fortgeschrieben werden.

## 5. Niederschlagswahrscheinlichkeit und Nowcast

Erhöht oder senkt die zentrale Kurzfristlogik die Niederschlagswahrscheinlichkeit – etwa durch Radar, Konvektion oder belastbare lokale Niederschlagsbeobachtung –, muss dieses Signal in allen betroffenen Darstellungen erkennbar sein. Insbesondere dürfen 90-Minuten-Karte, Kurzfristprofil, Stundenprofil, Niederschlagszusammenfassung und Tagesauswertung nicht gleichzeitig verschiedene Wahrscheinlichkeitsstände für dasselbe Zeitfenster verwenden.

15-Minuten-Werte dürfen aufgrund ihrer feineren zeitlichen Auflösung vom Stundenwert abweichen; sie müssen jedoch aus derselben Evidenz und derselben zentralen Blend-/Plausibilitätslogik stammen. Feinere zeitliche Struktur ist zulässig, widersprüchliche Prognoseursachen sind es nicht.

## 6. Keine doppelte Assimilation

Radar, Konvektion, Stationsanker, Wetterzwilling oder andere lokale Korrekturen dürfen in einer UI-Komponente nicht erneut auf bereits finalisierte Werte angewendet werden. Darstellungskomponenten erhalten finale Werte und visualisieren sie lediglich.

Das 24-h-Wetterprofil ist eine solche Darstellungskomponente: Es verwendet exakt die bereits finalisierten stündlichen `displayHours` ab der aktuellen Stunde. Es erzeugt keinen zweiten synthetischen Current-Punkt und wendet den Stationsanker nicht nochmals lokal an. Dadurch bleiben Current, 90-Minuten-Leiste, Kurzfrist und 24-h-Profil auf derselben kanonischen Temperaturreihe.

## 7. Tageswerte folgen finalen Stunden

Wo ausreichend Stundenabdeckung vorliegt, werden Niederschlag, Wettercode und kurzfristig relevante Tageskennwerte aus den finalen Stunden abgeleitet. Ein Tageswert darf keine lokale oder Nowcast-Korrektur wieder verlieren, die in den zugrunde liegenden Stunden bereits fachlich wirksam ist.

Für Temperatur gilt zusätzlich verbindlich: Bei vollständiger Stundenabdeckung sind `Tmax` und `Tmin` exakt das Maximum beziehungsweise Minimum der finalen `displayHours` des lokalen Kalendertags. Ein abweichender roher Daily-Wert darf dann nicht parallel in Tageskarte, 24-h-Profil, Ensemble-/Detailansicht, Event oder Widget erscheinen. Daily-Rohwerte bleiben nur Fallback, wenn die finale Stundenreihe den Kalendertag nicht ausreichend abdeckt.

## 8. Events und Aktivitäten

Events und Aktivitäten am aktuell geöffneten Ort verwenden dieselben bereits finalisierten `displayHours`. Andere Orte durchlaufen dieselbe zentrale Endstufe einschließlich der dort verfügbaren hyperlokalen Beobachtungsanker. Eine Event- oder Aktivitätsengine darf keine abweichende lokale Forecast-Logik etablieren.

## 9. Herkunft und Nachvollziehbarkeit

Lokale Korrekturen bleiben als solche erkennbar. Die zugrunde liegende Modell-/Best-Match-Herkunft wird nicht fälschlich ersetzt; ergänzend kann die operative Reihe eine lokale Anpassungskennzeichnung tragen. Eine Anpassung darf nur erfolgen, wenn die feldbezogene Beobachtung nach dem Hyperlokal-Analysevertrag verwendbar ist.

## 10. Neue Module

Jedes neue Modul mit Prognosewerten muss vor Merge beantworten:

- Verwendet es `displayHours` beziehungsweise `displayMinutes15` oder eine daraus abgeleitete kanonische Struktur?
- Wird lokale/Nowcast-Evidenz nur einmal zentral angewendet?
- Stimmen Niederschlagswahrscheinlichkeit, Wettercode, Hazard und Tagesaggregation mit den übrigen Verbrauchern überein?
- Bleiben Zeit, Einheit, Provenienz und Cache-Regeln erhalten?

Lokale Parallelberechnungen sind nur zulässig, wenn sie eine bewusst andere fachliche Größe darstellen und ausdrücklich dokumentiert sowie regressionsgeschützt sind.

## 11. Regressionsschutz

Der Required-Test `scripts/test-forecast-consistency-contract-095326.mjs` schützt die kanonischen Stunden-/15-Minuten-Pfade, die app-weite Verwendung und das Verbot eines erneuten UI-seitigen Hyperlokal-/Radar-Blends.
