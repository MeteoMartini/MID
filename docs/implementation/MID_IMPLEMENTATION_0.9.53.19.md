# MID 0.9.53.19

Hyperlokale Ergebnisdarstellung und Event-Center-Konsistenz.

- Die Restfeldanalyse selbst bleibt unverändert: eine Korrektur nahe 0 ist fachlich korrekt, wenn Beobachtung und hochaufgelöster Modellhintergrund bereits übereinstimmen. Es wird keine künstliche Mindestkorrektur eingeführt.
- In der kompakten Hyperlokalzeile werden nur meteorologisch relevante Korrekturen hervorgehoben: |ΔT| >= 0,2 K und |Gelände-Wind| >= 1 %. Kleinere Werte werden kompakt als „Temp./Wind nahe Modell“ beschrieben; im Info-Popover bleiben die exakten Rohwerte sichtbar.
- Die Bezeichnung der Windkorrektur wurde präzisiert: sie beschreibt die dynamische Gelände-/Oberflächenexposition, nicht die gesamte hyperlokale Windanalyse.
- Die Event-Glockenliste zeigt vor jedem Eintrag ein WeatherPictogram und übernimmt dafür weatherCode, weatherLabel und isDay aus der repräsentativen Event-Zusammenfassung.
- Auch die kompakte Event-Center-Übersicht verwendet nun denselben Tag-/Nachtstatus statt eines fest erzwungenen Tagespiktogramms.
- Required Regression: scripts/test-hyperlocal-event-pictogram-095319.mjs.
