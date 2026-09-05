# MID 0.9.78.65 – Mehrparameter-Modellübereinstimmung für 14 Tage

Dieses Release ersetzt in klassischer Ensembleansicht und kompaktem Cockpit den Temperaturindex und die unvalidierte 72-Punkte-Zeitraumgrenze durch eine gemeinsame, transparente Mehrparameterbewertung. Grundlage ist das ausgelieferte Release 0.9.78.64. Frühere Dokumente beschreiben historische Versionsstände.

## Was die Anzeige bewertet

Jeder Tag erhält separate Einschätzungen für Temperatur (Tmin und Tmax), Niederschlag, Wind einschließlich Böen und relative Sonnenscheindauer. Angezeigt werden hoch, mittel, gering oder nicht bewertbar. Die Gesamtbewertung folgt dem schwächsten Bereich; ein fehlender Bereich macht die Gesamtaussage nicht bewertbar. Hohe Temperaturübereinstimmung kann unsichere Böen nicht kompensieren. Bewölkung wird nicht aus fehlender Sonnenscheindauer erfunden.

Die Kennzahl beschreibt Übereinstimmung innerhalb der verwendeten nativen Ensemblelösungen, keine kalibrierte Vorhersagegenauigkeit. Ein klar prognostizierter Sturm kann hohe Übereinstimmung aufweisen. Ein Nassanteil von 50 % kann statistisch zuverlässig sein, lässt aber den konkreten Trocken-/Nass-Ausgang offen. Diese beiden Aussagen werden nicht verwechselt.

## Nachvollziehbare Anzeigegrenzen

Die folgenden Grenzen sind **MID-Darstellungstoleranzen**, keine aus DWD, ECMWF oder meteoblue übernommenen oder empirisch validierten Gütegrenzen. Die Angaben sind Breiten zwischen gewichtetem P10 und P90, nicht Fehler gegenüber Messungen.

| Parameter | Hoch bis einschließlich | Mittel bis einschließlich |
|---|---:|---:|
| Tmin und Tmax, jeweils | 4 K | 8 K |
| Tagesniederschlag | 3 mm | 10 mm |
| Tagesmaximum Wind | 8 kt | 16 kt |
| Tagesmaximum Böen | 12 kt | 24 kt |
| Sonne relativ zur astronomisch möglichen Dauer | 25 Prozentpunkte | 50 Prozentpunkte |

Größere Breiten bedeuten geringe Übereinstimmung. Beim Niederschlag begrenzt zusätzlich die Offenheit des Nass-/Trocken-Ausgangs die Kategorie: der kleinere Anteil der beiden Ausgänge darf für hoch höchstens 20 %, für mittel höchstens 35 % betragen. Nass bedeutet hier mehr als 0,2 mm im aggregierten Tag. Der angezeigte Nassanteil ist gewichtet, nicht kalibriert.

Native Beiträge werden innerhalb der verfügbaren Modellgruppen und Varianten normalisiert. Mehr Mitglieder einer Gruppe allein verschaffen dieser Gruppe keine entsprechend größere Stimme. Bestehende parameterabhängige Modellgewichte bleiben erhalten; auch diese sind keine neu empirisch optimierten Gewichte. Getrennte Modellgruppen sind nicht statistisch unabhängig: gemeinsame Ausgangsdaten und Modellverwandtschaft können verbleiben.

## Datenqualität und Alterung

Für hohe Einstufung sind mindestens sechs vollständige native Mitglieder aus mindestens zwei getrennten Gruppen, mindestens 80 % Abdeckung der geladenen nativen Mitglieder und Vertretung aller für den Tag geladenen Gruppen nötig. Vollständig heißt: Parameterwerte über den gesamten lokalen Tag, nicht nur vorhandene Temperaturwerte. Fehlende Böen entwerten die Windbewertung separat. Fehlende ganze Stunden verhindern eine vollständige Tagesbewertung. Doppelte lokale Zeitstempel werden konservativ nicht als vollständig akzeptiert, auch beim herbstlichen Uhrwechsel ohne eindeutige Offsets.

Niederschlag und Sonnenscheindauer werden als Summen der vorangegangenen Stunde dem betroffenen lokalen Tag zugeordnet. Insbesondere gehört der Wert um 00:00 zum Vortag; fehlt das abschließende Intervall, ist die Tagesabdeckung unvollständig. [Open-Meteo: Stundenparameter](https://open-meteo.com/en/docs)

Synthetische Mean-/Spread-Rekonstruktionen bleiben für ihre bestehenden Diagramme verfügbar, werden aber nicht als native Mitglieder für diese Bewertung gezählt. Nicht geladene Anbieter werden nicht als vorhandene Daten ausgegeben; der Nenner beschreibt ausdrücklich geladene Beiträge. Die Anzeige ist damit kein Nachweis vollständiger Verfügbarkeit sämtlicher denkbarer Wettermodelle.

Die älteste beigetragene Initialisierung ist einsehbar. Hohe Einstufung endet spätestens nach zwei konfigurierten Aktualisierungszyklen eines beitragenden Laufs. Unbekannte Laufzeiten und unzureichende Abdeckung verhindern hoch; bekannte große Streuung wird nicht nach oben korrigiert. Die Hauptansichten prüfen Alterung jede Minute und beim Sichtbarwerden erneut. Diese Aktualitätsregel ist ebenfalls ein transparenter Produktvertrag, keine allgemeine atmosphärische Vorhersagbarkeitsgrenze. Der Ensemblecache verwendet Generation v17.

## Zeiträume und Bedienung

Gemeinsame Fenster enthalten nur lückenlos aufeinanderfolgende Kalendertage mit hoher Bewertung und ausreichender Datenqualität in allen vier Bereichen. Beginn und Ende werden vollständig angezeigt. Später erneut konsistente Fenster werden separat aufgeführt; einzelne Parameter können längere Fenster besitzen. Eine Verschlechterung wird aus einer tatsächlichen Änderung zwischen benachbarten Tagen abgeleitet, nicht aus dem größten Temperaturspread der ersten Woche.

Diese Fenster sind tägliche Übereinstimmungsfenster, keine gemeinsame Wahrscheinlichkeit einer mehrtägigen Wetterfolge und keine Wetterfreigabe. Es gibt keine feste Behauptung, Tag 1–7 sei sicher oder Tag 14 grundsätzlich unbrauchbar. Für aktivitätsspezifische Planung wären konkrete Ereignisschwellen und gemeinsame Member-Trajektorien nötig.

Beide Ansichten verwenden dieselben Berechnungen und aufklappbaren Parameterdetails. Farben werden durch Text ergänzt; fehlende Evidenz ist grau. Standardmodus und erweiterter Modus behalten Zugriff auf die Details. Die frühere Prozentzahl entfällt in der 14d-Konfidenzanzeige. Numerische Kategorienwerte werden nur intern zur Diagrammdekoration verwendet.

## Vergleich und wissenschaftliche Einordnung

- **ECMWF** beschreibt Mittelfrist-Ensembles bis 15 Tage ausdrücklich als Band möglicher Entwicklungen einschließlich Starkregen- und Starkwindereignissen. Daraus folgt eine Betrachtung mehrerer Variablen statt eines alleinigen Temperaturindex. Daraus folgen jedoch nicht die oben gewählten MID-Grenzen. [ECMWF: Medium-range forecasts](https://www.ecmwf.int/en/forecasts/documentation-and-support/medium-range-forecasts)
- **meteoblue** stellt in seiner 14d-Produktbeschreibung Temperatur, Niederschlag, Wolken und Wind sowie Multimodellinformationen dar. Das unterstützt die getrennte Sicht auf Wetterparameter. Die öffentlich zugängliche Beschreibung liefert keine vollständig reproduzierbare Formel für eine numerisch identische MID-Konfidenz. Unterschiede können durch Modelle, Aktualisierungsstände und Nachbearbeitung entstehen; ohne identische Orts-/Zeit-/Laufpaare ist dies keine nachgewiesene Erklärung der konkret beobachteten Abweichung. [meteoblue: Improved 14-Day weather forecast](https://www.meteoblue.com/en/blog/article/show/40004_Improved%2B14-Day%2Bweather%2Bforecast)
- **DWD** beschreibt Ensemblevorhersagen als Instrument zur Abschätzung von Vorhersageunsicherheit und fordert gerade mittelfristig Unsicherheitsangaben. MID übernimmt damit das Prinzip, nicht eine vermeintlich offizielle DWD-Konfidenzformel. [DWD: Ensemble-Vorhersage](https://www.dwd.de/DE/forschung/wettervorhersage/num_modellierung/04_ensemble_methoden/ensemble_vorhersage/ensemble_vorhersage_node.html)
- **Met Office** unterscheidet Ereigniswahrscheinlichkeit und deren Verifikation: die Güte einer Wahrscheinlichkeit ergibt sich aus vielen Vorhersagen und beobachteten Ausgängen. Ein einzelner Vergleich beweist keine Fehlkalibrierung. [Met Office: Using ensemble forecasts in decision-making](https://www.metoffice.gov.uk/research/weather/ensemble-forecasting/decision-making)

Für empirisch belastbare Konfidenz braucht MID archivierte Ausgabezeitpunkte, unabhängige Beobachtungen und getrennte Auswertungen nach Parameter, Vorlauf, Region und Saison. Geeignete Prüfungen sind Intervallabdeckung, Spread-Skill-Beziehung, CRPS und bei definierten Ereignissen Brier-Score sowie Zuverlässigkeitsdiagramme, mit zeitlich getrennten Trainings- und Prüfzeiträumen. Eine solche neue Kalibrierung wird in diesem Release nicht behauptet.

## Umfang und Grenzen

Die Änderung betrifft den gemeinsamen TypeScript-Kern und die beiden 14d-Ansichten. Browser/PWA und die bestehende iOS-Webhülle verwenden diesen Kern. Die übrigen v64-Korrekturen bleiben enthalten. Keine neuen Anbieterabfragen, kein kostenpflichtiger Dienst und keine zusätzliche Beobachtungsdatenbank werden eingerichtet. Prüfergebnisse stehen in MID_VALIDATION_0.9.78.65.md. Eine produktive Live-Abnahme und ein Test auf physischem iPhone sind nicht Bestandteil der lokalen Prüfungen.
