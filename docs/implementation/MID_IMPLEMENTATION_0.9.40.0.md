# MID v0.9.40.0

## App-weite Rapid-Update-Strategie

- Kurzfristprognosen priorisieren geeignete stündliche/rapid aktualisierte Regionalmodelle nach Standort, Frische, räumlicher Auflösung, Datenlatenz und Vorlauf. Der Rapid-Bonus ist auf den Kurzfristbereich begrenzt und nimmt mit zunehmendem Vorlauf ab.
- DWD ICON-D2-RUC wird über DWD Open Data als eigener operationeller Lauf erkannt (Initialisierung, Verfügbarkeit, dynamisch publizierter Zeithorizont/Zeitschritt). Die numerische Einbindung ist capability-gated: solange Open-Meteo keinen Forecast-Adapter für ICON-D2-RUC anbietet und MID keinen GRIB2-Decoder für das native Dreiecksgitter besitzt, wird reguläres ICON-D2 nicht irreführend als RUC etikettiert.
- Der Mehrmodell-Fusionspfad berücksichtigt tatsächlich verfügbare Rapid-Modelle, u. a. KNMI HARMONIE Europe/NL, UKMO UKV, MET Nordic, NOAA HRRR/NBM. Rapid-Provenienz, Aktualisierungsintervall, Auflösung und Kurzfristhorizont werden bis ins Frontend weitergegeben.
- Radar-/Modell-Niederschlagsart wählt dynamisch das frischeste geeignete hochauflösende Rapid-/Regionalmodell. Météo-France AROME HD/AROME 15-min nutzt den dedizierten Météo-France-Endpunkt; HRRR nutzt die dokumentierte reguläre Modell-ID mit nativer 15-Minuten-Ausgabe.
- Für den Radar-Phasenlayer bleiben die v0.9.39.13-Schutzmechanismen erhalten: maximal 247 Modellpunkte, drei sequenzielle Batches, Rate-Limit-Abbruch ohne Alias-Sturm, Cache/Stale-Fallback und konservative Laufalterprüfung.
- Meteogramme bieten in den passenden Domains KNMI HARMONIE Europe und UKV als Rapid-Update-Modelle an. MET Nordic wird dort bewusst nicht ergänzt, da die benötigten Druckflächenfelder fehlen.
- UKMO UK Ensemble 2 km wird innerhalb seiner Domain im Ensemble-Ranking bevorzugt; DWD ICON-D2-RUC-EPS wird mangels JSON/GRIB-Adapter nicht als vermeintlich numerisch genutztes Ensemble ausgegeben.
- Statische DWD-WMS-/Synoptikprodukte bleiben quellenspezifisch. Langfristige Modell- und Ensemblefamilien werden nicht allein wegen einer niedrigeren Aktualisierungsfrequenz verdrängt.

## Qualitäts- und Transparenzregeln

- Keine Umbenennung von regulärem ICON-D2 in ICON-D2-RUC.
- Keine Kennzeichnung regulärer AROME-Läufe als Rapid Update; nur die stündlich erneuerten 15-Minuten-Produkte erhalten diese Kennzeichnung.
- Ein verfügbarer DWD-RUC-Lauf kann als Verfügbarkeitsmetadatum angezeigt werden, ohne vorzutäuschen, dass seine nativen GRIB2-Felder bereits numerisch in MID verarbeitet werden.
- Neuer Regressionstest `scripts/test-ruc-rapid-update-policy-09400.mjs` schützt Modellwahl, DWD-RUC-Metadaten, Rapid-Provenienz, AROME-Endpunkt, Meteogramm-Rapidmodelle und UK-Rapid-Ensemble-Priorität.
