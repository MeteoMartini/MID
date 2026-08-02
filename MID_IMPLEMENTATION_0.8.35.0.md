# MID v0.8.35.0

## Best-Match-zentrierte Prognose, API-Suffixaudit und korrekte Sonnenstunden

### Ausgangsproblem

Am aktuellen Tag zeigte der Ensemble-Tooltip für den Best Match nur 1,9 Sonnenstunden, obwohl die Ensemblemitglieder 12,5 bis 14 Stunden erwarteten und der Tagesverlauf sonnig war. Der Wert entstand nicht in der Open-Meteo-Tagesprognose, sondern in MID: Beim Tages-/Stundenabgleich wurden nur noch nicht vergangene Stunden gruppiert. Am Abend ersetzte MID dadurch die vollständige Tagesprognose versehentlich durch die Summe der noch verbleibenden Sonnenstunden.

Daneben war die Quellenstrategie aus v0.8.34.0 zu offensiv: explizite Modelle dienten bereits als horizontabhängige Hauptquelle. Gewünscht ist stattdessen Open-Meteo Best Match als operative Leitprognose, ergänzt um eine transparente Qualitätskontrolle und nur bei tatsächlichem Widerspruch um einen vollständigen kohärenten Ersatz.

## 1. Korrekte Sonnenstundenaggregation

Für Sonnenstunden gilt nun:

- Der aktuelle Kalendertag behält immer die vollständige tägliche Best-Match-Aggregation.
- Vergangene Sonnenstunden werden beim abendlichen Neuaufbau nicht abgeschnitten.
- Reine Best-Match-Zukunftstage behalten ebenfalls den offiziellen täglichen Best-Match-Wert.
- Nur wenn mindestens eine Stunde wegen eines unvollständigen oder widersprüchlichen Best-Match-Wetterbündels vollständig ersetzt wurde, wird ein vollständig verfügbarer Zukunftstag aus den finalen Stunden neu summiert.
- Die stündliche Neusumme wird nur bei mindestens 18 Stunden und mindestens 90 Prozent vorhandenen Sonnenwerten verwendet.
- Sonnenstunden werden gegen die astronomische Tageslänge aus Sonnenauf- und Sonnenuntergang begrenzt.
- Die Tageslängenberechnung arbeitet korrekt in Sekunden; eine zwischenzeitlich mögliche fehlerhafte Begrenzung auf 86,4 Sekunden ist ausgeschlossen.
- Der aktuelle Tag wird anhand der Zeitzone des Forecasts bestimmt, nicht anhand der Gerätezeitzone.

Die zentrale `displayDays`-/`displayHours`-Zeitreihe versorgt 7-Tage-Prognose, Tagesdetail, Kurzfrist, Aktuelles Wetter, Ensemble-Best-Match, Widget und PNG-Export. Dadurch verwenden alle betroffenen Sektionen denselben Sonnenstundenwert.

## 2. Best Match bleibt die operative Hauptprognose

Open-Meteo Best Match bleibt unverändert die Ausgangsquelle für:

- Kurzfristvorhersage,
- 7-Tage-Vorhersage,
- Tagesdetaildiagramm,
- Aktuelles Wetter,
- Ensemble-Best-Match-Referenz,
- Hazards und Empfehlungen,
- Widgets und Exporte.

Explizite Modelle ersetzen Best Match nicht pauschal nach Vorhersagehorizont. Sie dienen als Kontroll- und Reparaturquellen.

## 3. Ein Multi-Model-Request mit API-Suffixaudit

Der Worker ruft die ausgewählten expliziten Modelle gemeinsam ab und ordnet jede zurückgelieferte Reihe anhand ihres modellspezifischen API-Suffixes zu. Unterstützt werden sowohl:

- eine gemeinsame Antwort mit suffizierten Variablennamen,
- als auch eine API-Antwort mit getrennten Modellobjekten.

Die Suffixauflösung erfolgt genau einmal pro Variable und Modell. Die tatsächlich gefundenen Feldnamen werden in den Diagnosedaten gespeichert. Fehlt eine Modellreihe im gemeinsamen Request, wird nur dieses Modell kontrolliert einzeln nachgeladen.

## 4. Geschlossenes Wetterbündel statt Parameterkreuzung

Folgende Größen bleiben je Stunde untrennbar zusammen:

- Niederschlagsmenge,
- Regen, Schauer und Schnee,
- Niederschlagswahrscheinlichkeit,
- WMO-Wettercode,
- Gesamt- und tiefe Bewölkung,
- CAPE,
- Sonnenscheindauer,
- Tag-/Nachtstatus.

MID prüft zunächst das vollständige Best-Match-Bündel. Nur bei einem konkreten Problem, etwa fehlenden Feldern, Niederschlag ohne probabilistische Stützung, Sonne bei geschlossener Bewölkung oder stratiformem Regen ohne tragfähige Wolkenschicht, wird die komplette Stunde aus genau einem expliziten Modell übernommen. Einzelne Wetterparameter verschiedener Modelle werden nicht zusammengesetzt.

Die Reparaturquelle wird nach Region, Reichweite und fachlicher Eignung priorisiert. Für Deutschland werden in der Kurzfrist vor allem ICON-D2 und ICON-EU, später ECMWF IFS/AIFS und globale Modelle als mögliche Reparaturquellen geprüft. Die Auswahl erfolgt nur unter den tatsächlich vollständig gelieferten, intern plausiblen Bündeln.

## 5. Temperatur und Wind als begrenztes Postprocessing

Temperatur und Wind dürfen separat nachkorrigiert werden, jedoch nicht als beliebiger Parameter-Mix:

- Best Match ist stets der Anker.
- Eine Korrektur erfordert mindestens zwei unabhängige Modellfamilien und eine hohe Vergleichsgüte.
- Kleine Abweichungen lösen keine Korrektur aus.
- Änderungen sind fest begrenzt.
- Taupunkt bleibt höchstens so hoch wie die Temperatur.
- Die relative Feuchte wird nach thermischen Änderungen physikalisch neu berechnet.
- Böen bleiben mindestens so hoch wie der Mittelwind.

DWD MOSMIX wird ausschließlich als lokales statistisches Postprocessing für Temperatur, Taupunkt, Feuchte, Luftdruck, Wind und Böen verwendet. MOSMIX darf weder Niederschlag noch Wahrscheinlichkeit, Wettercode, Bewölkung oder Sonnenschein verändern.

## 6. Hyperlokale Anpassungen bleiben nachgelagert

Die Reihenfolge der operativen Verarbeitung ist nun eindeutig:

1. Open-Meteo Best Match,
2. Suffixaudit und gegebenenfalls vollständige Bündelreparatur,
3. vorsichtige Temperatur-/Wind-Nachkorrektur durch unabhängigen Modellvergleich,
4. geeignete lokale MOSMIX-Nachkorrektur,
5. qualitätsgeprüfte lokale Wetterzwilling-Korrektur nur für Temperatur und Wind,
6. Radar-, Blitz- und Stations-Nowcasting für den kurzen Zeithorizont,
7. finale Niederschlags- und Tages-/Stundenkonsistenz.

Ein zusätzlicher Fehler im bisherigen Datenfluss wurde beseitigt: Bei aktiviertem Wetterzwilling setzte dessen Stundenpfad teilweise wieder auf den rohen Best-Match-Stunden auf und konnte dadurch zuvor erfolgte Bündelreparaturen oder MOSMIX-Korrekturen umgehen. Der Wetterzwilling setzt jetzt ausdrücklich auf den bereits geprüften und nachkorrigierten `fusionHours` und `fusedDays` auf.

## 7. Transparenz

Die Worker-Diagnose nennt künftig:

- Best Match als bevorzugte Quelle,
- Zahl der tatsächlich reparierten Stunden,
- verwendete Reparaturmodelle,
- ob der gemeinsame Multi-Model-Request suffizierte Felder lieferte,
- die konkret erkannten API-Feldsuffixe je Modell.

In der Stundenansicht bleibt die tatsächlich verwendete Wetterbündelquelle sichtbar. Unveränderte Stunden heißen Best Match; ersetzte Stunden nennen die explizite Reparaturquelle und den Reparaturgrund.

## Regression

Der neue Vertrag wird insbesondere durch `scripts/test-best-match-sunshine-suffix-strategy-08350.mjs` geschützt. Der Test bildet den gemeldeten Abendfall nach:

- vollständige Best-Match-Tagesprognose: 13 Stunden,
- nur noch verbleibende Abendstunden: 1,9 Stunden,
- erwartetes Ergebnis: weiterhin 13 Stunden.

Zusätzlich werden geprüft:

- reine Best-Match-Zukunftstage,
- Zukunftstage mit vollständiger Bündelreparatur,
- unvollständige Stundenabdeckung,
- API-Suffixzuordnung,
- Best-Match-Priorität,
- Schichtung von Fusion, Wetterzwilling und Nowcast,
- gemeinsame `displayDays`-/`displayHours`-Versorgung aller Hauptsektionen,
- keine Wetterparameterkreuzung und keine MOSMIX-Niederschlagsübernahme.
