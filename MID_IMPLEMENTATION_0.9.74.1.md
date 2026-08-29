# MID v0.9.74.1 – TypeScript-Hotfix für optionale H/M-Wolkenwerte

## Anlass
GitHub Release Run #765 (Run-ID 33275894586) validierte ZIP, `npm ci`, Produktionsabhängigkeits-Audit und Repository-Hygiene erfolgreich. Der Lauf scheiterte erst in `tsc --noEmit` mit zwei `TS2322`-Fehlern in `src/ForecastCockpit.tsx`: `midCloud` und `highCloud` sind im bestehenden `ShortTermForecastPoint` absichtlich optional (`number | undefined`), während die neue reine SVG-Darstellungsfunktion aus v0.9.74.0 den Prop `value` zu eng als `number` typisierte.

## Korrektur
`SvgProfileCloudStructure` akzeptiert nun `number | undefined`. Die bestehende interne Normalisierung `clamp(Number(value)||0,0,100)` bleibt unverändert, sodass fehlende optionale H/M-Werte weiterhin sauber als 0 %/leer gerendert werden. Tiefe Wolken, Gesamtbewölkung, höhentypische Strukturen, Intensitätssteuerung und Nachbarstunden-Fading bleiben fachlich unverändert.

## Regression
`test-cloud-profile-structures-09740.mjs` schützt nun zusätzlich den optionalen Prop-Vertrag. Zwei ältere 24-h-Profilregressionen wurden außerdem semantisch an die seit v0.9.74.0 korrekte Beschriftung `Wolken gesamt / hoch / mittel / tief + UVI` angepasst. Damit würde der Release nach dem TypeScript-Fix nicht an einem veralteten Texttoken scheitern.

## Plattform / Worker / RUC
Reiner Frontend-TypeScript-Wartungshotfix. Keine Worker-Fachänderung, keine neue Wetterquelle, keine RUC-Änderung, kein iOS-Fork und keine kostenpflichtige Infrastruktur.
