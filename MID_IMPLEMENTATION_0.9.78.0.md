# MID Implementation v0.9.78.0

Datum: 2026-09-02

## Anlass

Die bisherigen Wetterzustandsdarstellungen waren funktional nicht vollständig genug differenziert und enthielten noch einen historischen Emoji-Hilfspfad. Für die gesamte App wird deshalb ab diesem Stand ein einziges modernes, skalierbares Wetterpiktogramm-System verbindlich. Es folgt dem zuvor festgelegten MID-Design und erweitert die Symbolik insbesondere um Niederschlagsart, Niederschlagsstärke sowie synoptische Sonderphänomene.

## Verbindlicher Standard

`MID_WEATHER_PICTOGRAM_STANDARD.md` und `src/WeatherPictogram.tsx` bilden ab v0.9.78.0 den appweiten Wetterzustandsvertrag. Neue Forecast-, Tages-, Stunden-, Event-, Reise-, Wasser-, Berg-, Routen-, Ensemble- und Widgetdarstellungen dürfen keinen parallelen Wettericon- oder Emoji-Renderer einführen.

## Umsetzung

- `WeatherPictogram` bleibt ein echtes Inline-SVG mit einheitlichem `68 × 68`-ViewBox und ist damit ohne Rasterverlust von sehr kleinen Diagrammzellen bis zu großen Detailkarten skalierbar.
- Einheitliche Tag-/Nachtlogik mit Sonne/Mond und bewusst zurückgenommenem Tageszeitanker bei geschlossener oder stratiformer Bewölkung.
- Einheitliche Hell-/Dunkellogik über zentrale `--wx-icon-*`-Design-Tokens; die SVG-Geometrie bleibt in beiden Themes identisch.
- Niederschlagsstärke wird als `light`, `moderate` oder `heavy` fachlich getrennt und primär durch Anzahl, Dichte, Größe und Strichstärke dargestellt statt durch eine bloße Farbänderung.
- WMO-Forecastcodes unterscheiden nun unter anderem leichten/mäßigen/starken Sprühregen, Regen, Schnee, Schauer, Schneeschauer und gemischte Niederschläge.
- Stratiformer Schneeregen und konvektive Schneeregenschauer sind getrennte Piktogrammzustände.
- Ergänzte synoptische Present-Weather-Brücke für dekodierte SYNOP-/BUFR-/METAR-Phänomene, einschließlich `DZ`, `FZDZ`, `RA`, `FZRA`, `SHRA`, `SN`, `SG`, `SHSN`, `RASN`, `IC`, `PL`, `GS`, `GR`, `TS`, `TSGR`, `BR`, `FG`, `FZFG`, `HZ`, `SQ` und `FC`.
- Schneegriesel/Snow Grains (`SG`), Eiskristalle (`IC`), Eiskörner (`PL`), Graupel/Small Hail (`GS`) und Hagel (`GR`) besitzen unterschiedliche Partikelformen.
- Gefrierender Sprühregen und gefrierender Regen werden gegenüber nicht gefrierendem Niederschlag sichtbar abgegrenzt.
- Gewitter und Hagelgewitter besitzen getrennte Symbolik; bei hoher Intensität wird die konvektive Dynamik stärker visualisiert.
- `data-day-part`, `data-weather-kind`, `data-intensity` und optional `data-phenomenon` stellen die Semantik zusätzlich für Styling, Tests und barrierearme Ableitungen bereit.
- `compact` und `plain` erlauben kleine Forecastzellen beziehungsweise diagrammtaugliche Darstellungen, ohne einen zweiten Iconsatz zu erzeugen.
- Der historische `weather.icon()`-Emoji-Hilfspfad wurde entfernt. `routeWeather` speichert kein redundantes Emoji-Feld mehr; Wetterzustände bleiben im kanonischen Code-/Piktogrammpfad.

## Designvertrag

Die neuen `--wx-icon-*`-Tokens in `src/styles-src/10-features.css` steuern Sonne, Mond, Wolken, Regen, Schnee/Eis, Hagel, Gewitter sowie Tages-/Nachtplatten zentral. Die Regeln werden über den bestehenden Maintenance-Aggregator nach `src/styles.css` überführt und gelten damit für Desktop, iPhone/iPad sowie Hoch-/Querformat gleichermaßen.

## Regression

Neu: `scripts/test-weather-pictogram-standard-09780.mjs`.

Die bestehende Piktogrammregression wurde auf die getrennten Zustände für stratiformen Schneeregen und Schneeregenschauer sowie die neue Nebelrenderer-Signatur aktualisiert.

## Worker

Keine fachliche Workeränderung. Der Worker wird nur auf v0.9.78.0 versionssynchronisiert. Ein erneuter Worker-Upload ist für dieses Release nicht erforderlich, sofern der Worker aus v0.9.77.27 oder neuer bereits produktiv ist.
