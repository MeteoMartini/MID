# MID v0.9.20.1

## Korrektur

Der GitHub-Produktionslauf von v0.9.20.0 wurde nach erfolgreichem Build durch drei veraltete beziehungsweise zu strikt formatabhängige Cockpit-Regressionen abgebrochen:

- `test-cockpit-meteogram-pro-09180.mjs`
- `test-cockpit-shortterm-interaction-09173.mjs`
- `test-cockpit-shortterm-premium-09172.mjs`

Die Tests prüfen weiterhin das vollständig sichtbare, einstündige Meteogramm, das Einzeldatenfeld und die responsive Vollbreitengeometrie. CSS-Verträge werden nun semantisch und whitespace-unabhängig geprüft, statt von einer exakt zusammenhängenden CSS-Zeichenfolge abzuhängen.

## Zusätzliche Absicherung

- Neue Regression `test-cockpit-regression-sync-09201.mjs`
- Versionsstände in `package.json`, `package-lock.json`, `MID_BASELINE.json`, Frontend, Service Worker und Worker auf `0.9.20.1` synchronisiert
- DWD-Niederschlagsarten-Radar aus v0.9.20.0 unverändert enthalten
- Radar-Regression von einer fest verdrahteten Version auf eine Mindestversionsprüfung ab 0.9.20.0 umgestellt
