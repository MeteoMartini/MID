# MID 0.9.78.69 – CI-Hotfix Konfidenz ≠ Datenqualität

Grundlage ist MID 0.9.78.68. Der Produktionscode aus GitHub-Run #903 hat TypeScript 7 und den vollständigen Vite-Produktionsbuild erfolgreich bestanden. Der Lauf brach erst in genau einem von 687 Regressionstests ab.

## Ursache

`scripts/test-ensemble-multiparameter-097865.mjs` enthielt noch den historischen Vertrag, dass eine schwache Datenbasis die meteorologische Tageskonfidenz zwingend auf `mittel` begrenzen müsse. Dieser Vertrag widerspricht der bewusst eingeführten Trennung aus 0.9.78.67/68:

- Füllfarbe / `agreement` = meteorologische Ensemblekonfidenz,
- separater Qualitätsring / `dataQuality` = Vollständigkeit, Frische und Abdeckung der Datenbasis.

Nach der neuen Logik dürfen zwei stark übereinstimmende Kernparameter weiterhin `hoch` ergeben, während die Datenbasis separat `schwach` bleibt. Weniger als zwei bewertbare Kernparameter bleiben weiterhin fail-closed `nicht bewertbar`.

## Umsetzung

- Die drei veralteten `medium`-Erwartungen im Mehrparametertest wurden auf den aktuellen Vertrag umgestellt:
  - fehlender Niederschlags-Kernparameter bei stark übereinstimmenden übrigen Kernparametern: `hoch` + Datenbasis `schwach`,
  - unbekannte Laufzeit/Frische: `hoch` + Datenbasis `schwach`,
  - deutlich unvollständige Member-Abdeckung: `hoch` + Datenbasis `schwach`.
- Der Fail-closed-Vertrag bei weniger als zwei Kernparametern bleibt unverändert `unknown`.
- Neue statische Regression `scripts/test-ensemble-data-quality-separation-097869.mjs` schützt genau diese Trennung.

## Produktionslogik

Keine meteorologische Produktionslogik wurde gegenüber dem in #903 erfolgreich gebauten Stand verändert. Die Konfidenzberechnung, kompakten 14d-Badges, Datenqualitätsringe, Skybar, Warnungen, Favoriten und Worker-Fachlogik bleiben unverändert. Nur Testvertrag, Release-Metadaten und Versionssynchronisierung ändern sich.
