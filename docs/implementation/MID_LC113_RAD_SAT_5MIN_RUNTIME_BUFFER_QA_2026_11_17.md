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
