# MID – GitHub-Releases, Tags und Changelog-Provenienz (QA-Audit 17.11.2026)

> **Nur dokumentierte Bestandsaufnahme. Kein Release, Tag, Installer-Dispatch, Merge oder Eingriff in GitHub-Rulesets.**

## Verifizierter GitHub-Stand

- Freigegeben: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, **v0.9.85.486**; Versionsspiegel `package.json`, `MID_BASELINE.json` und `contracts/index.json` stimmen überein. Fünf Rulesets aktiv.
- GitHub `GET /releases?per_page=100`: **drei** Release-Objekte: `v0.9.85.116` und `v0.9.85.119` (beide 28.09.2026; keine Assets) sowie `widget-latest` (eigenständiges rollierendes Widget-Prerelease mit vier aktualisierbaren Assets).
- GitHub `GET /git/matching-refs/tags`: genau **drei Tags**, dieselben Namen. `v0.9.85.486` und weitere verifizierte neue Stable-Versionsnummern sind **keine** Git-Tags oder GitHub-Release-Objekte.
- Die produktiven `.github/workflows/agent-source-release.yml` und `.github/workflows/install-mid.yml` führen Source-Gate → SHA-Bot → ZIP-Commit → Installer → Workergates/Pages → Stable-Fast-Forward aus, enthalten aber **keine verpflichtende versionierte GitHub-Release-Erstellung**. Nur `.github/workflows/widget-export.yml` nutzt `gh release view/edit/create/upload` ausdrücklich für `widget-latest`. **Build-/Stable-Version ≠ GitHub-Release/Tag.**
- Keine versionierten Release-Einträge rückwirkend erzeugen oder neue historische ZIPs behaupten, solange der zugehörige frühere Stable-SHA, die Installer-/Deploy-/Review-Gates, Originalpaketbytes und ihre Herkunft nicht unabhängig belegt sind.

## Changelog-Originale und belegte Struktur

- Stable Git-Blob **`148e1fbb778dd596ed4e865c937eec18f1076f16`**, sowohl `CHANGELOG.md` als auch `public/CHANGELOG.md`, jeweils **1.098.014 Bytes**. Die API für gewöhnlichen Dateitext gibt diesen übergroßen Inhalt nicht vollständig zurück; der Git-Tree und das direkte Git-Blob-Endpunkt-Readback bestätigen den Inhalt.
- Darin: **491** Versionsüberschriften beliebiger Markdown-Ebenen 1–4, **455 verschiedene** Nummern der Reihe `0.9.85.x`. Genau **36** Überschriften sind zusätzliche Nennungen bereits vorhandener Versionen, nicht 36 weitere Builds. Einzelne Nummern fehlen im Überschriftenindex; daraus folgt **nicht**, dass es nie einen Build gab oder seine Auslieferung bestätigt wäre.
- Im unveröffentlichten LC-Draft `v0.9.85.487` / HEAD `2a0fc36cbd954a83da6713da3fa305307a448fc3` hat der vorherige Git-Blob **`6d9a70a568082a388c21bff24348ba7effb01dda`**: **492** Überschriften und **456 verschiedene** Versionen. Mit exakt demselben Parser sind sämtliche **455 Stable-Überschriftenversionen vorhanden**; nur die noch nicht veröffentlichte `.487` ist neu. Frühere unterschiedliche Zahlen 455 vs. 333 beruhten auf inkonsistentem Header-Level-Filter und sind **kein** belegter Verlust.
- `MID_BUILD_CHANGELOG.md` ist ein anderer, technischer Bestand (rund 360 KB, mit mehreren Draft-/Fach- und Teilbelegen). `RELEASE_NOTES.md` ist ein **rollierender**, kompakter jüngster Notizenbestand; aktuell .472–.486 im Stable. Diese drei Quellen haben verschiedene Zwecke. Weder historische Notiz noch QA-Draft gilt allein als verifiziertes ausgeliefertes Release.
- MID selbst lädt derzeit `public/CHANGELOG.md` erst beim Öffnen des Changelog-Dialogs; `src/changelogOverlay.ts` rendert zunächst nur **160 Zeilen**, ältere nach Benutzerauswahl `Ältere Änderungen laden`. GitHub-Markdown-Vorschauen großer Dateien können wegen Komplexität verzögert oder unvollständig erscheinen (offizielle GitHub-Dokumentation zu Repository-Textlimits). Dieses **Darstellungsproblem** ist von fehlenden GitHub-Release-Objekten zu unterscheiden.

## Konkrete Ursache und begrenzte Source-QA-Korrektur

`scripts/sync-version.mjs` enthielt zuvor den Pfad: Wenn die Changelog-Topzeile noch nicht zur Paketversion passt, wird die **vollständige** mehrversionige `RELEASE_NOTES.md` als Präfix vor `CHANGELOG.md` und `public/CHANGELOG.md` geschrieben. Das kann alte Abschnitte wiederholt vorn anhängen, obwohl sie längst vorhanden sind. `scripts/prepare-release-repository.mjs` fügt dagegen bereits ausdrücklich nur die aktuelle Version aus `docs/releases/MID_RELEASE_NOTES_<version>.json` hinzu.

Dieser QA-Draft ersetzt beim nächsten Versionswechsel ausschließlich den **ersten** gültigen, aktuellen Abschnitt der rollierenden Notizen und erhält den übrigen Quelltext unverändert. Synthetische Regressionen decken die strikte Versionsbindung, vorherige Historie, Idempotenz, fehlende Quellen und unzulässige Duplikatposition ab. **Keine automatische Bereinigung alter Dubletten oder Löschung der ursprünglichen 1-MB-Historie:** Abgleich widersprüchlicher Notizblöcke und historische Veröffentlichungsnachweise bleiben getrennte Aufgaben.

## Freigabepfad für einen echten GitHub-Release-Katalog

1. **Sicherheits-Spezial-PR [#839](https://github.com/MeteoMartini/MID/pull/839) / Issue [#740](https://github.com/MeteoMartini/MID/issues/740):** Die künftig verbindliche, SHA-gebundene GitHub-Release-Erstellung darf nur im unabhängigen, reviewgeschützten Source-/Installer-/Stable-Pfad ergänzt werden, nicht als zweiter Bot-Merge- oder Direktveröffentlichungspfad.
2. Zuerst Originalbytes und Digest der echten `MID-professional-replacement.zip`/`MID-dist-release.zip` und Manifest-/Run-/Attempt-/Stable-SHA-Bindung, negative Tests und die vorhandenen Restore-/Widget-`widget-latest`-Fälle prüfen. Eine vorgezogene Aktivierung der Repository-Release-Immutable-Einstellung kann den rollierenden Widget-Release (mit `--clobber`) gefährden.
3. Versioniertes Release nur zur **nachweislich erfolgreichen** Promotion und korrekten Originalversionsnummer, mit endgültigen User-Notizen, Authentizität/Attestation und allen echten Assets. Keine Dummy-Assets, neuen ungebundenen Tags oder rückwirkenden Releases mit erfundenem Zustellstatus.
4. Für historische Stable-Versionen eine separate SHA-/CI-/ZIP-/Deployment-Inventur mit eindeutiger Einstufung `verified historical release` versus `documented version only` durchführen. Lücken offen ausweisen; nicht blind Versionen von .116 bis .486 durchnummeriert als Releases deklarieren.
5. Bis dahin sind [GitHub-Releases](https://github.com/MeteoMartini/MID/releases), [jüngste Notizen](../../RELEASE_NOTES.md), [voller Changelog](../../CHANGELOG.md) und [technischer Verlauf](../../MID_BUILD_CHANGELOG.md) unterschiedliche, transparente Ansichten. Die Veröffentlichung bleibt ohne vollständige Source-/Review-/Installer-/Worker-/Pages-/Stable-Gates ausdrücklich gesperrt.

## Offizielle GitHub-Dokumentation

- [Releases vs. Git-Tags (GitHub REST)](https://docs.github.com/en/rest/releases/releases)
- [GitHub Repository Text-/Diff-Limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits)
- [Immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases)
