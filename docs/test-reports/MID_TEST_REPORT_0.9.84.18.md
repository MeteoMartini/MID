# MID Test Report 0.9.84.18

## GitHub-Befund #973
Der kanonische Installerlauf erreichte erfolgreich:

- sichere ZIP-Prüfung und vollständige Übernahme
- Node 22.16.0 / npm 10.9.2
- reproduzierbares `npm ci` mit 202 Paketen
- Dependency-Audit ohne HIGH/CRITICAL-Befund
- TypeScript 7.0.2: vollständig erfolgreich
- Vite 8.2.2 Produktionsbuild: vollständig erfolgreich, 2597 Module transformiert

Erst anschließend scheiterten 3 von 730 Regressionstests. Alle übrigen 727 Regressionen liefen im selben GitHub-Lauf erfolgreich durch.

## Ursache der drei Fehler
Die Produktionslogik klassifiziert 0,8 mm/h Dauerregen nach dem aktuellen zentralen MID-Vertrag als mäßig (Code 63). Drei ältere Tests verlangten noch Code 61 bzw. „leichter Regen“. Dadurch widersprachen die Tests dem bereits eingeführten fachlichen Vertrag.

## Hotfix-Prüfung
- die drei betroffenen Testverträge wurden auf Code 63 / „mäßiger Regen“ synchronisiert
- keine Änderung an `src/precipitation.ts` oder anderer Wetterlogik erforderlich
- die geänderten Erwartungen wurden zusätzlich mit einem isolierten Kompilat der Niederschlagslogik geprüft; 0,8 mm/h ergibt Code 63 und „mäßiger Regen“
- Version/Baseline/Service-Worker/iOS-Metadaten auf v0.9.84.18 synchronisiert
- Worker-Fachlogik gegenüber v0.9.84.17 unverändert

Die abschließende Vollbestätigung aller 730 Regressionen erfolgt erneut im GitHub-Installer, da die lokale Arbeitsumgebung die vollständige gepinnte Toolchain nicht zuverlässig installieren konnte. Der unmittelbar vorherige Lauf #973 hat jedoch bereits TypeScript- und Produktionsbuild vollständig bestanden und genau diese drei verbleibenden Regressionen isoliert.
