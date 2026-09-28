# MID v0.9.85.112 – Kartenbedienung und Desktop-7-Tage-Layout

## Umfang

Dieser Build ist ein reiner UI-/Responsive-Fix. Meteorologische Datenquellen, Schwellen, Wetterlogik, Modellfusion, Warnlogik und Piktogrammsemantik bleiben unverändert.

## Kartenbedienung

Im modernen Karten-Fokusarbeitsraum bilden Zoom +/−, Standort und Ebenen/Einstellungen eine gemeinsame Controlfamilie:

- gemeinsame rechte Flucht mit mindestens 12 px Kartenabstand und Berücksichtigung der rechten Safe Area,
- 44 × 44 CSS-Pixel je Touchziel,
- identische visuelle Größenordnung, Radius und ruhige MID-Flächenbehandlung,
- 10 px vertikale Trennung zwischen Zoomgruppe, Standort und Ebenen,
- die native MapLibre-Control-Marge wird im Fokusarbeitsraum aufgehoben, damit die sichtbare rechte Flucht nicht doppelt versetzt wird,
- Attribution und Quellenanzeige am unteren Kartenrand bleiben unverändert und dürfen von diesen Controls nicht überdeckt werden.

Die Controls verändern ausschließlich Bedienung und Layout; Karte, Layer, Radar-/Satellit-/Nowcast-Daten und Kartenposition bleiben fachlich unverändert.

## 7-Tage-Desktopdarstellung

Arbeitspaket E definiert 7- und 14-Tage als vertikale Forecast-Row-Familie ohne horizontales Kartenkarussell. Eine ältere Layoutregel setzte jedoch für die sieben kompakten Tageskarten weiterhin explizit `grid-column: 1…7`. Auf einem inzwischen einspaltigen Parent-Grid erzeugte dies auf Desktop implizite Zusatzspalten. Folgen waren abgeschnittene bzw. seitlich verschobene Tage und ungenutzte Restbreite.

Für v0.9.85.112 gilt deshalb verbindlich:

- jede 7-Tage-`mid-forecast-row` liegt in Grid-Spalte 1 und im normalen automatischen Zeilenfluss,
- das Inline-Stundendetail liegt ebenfalls in Spalte 1 und im normalen Zeilenfluss unmittelbar hinter der gewählten Tageszeile,
- der Parent bleibt eine einspaltige, 100 % breite Liste ohne horizontales Scroll-/Carousel-Verhalten,
- Smartphone-/Tablet-Umbrüche bleiben erhalten; es wird kein zweites Desktop-Sonderlayout eingeführt.

## Responsive-Abnahme

Vor Stable-Promotion sind mindestens 390×844, 430×932, 834×1194, 1194×834, 1440×900 und 1920×1080 zu prüfen, soweit die jeweilige Ansicht sinnvoll ist, jeweils in Light/Dark. Zu prüfen sind horizontales Overflow, Safe Areas, Touchziele, abgeschnittene Forecast-Rows, Karten-Control-Flucht und freie Attribution.

## Regression

Pflichtregression: `scripts/test-mid-18-2-17-map-desktop-ui-0985112.mjs`.

Weiterhin verbindlich: `scripts/test-mid-18-2-5-e-forecast-rows-098583.mjs`, `scripts/test-mid-18-2-5-f-map-first-098584.mjs` und die bestehende Responsive-Suite.
