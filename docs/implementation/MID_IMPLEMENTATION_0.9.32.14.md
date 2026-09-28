# MID v0.9.32.14

## Ribbons/UI-Text

`MID-ribbons-ui-text-cleanup.patch` wurde auf den aktuellen v0.9.32.13-Stable-Stand übertragen. Redundante Hilfstexte in den Cockpit-Ribbons und im Wetterprofil wurden entfernt; fachlich relevante Werte und Warntexte bleiben unverändert.

## Wolken + Niederschlagsart

- Originalbild-Zoom: 100 / 200 / 300 / 400 / 500 %.
- Vergrößern/Verkleinern immer in 100-%-Schritten.
- Permanenter 100-%-Reset liegt außerhalb des eigentlichen Scrollinhalts als Overlay über dem Bildfenster.
- Vertikale Overscroll-Kette bleibt zur App offen; horizontales Panning bleibt im Bildbereich gebunden.
- Damit bleibt die Navigation auch bei 400–500 % auf iPhone/iPad erreichbar.

## Regression

Neue Schutzregression: `scripts/test-dwd-precipitation-type-zoom-093214.mjs`.

## Prüfung

- 335/335 automatisch erkannte MID-Regressionstests in zwei vollständigen Blöcken bestanden.
- 87/87 TypeScript-/TSX-Dateien syntaktisch mit TypeScript 5.8.3 parsergeprüft.
- Worker-Syntax geprüft.
