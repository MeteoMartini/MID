# MID v0.9.16.0 – Niederschlagscharakter und kompakte Niederschlagsdauer

## Umgesetzt

- Der 7-Tage-Trend bewertet den Prognosetag strikt ab dem Tagesfenster. Niederschlag, Schauer, Gewitter und Warnsignale aus der vorangegangenen Nacht beeinflussen den Tagescharakter und den Trendtext nicht mehr.
- Als Nachtbezug wird ausschließlich die jeweils erste folgende Nacht verwendet. Ein relevantes Ereignis kann dort knapp als Zusatz erscheinen, ohne den Charakter des vorangegangenen Tages umzudeuten.
- Eine zentrale Niederschlagsbewertung verbindet nun appweit Niederschlagsmenge, maximale und mittlere Wahrscheinlichkeit, Ereignisfamilie, Zeitpunkt sowie aktive und mögliche Dauer.
- Ein einzelner kurzer Schauer bleibt als mögliches Risiko sichtbar, bestimmt aber nicht mehr automatisch Piktogramm, Tagesregime oder 7-Tage-Text. Mehrstündige oder mengenrelevante Schauer bleiben weiterhin charakterbestimmend.
- 15-Minuten-Daten werden für die Dauer bevorzugt; bei fehlenden Feindaten wird aus den Stundenwerten konservativ abgeleitet. Für entferntere Tage steht `precipitation_hours` als Fallback zur Verfügung.
- Die Niederschlagsdauer erscheint kompakt in der klassischen 7-Tage-Ansicht, im Prognose-Cockpit, in Tagesdetails, Ensemble-Übersicht/-Tooltip und im Widget.

## Regression

- Neue Regression `scripts/test-precipitation-duration-day-character-09160.mjs` schützt die kombinierte Mengen-/Wahrscheinlichkeits-/Zeitpunkt-/Dauerbewertung, die 15-Minuten-Auflösung und die Trennung von vorangegangener Nacht und Folgenacht.
- Bestehende Tag-/Folgenacht- und 7-Tage-Trendtests wurden an den zentralen Bewertungsweg angepasst.
- Drei bereits im Ausgangspaket veraltete K3D-/Trend-Tokenprüfungen wurden auf den tatsächlich vorhandenen Funktionsstand synchronisiert; die geprüfte Funktionalität wurde nicht verändert.

## Betroffene Dateien

- `src/weather.ts`
- `src/App.tsx`
- `src/ForecastCockpit.tsx`
- `src/EnsemblePanel.tsx`
- `scripts/test-precipitation-duration-day-character-09160.mjs`
- `scripts/test-day-following-night-boundaries-09155.mjs`
- `scripts/test-seven-day-trend-weighting-071056.mjs`
- `scripts/test-k3d-viewport-plausibility-091510.mjs`
- `scripts/test-shortterm-point-nowcast-k3d-placement-091512.mjs`

## Worker

- Keine funktionale Workeränderung. `worker.js` und der Frontend-Worker wurden ausschließlich auf v0.9.16.0 synchronisiert.
