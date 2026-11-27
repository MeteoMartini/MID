# MID Design 2.0 · P1 produktiver Settings-Tab-Split + P2 abgesicherte Altansichten

**2026-11-18 · QA-Integrationskandidat, kein Release · Source of Truth MID**

## Aktueller Intake für v0.9.85.500 (21.11.2026)

Dieses Dokument archiviert die frühere .489/.490-Qualifikation; **sie ist nicht die aktuelle Source-/Release-Basis**. Maßgeblich ist der neue LC-Sammel-PR [#965](https://github.com/MeteoMartini/MID/pull/965), entstanden auf der veröffentlichten v0.9.85.499 (SHA `43759c68d001e5c8e6409f6ef2916a6610bbbad4`). Der ursprüngliche .500-Integrations-HEAD ist `f9b555801721db9c017e462e072e31c5f6c0c4aa`; vor Merge entscheidet **immer der aktuelle GitHub-PR-HEAD**, der nach Reviewkorrekturen fortgeschrieben wird. Der isolierte Original-Settings-Manager blieb gegenüber der damaligen Quelle bis .499 byte-identisch; nur dessen 301-Zeichen-Gating wurde übertragen, während die neuere .499-Ortscache-Provenienz im übrigen `App.tsx` erhalten blieb.

Auch #963 (Dashboard-A11y) ist in #965 gebündelt. Der bereits erfolgreiche Source-Gate-Lauf auf dem ursprünglichen HEAD ist nach jeder neuen Änderung **erneut** gegen den finalen HEAD auszuführen. Der MID-Bot-Release aus Run [44880357696](https://github.com/MeteoMartini/MID/actions/runs/44880357696) wurde wegen offener Reviewthreads korrekt angehalten. Weder dieser historische Text noch gezielte Tests sind eine unabhängige Browser-/iOS-/VoiceOver-/Installer-/Stable-Freigabe. Das gesonderte RUC-Produktionsproblem #541 bleibt offen.

## Historische Verifizierte Basis (18.11.2026; kein aktueller Release-HEAD)

GitHub `MeteoMartini/MID`: `main=mid-stable=5fe79b03852a7464b4a510813920c1965d8ee0d0`, Version `v0.9.85.489` synchron in `package.json`, `MID_BASELINE.json`, `contracts/index.json`, fünf aktive Branch-Rulesets. `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md` und Bottom-Bar-/State-Integriätsverträge bleiben bindend. Der Original-Git-Blob `src/App.tsx=d5fd0cee5c6cf8df187f3493c864d136ab11bcd9` war **auch nach Veröffentlichung von .489 unverändert**. `.488 → .489` änderte keine der vom bestehenden QA-Split verwendeten App-/Ansichtsdateien. Der LC-Train #918 für .490 besitzt `src/DashboardModuleSettings.tsx`, nicht `src/App.tsx`; dieser Spezialbranch wurde ohne Änderung an #918 neu auf Stable .489 gegründet.

## P1: tatsächlicher Produktcode, nicht mehr nur ein Patchplan

Der von Design-PR #906 geprüfte, blobgebundene Algorithmus `scripts/qa/design20SettingsTabSplit.mjs` wurde mit **exakten** elf JSX-Hunk-Markern plus zwei Spezialgates auf dem identischen Originalblob angewandt. `src/App.tsx` verändert sich um **+301 Zeichen**, Git-Blob des Vorschlags `8cf36a32970c98206f653df9a79214777fafdf93`. Unverändert bleiben alle neun Tabs `view,weather,navigation,units,favorites,notifications,quality,sync,system`, ihre individuellen Event-Handler, angezeigten Wetterwerte, CSS-Klassen, Zustandsspeicher und Runtime-Abhängigkeiten. Nur das Mounting der vier zuvor gemeinsam instanziierten Registerkarten wird anhand des aktiven Tabs bedarfsgesteuert begrenzt:

- Ansicht: Standard/Erweitert, Dichte, Favoritenstreifen, Theme, Branding.
- Wetter: Prognosekonfidenz, Skybar und Wetterdarstellungsoptionen, erweiterte Wetteroptionen.
- Navigation: `DashboardModuleSettingsPanel` nur im Tab Navigation.
- Einheiten: Lokal-/Z-Zeit und die echten Einheitensteuerelemente.
- Das fachlich gemeinsame `settings-primary-options`-Element bleibt bei **Ansicht oder Wetter** erhalten.
- Weitere Tabteile außerhalb dieser 13 markierten Gruppen und sämtliche inaktive-tab-übergreifenden Zustände werden **nicht** gelöscht oder verändert.

Damit wird nicht mehr nur außerhalb des sichtbaren Bereichs per CSS versteckt, sondern React muss die betreffenden unbenutzten JSX-Unterbäume nicht montieren. **Keine behauptete gemessene Performance-Ersparnis oder iOS-Abnahme**: React-Reconciler-, DOM-, Layout-/Accessibility- und echte 200%-Text-Messungen müssen auf dem final kombinierten Release-SHA stattfinden. Keine neuen Events, Hooks, Fetches, Stores oder Timer.

## P2: bei unveränderter Semantik sechs Legacy-Kandidaten schützen

Aus #906 übernommene, auf .489-Stable weiterhin anwendbare read-only Prüfer:
- `scripts/qa/verifyDesign20SettingsRouteOwners.mjs`: bestätigt nun **den tatsächlich implementierten** post-patch-Zustand, prüft 13 Tab-Gates und neun Settings-Routen.
- `scripts/qa/verifyDesign20ViewReachability.mjs`: acht produktive Ansichtsgruppen gegen Verlust geschützt; sechs bewusst als **vorläufig zu qualifizierend** eingeordnete Kandidaten werden nicht gelöscht: alte Schnellnavigation, Cockpit-Ribbons, Startup-Präferenz, Bottom-Bar-Vertragsabweichung Auto/Fixiert, historischer 24h-Präferenz-Migrationspfad (kein Test der produktiven 24h-Vorhersagewerte) und ungenutzter Parameterqualitäts-Punkt.

**Keine** automatische Bereinigung: Preloading, gespeicherte Favoriten/Settings/Backups, echte 24h-Vorhersagedaten, Karten-, Warn-/Unwetter- und Wetterzwilling-Pfade müssen erhalten bleiben. Ein Produktentscheid zu Bottom-Bar Auto/Fixiert bleibt beim Nutzer. Nicht sichtbarer `ParameterQualityIndicator` darf weder als bereits funktionierender Status dargestellt noch blind entfernt werden.

## P3/P4: Gate, Vorher-Nachher, Release

`tests/unit/mid-design20-settings-view-guards.test.ts` enthält vier Source-/TSX-Verträge: Acht aktive Ansichten + sechs Kandidaten; deterministische Post-Checks; neun echte Routen; **esbuild-Parse der gesamten 483-kB-`src/App.tsx` inklusive JSX-Gates** ohne Mock-Tree. Vorhandener Settings-/Lazy-/Forecast-Suite-Schutz bleibt: `scripts/test-settings-menu.mjs`, `scripts/test-lazy-optional-settings-0985483.mjs`, `scripts/test-forecast-design-visibility-0985415.mjs`. Die neuen QA-Helfer wohnen im `scripts/qa/`-Unterordner und erzeugen **keinen** nicht registrierten Root-`scripts/test-*.mjs`-Pflicht-Gate-Widerspruch.

Echte Browserabnahme auf dem **finalen Integration-SHA**: alle neun Tabs bei 320/360/390/430/834/1024/1440 CSS px, Landscape/Portrait, 200%-Text, Light/Dark/High-Contrast, Reduced Motion, Keyboard/Screenreader; jeweils Tab-Werte/Persistenz/Sync, DOM/Accessibility-Tab-Isolation, Touchziele, Focus-Restoration, Einheiten-/Wetter-/Warn- und Kartenbeständigkeit. Erst reale Vorher-Nachher-Messungen für mount-/DOM-Knoten, Browser-Longtasks, INP, Speicher und LCP beanspruchen. Native iOS WKWebView/VoiceOver gesondert abnehmen.

Originalnormen: React Conditional Rendering https://react.dev/learn/conditional-rendering ; React State Preservation https://react.dev/learn/preserving-and-resetting-state ; W3C WCAG 2.2 Reflow https://www.w3.org/WAI/WCAG22/Understanding/reflow.html ; WCAG Focus Not Obscured https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum ; meteoblue Android 2026 https://www.meteoblue.com/en/blog/article/show/40646_Android%2BApp%2BUpdate%3A%2BA%2BNew%2BInterface%2C%2BSame%2BDepth .

## Historischer Handoff an LC/LW (ursprünglicher .490-Kandidat)

**Historischer Stand vom 18.11.2026:** Dieser Branch war damals ein neuer, vom zu jener Zeit aktuellen .489-Stable abgeleiteter .490-Kandidat. Der ältere QA-only #906 wird nicht überschrieben; hier ist P1 erstmals tatsächlich im Produktcode umgesetzt und P2-Quellguard mitgeführt. LC/Work entscheidet SHA-gebunden, ob dieser PR in den *nächsten* train aufgenommen werden darf. Der bereits laufende #918 ist unabhängig und bleibt unverändert; das neue Produkt-Hunk darf ohne erneute Owner-/PR-/CI-/Hunk-Prüfung keinesfalls hineingeschrieben werden. Keine direkten `main`-/`mid-stable`-Writes, kein Merge/Dispatch/Release/Promotion und keine Degradierung der Source-PR-/Review-/Core-/Heavy-/serverseitiges ZIP-/Installer-/Worker-/Pages-/Stable-Schranken.

**Stand:** P1-Produktpatch und P2-Regressionen committed; vollständige CI und echte Browser-/Geräteabnahme beim finalen PR-HEAD ablesen, bevor bereit/integriert gemeldet wird.
