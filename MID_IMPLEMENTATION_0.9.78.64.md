# MID 0.9.78.64 – wissenschaftlicher Audit und Restkorrekturen

Basis: bereitgestellter Stand 0.9.78.63. Gemeinsamer Browser-/PWA-/Capacitor-Kern; keine Bereitstellung und keine neuen Dienste oder Abhängigkeiten.

## 14-Tage-Konfidenz: Befund und Entscheidung

Der bisherige MID-Wert ist keine empirisch kalibrierte Wahrscheinlichkeit einer richtigen Wettervorhersage. `src/ensembleConfidence.ts` kombiniert Temperaturstreuung, Vorlaufindex und relative Modellgruppenabdeckung. Die Koeffizienten wurden nicht in diesem Release aus unabhängigen Beobachtungen geschätzt. Ein Wert 80 bedeutet insbesondere nicht, dass 80 % der vorhergesagten Wetterverläufe eintreffen.

Die bisherige additive Formel bleibt als ausdrücklich heuristischer Temperatur-Konsistenzindex erhalten: 48 % Streuungsanteil, 22 % Vorlaufanteil und 30 % Abdeckungsanteil. Deren Komponenten sind begrenzt; deshalb kann der Index selbst bei großer Streuung noch mittlere Werte annehmen. Dies ist ein weiterer Grund, ihn nicht als Güte oder Eintrittswahrscheinlichkeit auszugeben. Fehlende oder ungültige Eingaben erzeugen keine hohe Scheinkonfidenz. Es gibt keine nachträgliche Anpassung an einzelne meteoblue-Zahlen.

Korrigiert wurden:

- Prozent-/Prognosesicherheitsbeschriftungen der betroffenen 14d-Anzeigen: nun Temperatur-Konsistenz als Index von 100 mit Unkalibriert-Hinweis. Der Kompass verspricht keinen allgemein belastbaren Wetterzeitraum mehr.
- Unterschiedliche Berechnungsgrundlagen in kompakter und ausführlicher Darstellung: beide berücksichtigen nun die größere P10–P90-Breite von Tiefst- und Höchsttemperatur.
- Beschneidung plausibler Ensemblelösungen: die bisherige ±8-K-Medianselektion und die nachfolgenden Median-/IQR-Filter der Ensemble-Bänder wurden entfernt. Auch eine Minderheitslösung gehört zur Unsicherheitsverteilung. Eingangsdatenprüfung, Modellgruppen-/Variantenwahl und Gewichte bleiben bestehen.
- Cachegeneration des 14d-Ensembles erhöht, damit alte beschnittene Verteilungen nicht weiterverwendet werden.

Ein synthetischer Verhaltenstest mit zwei Modellgruppen und 20 Mitgliedern schützt jetzt ausdrücklich eine warme/nasse/windige 20-%-Minderheitslösung: P90 bleibt bei 32 °C, 100 mm und 80 kt; die Mitgliedszahl bleibt 20. Das ist ein Rechen- und Regressionstest, kein Nachweis realer Vorhersagegüte.

### Vergleich mit meteoblue und wissenschaftliche Einordnung

meteoblue beschreibt seine 14d-Vorhersagbarkeit als orts-, wetterlagen- und tagesabhängig. Die zugängliche Produktbeschreibung veröffentlicht jedoch keine vollständig reproduzierbare Formel, aus der sich die vom Nutzer beobachteten Zahlen nachrechnen ließen. Die weiterführenden Hilfeseiten waren für diesen Abruf gesperrt. Unterschiedliche Ensembles, Laufzeiten, Nachbearbeitungen und Kennzahlendefinitionen sind mögliche Ursachen, keine für den konkreten Fall nachgewiesenen Ursachen. Ohne identische Orte, Gültigkeitszeiten, Modellstände und Screenshots ist kein numerischer Paarvergleich belegt. [meteoblue, 14-Day forecast](https://www.meteoblue.com/en/blog/article/show/40004_Improved%2B14-Day%2Bweather%2Bforecast)

ECMWF unterscheidet die Schärfe einer Ensembleverteilung von ihrer Zuverlässigkeit. Enge Verteilungen allein beweisen keine verlässliche Prognose; eine verlässliche Ereigniswahrscheinlichkeit muss langfristig zu den beobachteten Häufigkeiten passen. Das begründet die semantische Trennung und den Verzicht auf eine behauptete Kalibrierung. [ECMWF, Ensemble weather forecasting](https://www.ecmwf.int/en/about/media-centre/focus/2017/fact-sheet-ensemble-weather-forecasting)

Für echte MID-Vorhersagegüte sind archivierte Ausgabezeitpunkte, unabhängige Beobachtungen und getrennte Auswertungen nach Parameter, Vorlauf, Region und Saison nötig. Geeignet sind unter anderem MAE/RMSE, CRPS, Spread-Skill-Prüfungen, Intervallabdeckung und bei definierten Ereignissen Brier-Score sowie Zuverlässigkeitsdiagramme. Zeitlich getrennte Trainings-/Prüfdaten und Unsicherheitsintervalle müssen eine spätere Kalibrierung absichern. Bestehende Verifikationsfunktionen bleiben erhalten; dieses Release behauptet weder eine neu validierte Kalibrierung noch eine Gleichwertigkeit mit meteoblue.

## Weitere korrigierte Fehler

| Bereich | Änderung |
| --- | --- |
| Saison-/Warnensemble | Fehlende Werte und leere Zeichenketten bleiben unbekannt statt 0. Betroffene Caches invalidiert. |
| Skybar | Fehlende Sonne und Bewölkung erzeugen kein maximales Sonnenband. Vierstufenlogik und direkte Sonnenscheindauer bleiben erhalten. |
| Events | Mitternachtsüberschreitung unterstützt; Uhrzeiten werden mit Ortszeitzone verarbeitet. Gleiche Start-/Endzeit wird nicht stillschweigend in eine Stunde umgedeutet. |
| Ereigniswahrscheinlichkeit | Kein Stundenmittel als Ersatz für die Wahrscheinlichkeit im gesamten Event. Native Member-Auswertung benötigt vollständige Intervallabdeckung. Fehlende Werte verhindern eine belastbare Entwarnung. |
| Radar-Komposit | Ankunft und Unsicherheitsfenster bleiben innerhalb Beobachtungszeit +120 min. Fehlende Bewegungskonfidenz wird nicht zu mittel. KONRAD ohne bekannten Beobachtungszeitpunkt wird nicht zeitlich passend ausgegeben. |
| Radar-Anzeige | Hauptlayerstatus behauptet nicht mehr Vollständigkeit aller Ebenen. Die neun künstlichen Nowcast-Szenarien werden als unkalibriert und ihr Anteil nicht als kalibrierte Trefferwahrscheinlichkeit beschriftet. |
| Flugprofil | AGL addiert das jeweilige Gelände; FL wird auf die ISA-Druckfläche bezogen und über das Modellprofil lokalisiert. Keine Randwertextrapolation außerhalb der Profile. Geometrische Schichtgrenzen werden als ft MSL ausgegeben. Fehlende Profile oder wesentliche Eingangsdaten verhindern Entwarnung. |
| Lüftung | Fehlende Innen-/Wetterdaten sind keine Freigabe. Bei erhöhtem CO₂ zählt das früheste zulässige geeignete Fenster, nicht das spätere thermisch beste. |
| Reiseklima | Häufigkeit nasser Tage wird durch die Anzahl gültiger Niederschlagswerte geteilt, nicht durch die größere Stichprobe anderer Parameter. |

Die Radargrenze ist ein konservativer MID-Produktvertrag, kein universelles physikalisches Gesetz. Auch RADVOR nennt einen Vorhersagehorizont bis zwei Stunden. [DWD RADVOR](https://www.dwd.de/EN/ourservices/radvor/radvor.html)

Flugflächen beziehen sich auf konstante Druckflächen relativ zum Standarddruck, nicht einfach auf geometrische Höhe über Meer. Die neue Umsetzung verwendet die ISA-Beziehung und eine logarithmische Druckinterpolation der Modellhöhen. Sie ist weiterhin Modelldiagnostik und ersetzt weder ein amtliches Flugwetterbriefing noch operative Flugplanung. [FAA, Flight level](https://www.faa.gov/air_traffic/publications/atpubs/atc/PCG/F.HTM)

Die CO₂-Änderung verhindert die bisher mögliche unnötige Verzögerung. Die vorhandene 900-ppm-Frühschwelle bleibt eine vorsorgliche Produkteinstellung, kein neuer UBA-Grenzwert. Das UBA beschreibt bis 1000 ppm als unauffällig, 1000–2000 ppm als auffällig und darüber als hygienisch inakzeptabel. Bei ungünstigem Wetter muss geeigneter Luftwechsel unabhängig vom Komfortfenster organisiert werden. [UBA](https://www.umweltbundesamt.de/irl2024-p08)

## Grenzen und Abnahme

Die neuen Verhaltenstests liegen in `scripts/test-audit-science-097864.mjs`. Historische Wortlauttests wurden an die korrigierten Verträge angepasst, nicht entfernt. Die endgültigen lokalen Prüfergebnisse stehen in `MID_VALIDATION_0.9.78.64.md`.

Nicht behauptet werden: vollständige Live-DWD-/Satelliten-/Netatmo-Prüfung, iPhone-Gerätetest, umfassende visuelle oder WCAG-Zertifizierung, statistisch validierte 14d-Güte oder erfolgreicher Deploymentlauf. Künstliche Ensembles und Modellgefahren bleiben entsprechend ihrer Herkunft zu interpretieren. Die schwierige Herbst-Zeitumstellung wird bei nicht eindeutig zuordenbaren doppelten lokalen Member-Zeitstempeln abgelehnt statt mit doppelten Niederschlagsintervallen gerechnet.
