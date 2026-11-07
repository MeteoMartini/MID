# MID – Meteorological Information Dashboard

MID ist eine wissenschaftlich fundierte, hyperlokale Wetter-App, die professionelle meteorologische Datenquellen (DWD, ECMWF, NOAA, ERA5) mit eigener Modellfusion, Ensemble-Analyse und Konfidenzbewertung kombiniert.

**Live-Version:** [Aktueller MID-Versionsstand](https://www.midwx.app/version.json) – wird bei jeder Veröffentlichung aktualisiert.  
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

## Zusammenarbeit mit GitHub Copilot

GitHub Copilot verwendet die [repositoryweiten MID-Anweisungen](.github/copilot-instructions.md), [fach- und pfadspezifischen Regeln](.github/instructions/), [wiederverwendbare Prüf- und Übergabe-Prompts](.github/prompts/) sowie den [lesenden Audit-Agenten](.github/agents/mid-auditor.agent.md). Die [Copilot-Koordinationsregeln](docs/implementation/MID_COPILOT_COLLABORATION_2026_11_06.md) beschreiben die SHA-Prüfung, den Umgang mit parallelen Arbeiten und die Integration ohne eigene Copilot-Releaseberechtigung.

### Copilot direkt aus ChatGPT beauftragen (ohne Copy/Paste)

Für **ausdrücklich vom Nutzer beauftragte MID-Aufgaben** kann ChatGPT über die bereits verbundene GitHub-App nach Live-Prüfung von `mid-stable`/`main` (volle SHAs), Version, Verträgen, Rechten und parallelen PRs ein GitHub-Issue mit konkretem Scope, Abnahmekriterien und Ausschlüssen erstellen und es **einmalig** `copilot-swe-agent[bot]` zuweisen. GitHub erzeugt daraufhin gegebenenfalls einen **unvertrauenswürdigen Draft-PR** auf einem `copilot/*`-Branch. ChatGPT überprüft GitHub-Issue, Copilot-PR, Basis-/Head-SHA, geänderte Dateien, Tests und Ergebnis direkt über GitHub – **ohne manuelles Kopieren von Prompt, Patch oder Rückmeldung**.

Dieser Transport wurde mit [Pilot-Issue #688](https://github.com/MeteoMartini/MID/issues/688) und dem danach ohne Merge geschlossenen [Copilot-Draft #689](https://github.com/MeteoMartini/MID/pull/689) nachgewiesen. Ein gestarteter Task ist noch **keine Code- oder Releasefreigabe**. Copilot darf keine Aufgaben eigenständig ausweiten, keine neuen Tokens/Abos/Workflows einrichten und weder `main`/`mid-stable` noch `chatgpt/*`/`codex/*` verändern. Die normale unabhängige Review und der vollständige MID-Releasepfad bleiben zwingend. Die Zuweisung kann vorhandene Copilot-AI-Credits verbrauchen; bei unklaren Kosten oder Berechtigungen wird **fail-closed** abgebrochen.

Verbindliche Details: [AGENTS.md](AGENTS.md) · [Copilot-Anweisungen](.github/copilot-instructions.md) · [erprobter Issue-/Draft-Handoff](docs/implementation/MID_COPILOT_CLOUD_BRIDGE_2026_11_07.md).

Copilot-Ergebnisse aus `copilot/*` werden **nicht** direkt veröffentlicht. Unabhängige Integration, vollständige Gates und Stable-Promotion bleiben wie in `AGENTS.md` beschrieben verpflichtend.

## Zusammenarbeit mit Kilo (ohne Copy/Paste)

Für **ausdrücklich beauftragte, rein lesende** Audits kann ChatGPT künftig ein begrenztes GitHub-Issue anlegen und darin `@kilocode-bot` einmalig erwähnen. Kilo soll seine Antwort direkt im Issue dokumentieren, das ChatGPT dann unabhängig ausliest. Bei [Pilot #692](https://github.com/MeteoMartini/MID/issues/692) hat der offizielle Kilo-GitHub-Bot bereits geantwortet; **die eigentliche Aufgabenbearbeitung ist noch blockiert**, weil du zunächst in diesem Issue über „Link your Kilo account“ die persönliche GitHub↔Kilo-Verbindung herstellen musst. Den individuellen Verknüpfungslink niemals kopieren oder öffentlich weitergeben.

**Codeänderungen laufen weiterhin nicht über GitHub-Bot-Fix-Kommandos.** Die erlaubte Kilo-Codeübergabe bleibt `scripts/mid-kilo-handoff.mjs` mit einmaligem SHA-gesicherten, **ref-freien** Git-Objekt-/Issue-Transport und unabhängiger ChatGPT-Intake-Prüfung (verifizierter Vorversuch [#662](https://github.com/MeteoMartini/MID/issues/662) → [Draft #663](https://github.com/MeteoMartini/MID/pull/663)). Kilo darf keine selbstständigen MID-Branches/PRs, Releases, neuen Secrets oder kostenpflichtigen Dienste anlegen; Kilo-Credits können verbraucht werden. Alle Source-/Installer-/Worker-/Pages-/Stable-Gates bleiben verbindlich.

Vollständige Anleitung: [Kilo-GitHub-Issue-Rückkanal](docs/implementation/MID_KILO_GITHUB_ISSUE_BRIDGE_2026_11_07.md), [Kilo-Handoff-Vertrag](docs/implementation/MID_KILO_DEFAULT_HANDOFF_CONTRACT_2026_11_05.md), [AGENTS.md](AGENTS.md).

## Versionsschema

- Funktionsrelease (`0.7.x` oder äquivalent `0.7.x.0`) für neue eigenständige Funktionen.
- Wartungsrelease (`0.7.x.y` mit `y ≥ 1`) für Korrekturen und inkrementelle Weiterentwicklung eines Funktionsstands.

## Lizenz

Keine Lizenz hinterlegt. Die App ist unter [midwx.app](https://www.midwx.app) öffentlich erreichbar.
