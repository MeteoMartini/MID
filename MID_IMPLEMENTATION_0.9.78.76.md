# MID 0.9.78.76 – Wolkenschichten im 24-h-Wetterprofil

Basis: MID 0.9.78.75. Keine Änderung der meteorologischen Gesamtbewölkung oder der Open-Meteo-Abfrage.

## Befund

Im 24-h-Wetterprofil konnte bei vorhandener Gesamtbewölkung (z. B. 49 %) für H/M/L gleichzeitig 0/0/0 % erscheinen. Die Kernabfrage fordert `cloud_cover`, `cloud_cover_low`, `cloud_cover_mid` und `cloud_cover_high` bereits sowohl im Browserpfad als auch im Worker an. Der Fehler lag in der Profilaufbereitung: nicht vorhandene bzw. nicht endliche Schichtwerte wurden in mehreren Anzeige-/Aggregationspfaden durch `Number(...) || 0` als echte 0 % interpretiert.

Zusätzlich wird eine offensichtlich inkonsistente Quellkombination (Gesamtbewölkung >= 5 %, alle drei Schichten gleichzeitig <= 0,5 %) nicht mehr als belastbare 0/0/0-Schichtung ausgegeben. Eine Schichtaufteilung wird nicht aus der Gesamtbewölkung erfunden.

## Korrektur

- Fehlende H/M/L-Werte bleiben `undefined`/`NaN` und werden bei 1-h-/3-h-Aggregation nicht in 0 % umgewandelt.
- Im Auswahlwert und in den Einzeldaten erscheint bei vollständig fehlender/inkonsistenter Schichtinformation `H/M/L n. v.` statt `0/0/0 %`.
- Teilweise verfügbare Schichten bleiben einzeln sichtbar, fehlende Einzelwerte werden mit `–` gekennzeichnet.
- Die H/M/L-Graubänder verwenden nur tatsächlich endliche Schichtwerte; fehlende Nachbarwerte werden bei der Zellgradientenbildung nicht als künstliche 0-%-Ränder eingemischt.
- Gesamtbewölkung bleibt unverändert und wird nicht aus H/M/L neu berechnet.
- Info-Hinweis im Wetterprofil erläutert die getrennten Quellfelder und dass MID keine Schichtaufteilung rekonstruiert.

## Regression

Neue Regression `scripts/test-weather-profile-cloud-layer-availability-097876.mjs` schützt Quellfeldanforderung, Missing-Value-Semantik, die Inkonsistenzsperre und die UI-Ausgabe. Der bestehende Wolkenprofiltest wurde an die missing-value-sichere Gradientenlogik angepasst.

## Worker

Keine fachliche Workeränderung. Die Worker-Kernabfrage enthielt alle vier Wolkenfelder bereits korrekt; nur die Releaseversionskonstante wird projektweit synchronisiert.
