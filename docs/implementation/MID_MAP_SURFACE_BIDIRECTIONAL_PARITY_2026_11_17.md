# MID-Karten: bidirektionaler Funktions-, Quellen- und Qualitätsvertrag
**Datum:** 2026-11-17 · **Status:** Source-DRAFT, nicht veröffentlicht
**Verifizierte Ausgangsbasis:** `main = mid-stable = a78465b655d25cafc9ecc0390080694cb7aca957`, Version `0.9.85.486`, fünf aktive Rulesets.

## Verbindlicher Grundsatz
**Wetter im Umfeld und großer Kartenbereich sind zwei Ansichten eines gemeinsamen meteorologischen Systems.** Jede Änderung an einem von beiden ist zugleich ein verpflichtender Impact-Check des anderen (beide Richtungen), auch in künftigen Chats, Replit-Handoffs, Copilot-/Codex-Arbeiten und Release-Trains. Gleiches Verhalten dort, wo Wetter- und Datenfachlichkeit übereinstimmen; bewusst unterschiedliche Renderer, Kartenabdeckung und Produktangebote dort, wo nötig. `AGENTS.md` ist der Verhaltensanker, dieses Dokument sein versionierter Abnahmevertrag. Diese Regeln eröffnen keine zusätzlichen Branch-/Deployment-/App-Rechte.

## Technische Zuständigkeiten
- **Zentrale, wiederverwendbare Semantik:** Modell-/Quellenidentität, native UTC-Gültigkeitszeit, Run/INIT, Datenstand und Alter, Beobachtung/Nowcast/Modellprognose, NoData (nicht Null!), Raster-/BBOX-Identität, Quellen-/Lizenzangaben, Zeitachsen-Navigation, Selection-/Stale-/Out-of-order-Guard, Last-good-frame-Policy, transparente Fehler. Der bestehende Datenpfad `CompositeData` und vorhandene reine Timeline-/Original-Selektoren sind auszubauen, nicht parallel abweichend zu kopieren.
- **Große Karte:** Leaflet-WMS-`WMSTileLayer`, Quelloriginal-Zeitachse aus `CompositeTimeline`, Puffer-/Vorladung und Karten-Viewport. `RadarPanel`/ `UnifiedWeatherMap` koordinieren Ebenen, Prognosen, Warnungen und andere Produkte. Deren bereits implementierte Fähigkeiten sind beim Umfeld-Impact-Check ausdrücklich zu berücksichtigen.
- **Wetter im Umfeld:** MapLibre-`ImageQuadLayer`, exakte WMS-/OPERA-Viewport-Geometrie, GPU-Readiness-Barrier, 350-ms-Crossfade, kompakte 5-Minuten-Rad/Sat- und 15-Minuten-Wolken/SigWx-Steuerung. Der Zeitregler ändert die Auswahl, aber er erzeugt keine Quelloriginale. Die zuletzt angezeigte valide Zeit bleibt während Ladevorgängen als **Bildzeit** sichtbar.
- **Adaptergrenze:** Renderer-abhängige Hardware-/GPU-/Tile-Routinen werden **nicht** als identische Implementierungen erzwungen. Das gemeinsame Verhalten wird über reine Funktionen und symmetrische fachliche E2E-Proben abgesichert.

## Abnahmematrix für jeden künftigen Karten-PR / Handoff
Jeder relevante PR dokumentiert je Zeile `Umfeld`, `Kartenbereich`, `gemeinsam/renderer-spezifisch`, `Abnahme/Nachweis`, `offene Lücke/Owner`. Nicht anwendbare Produkte müssen fachlich begründet werden, nicht stillschweigend fehlen.

| Vertragsfeld | Kartenbereich – Stand auf Stable .486 | Umfeld – Stand auf Stable .486 | Verbindliche gemeinsame Zielprüfung |
| --- | --- | --- | --- |
| Rad/Sat-Zeit | Nur bestätigte Quelltermine in `buildAvailableCompositeTimeline` | 15-Minuten-Scrubber im Stable; 5-Minuten-Arbeit in #869 | 5-min-Auswahl im Umfeld; Rasterquelle behält ihre tatsächlich gelieferte 5/10/15-min-Kadenz; keine erfundenen Zwischenbilder |
| Radarbeobachtung / Nowcast | DWD-Frames, Vorladung und schon vorhandene Retention; Phasengrenz-Fix #870 in LC #868 zu prüfen | getrennte Original-Selektoren | Eingrenzung auf tatsächliche WMS-Originalzeit, Fehlerfall, NoData, Beobachtung≠Nowcast |
| Satellit RGB/IR | Original-/Snapshot-Katalog, Provider-Fallback, begrenzter Kachelpuffer | Originalauswahl/IR-Fallback im laufenden LC | Kein Zukunfts-Satellit, fehlender RGB-Frame darf echten IR-Frame nicht verstecken |
| Wolken / SigWx | DWD-/ECCC-Modelle mit Originallauf und Wettercode-Vertrag | Modellbild und 15-min-Auswahl; tatsächliche 15-min-Originale noch nicht vollständig produktiv | IR-Helligkeitstemperatur (K) ≠ CLCT (%), GSP ≠ vollständiger WMO-4677-WW; 15-min-NoData bleibt explizit |
| Rendering | Leaflet Tile-Ready und Doppelpuffer | MapLibre Source/GPU-Ready und 350-ms-Fade | Kein Weiß-/Basiskartenflash beim Scrub; nur tatsächlich renderfertige Quelle wird promoted |
| Ort / BBOX / Raster | Live-Viewport + tile/grid geometry | MapLibre viewport-bound WMS/OPERA | Kein altes Bild bei Orts-, BBOX-, Zoom- oder Layer-Scope-Wechsel; EPSG/Geometrie prüfen |
| Quelle / Zeitlabels | Zeitachse trennt ursprünglichen Quelltermin und Forecastphase | Zielzeit und Bildzeit noch zu vereinheitlichen | Angezeigter Originalzeitpunkt ≠ verlangter Cursor bei loading/fallback; kenntlich machen |
| Performance | Vorladung, stufenweise Kachelpakete, historischer Zoom-Remount-Vertrag | Source-Quad-Wechsel, GPU-Puffer | Begrenzte RAM/HTTP/GPU-Last, keine redundanten Requests bei identischem Source-Key, 320/390/430/834/Desktop |
| Bedienung | Play/Pause/Transport/Keyboard/Map-Fokus | Buttons/Slider/Touch/ARIA | WCAG 2.2 AA anstreben, Light/Dark, Reduce Motion, Ersttipper, reale WebKit- und getrennte iOS-Abnahme |

## Release-feste Definition of Done
1. **Source of Truth:** aktuelle Full-SHAs/Version/Agent- und signierte Fach-/Releaseverträge, Rechte und parallele PRs prüfen. Kein alter Draft ohne SHA-Blob-Diff importieren.
2. **Fachliche Parität:** für jede Änderung dokumentieren, ob die Gegenansicht sie benötigt; bei Ja in **beiden** nachweislich aktivieren oder den PR offen halten/als Teilkandidat markieren. Fachlich begründete Asymmetrie ausdrücklich protokollieren.
3. **Testparität:** `tests/unit/map-surface-bidirectional-parity.test.ts` sowie betroffene Quell-/Unit- und E2E-Kartenregressionen durchführen. Raster-Gaps, schnelle Mehrfachauswahl, Fehler/Timeout, abweichende BBOX, Ortswechsel, +5-min Nowcast, separate Satelliten-Originale, Day/Night, Dynamic Type und Reduced Motion abnehmen.
4. **Laufzeit-/Erlebnisbeweis:** echte Leaflet- und MapLibre-Tile/Source-Ready-Events prüfen; zwei Renderer ohne Flackern; keine stillschweigende Wiederverwendung von fremden/alten meteorologischen Frames. Netzwerk-/CPU-/Speichermessung vor Nachladen-/Cache-Umbauten. Browsertests sind keine native iOS-/VoiceOver-Zulassung.
5. **Promotion:** Leitchat integriert nur disjunkte SHA-geprüfte Änderungen. Unveränderter Schutzpfad: Source-PR-Gate → kontrollierter Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages-Gates → Stable; #740 bleibt beim Release-Spezialchat. Tests „skipped“ niemals als PASS.

## Aktuelle Arbeitsübergabe (kein Abschlussbericht)
- [#868](https://github.com/MeteoMartini/MID/pull/868) ist koordinierender LC-Kandidat für die aktuellen parallelen Kartenarbeiten. Bei Erstellung dieses Vertrags HEAD `1a14db8510fc89cf149096b15cebaca3740de456`; HEAD vor Übernahme **neu** prüfen.
- [#869](https://github.com/MeteoMartini/MID/pull/869) enthält **nur QA** zur Umfeld-5-Minuten-Steuerung und Buffer-Semantik; keine Live-Aktivierung.
- [#870](https://github.com/MeteoMartini/MID/pull/870) enthält einen **laufzeitwirksamen** Quellphasen-Guard der großen Karte; `CompositeTimeline.ts` war bei der erneuten Diff-Prüfung bereits im LC-#868-Diff enthalten. Keine Doppelaufnahme.
- Der bisherige Hauptkarten-Zoom-Code hängt Wetter-WMS-Layer beim Zoom aus und erhöht `tileRevision`; der bestehende Regressionstest `scripts/test-composite-satellite-freshness-zoom-093220.mjs` schreibt dieses Verhalten fest. Eine flackerfreie Zoom-Retention erfordert eigenen realen Browser-/GPU-/WMS-Nachweis und fachlich begründete Testmigration statt blindem Entfernen alter Guards.
- Die vollständige produktive Übernahme aller Verbesserungen in beide Ansichten ist **noch offen**. Das Einbringen dieses Vertrags allein macht sie nicht fertig.

**Primärbibliotheken:** MapLibre [ImageSource](https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/) und [render/source events](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/); Leaflet [TileLayer/GridLayer](https://leafletjs.com/reference-1.9.4.html) (`keepBuffer`, `updateWhenIdle`, `load`/`tileload`). Diese API-Dokumentation ersetzt weder Wetterquell- noch MID-Source-/Release-Nachweise.
