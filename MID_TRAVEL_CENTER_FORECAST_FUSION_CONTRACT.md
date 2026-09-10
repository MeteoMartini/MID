# MID Reise-Center- und Prognose/Klimafusions-Vertrag

## Zweck

Der Reiseplaner verbindet eine dauerhaft speicherbare Reiseübersicht mit einer fachlich transparenten, vom Prognosehorizont abhängigen Wetterbewertung. Er darf weder eine verfügbare aktuelle Modellprognose zugunsten reiner Klimatologie ignorieren noch für weit entfernte Reisetermine eine tägliche Scheingenauigkeit erzeugen.

## Reise-Center

1. Reisen können unabhängig von Ortsfavoriten und Event-Center-Einträgen festgepinnt werden.
2. Eine gespeicherte Reise hält mindestens Ziel, Zeitraum bzw. flexiblen Suchmodus, Reisedauer, Präferenz, Bedingungen, zuletzt ausgewähltes Ergebnis und den letzten Analyse-Stand persistent vor.
3. Die Übersichtsansicht zeigt kompakt die bereits vor dieser Erweiterung im Reiseplaner verwendeten Kernparameter: Temperatur, Niederschlag/Regentage, Sonnenschein, Wind, Schnee/Schneehöhe und – sofern verfügbar – Wassertemperatur.
4. Die Übersicht ist kein zweiter Detailplaner. `Details` öffnet die vollständige bestehende Reiseauswertung einschließlich Tages-/Zeitraumdarstellung, Bedingungen, Empfehlung, Wasserinformation und Quellen-/Gewichtungsnachweis.
5. `Bearbeiten` übernimmt die gespeicherte Konfiguration zurück in die Planung. Entfernen löscht nur den Reise-Center-Eintrag, nicht einen Ortsfavoriten oder Event-Eintrag.
6. Die Reise-Center-Darstellung muss auf iPhone im Hochformat ohne horizontales Abschneiden oder unlesbare Kennzahlen funktionieren.

## Horizontabhängige Datenhierarchie

### Operationelle Mittelfrist

Für Reisetage, die von den operationellen MID-Prognose- und Ensemblepfaden belastbar abgedeckt werden, werden diese Daten vor der Klimatologie verwendet. Verwandte Modellvarianten werden über ihre Modellfamilie bzw. Unabhängigkeitsgruppe zusammengeführt; die Anzahl einzelner Ensemblemitglieder ist kein Qualitätsgewicht.

### Subseasonal / Witterung

Nach Ende der belastbaren täglichen Mittelfrist bis ungefähr Tag 46 werden keine scheinpräzisen Tagesprognosen erzeugt. ECMWF-EC46-Wochenanomalien werden als Witterungssignal auf die lokale Klimareferenz übertragen. Eine unabhängige GEFS-Komponente darf das Vorzeichen bzw. die Robustheit des Signals bestätigen oder relativieren, wird aber nicht als gleichartige doppelte Rohstimme addiert.

### Saisonaler Bereich

Ab ungefähr Tag 47 werden nur noch schwach gewichtete Monats-/Saisonanomalien aus den tatsächlich numerisch verfügbaren unabhängigen Modellsystemen auf die Klimatologie übertragen. DWD GCFS2.2/EPISODES kann im passenden Gebiet mit seinen verfügbaren Gütemaßen als regionaler Qualitätsanker dienen.

### Klimatologie

ERA5-Seamless 1991–2020 bleibt der lokale Referenzrahmen und gewinnt mit wachsendem Prognosevorlauf bewusst an Gewicht. Fehlen für einen Parameter belastbare aktuelle Modellinformationen, bleibt dieser Parameter klimatologisch statt durch eine andere Variable oder ein nicht passendes Modell ersetzt zu werden. Für Küsten-Wassertemperaturen bleibt NOAA OISST v2.1 die klimatologische Referenz.

## Gewichtung und Transparenz

- Gewichtung erfolgt nach Prognosehorizont, Parameterverfügbarkeit, Modellfamilien-Unabhängigkeit und – soweit vorhanden – Hindcast-/Skillinformation.
- Quellen außerhalb ihres tatsächlichen Prognosehorizonts werden nicht abgefragt bzw. nicht gewichtet.
- Ein großes Ensemble erhält nicht allein wegen seiner Mitgliederzahl mehr Modellgewicht.
- Aktuelle Modellinformation nimmt mit zunehmender Vorlaufzeit kontrolliert ab; Klimatologie bleibt stabilisierender Prior.
- Sobald belastbare MID-eigene Verifikationshistorie vorliegt, sollen die konservativen Startgewichte durch orts-, parameter-, wetterlagen- und horizontabhängige Skill-Gewichte ersetzt werden.
- Die Oberfläche weist mindestens aus: Quellenmodus (`Modellprognose + Klima`, `Witterungstrend + Klima`, `Saisontrend + Klima`, Kombination oder `Nur Klimatologie`), modellgestützte Reisetage, mittleren Modellanteil, unabhängige Modellfamilien sowie Status der geprüften Quellen (`verwendet`, `nicht verfügbar`, `außerhalb des Horizonts`).

## Regressionsschutz

Required Regression: `scripts/test-travel-center-forecast-fusion-098429.mjs`.
