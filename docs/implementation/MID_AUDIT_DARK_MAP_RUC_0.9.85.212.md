# MID v0.9.85.212 · Intensivaudit: Karten-Themekontrast und RUC-Provenienz

Source-of-truth-Basis: main = mid-stable 055a6ead7b76b68751079935f1994fc8984bf534 (v0.9.85.211); ausschließlich chatgpt/v0.9.85.212-dark-map-ruc-audit für den Source-PR.

## I. Dark Mode, Accessibility, mobile Darstellung

Screenshotbefund: Die direkte Karten-Terminsteuerung in RadarPanel.tsx besitzt in UnifiedWeatherMap.css die Regel background:var(--card,#fff). --card ist nicht kanonisch definiert und der weiße Fallback produziert unter dunklem Theme ein kontrastarmes, sehr helles Formular mit nahezu unsichtbarer Schrift. Appweite native MID-Farbvariablen --surface, --text und --border statt nicht definiertem --card oder hartem Weiß; korrekter nativer color-scheme und Option-Hintergrund, sichtbarer Tastaturfokus, 44px Ziele, mobil <=430px Aufteilung des zusätzlichen Aktuell-Buttons auf volle Zeile. Keine JS-Zeit-/Radar-/Datenänderung.

Tests: scripts/test-map-direct-time-theme-0985212.mjs schützt CSS/Fokus/Touch-/Theme-Vertrag als Core-Regression. Die bestehende echte Chromium-/MapLibre-Matrix scripts/verify-unified-map-browser-0985167.mjs prüft für alle dort verfügbaren Viewport-/Light-/Dark-/Designkombinationen Hintergrundhelligkeit und WCAG-AA-Textkontrast >=4,5 der aktivierten Bedienelemente sowie bereits vorhandene 44px und Overflow-Prüfungen. Browserwerte stammen aus synthetischer kontrollierter Kartenfixture, nicht aus Telemetrie realer Nutzender.

## II. RUC-Integrität: ISSUE #305, bewusst offen

Lauf https://github.com/MeteoMartini/MID/actions/runs/37853501210 scheitert in prepare weiterhin an unplausibel dekodiertem T_2M; Fail-Closed-Meteorologie-Gate bleibt unverändert. Bis zur nachgewiesenen Ursache darf kein ungeprüfter Fallback in die produktive RUC-Veröffentlichung einfließen. tools/ruc/build_ruc_bundle.py protokolliert nur bei Validierungsfehlern begrenzte per-Lead-Provenienz: GRIB-Dateiname, UTC-Valid-Time, Einheiten, Anzahl und Zahl nicht endlicher Zellen, Minimum/Maximum nativer und normierter Werte, Anzahl außerhalb des bestehenden °C-Sanity-Bereichs. Kein Rohfeld, kein Geheimnis, kein vollständiges GRID-Logging; Validator wird weder abgeschwächt noch abgefangen, sondern Fehler bleiben fatal. tools/ruc/test_temperature_decode_audit.py prüft Kelvin->C, C unverändert, NaN/Sentinel-Aggregat und fortdauernde Fehler bei physikalisch ungültigen Temperaturen. Der nächste echte DWD-Preprocessing-Run muss erst Ursache (Encoding, Bitmap/Missing, Unit) belegen. Anschließend separate validierte Korrektur, erneuter vollständiger RUC-Run und Pages-Snapshot. Issue NICHT abschließen ohne Produktivbeleg.

## III. GitHub offene Arbeit geprüft, nicht überstürzt gelöscht oder gemergt

- #305 offen: blockierter DWD-RUC-Produktivlauf; .212 liefert Diagnostik, keine Ursachenbehauptung, keine Gate-Umgehung.
- #270 offen: nächtliche Revision Audit failure; Beispiel https://github.com/MeteoMartini/MID/actions/runs/37764900622 bestätigt npm-audit-Befunde uuid@7.0.3 sowie source-map-js@1.2.1. Auch im verifizierten .212-Lockfile vorhanden; @capacitor/cli steht bereits bei 8.5.2. Abhängigkeitsgraph, Advisory-Fix und CI-/iOS-Kompatibilität müssen separat nachgewiesen werden. Keine npm-audit-Ausnahmeregel.
- #246 offen: zwei alte Branches mit einzigartigen Commits, niemals ohne SHA-verifizierte Sicherung löschen.
- #176 offen: Agent-Ref-Broker ist bewusst ein dauerhaftes Steuer-/Integrationsobjekt.
- PR #260 (13 Dependencies), #252 (pako v2→v3, API-/Export-Breaking-Change) und #253 (Wrangler Action) sind aktuell mergeable=false, z. T. veraltet. Keine automatische Versionserhöhung, Rebase, manuelle Merge-Umgehung oder Workflow-Änderung. Nach getrennten Kompatibilitäts-/Security-Tests und neuem Stable-Base-Check über normalen Source-PR einarbeiten.

## Auditfortsetzung und Freigabe

Map-/Timeline-Performance-Baseline aus .210 bleibt unverändert (Phase 3a); weiterführende Profile für Speicher und Interaktion (3b) erst aus reproduzierbaren Chromium-Traces, getrennt von diesem UI-/RUC-Blocker. Vollständiges Source-PR-Gate, deterministische Regressionen, Heavy-Map/Responsive, Python/RUC, Security/Build/iOS, Agent-Automerge, Release-ZIP, Installer und Worker/Pages- sowie SHA-geprüfte Stable-Promotion bleiben verbindlich.

