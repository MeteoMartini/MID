# MID v0.9.39.7

## Installer-Bootstrap korrigiert

Der einmalige Übergangs-Bootstrap für ein versehentlich auf `main` versioniertes `node_modules/` wird als echtes **leeres Verzeichnis** im Replacement-ZIP ausgeliefert. v0.9.39.6 enthielt an dieser Stelle irrtümlich eine reguläre Datei `node_modules`, was beim unveränderten alten Installer zu `rsync` Exit 23 führte, sobald im Checkout bereits ein Verzeichnis gleichen Namens existierte.

Der alte Installationsschritt kann mit v0.9.39.7 daher unverändert arbeiten:

1. `rsync -a --delete` spiegelt das leere Release-Verzeichnis und entfernt den alten Inhalt.
2. `diff -qr` sieht auf beiden Seiten dasselbe leere Verzeichnis.
3. `npm ci` befüllt `node_modules/` regulär.
4. `prepare:release-repository` entfernt das historisch versionierte Verzeichnis aus dem Git-Index; `.gitignore` verhindert eine erneute Aufnahme.

Der Bootstrap ist nur für den Übergang vom alten Installer nötig. Der bereits im Release enthaltene neue Installer schließt `node_modules` künftig vollständig vom Release-Spiegel aus.
