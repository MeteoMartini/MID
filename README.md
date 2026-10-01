# MID – Meteorological Information Dashboard

MID ist eine wissenschaftlich fundierte, hyperlokale Wetter-App, die professionelle meteorologische Datenquellen (DWD, ECMWF, NOAA, ERA5) mit eigener Modellfusion, Ensemble-Analyse und Konfidenzbewertung kombiniert.

**Aktuelle Version:** v0.9.85.132  
**App:** [https://www.midwx.app](https://www.midwx.app)  
**Changelog:** [CHANGELOG.md](CHANGELOG.md)

## Funktionen

- **Aktuell:** Hyperlokale aktuelle Wetterdaten mit +12-Stunden-Temperaturtrend, Niederschlags-Nowcast, Luftqualität (EU-AQI), UV-Index, Sonne/Mond
- **Heute:** 90-Minuten-Nowcast (15-Minuten-Auflösung) und 24-Stunden-Wetterprofil mit stündlicher Auflösung
- **Vorhersage:** 7- und 14-Tage-Prognose mit Ensemble-basierten Konfidenzindizes, 46-Tage-Witterungstrend und Saisonvorhersagen (ECMWF SEAS5)
- **Karten:** Radar, Satellit und Synoptik mit DWD-Bodenanalyse, NowCastMIX-Blitzdaten und KONRAD3D-Konvektionsobjekten
- **Warnungen:** Amtliche DWD-/MeteoAlarm-Warnungen mit eigener Ereignis-Timeline
- **Klima:** ERA5-Klimanormalen (1991–2020) mit Windrose und Jahresverlauf
- **Planung:** Reiseplaner, Eventplaner und Berg-/Wintersportprofile

## Datenquellen

| Kategorie | Quellen |
|---|---|
| Leitprognose | Open-Meteo Best Match, DWD ICON-D2-RUC, ECMWF IFS |
| Ensembles | DWD ICON-EPS, ECMWF IFS ENS/AIFS ENS, NOAA GEFS |
| Langfrist | ECMWF EC46, NOAA GEFS, ECMWF SEAS5 (51 Member) |
| Beobachtungen | DWD Open Data/CDC/SYNOP, Bright-Sky, GeoSphere Austria |
| Radar & Satellit | RainViewer, OPERA-CIRRUS, DWD NowCastMIX, KONRAD3D |
| Klima | ERA5/ERA5-Land, ERA5-Seamless |
| Warnungen | DWD WFS/CAP, MeteoAlarm, NOAA/NWS |
| Flugmeteorologie | NOAA AviationWeather Center (METAR/SPECI, PIREP/AIREP, SIGMET) |
| Karten | OpenStreetMap, Photon/Overpass, BigDataCloud |

Siehe auch: [Quellen](https://www.midwx.app) (in der App über „Quellen" erreichbar)

## Technologie-Stack

- **Frontend:** React + TypeScript, Vite
- **Mobile:** Capacitor (iOS)
- **Backend:** Cloudflare Workers (Daten-Proxy, METAR-Proxy)
- **Hosting:** Cloudflare Pages
- **Karten:** MapLibre GL, OpenFreeMap

## Entwicklung

### Voraussetzungen

- Node.js (aktuelle LTS-Version)
- npm

### Setup

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Tests

```bash
npm run verify          # Build + Worker-Check + Regressionen
npm run test:regressions  # Nur Regressionstests
```

### Veröffentlichungsweg

Der reguläre Veröffentlichungspfad ist:

```
Source-PR → Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → Worker/Pages-Prüfung → Stable-Promotion
```

Direkte Änderungen an `main` oder `mid-stable` sind nicht zulässig. Siehe [AGENTS.md](AGENTS.md) für die vollständigen Regeln.

## Repository-Struktur

```
├── src/                    React/TypeScript-Quellcode
├── worker/                 Cloudflare Worker (METAR-Proxy)
├── worker-src/             Worker-Quellmodule
├── scripts/                Build-, Test- und Hilfsskripte
├── ci/github/workflows/    Kanonische GitHub-Actions-Workflows
├── .github/workflows/      Aktive Workflows (aus ci/ gespiegelt)
├── docs/                   Migrierte Dokumentation (seit v0.9.85.117)
│   ├── implementation/     Implementierungs-Logs
│   ├── test-reports/       Testberichte
│   ├── quality/            QS-Dokumentationen
│   ├── audits/             Audit-Berichte
│   ├── design/             Design-Dokumentationen
│   ├── c14/                C14-Kartenprojekt
│   ├── misc/               Handoffs und Verträge
│   └── validation/         Validierungsberichte
├── tools/                  Python-Tools (RUC, KNMI-EPS)
├── tests/                  Smoke-Tests
├── AGENTS.md               Bindende Regeln für KI-Agenten
├── CHANGELOG.md            Benutzerfreundlicher Changelog
├── MID_SOURCE_OF_TRUTH.md  Verbindliche Codebasis-Referenz
├── MID_BASELINE.json       Baseline-Konfiguration
└── package.json            Node.js-Konfiguration
```

## Versionsschema

- Funktionsrelease (`0.7.x` oder äquivalent `0.7.x.0`) für neue eigenständige Funktionen.
- Wartungsrelease (`0.7.x.y` mit `y ≥ 1`) für Korrekturen und inkrementelle Weiterentwicklung eines Funktionsstands.

## Lizenz

Keine Lizenz hinterlegt. Die App ist unter [midwx.app](https://www.midwx.app) öffentlich erreichbar.
