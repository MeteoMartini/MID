# MID v0.9.84.98 – Test- und Releasebericht

## GitHub-Ausgangslage

Vor der Freigabe wurde Installer #1052 für v0.9.84.97 vollständig abgeglichen. Der Lauf ist erfolgreich abgeschlossen: `npm ci`, Dependency-Audit, TypeScript 7.0.2, Vite 8.2.2, alle 789 automatisch erkannten Regressionstests, Capacitor-iOS-Übernahme, Pages-Deployment und Fast-Forward-Promotion nach `mid-stable` waren erfolgreich.

Die in #1052 installierte Ausgangs-ZIP hatte SHA-256 `b95d7c2d2f2c3039255120f5a363cf7b09df16258b6ee48117fb07037a994deb`. Sie ist bytegleich mit dem lokalen Ausgangsarchiv. `mid-stable` steht damit auf v0.9.84.97, Commit `c03d0a059c3116cc81ad547eb2d37fe3aea1b134`.

## Fokussierte Regressionen

Erfolgreich:

- `test-modern-navigation-step2-09791.mjs`
- `test-shortterm-planner-polish-098498.mjs`
- `test-modern-five-workspaces-09841.mjs`
- `test-mobile-header-bottom-nav-098481.mjs`
- `test-optional-bottom-navigation-09790.mjs`
- `test-forecast-entry-consistency-098430.mjs`
- `test-viewport-textflow-098485.mjs`
- `test-responsive-layout-tooltip-098474.mjs`
- `test-appwide-readability-continuation-098479.mjs`
- `test-appwide-touch-responsiveness-09523.mjs`
- `test-responsiveness-071003.mjs`

## Reale CSS-/Viewport-Simulation

Mit Playwright und dem installierten Chromium wurde ein Fixture mit dem echten aggregierten `src/styles.css` gerendert:

- **390×844 (iPhone):** fünf Horizonte ohne Scroll/Overflow; Planen-Karten einspaltig; kein doppelter Planer-Kopf.
- **820×1180 (iPad):** fünf Horizonte ohne Scroll/Overflow; Planen-Karten zweispaltig.
- **1440×1000 (Desktop):** fünf gleichmäßig verteilte Horizonte; Planen-Karten vierspaltig; konsistente Modulkarte unter dem Hub.

Für alle drei Viewports meldete die DOM-Messung `docOverflow=false` und `horizonScroll=false`.

## Vollständiger Build

Die lokale Arbeitsumgebung enthält keine reproduzierbar installierten Projektabhängigkeiten; daher wird kein lokaler vollständiger TypeScript-/Vite-/789+-Regressionslauf behauptet. Der unmittelbar vorherige v0.9.84.97-Stand wurde jedoch in GitHub Installer #1052 vollständig gebaut und getestet. v0.9.84.98 ändert nur `App.tsx`, Modern-CSS, die zugehörige Regression sowie Versions-/Release-Dokumentation; der nächste GitHub-Installer bleibt das definitive fail-closed Gesamtgate.

## Worker

Keine fachliche Worker-Änderung. Ein separater Worker-Upload ist nicht erforderlich.

## Paketierung

Das Professional-ZIP wurde mit denselben Ausschlüssen und Integritätsregeln des kanonischen `tools/release/create_professional_zip.py` erzeugt (`.github`, `dist`, `node_modules`, `artifacts` und `ios/App/App/public` werden nicht transportiert). Da lokal keine installierten Projektabhängigkeiten vorhanden sind, wurde der im Packer vorgeschaltete vollständige `release-preflight.mjs` nicht als lokal bestanden behauptet; stattdessen wurden die fokussierten UI-/Responsive-/Release-Verträge vor und nach frischem Entpacken des Transport-ZIPs ausgeführt. Der nächste GitHub-Installer bleibt das definitive vollständige Gate.
