# MID Implementation v0.9.78.7

Datum: 2026-09-03

## Anlass

Die erneute mobile 24-h-Profilprüfung für Niederkassel/Rheidt zeigt, dass v0.9.78.6 zwar die aktuelle trockene Stunde korrekt mit `0,0 mm` bei separat weiter sichtbarer Eintrittswahrscheinlichkeit darstellt, die nachfolgenden Stundenmengen aber weiterhin zu stark vom nassen ICON-D2-RUC geprägt sein können. Der erste Ausreißerschutz war damit wirksam, aber im konvektiven Fall noch nicht ausreichend.

## Ursache

Der v0.9.78.6-Konsens verwendete die RUC-EPS-Niederschlagswahrscheinlichkeit teilweise als Stütze für die deterministische RUC-Mengenamplitude. Eine hohe Eintrittswahrscheinlichkeit beantwortet jedoch nur, ob Niederschlag wahrscheinlich ist, nicht ob beispielsweise 0,4 oder 2,0 mm in einer Stunde zu erwarten sind. Zusätzlich wurde der MOSMIX-RR1c-Anker gerade bei konvektiver Lage auf 60 % seines normalen Gewichts reduziert.

## Umsetzung

### Eintritt und Menge getrennt

- RUC-EPS stützt weiterhin die **Eintrittswahrscheinlichkeit**.
- Die **Mengenamplitude** eines nassen RUC wird nur noch gegen Best Match und DWD-MOSMIX RR1c geprüft.
- Hohe RUC-EPS-PoP kann einen Niederschlag nicht mehr allein mengenmäßig hochhalten.

### Kontinuierlicher Overshoot-Guard

Für einen gegenüber den lokalen Mengenankern deutlich nasseren RUC wird nun zusätzlich die relative Überschreitung gegenüber einem qualitätsgewichteten lokalen Mengenreferenzwert bewertet. Der RUC-Anteil sinkt kontinuierlich mit wachsendem Overshoot. Es gibt weiterhin keine pauschale harte Obergrenze.

### MOSMIX im konvektiven Fall

MOSMIX wird bei Konvektion nicht mehr auf 60 % seines normalen Gewichtes zurückgesetzt, sondern nur noch moderat auf 85 %. Damit bleibt hochaufgelöste RUC-Konvektion relevant, ohne den lokalen DWD-Punktkonsens praktisch auszuschalten.

### Diagnose

Zusätzlich stehen intern zur Verfügung:

- `localPrecipitationReferenceMm`
- `rucPrecipitationOvershootRatio`

Damit lässt sich unmittelbar erkennen, ob eine Stundenmenge durch einen starken RUC-Überschuss entstanden wäre und wie stark der Mengen-Guard gegriffen hat.

## Wirkung im numerischen Schutztest

Bei Best Match `0,2 mm`, MOSMIX `0,2 mm`, RUC `2,1 mm`, RUC-EPS `80 %` und konvektivem Signal wird die fusionierte Menge auf rund `0,42 mm` gedrückt. Ein gut gestützter Fall Best Match `1,2 mm`, MOSMIX `1,3 mm`, RUC `1,5 mm` bleibt dagegen bei rund `1,35 mm` und wird somit nicht künstlich trockengeglättet.

## Deployment

Die Änderung liegt im Worker-Fachkern. Ein Worker-Update ist daher für die Wirkung von v0.9.78.7 erforderlich. Die Professional-App enthält die passenden Diagnosefelder und den unveränderten appweiten Forecast-Fusionspfad.
