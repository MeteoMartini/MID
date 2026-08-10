# MID v0.9.39.8

## Installer-Uebergang fuer verbliebenes `node_modules/minimist`

Der alte Installer auf `main` schliesst `.git/` beim `rsync` aus. Befindet sich im historisch versionierten `node_modules/minimist/` ein geschuetzter `.git`-Rest, kann `rsync --delete` das Verzeichnis nicht vollstaendig entfernen. v0.9.39.7 lieferte nur ein leeres `node_modules/`; der anschliessende `diff -qr --exclude='.git'` sah deshalb `minimist` nur auf der Zielseite und brach mit `Only in ./node_modules: minimist` ab.

v0.9.39.8 liefert fuer genau diesen einmaligen Uebergang ein echtes leeres Verzeichnis `node_modules/minimist/` mit. Dadurch existiert der Verzeichnisname auf Quell- und Zielseite; `rsync` entfernt alle normalen Altdateien, darf einen geschuetzten `.git`-Rest stehen lassen und `diff --exclude='.git'` bewertet beide Seiten dennoch als identisch.

Der bereits enthaltene neue Installer entfernt `node_modules` vor dem Releasevergleich und schliesst es danach vollstaendig aus. Der Bootstrap bleibt daher ausschliesslich fuer die Installation mit dem noch alten Workflow auf `main` erforderlich.
