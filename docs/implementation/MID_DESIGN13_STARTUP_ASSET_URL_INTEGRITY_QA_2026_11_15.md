# MID Design 1.3 – Start-Asset-URL-Integrität (QA-Draft, kein Release)

## SHA-gebundene Quelle und Zuständigkeit

- Authoritative Grundlage vor dem Schreiben: `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc` / `v0.9.85.483`; alle fünf Branch-Rulesets aktiv.
- Isolierter Kandidat: `chatgpt/v0.9.85.485-startup-url-integrity-qa`, ausschließlich QA-Draft; kein produktiver `.485`-Build und keine Versions-/Vertragsspiegel-Änderung.
- LC 1.7 / #833 integriert bereits Ventilation-Lazy (#834), CSS-CDP (#831) und CSS-Ownership (#826). Keine dieser Dateien wird hier nochmals angefasst. Kein GitHub-/Release-/CI-Ruleset-Write.

## Reproduzierbarer Originalfehler

Der WHATWG-URL-Parser normalisiert dot-segments bereits beim Konstruktoraufruf. Beispiel: `new URL('./%2e%2e/assets/index.js', 'https://mid-local.invalid/').pathname === '/assets/index.js'`.

Die ursprünglichen JS- und CSS-Startbudget-Funktionen prüften den nach Normalisierung entstandenen Pfad. Eine URL wie `./%2e%2e/assets/index.js` konnte dadurch fälschlich als vorhandenes `assets/index.js` akzeptiert und in einem Budget als gültige lokale Referenz gemeldet werden. Der vollständige SHA-verifizierte Dist-Fingerprint bleibt erforderlich und unverändert, ersetzt aber keine Prüfung der tatsächlich referenzierten URL-Semantik.

## Minimalinvasive Korrektur

1. `scripts/lib/startupAssetEvidence.mjs`: den ursprünglichen Pfadanteil vor `new URL()` percent-dekodieren, ungültige Escape-Folgen ablehnen und `..` beziehungsweise innere `.`-Segmente vor der Normalisierung sperren. Bestehende Regeln zu externen URLs, kodierten Slashes/Backslashes, Dateiverfügbarkeit, Querys und Deduplikation bleiben erhalten.
2. `scripts/lib/initialCssBudget.mjs`: denselben fail-closed Dot-Segment-Check für direkt referenziertes Start-CSS ergänzen; ursprüngliche komprimierte/unkomprimierte Budgetberechnung, Grenzen und Deduplikation bleiben unverändert.
3. Bestehende registrierte Regressionen `scripts/test-startup-asset-evidence-0985482.mjs` und `scripts/test-initial-css-budget-contract-0985351.mjs`: gezielte Negativtests für kodierte `..`-/`.`-Segmente, doppelte Punkte in anderer Schreibweise, Raw-Traversal, Slashes und Backslashes; gültige lokale Referenzen mit Query bleiben zulässig.

## Test-/Abnahmegrenzen

- Es handelt sich um eine rein deterministische Asset-URL-Integritätskorrektur, **keine** CSS-Löschungs- oder Lazy-Auslagerungsfreigabe.
- Ein bestandener Source-/Unit-Test auf diesem Draft belegt keine Änderung der initialen JS-/CSS-Bytezahl, keine FCP/LCP/INP-Verbesserung, keine produktive Offline-PWA-Abnahme und keine Browser-/iOS-/VoiceOver-Freigabe.
- Ein finaler Integrations-SHA muss nach Merge aller ausgewählten Spezialpakete dieselben Negativtests und vollständige Source/Core/Heavy-/Browser-/Review-/Security-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates durchlaufen.
- Ein verifizierter Produktionsbuild oder eine tatsächliche Release-Promotion wird hier **nicht** ausgelöst oder behauptet.

## Nächster Schritt für den Leitchat

Den isolierten Diff gegen den neuesten SHA von #833 prüfen und nur nach dokumentiert grünem QA-Readback selektiv übernehmen. Die bisherigen Release-Gates bleiben unverändert; `main` und `mid-stable` sind ausschließlich Ziel des vorhandenen kontrollierten Releasepfads.
