# MID v0.9.78.47

## Anlass
Der GitHub-Installerlauf #880 für v0.9.78.46 entpackte das Release korrekt, installierte alle Abhängigkeiten und bestand das Dependency-Audit. Der Build wurde anschließend von TypeScript 7.0.2 mit TS6133 blockiert:

`src/ShortTermForecast.tsx(154,38): 'targetOffsetMinutes' is declared but its value is never read.`

## Ursache
Bei der appweiten Umstellung sichtbarer Niederschlagsintervalle auf einen vorwärts gerichteten Startstempel wurde `offsetMinutes` richtigerweise auf `precipitationIntervalStartEpoch` umgestellt. Die ältere Zwischenvariable `targetOffsetMinutes` blieb danach ohne Verwendung in der Schleifendeklaration zurück.

## Umsetzung
- `targetOffsetMinutes` aus `buildShortTermForecast(...)` entfernt.
- Keine Änderung der meteorologischen Berechnung.
- Rohakkumulationen werden weiterhin über `trailingAccumulationHour(hours,target)` am Intervallende gelesen.
- Sichtbare Zeit/Offset bleiben über `precipitationIntervalStartEpoch` auf den Beginn des Zukunftsintervalls bezogen.
- Neue Regression schützt Buildhygiene und den v0.9.78.46-Zeitvertrag gemeinsam.

## Worker
Keine fachliche Workeränderung. Workerartefakte werden ausschließlich versionssynchron neu erzeugt.
