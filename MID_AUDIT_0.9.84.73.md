# MID Design-Audit 0.9.84.73

## Auditblock
Sekundäransichten, Popover, Tooltips und spät geladene Legacy-Regeln.

## Befund
Nach den appweiten Hauptansichts-Audits blieben vor allem sekundäre Informationsflächen mit historischen Mikrogrößen übrig: Modellstand-Popover, Datenquellen, UV-Gefahrenstufen, Inline-Steuerungen in Berg/Wasser, Ensemble-Tooltip, Langfrist-/C3S-/DWD-Status sowie die mobile Tmin/Tmax-Pille. Besonders relevant war `v078.css`, weil dieses Stylesheet nach `styles.css` geladen wird und daher ältere Werte erneut durchsetzen kann.

## Umsetzung
- semantische Typografietokens statt 6,5–9-px-Einzelwerten in normalen UI-/Popover-Texten;
- 36 px Fine-Pointer-/Desktop-Bedienung und 44 px für zentrale Touchziele;
- Ensemble-Tooltip mit eigenem <=360-px-Fallback statt weiterer Schriftverkleinerung;
- Langfrist-Statusblöcke auf die aktuellen Mindestgrößen angehoben;
- keine pauschale Vergrößerung wissenschaftlich dichter SVG-Achsen oder Kurvenlabels.

## Build-Konsistenz
Der vorangegangene v0.9.84.72-Upload wurde wegen zweier ungenutzter Astronomie-Imports nicht nach `mid-stable` promotet. Der Auditblock enthält deshalb zusätzlich den minimalen TypeScript-Buildfix; die beiden Helfer wurden nur aus dem Import entfernt, nicht fachlich ersetzt oder zurückgerollt.

## Fachliche Abgrenzung
Wetterdaten, Modellgewichtung, Ensembleberechnung, Warnschwellen, WMO-/DWD-Terminologie, Radar/Nowcast, Piktogramme und Parameterfarben bleiben unverändert.
