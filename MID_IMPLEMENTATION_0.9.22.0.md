# MID Implementation v0.9.22.0

## DWD Niederschlagsarten-Radar
- Standortverortung auf lineare geografische Bildprojektion umgestellt; die bisherige Mercator-Interpolation war für das DWD-Komposit ungeeignet und verschob Marker nach Süden.
- Zeitstände für Radar/Niederschlagsart und Satellit/Wolken ergänzt. Soweit das DWD-Komposit nur einen gemeinsamen Bildstand liefert, wird dieser für beide Komponenten transparent ausgewiesen.
- Legende auf semitransparentem, weichgezeichnetem Hintergrund.
- Standortmarker deutlich transparenter und per Klick/Schalter aus- bzw. wieder einblendbar.
- Klickanalyse innerhalb des dargestellten DWD-Bildes: Niederschlagsklasse, Wolkensignal, Koordinate und Bildstand.
- Worker-Endpunkte `dwd-precipitation-type-meta` und `dwd-precipitation-type-info` ergänzt.

## Wetterkarten
- Satellitenbilder vollständig aus dem Wetterkartenmodul entfernt; das Modul enthält nur Modell- und Nowcastkarten.
- Explizite Auswahl jedes vom DWD-WMS gemeldeten Zeitschritts ergänzt; Slider/Animation bleiben zusätzlich erhalten.
- DWD ICON-EU, ICON Global, ICON-EPS und AICON um die öffentlich angebotenen WMS-Felder erweitert.
- Signifikantes Wetter über NowCastMIX mit Analyse, +60-min-Verlagerung, Gewitterzellen, Gewitterclustern und Blitz-Kurzzeitvorhersage ergänzt.
- WMS-Layerabgleich im Worker toleriert Namespace-Präfixe robust.

## Tests
- `scripts/test-dwd-precipitation-type-radar-09200.mjs`
- `scripts/test-dwd-radar-meteogram-alignment-09211.mjs`
- `scripts/test-weather-maps-module-09210.mjs`
- `scripts/test-radar-weather-maps-interaction-09220.mjs`

## Worker
Funktionale Worker-Änderung erforderlich; Worker-Upload notwendig.
