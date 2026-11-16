# MID Design 1.8 · CSSOM-Farb-, Layout- und Kaskadenparität (QA, keine Freigabe)

Stand 2026-11-16. **Nur diagnostischer Spezial-Draft; NO READY / NO MERGE / NO RELEASE.**
Vor Arbeit verifizierte Basis: \`main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957\`,
v0.9.85.486, fünf aktive Rulesets; \`AGENTS.md\`, \`MID_BASELINE.json\`,
\`package.json\`, \`contracts/index.json\`, \`MID_SOURCE_OF_TRUTH.md\` und
die Cross-Platform-, Farb-, iOS-Design- und Navigationsverträge gelesen.

## Warum dieser Schritt eigenständig ist

Issue #344 verlangt eine **nachvollziehbar unveränderte** CSS-Darstellung, bevor
einzelne Styles aus dem 68-Dateien-Eager-Kaskadenmanifest in asynchrone Module
verschoben werden. Bestehende Regel- und Selektorheurstiken einschließlich #859
können CSSOM-Wirkungen nicht beweisen. Die älteren Chromium-Entwicklungs-Fixtures
inklusive #463/#831 messen Regelnutzung und ausgewählte Referenzen, nicht ein
SHA-genaues **Produktionsbuild-Paar nach dem Öffnen dynamischer Ansichten**.
Der aktuelle Leitchat-Train #858 enthält #859/#860/#863 bereits; kein
Übernehmen oder Ändern dieser Pfade. Kein Vite-/CSS-/JS-/Worker-/Wetter-Code
und kein Workflow oder Versionsspiegel wird verändert.

## Inhalt und fachlicher Nachweisbereich

- \`scripts/lib/design18CssComputedEvidence.mjs\` kann nach expliziter
  erfolgreicher View-Bereitschaft aus einem **realen Playwright-Page**-Objekt
  CSSOM-Eigenschaftswerte und DOM-Rechtecke aufnehmen. Die Browseransicht muss
  vorher mit der **originalen Produktions-dist**-Ausgabe geöffnet werden.
- Beide Quellen benötigen je einen vollständigen unabhängigen Build-SHA,
  Assets-SHA256, Version und denselben Fixture-SHA256. Ein mehrteiliger
  Matrixvergleich lehnt zusätzliche, fehlende, doppelte oder cross-case
  abweichende Source-/Asset-/Versionsidentitäten ab.
- Aufgenommene Eigenschaften: Schrift, Farben, Größen, Padding, Overflow,
  Transparenz, Transformation, Grid/Flex usw.; zusätzlich die neun kanonischen
  meteorologischen \`--param-*\`-Wurzelvariablen. Unvollständige Eigenschaften
  sind **NoData** und keine Null.
- Pro explizitem View-Ziel: genau ein sichtbares DOM-Element, geladenes
  \`document.fonts\`, wenigstens ein echtes CSS-Stylesheet, zwei
  \`requestAnimationFrame\`-Ticks und ein exakt passender Viewport.
  Eventuelle fehlende async CSS-Chunks sind damit **nicht automatisch** bewiesen:
  die echte Modul-Ladefertigstellung muss bereits durch die aufrufende Fixture
  (Quellrequest-/Stylesheet-Readback) separat belegbar sein.
- Die Paarprüfung meldet exakte Eigenschaften bzw. Rechteckdifferenzen.
  Gleiche Werte führen ausschließlich zu \`SELECTED_CSSOM_VALUES_MATCH_ONLY\`.
  Alle Ausgänge: \`releaseAuthorized:false\`, \`cssSplitSafeProven:false\`
  und \`wholeAppParityProven:false\`. Geänderte meteorologische Farben dürfen
  weder durch einen normalen CSS-Refactor maskiert noch still akzeptiert werden.

## Reproduktion (auf geeignetem, **autorisiertem** Browser-Runner)

1. **Zwei getrennte, vollständige Produktions-builds** von Original-Stable und
   dem präzisen Änderungskandidaten SHA- und Asset-fingerprint-verifizieren,
   z. B. über den bereits vorhandenen \`verifyStartupBuildIdentity()\`-Pfad.
   Ein bloßer \`vite dev\`-Snapshot oder ein nachträglich umbenannter dist ist
   **nicht** gleichwertig. Keine Browser-Sandbox abschalten.
2. Im bestehenden Browser-QA-Aufbau ein identisches, synthetisches und
   meteorologisch quell-/zeitgebundenes Szenario laden. Pro Zustand
   (Aktuell, geöffnete Karte, 7/14 Tage, Ensemble/Mehr) die jeweilige sichtbare
   Modulbereitschaft und vollständig geladene CSS-Stylesheets separat prüfen.
   Mit \`captureCssomCase(page,{buildIdentity,caseId,fixtureSha256,theme,readySelector,targets})\`
   dann den **tatsächlichen** Browserzustand erfassen. \`targets\` sind
   benannte eindeutige CSS-Selektoren, z. B.
   \`[{id:"navigation",selector:'nav[aria-label="Hauptnavigation"]'}]\`.
   Das Modul navigiert absichtlich **nicht** selbst, lädt keine Anbieter-API,
   verändert keine Styles und erzeugt keine echten Wetterdaten-Fakes.
3. Die identischen View-/Theme-/Breitenfälle für Stable und Kandidat erfassen;
   Mindestmatrix: 320/390/430/834/1024/1440 CSS-Pixel sowie Light/Dark,
   bei iOS zusätzlich Hoch-/Querformat und reduzierte Transparenz/Bewegung.
   Bei zu wenig Fällen wird **keine** Abnahme behauptet.
4. Die beiden JSON-Arrays sowie die explizite JSON-Liste der erforderlichen
   Case-IDs getrennt speichern; mit
   \`node scripts/compare-design18-css-computed.mjs stable.json candidate.json required-case-ids.json\`
   vergleichen. Der Bericht landet ausschließlich lokal in
   \`artifacts/mid-design18-cssom-descriptive.json\` mit \`wx\`- und
   \`0600\`-Schreibmodus, damit alte Evidenz nicht still überschrieben wird.
5. Zusätzlich echte CSS-/JS-Transferbytes, Style-Recalc/Long Tasks,
   20× Viewwechsel mit Post-GC, visuelle Pixel/SVG/PNG/URL-Exporte,
   WebKit/physisches iOS/VoiceOver und Wetterprovenienz prüfen.
   \`Runtime.getHeapUsage()\` ist kein GPU-/OS-RAM-Nachweis.

## QA-/Integrationsgrenzen

Die bereitgestellten Vitest-Fälle sind synthetische Positiv-/Negativtests für
Vollständigkeit, NoData, CSS-Farb- und Geometriedrift, Browser-/Theme-/Fixture-
Identität, Zustand- und Selektor-Duplikate sowie explizite Matrix. Sie beweisen
**keine** bereits erfolgte Browserausführung. Neue Dateipfade sind disjunkt zu
#858, #859, #860, #863 und #839; mögliche spätere Integration erst nach
SHA-genauem Readback und Konfliktprüfung durch den Leitchat.
Alle vollständigen Source-/Core-/Heavy-/Review-/ZIP-/Installer-/Worker-/
Pages-/Stable-Gates sowie Issue #740 sind unverändert.

Referenzen: https://vite.dev/guide/features.html#css-code-splitting ;
https://chromedevtools.github.io/devtools-protocol/tot/CSS/ ;
https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction .
