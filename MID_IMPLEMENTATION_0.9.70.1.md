# MID 0.9.70.1 – Lifecycle-/Offline-Wiederaufnahme ohne lokalen Datenverlust

## Ausgangsbasis

Verbindliche Quelle ist der erfolgreich veröffentlichte MID-v0.9.70.0-Stand auf `mid-stable`, Commit `57015457ca36b2210bb87e7243630ca12629d2c3`. GitHub Actions hat für diese Basis TypeScript, Vite-Produktionsbuild, Worker-Syntax und **563 automatisch erkannte Regressionstests** vollständig grün abgeschlossen. Der automatische Worker-Deploy, GitHub Pages und die Stable-Finalisierung waren ebenfalls erfolgreich.

## Ziel

Der offene iOS-/PWA-Meilenstein `lifecycle-offline-resume-without-local-data-loss` wird im gemeinsamen React/Vite-Fachkern geschlossen. Es entsteht weder ein iOS-Wetterpfad noch eine getrennte Persistenz. Native Lifecycle-Ereignisse werden nur in dieselben Browser-/PWA-Refresh- und Persistenzpfade übersetzt.

## Gemeinsamer Lifecycle-Bridge

`src/runtimeLifecycle.ts` bündelt `pagehide`, `pageshow`, `visibilitychange`, `online`/`offline` und den bestehenden `mid:native-app-state`-Adapter. Beim Suspend werden `persistStateNow()` und ein zeitlich begrenzter `flushStorageSafetyMirror(1400)` best-effort gestartet. Dieser Checkpoint wartet nur auf bereits vorgesehene lokale Spiegelwrites und löscht oder migriert keine Nutzerdaten.

Beim nativen Resume wird zusätzlich nur dann ein `visibilitychange`-Kompatibilitätspuls ausgelöst, wenn das Dokument sichtbar ist. Dadurch laufen bestehende gemeinsame Browser-/PWA-Refreshhandler auch in WKWebView zuverlässig an, ohne native Fachlogik zu duplizieren.

## Offline-Warmstart

Der kanonische Forecastpfad prüft `navigator.onLine === false` **vor** jedem direkten Open-Meteo- oder Worker-Netzpfad. Ein erfolgreicher Kernforecast bleibt wie bisher höchstens 18 Stunden als Wiederanlaufreserve nutzbar. Offline wird dieser Cache unmittelbar mit `cached`, `stale`, `ageMs`, `sourceUpdatedAt` und `upstreamReason=offline-local-cache` zurückgegeben. Existiert kein lokaler Wetterstand, endet der Ladevorgang sofort mit einer verständlichen Fehlermeldung.

Die Oberfläche zeigt im Offline-Zustand eine kompakte, hell-/dunkelmodusfähige Statusleiste. Bei vorhandenem Wetterstand enthält sie dessen Standzeit. Bei Netzrückkehr startet einmalig ein erzwungener frischer Abruf; nach einer längeren App-Unterbrechung wird bei bestehender Netzverbindung der normale gemeinsame Loader ohne erzwungenen Cachebruch erneut bewertet.

## Persistenz- und Datenverlustschutz

- `localStorage` bleibt synchroner Primärspeicher der bestehenden Nutzerverträge.
- Persistenz-Snapshot und Storage-Safety-IDB-Spiegel werden beim Suspend nur best-effort nachgeführt.
- Lifecycle-, Persistenz- und Storage-Safety-Pfad enthalten kein `localStorage.clear()`.
- Favoriten, Events, Einstellungen, Wetterzwilling und sonstige dauerhafte Nutzerdaten werden weder beim Suspend noch beim Resume pauschal gelöscht oder zurückgesetzt.
- Offline-Caches bleiben bewusst Wiederanlaufreserve und keine Langzeit-Wetterdatenbank.

## Regressionen

Neu erforderlich ist `scripts/test-runtime-lifecycle-offline-resume-09701.mjs`. Der Test schützt native und Web-Lifecycle-Signale, Suspend-Checkpoint, lokalen Datenverlustschutz, Offline-Short-Circuit vor Netzpfaden, Cache-Metadaten, verständlichen No-Cache-Abbruch, Netzrückkehr-Refresh, Offline-Standzeitanzeige und Dark-Mode-Kontrast.

Zusätzlich wurden vor der Versionssynchronisierung gezielt erfolgreich ausgeführt:

- `test-runtime-lifecycle-offline-resume-09701.mjs`
- `test-cross-platform-ios-shell-09670.mjs`
- `test-ios-safe-area-header-096671.mjs`
- `test-startup-recovery-08281.mjs`
- `test-storage-quota-resilience-093217.mjs`
- `test-event-durable-storage-fallback-095312.mjs`
- `test-event-lifecycle-startup-095334.mjs`
- `test-device-sync-startup-route-09381.mjs`
- `test-no-actions-workflow-self-modification-093911.mjs`
- `test-ruc-pages-free-storage-09700.mjs`
- `test-day-detail-probability-wind-contrast-09700.mjs`

Mit dem neuen Required Test umfasst der Release-Kandidat **564 automatisch erkennbare Regressionstests**.

## Build-/Release-Gate

Die aktuelle isolierte Laufzeit konnte `npm ci` nicht vollständig beziehen und besitzt daher kein freigabefähiges lokales TypeScript-/Vite-Tooling. Es wird kein lokaler Build-Erfolg behauptet. Vor `mid-stable` muss der Release-Installer erneut reproduzierbar `npm ci`, Dependency-Audit, TypeScript, Vite-Produktionsbuild, Worker-Syntax und alle 564 Regressionen erfolgreich ausführen. Anschließend kopiert `cap copy ios` genau diesen geprüften `dist`-Build in die vorhandene Capacitor-iOS-Hülle und verifiziert zusätzlich, dass `ios/App/App/public/version.json` exakt der Paketversion entspricht. Da keine Plugins oder nativen Abhängigkeiten geändert werden, ist dafür auf Linux kein CocoaPods-/Apple-SDK-Schritt erforderlich.

Die dafür nötige Ergänzung von `install-mid.yml` muss gemäß bestehendem Workflow-Selbstmodifikationsschutz vor dem ZIP-Upload einmal explizit nach `.github/workflows` synchronisiert werden; der Release selbst verändert `.github` weiterhin nicht.

Der Worker erhält nur die synchronisierte Versionsmarke; es ist keine fachliche Worker-Änderung für diesen Meilenstein vorgesehen. Der semantische Worker-Diff soll daher den Cloudflare-Deploy überspringen. Ein `MID-worker.zip` wird gemäß Releasevertrag trotzdem als Notfallartefakt erzeugt; ein manueller Worker-Upload ist nicht vorgesehen.

## Kosten / Apple-Gate

Dieser Meilenstein aktiviert keine neue kostenpflichtige Ressource, kein Apple-Entitlement, keine Hintergrundortung und keine Signierung. Der nächste Roadmap-Schritt ist die Überführung des bestehenden `native/apple`-WidgetKit-Gerüsts in die Xcode-Struktur unter unverändertem `mid.native.widget.v1`-Feedvertrag.
