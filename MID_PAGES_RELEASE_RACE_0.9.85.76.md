# MID 18.2.2 · Pages-Release-Race-Schutz · v0.9.85.76

## Ursache des Fehlers

Ein RUC-Pages-Lauf kann auf einem noch gültigen älteren `mid-stable` beginnen, während parallel bereits ein neuer MID-Release über den Source-PR-/Installer-Pfad auf GitHub Pages veröffentlicht wird. Wenn der RUC-Lauf nach dem neuen App-Deploy, aber vor der Stable-Promotion veröffentlicht, kann sein kombiniertes MID+RUC-Artefakt die neue App-Shell wieder durch die ältere Stable-Shell ersetzen.

Dieser Ablauf trat am 21.09.2026 konkret auf:
- MID v0.9.85.75 wurde erfolgreich auf Pages deployed.
- Ein bereits laufender RUC-Publish verwendete noch MID v0.9.85.74 / Stable-SHA 923d81e2…
- Dieser RUC-Publish lief danach erfolgreich durch und setzte die öffentliche App wieder auf v0.9.85.74 zurück.

## Verbindlicher Schutz

- Vor jedem RUC-Pages-Publish wird neben dem erwarteten `mid-stable`-SHA auch die Releaseversion von `main` gegen `mid-stable` geprüft.
- Ist `main` bereits auf einer neueren MID-Version als `mid-stable`, gilt das als offenes Releasefenster. Der RUC-Publish wird als sicherer No-op übersprungen.
- Unmittelbar vor dem eigentlichen Pages-Upload erfolgt dieselbe Prüfung erneut, damit auch ein während des RUC-Publish-Jobs gestarteter Release den älteren App-Shell-Publish noch stoppt.
- Der manuelle Stable-Pages-Deploy wird ebenfalls blockiert, solange `main` und `mid-stable` unterschiedliche MID-Versionen tragen.
- Der nächste RUC-Lauf nach Stable-Promotion baut automatisch auf der neuen MID-Version auf.

## Unverändert

RUC-Datenlogik, Parameterpriorisierung, 5-/15-/60-Minuten-Kadenzen und das Pages-Free-Datenbudget bleiben unverändert.

## Regression

`scripts/test-pages-release-race-098576.mjs`
