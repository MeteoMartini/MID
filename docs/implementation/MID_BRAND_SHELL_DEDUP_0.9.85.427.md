# #344 / #651 / #652 · byteidentische PWA-Markeninhalte einmal übertragen

Verifizierte Basis: main=mid-stable `7e998730daaa4a409cd3e15d4f4cf0f70efaaeda`, .425; Package, Baseline, AGENTS, Source of Truth und Logo-/Offline-/Updateverträge berücksichtigt. Offene #652 ergänzt Budgetdiagnostik; diese Checker-/Workflowarbeit nicht übernommen. Keine konkurrierende Alias-/Serviceworkerimplementierung in der gelesenen PR-Liste. .427 ist ausschließlich ein unveröffentlichter Entwicklungskandidat auf chatgpt/v0.9.85.427-brand-shell-dedup.

## Verifizierte Gruppen und unveränderte URLs

Das vollständige SHA-Inventar aus #652 wurde gegen sämtliche vorhandenen public-PNGs erneut geprüft: alle unverändert. Fünf explizite, byteidentische Gruppen, SHA-256/Größen in groups.json:

- mid-icon-512.png = mid-icon-dark-512.png = mid-logo.png
- mid-logo-light-compact.png = mid-logo-light.png
- mid-logo-dark-compact.png = mid-logo-dark.png
- mid-icon-192.png = mid-icon-dark-192.png
- mid-icon-180.png = mid-icon-dark-180.png

Keine Light-/Dark-Kompaktmarken zusammengefasst. Die ursprünglichen öffentlichen Namen bleiben vollständig im public-Verzeichnis und im Shell-Cache. Die Referenzen in App-Branding/Widgets/Exportzugriffen, index.html-Boot/Favicon/Apple-Icons und manifest.webmanifest bleiben unverändert. Native iOS-AppIcon-/Splash-Dateien werden nicht angefasst. Bestehende Logo-/PNG-Regressionen schützen diese Plattformpfade.

## Produktionsänderung

`cacheAssetsConcurrently` teilt innerhalb genau eines cacheShell-Aufbaus einen Promise pro kanonischer Gruppe. Ein HTTP-Abruf wird über das bestehende fetchAsset mit seinen unveränderten Zeitgrenzen/Fehlerregeln ausgeführt, sein tatsächlich empfangener Body auf Größe und SHA geprüft und als eigene Response unter jeder angeforderten Alias-URL gespeichert. Andere Shellressourcen behalten ihren bisherigen Fetchpfad. Synthetische Antworten entfernen Content-Encoding und setzen Content-Length auf die tatsächlich dekodierten Bytes; Content-Type bleibt erhalten. Kein Redirect und keine neue externe Quelle.

Buildschutz: scripts/brand-shell-groups.mjs vergleicht jede deklarierte Datei byteweise und generiert die tatsächlichen Hashes/Größen identisch in beiden Worker-Einstiegspunkten. sync-version nutzt diesen Generator; der Vite-buildStart-Check prüft alle Quelldateien und die generierten Worker nochmals read-only. Auseinanderlaufende zukünftige Varianten oder veraltete Zuordnungen brechen den Build ab. Werden alle Mitglieder einer Gruppe absichtlich identisch geändert, kann der Generator den neuen gemeinsamen Hash binden; eine veraltete Gleichsetzung wird nicht still akzeptiert.

Laufzeitabweichungen (z.B. beschädigter kanonischer Download) lassen den Shell-Aufbau scheitern. Die bestehende cacheShell-Fehlerbereinigung, Versionsmarker, explizite Aktivierung, Healthy-/Rollback- und Vorversionspolitik bleiben erhalten. Laufzeitabrufe außerhalb dieses Shell-Aufbaus werden nicht pauschal umgeschrieben. Es wird weder geringerer Cache-Speicherbedarf noch schnellerer Start in Millisekunden behauptet.

## Tatsächliche Messung, klar getrennte Grenzen

Echter Chromium-Serviceworker über lokalen HTTP-Server, identische unveränderte public-PNGs, bestehende CORE-Liste und minimale versionspassende Test-Shell. Gezählt werden tatsächlich vom Server beantwortete PNG-Anfragen und deren rohe Antwortbody-Bytes, keine Header/TLS/CDN-Kompression und keine vollständige App-Netzwerk- oder Zeitmessung:

| Shell-Erstinstallation | PNG-Abrufe | PNG-Bodybytes |
|---|---:|---:|
| Stable-Worker .425 | 18 | 3.914.236 |
| Kandidat | 12 | 2.980.845 |
| Ersparnis | **6** | **933.391 (23,85%)** |

network.json enthält jede tatsächlich gezählte URL und Bytezahl. Die Vergleichskontexte werden strikt getrennt, damit Hintergrund-Updates des alten Workers die Zählung nicht verfälschen. Danach werden alle Alias-Cachekeys/SHA256 und tatsächlichen Offline-Bilddecodes geprüft, einschließlich Light-/Dark-Wechsel ohne weiteren PNG-Netzabruf.

Aktivierung/Update-/Healthy-/Rollback-Handler wurden im echten Kandidaten-Worker mit einem kontrolliert eingesäten Vorversionscache getestet. Eine vollständige Browser-Registrierungsupdate-Kette wurde wegen Testharness-Rennen nicht als bestanden gewertet; kein solcher Nachweis wird behauptet. Der kontrollierte Cachetest ist ausdrücklich von einer realen kompletten .425→.427-Produktionsupdateabnahme zu unterscheiden. Beschädigte kanonische Bytes beim Reparaturaufbau verwerfen den neuen Cache, erhalten die Vorversion und erlauben deren tatsächliche Offline-Bildnutzung nach Rollback.

Produktionsbuild separat: **8.720.292 B totalGzipBytes**, unverändertes Limit 8.500.000 B, **220.292 B Überschreitung**. Start-CSS unverändert 1.759.070/249.684/212.994 B roh/gzip/Brotli. Medien unverändert 6.424.599 B roh. Das ist keine Paketdeduplizierung: alle statischen öffentlichen Dateien bleiben enthalten; Generator-/Worker-/Versionscode verursacht Zusatzbytes. Der frühere #651-Build (8.718.691 B) ist Referenz, kein neuer identischer Vergleichsbuild. Paketgrößenersparnis **nicht umgesetzt**.

Eine Entfernung redundanter physischer PNG-Kopien würde direkte öffentliche URLs von älteren Webclients, installierten Apps, Export-/Widget- und Offlinepfaden betreffen. GitHub-Pages-Ausgabe bietet hier keinen nachgewiesenen transparenten serverseitigen Aliasvertrag. Deshalb keine Entfernung und keine erfundene Paketgrößenersparnis. Native iOS-Ressourcen bleiben ebenfalls unverändert.

## Gezielte Prüfung

- test-brand-shell-groups-0985427.mjs: fünf Gruppen, Generatorparität und zukünftige divergierende Datei fail-closed – grün.
- test-logo-theme-assets-09748.mjs, test-logo-png-integrity-09749.mjs und test-updater.mjs – grün; keine Assertions geschwächt.
- verify-brand-shell-browser-0985427.mjs: tatsächliche Erstinstallation/PNG-Abrufe, Offline-/SHA-/Theme-Decodes, kontrollierte Update-/Rollback-Handler und beschädigte Bytes – grün. Testkontextgrenzen siehe oben.
- `timeout 90s npm run verify:types` und Produktionsbuild `timeout 90s npm run verify:vite` – grün; Vite-Build prüft die Aliasquelle verpflichtend.
- Vorhandener check-build-budget.mjs – erwarteter roter Exit 1, Report dauerhaft gesichert. Keine Limitänderung. Keine vollständigen Regressionen oder Live-Produktionstests. Volle reguläre CI vor einer möglichen Veröffentlichung bleibt erforderlich.

Keine PNG-Neukodierung/Quantisierung/Optikänderung, keine CSS-Arbeit, keine Entfernung von URLs, Nutzerpräferenzen oder Wetterdaten. Keine Freigabe, kein Merge, Deployment oder Promotion. Restoffen: vollständige reale Registrierungsupdateabnahme in regulärer CI sowie das unveränderte rote Webpaketbudget.
