# MID v0.9.40.17

## 14-Tage-Sektion
- Wettertitel und Wetterpiktogramm der Tageskacheln verwenden nun dieselbe zentrale Tagescharakteristik wie die bestehende 14-Tage-Ensembleansicht und die übrigen Tagesdarstellungen.
- Die 14-Tage-Karten werten dafür die zugehörigen Stundenwerte über `dayWeatherCharacter` aus; sekundäre Tageshinweise werden über `dayWeatherCharacterText` übernommen.
- Dadurch greift auch hier die appweite Niederschlags-Plausibilisierung aus `precipitationParts`: unplausibler Sprühregen wird je nach Evidenz zu Regen beziehungsweise konvektivem Niederschlag/Schauern korrigiert, während plausibler Sprühregen erhalten bleibt.
- Stratiforme und konvektive Niederschlagssignale werden damit nicht mehr allein aus dem rohen Tages-WMO-Code abgeleitet.
- Die Mengenzeile der 14-Tage-Karten heißt fachlich korrekt „Niederschlag“ statt pauschal „Regen“.

## Regression
- Neuer Vertragstest `test-cockpit-fourteen-day-character-094017.mjs` schützt die Übernahme der zentralen Tagescharakteristik sowie der Sprühregen-/Konvektivlogik in das 14-Tage-Cockpit.
