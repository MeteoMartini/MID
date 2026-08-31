# MID v0.9.76.18 – CI-Regressionshotfix 24-h-Wetterprofil

## Anlass
GitHub Actions Run #791 baute TypeScript 7.0.2 und Vite 6.4.3 erfolgreich, brach jedoch ausschließlich wegen zweier veralteter Quellvertrags-Regressionen ab. Diese erwarteten noch die vor der mobilen Profilverdichtung gültige Piktogramm-Ausdünnung, die alte SVG-Y-Position und den älteren seitlichen Datenabstand.

## Umsetzung
- `test-mid-weather-profile-layout-09323.mjs` auf den aktuellen 24-h-Vertrag migriert:
  - alle stündlichen Wetterpiktogramme (`weatherPictogramStep=1`),
  - aktuelle Piktogrammposition `y={83}`.
- `test-section-navigation-profile-inset-09361.mjs` auf den aktuellen responsiven Datenabstand migriert:
  - mobil 2 px,
  - Tablet 4 px,
  - Desktop 8 px.
- Kein Rückbau des neuen 24-h-Designs und keine fachliche Änderung am Forecast-/Worker-Kern.

## Releasewirkung
Reiner Test-/Release-Hotfix. Kein manueller Worker-Upload erforderlich; eine reine Versionsänderung wird weiterhin durch die semantische Worker-Diff-Logik herausgefiltert.
