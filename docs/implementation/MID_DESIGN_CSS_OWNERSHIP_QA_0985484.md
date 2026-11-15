# MID Design 1.1 – CSS-Eigentümerschaft, Diagnostik-Draft

**Status:** QA-Draft, NO RELEASE, keine Freigabe zur CSS-Migration. Verifizierter Ausgangs-Stable und Main vom 15.11.2026: c9fadfcd0969e949a92f414b321627dd3d4fb0cc, Version v0.9.85.483. Dies ist kein neuer App-Build. Die .484 im Branch-Namen ist nur eine geplante spätere Release-Version, nicht freigegeben.

## Umsetzung

- scripts/audit-css-ownership-0985484.mjs: rein lesender JSON-Audit aller kanonischen CSS-Quellen mit bestehendem scripts/lib/cssCascade.mjs und postcss. Erfasst Rohbytes, Regeln, Deklarationen, !important, At-Rule-Kontexte, mögliche Bereichszuordnung und exakte spätere Selektor-/Eigenschafts-/At-Rule-Übereinstimmungen über Dateigrenzen.
- scripts/test-css-ownership-0985484.mjs: positive/negative Tests für Kontexttrennung (media vs supports), Eigenschaftsänderung, Importance-Differenz, ungültige Eingaben, Byte-Invarianten und Diagnose-only-Status. Bei Ausführung im MID-Checkout zusätzlich vollständiger kanonischer CSS-Scan; in CI wird fehlendes Manifest als Fehler behandelt.
- MID_BASELINE.json: zusätzlich registrierter Test in beiden Regressionstest-Inventaren. Keine bestehenden Tests entfernt und keine Version/Gate/Produktionsquelle verändert.

## Reproduktion nach npm ci

~~~bash
node scripts/test-css-ownership-0985484.mjs
node scripts/audit-css-ownership-0985484.mjs > /tmp/mid-css-ownership.json
~~~

Das Audit schreibt keine Dateien im Repository, führt keinen Produktionsbuild aus, installiert keine neue Abhängigkeit und verarbeitet keine Wetterdaten oder Secrets.

## GitHub-Draft-QA und Core-Shard-Integrität

Der erste gezielte GitHub-Draft-Lauf 43742115234 bestand den vollständigen kanonischen CSS-Scan und den Versionscheck. Ergebnis: 68 CSS-Quellen, 1.914.730 Rohbytes, 14.909 Regeln, 44.157 Deklarationen, 10.666 !important-Deklarationen, 1.925 exakte spätere Selektor-/Eigenschafts-/At-Rule-Treffer (nur Risikohinweise, keine bewiesenen visuellen Fehler).

Der getrennte Vitest-Pilot deckte einen bestehenden, absichtlich strikten Core-Shard-Vertrag auf: neue Tests dürfen die historisch SHA-/Laufzeit-qualifizierte Modulo-Zuordnung und drei vollständigen Lastenausgleichs-Swaps nicht verschieben. Daher wurde ausschließlich der neue CSS-Test als REGRESSION_CORE_STABLE_ADDITIONS in scripts/regression-shards.mjs dem Pflicht-Shard core-3/4 zugeordnet und die genau prüfende Erwartung in scripts/test-core-regression-isolated-matrix-0985354.mjs fortgeschrieben. Kein historischer Regressionstest oder Lastenausgleichs-Swap wurde entfernt, übersprungen oder abgeschwächt. Eine neue vollständige GitHub-Draft-QA auf dem finalen PR-SHA ist Pflicht und ersetzt keinen Source-/Release-Gate.

## Interpretation und Grenzen

Exakte Übereinstimmungen sind lediglich eine Untergrenze potentieller Kaskadenkonflikte. Nicht erfasst: abweichende Selektorspezifitäten, :is()/:where(), CSS-Variablen, tatsächliches DOM-Matching, @layer- und @container-Semantik, Netzwerk-Nachladung oder reale Browserperformance. Auch identische Treffer bedeuten wegen !important und Laufzeitbedingungen nicht zwangsläufig tatsächliche Überschreibungen. Klassenpräfixe beweisen weder React-Modul-Eigentümer noch Lazy-Loading-Sicherheit.

Vor einem CSS-Split: Browser-Originalvergleich für alle Hauptansichten, Erstaufruf und Wiederaufruf, 320/390/412/430/834/1024/1440 px, Light/Dark, Portrait/Landscape, Cold-/Warmcache, CSSOM/Geometrie/Pixels, CLS/FOUC, Touch/Fokus/Overflow und 20-Zyklen-Heap. Chromium ersetzt keine echte iOS-/VoiceOver-Abnahme. WMO/DWD-/Warn-/Datenlücken-/Zeit-/Farbenverträge bleiben unverändert.

## Release-Train-Handoff

Nur nach unabhängiger Prüfung des Draft-Diffs und vollständigen Tests mit frisch verifizierter Stable-Basis integrieren. Bei tatsächlichem .484-oder-später-Build alle Versionsspiegel, Changelogs und den vollständigen bestehenden Source-PR- und Installer-Releasepfad einhalten. Dieser Draft darf nicht selbst gemergt, deployed oder promoted werden.
