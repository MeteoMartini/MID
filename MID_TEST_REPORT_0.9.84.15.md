# MID v0.9.84.15 – Testbericht

## Auditumfang

Geprüft wurden insbesondere App-Start, Service-Worker-Update und Rollback, Forecast-Recovery, Foreground-/Background-Netzwerkkoordination, Offline-/Cache-Fallbacks, Gerätesynchronisation, Wetterzwilling-Startarbeit, Radar-/Rasterabrufe, private Sensoren, Lüftungsassistent, Niederschlagsintervall- und Skybarlogik, lokale Importintegrität, Versions-/Baseline-/Lineage-Verträge sowie Worker-Semantik.

## Ergebnis der lokal ausführbaren Regressionen

- Aus dem **entpackten finalen Professional-Transport** wurden alle **730** vorhandenen `scripts/test-*.mjs` tatsächlich gestartet: **623 bestanden**, **107 wurden ausschließlich durch die absichtlich nicht mittransportierte bzw. lokal nicht installierbare Projekt-Toolchain blockiert**; es blieb kein nachgewiesener fachlicher oder funktionaler Regressionsfehler übrig.
- Die 107 Toolchain-Blocker teilen sich auf in 92 fehlende `typescript-strada`-Aufrufe, 12 vom lokal verfügbaren TypeScript 5.8.3 nicht verstandene `--ignoreConfig`-Aufrufe, 2 weitere fehlende Projektmodule und 1 direkten `tsc`-Start mit `ENOENT`, weil `node_modules/.bin/tsc` im Transport bewusst nicht enthalten ist. Diese Prüfungen werden ausdrücklich **nicht** als bestanden gewertet.
- Zusätzlich wurde der konservativ vorab als dependency-light eingestufte Satz im Arbeitsstand nochmals separat ausgeführt: **605/605 bestanden**.
- Die vollständige kanonische TypeScript-7-/Vite-Produktion darf in dieser Umgebung daher nicht als erfolgreich behauptet werden.
- Ein frischer `npm ci` wurde zusätzlich offline und online versucht: offline fehlte mindestens `yauzl` im lokalen NPM-Cache; online war der Registry-Zugriff in der Arbeitsumgebung mit DNS/Transportfehlern (`EAI_AGAIN`) nicht verfügbar. Der fehlende Produktionsbuild ist damit als Umgebungsgrenze dokumentiert, nicht als bestandene Prüfung.

## Gezielt abgesichert

- kontrolliertes Service-Worker-Waiting ohne install-time `skipWaiting()`
- versionsreine aktive App-Shell: vorhandene Cache-`index.html` gewinnt bis zum kontrollierten Controllerwechsel gegen einen bereits neueren Server-HTML-Stand
- atomarer Wechsel von aktivem Cache und Controller erst im `activate`-Schritt
- 20-s-Datenpfad-Healthcheck nach Update mit gezieltem Rollback ausschließlich bei pending Update; Offline allein gilt nicht als positiver Healthcheck
- endliche Start-, Best-Match-, Worker-, Update-, externe Beobachtungs-/Geocoding- und Rasterzeitbudgets
- Freigabe des Foreground-Netzwerkgates nach Erfolg oder terminalem Fehler
- keine Freigabe eines neueren Requests durch einen alten Abortlauf
- verzögerte große Wetterzwilling-/Archivarbeit nach erstem sichtbaren Render
- entdoppelte Service-Worker-Updateprüfungen und kanonische Cache-Schlüssel für cache-gebusterte Versions-/Manifestabrufe
- begrenzter HY-ME-C/NG-Rastercache
- endliche DWD-HX-Downloads sowie zentrale 30-s-Netzwerkgrenze je Open-Meteo-Fetchversuch
- begrenzte Event-Flugwetter-, Saison- und Terrain-Morphologie-Memorycaches
- geteilte historische Reise-Klimaanfragen können nicht dauerhaft im In-Flight-Cache hängen
- Abort-Weitergabe bei Radar-/Sensorpfaden
- intervallbewusste DWD-Niederschlagsintensität einschließlich Schauer und Schnee
- Skybar-Wolkenpriorität und sonnige Schauerüberlagerung
- `rainRate` eines generischen Standardsensors bleibt eine Rate und wird nicht als Intervallmenge fehlinterpretiert
- vollständige relative Importziele in 160 TypeScript-Dateien
- Syntaxprüfung der beiden Service Worker sowie der Worker-JavaScriptdateien
- Versions-, Baseline-, Release-Lineage- und Uploadbudgetverträge

## Worker-Semantik

Vergleich gegen die unveränderte v0.9.84.14-Basis nach Normalisierung der Versionskennung:

- `worker-src/00-core-observations.js`: semantisch unverändert
- `worker.js`: semantisch unverändert
- `worker/metar-proxy.js`: semantisch unverändert

Daher ist für v0.9.84.15 kein funktionaler Cloudflare-Worker-Upload erforderlich.

## iOS-Hinweis

Versionsmetadaten sind auf v0.9.84.15 synchronisiert (`MARKETING_VERSION 0.9.84`, Build 16). Ein echter macOS-/Xcode-/Capacitor-Sync wurde in dieser Linux-Arbeitsumgebung nicht ausgeführt und wird nicht als durchgeführt ausgewiesen.
