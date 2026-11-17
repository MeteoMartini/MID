# MID Design 1.11 · Gemeinsame Info-Popover: eindeutige ARIA-Verknüpfung und stabile Dialog-Callbacks

**Stand: 17.11.2026 · Spezial-Draft / SHA-gebundener Handoff · NICHT RELEASEREIF**

## Provenienz und Eigentümerschaft

GitHub Source of Truth \`MeteoMartini/MID\`; \`main = mid-stable = 9fe4dfbcdfd5a1f8fec55efa868e22110a612953\` / Version \`v0.9.85.488\` über \`package.json\`, \`MID_BASELINE.json\`, \`contracts/index.json\`. \`AGENTS.md\`, \`MID_SOURCE_OF_TRUTH.md\`, \`MID_UI_ARCHITECTURE_CONTRACT.md\`, \`MID_CROSS_PLATFORM_CONTRACT.md\`, alle fünf aktiven Rulesets geprüft. Parallel-PR #902 besitzt Release .489, #906 besitzt Settings-/Ansichts-Ownership, #909 Ensemble-Detail-Reflow, #891/#868 untersuchen Focus-Layer/Portals; sie dürfen nicht blind zusammengeführt werden. Diese Änderung berührt **ausschließlich AppInfoPopover.tsx** und eigenständige QA-/Doku-Dateien, weder \`AppPortalPopover.tsx\` noch \`App.tsx\`, CSS, Wetterdaten oder Speicher.

## Problem und minimaler P3-Produktpatch

Die bisherige kanonische \`AppInfoHint\`-Primitive meldete \`aria-expanded\` und \`aria-haspopup="dialog"\`, jedoch keinen Bezug zum **tatsächlich montierten Body-Portal**. Bei vielen gleichartigen Triggern, z. B. Wetterparametern, könnte eine assistive Navigation keine direkte Zuordnung ablesen. Ihr \`onClose={()=>setOpen(false)}\` war bei jedem React-Render eine neue Funktion. Da der gemeinsame \`AppPortalPopover\` die Referenz als Abhängigkeit eines offenen Pointer-/Escape-Listeners führt, können dadurch unnötige Listener-Cleanup-/Neuinstallationen auftreten; **keine gemessene INP-Behauptung**.

Der Patch ergänzt ausschließlich:
- \`useId()\` im \`AppInfoHint\` für eine stabile, instanzspezifische ID;
- \`aria-controls={open?popoverId:undefined}\` am Trigger und \`id={popoverId}\` am real gerenderten Body-Portal. Im geschlossenen Zustand wird der unmontierte Zielknoten bewusst **nicht** referenziert;
- \`useCallback(()=>setOpen(false),[])\` als stabilen Dismiss-Callback für Außenklick/Escape/Schließen-Button.

**Explizit gleich geblieben:** \`aria-expanded\`, \`aria-haspopup="dialog"\`, Label/Title, \`type="button"\`, eigenes Triggertoggle, Overlay-Layout, Focus-Layer-Stack, Roving/Trap-Kriterien, Swipe, CSS, Popover-Rollen, \`touchTargetSize\`-Option und \`showClose\`-Voreinstellung. Keine Abweichung bei Niederschlags-/Warnungssemantik, Datenprovenienz oder Missing Data.

## Regression

\`tests/unit/mid-design111-infohint-aria-owner.test.ts\` kontrolliert zwei unabhängige Trigger, geschlossenen Zustand ohne ungültige \`aria-controls\`-Referenzen, vorhandene Rollen/Labels, Identitäts-/Callback-Quellvertrag und parsebaren Browser-Runner. Der vorhandene Vitest-Glob \`tests/unit/**/*.test.ts\` enthält die Tests automatisch. Keine neuen Root-\`scripts/test-*.mjs\`, keine Regression-Inventar-Gate-Umgehung.

Zusätzlich sind \`tests/visual/design111-infohint-qa.html\`, \`tests/visual/design111-infohint-qa.tsx\` und der **manuell auszuführende** \`scripts/qa/verifyDesign111InfoHintBrowser.mjs\` angelegt. Letzterer rendert **die originalen React-Primitives** in einem deterministischen, ausdrücklich nur für die Testumgebung definierten CSS-Layout; er prüft 320/390/834/1440 CSS px × Light/Dark = acht Browserfälle:
- Triggergröße der Testfixture mindestens 44 px;
- \`aria-controls\` verweist bei Öffnung auf genau einen gemounteten Dialog und ist geschlossen entfernt;
- IDs zwischen zwei Instanzen einzigartig, nach bewusstem Eltern-Re-Render stabil;
- \`Escape\` schließt, Trigger erhält Fokus zurück; zweiter Trigger öffnet per \`Enter\`;
- Außenklick schließt, keine unbemerkten JS-Fehler oder horizontale Testfixture-Überläufe.

Aufruf auf einem exakt SHA-gebundenen berechtigten Checkout:

\`\`\`bash
node scripts/qa/verifyDesign111InfoHintBrowser.mjs
\`\`\`

Auditnachweis nur bei \`exit 0\`, \`artifacts/design111-browser-qa/evidence.json\` mit \`ready:true\`, 8/8 Fällen und identischem \`GITHUB_SHA\`. **Dieses Browser-Skript wurde im Spezialchat nicht ausgeführt; keine Browser-Freigabe.** Das Fixture-CSS ist keine Bestätigung der ganzen MID-App. Der reale Overlay-Stack in der App mit #891/#868, 200-%-Text und WKWebView/VoiceOver ist separat durch LC zu überprüfen.

## Quellen, Qualitätsschranken und Integration

- React \`useId\`: https://react.dev/reference/react/useId — stabile IDs für Accessibility-Referenzen.
- React \`useCallback\`: https://react.dev/reference/react/useCallback — stabile Funktionen, wenn referenzielle Identität wichtig ist.
- React \`useEffect\`: https://react.dev/reference/react/useEffect — Abhängigkeiten bestimmen Event-Abonnements.
- WAI-ARIA 1.2: https://www.w3.org/TR/wai-aria/ — \`aria-haspopup="dialog"\` muss zur tatsächlichen Dialogrolle passen.
- W3C Dialog Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ — Fokus/Schließen und tatsächliche Modalität bleiben gesondert zu prüfen.
- W3C Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html — Layout bei 320 CSS px ohne Informationsverlust; Karten haben eine eng begrenzte Ausnahme.

Nach LC-Intake erneuter Base-/PR-Datei- und Code-Owner-Abgleich, gezielte Vitest-, Browser-, Source/Core/Heavy-/Review-, Installer-/Worker-/Pages-Gates sowie Stable-Promotion. Branch bleibt QA-Draft. **Kein Merge/Release, keine Gate-Abschwächung, keine Freigabe.**