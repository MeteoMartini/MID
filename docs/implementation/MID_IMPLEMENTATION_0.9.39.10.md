# MID v0.9.39.10

## Installer: valide Release-Datei vor Entpacken

Der Installationsworkflow prüft die hochgeladene `MID-professional-replacement.zip` künftig vor jedem Entpackversuch explizit:

- Dateigröße und SHA-256 werden im Actions-Log ausgegeben.
- Eine 0-Byte-Datei wird mit einer eindeutigen Fehlermeldung abgewiesen.
- `zipfile.is_zipfile()` prüft das Containerformat, bevor `ZipFile(...)` geöffnet wird.
- `ZipFile.testzip()` validiert die CRC aller Einträge vor dem Extrahieren.
- Bei einer Nicht-ZIP-Datei wird zusätzlich die erste Dateisignatur hexadezimal protokolliert.

Damit wird ein leerer oder beim Upload beschädigter GitHub-Blob nicht mehr als Python-Stacktrace `BadZipFile` sichtbar, sondern als klarer Uploadfehler diagnostiziert. Die bestehende Pfad-/Symlink-Prüfung des sicheren Entpackens bleibt unverändert erhalten.

Der v0.9.39.9-Anwendungsstand wird funktional unverändert übernommen; diese Patchversion betrifft ausschließlich Release-/CI-Robustheit und Versionssynchronisierung.
