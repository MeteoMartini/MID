# MID Langfrist/Witterung – Quellenerweiterung und Integrationsvertrag v0.9.77.29

Stand: 2026-09-02

## Ziel

MID soll für Witterung (ca. Tag 15–46) und Saison/Langfrist möglichst viele fachlich geeignete numerische Quellen verwenden. Eine Quelle muss **kein EPS** sein. Entscheidend sind numerische Werte, eine zum Zielhorizont passende Zeit-/Anomalieachse, nachvollziehbarer Modellstand und eine kanonische Modellidentität. Ein einzelner deterministischer Lauf oder ein bereits berechnetes Ensemble-Mittel darf deshalb als Modellbeitrag dienen; er erhält aber nicht mehr Gewicht als eine andere unabhängige Modelllinie.

## Saison / Monatsanomalien

Der bestehende kanonische Pool bleibt maßgeblich:

- C3S Seasonal: aktuell zehn getrennte operationelle Systeme (ECMWF, UKMO, Météo-France, DWD, CMCC, NCEP, JMA, zwei ECCC-Systeme, BOM), sofern der numerische C3S-Punktadapter aktiv ist.
- NOAA CPC NMME: dynamisch nur die im jeweils aktuellen ENSMEAN-Lauf tatsächlich vorhandenen Systeme mit Temperatur und Niederschlag.
- Open-Meteo Seasonal / ECMWF SEAS5: öffentlicher ECMWF-Fallback, keine zweite ECMWF-Stimme neben demselben C3S-System.
- DWD GCFS2.2 / EPISODES: eigenständiges DWD-Saisonsystem, Deutschland auf etwa 5 km heruntergerechnet. Die öffentlichen QA-Produkte liefern überlappende 3-Monats-Anomalien und Skillinformationen; diese werden nicht künstlich in Monatswerte zerlegt.

Für das Poor-Man’s-Ensemble gilt weiterhin: **eine Stimme je unabhängiger Modelllinie**. Ensemblegröße, Anbieterzahl und mehrfach veröffentlichte Kopien desselben Systems erhöhen das Gewicht nicht.

## Witterung / Tag 15–46

Direkt vergleichbar und im MID-Kern vorhanden:

- ECMWF IFS Extended Range / EC46 (über Open-Meteo Seasonal) bis 46 Tage.
- NOAA GEFS (über Open-Meteo Ensemble) bis 35 Tage.

Zusätzlicher DWD-Pfad:

- DWD Subseasonal EPISODES stellt ECMWF IFS ENS/Extended-Range für Deutschland und Nachbarländer statistisch heruntergerechnet auf etwa 5 km bereit. Es ist daher **kein unabhängiges drittes Witterungsmodell** neben EC46, sondern ein regionaler Downscaling-/Qualitätsanker derselben ECMWF-Modelllinie.
- DWD veröffentlicht dazu tägliche Felder sowie wöchentlich aggregierte Anomalie-/Qualitätsprodukte für u. a. Temperatur, Niederschlag, Bewölkung, Luftdruck und Wind.
- Wegen sehr großer Rohdatensätze und teilweise zugangsbeschränkter ESGF-Ausgaben wird der Browser diese NetCDF-Daten nicht direkt laden. Ein zukünftiger kostenneutraler MID-Punktpreprocessor darf die wöchentlichen EPISODES-Anomalien/Skillwerte regional als ECMWF-Anker einbringen, ohne eine zweite Poor-Man-Stimme zu erzeugen.

## Weitere Wetterdienste / Multi-Centre-Quellen

- WMO Lead Centre for Long-Range Forecast MME besitzt weitere Global Producing Centres und digitale LRF-Produkte. Der numerische Download ist jedoch zugangsgesteuert; ohne verifizierten Maschinenzugang werden diese Modelle nicht als aktiv angezeigt.
- APCC besitzt einen großen Einzelmodellpool, Einzelmodelldownloads sind jedoch authentifiziert. Das bereits aggregierte APCC-MME darf nicht zusätzlich zu denselben Einzelmodellen als Extra-Stimme gewichtet werden.
- ECCC CanSIPS kann als direkter Fallback für die beiden kanadischen Modelllinien dienen; diese Linien sind bereits über C3S/NMME repräsentiert und werden daher nicht doppelt gezählt.
- Weitere deterministische oder Ensemble-Mittel-Produkte können aufgenommen werden, sobald sie operationell numerisch erreichbar, zeitlich kompatibel und unabhängig identifiziert sind. Ein EPS ist kein Aufnahmezwang.

## Produktiver Integrationsvertrag

1. numerische Daten statt Karten-/Bildrückrechnung;
2. gleiche Zeitebene miteinander vergleichen (Woche mit Woche, Monat mit Monat, 3-Monats-Produkte separat);
3. `independenceKey` statt Providername für das Modellgewicht;
4. deterministischer Lauf / Ensemble-Mittel = zulässiger einzelner Modellbeitrag, aber ohne künstliche Rauchfahne;
5. probabilistische Memberdaten liefern zusätzlich interne Modellstreuung, nicht zusätzliches Modellgewicht;
6. DWD Subseasonal EPISODES = regionaler ECMWF-Anker, keine zweite EC46-Stimme;
7. DWD GCFS2.2 = unabhängige saisonale DWD-Linie;
8. keine kostenpflichtige API, neue Cloud-Ressource oder Loginquelle ohne ausdrückliche Freigabe.

## v0.9.77.29 – Witterungs-Verfügbarkeit

Der Witterungstrend wartete bisher nach dem EC46/GEFS-Abruf synchron auf eine große ERA5-Klimatologie 1991–2020. Ein hängender/rate-limitierter Archive-Aufruf konnte deshalb die komplette Sektion dauerhaft bei „Witterungstrend wird geladen …“ festhalten. v0.9.77.29 begrenzt die Modellquellen und die Klimatologie jeweils mit eigenen Abort-Budgets, zeigt bereits vorhandene EC46/GEFS-Werte auch ohne frisch geladene Klimakurve und verlängert den Stale-Trendfallback auf 36 Stunden.
