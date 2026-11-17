# MID Design 1.9 – Appweite Dialog-Fokusberechtigung (QA + isolierter Source-Handoff)

**17.11.2026 · DRAFT / NO READY / NO MERGE / NO RELEASE.**

## Quelle und parallele Arbeiten

- Aktueller verifizierter Ausgangs-Stable `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486 synchron in `package.json`, `MID_BASELINE.json`, `contracts/index.json`; fünf aktive Branch-Rulesets. Verbindliche `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md` und `MID_CROSS_PLATFORM_CONTRACT.md` geprüft.
- Der parallele Leitchat-Integrations-Draft [#868](https://github.com/MeteoMartini/MID/pull/868) bearbeitet **`src/AppPortalPopover.tsx` selbst** (Original-HEAD beim Abgleich `4335df74ca7b8d717eaa2b945be3d9cf9cb61ac5`, Änderung: bereits innerhalb des Dialogs liegenden Fokus bewahren; Popover-Position sofort in `useLayoutEffect` kalkulieren). **Diese Datei wird bewusst NICHT parallel verändert.** Karten-/14d- und Security-PRs unberührt.
- Dieser Spezialkandidat liefert nur die neue selbstständige Funktion `src/appLayerFocusEligibility.ts`, eine Vitest-Datei und dieses Dokument. GitHub-Readback muss exakt die drei neuen Pfade bestätigen. Bestehende App nutzt die neue Funktion **noch nicht**. Das ist keine behauptete produktive A11y-Korrektur.

## Reproduzierbarer Quellbefund

Auf dem verifizierten Stable und im aktuellen #868-HEAD ist der generische `APP_FOCUSABLE_SELECTOR` breiter als die tatsächliche natürliche Tab-Sequenz; `appFocusableElements` berücksichtigt beispielsweise `tabindex="-2"` nicht, `tabindex="-1"` auf Buttons wird durch den Button-Selektor erfasst, nur das eigene statt eines geerbten `aria-hidden` wird geprüft und `getClientRects().length>0` weist keine sichtbaren Pixel nach. Zudem kann das erste `[autofocus]`-Element selbst unsichtbar sein. Bei Dialogen aus allen App-Modulen können dadurch falsche First-Focus-/Tab-Wrap-Ziele entstehen.

## Lösung für selektive Integration in den Leitchat

Die neue reine `appLayerFocusEligible(facts, allowProgrammatic)` trennt natürlichen Tab-Fokus von explizit programmgesteuertem Autofokus. Der dünne `appLayerFocusEligibleElement(element, allowProgrammatic)`-Adapter prüft den aktuellen DOM- und CSS-Zustand: Browser-`tabIndex` (einschließlich beliebiger negativer Werte), nativ deaktiviert inkl. disabled fieldset via `:disabled`, `[inert]`-/`[aria-hidden="true"]`-/`[hidden]`-Vorfahren, positive sichtbare ClientRect-Fläche und berechnetes `display`/ `visibility`. Es gibt **keine** globale Event-Engine, kein Polling, keine neuen Listener und keine Änderung von Zuständen oder Wetterdaten.

**Leitchat-Integrationsanleitung (nicht in diesem PR ausgeführt):**

1. Die neue Policy und Tests unabhängig verifizieren, auf den jeweils **aktuellen** LC-HEAD selektiv übernehmen, nicht den alten Spezial-Branch mergen.
2. Im bereits vom LC bearbeiteten `AppPortalPopover.tsx` die ursprüngliche `appFocusableElements`-Filterfunktion durch `.filter(element=>appLayerFocusEligibleElement(element))` ersetzen. `[autofocus],[data-mid-autofocus]` nur mittels `.find(element=>appLayerFocusEligibleElement(element,true))` wählen – explizites `tabindex=-1` bleibt für Sichtbares zulässig.
3. Die neuere LC-Logik zum Erhalt bereits innerhalb des Layers gesetzten Fokus und `useLayoutEffect`-Positionierung **unverändert erhalten**.
4. Detaillierte Browser-E2E-Negativtests an echten Dialogen in Aktuell, Heute, Vorhersage, Karten und Mehr: sichtbarer First-Focus, vorwärts/rückwärts Tab, versteckte/disabled/roving Elemente, Escape, verschachtelte Dialoge, Trigger-Focus-Restore, 320/390/430/834/1024/1440px, Light/Dark/Hochkontrast, Softwaretastatur und Scroll. Native iOS/VoiceOver separat. Keine Test- oder Gate-Abschwächung.

## Beweisgrenzen und Performance

Die neuen Unit-Tests beweisen die Policy-Entscheidungen samt negativer Fälle; synthetische DOM-Adapter-Prüfungen sind **kein echter Browser**. `opacity:0` bei Vorfahren, CSS-Animationen/Overlays, dynamische Fokusreihenfolge, Screenreader und virtuelles Keyboard erfordern weitere Browser-/iOS-Nachweise. Der Helper ist nur beim Öffnen eines Dialogs oder bei Tab-Key-Handling aufzurufen; keine Arbeit in Animations-, Resize- oder Scroll-Frames. Im jetzigen isolierten Spezial-Draft hat er **0 produktive Start-/Laufzeitkosten**, weil noch nicht importiert. Der künftige reale Browser-Lauf muss eventuelle Fokus- und Performance-Regressionsfreiheit unabhängig nachweisen.

**Sicherheits- und Freigabegrenze:** Source/Core/Heavy/Review/GitHub-Source-PR-Gate, serverseitiges ZIP, `install-mid.yml`, Worker/Pages und Stable-Promotion erst im vollständigen SHA-gebundenen Leitchat-Train. #740/#839 bleiben beim Release-Spezialchat. Weder CSS-Budget noch WMO-/DWD- oder Meteorologielogik betroffen.

Normative Anker: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum ; https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html ; https://www.w3.org/TR/wcag/ .
