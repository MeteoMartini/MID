# MID 0.9.66.1 – Startstabilität des DACH-Extremwetter-Ausblicks

## Anlass und Ursache

Die erste Auslieferung des DACH-Extremwetter-Ausblicks rief den zentralen MID-Formatter bei mehreren Dezimalwerten mit vertauschter Argumentreihenfolge auf. Dadurch erhielt `Intl.NumberFormat` auf betroffenen Darstellungswegen `minimumFractionDigits: 1` zusammen mit `maximumFractionDigits: 0` und warf einen `RangeError`. Der globale Startschutz zeigte deshalb „MID konnte nicht vollständig starten“.

## Korrektur

- Alle betroffenen Aufrufe im Extremwetter-Modul verwenden wieder den appweiten Vertrag `formatDecimal(value, maximumFractionDigits, minimumFractionDigits)` mit maximal einer und minimal null Nachkommastellen.
- Der zentrale Formatter begrenzt Nachkommastellen auf den browserübergreifend sicheren Bereich 0–20 und sortiert einen versehentlich vertauschten Mindest-/Höchstbereich, bevor `Intl.NumberFormat` erzeugt wird.
- Eine ausführbare Regression importiert die tatsächliche Formatter-Implementierung, prüft reguläre und vertauschte Bereiche und schützt die Extremwetter-Komponente vor der fehlerhaften Aufrufkombination.

## Funktionsschutz

Modelle, DACH-Raster, Schwellen, Wahrscheinlichkeits- und Intensitätslogik, Datenquellen, Caches sowie die appweiten Einheiten- und Zeiteinstellungen bleiben unverändert gegenüber 0.9.66.0. Der Worker erhält ausschließlich die gekoppelte Releaseversion 0.9.66.1; seine meteorologische Fachlogik ändert sich nicht.
