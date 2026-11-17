# MID Design 1.6 – qualitätsgesicherter A/B-Evidenzvergleich (QA-Draft, kein Release)

## Abgrenzung und Provenienz

Read-only Werkzeug für zwei **vollständig getrennte, reproduzierte Produktions-Dist-Verzeichnisse** des GitHub-Projekts. Ausgangsbasis zum Implementierungszeitpunkt: `main = mid-stable = a78465b655d25cafc9ecc0390080694cb7aca957`, veröffentlichte v0.9.85.486, fünf aktive Rulesets. Der kombinierte LC-Integrations-Draft #858 und der separate CSS-Heuristik-Draft #859 werden **nicht** geändert. Kein Merge, keine Versionierung, kein Release, keine zusätzlichen APIs, keine Datenerhebung, kein Zugriff auf Nutzer- oder Wetterdaten.

Das bereits integrierte `scripts/measure-startup-assets-0985482.mjs` ermittelt die aus HTML referenzierten initialen JS-/CSS-Dateien; `scripts/measure-map-prefetch-browser-0985489.mjs` misst den *isolierten Import* realer gebauter Kartenmodule in Chromium, nicht die ganze App. Bislang wurden teilweise Zahlen aus unterschiedlichen Quellständen und Umgebungen neben- statt kontrolliert gegeneinandergestellt. **Dieses Hilfswerkzeug verhindert Zuordnungsfehler und Scheinbeweise**: Es nimmt ausschließlich zwei vollständige `dist`-Verzeichnisse mit `mid-build-identity.json`, deren korrespondierende Startup- und Modulimport-Evidenzdateien und die beiden exakten Git-SHAs entgegen.

## Harte technische Prüfungen

1. Für **beide** Builds wird der gesamte Dist-Dateisatz mit `verifyStartupBuildIdentity()` unabhängig nachgehasht. Der volle Quell-SHA, die vollständige Asset-SHA-256-Identität und `version.json` müssen stimmen. Buildreports mit vertauschten SHA/Version/Assetidentitäten oder fehlender Provenienz werden abgewiesen.
2. Nur die vorhandenen Originalschemas `mid.static-startup-assets.v1` und `mid.prefetch.chrome-module-evidence.v1` werden akzeptiert. Die Report-Scope-Identität, der identische Probe-Methodentext und die negative Vorkontrolle ohne Karten-JS-Import werden verlangt.
3. Missing, NaN, nichtendliche Werte, leere Hauptassets sowie unvollständige bzw. nicht aufaddierende Dateiinventare führen zum **Abbruch**, nicht zur Behandlung als `0`. Dies gilt auch für negative Heap-Deltas: Solche Zahlen sind zulässig, aber kein Leak-Beweis.
4. Der Ergebnisbericht ist **immer** `DESCRIPTIVE_ONLY_FULL_APP_AB_MISSING`, `releaseAuthorized:false`, `performanceGainProven:false` und `leakFixedProven:false`. Berechnete Delta-/Prozentwerte sind lediglich Unterschiede zweier diagnostischer Messkontexte, **keine** nachgewiesene Web-/iOS-Geschwindigkeits- oder RAM-Verbesserung.

## Reproduzierbarer manueller Ablauf (kein CI-/Release-Ersatz)

- Zwei **sha-genaue** Working-Trees separat mit gleicher Node-/Vite-/Lockfile-/`VITE_*`-Konfiguration und reproduzierbar gleicher Buildumgebung erzeugen. Den Stable- und den kombinierten Kandidaten **nie** durch Überlagerung eines bestehenden `dist`-Verzeichnisses vergleichen.
- Für jeden Build in seinem eigenen Arbeitsverzeichnis `node scripts/measure-startup-assets-0985482.mjs <dist>` und mit demselben, SHA-geprüften Instrumentierungsskript `MID_EXPECTED_SOURCE_SHA=<full-sha> node scripts/measure-map-prefetch-browser-0985489.mjs <dist>` laufen lassen. Die jeweils erzeugten beiden JSON-Artefakte getrennt und unverändert aufbewahren. Auch für Stable muss das Instrumentierungsskript aus dem QA-Stand bereitgestellt werden; es ändert Stable-Code oder den Build **nicht**.
- Anschließend, aus dem QA-Repository:

```bash
node scripts/compare-design16-ab-evidence.mjs \
  /abs/stable/dist <stable-full-sha> /abs/stable/startup-assets.json /abs/stable/map-import.json \
  /abs/candidate/dist <candidate-full-sha> /abs/candidate/startup-assets.json /abs/candidate/map-import.json
```

Ergebnis: `artifacts/design16-ab-evidence.json` (nur lokales Diagnoseartefakt). Kein Netzwerkzugriff, keine Release-Schreibrechte. Die manuelle Environment-/Toolchain-Parität ist damit **noch nicht kryptografisch attestiert**, selbst wenn die Dist-Hashes stimmen; das Werkzeug behauptet deshalb keine ausreichende A/B-Qualifikation.

## Separate zwingende Abnahme

Derselbe vollständige App-Pfad muss in zwei direkt vergleichbaren, SHA-verifizierten Builds und echten Browserkontexten gemessen werden: Kalt-/Warmstart, gespeichertes und fehlendes Karteninteresse, erster Touch/Fokus/Tastaturaufruf, tatsächliches CSSOM/Computed-Style-/Rendering-Verhalten, Save-Data/2G, Offline/ServiceWorker, 20× Karten-/Ensemble-Wechsel mit wiederholten Post-GC-Kontrollmessungen, 320/390/430/834/1024/1440px, Light/Dark/Dynamic-Type; echte iOS-/VoiceOver-Abnahme separat. Ein isolierter Chromium-`Runtime.getHeapUsage`-Wert erfasst die **JS-Isolatnutzung**, nicht GPU-/Tab-/System-RAM oder iOS WebKit. Kein Null-Befund der CSS-Heuristik (#859) ist eine Freigabe zum Verschieben von Eager-CSS. Fehlende PostHog-Feldsamples sind keine grüne Feldperformance.

Die produktive Source-/Heavy-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Kette bleibt vollständig maßgeblich. #740/#839 wird nicht verändert. **Dieser QA-Draft darf nicht als Performancefreigabe interpretiert werden.**

Originalreferenzen: https://vite.dev/guide/features, https://chromedevtools.github.io/devtools-protocol/tot/Runtime/, https://web.dev/articles/vitals.
