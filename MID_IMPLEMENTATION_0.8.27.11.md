## MID v0.8.27.11

### Ursache
Der Produktionsbuild von v0.8.27.10 war erfolgreich. Der GitHub-Workflow brach erst in der anschließenden Regression ab, weil mehrere ältere Tests weiterhin frühere Tooltip-, Achsen-, Export- und Wetterband-Geometrien verlangten.

### Korrektur
- Datumsachsenprüfung auf die aktuelle responsive X-Achsenreserve aktualisiert
- Export- und Fußnotenprüfung auf die aktuelle Temperaturdiagrammhöhe und Margen angepasst
- Hochformat-, Wetterband- und Hazardtests auf die neue tageszentrierte Tick-Geometrie umgestellt
- Tooltiptests auf die aktuelle sichere Randpositionierung mit automatischer Linksverschiebung aktualisiert
- Interaktions-, Referenzdesign-, UI- sowie Wasser-/Gezeiten-Layeringtests synchronisiert

### Prüfung
- 211 automatisch erkannte Regressionstests bestanden
- TypeScript-/TSX-Parserprüfung für die relevanten Quelldateien bestanden
- Worker-Syntaxprüfung bestanden
- ZIP-Struktur geprüft
