# MID Design 1.12 · Dashboard-Modulreihenfolge: Status für alle Eingabemethoden

**20.11.2026 · QA-Draft P2 · keine Veröffentlichung**

## Live-Provenienz
- Basis: `main=mid-stable=1592963e12688af4b2f8c74f933033235849dcb7`, v0.9.85.498, drei Versionsspiegel synchron, fünf aktive GitHub-Rulesets. Aktiver #962-Leit-Intake für .499 und #959-Settings-Intake geprüft.
- Originaler Produktblob: `src/DashboardModuleSettings.tsx=3f658446c59b520220060469c85492f0f482bbf9`.
- Unabhängige Original-Regression: `scripts/test-dashboard-touch-c55.mjs=f772308f1bc250aba5113f2d8894e579e6e9e0a3`.
- **Keine Dateipfad-Überschneidung mit #962 oder #959**, keine Änderung an Wetterdaten, Settings-Storage, Orderschema, Warnungen, Worker, CSS-Aggregaten oder Releases.

## Belegter sichtbarer/assistiver Unterschied
Bisher kündigte der vorhandene `role=status` nur Positionsänderungen durch Pfeilschaltflächen an; dieselbe semantische Aktion via native Desktop-Drop oder Touch-Pointerup blieb stumm, obwohl sie die Reihenfolge tatsächlich speicherte. Der Reset meldete seine Wirkung ebenfalls nicht.
Die neue Implementierung konzentriert die Positionsrückmeldung in der **bestehenden** `commitMove`-Funktion: nur für gültige Änderungen, genau ein funktionales `onChange`, mit Position im Array und Anzahl der Module. Dadurch melden alle drei Eingabewege (Pfeilschaltfläche, Mausdrag, Touchdrag) dieselbe Veränderung. Die Reset-Aktion gibt den wiederhergestellten Zustand ebenfalls bekannt. `aria-atomic` und eine korrigierte Beschriftung unterscheiden die wirklich vorhandenen Pfeil**schaltflächen** von nicht implementierten Arrow-Key-Tastaturkürzeln.
- Keine neue Event Engine, Timer, rAF-Schleife, Netzabfrage, Persistenz oder Markup-Wrapper.
- Rückwärtskompatibles Drag-Preview-/Cancel-/Lost-Capture-/Unmount-Verhalten bleibt unangetastet.
- Der befürchtete Touch-Target-/Tiny-Text-Fehler der **frühen** CSS-Datei ist in der *finalen* 68-Quellen-Kaskade bereits korrigiert: `.dashboard-module-order-actions button` ist endgültig 44×44 CSS px und Beschreibungstext verwendet `--mid-text-xs`; **keine redundante CSS-Änderung**.

## Qualität
- Quelltest `scripts/test-dashboard-touch-c55.mjs` um getrennte Ereignisassertions für Touch-Drop, nativen Maus-Drop, Reset, List-Instruktion und atomic status erweitert; alte Assertions zu einmaliger Mutation, Drag-Preview, Cancel/Unmount und Tastaturpfeilbedienung bleiben.
- Vor Aufnahme Final-SHA mit `node scripts/test-dashboard-touch-c55.mjs`, weiteren Settings-/PWA-/Responsive-Verträgen, TypeScript/Vite/Vitest, MID Source/Core/Heavy/Review. Browser E2E 320/360/390/430/834/1024/1440 CSS-px, Light/Dark/High Contrast, 200%-Text, realer Tastatur-/Touch-/Mouse-Interaktion und tatsächlichen Statusansagen mit Screenreader. Chrome- oder Simulator-Screenshots sind **keine** native VoiceOver-Abnahme.
- Fachquelle: [WAI-ARIA APG: Rearrangeable Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/) (Live-Regionen für Bestätigung), [WCAG 2.2 2.5.7/2.5.8](https://www.w3.org/TR/WCAG22/) (nichtziehende Alternative, Zielgrößen). Das vorhandene native Pfeilbutton-Alternativbedienkonzept bleibt erhalten.
- Release erst nach LC/LW Source-PR-Gate → SHA-gebundener Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages → Stable-Promotion; dieser Draft ist **NO READY / NO MERGE / NO RELEASE**.

## Priorität
P0 #962/#957 erfolgreich durch Releasepfad und Browser-Abnahme führen. P1 #959-Settings-Mount erst bei intakter State-/Focus-/Browserparität integrieren, eventuell nach .499 Stable neu basieren. Dieser unabhängige P2-Fix kann bei nächstem geeigneten Design-Train separat aufgenommen werden; nicht als Blocker für #962 oder RUC ausgeben.
