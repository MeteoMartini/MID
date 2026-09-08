# MID v0.9.83.2 – Implementierung

## Anlass
GitHub-Release-Lauf #941 brach nach erfolgreicher reproduzierbarer npm-Installation und Dependency-Prüfung im TypeScript-7-Typecheck ab. Ursache waren nach der React-19-Migration verbliebene React-18-Ref-Signaturen. Zusätzlich sollten Klima-Tmax, Wind und Böen wieder strikt das appweite MID-Farbkonzept verwenden.

## Änderungen
- `App.tsx`: optionaler Retry-Ref explizit mit `undefined` initialisiert.
- `EnsemblePanel.tsx`: DOM-/Portal-/Diagramm-Refs als React-19-konforme nullable `RefObject`-Verträge typisiert.
- `useDismissibleLayer.ts`: zentraler Ref-Vertrag akzeptiert `current: T | null`, damit Radar- und andere Popover-Refs korrekt typisiert sind.
- Klima-Tmax verweist auf den kanonischen MID-Tmax-Farbtoken.
- Windwerte verwenden `--param-wind`, Böenwerte `--param-gust`; Windrose und Umschalter wechseln semantisch mit dem Modus.
- Keine Änderung der meteorologischen Berechnung oder der zugrunde liegenden Klimaaggregation.
