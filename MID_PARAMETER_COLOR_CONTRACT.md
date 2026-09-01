# MID – verbindlicher Parameter-Farbvertrag

Stand: v0.9.77.11

Dieser Vertrag ist appweit verbindlich. Er gilt für Browser/PWA und den gemeinsamen iOS-/Capacitor-Fachkern, auf Desktop, Tablet und Smartphone sowie im Hoch- und Querformat. Ein meteorologischer Parameter behält in Karten, Diagrammen, Tageswerten, Legenden, Tooltips, Selektoren und kompakten Übersichten dieselbe visuelle Grundidentität.

## Kanonische Parameterfarben

Die alleinigen Basisfarben liegen in `src/styles-src/00-foundation.css`:

- Temperatur allgemein: `--param-temperature`
- Tmin: `--param-temperature-min`
- Tmax: `--param-temperature-max`
- Niederschlag: `--param-precipitation`
- Luftdruck: `--param-pressure`
- Wind: `--param-wind`
- Böen: `--param-gust`
- Bewölkung: `--param-cloud`
- Sonnenscheindauer: `--param-sunshine`
- relative Feuchte: `--param-humidity`
- Taupunkt: `--param-dewpoint`
- Schnee: `--param-snow`

Hell-/Dunkelmodus dürfen die Werte dieser zentralen Tokens ändern, nicht jedoch Komponenten eigene Ersatzpaletten definieren.

## Verbindliche Verwendung

1. Linien, Punkte, Balken, Zahlen, Icons, Legendenmuster und Tooltip-Marker eines Parameters verwenden den zugehörigen Token oder eine über `color-mix()` daraus abgeleitete Variante.
2. Ein Modul darf für denselben meteorologischen Parameter keine lokale Basisfarbe einführen. Lokale Aliasvariablen sind nur zulässig, wenn sie unmittelbar auf den kanonischen `--param-*`-Token zeigen.
3. Tatsächliche Temperaturwerte werden nicht anhand ihres absoluten Werts oder ihrer Klimaabweichung umgefärbt. Tmin bleibt blau, Tmax rot; eine allgemeine Temperaturkurve verwendet `--param-temperature`.
4. Klimaabweichung, thermisches Empfinden, Wetterregime, Niederschlagsphase und Warnstufe sind eigene semantische Kanäle. Sie dürfen eigene Farben verwenden, wenn die Darstellung diesen Zusatzinhalt ausdrücklich kennzeichnet und dadurch die Parameteridentität nicht ersetzt.
5. Warnfarben dürfen die Parameterfarbe nur dort übersteuern, wo das konkrete Element die Warnstufe codiert. Ein normaler Windpfeil bleibt grün; ein warnstufiger Windpfeil darf die DWD-/MID-Warnfarbe tragen.
6. Niederschlagsart wird bevorzugt über Symbolik/Text unterschieden. Eine generische Niederschlagsmenge bzw. -wahrscheinlichkeit bleibt in der Niederschlagsfarbe.
7. Responsive Layout, Geräteausrichtung, Export und Touch-/Hover-Zustand dürfen die Parameteridentität nicht verändern.

## Verbindliche Referenzansichten

Insbesondere geschützt sind das 24-h-Wetterprofil, die 7-Tage-Tagesansichten samt aufgeklappten Tagesdetails, das 14-Tage-Ensemble, Trend 14d+, Meteogramm und Prognose-Cockpit.
