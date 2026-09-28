# MID Implementation 0.9.84.18

## Anlass
GitHub Release #973 kompilierte MID mit TypeScript 7.0.2 vollständig und baute die Vite-Produktion erfolgreich. Erst im nachgelagerten Regressionslauf scheiterten 3 von 730 Tests. Alle drei Fehler verlangten noch die alte leichte Regenstufe für 0,8 mm/h, obwohl die seit v0.9.84.15 zentralisierte DWD-/WMO-orientierte Intensitätslogik diese Menge korrekt als mäßigen Regen klassifiziert.

## Änderung
Es wurde bewusst keine Meteorologielogik zurückgedreht. Stattdessen wurden ausschließlich die drei veralteten Prüfverträge synchronisiert:

- `test-precipitation-character-0960.mjs`: Schauer→stratiforme-Regen-Korrektur bei 0,8 mm/h erwartet nun Code 63 statt 61.
- `test-precipitation.mjs`: unplausibler Sprühregen und Fallback-Regen mit 0,8 mm/h erwarten nun „mäßiger Regen“/Code 63.
- `test-detail-pictogram-precipitation.mjs`: Fallback-Regen mit 0,8 mm/h erwartet nun Code 63.

## Fachlicher Vertrag
Für kontinuierlichen Regen bleibt die zentrale MID-Einteilung unverändert: bis einschließlich 0,5 mm/h leicht, über 0,5 bis 4 mm/h mäßig, darüber stark. Die sichtbare Intensität wird aus der finalen, auf das tatsächliche Intervall normierten Menge abgeleitet; der Ausgangs-WMO-Code bleibt primär Phaseninformation und dient bei fehlender belastbarer Menge als Intensitätsfallback.

## Worker
Keine fachliche Workeränderung; ausschließlich Versionssynchronisation.
