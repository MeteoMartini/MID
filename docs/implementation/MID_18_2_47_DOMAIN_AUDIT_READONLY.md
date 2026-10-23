# MID 18.2.47 · Geografische Vollabdeckung – Prüfnachweis (read-only Draft)

## MID-C39 · Prüferhärtung 23.10.2026 (weiterhin kein Release)

Erneut verifiziert: `main = mid-stable = 7cabe4ca23d86dbf3aadccdb03aa3fc0dbf20885` / .311. #445 ist inzwischen auf .311 konsolidiert, HEAD `6d8fa7f777df565c64e4293235f754445814a774`; dessen Konturen-/Exportkorrektur und 1017 Regressionen/24 WebGL-Fälle bleiben separat erhalten. Die historische Aussage unten über dessen .309-Basis ist überholt. Keine Doppelimplementierung oder Überschreibung dieses PRs.

Neue Red-/Green-Regressionen zeigten elf zuvor nicht abgewiesene negative Unterfälle: fehlende Modellstunden, entfernte Quell-SHAs, falsches Schema/Modell/Sampling/Einheit, falsches Akkumulationsintervall und abweichender dekodierter SHA. Der Auditor verlangt jetzt alle drei Quell-SHAs, direkte Übereinstimmung der Modell-/Sampling-Identität, korrekte Quell-/Produkt-/Frameeinheiten und passende Candidate-/Published-Schemata. Der unveränderte `ruc_map_candidate`-Produktionsbuilder wird zusätzlich direkt als synthetischer Integrationsfall ausgeführt.

Alle durch die Quelle definierten Vorhersagestunden müssen je Parameter vorhanden sein. Böen und Niederschlag beginnen wie im tatsächlichen Builder bei +1 h, Instantanfelder bei +0 h; keine erfundene 0-h-Stundenakkumulation. Der Bericht unterscheidet `allSourceForecastHoursPresent`, `sourceForecastHours` und `full27HourSourceAxis`: eine in sich vollständige Kurzquelle gilt **nicht** als +27-h-Abnahme. CLI-Exitcode 2 jetzt auch bei kürzerer als +27-h-Quelle, nicht nur bei räumlichem Crop; echte 28-Zeitpunkt-Fixture erreicht bei vollständiger Geometrie Exitcode 0. Dekodierte Frame-SHAs werden geprüft; Wire-Dateigrößen werden vor Einlesen am unveränderten 12-MB-Limit geprüft.

Gezielte Tests **17/17 bestanden** (vorher 9). Die kleine Positiv-Fixture enthält nach Korrektur der echten Intervallsemantik zehn statt zwölf Frames; hinzu kommt ein vollständiger synthetischer 28-Zeitpunkt-CLI-Fall. Keine Beobachtungs-/GRIB-Echtdatenfreigabe daraus ableiten. Context7 für NumPy 2.3.1 als verfügbare nahe Versionsreferenz gelesen; lokal NumPy 2.3.5, keine Dependency-Änderung. Replit rein lesend befragt, erneut leere Antwort ohne verifizierbaren Git-Stand; kein Schreibauftrag.

Unverändert offen: drei vollständige echte ICON-D2/RUC-Läufe mit Originalmasken und allen Parametern/Leads, Vollgebietstransport/Client-/900-MB-Budget, UI-/Synoptik-/Exportabnahme und danach die vollständige MID-Releasekette. Diese Änderung härtet ausschließlich einen inaktiven Prüfer und seine synthetischen Tests; kein Versionssprung, kein bereit markierter PR, kein Produktionsdeploy.

Zusätzlich sind die 17 Auditorfälle nun im bereits registrierten Pflicht-Einstieg `scripts/test-ruc-map-pipeline-0985305.mjs` eingebunden. Kein neuer Workflow und kein allein manuell laufender Prüfer. Explizite kombinierte Python-Abnahme mit Kartenbuilder, Archivprobe, Horizontprobe und nativen Kartenprodukten: **41/41 bestanden**. Der globale unittest-discover-Aufruf lieferte Exitcode 0, aber keinen abschließenden globalen Summennachweis im erfassten Log; er wird deshalb nicht als vollständige Abnahme gezählt. Maßgeblich sind die ausdrücklich benannten Suiten und der bestehende Node-Regressionsrunner. PR-Completion-Watcher liefert lokal `blocked: required command not found: gh`; Status-/Review-/SHA-Prüfungen erfolgen über die verbundene GitHub-API, ohne Credential-Übernahme oder Ersatz-Landing.

## Status und Herkunft

Aktueller Nachweis der Prüferhärtung: vollständiger bestehender MID-Regressionsrunner **1017/1017 bestanden**, 137,6 s, einschließlich neu eingebundener Auditorfälle; TypeScript-Prüfung bestanden. Keine App-/Worker-/Produktionsdatei oder Dependency geändert. Der Diff gegenüber dem vorherigen Draft betrifft nun vier Dateien (Prüfer, Tests, bestehender Node-Pflichteinstieg, diese Dokumentation), nicht mehr ausschließlich die drei additiven Ursprungsdateien. Die unten dokumentierten neun Fälle und Blob-SHAs beziehen sich auf den historischen Ausgangsstand.

Basis am 22.10.2026: `main = mid-stable = 7cabe4ca23d86dbf3aadccdb03aa3fc0dbf20885`, Version **0.9.85.311**. `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md` und einschlägige Karten-/Präzisionsverträge wurden vor Änderung geprüft. Die aktive RUC-Aufbereitung und die parallelen Drafts #443/#445, ECMWF #433, RUC #432/#425 sowie Issue #446 bleiben unverändert. Branch `chatgpt/v0.9.85.313-domain-coverage-audit` ist **nur eine künftige Versionsreservierung**; alle App-Versionsspiegel bleiben .311. Keine App-Funktion, Worker-/Pages-Quelle, CI-Workflow oder Produktionsdatei verändert; kein Deploy und keine Stable-Promotion behauptet.

## Beobachtete systematische Deutschland-Beschneidung

- ICON-D2 `tools/ruc/build_model_map_fields.py`: `47..55.2°N`, `5.5..15.6°E`.
- RUC 6 Kartenparameter `tools/ruc/ruc_map_candidate.py`: identische Crop-Grenzen.
- RUC-Synoptik und Cloud/WW `tools/ruc/build_ruc_synoptic_fields.py`: identischer Crop.
- UI `src/NativeModelMap.tsx`: `MapFitBounds` und Favoritenmarkierung verwenden den Deutschland-Ausschnitt; `src/nativeModelFields.ts` beschränkt Druckkonturkoordinaten.
- Der verifizierte RUC-Lookup `RUC_BBOX=(-3.85,43.18,20.22,58.05)` ist größer, seine gültige NoData-Maske ist **keine rechteckige Vollabdeckung**. Für alle Parameter/Termine die echte meteorologische Quellabdeckung nachweisen.

## Neu: reproduzierbarer unabhängiger RUC-Kartenauditor

`tools/ruc/audit_model_domain_coverage.py` ist ausschließlich lesend. Beispiel für bereits vorhandene, SHA-verifizierte Rohquellen und gesonderte Kartenobjekte:

```bash
python tools/ruc/audit_model_domain_coverage.py --source /path/to/verified-ruc-map-source --maps /path/to/separate-ruc-map-candidate
```

Der Auditor verlangt getrennte Quell-/Kartenordner; SHA-/Byte-Identität von Manifest, nativer `lookup.bin`, `deterministic.bin` sowie **jedem** Kartenframe; sechs deterministische RUC-Kartenparameter, gültige UTC-Lead-Achsen (explizite UTC-Offsets ebenso wie bereits quellenvertraglich als UTC definierte RUC-Zeitstempel ohne Suffix) und Rasterachsen. Er vergleicht jede dargestellte Zelle per Quell-Lookup mit dem quantisierten nativen `point-time-field`-Wert (Wind/Böen inklusive Faktor 1,852) und behandelt `-32768` und ungültige Lookup-Indizes als *fehlend*, niemals als Null. Separat werden gültige, auf dem veröffentlichten Ausschnitt fehlende Lookup-Zellen, eindeutige native Punkte sowie pro Parameter/Lead tatsächlich bekannte abgeschnittene Werte gezählt. Er verwirft manipulierte Payloads selbst nach Neuberechnung des Wire-SHA und begrenzt gzip-Dekompression auf 12 MB pro Frame. Normaler JSON-Bericht bei vollständiger Quellenübereinstimmung; Exitcode **2** bei abgeschnittenen gültigen Lookup-Zellen, Fehler bei Provenienz-, Zeit-, Wert-/Masken- oder Dimensionsabweichung.

**Lokal bestandene synthetische Regression:** `python -m unittest -v test_model_domain_coverage.py` aus `tools/ruc`: **9/9**; sechs Parameter und 12 Frames, absichtlicher Crop, echte Null, Missing im Zentrum/Rand, Wire-SHA-Korruption, manipulierter Wert trotz aktualisiertem SHA, fehlende native Maske in Null verwandelt, Quellmanifest-Drift und Rasterverschiebung. Byteidentische GitHub-Blob-SHAs: Auditor `e88502dd2a1343445d96bd0f8a24488e962753ea`, Tests `8428bad2e09d4c92f150a16d721090cff63946ef`.

## Reale Evidenz, aber **noch keine Vollgebietszulassung**

RUC-Prepare-Lauf [39840650011](https://github.com/MeteoMartini/MID/actions/runs/39840650011), 22.10.2026 18UTC: `mapHours=27`, `coreHours=14`; aktivierter verlustfreier Source-Kern; Kartenadmission `finalPhysicalBytes=364618152`; RUC-Synoptik `finalPhysicalBytes=373385306`, 28 Frames und 251 Quellinventare; Pages-Grenze unverändert `900000000`. **Dies misst den bisherigen kleinen Zuschnitt**, weder alle künftigen Feld- und Fragmentgrößen noch 3 vollständige Ganzgebietsläufe. Neuer RUC-Lauf [39847943940](https://github.com/MeteoMartini/MID/actions/runs/39847943940) wurde nachträglich **erfolgreich**: Run 22.10.2026 19UTC, 542.040 Punkte, 20 EPS-Member, +27h-Karten/14h-Kern, 374.154.969 Byte und erfolgreicher Pages-/Codec-Healthcheck. Dies ist ein Datenpublish auf dem *alten Karten-Crop*, keine Vollgebietszulassung. Replit meldete keinen verifizierbaren lokalen Git-/Worktree-Stand, daher kein Schreibzugriff.

## Blockierende Folgeschritte vor einem produktiven Vollgebiet-PR

1. Mindestens drei echte vollständige ICON-D2- und RUC-Läufe mit DWD GRIB2/ecCodes, inklusive getrenntem regular_ll/native/unstructured/rotated grid, GRIB bitmap (gültige Null ≠ missing), CRS, Leit-/Akkumulationszeiten, Randzonen und jeder Quellparameter-Abdeckung prüfen.
2. Rückwärtskompatible, ggf. räumlich gekachelte Transport-/Cacheverträge mit individuellen SHA, `decodedBytes`, `maxDecodedBytes`, maximalem Client-RAM und atomarer Veröffentlichung; unveränderte RUC-900MB-Grenze, 14h-Kern und +27h-Karten; nicht einfach bisherige 12MB-Clientlimits erhöhen.
3. Quellseitige Crop-Entfernung für **alle** sechs RUC-Karten sowie RUC-Synoptik/Cloud/WW und sämtliche acht ICON-D2-Parameter; zusammenpassende Komposit/Isobaren/Druckzentren, RUC-Nearest-Cell-Masken, adaptive UI-Bounds und Favoriten-Probe, WebGL, SVG/PNG. Keine fremden Modelldaten als Lückenfüller, keine Extremenglättung.
4. Current-Stable-Rebase ohne Historienverlust und selektive Koordination mit Kontur-Draft #445; ganze Testsuite, realer MapLibre/WebGL-Render-/Viewport-Gate, Worker/Pages, Security, CI/Source-PR-Gates und regulärer Releasepfad über MID-Bot → Server-ZIP → `install-mid.yml` → Stable.

Die Prüferdateien alleine **dürfen niemals** als gelöste Vollgebietsabdeckung, als bestandene Echtdatenabnahme oder als neue produktive App-Version bezeichnet werden.

Refs: #446, #352, #422, #434, #443, #445.
