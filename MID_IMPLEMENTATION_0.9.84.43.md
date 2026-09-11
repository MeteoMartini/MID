# MID v0.9.84.43 – Implementierung

## Anlass
GitHub-Installerlauf #996 brach nach erfolgreichem TypeScript-7-/Vite-Build an genau einer von 741 Regressionen ab. Betroffen war ausschließlich `scripts/test-weather-profile-pressure-hazards-09656.mjs`.

## Ursache
Der Test erwartete weiterhin den alten festen Aufruf `summarizeDwdWarnings(..., 24)`. Seit v0.9.84.42 besitzt die Hazardlogik jedoch bewusst einen optionalen `throughDate`-Vertrag: außerhalb des Widgets bleibt das 24-h-Startfenster erhalten, Widgets dürfen bis zum letzten ausgewählten Kalendertag prüfen.

## Korrektur
- Keine Änderung an der produktiven Wetter-/Hazardlogik.
- Regression auf den verbindlichen v0.9.84.42-Vertrag aktualisiert.
- Der Test schützt nun explizit:
  - 24-h-Standard ohne `throughDate`,
  - erweiterten Widget-Horizont mit `throughDate`,
  - Übergabe des berechneten `startLimit` an `summarizeDwdWarnings`.

## Releasewirkung
Reiner Release-/Regression-Hotfix. Keine neue Worker-Semantik gegenüber v0.9.84.42.
