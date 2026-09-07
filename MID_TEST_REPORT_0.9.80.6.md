# MID v0.9.80.6 – Freigabeprüfung

Stand: 7. September 2026. Unmittelbar vor der Verpackung stand `mid-stable` auf **v0.9.80.5** (`6ca1456dc284fd2e09be4b488db577d127a951f8`). Der bearbeitete Quellstand basiert auf dem zuvor ausgelieferten v0.9.80.5-ZIP und führt ihn als v0.9.80.6 fort.

## Geprüfte Änderungen

- Widget: Sonnensymbol und Sonnenscheindauer sind in der Pille horizontal/vertikal zentriert und durch einen festen Abstand getrennt.
- 24-h-Wetterprofil und Tagesansicht: PoP-Linie wird monoton kubisch geglättet; Vorwärtsslots, Niederschlagsbalken, Auswahlpunkte und Tooltips bleiben fachlich unverändert.
- Klima: Bedeckungsanteile verwenden lesbare neutrale Karten mit getrennten Farbswatches; Mitteltemperatur ist im Hellmodus schwarz/dunkel, Tmin dunkelblau.
- Klima-Tooltip: verbreitert, deckender Hintergrund, Textkontur und getrennte Felder für Tmax/Mittel/Tmin/Niederschlag.

## Erfolgreiche gezielte Regressionen

- `scripts/test-climate-hazard-widget-09804.mjs`
- `scripts/test-climate-section-09800.mjs`
- `scripts/test-weather-profile-polish-temporal-09802.mjs`
- `scripts/test-precipitation-forward-geometry-097916.mjs`
- `scripts/test-day-detail-probability-wind-contrast-09700.mjs`
- `scripts/test-no-clipped-weather-values-09394.mjs`
- `scripts/test-precipitation-forward-slot-presentation-097846.mjs`
- `scripts/test-parameter-color-contract-097711.mjs`
- `scripts/test-appwide-parameter-colors-09779.mjs`
- `scripts/test-maintenance-modularization-09560.mjs`
- `scripts/test-aggregate-version-contract-09613.mjs`
- `scripts/test-versioning.mjs`
- `scripts/test-release-lineage.mjs`

Zusätzlich wurden `src/chartMath.ts`, `src/App.tsx`, `src/ForecastCockpit.tsx` und `src/ClimatePanel.tsx` mit TypeScript `transpileModule` syntaktisch geprüft. `worker.js` und `worker/metar-proxy.js` bestehen `node --check` und sind bytegleich.

## Begrenzung der lokalen Umgebung

`scripts/test-sunshine-duration-contract-09655.mjs` konnte lokal nicht gestartet werden, weil die Testhülle `typescript-strada` aus den nicht installierten Projektabhängigkeiten lädt. Die konkret geänderte Widget-Sonnenpille wird jedoch durch `test-climate-hazard-widget-09804.mjs` geprüft; die Sonnenscheindauer-Fachlogik selbst wurde in v0.9.80.6 nicht verändert. Der GitHub-Installer führt mit installierten Dependencies wieder die vollständige Suite aus.

## Worker

Keine funktionale Workeränderung gegenüber v0.9.80.5. Nur Versionssynchronisierung auf v0.9.80.6; kein Cloudflare-Worker-Upload erforderlich.
