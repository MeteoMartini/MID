# MID 0.9.84.53

## Installer #1008
TypeScript 7.0.2 und Vite 8.2.2 liefen im GitHub-Installer bereits erfolgreich durch. Der Abbruch entstand erst in der Regressionssuite durch zwei statische Tests, die noch die alte Hero-Struktur und die alte direkte `currentPrecip.intensity`-Piktogrammbindung erwarteten.

Die Tests wurden auf den bereits kompilierten v0.9.84.52-Vertrag aktualisiert:
- Beobachtetes Present Weather priorisiert `currentPictogramIntensity`.
- Das neue `current-weather-facts`-Band liegt zwischen Hauptwettertext und Tmin/Tmax.
- Tmin/Tmax bleibt außerhalb der Textspalte und liegt responsiv in der dritten Hero-Zeile.

Keine Produktivlogik wurde gegenüber v0.9.84.52 verändert.
