# MID v0.9.76.3 – vollständige Regression-Gate-Mitigation

## Anlass

Der reale GitHub-Installerlauf #777 für v0.9.76.2 hat `npm ci`, Dependency-Audit, den echten TypeScript-7.0.2-Typecheck und den Vite-Produktionsbuild vollständig bestanden. Erst die 589er-Regressionssuite meldete fünf Fehler. Es handelte sich ausschließlich um veraltete Übergangs-/Metatest-Erwartungen; die produktive Fachlogik hatte bis dahin keine neue Buildregression.

## Korrekturen

- RUC-Workflow-Sync-Vertrag um genau den tatsächlich aktiven, bereits geschützten `:11/:41`-Catch-up-Zwischenstand erweitert. Dieser Zustand besitzt Freshness-Guard und `cancel-in-progress: false`, aber noch nicht den neuen `force=false`-Watchdog-Input. Beliebige Drift bleibt weiterhin fail-closed.
- Übergangsregression prüft nun vier Zustände separat: vollständig synchron, exakter Pre-Watchdog-Catch-up, alter geschützter Legacyzustand und unbekannte Drift.
- TypeScript-7-Kompatibilitätstest schützt weiterhin exakt TypeScript 7.0.2, Lockfile, Strada-Sidecar, No-Emit-Compilervertrag und Plattformgleichlauf, bindet aber spätere Patchreleases nicht mehr fälschlich an die ursprüngliche Meilensteinversion 0.9.76.0.
- SEO-Regression folgt dem Produkttextvertrag und erwartet keine sichtbare `kostenlos`-/`kostenfrei`-Formulierung mehr; Suchmaschinen-Discoverability, Canonical URL, robots, Sitemap und strukturierte Daten bleiben geschützt.

## Unverändert

- TypeScript 7.0.2 und Vite 6.4.3.
- Gemeinsamer React/Vite-/Worker-Fachkern für Browser/PWA/iOS; kein iOS-Fork.
- 24-h-Profil einschließlich kanonischer Tmin/Tmax-Marker.
- Modellstand `Init / Quelle bereit / Eingeflossen`.
- Transparenter Komposit-Referenzlayer über sichtbarem Satellitenbild.
- RUC-Fachlogik, `:11/:41`-Primärslots und kanonische Watchdog-Vorbereitung.
- Automatische semantische Worker-Erkennung; kein manueller Worker-Upload.

## Release-Gate

Der nächste reale GitHub-Installerlauf muss nun die vollständigen 589 Regressionen passieren und anschließend erstmals den korrigierten `cap copy ios`-Pfad mit `capacitor.config.json` end-to-end erreichen.
