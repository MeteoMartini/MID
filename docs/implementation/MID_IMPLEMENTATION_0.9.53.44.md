# MID v0.9.53.44 – Produktionsbuild-Fix für MidDisclosure

## Anlass
Der Produktions-TypeScript-Build von v0.9.53.43 schlug in `src/UiPrimitives.tsx` mit `TS2322` fehl, weil `defaultOpen` als DOM-Prop an `<details>` weitergereicht wurde. Reacts `DetailsHTMLAttributes` kennt für das Element das Attribut `open`, nicht `defaultOpen`.

## Umsetzung
- `defaultOpen` bleibt als semantische Prop des gemeinsamen MID-Primitivs erhalten.
- Der Anfangszustand wird einmalig mit `useState(defaultOpen)` übernommen.
- Das native `<details>` erhält ausschließlich das gültige `open`-Attribut.
- `onToggle` synchronisiert Nutzeraktionen mit dem React-Zustand, sodass ein späterer Re-Render eine manuelle Nutzerentscheidung nicht zurücksetzt.
- Keine Wetter-, Datenquellen-, Cache-, Worker- oder Designsemantik wurde verändert.
- Neue Required Regression `test-ui-disclosure-buildfix-095344.mjs` verhindert die erneute Ausgabe eines ungültigen `defaultOpen`-DOM-Attributs.
