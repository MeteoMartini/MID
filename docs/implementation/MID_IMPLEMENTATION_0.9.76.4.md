# MID v0.9.76.4 — iOS release-status version sync hotfix

## Anlass

GitHub Release #778 bestätigte Node 22.16.0, `npm ci`, den Dependency-Audit, TypeScript 7.0.2 (`tsc --noEmit`) und den Vite-Produktionsbuild. Von 589 Regressionen schlugen ausschließlich zwei iOS-Strukturtests fehl, weil `MID_IOS_STATUS.json.releaseVersion` noch `0.9.76.2` enthielt, während `package.json` und `MID_BASELINE.json` bereits `0.9.76.3` führten.

## Änderung

- `scripts/sync-version.mjs` synchronisiert bei einer echten Versionsänderung nun auch `MID_IOS_STATUS.json.releaseVersion` und `updatedAt`.
- Die Aktualisierung ist idempotent: bei unveränderter Releaseversion wird der iOS-Status nicht erneut beschrieben.
- `test-aggregate-version-contract-09613.mjs` prüft jetzt package, Baseline, iOS-Status und Worker-Version gemeinsam.
- `test-versioning.mjs` schützt die zentrale iOS-Status-Synchronisierung selbst.
- Der fachliche App-, Forecast-, RUC-, Worker-, 24-h-, Tmin/Tmax-, Modellstand- und Kompositcode bleibt unverändert.

## Nächstes Gate

Der nächste GitHub-Installerlauf muss alle 589 Regressionen bestehen und danach erstmals den bereits vorbereiteten `cap copy ios`-Pfad mit `capacitor.config.json` end-to-end ausführen.
