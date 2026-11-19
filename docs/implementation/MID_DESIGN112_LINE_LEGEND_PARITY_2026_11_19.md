# MID Design 1.12 · Detail-Legendenparität (QA-Draft; kein Release)

## SHA-Basis und Zweck
- Verifizierte GitHub-Basis: `main=mid-stable=9fd872a789f4b158bc691d085589616c2c04f776`, veröffentlichte v0.9.85.497, drei Versionsspiegel synchron, fünf aktive Rulesets.
- Parent: [#523](https://github.com/MeteoMartini/MID/issues/523) (appweite Linien-/Farbsemantik).
- Kein Überschneiden mit laufendem P0-Temperaturdiagramm [#957](https://github.com/MeteoMartini/MID/pull/957), Settings [#920](https://github.com/MeteoMartini/MID/pull/920) oder Fokus-Policy [#891](https://github.com/MeteoMartini/MID/pull/891).
- Historische offene Drafts #742/#745 berühren ebenfalls generierte `src/midPresentation.css`, sind deutlich älter. Niemals blind zusammenführen; nur aktuelles Stable und hunkweise geprüfter Intake.

## Konkreter Ausgangsbefund
`src/parameterLineStyle.ts` rendert Taupunkt als `strokeDasharray:'2 5'`, aber die letzte aktive `.detaillegend i.dewpoint`-Regel in `src/styles-src/30-modern.css` zeichnet eine durchgehende Farbleiste. Die übrigen vier relevanten Muster sind bereits unterschiedlich kodiert.

## Korrektur
- Ausschließlich das Taupunkt-Legendenmuster von durchgehend auf `2px Linie + 5px Lücke` ändern, identisch zur produktiven SVG-Linie; bestehendes Farbtoken `--param-dewpoint` unverändert.
- Im aus 68 Quellen abgeleiteten `src/midPresentation.css` dieselbe letzte Regel ersetzen und die frühe, zuvor deduplizierte Foundation-Deklaration wiederherstellen. Dies ist die direkte Konsequenz des in `scripts/lib/cssCascade.mjs` dokumentierten byteidentischen Deduplizierungsvertrags. Vor Integration `npm run maintain:aggregates && npm run check:css-consolidation` und Git-Tree-Parität **auf der finalen SHA** nachweisen.
- Ein Vitest-Regressionsfall vergleicht tatsächliche `parameterLineStyle`-Strokes für UTCI/gefühlte Temperatur, Taupunkt, PoP und Böen mit der jeweils letzten Quell- und Aggregate-Legendenregel. Keinerlei Wetterwerte, Quellen, Einheiten, Warnfarben, Persistenz, Netzwerk- oder Animationslogik ändern.

## Qualität und verbleibende Gates
- Vorliegende Source-QA ist **kein** Browser-/Contrast-/WAI-/iOS-/VoiceOver-Test; keine Produktivfreigabe.
- Erwartete Prüfung: Node 22, TypeScript, Vitest, Aggregat-Konsistenz, Full-App-Build und gültige CSS-Herkunft; 320/360/390/430/834/1024/1440 CSS-px, Light/Dark, 200%-Text, Hover/Touch/Keyboard; reales getComputedStyle oder Browser-Pixelvergleich von Legende und Kurve, CSSOM-/Cascade-Golden. Danach verpflichtende Source/Core/Heavy/Review/ZIP/Installer/Worker/Pages/Stable-Gates durch LC/LW.
- Externe Referenzen: [Apple Charts HIG](https://developer.apple.com/design/human-interface-guidelines/charts), [WCAG 2.2 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color), [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast).
