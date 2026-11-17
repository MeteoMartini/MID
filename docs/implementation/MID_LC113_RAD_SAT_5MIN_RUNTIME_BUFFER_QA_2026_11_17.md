# MID LC 1.13 · 5-Minuten-Radar/Sat im Umfeldwetter mit Original-GPU-Puffer

**17.11.2026 · QA-DRAFT · NO READY / NO MERGE / NO RELEASE**

Geprüfte veröffentlichte Source of Truth: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` / v0.9.85.486, fünf aktive Rulesets. Basis Sammel-Draft #868 HEAD `1a14db8510fc89cf149096b15cebaca3740de456`; die QA von #869 und der phasenreine produktive Kartenfix #870 waren vorab blobidentisch im LC-Draft enthalten und werden nicht dupliziert. Kein Eingriff in die #740/#839-Spezialarbeit.

## Gezielter produktiver Scope

- `src/surroundingsRadarTimeline.ts`: Auswahl in wirklichen UTC-5-Minuten-Schritten (−45 bis +120 min); die tatsächlichen DWD-Radar-/RV-Originale werden ohne Umstempeln aus dem Quellkatalog gewählt. Die Jetzt-Kachel akzeptiert ein bestätigtes höchstens 10 Minuten altes Beobachtungsbild; die weiteren Zeitschritte erfordern ein originales Bild im ±2,5-Minuten-Umfeld der Auswahl. Beobachtung und Nowcast werden getrennt behandelt. Kein Zielzeit-Scheindatenprodukt.
- `src/surroundingsSatelliteOriginal.ts`: verifizierte DWD-/EUMETSAT-RGB-/IR-Bilder behalten die echte Originalzeit auch dann, wenn der 5-Minuten-Radarregler mehrfach auf ein natives 10-/15-Minuten-Bild zeigt. Höchstens 15 Minuten altes, niemals später als das Ziel gültiges Original; keine Satellitenprognose.
- `src/CurrentSurroundings.tsx`: Radar/Sat erhält 5-Minuten-Slider, zugängliche Beschriftung und exakt getrennte Wolken/SigWx-15-Minuten-Timeline. Bei benachbarten Originalterminen bleibt derselbe `ImageQuadLayer` gemountet. Der bereits GPU-präsentierte DWD-Stand darf beim Wechsel **nur** für dieselbe WMS-Quelle, BBOX, Auflösung und Beobachtung-/Nowcast-Phase maximal 15 Minuten übergangsweise stehen bleiben. Nach dem existierenden 350-ms-MapLibre-Crossfade setzt `onReady` den tatsächlichen präsentierten Originalzeitpunkt. Davor bleibt der vorige Originalzeitpunkt sichtbar; keine Zeit-/Phasenumetikettierung. Auch RGB/IR kann einen nachweislich alten, gleichgeografischen GPU-präsentierten Originalstand als Zwischenbild zeigen, nicht als aktuellen Zielzeitpunkt.
- `tests/unit/surroundings-15min-original-mode-qa.test.ts`: bislang ausschließlich Radar/Sat betreffender 15-Minuten-Vertrag absichtlich durch den nun autorisierten 5-Minuten-Vertrag ersetzt. Cloud/SigWx-15min und OPERA-Grenzfälle erhalten. UTC/DST, reale Zielzeit, fehlende Originale, Scope/BBOX/Layer, falsche Radarphase und NoData als negative Testfälle.

**Nicht geändert:** produktive RUC-/Worker-/WMS-Backend-Quellen, amtliche Warnungen, Weather-Code-/Modelle-/Lizenzsemantik, CSS, Versionsspiegel und CI-/Release-Governance. Kein neuer kostenpflichtiger Abruf, keine zusätzliche Autoplay-Last.

## Fehlende unabhängige Abnahmen

Bis zum realen SHA-gebundenen Testnachweis bleiben WebGL-Pixel/CORS/Load-Error, MapLibre-GPU-Readiness auf einem echten Browser, schnelles Scrubbing, Karten/BBOX-/Standortwechsel, jetzt→Nowcast und fehlerhafte Originalbilder **nicht unabhängig verifiziert**. Browsermatrix 320/390/430/834/1024/1440 Light/Dark, Tablet hoch/quer, WebKit/iOS/VoiceOver und 200%-Zoom stehen aus. Keine falsche vollständig flackerfreie Live-Behauptung. Source/Core/Heavy/Review/ZIP/Installer/Worker/Pages/Stable dürfen nicht übersprungen werden.

Amtliche Quellen: https://www.dwd.de/DE/leistungen/radolan/produktuebersicht/radolan_produktuebersicht_pdf.pdf und https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/ .

## CI-Triage zum ersten Integrations-HEAD `448598d81505d1d2ddc1f9615537198b1121d8be`

[Draft-CI #44037345399](https://github.com/MeteoMartini/MID/actions/runs/44037345399) hat **FAILURE** (nicht grün): Vitest meldete 5 Assertions in 4 betroffenen Dateien; realer Chromium-Matrix-Preflight stoppte korrekt am nun veralteten Browser-Locator »Radar und Satellit 15 Minuten zurück«. Keine dieser failures wird als Erfolg ausgegeben oder mit Testausschluss behandelt.

Präzise Folgeklarstellung: Der neue tatsächliche Nowcast im Testkatalog ist um 12:10 UTC statt vormals 12:22 UTC gültig; die Negativgrenze der maximal 15-minütigen Überbrückung muss tatsächlich *außerhalb* 15 Minuten liegen. Ein echtes 9 Minuten altes IR-Original bleibt bei einem 5-Minuten-Auswahlziel zulässig und erhält seine **echte IR-Quellzeit**; erst ein über 15 Minuten altes Original muss wieder NoData ergeben. Die alten statischen Spektralassertions werden auf das jetzt tatsächlich GPU-präsentierte `retainedSatellite`-Bild (nicht das noch ladende `satelliteOriginal`) und dessen Originalzeit aktualisiert; OPERA-Abdeckung und RGB/IR-Provenienz bleiben ausdrücklich bindend.

Zusätzlich bindet `selectRetainedSurroundingsRadarFrame` jetzt bei jeder URL **beide echten WMS-time-Parameter** exakt an `loaded.time` und `requested.time`; unterschiedliche, doppelte oder fehlende Parameter blockieren. MapLibre-GPU-Ladefehler markieren die neue Quelle als fehlgeschlagen und lassen allenfalls den belegten bisherigen Originalstand sichtbar. Die Radar-Zeitbeschriftung verwendet die tatsächlich vergangene/verbleibende Zeit zum auf fünf Minuten gerundeten UTC-Ziel und nicht bloß `step×5` als behauptete Wandzeit.

Die echte Chromium-Umfeldprüfung wird unter Erhaltung ihrer 44px-Touchziel-, Vollviewport-GPU-Pixel-, NoData-, Kartenöffnungs- und Light/Dark-Matrix auf fünfminütige Regler umgestellt. Die neue Quellenfixture bietet einen echten RV-Nowcast bei `lastUtc5min+10min` und **absichtlich keinen** bei `+5min`: der Browser muss die Zwischenlücke sichtbar als NoData behandeln, danach den wahren Original-Nowcast rendern und als Quellenzeit an »Karte öffnen« übergeben. Cloud/SigWx-15min-Prüfungen und echte Original-Referenz bleiben unverändert.

**Nur erneute CI auf dem nachfolgenden exakten Integrations-SHA** kann diese Korrekturen qualifizieren; keine Source-/Heavy-/iOS-/Releasefreigabe aus einem ursprünglichen Fehlversuch.

## LC 1.13 · bidirektionale Kartenparität aus #871 (nur Source-QA, kein Release)

Eindeutige, aktuelle Prüfgrundlage bei Integration: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` / v0.9.85.486; fünf aktive Rulesets, Leitchat-Sammel-PR #868 Draft HEAD `86ebb4f1e9a9b4bac68dc5d7049054c8700ffb2d`, fachlicher Karten-Spezial-PR #871 Draft HEAD `6467f415de11fdab6c2834a9c38434e5ea625962` (vier ahead / null behind Stable). Die drei #871-Pfade sind gegenüber den 136 #868-Pfaden disjunkt; neue Governance-Anweisungen erweitern nur die Kartenparität, ohne bestehende Rechte, Warn-/Daten-/Release-Verträge oder Regeln aufzuweichen.

**Original-Git-Blobs mit SHA**:
- `AGENTS.md` → `9475b984e4f76ec943f53520f7ab0af08e8cc5be`: nur sieben zusätzlich eingefügte Zeilen; davor/danach unveränderte Stable-Agent-Regeln.
- `docs/implementation/MID_MAP_SURFACE_BIDIRECTIONAL_PARITY_2026_11_17.md` → `caa6a35b70dc1fc36c8729420c4f548efcd81477`: vollständiger unveränderter neunfacher Cross-Surface-Impact-Vertrag, Renderer-Sonderfälle, Tests und DoD.
- `tests/unit/map-surface-bidirectional-parity.test.ts`: original `3ac8cc65f51d4aa743117f41553d9ed5bbf1f52b`; **einziger bewusster fachlicher Test-Rebase gegen den realen LC-5min-Stand**: Radar-/Nowcast-Beispielliste `2026-11-17T06:15Z`, `06:30Z`; der Originaltest behauptete fälschlich `radarOriginalForStep(catalog,06:17Z,1)` ergebe `06:30Z`. Tatsächlich fordert die bestehende 5-min-Logik bei Schritt 1 **06:20Z** an; es existiert kein Original, daher **NoData**. Erst Schritt 3 fordert `06:30Z`, das belegte echte RV-Original. Der Test prüft jetzt ausdrücklich beide Aussagen. Alle übrigen vier Testgruppen und die unveränderten Qualitäts-/Renderer-/Quellassertions bleiben unangetastet.

Der Original-Spezial-HEAD hatte Draft Vitest/V8 sowie gezielte Regressionen `completed/success`; **keine** Schlussfolgerung für den jetzt kombinierten LC-HEAD ohne eigene erneute GitHub-CI. Vollständiges Source/Core/Heavy/Browser/Review/ZIP/Installer/Worker/Pages/Stable-Gate bleibt gesondert offen. Release-Sicherheit #740/#839 bleibt beim Spezialchat; kein Ready, Merge, Release oder Deployment. #871 wird nicht verändert oder geschlossen, sondern dient als gesicherter Herkunftsnachweis.
