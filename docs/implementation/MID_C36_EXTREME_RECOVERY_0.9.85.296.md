# MID-C36 · Langfrist-Ausblick: Loader und Fehlerwiederherstellung

Basis: main=mid-stable=369cde0bbbe61e52cc422038e4d1dd94ff16099e (.295). Bestehender PR419, übernommener Head a1dd6df84338199baed814980c1e6b3ef8ea9368, Tree505bda4382c469298020cc61728b618521129b90. Keine konkurrierende Implementierung oder Änderung am Releasepfad.

## Befunde und Reparatur

Der Source-Lauf39204560513 hatte vier blockierende Fehler: ein Test verwendete die nicht vorhandene Strada-JavaScript-API des TypeScript7-Pakets; der neue Test mockte nur den ersten von zwei Direktimporten; eine Meldungsprüfung las weiterhin die abgelöste Wrapperdatei; der Laufzeitmodul-Audit erkannte den nicht mehr importierten Wrapper als toten Code. Der neue Test verwendet jetzt den bereits qualifizierten Alias typescript-strada6.0.3 und ersetzt beide optionalen Diensteinstiege. Die Meldungsprüfung schützt dieselben Texte im tatsächlich aktiven Loader. Der unbenutzte Wrapper und ausschließlich sein Dateiinventareintrag sind entfernt. Keine Ausnahme im Reachability-Audit, kein entfernter Regressionstest, kein verändertes Budget oder Timeout.

Zusätzlich war der vorgesehene Nutzer-Reload tatsächlich nicht erreichbar: Der Loader wandelte den Fehler des dynamischen Imports in eine allgemeine Datendienstmeldung um, bevor das Panel die Fehlerart erkennen konnte. Ein gemeinsamer Klassifizierer bewahrt jetzt eine nutzergeeignete Modulfehlermeldung. Ein vollständiger Stale-Cache hat weiterhin Vorrang; andernfalls bietet das Panel bei diesem Fehler explizit „App neu laden“, bei anderen Netzwerkfehlern „Erneut laden“. Kein automatischer Reload und keine Löschung lokaler Daten.

Die Langfristschema-Prüfung verwirft nun auch null-Perioden, unterbrochene oder überlappende Zeitfolgen und null-/Array-Gefahrenfelder. Ungültige frische Cacheeinträge dürfen den regulären Workerpfad nicht durch einen ungefangenen Schemafehler blockieren. Berechnungsverfahren, Schwellen und amtliche Warnungen bleiben unverändert.

## Nachweise

- Frischer Shallow-Clone des exakten PR-Heads; saubere Ausgangskopie, kein übernommener alter Scratch-Quellstand. Der ergänzend heruntergeladene .295-Installer-Snapshot wurde nicht als aktuelle Codebasis verwendet.
- Eigene npm-ci-Installation:202Pakete. Paketversionen und Lockfile unverändert; TypeScript7-Typprüfung separat vom Strada-Transpilationstest.
- Kanonischer sauberer Produktionsbuild, Syntax und **1001/1001 Regressionen**,125,3s, Exit0. Ein voriger lokaler Budgetbefund beruhte auf gleichzeitig vorhandenen alten und neuen generierten Dist-Einstiegschunks; diese lokale Ausgabe wurde gesichert und der finale Lauf sauber ausgeführt, ohne Budgetänderung.
- Kanonischer Produktionsaudit:83Paketversionen, npm-Bulk geprüft, keine Befunde oder Providerfehler. Lockfile-SHA256fd5e0347e0c805f58502c3845d956c4374b865c4955758175021af20075532b7.
- Dynamischer echter Loader mit ausschließlich gemockten Dienstgrenzen: Worker-first, Cache, Direktpfad, Modulfehler, Stale-Vorrang, Tageslimit, Abort und vier beschädigte Cacheformen. Kein Ersatz der Wetterlogik durch Testimplementierung.
- Tatsächliches React-Fehlerpanel im isolierten Chromium153:24Fälle,320/390/844/768/1024/1440px, Light/Dark, Modul-/Netzwerkfehler. Genau ein nutzergetriggerter Reload, regulärer Retry ohne Reload, lokaler Sentinel nach Reload unverändert, keine horizontalen Überläufe oder Laufzeitfehler. Dienste im Fixture absichtlich offline; kein Live-Daten- oder physischer iOS-/WKWebView-/VoiceOver-Nachweis.
- Zusätzlich vervollständigen sync-version-Ausgaben die zuvor fehlenden .296-Mirrorwerte in contracts/index.json und im Xcode-Buildprojekt.

Die fünf zuvor grünen Source-Browsergruppen am alten Head sind kein Freigabenachweis für den Reparaturhead. Neue Source-/Review-/Installer-/Worker-/Pages-/Stable-Gates müssen vollständig bestehen. PR Completion bleibt Prüfhelfer; kein generischer Mergehelfer und kein Direktpush auf main/stable. #352/#374/#405/#411 bleiben getrennte offene Pakete.
