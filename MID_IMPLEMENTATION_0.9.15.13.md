# MID v0.9.15.13 – Buildfix und ganzzahlige Prozentdarstellung

## Ausgangsbasis

Lokale, zuletzt konsistente MID-Codebasis v0.9.15.12. Der GitHub-Connector war bei dieser Korrektur nicht verfügbar; ein erneuter Remote-Abgleich mit `mid-stable` und ein Pull Request waren daher nicht möglich.

## 1. TypeScript-Buildfix

`src/forecastFusion.ts` verwendet `RadarNowcastInterval` in `parseInterval`, importierte den Typ jedoch nicht aus `weather.ts`. Dadurch brach der Produktionsbuild mit TS2304 ab.

Korrektur:

```ts
import type {
  Day,
  Hour,
  RadarNowcast,
  RadarNowcastFrame,
  RadarNowcastInterval,
  ThunderstormNowcast
} from './weather';
```

Die betroffene Modulkette wurde anschließend mit TypeScript 5.8.3 einschließlich lokaler Vite-/jsfive-Deklarationen erfolgreich typgeprüft.

## 2. Ganzzahlige Prozentwerte

Die UI rundet Prozentwerte nun unmittelbar bei der Darstellung. Interne Wahrscheinlichkeiten, Gewichtungen und Scores bleiben unverändert als Fließkommazahlen erhalten.

Nachgeschärft wurden insbesondere:

- maximales Niederschlagsrisiko im Kurzfrist-Cockpit,
- Gewitterrisiko in der Tagesdetailansicht,
- Ensemble-Konsistenz und Schwellenwerte,
- Wetterzwilling-/Modellgüteverbesserungen,
- Radar-/Satellit-/Blitz-/Warn-/Modell-Deckkraft,
- Synoptik-Anteile und Ähnlichkeitswerte,
- Kalibrierungsklassen und Diagrammachse der Regenwahrscheinlichkeit.

## 3. Regression

- 293 automatisch erkannte MID-Regressionstests bestanden.
- Neuer Test `scripts/test-build-percent-integers-091513.mjs` schützt Type-Import und Ganzzahlformatierung.
- Zwei ältere Gewitter-Detailtests wurden auf die ausdrücklich gerundete Anzeige aktualisiert.
- 78 TS-/TSX-Quelldateien parsergeprüft.
- Cloudflare-Worker und beide PWA-Service-Worker syntaktisch geprüft.
- Gezielte TypeScript-Typprüfung von `forecastFusion.ts` erfolgreich.

## Buildumgebung

Ein vollständiges lokales `npm ci`/Vite-Build war nicht möglich, weil der isolierte Paketspiegel die Tarballs `yallist-3.1.1.tgz` und anschließend `vite-6.4.3.tgz` mit HTTP 404 zurückgab. Der vom Nutzer gemeldete TS2304-Fehler wurde unabhängig davon durch eine gezielte TypeScript-Typprüfung reproduzierbar beseitigt.

## Worker

Keine funktionale Workeränderung. Der Worker ist lediglich auf v0.9.15.13 versionssynchronisiert.
