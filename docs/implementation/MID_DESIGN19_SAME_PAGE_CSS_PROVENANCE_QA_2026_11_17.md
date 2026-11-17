# MID Design 1.9 · CSS-HTTP und Computed-Style in EINER echten Browserseite koppeln

**17.11.2026 · additive isolierte QA · DRAFT · NO READY / NO MERGE / NO RELEASE.**

## Source of Truth und parallele Integration

- GitHub \`MeteoMartini/MID\` vor Arbeitsbeginn erneut geprüft:
  \`main = mid-stable = a78465b655d25cafc9ecc0390080694cb7aca957\`,
  Version \`0.9.85.486\` in \`package.json\`, \`MID_BASELINE.json\` und
  \`contracts/index.json\`; fünf aktive Branch-Rulesets; geltende
  \`AGENTS.md\` / \`MID_SOURCE_OF_TRUTH.md\`.
- Der maßgebliche neuere Leit-PR **#868** hatte HEAD
  \`a24ee9631f62f21a7cd0c7720adf2b9105434757\` und war Draft.
  Die drei Dateien aus Spezial-#865 waren **3/3 Git-Blobs identisch**
  in #868 enthalten (die älteren #863/#864 ebenso selektiv übernommen).
  Daher **keine Änderung an bestehenden Design18-Dateien**, keine
  doppelte Testimplementierung und keine Änderung an #858/#868.
- Scope hier: **neue eigenständige Bridge-Datei** und ihre Tests/Dokumentation.
  Kein Produkt-CSS, UI, Service Worker, Wettermodell, CI-/Governance-/Release-Workflow
  oder Versionsspiegel wird geändert. Release-Sicherheit #740/#839 ausgenommen.

## Tatsächliche Lücke

Die bestehenden Funktionen messen bereits unterschiedliche fachliche Aspekte:

1. \`verifyCssManifestAgainstDist\` und \`observeCssResponses\` aus Design18:
   vollständiger Buildfingerprint, Antwortbytes, Inline-CSS, CSSOM-Regeltext;
   zwei Beobachtungen nach Ende der CSS-Netzwerkaktivität im endlichen Fenster.
2. \`captureCssomCase\` und \`validateCssomCase\` aus Design18:
   berechnete UI-CSS-Eigenschaften, Geometrie, Farben, responsive Viewports,
   Browser-/Fixture-Identität.

**Zwei unabhängige „PASSED“-Artefakte könnten dennoch von unterschiedlichen
Browserseiten, Builds, Themes oder View-Zuständen stammen.** Eine spätere
Kombination ohne echte Laufzeitkoppelung wäre kein stichhaltiger Nachweis.

\`scripts/lib/design19CssSamePageEvidence.mjs\` definiert deshalb
\`runDesign19CssSamePage\`:

- Akzeptiert **eine Playwright-\`Page\`** und die bestehenden originalen
  Design18-Funktionen als übergebene Abhängigkeiten. Keine Kopie der alten
  Implementierungen, keine globalen Browserflags, kein Netzwerkmocking.
- Verifiziert zuerst den **gesamten tatsächlichen \`dist\`** und die deklarierten
  CSS-Bytes mithilfe der bestehenden Design18-Routine. Quelle, Versionsspiegel,
  Asset-SHA, Theme, Fixture-SHA, Responsive-Größe und Ziel-Selektoren werden
  explizit eingefordert. Exakte lokale Server-Origin erforderlich.
- Registriert den Original-CSS-Netzwerkbeobachter **vor** \`page.goto\`.
  Anschließend wird \`localStorage.theme\` über \`addInitScript\` gesetzt,
  die verifizierte \`index.html\` geöffnet und **nur eine ausdrücklich
  bereitgestellte Trusted-View-Aktion** ausgeführt.
- Erfasst eine echte CSSOM-Beobachtung **vor** dem Abschluss des
  Netzwerk-/CSSOM-Beobachters und eine zweite **danach**; beide laufen auf
  exakt derselben \`Page\` und denselben View-/Theme-/Fixture-Vorgaben.
- Vergleicht zwei vollständige Styles-/Geometrie-/Root-Token-Aufnahmen,
  Browser- und View-Identität und den Umfang der tatsächlich verifizierten
  Stylesheets. Fehlende/abweichende Bytes, laufzeitveränderte CSSOM-/Layout-Werte,
  Origin-Wechsel oder fehlende Ready-/Theme-Bestätigung stoppen die Prüfung.
  Listener werden auch nach Exceptions kontrolliert abgemeldet.

## Reproduzierbarer Anschluss an einen autorisierten Browserrunner

Der Einbaupfad auf einem nachweislich passenden **vollständigen Integrationsstand**
lautet als Pseudocode (keine grüne Browsermessung):

\`\`\`js
import {runDesign19CssSamePage} from './lib/design19CssSamePageEvidence.mjs';
import {
  verifyCssManifestAgainstDist,observeCssResponses,
} from './lib/design18CssAssetReadiness.mjs';
import {
  captureCssomCase,validateCssomCase,
} from './lib/design18CssComputedEvidence.mjs';

const result = await runDesign19CssSamePage({
  page, distRoot, buildIdentity, expectedCssAssets, origin,
  scenario: {
    caseId:'map-light-390', fixtureSha256, theme:'light',
    width:390,height:844,
    readySelector:'<exact MID map-ready selector>',
    targets:[{id:'map',selector:'<exact visible map DOM target>'}],
  },
  openView: async page => {
    // Use a real UI action on this page; await the exact view-ready state.
    // No silent provider fallback or fake DOM insertion.
  },
  helpers:{
    verifyCssManifestAgainstDist,observeCssResponses,
    captureCssomCase,validateCssomCase,
  },
});
\`\`\`

- Vorher: originale Stable- und QA-Dist-Bäume SHA-genau getrennt bauen;
  die aktuelle Version und Assetliste der **tatsächlich erwarteten CSS-Dateien**
  separat prüfen. Keine alten ZIPs als Codebasis verwenden.
- Browser: frischer, autorisierter Chromium-Playwright-Runner, Sandbox aktiv.
  \`@playwright/test\` steht in MID nicht dauerhaft im
  \`package.json\`; daher **kein ungeprüftes \`npm install\`,
  kein auto-download, keine Admin-Sandbox-Umgehung**. Exakte Browserinstallation
  und -version müssen vor der tatsächlichen Messung freigegeben/geprüft sein.
- View: 320/390/430/834/1024/1440px, Light/Dark, Hoch-/Querformat;
  mobile First-Touch, Karte und Vorhersage, Overlay/Favoriten, lange Ortsnamen
  und möglichst mit eingefrorenen meteorologischen Providern/Zeitscheiben.
  Für echte WebKit/iOS/VoiceOver-Prüfungen zusätzlich eigene Hardware-/OS-Matrix.
- Vergleiche die hier entstandenen \`cssom\`-Einzelbefunde erst **danach**
  mit dem bestehenden \`compareCssomCases\` aus Design18, wenn vollständige
  identische Fall-IDs und Browser-/Fixture-/Version-Nachweise vorliegen.
- Bei \`net::ERR_BLOCKED_BY_ADMINISTRATOR\`, fehlendem Browser, nicht
  verfügbarer Provider-Fixierung oder unsicherer Runtime-Genehmigung:
  **FAIL CLOSED**. Keine Ersetzung durch synthetische Unit-Tests.

## Verbindliche Aussagegrenzen

Der Report lautet \`ONE_PAGE_ONE_WINDOW_DESCRIPTIVE_ONLY\`,
mit \`releaseAuthorized:false\`, \`cssSplitSafeProven:false\`,
\`performanceGainProven:false\` und \`browserAcceptanceProven:false\`.

Das ist **keine** Aussage über später importierte Styles, historische
Providerantworten, CSS-ShadowRoots, native iOS, VoiceOver, Render-Pixel,
GPU-/Systemspeicher, reale Performanceersparnis oder Release-Berechtigung.
Für einen echten CSS-Split braucht es zusätzlich kontrollierte HTML/CSS
Kaskade-/Pixel-Snapshots, 20-Zyklen-Regression, Source/Core/Heavy/Review-Gates,
SHA-gebundenes Release-ZIP, Installer, betroffene Worker-/Pages-Gates,
Stable-Promotion und eigenständige Fachabnahme.

Originaldokumentation:
- https://playwright.dev/docs/api/class-page
- https://playwright.dev/docs/api/class-request
- https://playwright.dev/docs/api/class-response
- https://vite.dev/guide/features.html#css-code-splitting

**Übernahme:** Erst SHA-/Blob-Diff gegenüber *aktuellem* #868-/Leitchat-HEAD
und aktuellen Parallel-PRs prüfen. Nur disjunkte, erfolgreiche und
nicht übernommene QA-Dateien selektiv integrieren; niemals PR hieraus direkt
Ready/merge/release setzen.
