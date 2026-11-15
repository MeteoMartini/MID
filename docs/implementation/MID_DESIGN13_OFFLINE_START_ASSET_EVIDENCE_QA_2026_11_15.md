# MID Design 1.3 – SHA-gebundene Offline-Shell-Asset-Evidenz (QA DRAFT)

**Status:** Read-only Diagnosekandidat, kein neuer Build/Release; kein Source-/Installer-/Worker-/Pages-/Stable-Gate ersetzt. Branch `chatgpt/v0.9.85.485-offline-startasset-evidence-qa` auf verifiziertem Stable/Main `c9fadfcd0969e949a92f414b321627dd3d4fb0cc`, Version `0.9.85.483`, fünf aktive Rulesets. Kein laufendes Design-/Karten-/Leitchat-Paket an diesen vier Pfaden überschrieben (letzter Abgleich vor Branch-Erstellung).

## Zweck und Semantik

MID setzt in `vite.config.ts` für deferred Module ein eigenes `rel=mid-offline`-Attribut im gebauten HTML. Der bewährte Service-Worker-Shell-Pfad soll deren Chunks für Offline-Nutzung bereitstellen. Das ist **kein** HTML-`modulepreload` und kein Beleg, dass alle Assets beim ersten UI-Start geladen/evaluiert werden. Das bisherige Start-JS-/CSS-Budget zählt die initialen HTML-Module und Stylesheets; der Offline-Shell-Anteil wurde noch nicht gesondert ausgewiesen.

Die neue Funktion `scripts/lib/offlineShellAssetEvidence.mjs` verarbeitet nur die ursprünglichen `rel=mid-offline`-Referenzen aus `dist/index.html` und die vollständige gebaute JS-/CSS-Inventarliste, erfasst deduplizierte Roh-/gzip-Bytes sowie CSS-Brotli und unterscheidet **gesamt / Überschneidung mit HTML-Start / nur Offline-Shell**. Alle referenzierten Dateien müssen vorhanden und metrisch vollständig sein; fehlende Links, externe oder mehrdeutige Pfade, fehlende Kompressionswerte und kodierte Traversal-Segmente führen fail-closed zu einem Fehler, niemals zu einem künstlichen Nullbericht.

Die bestehende read-only Messung `scripts/measure-startup-assets-0985482.mjs` wird um `offlineShell` im JSON-Bericht und drei summarische Konsolenkennzahlen erweitert. **Zuvor** bleibt die bestehende unveränderte SHA-256-Buildidentitäts- und Versionprüfung verpflichtend; erst danach schreibt der Messpfad den Bericht in `artifacts/`.

## Geltungsgrenze und technische Dokumentation

- Vite 8.3.5 dokumentiert, dass dynamisches CSS bei `cssCodeSplit:true` zusammen mit dem asynchronen Chunk geladen wird, während initiale `modulepreload`-Links aus Startimports generiert werden. Referenz: https://vite.dev/guide/features.html und https://vite.dev/config/build-options.html
- `rel=mid-offline` ist ein MID-eigener Installationshinweis, keine standardisierte Browser-Preload-Pflicht. **Offline-only Bytes dürfen nicht als Startnetztransfer, ausgeführtes JavaScript, Renderblocker, reale Cache-Bytes oder Downloadersparnis interpretiert werden.** Service-Worker-Lebenszyklus, Kalt-/Warmcache, FCP/INP/CLS und physische Geräte werden separat getestet.
- `tests/unit/mid-offline-shell-asset-evidence.test.ts` prüft Deduplikation/Overlap/NoData/Encoding/fehlende CSS-Kompression und gültige Query-Referenzen. Der Vitest-Pilot erfasst die neue Testdatei automatisch. Eine Aufnahme in dauerhaftes Core-/Heavy-Regressionstestinventar ist erst beim selektiven Leitchat-Import auf finalem Versions-SHA zu entscheiden; bestehende Inventare/Gates werden **nicht** abgeschwächt.
- Der neue Bericht ist rein additiv; die bisherigen `schema: mid.static-startup-assets.v1`, `js`, `css` und `provenance` bleiben unverändert. Es werden keine harten Budgets, Startup-/Service-Worker-/Wetter-/Warn-/RUC-Produktpfade geändert.

## Abnahme und Integration

Synthetische Positiv- und Negativfälle prüfen die Berechnungsregeln. Vor einem belastbaren Bytes-/Performance-Urteil sind ein echtes, vollständig SHA-geprüftes `dist` mit bisheriger und neuer Version, Verifikation des Service-Worker-Cachemanifestes, mobile Browser (320/390/430/834/1024/1440 Light/Dark), echtes iOS/VoiceOver und vollständige Source-/Core-/Heavy-/Security-/Review-/Installer-/Worker-/Pages-/Stable-Gates erforderlich. Keinen PR unabhängig vom MID-Leitchat mergen oder als Release ausgeben.
