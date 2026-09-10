# MID Testreport v0.9.84.26

## Fachliche Zielprüfungen
- Wetterpiktogramm-Standard / UI-Lock
- neue Regression `test-pictogram-intensity-snow-depth-098426.mjs`
- zentrale Niederschlagsklassifikation inkl. WMO 82, 87–94 und intervallbezogener Intensität
- Perioden-/Tag-/Nacht-Repräsentanz und Detailpiktogramme
- Schneehöhe ganzzahlig in Bergwetter, Meteogramm und Reiseplaner
- Weather-Source-Modularisierung / bytegleiche Aggregatdatei

## Build-/Umgebungsgrenze
Der kanonische Release-Preflight benötigt die im Projekt gepinnte TypeScript-7-/Vite-Toolchain. Falls diese in der isolierten Arbeitsumgebung nicht vollständig installierbar ist, werden TS7-/Vite-Ergebnisse nicht als lokal bestanden ausgegeben; die GitHub-Release-Pipeline bleibt die verbindliche Gesamtbestätigung. Toolchain-unabhängige Regressionen und die finale ZIP-Integrität werden lokal geprüft.
- Regression ergänzt: WMO 77–79 ohne erfundene Code-Intensität; WMO 98 ohne Regen-/Niederschlags-Falschklassifikation.

## Vertiefter WMO/DWD-Semantikaudit
- WMO 91/92: aktuelle Regenschauer nach Gewitter in der vorausgegangenen Stunde; Schauer-Tag/Nacht-Symbol, kein Blitz.
- WMO 93/94: winterlicher Niederschlag nach vorangegangenem Gewitter ohne erfundene Einzelphase.
- WMO 95–99: aktuelle Gewitter vollständig in Gewitter-/Event-/Flugpfaden erkannt; 98 bleibt ohne erfundenen Niederschlag.
- Radar-Modell-Phasenoverlay: 83/84 gemischt, 87/88 Graupel, 89/90 Hagel, 91/92 Regen; 98 ist kein Niederschlagsbeleg.
- Reine Schauer-Mengenklassifikation behandelt 0,4–<0,7 mm/10 min konservativ, da die DWD-Mengentabelle diesen Zwischenbereich nicht eindeutig einer Stärke zuordnet.

## Finaler fokussierter Preflight
Bestanden wurden nach Abschluss der fachlichen Korrekturen insbesondere:
- `test-pictogram-intensity-snow-depth-098426.mjs`
- Weather-Pictogram-Standard und UI-Lock
- Perioden-/Tag-/Nacht-Piktogrammvertrag inklusive Höhenwetter
- Forecast-Cockpit, Kurzfrist-, Ensemble-, Berg-, Wasser- und Reise-Schneehöhenpfade
- zentrale appweite Niederschlagsplausibilisierung
- Versions-, Baseline-, Release-Lineage-, Uploadbudget- und lokale Importprüfung (160 TypeScript-Dateien)
- Syntax beider Worker und beider Service Worker; `public/sw.js` und `public/service-worker.js` sind bytegleich.

Ein älterer Höhenwetter-Regressionstest erwartete die frühere JSX-Prop-Reihenfolge ohne das neue `intensity`-Prop. Die Funktion war korrekt; der Test wurde auf `code + intensity + day` migriert und besteht anschließend.

Vier weitere unmittelbar fachbezogene Alt-Regressionen benötigen die gepinnte TypeScript-7-/`typescript-strada`-Toolchain und konnten lokal deshalb nicht ausgeführt werden. Ein frisches `npm ci` wurde versucht, lief in der isolierten Umgebung jedoch in einen Pakettransport-Timeout. Ein vollständiger lokaler TS7-/Vite-Gesamtbuild wird daher nicht als bestanden ausgegeben; die GitHub-Release-Pipeline bleibt die kanonische Gesamtbestätigung.
