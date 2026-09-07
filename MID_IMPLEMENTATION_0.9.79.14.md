# MID v0.9.79.14 – CI-Buildfix nach Release #925

## Befund
GitHub Actions Release #925 installierte die Abhängigkeiten erfolgreich und erreichte den TypeScript-Build. Dieser stoppte in `src/App.tsx` bei `TS1003: Identifier expected` (Zeile 1502). Ursache war der Text `gleichzeitig <50 % Bewölkung` direkt innerhalb von JSX. Das `<` wurde vom JSX-Parser als Beginn eines Elements interpretiert.

## Korrektur
- Die fachlich identische Formulierung lautet nun `gleichzeitig unter 50 % Bewölkung`.
- Keine Änderung an `detailSkyBar.ts` oder den meteorologischen Schwellen der No-gap-Garantie.
- `test-skybar-daylight-no-gaps-097913.mjs` prüft jetzt zusätzlich, dass die parsergefährliche Rohschreibweise nicht zurückkehrt.

## Worker
Keine fachliche Workeränderung.
