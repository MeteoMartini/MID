# MID-C24 · Skybar-Kontinuität und konkrete Audit-Abnahme (.215)

Basis: verifiziertes main=mid-stable a4e0031df84d46614b7fc5889f92577236d01680, v0.9.85.214, Installer 37884832275 erfolgreich. Bestehende Paralleländerungen .207–.214 bleiben vollständig erhalten.

## Skybar-Ursache und Korrektur

Der Datengenerator behält Tooltip-abhängig getrennte Segmente. Im 7-Tage-Plot ist eine Stunde nur rund 3,86 SVG-Einheiten breit; der bisherige Renderer rundet schmale Einzelintervalle trotz angrenzender gleicher Dicke separat. Unterschiedliche Prozent-/Tooltiptexte erzeugen dadurch sichtbare Stundennähte auch innerhalb derselben vierstufigen Klasse.

Der gemeinsame SVG-Renderer bildet nun ohne Sortierung unmittelbar benachbarte visuell identische Läufe: Layer, Farbe, Deckkraft, Dicke, Stufe und Mittellinie müssen identisch sein, Grenzen müssen numerisch unmittelbar aneinanderliegen. Jeder Lauf erhält eine einzige gemalte Fläche. Alle Originalintervalle behalten transparente Beschreibungsflächen und ihre unveränderten Titel. Datenwerte, WMO/DWD-Schwellen, Wolken-/Sonnenprovenienz, Niederschlags-Overlay-Reihenfolge und Zeitkoordinaten bleiben erhalten. Echte Lücken und Zustandswechsel werden nicht aufgefüllt. Der explizite Quadratmodus behält seine Einzelstunden.

Gemeinsame Verbraucher: 90 min, Aktuell 12 h, Profil 24 h, Tageskarten, 7-Tage-Kurve, 14-Tage-Zeilen, Widget-Kurve sowie darauf basierende URL-/PNG-Exporte. Keine Parallelrenderer eingeführt. Neue positive/negative Regression prüft Originaltitel, unveränderte Inputs, 168-Stunden-Geometrie, Unterpixelintervalle, alle Darstellungsmerkmale, echte Lücken und SVG-Paint-Reihenfolge. Die bestehende Schauer-Regression wird nur bezüglich des neuen linearen Run-Wirings aktualisiert; ihr fachlicher Reihenfolgevertrag bleibt bestehen.

## Konkrete offene Punkte aus den acht Auditschritten

| Schritt | Bereits belegt | Noch abzunehmen |
|---|---|---|
| 1 · Schutz/Identität | Aktive Production-/Stable-/Agent-/Replit-Rulesets; .207 Web-Asset-/Versions-/Source-Provenienz-Identität; synchronisierte Capacitor-Webassets | Echte macOS-/native Build-Abnahme mit derselben geprüften Web-Identität. PDF-SEC-001 war durch bestehende Rulesets widerlegt. Keine erneute Schutzkonfiguration nötig. |
| 2 · Meteorologische Gates | .208 physikalische und Cross-Field-Grenzen, Akkumulationssprünge; .209 GRIB2-Zentrum/Lauf/Gültigkeitszeiten und Signaturinvarianz; .213 authentische Bitmap-Maskierung | Archivierte echte Parameter-/Level-/shortName-Matrix mit festen produktspezifischen Verträgen; differenzierte Missing-Data-Quoten; numerische Cross-Model-/Einheiten-/Reprojektionsprüfungen; Raster-/Tile-Nahtregressionen. |
| 3 · Performance-Baseline | .210 synthetische Chromium-Laufzeitbaseline; .214 isolierte 20 Modell-Rundwechsel, GC-Heap-/DOM-/Listener-Proben und optionaler Trace | Wiederholbare Profile des Produktionsbuilds auf Browser-/iPhone-/iPad-Hardware; CWV/LCP/INP/Long-Task-/Scrubbing-Frame-Messungen; kalibrierte absolute/relative Budgets und dauerhafte Vergleichshistorie. Die Vite-/Software-Rendering-Fixture belegt keine realen Nutzer-FPS oder Leakfreiheit. |
| 4 · Map/Timeline | Bestehende Abbruch-/Race-Guards und begrenzter Feldcache; vollständige funktionale Kartenmatrix; .215 kontinuierliche Skybar | Gemessene Produktions-Hotspots lokalisieren und nur danach gezielte Render-/Worker-/Cache-/Priorisierungsoptimierung mit Vorher/Nachher-Abnahme. Keine pauschale Memoisierung oder Cache-Vergrößerung. |
| 5 · A11y/mobile Ergonomie | Responsive Gates und einzelne Verbesserungen .211/.212/.215 | Durchgängige axe-/Tastatur-/Fokusprüfung, echte VoiceOver-Abnahme, gleichwertige textuelle Kartenpunktinformation, Touch-Ziele und Dialog-/Overlay-Prüfung in Portrait/Landscape. |
| 6 · iOS/WKWebView | Gemeinsamer Fachkern, Capacitor-Shell- und Web-Lifecycle-Regressionsprüfungen | Echter macOS-Simulator-Build, Cold Start, Background/Resume, Offline, Rotation und WKWebView/Instruments-Profil. Linux-Webchecks ersetzen diese Abnahme nicht. |
| 7 · Observability/SLO | Same-Origin-/RUC-Health und vorhandener guarded Catch-up-Watchdog | Frische RUC-Publikation plus tatsächliche kanonische Prognoseübernahme; Daten-/App-Release-Kopplung weiter absichern; deterministisches Widget-render-ready und Erstfehler-Screenshot/Trace; gemeinsame Build-/Daten-/Render-IDs, Diagnoseoberfläche, Freshness-/Fehler-SLOs, langfristige Performanceaggregate und erneute Token-Scope-Inventur. |
| 8 · Größere visuelle Refactorings | Bewusst nachgelagert | Erst nach vorherigen Abnahmen; kein Funktionsabbau. Konkrete Fehlerkorrekturen wie .215 werden davon nicht blockiert. |

## RUC-Stand beim Entwicklungsbeginn

.213-RUC-Lauf 37884184896: echte vollständige DWD-Aufbereitung und Pages-Free-Prüfung erfolgreich, Veröffentlichung wegen Stable-Wechsel korrekt als No-op übersprungen. Neuer .214-Lauf 37885767934 über vorhandenen Watchdog gestartet. Decoder erfolgreich; Profilprüfung läuft. Issue #305 bleibt bis frischem öffentlichem vollständigem Lauf, Worker ready/fresh/schemaValid und erfolgreicher tatsächlicher RUC-/EPS-Übernahme in Niederkassel offen. Ein Workflow-Erfolg allein reicht nicht.

## Produktiver RUC-Nachweis · 2026-10-09 05:14 UTC

Lauf 37885767934 vollständig erfolgreich einschließlich echtem Pages-Deployment und Worker-Freshness-Abnahme. Veröffentlicht: DWD 2026-10-09T04:00, 542040 Gitterpunkte, 15 Zeiten, 20 EPS-Mitglieder. Unabhängig öffentlich geprüft: ready/fresh/schemaValid=true. Niederkassel forecast-fusion mit refresh=1: active=true; icon_d2_ruc und icon_d2_ruc_eps jeweils successful=true, usedInCanonical=true und usedHours=14; diagnostics rucAppliedHours=14, rucEpsAppliedHours=14 und rucEpsMemberCount=20. Issue #305 damit nach echtem Produktivnachweis geschlossen. Native EPS-Member bleiben im bestehenden Pages-Free-Profil vertragsgemäß als separate Objekte ausgelassen; die kanonische Prognose verwendet die aus allen Mitgliedern berechnete EPS-Summary. Fortlaufende Überwachung bleibt aktiv.

## Lokale .215-Abnahme

Produktionsbuild/Types erfolgreich. Reproduzierbares npm ci und Produktions-Dependency-Audit ohne HIGH/CRITICAL. Neue geometrische und SVG-Paint-Regression erfolgreich. Echte 7-Tage-Komponente: 24 Viewport-/Theme-/Design-Fälle mit einer durchgehenden Cloud-Fläche und 168 Originaltiteln. App/Widget: weitere 24 Fälle, gleiche Unsicherheits-/Nacht-Geometrie, unverfälschte Missing-Data-Grenze, tatsächlicher PNG-Export erfolgreich und visuell geprüft. Keine Geräte-/WKWebView-Abnahme behauptet.

Kontrollbeobachtung: Der ältere manuelle verify-skybar-thickness-browser-0985159.mjs scheitert bereits unverändert auf .214 an einer veralteten Annahme über identische native 15-min- und interpolierte 24-h-Testzustände. Er wurde nicht abgeschwächt oder im Produkt nachgebildet. Die neuen Browserfixtures prüfen die echte Kontinuität im aktuellen gemeinsamen Renderer. Der Widget-Fixture-Resolver benennt den vorhandenen Groß-/Kleinschreibungsfall SynopticComposite.tsx/synopticComposite.ts ausdrücklich, damit esbuild die Fachdatei nicht mit der React-Komponente verwechselt; Produktionscode unverändert.
