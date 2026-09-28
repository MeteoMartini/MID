# MID · Wetterblick-Transfer-Audit v0.9.15.4

## Ergebnis

Die öffentlich sichtbaren Bedien- und Darstellungsprinzipien von Wetterblick können als Inspiration technisch unabhängig in MID umgesetzt werden. Der konkrete JavaScript-/TypeScript-Code, interne APIs, nicht frei lizenzierte Datenströme und fertige Grafiken werden nicht übernommen, extrahiert oder automatisiert abgefragt.

## Öffentlich erkennbare Prinzipien

Wetterblick beschreibt für sein Radar unter anderem schnelleres Vorladen, flüssigere Übergänge, weniger Flackern, verbesserte Kartenverschiebung, Hover-/Tap-Interaktion sowie einen Stormtracker mit 60-Minuten-Zugbahn, 10-Minuten-Markierungen und betroffenen Orten. Diese Produktprinzipien sind keine Quellcodefreigabe.

## Für MID eigenständig umgesetzt

- vorhandene Rasterlayer werden beim Zoom nicht mehr ausgehängt und neu erzeugt;
- stabile Layer-Schlüssel verhindern unnötige Kachel-Cache-Invaliderung;
- Karten- und Wetterlayer behalten Kachelpuffer;
- angrenzende Radar-/Satelliten-Zeitstände werden unsichtbar vorgeladen;
- Desktop nutzt Leaflet-Zoom-/Fade-Animationen, Touchgeräte eine ressourcenschonendere Idle-Aktualisierung;
- die bestehende MID-Überblendung realer Produktstände bleibt erhalten;
- KONRAD3D-Ortslisten werden aus einer eigenen geometrischen Korridorberechnung erzeugt und bei dünnen Ortskatalogen durch sparsame Rückwärtsgeokodierung ergänzt.

## Nicht übernommen

- kein Wetterblick-Bundle oder fremder Quellcode;
- keine privaten oder undokumentierten Wetterblick-Endpunkte;
- kein Scraping von Stormtracker-, Radar- oder Nowcast-Daten;
- keine Übernahme von Wetterblick-Designgrafiken oder Logos;
- keine Behauptung, MID verwende Wetterblick-Daten.

## Datenbasis

MID nutzt für die Zellobjekte weiterhin DWD-KONRAD3D sowie die bereits vorgesehenen Radar-, Satelliten- und Blitzquellen. Ortsnamen stammen je nach Verfügbarkeit aus OpenStreetMap/Overpass und einem begrenzten BigDataCloud-Fallback. Abgeleitete Prognosepunkte werden im Datenobjekt als `derived: true` gekennzeichnet.

## Noch mögliche nächste Stufe

Für eine noch weichere Filmwiedergabe wäre eine zeitkontinuierliche, per `requestAnimationFrame` gesteuerte Interpolation zwischen zwei bereits geladenen Produktständen möglich. Diese sollte erst nach Messung von Speicherverbrauch und Bildrate auf älteren iPhones eingeführt werden.

## Quellen der Prüfung

- Wetterblick Nowcast, Stormtracker, Changelog und Nutzungsrichtlinien (Stand August 2026)
- Deutscher Wetterdienst: KONRAD/KONRAD3D und Open-Data-Verzeichnisse
- §§ 69a, 69c und 69d UrhG
