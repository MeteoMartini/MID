# MID Design 1.6 – vollständige App und erster Karten-Tipp, Chromium-Laborprüfer

**QA-Draft, 16.11.2026 · NO READY / NO MERGE / NO RELEASE.** GitHub-Source vor Beginn: main = mid-stable = a78465b655d25cafc9ecc0390080694cb7aca957, v0.9.85.486, fünf aktive Branch-Rulesets. Dieser neue Spezial-Draft ergänzt ausschließlich eigenständige Diagnose-Dateien. Leitchat-Integrations-PR #858, CSS-Audit #859, bisheriger statischer A/B-Prüfer #860, Karten-PR #861 sowie Release-Sicherheits-PR #839 bleiben unberührt.

## Zweck und geprüfte Originaldaten

- scripts/measure-mid-full-app-browser-design16.mjs lädt ausschließlich den vollständigen, SHA-geprüften originalen Produktions-Dist von MID. Der bestehende verifyStartupBuildIdentity()-Validator prüft jedes gebaute Asset, die Version und den vollständigen Source-SHA.
- Ein lokaler HTTP-Server liefert unverändertes HTML, JS und CSS mit korrekten MIME-/Gzip-/Cache-Headern. Chromium nutzt einen separaten Browser-Profilordner, 390 × 844 CSS-Pixel und ein explizites, lokal gespeichertes UI-Szenario. Der Service Worker wird für diese Messung umgangen; das ist keine Offline-/PWA-Abnahme.
- Der Prüfer öffnet die echte gebaute HTML-/React-App, beobachtet nach 2750 ms die initialen JS-/CSS-Requests und löst den Karten-Aufruf über CDP Input.dispatchTouchEvent statt über ein simuliertes DOM-click() aus. Erst nach einem tatsächlichen Pointer-Ereignis und einem sichtbaren MapLibre-Canvas kann er die erste Karten-Latenz protokollieren. Ohne echtes UI wird der Versuch abgelehnt, nicht als Nullzeit gemeldet.
- Getrennte Cold/Warm-Durchläufe liefern FCP, initiale und gesamte JS-/CSS-Anforderungen, kodierte Transferbytes, Browsercache-Treffer, vor-/nachgelagerten post-GC JavaScript-Isolat-Heap und die Anzahl externer Requests/JS-Ausnahmen.
- Keine Wetterantworten werden überschrieben oder aus fehlenden Daten als null/0 erfunden. Der Report enthält keine rohen Wetter-URLs, Namen, Standortkoordinaten oder Geheimnisse; der verwendete Testort wird als SHA-256-Szenario-Hash dokumentiert.
- scripts/lib/design16FullAppProbePolicy.mjs verwirft unvollständige Identitäten, Szenarien, Zeit- und Transferwerte, fehlende Karten-Events, falsche Cold/Warm-Folgen und Abweichungen von Browser- und Szenario-Fingerprints.
- scripts/compare-mid-full-app-browser-design16.mjs akzeptiert nur zwei vorhandene gültige Proben mit identischem Browser und Testort. Die Ergebnisse bleiben immer deskriptiv: ENVIRONMENT_AND_PROVIDER_PARITY_UNVERIFIED, releaseAuthorized:false, performanceGainProven:false und leakFixedProven:false.

## Reproduktion

Eine private Test-Fixture enthält ausschließlich location.name, location.latitude, location.longitude, location.timezone, theme (light/dark) und priorMapIntent (true/false). Keine API-Tokens. Alle Quell- und Dist-SHAs müssen vollständig sein.

    node scripts/measure-mid-full-app-browser-design16.mjs /abs/stable/dist <stable-full-sha> /abs/fixture.json
    # Den generierten JSON-Bericht getrennt sichern, anschließend auf eigenem Kandidaten-Dist:
    node scripts/measure-mid-full-app-browser-design16.mjs /abs/candidate/dist <candidate-full-sha> /abs/fixture.json
    node scripts/compare-mid-full-app-browser-design16.mjs /abs/stable-report.json /abs/candidate-report.json

Der Bericht wird ausschließlich im lokalen artifacts-Verzeichnis geschrieben. Die beiden Builds müssen auf identischer Node-/Vite-/Lockfile-/Konfigurationsbasis aus eigenen SHAs hergestellt sein; der Prüfer erzeugt selbst keine Builds und greift nicht in geschützte Branches ein.

## Nachgewiesener Blocker der lokalen Browserumgebung

Ein synthetisches, korrekt fingerprint-verifiziertes HTML-/JS-Testbuild wurde im aktuellen Container zur Prüfung des echten Chromium-Protokollstarts verwendet. Chromium 144.0.7559.96 startet und sein DevTools-Protokoll lässt sich ansprechen; Page.navigate verweigert jedoch den lokalen Prüfserver mit dem exakten Fehler net::ERR_BLOCKED_BY_ADMINISTRATOR. Das ist **eine Umgebungsrestriktion, kein MID-Produktfehler und keine bestandene Browser-Abnahme**. Der Prüfcode wurde daraufhin korrigiert: Jeder Page.navigate-Fehler bricht sofort ohne A/B-Bericht ab. Die Beschränkung wurde nicht umgangen; kein Proxy, kein unsicherer SSH-Fallback, keine Administrationsausnahme.

Die eigenständige Policy-Auswertung wurde unter Node 22 syntaktisch geprüft und mit positiven und negativen synthetischen Varianten ausgeführt; sechs zusätzliche Vitest-Fälle liegen als registrierte Unit-Tests vor. Ein vollständiger realer Browser-Lauf im GitHub-CI-Kontext, dessen Browser lokalen HTTP-Zugriff erlaubt, muss separat nachgewiesen werden. Ein positives Synthetic-Mock-Ergebnis wäre kein echter MID-App-Test.

## Wissenschaftliche und Release-Grenzen

Die Wetter-Requests sind **nicht durch eine identische, provenienzgebundene Antwort-Fixture eingefroren**. Auch bei identischem Testort und Chromium-Build darf ein vorliegendes Laborpaar keine echte kausale Performance-Einsparung belegen. MapLibre-Canvas-Sichtbarkeit ist nicht meteorologische Layerbereitschaft, eine Labor-Interaktionsmarke ist nicht INP, und Runtime.getHeapUsage ist kein GPU-/Browser-/iOS-RAM. Noch fehlen randomisierte Wiederholungen, 20-Zyklen-Post-GC, CSSOM-Computed-Style-/Kaskadenparität, Save-Data/2G, Original-Provider-Latenz, PWA-Offline, Responsive-Matrix 320–1440, native WebKit/iOS/VoiceOver und alle obligatorischen Source-/Core-/Heavy-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates.

Keine aktive CSS-Umschichtung, keine Änderung meteorologischer Werte, Datenlücken, WMO-/DWD-Warnungen, RUC, Governance, Verträge, Secrets, Versionsspiegel, Abonnements oder Release-Workflows. #740/#839 bleibt außerhalb des Design-Auftrags. Kein Ready, Merge, Deploy oder Stable-Promotion aus diesem QA-Draft.

Offizielle technische Referenzen: https://chromedevtools.github.io/devtools-protocol/tot/Runtime/ · https://chromedevtools.github.io/devtools-protocol/tot/Input/ · https://vite.dev/guide/features.
