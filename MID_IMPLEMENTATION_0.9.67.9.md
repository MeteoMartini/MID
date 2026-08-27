# MID v0.9.67.9 – Release-Hotfix

## Anlass
Der v0.9.67.8-Produktionsbuild, TypeScript und die neue Extremwetter-Resilienz waren erfolgreich. Eine historische Regression `test-dach-extreme-outlook-09660.mjs` verlangte jedoch weiterhin die alte parameterlose Worker-Signatur `dachExtremeOutlookData()`. Seit v0.9.67.8 ist die Funktion absichtlich als `dachExtremeOutlookData(profile='full')` parametrisiert, damit Worker und Browser-Fallback unterschiedliche belastbare Vollgebietsprofile nutzen können.

## Änderung
Nur der veraltete Regressionvertrag wurde auf die aktuelle resiliente Signatur angehoben. Die fachliche Extremwetterberechnung, das vollständige ICON-D2-Modellgebiet, Mitteleuropa-Benennung, Rasterprofile, Batch-Retries, Teilcache, Mindestabdeckung und Canvas-Flächenrenderer bleiben unverändert.

## Release
Professional- und Worker-Version werden gemeinsam auf v0.9.67.9 synchronisiert.
