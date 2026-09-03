# MID Test Report v0.9.78.9

Datum: 2026-09-03

## Geprüfte Korrekturen

- Weather Icon System 2.0 besitzt einen sichtbaren, appweiten Form-Lock unabhängig von H/M/L-Wolkenformdiagnostik.
- Bedeckt und stratiformer Niederschlag können nicht mehr als wellige Höhenwolkenform erscheinen.
- Nebel/Dunst erhalten keine zusätzliche Wolke.
- Forecast-Zustände in Ensemble, Kurzfrist, Event, Reise, Route und Wassersport verwenden weiterhin `WeatherPictogram`.
- Komposit-/Radar-Bedienelemente verwenden keine alten Wetter-Emoji-Schalter mehr.
- 14-Tage-Desktopkarten verwenden ab 1025 px 224-px-Karten mit sauberer Informationshierarchie und horizontalem Scrollband.
- 7×2-Querformat bleibt auf maximal 1024 px begrenzt.

## Regressionen

Verbindlich geprüft werden insbesondere:

- `scripts/test-weather-pictogram-standard-09780.mjs`
- `scripts/test-weather-pictogram-ui-lock-09781.mjs`
- `scripts/test-fourteen-day-orientation-layout-09642.mjs`
- `scripts/test-cockpit-fourteen-day-character-094017.mjs`
- `scripts/test-forecast-cockpit-pictograms-09100.mjs`
- `scripts/test-current-nowcards-responsive-096612.mjs`
- `scripts/test-location-thunder-water-tide-layout-09644.mjs`
- `scripts/test-versioning.mjs`
- `scripts/test-release-lineage.mjs`

## Buildumgebung

Die statischen und Node-basierten Vertragsregressionen werden lokal ausgeführt. Der vollständige TypeScript-/Vite-Produktionsbuild wird zusätzlich durch den GitHub-Installer mit der projektgepinnnten Toolchain ausgeführt.

## Gesamtlauf in der vorliegenden Transportumgebung

Der automatische Runner erkennt **648 Regressionstests**. Davon sind **543 direkt ausführbar und grün**. Die verbleibenden **105** sind vollständig als lokale Toolchain-/Dependency-Blocker klassifiziert:

- 86 × fehlendes projektgepinntes `typescript-strada`,
- 16 × lokale TypeScript-Version ohne den für TypeScript 7 vorgesehenen CLI-Schalter `--ignoreConfig`,
- 2 × fehlendes lokales `esbuild`,
- 1 × fehlendes lokales `node_modules/.bin/tsc`.

Nach isolierter Klassifikation verbleibt **kein weiterer fachlicher oder UI-bezogener Regressionstestfehler**. Insbesondere die zuvor zusätzlichen Alt-Assertions für Emoji-Metadaten wurden auf den verbindlichen Vektor-/Weather-Icon-System-2.0-Vertrag migriert.
