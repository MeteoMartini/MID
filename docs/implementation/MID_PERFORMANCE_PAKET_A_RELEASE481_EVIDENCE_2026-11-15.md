# MID Design 1.0 · Paket A · Produktionsmessung .481 (2026-11-15)

**Status:** lesender QA-Nachweis / keine Code-Optimierung, keine Releasefreigabe. Zugehörig: #344, #422 und Draft-PR #815.

## Vollständige Build-Provenienz

- Verifiziert: `main=mid-stable=19a8af8f5d0c47784acde7628746fa9020ef4f62` · v0.9.85.481.
- Original-GitHub-Actions-Artefakt `mid-built-43708272043-1`, Artifact-ID `14158829042` aus erfolgreichem Installer [43708272043](https://github.com/MeteoMartini/MID/actions/runs/43708272043).
- Entpacktes `release.tar.gz`: SHA256 `344acb646e2af3be990863d8718ed7d0f677306885a0f79e9fbede2dad949ea1` = Manifestwert. Alle 4.040 Manifestdateien vorhanden und SHA256-gleich, 0 fehlend, 0 verändert.
- `dist/mid-build-identity.json`: Build-Version `0.9.85.481`, `sourceGitSha=66411b4a20d8a985afe03a1d0cc5713a31d62fbf`, `assetsSha256=cc0267423e270a0950ffdb2150dc2ce37bc9ca1415bb39e822ca4ddcf963d864`, `assetCount=142`.
- Source-SHA im veröffentlichten Build ist **nicht** mit dem späteren Stable-Promotions-SHA gleichzusetzen.

## Tatsächliche statische Produktionsmessung

`node scripts/test-startup-asset-evidence-0985482.mjs` und `node scripts/measure-startup-assets-0985482.mjs dist` gegen das SHA-geprüfte Originalartefakt ausgeführt. Der neue vollständige Fingerprint-Prüfer wurde ebenfalls lokal am gesamten Original-`dist` erfolgreich ausgeführt.

| Metrik | Befund | Aussagegrenze |
|---|---:|---|
| Initiales CSS roh | 1.755.595 B | Direkt in HTML als Stylesheet verlinkt |
| Initiales CSS gzip-9 | 249.104 B | Dateikompression, nicht Netzwerktransfer |
| Initiales CSS Brotli-6 | 212.416 B | Dateikompression, nicht Netzwerktransfer |
| Direkt referenziertes Start-JS roh | 2.277.626 B | Module + modulepreload, keine späteren dynamischen oder transitive Imports |
| Direkt referenziertes Start-JS gzip-9 | 688.085 B | Dateikompression, nicht Netzwerktransfer |
| Direkt referenzierte JS-Dateien | 5 | Dedupliziert, Offline-Präfetch nicht als Startnetzlast gezählt |

## Ergänzende Chromium-CDP-Diagnose (gehosteter Browser)

- Öffentliche URL `https://www.midwx.app/`, sichtbar v0.9.85.481, 390 CSS-px Viewport, keine persönlichen Browserdaten/Anmeldungen.
- Ohne Ort (Leerstart): FCP 168 ms **Einzelbeobachtung**, Haupt-CSS ca. 54.739 Bytes als von CDP genutzte Regelbereiche; kein horizontaler Dokumentüberlauf. Kein LCP-/INP-p75 oder kalibrierter Kaltstart.
- Testort Bonn, sichtbare Originaldaten, Wechsel nacheinander durch `Aktuell`, `Heute`, `Vorhersage`, `Karten`, `Mehr`: alle fünf Navigationen funktionierten im beobachteten Durchgang; CSS-Regeln aus dem Haupt-CSS mit kumulierter Nutzungsmarkierung ca. 416.163 Bytes. Dies ist **keine** sichere Unused-CSS-Löschliste, weil weitere Zustände, Themes, Größen, Layer, Widgets und Warnungen fehlen.
- Wetterdatenzustand in der Browserdiagnose: `midCoreDataHealth=degraded`. Browser-Nachweise dürfen daher keine vollständige Datenverfügbarkeit oder meteorologische Abnahme behaupten.
- CDP `Performance.getMetrics` meldete **vor** kontrollierter GC und mit aktiver Instrumentierung einen ungewöhnlich hohen JS-Heap (ca. 1,14 GB nach Aktuell, ca. 1,35 GB nach Karten). Ursache nicht nachgewiesen; weder Leak noch App-RAM als bestätigte Diagnose ausgeben. Die spätere Browser-Session war nicht mehr erreichbar; ein zweiter externer GC-Durchgang wurde wegen erschöpftem vorhandenem Dienstkontingent nicht ausgeführt. **Status: memory anomaly / UNVERIFIED AFTER GC.**
- Keine echten WKWebView-/iOS-/VoiceOver-Messungen; keine instrumentierte repräsentative Kalt-/Warmcache-Serie. Lokale Chromium-Ausführung per localhost und file-URL wurde in dieser Umgebung ausdrücklich administrativ blockiert, sodass deren angezeigte Browserfehler **keine MID-App-Daten** sind.

## Paket B · konservative CSS-Modulprüfung (Quellmessung, keine Migration)

Das neue read-only Skript `node scripts/audit-css-move-candidates-0985482.mjs` überprüfte alle **69** kanonischen Eager-CSS-Quellen gegen spätere Regeln auf identische Selektoren mit denselben CSS-Eigenschaften. Es ist eine konservative **Untergrenze** möglicher Kaskadenkonflikte, keine Positivfreigabe.

| Kandidat | Quellbytes | Direkte spätere Selektor-/Eigenschaftskollisionen | Ergebnis |
|---|---:|---:|---|
| `styles-src/25-extreme-outlook.css` | 24.083 | 29 | Nicht blind auslagern |
| `midC14MapWorkspace.css` | 24.906 | 47 | Nicht blind auslagern |
| `midC18MountainResponsiveFix.css` | 2.535 | 0 | Nur Kandidat, noch kein Browser-/Ownerbeweis |
| `midC18FourteenReplitFluidGrid.css` | 12.828 | 0 | Nur Kandidat, möglicher Eager-ForecastCockpit-Verbrauch offen |

Die großen Einstiegspakete enthalten historisch überlagerte, teils komponentenübergreifende Regeln. Ein Nullwert in dieser **engen** statischen Prüfung beweist keine visuelle oder responsive Parität nach dynamischem Nachladen. Insbesondere gilt `test-module-css-consolidation-0985170.mjs` mit fixierter historischer Kaskade, und jeder tatsächliche Eingriff benötigt einen separat nachgewiesenen CSS-Load-Order-Vertrag plus Browsermatrix. Bis dahin bleiben die 69 Dateien und die generierte `midPresentation.css` unverändert.

## Risiko- und QA-Entscheidung

**Paket A teilweise verifiziert:** Immutable Assetprovenienz und statisches initiales CSS/JS sind gemessen. Vollständige Browsermatrix, echter Netztransfer, GC-/GPU-/WKWebView-Speicher und Wiederholbarkeit bleiben offen.

**Paket B ist für einen breiten CSS-Umzug NO-GO**, solange Kaskadenparität und eine zweite unabhängige Post-GC-Speichermessung fehlen. Insbesondere `src/styles-src/25-extreme-outlook.css` war in #651 durch spätere Selektorüberschreibungen als nicht blind verschiebbar belegt. Vorhandene Lazy-Auslagerungen (Pollen, Karten etc.) nicht duplizieren.

**Paket C nur auf korrektes Messen aufbauen:** Keine Schwellenwerte aufgrund dieses Einzelprofils erfinden, keine Freigabechecks abschwächen. Das in diesem Draft ergänzte Hash-Prüfwerkzeug verhindert, dass ein beschädigtes Dist-Verzeichnis als gemessener Stable-Build ausgegeben wird.

Keine Änderung an Feature-Code, Design, Weather-Logik, Worker, Cache-Eigentum, Release-Workflows oder Versionsspiegeln. Dieser Bericht ist kein neues 0.9.85.482-Produktionsrelease.
