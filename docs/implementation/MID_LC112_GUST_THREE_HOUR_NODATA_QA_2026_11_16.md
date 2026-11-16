# MID LC 1.12 · #422 – Drei-Stunden-Böenmaximum: echte NoData unverändert erhalten

**QA DRAFT, kein Ready, Merge oder Release.** Auf Source `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` (v0.9.85.486, fünf aktive Rulesets) und bereits konsolidiertem QA-HEAD `52139175f187a469c7b495ad868e135fedba1c40` untersucht. Vor dieser Korrektur waren Vitest 5/V8, gezielte Regressionen und RUC censored-evidence-qa auf exakt `52139175f187a469c7b495ad868e135fedba1c40` SUCCESS. Der neue Commit benötigt **eigene** SHA-gebundene QA. Kein Source-/Release-/Worker-/Sicherheitsgate verändert.

## Reproduzierbarer Fachfehler

Im tatsächlichen `src/App.tsx` `detailHoursByResolution(…,'3h',…)` enthielt das lokale Böenmaximum `Math.max(...group.map(hour=>Number(hour.gust)||0))`. Ein fehlender Rohwert `null`, `undefined`, Leerstring oder `NaN` wurde dabei als `0` interpretiert. Beim abschließenden `gust:Math.max(base.wind,maximum('gust'))` konnte eine völlig fehlende Böenserie darüber hinaus den **mittleren Wind** als vermeintlich nachgewiesene Böe ausgeben. Fehlende Stunden wurden trotz unvollständiger Kalender-/DST-Gruppen als vollständiges Maximum verarbeitet. Das ist eine sachliche NoData-/Extremwert-/Zeitfenster-Verletzung; **kein** belegter Fehler des Original-Anbieters.

## Eng begrenzte Korrektur

Das dreistündige Böenmaximum ist nur dann fachlich gültig, wenn **alle** tatsächlichen stündlichen Böenwerte der zum lokalen Dreistunden-Kalenderfenster gehörenden Stunden endlich, numerisch, nichtnegativ und zeitlich vollständig vorhanden sind. Für 23/25-Stunden-DST-Grenzen bleibt die bestehende `detailThreeHourWindow`-/`completePrecipitationWindowCoverage`-Vollständigkeitsprüfung maßgeblich. Nur bei tatsächlich bekannter Böenserie darf die bereits vorhandene physikalische Bedingung `Böe ≥ Windmittel` angewendet werden; ein gültiger Wert `0` bleibt `0`, ein fehlender Wert wird `Number.NaN`, nicht eine erfundene Windstille. Ganze Rohmodelle/UTC/Radar-/Warnfelder, amtliche Warnungen und ursprüngliche stündliche Forecasts bleiben unverändert; ausschließlich die UI-Dreistundenaggregation wird korrigiert.

Bestehende `scripts/test-c23-cloud-missing-0985206.mjs`-Source-Regression um echte Peakwerte, echte Null, gültige Wind-Floor-Plausibilität, partielle/komplett fehlende Böen, fehlendes Zeitintervall, null/undefined/Leerstring/NaN/Infinity und negative Eingaben erweitert. Vorherige Niederschlag-/PoP-/Cloud-/Sunshine-/DST-Regressionen werden weder entfernt noch abgeschwächt.

## Unverändert offene Grenzen

Die grafische 1h-/3h-/DST-Zeitachse muss im echten Browser für 23/25-h-Tage, Touch/Dynamic Type, Light/Dark und Widgets-/Exportparität geprüft werden. Der `Hour`-Transporttyp deklariert `gust:number`; `NaN` dient bereits anderweitig als interne NoData-Repräsentation, **nicht** als JSON-0 oder gültige Messung. Externe Datenvollständigkeit und fachliche Extremwert-Evidenz dürfen nicht aus einem UI-Plot inferiert werden. Nach Codepatch neue Vitest-/targeted CI und volle Source-/Core-/Heavy-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates; Release-Sicherheits-#740 bleibt ausschließlich Spezialchat.
