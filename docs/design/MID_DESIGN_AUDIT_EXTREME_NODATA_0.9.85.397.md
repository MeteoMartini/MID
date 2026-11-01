# MID-Designaudit 1.5 – P0: Extreme-RUC/EPS-Anzeigen ohne falsche Nullwerte

**Ausgangsbasis:** v0.9.85.396, SHA `d32201fbb541f4c5189e549c1250de0964bd61d1`; Source-of-Truth, AGENTS.md, fünf Rulesets und Installer #41292437081 live geprüft.

## Reproduzierbarer Fehler
Im regionalen Extremwetter-Ausblick wurde `Number(metric.foo)||0` für angezeigte RUC-/EPS-/Extremwettermetriken verwendet. JavaScript wandelt `null` in 0; `undefined`, leere Strings und ungültige Zahlen gelangen über die Fallback-Verzweigung ebenfalls als 0 in Ausgaben. Außerdem bewertet `Number.isFinite(Number(null))` einen fehlenden Wert fälschlich als endlich. Die Auswirkungen betreffen unter anderem Neuschnee, Niederschlag, Böen, CAPE/CIN, Eis, RUC-Support, Geländehöhen und Akkumulationsdauern. Der Fehler darf nicht als harmlose UI-Kosmetik behandelt werden: er täuscht Evidenz vor.

## Pragmatischer Fix
- Neue, kleine, reine Modulgrenze `src/extremeEvidenceNumeric.ts` für endliche Zahlen, realen 0-Wert, positive Dauer und nichtnegative physikalische Mengen.
- `null`, `undefined`, leere Strings, `NaN`, `Infinity`, Booleans, Arrays/Objekte sind keine Beobachtung. Fehlende Evidenz wird **nicht verfügbar** genannt.
- Negative CIN- und andere signierte Größen bleiben zulässig; für negative Niederschlagssummen, Schnee, Böen und Akkumulation ist kein falscher Nullfallback erlaubt.
- Akkumulationen werden nur bei bekanntem positiven Zeitfenster als mm/h oder cm/h bezeichnet; unbestätigte Fenster zeigen `Zeitraum nicht verfügbar`. Echte Nullmenge bleibt 0.
- Fehlende Terrainwerte werden nicht mehr zu 0 m oder unbesehen zu Tiefland erklärt.
- RUC-/EPS-Evidenzzeilen erscheinen nur, wenn reale endliche Zahlen geliefert wurden, keine erfundenen Punktwerte.
- **Keine meteorologische Warnungsberechnung geändert:** DWD-Warnungen bleiben amtlich getrennt von probabilistischen MID-Modellhinweisen, keine Glättung, kein verändertes Laufzeit-/EPS20-/RUC-/ICON-Feld oder Modell-Thresholding.

## QA und Freigabe
Im bereits obligatorischen `scripts/test-extreme-outlook-startup-format-09661.mjs` wird das reale neue Modul transpiliert und getestet: echte 0, null, leer, boolesch, nicht endlich, CIN, negative Menge, fehlende 1/6/24h-Akkumulation, RUC-6h und 15min. Die bisherigen 1059/1059 Regressionseinträge und 38 Fachverträge bleiben identisch. Echter Browser-, DWD-/RUC-Live-, iOS-/VoiceOver- und Light-/Dark-/Viewport-Nachweis bleibt gesonderte Abnahme. Produktion ausschließlich über SHA-gebundenes Source-PR-Gate → kontrollierten Bot-Merge → serverseitiges ZIP → Installer/Worker/Pages/Finalize → Stable-Promotion; nie direkten Branch-Push.
