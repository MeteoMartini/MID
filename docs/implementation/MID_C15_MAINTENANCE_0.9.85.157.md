# MID v0.9.85.157 · MID-C15

Basis main = mid-stable = 922a78191d9ff50f3858d857f00ef3f811ac96f1 (.156). Keine überlappende offene Agent-PR; nur Dependabot #139. Der vor der Unterbrechung lokale Commit db995e9e war nicht übertragen worden. Die Wiederherstellung nutzt unveränderte Stable-Quelldateien; Farbdateien, Browser-Harness und Synchronisierer besitzen dieselben Git-Blob-Hashes wie der zuvor geprüfte Stand. Alle Prüfungen werden auf dem wiederhergestellten Stand erneut ausgeführt.

## Sichtbare Korrektur

C14 änderte SevenDayCurveOverview, nicht das separate aufgeklappte Forecast-Tagesdiagramm aus dem Nutzer-Screenshot. Temperatur, Taupunkt, Druck, Niederschlag, Wind und Böen verwendeten bereits die kanonischen Tokens. UTCI hatte noch eine goldene/orange Ersatzpalette. --apparent-line übernimmt nun die bestehende 24h-Farbmischung aus Temperatur und Theme-Textfarbe. Linie, Auswahlpunkt und Legende teilen diesen Token; --mg-apparent ist ebenfalls angebunden. Der überholte High-Contrast-Override entfällt. Keine meteorologische Daten-/Schwellenänderung.

scripts/verify-daily-parameter-colors-browser-0985157.mjs rendert die echten ShortTermRibbon-/Forecast-Komponenten und vergleicht berechnete SVG-Farben bei 320/390/412/844/1024/1440 px in Light/Dark/High-Contrast, einschließlich Overflow. QA-Exports bleiben auf den Test-Harness beschränkt.

## Code-/Workflow-Hygiene

Die kanonischen Quellen agent-source-release, install-mid und deploy drifteten von ihren aktiven Kopien ab. Die bestehenden veröffentlichten Schutzmaßnahmen werden in ci/github übernommen: minimale Release-App-Rechte, persist-credentials:false, Botidentität, getrennte Installer-Locks für interne Bot-Pushes, Worker-Prüfung und manuelle Releasefenster-Sperre. Aktive Schutzmechanismen werden nicht zurückgestuft. Bereits vorhandene workflow-patches werden durch den expliziten Synchronisierer mit aktualisiert und bleiben Transportspiegel. Der bestehende Workflow-Test prüft diese Kopien sowie Idempotenz und unveränderte fremde Workflows.

unit-coverage führte dieselbe Vitest-Suite ohne und mit Coverage aus. Der Coverage-Lauf prüft selbst alle Unit-Assertions und deren Fehlerstatus. Er ersetzt die doppelte Ausführung; Trigger, Rechte, Jobname und Berichts-Upload bleiben erhalten. Der Installer-Supersession-Test wird auf den bereits aktiven Bot-Lock erweitert, nicht gelöscht.

## Keine Gate-Abschwächung

Source-PR Gate → Agent Source Release → serverseitiges ZIP → Installer → Worker/Pages → Stable bleibt verbindlich. PR-Gate und Installer prüfen unterschiedliche Vertrauens-/Artefaktgrenzen. Agent Source Release führt kein zusätzliches npm verify aus. Der manuelle Pages-Workflow ist ein Recovery-Pfad, nicht ein automatischer Doppelrelease. Pages-Retryjobs und Self-Heal behandeln Fehler und bleiben mit ihren Locks/Fehlerklassen erhalten. Kein manueller Stable-Push, keine neue Berechtigung und kein Schlüssel-Fallback.

## Regressionen

905 automatisch erkannte Tests, keine bytegleichen Dateien. 886 enthalten includes/assert.match; dies ist nur eine Heuristik, viele Dateien enthalten gleichzeitig Verhaltenstests. Keine Streichung nach Alter/Dateiname. Folgeschritt: Assertions nach Fachvertrag gruppieren und pro Migration eine alte→neue Assertion-Abdeckung samt Verhaltens-/Browserbeleg erstellen. Teure Worker-/Decoder-/Bundleprüfungen behalten Isolation. Runner und beide per Driftprüfung gebundenen Baseline-Inventare bleiben vollständig erhalten.

Der zuvor ausgeführte lokale Workflow-Auditor meldete sieben MD-WF-006-Hinweise (medium), keine high/critical-Regeln. Checkout-Credentials in historischen apply-private-analytics/mid-code-revision und RUC-Pfaden sind gesondert mit Live-Berechtigungen/Betriebsnutzung zu bewerten. Historische manuelle main-/mid-stable-Pushpfade werden nicht ohne Recovery-/Berechtigungsabgleich deaktiviert; kein Kompromittierungsbeleg.

## Prüfstatus

Erneute vollständige Suite, Browservergleich, Dependency-Audit, Coverage und iOS-Copy müssen vor Übergabe grün sein. Release-Erfolg ist erst nach Installer-/Pages-/Stable-Prüfung bestätigt. Die vormaligen lokalen Prüfergebnisse allein autorisieren keine Veröffentlichung einer ungeprüften Wiederherstellung.
