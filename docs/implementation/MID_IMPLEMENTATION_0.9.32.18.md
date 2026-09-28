# MID v0.9.32.18

- TypeScript-Buildfix für `queueMirrorStore()` in `forecastVerification.ts`.
- Die Archiv-Write-Queue bleibt `Promise<void>`; der `boolean`-Erfolgswert von `mirrorStore()` wird nur dort ausgewertet, wo er für die sichere lokale Kompaktierung benötigt wird.
- Die quota-sichere Persistenzschicht aus v0.9.32.17 bleibt funktional unverändert.
