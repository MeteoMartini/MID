# MID v0.9.78.34

## Anlass
Die in v0.9.78.33 neu in die 7-Tage-Tageskacheln übernommene Skybar nutzte noch das meteorologische Tagesfenster (`dayPeriodHoursForDate`) und zeigte dadurch nur einen abgeschnittenen Tagesausschnitt statt des gesamten Kalendertags.

## Umsetzung
- `src/ForecastCockpit.tsx`: Die Tageskachel-Skybar verwendet nun `calendarDayHours=hours.filter(hour=>hour.time.startsWith(day.date))` und rendert damit den vollständigen 24-h-Verlauf des jeweiligen Prognosetags.
- Fallback bleibt erhalten: Falls ausnahmsweise keine vollständigen Kalendertag-Stunden vorliegen, wird weiterhin auf `dayHours` zurückgegriffen.
- Die bereits vorhandenen Niederschlags-Tooltips der Tageskachel wurden auf dieselbe Kalendertag-Stundenbasis vereinheitlicht.

## Regressionen
- `scripts/test-weather-profile-skybar-pills-097723.mjs` erweitert: schützt nun ausdrücklich, dass die Tageskachel-Skybar den vollständigen Kalendertag statt nur des Tagesfensters verwendet.

## Wirkung
Die 7-Tage-Tageskacheln zeigen die Skybar jetzt konsistent über den gesamten 24-h-Tag und nicht mehr nur über einen abgeschnittenen Teilbereich.
