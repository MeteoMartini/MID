# MID v0.9.83.0 – Freigabeprüfung der Toolchain-Migration

## Ausgangsbasis
- `mid-stable` v0.9.82.1, Commit `300e7bf0f45477341c46ab2a24149a08415bba10`.
- Vor der Paketbildung erneut gegen GitHub geprüft; Stable war unverändert.

## Erfolgreiche lokale Prüfungen
- Dependency-Policy und lockfile-genaue Direktversionen für React 19, Lucide 1.40, Vite 8 und plugin-react 6.
- SHA-/Integrity-Abgleich der acht direkt migrierten Pakete.
- Vite-8-Konfiguration: Oxc, Lightning CSS, Rolldown `codeSplitting.groups`; keine deprecated esbuild-/`manualChunks`-Konfiguration.
- Recharts-/React-/Redux-/Lucide-Peer-Verträge erlauben React 19.
- Produktiver `src`-Baum ohne `ReactDOM.render`, `ReactDOM.hydrate`, `findDOMNode`, `react-dom/test-utils` oder `createFactory`.
- GitHub-Workflow-Sync: deploy-pages 5.0.1, CodeQL 4.37.9, checkout/setup-node/setup-python/upload-artifact SHA-gepinnt.
- Stable-Hardening, Performance-/Build-Konfiguration, npm-10-Lockfile-Baum, Versionsschema, Baseline, Release-Lineage, Release-Uploadbudget und iOS-/Cross-Platform-Vertrag.
- Maintenance-Aggregate neu erzeugt; `worker.js` und `worker/metar-proxy.js` syntaktisch gültig.
- Worker-Semantik gegen v0.9.82.1 nach Normalisierung der Versionskennung bytegleich.
- Produktions-/Fachquellen gegen den v0.9.82.1-Transportstand verglichen: keine unerwartete Wetter-/UI-Fachänderung.

## Noch im kanonischen GitHub-Installer zu prüfen
Die isolierte Laufzeit konnte `npm ci` nicht abschließen; der Registry-Abruf blieb ohne Fortschritt und wurde beendet. Deshalb wurden hier weder ein vollständiger TypeScript-7-Typecheck noch ein echter Vite-8-Produktionsbuild oder die vollständige 700+-Regression ausgegeben.

Der bestehende Release-Installer bleibt fail-closed: Er führt lockfile-genau `npm ci`, den Produktionsbuild und die vollständige Regressionssuite aus, bevor der Stand installiert bzw. veröffentlicht wird. Dieses Gate wurde nicht abgeschwächt.

## iOS / Worker
- Kein lokaler `npm run ios:sync`, da ein erfolgreicher Vite-8-Produktionsbuild vorausgehen muss.
- Keine fachliche Workeränderung; manueller Worker-Upload nicht erforderlich.

## Transportprüfung
Das unversionierte Professional-ZIP wurde nach der Paketbildung erneut vollständig entpackt. Aus dem entpackten ZIP liefen die 21 kritischen Dependency-/Vite-/Workflow-/Stable-/Version-/Baseline-/Lineage-/iOS-Verträge sowie beide Worker-Syntaxprüfungen grün; der semantische Worker-Vergleich gegen v0.9.82.1 blieb nach Normalisierung der Versionskennung bytegleich.
