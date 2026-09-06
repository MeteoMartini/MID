# MID v0.9.79.7 – CI-Buildfix Bottom-Bar-Navigation

## Ausgangslage

GitHub Actions Release-Run **#919** scheiterte im regulären `npm run verify` während `tsc --noEmit -p tsconfig.app.json` mit:

`src/App.tsx(361,8): error TS2322: Type 'string[]' is not assignable to type 'DashboardModuleId[]'.`

Die Release-ZIP selbst wurde zuvor erfolgreich sicher entpackt, `npm ci` sowie der Dependency-Audit liefen erfolgreich. Der Fehler lag ausschließlich in der TypeScript-Inferenz der in Schritt 6/7 verwendeten deduplizierten Prognosekandidaten.

## Korrektur

Die Kandidatenliste wird nun zunächst explizit als `DashboardModuleId[]` aufgebaut und erst danach dedupliziert. Dadurch bleibt der konkrete Modultyp über `filter()` erhalten und kann ohne Typaufweitung in den `modernTabs`-Vertrag übernommen werden.

## Unverändert

- optionaler persistenter Modus `bottom-tabs` einschließlich klassischem Fallback,
- Schritte 1–7 des neuen Bedienkonzepts,
- Forecast-/Ensemble-Datenpfade und Modulreihenfolge,
- Radar-/Satellitenprodukte und deren Standardfarben,
- Parameterfarben, Piktogramme und Einheiten,
- Worker-Fachlogik.

## Verifikation

Pflichtgate bleibt der bestehende Release-Workflow `npm run verify`; insbesondere `verify:types` muss den vorherigen TS2322-Befund nicht mehr erzeugen.

Die bestehende Regression `scripts/test-modern-forecast-workspace-09794.mjs` wurde ausschließlich auf die neue typstabile Quellform angepasst; ihre funktionalen Prüfungen bleiben identisch.
