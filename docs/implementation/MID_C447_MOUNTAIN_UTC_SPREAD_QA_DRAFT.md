# MID .447 – SHA-gebundener Bergwetter-QA-Vorläufer

**DRAFT / NO BUILD / NO MERGE / NO RELEASE.** Neuer Head basiert auf veröffentlichter .446-Stable `5e25ab60b365950a54a7d113483e8bf519911113`; Branchname .447 ist nur ein geplanter Releasekontext, `package.json` bleibt im QA-Vorläufer .446. Versionsspiegel, alle Changelogs, offizielle Source-/Installer-/Worker-/Pages-/Stable-Gates werden erst bei späterer QA-gesicherter Gesamtintegration synchronisiert.

**Provenienz:** selektive Wiederverwendung der meteorologischen/visuellen Originalfixes aus altem `chatgpt/v0.9.85.415-web-budget-mountain-dst` / Commit `e19fe6ad9b859479e461094b3f5e45dd107b4771`. Keine Übernahme seiner veralteten Regionalmodelle, Icon-Prune-/Budget-Versuche, App-/Worker-Versionen oder Releasezustände.

Open-Meteo Ensemble `timeformat=unixtime` für echte UTC-Sekunden, numerische streng steigende Stundenachsen; unbekannte Modell-/Feldwerte nicht als 0, fehlende Spreizung nicht als punktförmiges Band ausgeben. SVG-Legende zeigt Datenlücken, ohne mediane Schneefallgrenze oder nachgewiesene Extreme zu verändern. Neuer fokussierter Regressionstest in allen drei bestehenden Inventaren; tatsächliche CI/Browser/Provider/physische iOS-Abnahme **NOT VERIFIED**. Quelle: https://open-meteo.com/en/docs/ensemble-api. Referenzen Issues #428 und #523.
