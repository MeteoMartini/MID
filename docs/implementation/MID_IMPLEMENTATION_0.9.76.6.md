# MID v0.9.76.6 – Watchdog-/Modellstand-Regressionsmitigation

Stand: 2026-08-30

## Anlass

Der Release-Lauf #780 bestätigte TypeScript 7.0.2 und den Vite-Produktionsbuild, scheiterte aber an genau einer veralteten Regression, die im Cockpit weiterhin den alten Text „Laufmetadaten derzeit nicht abrufbar“ verlangte. Parallel erkannte der neu aktivierte RUC-Scheduler-Watchdog korrekt einen fehlenden :11-Lauf, scheiterte jedoch beim Recovery-Dispatch, weil `gh workflow run` ohne Repository-Checkout das Zielrepository nicht ermitteln konnte.

## Korrekturen

- Der Modellquellenvertrag schützt nun die neue, fachlich präzisere Darstellung `Init modellabhängig` beziehungsweise `von Quelle nicht ausgewiesen`; Adapter-/Fallbackstatus bleiben erhalten.
- Der RUC-Watchdog dispatcht mit explizitem `-R "$GITHUB_REPOSITORY"`. Damit ist kein lokales `.git`/Checkout für `gh workflow run` erforderlich.
- Die Watchdog-Regression verlangt diesen expliziten Repositorybezug und verhindert damit den in Watchdog-Run #1 beobachteten Rückfall.

## Unverändert

Forecast-Fusion, RUC-Datenprodukte, Worker-Fachlogik, 24-h-Profil, Reisewetter-Schneehöhenlogik, Langfristpfade und die gemeinsame Browser/PWA/iOS-Architektur bleiben unverändert gegenüber v0.9.76.5.
