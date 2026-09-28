# MID Implementation v0.9.20.0

## Neues Modul

Unter der Kurzfristansicht steht nun das optionale Modul **DWD Niederschlagsarten-Radar** bereit. Es verwendet das offizielle DWD-Produkt **Wolken + Niederschlagsart**, stellt einen gezoomten Ausschnitt um den gewählten Ort dar und markiert den Standort im Bildzentrum.

## Verhalten

- Standardmäßig aktiviert.
- Unter **Einstellungen → Ansicht & Einheiten → DWD Niederschlagsarten-Radar** deaktivierbar.
- Einbindung in der klassischen Kurzfristansicht sowie in `Cockpit · Register` und `Cockpit · Ribbons`.
- Automatische Ausblendung außerhalb der Deutschland-Abdeckung.
- Aktualisierung in Fünf-Minuten-Zeitfenstern; Fehlerzustand mit direktem Link zum DWD-Originalprodukt.
- Responsive Zoomstufen für Desktop, Tablet und Smartphone.

## Technik

- Neue Komponente: `src/DwdPrecipitationTypeRadar.tsx`
- Neuer Worker-Modus: `dwd-precipitation-type-image`
- Upstream: `https://www.dwd.de/DWD/wetter/sat/satwetter/njob_satrad.png`
- Worker-Cache: 240 Sekunden plus Stale-While-Revalidate.
- CORS-Header und Quellenmetadaten werden vom Worker gesetzt.

## Geänderte Dateien

- `src/DwdPrecipitationTypeRadar.tsx`
- `src/App.tsx`
- `src/ForecastCockpit.tsx`
- `src/ShortTermForecast.tsx`
- `src/styles.css`
- `worker/metar-proxy.js`
- `scripts/test-dwd-precipitation-type-radar-09200.mjs`
- Versions-, Baseline- und Changelog-Dateien

## Deployment

Der Cloudflare-Worker muss aktualisiert werden, da der neue Bildproxy Bestandteil des Workers ist.
