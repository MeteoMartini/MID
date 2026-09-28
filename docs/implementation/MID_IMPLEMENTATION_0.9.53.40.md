# MID v0.9.53.40 – konsistenter Current-/Kurzfrist-Temperaturpfad

## Anlass

Im Current-Modul konnte ein frischer hyperlokaler Temperaturwert von 21 °C gleichzeitig mit 20 °C in der unmittelbar folgenden 90-Minuten-Leiste erscheinen. Die Abweichung war nicht durch einen alten Service-Worker-Cache verursacht, sondern durch eine doppelte Anwendung desselben Stationsankers in der operativen Forecast-Kette.

## Ursache und Korrektur

- Ein frischer Stationswert wurde bislang zunächst über die allgemeine Current/Stunden-Reconciliation in die nächstgelegene Stunde geschrieben.
- Danach wurde derselbe Stationswert über `applyHyperlocalForecastHours` erneut relativ zur unveränderten Modellreferenz verrechnet. Dadurch konnte die Stunden-/15-Minuten-Darstellung zu stark nach unten bzw. oben korrigiert werden.
- Liegt nun ein feldbezogen frischer Temperatur-Stationsanker vor, wird er ausschließlich in der kanonischen Hyperlokalstufe verarbeitet. Die allgemeine Current/Stunden-Reconciliation erhält dann keinen zweiten beobachteten Temperaturwert.
- Derselbe Schutz wurde für den Event-/Aktivitätspfad übernommen.
- Bereits lokal finalisierte Stunden werden in `ShortTermForecast` nicht nochmals gegen denselben Current-Anker assimiliert.

## Current → 90 Minuten → 24 Stunden

- Die erste Viertelstunde startet am aktuellen beobachteten Temperaturanker.
- Danach erfolgt bis Minute 90 ein stetiger Übergang zur bereits finalisierten Forecast-Temperatur, statt eines sichtbaren Sprungs.
- Das 24-h-Profil erhält einen synthetischen `jetzt`-Punkt am tatsächlichen aktuellen Zeitpunkt und verwendet denselben Übergang.
- Klassische Kurzfristansicht und Prognose-Cockpit erhalten denselben `shortTermAnchor`.
- Die Apparent-Temperature folgt im Übergang derselben Temperaturverschiebung, sofern kein eigener beobachteter Apparent-Anker existiert.
- Es wurden keine zusätzlichen Quellenabrufe, Worker-Requests oder kürzeren Cache-TTLs eingeführt.

## Prognose-Cockpit / Text

- Der redundante, auf kleinen Displays abgeschnittene Zusammenfassungstext direkt unter `Kurzfrist · 7 Tage · 14 Tage` wurde entfernt. Die einzelnen Horizontkarten behalten ihre kompakten Inhaltsvorschauen; die ausführliche aktive Kurzfrist-Zusammenfassung bleibt darunter erhalten.
- Kurzfristtexte geben bei einem Wetterwechsel am Folgetag nicht mehr nur eine potenziell missverständliche Uhrzeit aus, sondern z. B. `morgen 08:00`; entsprechend `übermorgen` bzw. danach Wochentag/Datum.

## Regressionsschutz

- Neuer Required-Test `scripts/test-current-shortterm-temperature-consistency-095340.mjs`.
- Der v0.9.53.39-Test wurde auf den neuen einmaligen Reconciliation-Pfad fortgeschrieben, ohne die dort geschützten Fast-/Full-Pass-, Cache- und Force-Fresh-Regeln abzuschwächen.
