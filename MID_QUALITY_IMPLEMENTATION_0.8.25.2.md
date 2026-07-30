## MID v0.8.25.2 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.25.1**, da ausschließlich ein den Produktionsbuild blockierender TypeScript-Fehler beseitigt wurde.

### Ursache

Der GitHub-Produktionsbuild brach mit `TS6133` ab, weil in `src/RadarPanel.tsx` die Variable `pxFactor` berechnet, anschließend aber nicht verwendet wurde.

### Korrektur

- die ungenutzte Variable `pxFactor` entfernt
- die ebenfalls nur dafür angelegte lokale Blend-Berechnung entfernt
- die tatsächliche PX250-Sichtbarkeitsbedingung ausdrücklich über `pxDisplayAvailable` erhalten
- vorhandene 250-m-Radar-Funktionalität unverändert beibehalten
- neue Regression `test-radar-unused-pxfactor-buildfix-08252.mjs` ergänzt

### Worker

Keine funktionale Worker-Änderung. Der Worker wurde nur auf **v0.8.25.2** versionssynchronisiert.
