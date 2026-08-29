# MID 0.9.70.2 – Lifecycle-/Offline-Release-Hotfix

## Anlass

Der erste echte v0.9.70.1-Release-Lauf (#749) hat die korrekte Professional-ZIP mit SHA-256 `0fe4d8e6bbbc64895a1b993fdeb1caa13fe814b88aff37b1bac3b14c8ceca6a4` geladen. TypeScript und der Vite-Produktionsbuild waren grün. Von 564 automatisch erkannten Regressionen bestanden 563. Ausschließlich `test-dwd-pop-and-openmeteo-rate-guard-095314.mjs` scheiterte, weil die historische Regression wortwörtlich `if(cached)return cached.value` erwartete.

## Fachliche Bewertung

Die aktuelle Forecast-Laufzeit hat diesen alten Ein-Zeilen-Pfad bewusst durch einen stärkeren Cachevertrag ersetzt:

1. Offline wird vor jedem Direkt-/Worker-Netzpfad ein vorhandener Kernforecast über `cachedForecastResult(..., 'offline-local-cache')` zurückgegeben.
2. Ein frischer Cache wird ohne `forceFresh` bis `FORECAST_CORE_FRESH_MS` über `fresh-local-cache` verwendet.
3. Nach erfolglosen Direkt-/Worker-Netzpfaden bleibt der begrenzte letzte belastbare Stand über `network-fallback-local-cache` verfügbar.

Die v0.9.53.14-Schutzziele — Fresh-Cache, Stale-if-rate-limit/Netzfehler und 429-Entlastung — bleiben damit erhalten und sind im Lifecycle-/Offline-Meilenstein genauer modelliert. Ein Rückbau auf die historische Quelltextzeile wäre fachlich falsch.

## Änderung

Nur die alte Regex-Regression wird semantisch aktualisiert. Sie verlangt nun explizit alle drei Cachepfade sowie den gemeinsamen `cachedForecastResult`-Metadatenhelfer. Produktions-Wetterlogik, Worker-Fachlogik, RUC, Mitteleuropa-Ausblick, Tages-PoP und Dark-Mode-Winddarstellung bleiben unverändert.

## Release-Gate

Vor `mid-stable` muss der unveränderte Installer erneut `npm ci`, Dependency-Audit, TypeScript, Vite, Worker-Syntax und alle 564 Regressionen bestehen. Erst danach wird der geprüfte Web-Build per `cap copy ios` in die Capacitor-Hülle übernommen und dort die Versionsgleichheit geprüft. Es ist keine neue Workflow-Synchronisierung erforderlich, da `install-mid.yml` gegenüber dem bereits auf `main` synchronisierten v0.9.70.1-Stand unverändert bleibt.

Ein manueller Worker-Upload ist nicht erforderlich; semantisch ändert sich am Worker außer der Releaseversionsmarke nichts.
