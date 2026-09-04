# MID v0.9.78.39

## Parallel-Chat vollständig mit dem aktuellen Hauptstand vereinigt

Der vom Nutzer übergebene Parallel-Chat-Build `MID-professional-replacement(20260904-054958).zip` wurde quellseitig geprüft. Das Archiv ist intern **v0.9.78.34** und enthält die dort parallel umgesetzte CodeQL-/Release-Härtung, die im zuletzt im Hauptchat erzeugten v0.9.78.38-Archiv noch nicht vollständig enthalten war. v0.9.78.39 vereinigt deshalb beide Entwicklungszweige statt einen davon zu überschreiben.

Übernommen und regressionsgeschützt sind insbesondere:

- CodeQL #81–#90: exakte HTTPS-Host-/URL-Prüfung statt Substringtests.
- Netatmo-OAuth: einmalig konsumierbarer In-Memory-Handoff statt `sessionStorage`/`localStorage` für Callbackdaten; URL- und serverseitiger Fallback bleiben erhalten.
- Worker-Deploy: zufälliges privates Tempverzeichnis, 0700/0600-Rechte, exklusive Dateierzeugung und dynamische Workflow-Step-Outputs statt vorhersehbarer `/tmp`-Dateien.
- PR-/Security-Matrix und zugehöriger v0.9.78.34-Testreport bleiben im Quellstand erhalten.
- Die Baseline verwendet die Vereinigung der Schutzlisten beider Parallelzweige; spätere v0.9.78.35–.38-Regressionen werden nicht verdrängt.

Gleichzeitig bleiben alle neueren Hauptchat-Änderungen erhalten: Ensemble-Deadlines/Watchdog, Mean/Spread-first-Bootstrap, begrenzte 6er-Vollfusion mit maximal zwei parallelen Abrufen, 60-min-Cache, 2-s-Nachladebeginn, vollständiges kleines Sonnensymbol, 24-h-Tageskarten-Skybar und die vier kräftigeren Skybar-Dicken 2,4 / 3,3 / 4,2 / 5,1.

## Skybar: Niederschlag wieder nach Art/Phase eingefärbt

v0.9.78.38 vereinheitlichte Niederschlag in der Skybar zu stark auf Blau. Das wird korrigiert. Die Skybar verwendet nun dieselbe bereits im Forecast-Cockpit etablierte Phasenpalette:

- Regen, Sprühregen und Schauer: `var(--param-precipitation)` (blau, themeabhängig)
- Schnee, Schneeschauer und Schneegriesel: `#66bce8` (hellblau)
- Schneeregen/Mischphase sowie gefrierender (Sprüh-)Regen: `#a769d8` (violett)
- Gewitter und Gewitter mit Hagel: `#7869e8` (purpur)

Die Palette liegt nun zentral in `src/precipitationPhaseColor.ts` und wird sowohl von `src/detailSkyBar.ts` als auch vom Forecast-Cockpit verwendet. Damit können Skybar und 24-h-Niederschlagsdarstellung nicht mehr unbemerkt auseinanderlaufen. Die Dicke kodiert weiterhin ausschließlich die Stärke; die Farbe kodiert die Niederschlagsart/-phase. Grundband und Niederschlagslage bleiben farbrein getrennt.

Die Legende wurde auf „Niederschlag · nach Phase“ umgestellt und zeigt ein vierfarbiges Muster.

## Regression

Neu: `scripts/test-parallel-merge-skybar-phase-097839.mjs`. Der Test schützt die Parallel-Chat-Härtung, den Erhalt der v0.9.78.35–.38-Funktionen, den 24-h-Skybar-Vertrag und die zentrale phasenabhängige Niederschlagspalette gemeinsam.
