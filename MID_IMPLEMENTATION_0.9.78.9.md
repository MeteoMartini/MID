# MID Implementation v0.9.78.9

Datum: 2026-09-03

## Anlass

Trotz des zentralen `WeatherPictogram`-Renderers wirkten Wetterzustände in mehreren Ansichten weiterhin wie alte MID-Icons. Die Ursache war nicht primär ein zweiter Renderer, sondern die visuelle Kopplung der Hauptglyphe an die diagnostische H/M/L-Wolkenform. Dadurch konnte beispielsweise ein regnerischer oder bedeckter Tag als wellige Höhenwolken-/Schichtwolkenform erscheinen. Parallel blieb die 14-Tage-Desktopansicht bei realen Desktopbreiten zu eng und ließ Inhalte innerhalb der Karten kollidieren.

## I. Weather Icon System 2.0 – appweiter visueller Form-Lock

`src/WeatherPictogram.tsx` bleibt der einzige Forecast-Wetterzustandsrenderer. Zusätzlich trennt v0.9.78.9 nun strikt zwischen meteorologischer Diagnostik und sichtbarer Symbolfamilie:

- `data-cloud-layer` und `data-cloud-form` bleiben für H/M/L-/Wolkenformdiagnostik erhalten.
- `weatherPictogramVisualForm()` bestimmt ausschließlich die sichtbare Hauptform.
- Bedeckt rendert als saubere geschlossene Wolke.
- Stratiformer Niederschlag rendert mit der einheitlichen Weather-Icon-System-2.0-Niederschlagswolke.
- Schauer verwenden die Haufenwolkenfamilie mit Tag-/Nacht-Himmelskörper.
- Gewitter verwenden die Cumulonimbus-Familie.
- Nebel/Dunst/Reifnebel verwenden ausschließlich ihre Linien-/Eissymbolik und keine zusätzliche Wolke.
- Wolkenhöhen-Diagnostik darf deshalb keine Forecast-Glyphe mehr in die wellige Cirrus-/Altostratusdarstellung umformen.

Der Lock wird in Aktuell, Kurzfrist, 7/14 Tage, Ensemble, Event, Reise, Route und Wassersport regressionsseitig kontrolliert. Radar-/Komposit-Bedienicons wurden zusätzlich von Wetter-Emoji-Schaltern auf Lucide-Symbole umgestellt. Sonnenschein-/Regime-Parametericons im Forecast-Cockpit und Widget verwenden ebenfalls das gemeinsame Vektordesign. Auch klassische 7-Tage-Metadaten, Kurzfristdetails, Ensemble-Niederschlagsangaben und Event-Sonnenscheinanzeigen wurden von sichtbaren Legacy-Wetteremoji auf Vektor-/Textsemantik migriert; entsprechende Regressionen verhindern deren Rückkehr.

## II. 14-Tage-Desktoplayout

Der Desktopmodus beginnt verbindlich oberhalb 1024 CSS-Pixel. Ab 1025 px gilt ein eigener Schluss-Lock in der CSS-Kaskade:

- Kartenbreite **224 px** statt 190 px,
- horizontales, snap-fähiges Kartenband statt Inhaltsquetschung,
- Mindesthöhe 270 px,
- klar getrennte Bereiche für Wetterkopf/Konsistenz, Regime, Tmin/Tmax, Temperaturabweichung, Niederschlag, Sonnenschein und Wind,
- keine 4–6-px-Tablet-Mikroschrift auf Desktop,
- Tracks mit 8 px Höhe und lesbaren 9–20-px-Typografiestufen,
- Tablet-/Mobil-Querformat 7 × 2 bleibt ausschließlich bis 1024 px erhalten.

Damit folgt Desktop wieder denselben MID-Designregeln wie mobile Ansichten: klare Informationshierarchie, keine Textüberlagerung, keine künstliche Verdichtung auf Kosten der Lesbarkeit.

## Worker

Keine fachliche Workeränderung. Das Release betrifft React-/SVG-/CSS-Rendering und Regressionen.
