# MID v0.9.76.21 – Parallelkonsolidierung, Build-Budget und Stable-Fast-Forward

## Ausgangslage
Nach dem bereits veröffentlichten v0.9.76.20-Stand lagen zwei voneinander unabhängige Weiterentwicklungen vor: ein Parallelstand mit UI-Feinschliff für das 24-h-Wetterprofil, den DWD-Ortsausschnitt und Tages-Windpfeile sowie die bereits vorbereitete Release-/Performance-Härtung für den nächsten Stand. Beide Linien werden in v0.9.76.21 ohne Rückbau zusammengeführt.

## Übernommene Paralleländerungen
- **Einzelkästchen:** gemeinsame 24-h-Zellgeometrie mit echtem horizontalem Zwischenraum für thermisches Empfinden, Niederschlagswahrscheinlichkeit, Wolken Gesamt/H/M/L und Hazards.
- Einheitlicher vertikaler Achsenwert-Offset für Temperatur, Niederschlag, Wind, Luftdruck und Prozentwerte.
- Dünnere Temperaturkurve im 24-h-Profil.
- DWD „Wolken + Niederschlagsart“: kompakte 22-px-Stecknadel ohne Ortsnamen über dem Originalbild; Originalpixel-Auswertung bleibt bedienbar.
- **Windpfeile:** Tages-/Stunden-Windrichtungspfeile werden anhand der Böe mit derselben DWD-**Warnschwelle** und denselben Warnfarben wie das 24-h-Profil markiert.

## Release- und Performance-Härtung
- `MID_PERFORMANCE_BASELINE.json` Schema 2 trennt Code/Text-gzip (`compressibleGzipBytes`, 5,2 MB) von statischen Medien (`staticMediaBytes`, 7,0 MB); `totalGzipBytes` bleibt als 8,5-MB-Notdeckel.
- `scripts/check-build-budget.mjs` klassifiziert komprimierbare Webartefakte und bereits komprimierte Medien getrennt und schreibt einen Schema-2-Budgetbericht.
- `mid-stable` wird im kanonischen Installer nicht mehr per Force-Push gesetzt. Der vollständig geprüfte Kandidat erhält vorher `MID / release-candidate-quality`; nur wenn der bisherige Stable-Commit Vorfahr des Release-Commits ist, erfolgt ein normaler Fast-Forward-Push.
- Der Boot-Logo-Preload besitzt beim HTML-Parse noch keinen festen `href`; die bereits synchrone Theme-/Logoauflösung setzt den tatsächlich benötigten Pfad.

## Regression und Konsolidierungsschutz
Gemeinsam enthalten sind:
- `scripts/test-weather-profile-cell-gaps-day-wind-pin-097620.mjs`
- `scripts/test-build-budget-media-contract-097620.mjs`
- `scripts/test-stable-fast-forward-promotion-097620.mjs`
- `scripts/test-budget-workflow-release-lineage-097621.mjs`

Der Lineage-Test schützt zusätzlich ausdrücklich, dass der Parallel-UI-Test und sein npm-Einzeltest beim Release-Hardening nicht verloren gehen.

## Plattform- und Workerwirkung
Die UI-Änderungen liegen im gemeinsamen React/Vite-Fachkern und gelten für Browser/PWA und Capacitor-iOS gleichermaßen. Der Release-/Budgetteil ändert keine Wetter- oder Worker-Fachlogik. `WORKER_VERSION` wird lediglich durch die normale Versionssynchronisierung auf v0.9.76.21 gesetzt; der semantische Workervergleich bleibt fachlich leer. **Kein manueller Worker-Upload erforderlich.**
