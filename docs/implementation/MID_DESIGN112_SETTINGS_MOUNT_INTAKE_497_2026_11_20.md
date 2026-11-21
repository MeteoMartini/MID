# MID Design 1.12 · Settings-Mount-Intake auf v0.9.85.497

**2026-11-20 · QA only – kein Ready, Merge oder Release.**

## GitHub-Provenienz
Verifizierter Ausgangsstand `main=mid-stable=9fd872a789f4b158bc691d085589616c2c04f776`, Version v0.9.85.497 in drei Spiegeln, fünf aktive GitHub-Rulesets; AGENTS.md, MID_SOURCE_OF_TRUTH.md, UI-/State-/iOS-/Bottom-Bar-Verträge gelesen.
Die produktive `src/App.tsx` hat im aktuellen Stable noch **denselben Eingangs-Git-Blob** `d5fd0cee5c6cf8df187f3493c864d136ab11bcd9` wie bei [QA-Draft #920](https://github.com/MeteoMartini/MID/pull/920). Deshalb wird der **identische geprüfte Original-Produktblob** `8cf36a32970c98206f653df9a79214777fafdf93` verlustfrei übernommen: nur 13 tabbezogene JSX-Gates (+301 Zeichen), keinerlei Wetter-, Warnungs-, Zeit-, Provenienz-, Persistenz-, Daten- oder CI-Code verändert.
Die weiteren Originalblobs (die beiden Verifier, aktualisierter Health-/Settings-Regressionsvertrag, Vitest-Quellguard und ursprüngliches Handoff) stammen ebenfalls direkt aus #920. Alle auf Stable .497 in den Guards erwarteten aktiven View-/Contract-Marker wurden geprüft. Einziger bewusst angepasster Altblob: `scripts/qa/design20SettingsTabSplit.mjs` erlaubt `--apply` ausschließlich auf autorisiertem `.497`-Agent-Branch statt `.490`. Dieses Werkzeug bleibt read-only ohne den expliziten `--apply`-Parameter und sichert weiterhin den exakten Original-Eingangsblob, den sauberen Git-Arbeitsbaum und Marker-Eindeutigkeit.

## Architekturwirkung
Vorher wurden im Einstellungen-Dialog auch inaktive Tabgruppen als JSX-Unterbäume montiert und per CSS versteckt. Danach mountet React nur die Gruppen des aktiven Tabs. Die neun Tabs `view/weather/navigation/units/favorites/notifications/quality/sync/system` samt Bedienelementen, Daten-/Event-Handlern, persistenten Schaltern, vorhandenen Wetteransichten und Quellen bleiben erhalten. Keine neuen Timer/Netzwerkabfragen/Portal-Engines.
**Keine unbelegte Performance-Aussage:** Die erwartete Reduktion aktiver DOM-Teilbäume muss mit einem unabhängigen gleichgeräteigen Vorher/Nachher-Browserbenchmark (DOM-Knoten, Commit-/Layoutzeit, Heap und Interaktionslatenz) gemessen werden.

## Qualifizierungs- und Integrationsbedingungen
- Exakter finaler PR-HEAD: alle bestehenden Unit-/Types-/Vite-Build-/Source-/Core-/Heavy-/Reviewprüfungen, einschließlich `tests/unit/mid-design20-settings-view-guards.test.ts`, `scripts/test-health-settings-primary-navigation-0985130.mjs`, `scripts/test-settings-menu.mjs`, `scripts/test-lazy-optional-settings-0985483.mjs`, `scripts/test-forecast-design-visibility-0985415.mjs`.
- Browser-E2E: alle neun Tabs 320/360/390/430/834/1024/1440 CSS-Pixel, Portrait/Querformat, Light/Dark/High-Contrast, 200%-Text, Keyboard/Touch, Dialog-Fokusrückgabe und Escape, Scrollposition, NoData und Favoriten-/Wertepersistenz. Browser-/Simulator-QA ist keine reale iOS-/VoiceOver-Abnahme.
- Nachweis vor Einordnung: originaler Blobvergleich und aktuelle `src/App.tsx`-SHA, kein Konflikt mit den parallelen Produkt- und Leit-PRs. Älteren [#920](https://github.com/MeteoMartini/MID/pull/920) erst nach erfolgreichem Intake konsolidieren/schließen, keine parallelen alten Bäume mergen.
- Integrationspfad ausschließlich über LC/LW: Source-PR-Gate, SHA-gebundener kontrollierter Merge, serverseitiges ZIP, `install-mid.yml`, betroffene Worker-/Pages-Gates und Stable-Promotion. Keine autonomen Releases.

## Priorität / Abgrenzung
[P0 Ensemble #957](https://github.com/MeteoMartini/MID/pull/957) hat sichtbaren Diagrammfehler und Vorrang. Dieser Settings-Intake ist ein unabhängiger **P1**-Kandidat, ohne Überschneidung zu `src/EnsemblePanel.tsx`. [P2 Linienparität #958](https://github.com/MeteoMartini/MID/pull/958) betrifft CSS, nicht `src/App.tsx`. Historische [#815](https://github.com/MeteoMartini/MID/pull/815)/alte LC-Drafts mit `src/App.tsx` dürfen nicht blind mit diesem SHA gemergt werden. [Fokus-Policy #891](https://github.com/MeteoMartini/MID/pull/891) bleibt unabhängig.
Referenzprinzipien: [Apple HIG Charts](https://developer.apple.com/design/human-interface-guidelines/charts) und [WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow), keine Vereinfachung von meteorologischen MID-Fachinformationen.
