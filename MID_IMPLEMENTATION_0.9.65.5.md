# MID 0.9.65.5 – appweiter Sunshine-Duration-Contract

## Ergebnis

Die Sonnenscheindauer besitzt nun in der gesamten App einen gemeinsamen fachlichen Vertrag. Die kanonische Verarbeitungskette lautet **15 Minuten → Stunde → lokaler Kalendertag → längere Zeiträume/Ensemble**. Tageskacheln, Detailansichten, 7 Tage, 14 Tage/Ensemble, Events/Aktivitäten sowie Web- und native Widgets verwenden damit dieselbe Datenbasis und dieselben Null-, Einheiten- und Plausibilitätsregeln.

## Daten- und Qualitätsvertrag

- Vier vollständige 15-Minuten-Werte haben Vorrang vor dem Stundenfeld. Jeder Viertelstundenwert ist auf 900 s, jeder Stundenwert auf 3.600 s begrenzt.
- Der Tageswert wird bei vollständiger Abdeckung aus den finalen Stunden des lokalen Kalendertags summiert. `daily.sunshine_duration` dient ausschließlich als Fallback und Qualitätsreferenz.
- Die Tagesdauer wird auf die astronomisch mögliche Zeit zwischen Sonnenauf- und -untergang begrenzt. Relevante Abweichungen zwischen Stundenaggregation und Daily-Referenz werden in `sunshineDurationMeta` diagnostiziert.
- Fehlende Providerwerte bleiben `null` und werden weder in der App noch im Worker als meteorologische 0 interpretiert.
- Ensemblewerte werden nur aus gültigen Tageswerten gebildet. Best Match bleibt Hauptwert; P10–P90 beschreibt die Bandbreite der verfügbaren Modelle.

## Darstellung

- Stunden- und Viertelstundenansichten zeigen die Sonnenscheindauer standardisiert in Minuten.
- Tages-, 7-Tage-, 14-Tage-, Ensemble- und Widgetwerte erscheinen in Stunden mit höchstens einer deutschen Nachkommastelle; die kompakte 7-Tage-Kachel behält ihren bisherigen Vertrag mit vollen Stunden.
- Tooltips und Detailtexte verwenden die vollständige Bezeichnung „Sonnenscheindauer“. Fehlende Werte erscheinen als Gedankenstrich.
- Events/Aktivitäten summieren nur die tatsächlich vom Ereignisfenster überdeckte Sonnenscheindauer. Web- und Apple-Widgets erhalten denselben Stunden-/Tagesvertrag.

## Worker und Kompatibilität

- Der native Widget-Feed liefert optionale Sonnenscheindauerwerte in Sekunden für aktuell, stündlich und täglich; die jeweiligen Intervall- und Tageslichtgrenzen werden bereits im Worker eingehalten.
- Der Forecast-Fusion-Worker bewahrt fehlende Sonnenscheinwerte als `null`, statt sie durch numerische Konvertierung in 0 umzudeuten.
- Die Änderung erzeugt keine zusätzlichen KV-Schreibvorgänge. Professional-App und Worker tragen gemeinsam die Releasekennung 0.9.65.5 und sind zusammen auszurollen.

## Regression

`scripts/test-sunshine-duration-contract-09655.mjs` prüft Intervallgrenzen, Aggregation, astronomische Begrenzung, Daily-Fallback, Abweichungsdiagnose, Nullsemantik, Einheitenformatierung und die Einbindung aller geforderten Appbereiche einschließlich Widgets und Worker.
