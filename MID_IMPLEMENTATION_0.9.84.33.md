# MID v0.9.84.33 – Implementierungsnotiz

## Ursache
GitHub-Run #987 bestand TypeScript 7 und Vite vollständig, scheiterte anschließend aber an genau einer von 736 Regressionen. Die Forecast-Designregeln lagen nur in der generierten `src/styles.css`. Der Prebuild erzeugt diese Datei aus `src/styles-src/*` neu und entfernte die Regeln deshalb vor dem Regressionstest.

## Korrektur
- Forecast-/Responsive-Styles in `src/styles-src/30-modern.css` als kanonische Quelle übernommen.
- `src/styles.css` über `build-maintenance-aggregates.mjs` neu generiert.
- Keine Änderung der meteorologischen Fachlogik.
- Keine fachliche Worker-Änderung.
