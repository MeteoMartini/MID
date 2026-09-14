# MID v0.9.84.102 – Implementierungsbericht

## Ausgangslage

Der Release-Kandidat v0.9.84.101 wurde im GitHub-Installer **#1056** (Run `34844908449`, Commit `08a2692b24b0a43bdf3e88b22aac1b8f75b639d4`) vollständig bis durch TypeScript 7 und den Vite-Produktionsbuild geprüft. Beide Buildstufen waren erfolgreich. Von **791** automatisch erkannten Regressionstests scheiterten nur noch zwei statische Altverträge.

Der letzte erfolgreich veröffentlichte kanonische Stand bleibt bis zum nächsten erfolgreichen Installer **v0.9.84.98** auf `mid-stable` (Commit `e90ac3e0210ddda50249b92787a1ab050bc2e1a2`). v0.9.84.102 setzt den fachlichen Kandidaten v0.9.84.101 unverändert fort.

## Ursache und Korrektur

1. `test-maplibre-precip-probability-09390.mjs` verlangte noch die alte `phaseMinimumDbz`-Signatur, in der Schnee und gefrierender Niederschlag gemeinsam ab 5 dBZ freigegeben wurden. Seit v0.9.84.99 ist die Klassifikation absichtlich konservativer: gefrierende Phase mindestens 9 dBZ, Schnee mindestens 6 dBZ. Der Test wurde auf genau diesen aktuellen Sicherheitsvertrag aktualisiert.

2. `test-radar-colortables-09404.mjs` verlangte weiterhin das alte spiralige Symbol für gefrierenden Niederschlag. Dieses Zeichen wurde auf Nutzerwunsch bewusst entfernt, weil es wie eine „Schnecke“ wirkte. Der Test schützt nun das neue Regen+Eis-Piktogramm und zusätzlich das dauerhafte Fernbleiben der alten Spiralform.

Es wurde keine Produktionslogik zurückgedreht, keine meteorologische Schwelle verändert und kein Testschutz abgeschwächt. Die beiden Tests wurden an bereits durch einen neueren Regressionstest (`test-synoptic-phase-pictogram-cleanup-098499.mjs`) geschützte Produktverträge angeglichen.

## Worker

Keine fachliche Worker-Logik wurde verändert. Versionsfelder werden regulär auf v0.9.84.102 synchronisiert; ein separater manueller Worker-Upload ist nicht erforderlich.
