# MID v0.8.33.17

## Nachhaltige Kopplung von Niederschlagsmenge und Wahrscheinlichkeit

### Ursache

Die Tages-/Stunden-Konsistenz aus v0.8.33.13 durfte einen bereits nassen WMO-Wettercode als Auswahlkriterium für die Verteilung einer noch nicht stündlich zugeordneten Tagesmenge verwenden. Dadurch konnte eine Stunde mit 0 % Wahrscheinlichkeit trotzdem einen Teil der Tagesmenge erhalten. Die bisherige zentrale Bereinigung entfernte außerdem nur ungestützte Mengen bis 0,15 mm; ein nachträglich zugeordneter Wert von 0,4 mm blieb daher bestehen.

### Korrektur

- Forecast-Niederschlag, Niederschlagsart und Wettercode werden bei 0–5 % Wahrscheinlichkeit nun unabhängig von der Mengenhöhe gemeinsam entfernt.
- Tagesmengen werden ausschließlich auf Stunden verteilt, die selbst ein belastbares Wahrscheinlichkeitssignal besitzen.
- Ein nasser Wettercode darf innerhalb dieses Wahrscheinlichkeitsfensters priorisieren, aber keine Stunde ohne Wahrscheinlichkeit mehr auswählen.
- Nach Modellfusion, Wetterzwilling, Radar-/Gewitternowcast und Tages-/Stundenabgleich durchläuft jede finale Forecast-Stunde nochmals dieselbe zentrale Konsistenzprüfung.
- Die aktuelle Wetterkarte, Wassersportansicht, Gewitterauswertung, Tagesdetailansicht, 7-Tage-Prognose, Ensemble-Referenz und Exporte verwenden dieselbe finale Stundenreihe.
- Der Cloudflare-Worker nutzt dieselbe Regel für Forecast-Fusion, native Widgets und Modelllauf-Push-Auswertung.

Es wird keine Niederschlagswahrscheinlichkeit künstlich erhöht. Fehlt eine ausreichende probabilistische Stützung, wird das widersprüchliche Forecast-Signal entfernt. Beobachteter oder radargestützter Niederschlag bleibt erhalten, da dessen Assimilation eine eigene belastbare Wahrscheinlichkeit liefert.
