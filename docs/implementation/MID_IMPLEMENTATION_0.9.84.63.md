# MID 0.9.84.63 – Release-Installer-Hotfix

## Ziel
Der Wartungsstand behebt den fehlgeschlagenen Release-Installer #1018, ohne Produktionslogik oder Wetterfunktionen zu verändern.

## Ursache
Der Produktionsbuild von 0.9.84.62 war erfolgreich. Von 754 Regressionen scheiterte ausschließlich der ältere Vertrag `scripts/test-appwide-precipitation-and-daily-heat.mjs`. Er verlangte noch den früheren, wortgleichen Ausdruck für die Priorisierung der Present-Weather-Intensität.

Seit 0.9.84.61 berücksichtigt die aktuelle Implementierung zusätzlich numerische WMO/DWD-Present-Weather-Codes. Die fachlich aktuelle Regression `test-current-weather-intensity-design-098451.mjs` bestätigte diese erweiterte Logik bereits. Der alte Test war deshalb strukturell veraltet, nicht die Produktionsimplementierung fehlerhaft.

## Umsetzung
- Den alten appweiten Niederschlags-/Tageswarnvertrag auf den aktuellen semantischen Present-Weather-Vertrag aktualisiert: beobachtetes Phänomen, beobachteter numerischer Wettercode und Best-Match-Niederschlagsintensität bleiben in derselben Prioritätskette geschützt.
- Den UI-Audit-Vertrag 0.9.84.62 versionsfest gemacht: Er schützt weiterhin die in 0.9.84.62 eingeführte Oberfläche, verlangt aber nicht mehr, dass jede spätere Wartungsversion weiterhin exakt 0.9.84.62 heißt oder als erster Changelog-Eintrag erscheint.
- Releaseversion auf 0.9.84.63 synchronisiert.

## Funktionsschutz
Es wurden keine Produktionsdateien mit meteorologischer Fachlogik geändert. Insbesondere unverändert bleiben Datenquellen, WMO/DWD-Wettercodes, Present-Weather-Auswertung, Piktogramme, Niederschlagsintensitäten, Hyperlokalanalyse, Modellfusion, Warnungen, Radar/Satellit, Synoptik, Ensembles und das Design aus 0.9.84.62.
