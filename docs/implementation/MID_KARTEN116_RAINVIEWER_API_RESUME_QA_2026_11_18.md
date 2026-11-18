# MID Karten 1.16 · RainViewer-Fallback: API-Semantik und Foreground-Resume

**QA-DRAFT / NO READY / NO MERGE / NO RELEASE.** Ausgangsbasis `main=mid-stable=3f9c5e24dc55fa5154732a1ba73961ba76c29788`, MID `v0.9.85.491` (18.11.2026); alle drei Versionsspiegel synchron, fünf aktive Branch-Rulesets. `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md` und `contracts/index.json` vor der Änderung gelesen. Der separate Source-Train [#924](https://github.com/MeteoMartini/MID/pull/924) für `.492` verändert keine dieser drei Produkt-/Testdateien. Der ältere Karten-Draft [#868](https://github.com/MeteoMartini/MID/pull/868) berührt `RadarPanel.tsx`; vor einer späteren Integration nur selektiv und SHA-verifiziert übernehmen.

## Originalquelle und konkreter Befund

Offizielles [RainViewer API Transition Summary](https://www.rainviewer.com/api/transition-faq.html): Seit **01.01.2026** liefert die kostenlose öffentliche Weather Maps API **keine Radar-Nowcast-Zukunftsframes** mehr. Verfügbar bleiben historische Radarkacheln über etwa 2 h in 10-min-Schritten; maximal Zoom 7; die Anbieterübersicht nennt 100 Requests/IP/min. Die [RainViewer-API-Bedingungen](https://www.rainviewer.com/api.html) beschränken die freie Nutzung auf private, Bildungs- und kleinere Community-Projekte. Kommerzielle/hochvolumige Nutzung und konkrete Weitergabe müssen getrennt rechtlich geprüft werden; dieser QA-Draft ist **keine** Nutzungsrechtsfreigabe.

Der bisherige veröffentlichte `RadarPanel.tsx` übernahm optional `radar.nowcast` als `future:true`, obwohl diese öffentliche Quelle nicht mehr zur Verfügung steht. Ein Fünf-Minuten-Intervall lief auch im Hintergrund weiter (Fetch intern unterdrückt), und beim Resume fehlte ein ereignisgesteuerter Frischeabruf. Dies sind statisch verifizierte Codepfade, **kein Nachweis**, dass in der Produktion tatsächlich unbelegte Zukunftsframes angezeigt wurden.

## Drei eng begrenzte Änderungen

1. `src/rainViewerFallbackLifecycle.ts`: deterministischer Controller mit höchstens einem ausstehenden Metadatenabruf und einem Foreground-Timer; 300-s-Regelintervall, Resume-Frischeprüfung frühestens nach 120 s, Abort/Generation gegen stale Antworten, keine Background-Timer. Rein meteorologische Felder und Quellenwerte werden nicht berechnet.
2. `src/RadarPanel.tsx`: nur die RainViewer-Fallback-Effect-Schleife gegen den Controller ausgetauscht; `visibilitychange` und `pageshow`; `rainViewerPastObservations` nimmt ausschließlich originale, valide historische Zeitpunkte an. Kein künstliches 5-/10-min-Raster, kein RainViewer-Nowcast, NoData bleibt NoData. DWD-/OPERA-Nowcast, Niederschlagsphase, amtliche Warnungen, WebGL-Renderer und Modellkarten unberührt. Bei Fehler bleibt die alte, originalzeitlich belegte Beobachtung bis zum vorhandenen `hasFreshRadarObservation`-Gate erhalten.
3. `tests/unit/rainviewer-fallback-lifecycle.test.ts`: source-semantische, zeitgesteuerte und React-Wiring-Regressionen.

## QA und harte Grenzen

Unabhängige lokale Ausführung auf Node 22.16.0: **17/17** isolierte Node-Tests erfolgreich; `tsc 5.8.3 --strict --noEmit` des reinen Controllers erfolgreich. Diese lokale Prüfung beweist **nicht** das vollständige MID-TypeScript-/Vitest-/Browser-/Originalanbieter-/Worker-/iOS-/Release-Gate. GitHub-CI-Status ausschließlich am tatsächlichen PR-HEAD nachlesen.

**P1 bleibt** [#853](https://github.com/MeteoMartini/MID/issues/853) für echte BBOX/CRS-Innenpixel und DWD/EUMETSAT/OPERA-Quellabdeckung; Alpha-Transparenz ist kein meteorologischer Coverage-Nachweis. Die RainViewer-Rechteprüfung ist ebenfalls P1, aber nicht durch ein UI-Feature lösbar. Dieser PR ist ein **P2-Quellzeit-/Lifecycle-Kandidat** für den Leit-Work-Intake. Vor jeder Integration: `.492`-Stable-Drift, #868-Overlap, echte RainViewer-Metadaten, Hidden 2/15 min, 20× Resume, Browser-/DPR-/Viewportmatrix, Netzwerk-/Timer-Zählung und volle MID-Release-Gates. Keine neue kostenpflichtige API, keine Schutzregelnänderung, keine direkte `main`/`mid-stable`-Änderung.

**Release:** Erst nach erfolgreicher unabhängiger Abnahme Versionsspiegel/Changelog auf die dann tatsächlich nächste `v0.x.y.z` synchronisieren und den regulären Source-PR → SHA-Bot-Merge → ZIP → Installer → Worker/Pages → Stable-Promotion-Pfad nutzen.

### CI-Triage (SHA-gebunden)

Erster GitHub-Draft-Vitest-Lauf `44304454936` am HEAD `c5acf3c46d23c2c6656f4a8e2a87549553bd0b37`: **1 FAIL / 438 PASS / 3 SKIP**, weil die ältere Alpen-Regressionsdatei ausschließlich den **entfernten Implementierungsstring** `setRainViewerFrames([...(data.radar?.past??[])` erwartete. Die fachliche Erwartung (separate, aktuelle RainViewer-Beobachtungen) bleibt erhalten und wurde durch echte Frame-Proben sowie Wiring-/Nowcast-Negativasserts **verschärft**, nicht abgeschaltet. Nachfolgende HEADs müssen erneut vollständig in GitHub CI geprüft werden. Ein erfolgreiches lokales Testergebnis ist kein grünes MID-Gate.
