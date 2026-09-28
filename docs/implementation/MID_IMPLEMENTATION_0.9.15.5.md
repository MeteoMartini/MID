# MID v0.9.15.5 – Tagescharakter und datumsübergreifende Folgenacht

## Ausgangsbasis

Lokaler, zuletzt ausgegebener MID-Stand v0.9.15.4. Die Änderung ist ein Wartungsrelease, da bestehende Tages-/Nachtzuordnungen korrigiert und vereinheitlicht werden.

## Umsetzung

- Neues zentrales Modul `src/forecastPeriods.ts` für Tagesfenster und Folgenacht.
- Tagesfenster: bevorzugt Stunden mit `isDay=true`; ziviler Fallback 07:00–18:59 Uhr bei unvollständigem Astronomiesignal.
- Folgenacht: Nachtstunden am Abend des Prognosetags plus Nachtstunden am Morgen des Folgetags; ziviler Fallback 19:00–06:59 Uhr.
- `dayWeatherCharacter()` filtert intern zwingend auf das Tagesfenster. Dadurch sind alle Aufrufer – klassische 7-Tage-Ansicht, Cockpit, Ensemble-Zusammenfassung, Widget und Detailansicht – gegen Nachtkontamination geschützt.
- `ForecastCockpit` bewertet Schauer/Gewitter aus den tatsächlichen Tagesstunden und nutzt nicht mehr die kalenderweiten Tagesaggregate als Hauptschwelle.
- Die 7-Tage-Kurzinterpretation summiert Niederschlag und Wahrscheinlichkeit ausschließlich aus Tagesstunden.
- `forecastNight.ts` verwendet dieselbe zentrale Folgenacht wie die Piktogramme.

## Regression

- `scripts/test-day-following-night-boundaries-09155.mjs`
- bestehende Tagescharakter- und Folgenachtregressionen aktualisiert
- vollständige automatisch erkannte MID-Regressionssuite
