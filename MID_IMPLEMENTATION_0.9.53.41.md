# MID v0.9.53.41 – CI-/Forecast-Konsistenzfix

## Anlass

Der GitHub-Produktionslauf von v0.9.53.40 brach in vier älteren Regressionen ab. Ursache war kein Produktions-/Datenquellenfehler, sondern eine nicht vollständig mit der weiterentwickelten Current-/Forecast-Architektur synchronisierte Regressionserwartung sowie ein Widerspruch zwischen dem neuen synthetischen `jetzt`-Punkt des 24-h-Profils und dem älteren verbindlichen Vollfenstervertrag.

## Korrektur

- Die historischen Current-/Niederschlagsregressionen prüfen nun den seit v0.9.53.40 gültigen einmaligen Temperaturpfad `finalizationObservedTemperature` statt den abgelösten direkten `currentObservedTemperature`-Write in `finalizeForecastHours`.
- Das 24-h-Wetterprofil verwendet wieder exakt 24 bereits finalisierte Stunden ab der aktuellen Stunde (`displayHours`).
- Der in v0.9.53.40 ergänzte zweite synthetische Current-/Anchor-Schritt im 24-h-Profil wurde entfernt. Damit wird der hyperlokale Stationsanker dort nicht erneut angewendet.
- Die lokale Anpassungskennzeichnung der finalisierten Stunden bleibt im Profil erhalten.
- Die 90-Minuten-Darstellung behält ihren weichen Übergang vom aktuellen Messanker zur kanonischen Forecast-Reihe.
- Die in v0.9.53.40 eingeführten eindeutigen Zeitangaben `morgen` / `übermorgen` / Wochentag+Datum sowie der entfernte redundante Cockpit-Kopfuntertitel bleiben unverändert erhalten.
- Keine zusätzlichen Wetterabrufe, keine Cache-TTL-Änderung und keine Worker-Funktionsänderung.

## Regression

Die vier im GitHub-Lauf fehlgeschlagenen Tests wurden mit der aktuellen Architektur abgeglichen, ohne die fachlichen Prüfungen abzuschwächen. Zusätzlich wurden die neueren Hyperlokal-/Cache-/Current-Regressionen gegen denselben kanonischen Pfad geprüft.
