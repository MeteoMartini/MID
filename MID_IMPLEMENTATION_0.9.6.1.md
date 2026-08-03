# MID v0.9.6.1

## Inhalt

- Überarbeitung des Prognose-Cockpits gemäß Nutzerfeedback zur Kurzfrist-, 7-Tage- und 14-Tage-Darstellung.
- Kurzfrist mit 3h-Standard, optionaler stündlicher Verdichtung, expliziter 24h-Mittel-Linie und 90-Minuten-Schnellblick.
- 7-Tage-Regime objektiver kalibriert, damit geringe Niederschlagsmengen oder Einzelböen nicht zu überzeichneten Tageslabels führen.
- Neue 14-Tage-Übersicht mit drei Parameterzeilen: Temperatur relativ zum Klimamittel, kombinierter Niederschlagsbalken, Wind/Böen im Diagrammfarbkonzept.
- Konsistenzbewertung des 14-Tage-Cockpits auf die Logik der vollständigen Analyse harmonisiert.
- Amtliche Warnungen kompakt mit sichtbarer Gültigkeitspille im eingeklappten Zustand.

## Geänderte Dateien

- `src/ForecastCockpit.tsx`
- `src/App.tsx`
- `src/styles.css`
- `package.json`
- `MID_BASELINE.json`
- `CHANGELOG.md`

## Regressionen

- `node scripts/test-cockpit-clarity-0960.mjs`
- `node scripts/test-forecast-cockpit-0920.mjs`
- `node scripts/test-precipitation-character-0960.mjs`
- `node scripts/test-worker-precipitation-character-0960.mjs`
