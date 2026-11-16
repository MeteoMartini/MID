# MID Design 1.8 — echte CSS-Auslieferung, Inline-Provenienz und angewendete CSSOM-Regeln

**16.11.2026 · READ-ONLY QA DRAFT · NO READY · NO MERGE · NO RELEASE.**

Verifizierte Arbeitsbasis: \`main = mid-stable = a78465b655d25cafc9ecc0390080694cb7aca957\` / v0.9.85.486.
Alle fünf Rulesets aktiv. \`AGENTS.md\`, \`MID_SOURCE_OF_TRUTH.md\`,
\`MID_BASELINE.json\`, \`contracts/index.json\`, \`package.json\`,
Cross-Platform-, Parameterfarb-, iOS-Design- und Navigationsverträge gelten unverändert.
Die vier CSSOM-Dateien aus Spezial-PR #864 sind bereits 4/4 byteidentisch im
Leitchat-PR #858 auf dessen HEAD 52139175f187a469c7b495ad868e135fedba1c40
nachgewiesen: **sie werden hier nicht berührt**.

## Konkrete Lücke und Quellenabgleich

- Vite ist bei MID mit \`cssCodeSplit:true\` und \`cssMinify:'lightningcss'\` aktiv.
  Vite lädt Stylesheets asynchroner JS-Chunks separat; die CSS-Dateien werden
  über \`link\` angewendet, bevor das Modul evaluiert wird.
- Playwright rät ausdrücklich davon ab, \`networkidle\` für ein dynamisches
  App-Fertigkeitskriterium zu verwenden. Ein sichtbarer DOM-Knoten,
  \`document.fonts.ready\` und zwei \`requestAnimationFrame\`-Ticks beweisen
  **nicht** selbst, dass jede später verwendete CSS-Datei tatsächlich und
  unverändert geladen wurde.
- Im **echten MID-Stable-\`index.html\` existiert zusätzlich ein \`<style>\`-Block**.
  Ein Beweis, der sämtliche Inline-CSS pauschal als Fehler oder unbeachtlich
  behandelt, wäre für das Projekt untauglich.

Originaldokumentation:
https://vite.dev/guide/features.html#css-code-splitting
https://playwright.dev/docs/api/class-page
https://developer.mozilla.org/en-US/docs/Web/API/Document/styleSheets
https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet

## Implementierter eigenständiger Gegenbeleg-Schutz

\`scripts/lib/design18CssAssetReadiness.mjs\` stellt drei Schritte bereit:

1. \`verifyCssManifestAgainstDist(distRoot, buildIdentity, expectedCssAssets)\`
   validiert den **gesamten** Produktions-dist gegen die vorhandene
   \`verifyStartupBuildIdentity()\`-Routine (Dateinamen, SHA256, Assetanzahl,
   Source-Git-SHA, Version) und die \`version.json\`. Jede erwartete \`assets/*.css\`
   muss einen eigenen, Byte-genauen SHA256-Fingerprint besitzen.
   Die Inline-\`<style>\`-Originaltexte des gebauten \`index.html\` werden
   unabhängig gehasht und im manifestgebundenen Nachweis geführt.
2. \`observeCssResponses(page,{manifest,origin})\` wird **vor der ersten
   Browsernavigation** eingerichtet; anschließend wird die echte MID-Ansicht
   durch die aufrufende Browserfixture geöffnet. Jede deklarierte CSS-Datei
   muss als tatsächliche HTTP-200-Playwright-Response inklusive lesbaren
   **Originalantwortbytes** registriert werden. Nur dann kann ein SHA256-Match
   zum unveränderten Produktions-build entstehen. Fehlender, mehrfacher,
   veränderter oder nicht lesbarer Body ist ein Fehler. Die aufrufende Fixture
   muss einen passenden echten Testserver und korrekte Browserrechte haben,
   nicht etwa lokale Browser-Adminrestriktionen umgehen.
3. \`finish()\` wartet auf \`document.fonts.ready\` und zwei
   Rendering-Schritte pro DOM-Lesung. Es erfasst zweimal die Reihenfolge
   der tatsächlich verwendeten \`document.styleSheets\`, jeweils die
   \`cssRules\`-Anzahl, \`disabled\`-Status und bei Inline-Styles den SHA256
   des DOM-\`<style>\`-Originaltextes. Fehlende, ungeprüfte, zusätzliche,
   nichtlesbare, deaktivierte oder nachträglich instabile Stylesheets
   sowie unbekannte \`adoptedStyleSheets\` blockieren. Cross-Origin-/SecurityError
   wird **nicht** als erfolgreich geprüfte CSS-Datei ausgegeben.

Zusätzlich werden Pfadtraversal, unklare CSS-Rollen, Doppelfingerprints
und unvollständige HTTP-/DOM-Inventare verweigert. Die Prüfung greift
weder in App-CSS noch in Meteorologiedaten, Source, Runtime, Worker,
Cloudflare oder CI-Konfiguration ein und übermittelt keine lokalen
Browserlogs, Ortswerte oder Geheimnisse.

## Reproduktionsregel und Grenzen

**Kein automatischer Webbrowser-Test ist in dieser isolierten Ergänzung
erfolgreich ausgeführt worden.** Der Runner aus Spezial-PR #863 wurde
bisher nach \`ERR_BLOCKED_BY_ADMINISTRATOR\` für Localhost gestoppt; eine
Umgehung kommt nicht infrage.

Erst auf einem autorisierten Browserrunner sind Stable und Kandidat
getrennt aus SHA-authentifizierten Produktions-dist-Bäumen zu laden.
Die eingefrorene View-/Testort-Folge muss dieselben Quellen, Zeitstände,
Läufe, Browserstände und UI-Aktionen verwenden. Vor dem asynchronen
Ansichtwechsel \`observeCssResponses()\` starten, nach eindeutigem
View-/Modulbereitschaftszeichen \`finish()\` aufrufen und anschließend
mit dem bereits vom Leitchat integrierten Design-#864-CSSOM-Capture
den eigentlichen Computed-Style-/Parameterfarben-Vergleich ausführen.

Ein HTTP/CSSOM-Erfolg ist **nur** eine Aussage über die ausdrücklich
deklarierten geladenen Stylesheets zum Messzeitpunkt. Eine spätere neue
CSS-Datei, dynamische \`<style>\`-Injection, ShadowRoot, CSS-Mutation
oder zu spät eingelaufene UI-Änderung bleibt separat auszuschließen.
Die Implementierung ist daher **kein Allzeitvollständigkeitsbeweis**
und attestiert niemals CSS-Split-Sicherheit, Performanceeinsparung,
native WebKit-/iOS-/VoiceOver-Abnahme oder Releasefreigabe.

Insbesondere bleibt:
\`status: DECLARED_CSS_HTTP_AND_CSSOM_OBSERVED_ONLY\`,
\`releaseAuthorized:false\`, \`cssSplitSafeProven:false\`,
\`performanceGainProven:false\`.

### Notwendiger Leitchat-Handoff

1. Vor Übernahme exakt prüfen, ob ein anderes Work inzwischen
   denselben CSS-Bereitschaftspfad implementiert hat. Bei Überschneidung
   oder abweichenden SHAs **keine** Doppelübernahme.
2. Zunächst den SHA-genauen spezialisierten Unit-/TypeScript-CI-Readback
   für den QA-Draft abnehmen und echte Fehler unabhängig triagieren.
3. Erst danach die drei **neu hinzugefügten** und disjunkten Pfade
   selektiv übernehmen. Keine Änderungen an #864 oder geschützten
   Quell-/Releasesystemen veranlassen.
4. Vollständige Source-/Core-/Heavy-/Review-/Budget-/Browser-/
   ZIP-/Installer-/Worker-/Pages-/Stable-Gates ausschließlich im
   etablierten Release-Train. #740/#839 bleibt dem
   Release-Spezialchat vorbehalten.
