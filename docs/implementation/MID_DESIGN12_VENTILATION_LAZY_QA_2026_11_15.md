# MID Design 1.2 – Lüftungsassistent bedarfsgesteuert laden (QA-Draft)

**Status:** Isolierter, noch nicht veröffentlichter Performance-Kandidat. Ausgangsbasis am 15.11.2026: `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc`, Version `v0.9.85.483`, fünf aktive GitHub-Rulesets. Die `.485` im Branch-Namen ist nur die nächste mögliche Kandidatennummer. **Kein Build, kein Release, keine Versionserhöhung und keine Stable-Promotion.**

## Befund und gezielte Umsetzung

`src/App.tsx` importierte die optionale `VentilationAssistantPanel`-UI statisch, obwohl das eigene `CollapsibleModule` per Default geschlossen ist und seine Kinder erst bei `expanded` rendert. Der React-Panelquelltext hat ungefähr 4.090 Zeichen; daraus lässt sich **keine** belastbare Produktions-KB-Ersparnis ableiten, weil Bundler-Komprimierung und gemeinsame Abhängigkeiten entscheidend sind.

1. App rendert die unverändert benannte React-Komponente nun per `lazy(()=>import('./VentilationAssistantPanel')...)` in einer bestehenden `Suspense`-Struktur. Erst beim tatsächlichen Aufklappen oder bewusst gespeicherten Offenzustand wird der Code benötigt. Der Ladeplatzhalter hat `role=status` und `aria-live=polite`.
2. Die bereits vorhandene Offline-Shell des Vite-Builds nimmt den neuen asynchronen Panelchunk mitsamt seinen Abhängigkeiten in dieselbe `rel=mid-offline`-Logik wie den `SystemUpdateManager` auf. **Keine Ausführung beim Start**, aber Download-/Cacheaufnahme für Offlineverfügbarkeit, sofern die etablierte Service-Worker-Pipeline erfolgreich abgeschlossen ist.
3. `tests/unit/mid-ventilation-on-demand.test.ts` prüft vier unveränderte Verträge: keine statische Panelbindung, nur Rendering bei geöffnetem Modul, bewährte Offline-Shell-Aufnahme, unberührte Lüftungs-/Sensorlogik und Event-Cleanup. Zusätzlich wurde der **bestehende verbindliche** `scripts/test-ventilation-assistant-095345.mjs` mit positiven Lazy-Import-/Render-/Suspense-/Statussemantik- und negativen Eager-Import-Prüfungen verstärkt; sämtliche Netatmo-/Worker-/Push-/Fachtests bleiben bestehen. Die erste gezielte CI zeigte vor dieser Anpassung einen erwarteten alten statischen Render-Token-Fail; das fachliche Gate wurde **nicht entfernt oder übersprungen**.
4. Keine Veränderungen der Forecast-/Warn-/DWD-/NoData-/Netatmo-Berechnung, Einstellungen, CSS-Kaskade, Touchgrößen, Navigations-/Persistenzregeln und bestehenden Gefahrentexten.

## Methodik und Nachweisgrenzen

- Vite dokumentiert, dass asynchron importiertes JS und CSS in eigenen Chunks geladen werden können. **Die tatsächliche initiale JS-Reduktion, Cachekosten, TTI/LCP/INP, Netzwerk-Roundtrips und gzip-/Brotli-Größen sind durch statische Quellinspektion NICHT nachgewiesen.** Eine Offline-Shell-Prefetch-Datei zählt nicht als direkt referenziertes Startup-JS; sie verursacht dennoch einen späteren Cache-/Netzwerkbedarf.
- Die positive Entscheidung über einen Release setzt eine SHA-verifizierte **vergleichende Produktionsbuild-Messung** (Stable vs. Kandidat), erfolgreichen TypeScript- und Vite-Check, die allgemeinen Source-/Core-/Heavy-Gates, einen echten Offline-First-Load-/Offline-Reopen-Test sowie Light/Dark- und Responsive-Browser-/iOS-Abnahme voraus. Keine automatische Grenzwerterhöhung, kein CSS-Split außerhalb der Komponente.
- Vor Integration in den zwischenzeitlich laufenden LC-1.7-Release-Train #833 (dessen `src/App.tsx` parallel verändert wurde): **nicht blind überschreiben!** Nur das genau begrenzte Import-/Lazy-Render-Diff mit Konfliktprüfung auf den aktuellen kontrollierten Integrations-HEAD übertragen. Die Vite-Offline-Erweiterung ist ebenfalls gegen sämtliche aktualisierten Bundle- und Service-Worker-Verträge zu prüfen.

## Referenzen

- Vite – CSS Code Splitting: https://vite.dev/guide/features.html#css-code-splitting
- Vite – `build.cssCodeSplit`: https://vite.dev/config/build-options#build-csscodesplit
- MID Source of Truth: `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`, `MID_UI_ARCHITECTURE_CONTRACT.md`
- Release-Train: https://github.com/MeteoMartini/MID/pull/833

**Keine automatische Merge-, Installer-, Worker-, Pages- oder Stable-Freigabe.**