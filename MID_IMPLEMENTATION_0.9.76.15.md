# MID v0.9.76.15 – MapLibre 6.6.0 / Stable-Wartung

## Ziel

Funktionsneutrale Umsetzung der nächsten Punkte aus dem Stable-Audit vom 31.08.2026. Bestehende Karten-, Radar-, Komposit-, Warn-, Forecast-, PWA- und iOS-Funktionen bleiben unverändert.

## MapLibre GL JS 6.6.0

- `maplibre-gl` wird exakt von **6.5.0 auf 6.6.0** angehoben.
- Lockfile folgt dem Dependabot-PR #19 einschließlich `@maplibre/maplibre-gl-style-spec` 26.4.1.
- Der bereits gelaufene PR-Kandidat hatte grünen TypeScript-/Vite-Build und grünes CodeQL. Seine drei roten MID-Regressionen waren ausschließlich noch auf 6.5.0 fest verdrahtete Versionsverträge.
- Diese drei Verträge sind auf 6.6.0 aktualisiert; Kartenlogik, MapLibre-Workergrenze, GeoJSON-Flächen, OPERA/Radar und Lazy Loading werden nicht verändert.
- Erwarteter technischer Nutzen aus 6.6.0: DEM-Picking per CPU-Ray-Cast ohne GPU-Framebuffer-Readback, rund 4 MB weniger GPU-Speicher in diesem Pfad und kein erneuter `color-relief`-DEM-Texturupload in jedem Frame.

## uuid@7.0.3

Die npm-Warnung wurde auf den einzigen Pfad `@capacitor/cli 8.5.0 -> xcode 3.0.1 -> uuid ^7.0.3` zurückgeführt. `@capacitor/cli 8.5.0` und `xcode 3.0.1` sind aktuelle stabile Upstreamstände. Ein erzwungenes UUID-11/13-Override würde die Semver-Grenze des Xcode-Pakets brechen und wird deshalb nicht eingesetzt. Die Ursache ist dokumentiert und regressionsgeschützt; bei einem kompatiblen Capacitor-/xcode-Upstream wird erneut aktualisiert.

## Branch-Schutz

`MID_BRANCH_RULESET.json` ist zu einer konkreten Stable-Vorlage erweitert: menschliche Direkt-/Force-Pushes sollen blockiert, `MID CI verify` verlangt und der bestehende Status `MID / stable-release-quality` als Release-Evidenz geführt werden. Der automatisierte Release-Workflow benötigt dafür einen gezielten Bypass. Die tatsächliche Aktivierung des GitHub-Rulesets ist eine Repository-Administrationseinstellung und wird nicht aus dem App-Release selbst vorgenommen.

## Nicht enthalten

- kein React-19-Upgrade
- kein Vite-8-/plugin-react-6-Upgrade
- kein erzwungenes UUID-Override
- keine fachliche Wetter-, Karten- oder Workerlogikänderung
