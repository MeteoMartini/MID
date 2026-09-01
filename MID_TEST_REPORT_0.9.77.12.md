# MID v0.9.77.12 – Testbericht

## Erfolgreich geprüft

- `scripts/test-parameter-color-contract-097711.mjs`: 21 Checks PASS
- `scripts/test-parameter-color-contract-097712.mjs`: 13 Checks PASS
- `scripts/test-shortterm-selected-line-values-097710.mjs`: PASS
- `scripts/test-appwide-parameter-colors-09779.mjs`: 17 Checks PASS
- `scripts/test-trend14plus-09770.mjs`: 33 Checks PASS
- `scripts/test-parameter-colors-trend14plus-09771.mjs`: 18 Checks PASS
- TypeScript-Parserprüfung der geänderten TS/TSX-Dateien: PASS
- Worker-Syntax `node --check worker/metar-proxy.js`: PASS

## CI-/Toolchain-Hinweis

Run #821 hatte für v0.9.77.11 bereits `npm ci`, TypeScript und Vite erfolgreich abgeschlossen und 622/623 Regressionen bestanden. Der einzige dort rote Altfarb-Test wurde vor dieser Etappe korrigiert. In der lokalen Sandbox ist ein vollständiger neuer `tsc`-Lauf nicht reproduzierbar, weil `npm ci` beim Wiederherstellen der vollständigen Type-Pakete am Transport-Timeout scheitert; deshalb werden keine unbestätigten Vollverify-Ergebnisse behauptet.

## Extremwetter-Schwellenfix

- `scripts/test-extreme-threshold-evidence-097712.mjs`: PASS
  - I1–I4-Evidenz je Regen-/Schnee-/Windstufe
  - Kontur-Evidenz folgt der tatsächlich dargestellten Intensität
  - RUC überschreibt die Evidenz nur, wenn RUC die ausgewählte I-Stufe wirklich treibt
  - Laufzeitfixture: I1 wird aus dem 1-h-Fenster ausgelöst, obwohl die 6-h-Mittelakkumulation größer ist; angezeigt werden korrekt 15 mm/1 h, 14 mm/1 h EPS-Mittel und 5 mm Spread
- `scripts/test-extreme-threshold-ruc-horizon-09778.mjs`: PASS
- `scripts/test-extreme-rain-profile-night-097628.mjs`: PASS
- `src/ExtremeWeatherOutlookPanel.tsx`: TypeScript-Transpile/Parser PASS
- `src/extremeOutlookModelledAreas.ts`: TypeScript-Transpile/Parser PASS
- `worker/metar-proxy.js`: Syntax PASS
- Gesamtsuite: 519/625 PASS; die übrigen 106 sind unverändert die lokal fehlenden `typescript-strada`-/esbuild-/Type-Hilfspakete.

