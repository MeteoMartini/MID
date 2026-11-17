# MID Design 2.0 – Dashboardmodul-Reihenfolge: reversible Touchgeste

**Stand 17.11.2026 · QA-SOURCE-DRAFT · keine Veröffentlichung**

## Unveränderliche Basis und Scope

- Vor jedem Schreiben: `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953`, veröffentlichte Version `0.9.85.488` in `package.json`, `MID_BASELINE.json`, `contracts/index.json`, fünf aktive Rulesets. `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md` geprüft.
- Originalblobs: `src/DashboardModuleSettings.tsx` = `c58d78b17ca6d73ee5becf946aa728f305fa0c45`; `scripts/test-dashboard-touch-c55.mjs` = `38ce78c8f45efb7073d0a3a0b9282c1d635d3e65`.
- Vor Integration #868 (verändert `App.tsx`, aber diese zwei Pfade nicht), #815, #896, #891, #893, #828 und weiteren Design-/Karten-Spezial-PRs gegen Überlappung geprüft. Der Auftrag verändert keine globalen Navigationstabellen, CSS-Bundles, gespeicherte Schlüssel, WMO-/DWD-Daten, Warnstufen oder Meteorologielogik.
- Dieses Arbeitspaket **ändert keinen Build/Versionsspiegel**. Es ist ein Feature-QA-Draft, keine Version .489, kein Merge und keine Promotion.

## Befund aus der veröffentlichten Originalkomponente

Die Touch-Reorder-Engine hat bisher bei jedem per `requestAnimationFrame` erreichten Ziel bereits `commitMove` ausgeführt, welches über `onChange` sofort `writeDashboardModuleSettings` aufruft. Damit konnten vor einem späteren `pointercancel`/Verlust des Pointer-Captures bereits dauerhafte Reihenfolgenänderungen plus `mid:dashboard-modules`-Broadcasts entstehen. Ein einzelner langsamer Ziehvorgang über mehrere Zeilen erzeugte ggf. mehrere persistente Updates, obwohl erst ein Loslassen die Aktion bestätigen sollte. Außerdem verwarf `pointerMove` ein Zurückkehren über die Quellzeile oder außerhalb einer Zielzeile, statt das alte Ziel explizit zu verwerfen; Loslassen konnte daher ein nicht mehr aktuelles Ziel übernehmen.

Dies ist ein **aus Codepfad und Gestenfolge nachweisbarer Zustandsfehler**, kein behaupteter Pixel- oder Messwertbefund.

## Eng begrenzte Korrektur

1. Touch-Drag zeigt im rAF nur die `drag-over`-Zielvorschau. **Keine** `onChange`-, Storage- oder Geräte-Sync-Änderung im Bewegungsframe.
2. Exakt **ein** `commitMove` erst auf gültigem `pointerup` mit echtem Ziel; `pointercancel`, Capture-Verlust oder Unmount verwerfen die Bewegung vollständig.
3. Quellzeile, unbekannte Modul-ID oder Verlassen der Liste setzen das temporäre Ziel auf `null`. Kein stale Ziel beim Loslassen.
4. Native Desktop-Drag-and-Drop bleibt erhalten, `onDrop` committed wie bisher einmal und räumt die Touchvorschau explizit ohne zweiten Commit auf.
5. Pfeil-Buttons, Tastatursteuerung und Live-Ansage unverändert; 44px-Touchflächen und responsive Grid bleiben unverändert. Keine neuen DOM-Elemente, Netzwerkaufrufe, Timer oder langfristigen Speicher-Keys.

## QA-Nachweise / Gating

Bestehenden Regressionstest `scripts/test-dashboard-touch-c55.mjs` gezielt erweitert: nach bereits ausgeführtem rAF weiterhin 0 Schreibvorgänge; sichtbar markierter Ziel-Drop; Abbruch nach Preview ohne Änderung; Finger zurück auf Quellzeile; außerhalb der Liste; bestätigtes `pointerup` genau ein Commit; bestehende Keyboard-Arrows und Cleanup-Gates unverändert. GitHub-Draft-CI am **exakten PR-HEAD** und unabhängiger Git-Blob-Readback erforderlich; nach selektiver LC-Integration zusätzlich Core/Heavy/Review und vollständiger Releasepfad.

Browser-/Touch-Abnahme vor Promotion: 320/390/430px und Tablet-Portrait/Landscape; Light/Dark/High Contrast; langsames Ziehen über mehrere Module, Fingerbruch durch Benachrichtigung/Scroll, pointercancel, PointerCapture-Lost; Maus-HTML5-Drop, Tastatur-Pfeile, reduzierte Bewegung; nach Reload, Device-Sync und zwei parallelen Einstellungen keine unbeabsichtigte Persistenz. Reale iOS-/VoiceOver- oder Performance-/INP-Messungen werden von diesem Quelltest **nicht** vorgetäuscht.

Normative Einordnung: [WCAG 2.2, 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements), [WCAG 2.2 2.5.8 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [HTML Drag-and-Drop (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API).

## Korrektur zum vorläufigen Settings-Menü-Befund

Eine anfängliche Sichtungsannahme, Gesundheitswetter-Schalter im `navigation`-Tab würden unter einer versteckten Primärsektion liegen, war **falsch**. Die drei Toggle-Gruppen sind im Original-`App.tsx` **nach** `</section>` als direkte Kinder von `settings-split-navigation` angeordnet; `scripts/test-health-settings-primary-navigation-0985130.mjs` schützt exakt diese Einbettung. **Es erfolgte dazu keine CSS-Änderung.** Dieser Draft behandelt stattdessen ausschließlich den unabhängig nachgewiesenen Touch-Zustandsfehler.
