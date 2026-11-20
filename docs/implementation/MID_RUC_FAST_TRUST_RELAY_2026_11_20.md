# MID #946 · Verifizierter Fast-Manifest-SHA-Transport (Source-Integrationskandidat, 20.11.2026)

## Iststand und Quelle

Kanonische Produktionsbasis vor Integration: `main=mid-stable=9fd872a789f4b158bc691d085589616c2c04f776`, v0.9.85.497. Dieser Nachweis betrifft den **ref-freien** .498-Quellkandidaten und ist **keine** Source-PR-, Worker-/Pages- oder Stable-Freigabe. Der alte PR #946 ist Draft auf v0.9.85.496. Vor jedem Merge erneut den aktuellen Stable-SHA und parallele Änderungen (insbesondere #955 an den beiden generierten Worker-Bundles) prüfen.

Die echten 0–6h-Originaldaten wurden am 19.11.2026 21Z mit 188 Original-GRIB2-Dateien (DWD ecCodes 2.50), 542040 nativen Rasterpunkten, 7 stündlichen, 73 nativen 5-Minuten- und 25 nativen 15-Minuten-Zeitpunkten dekodiert. Dieser ursprüngliche Beleg ist **nicht** automatisch ein frischer 20.11.-Run; kein EPS20/27h wird für die Fast-Quelle erfunden.

## Provenienz ohne neues Backend

Der bereits vorhandene, SHA-/Artifact-gebundene `publish_fast`-Job veröffentlicht unter dem **bestehenden** gemeinsamen `mid-pages`-Lock ausschließlich das getrennte Fast-Verzeichnis, prüft öffentliche Originalchunks/Manifest und den unveränderten Vollpointer. **Erst nach** dem erfolgreichen öffentlichen Readback erstellt `tools/ruc/build_fast_trust_receipt.mjs` aus dem geschützten `main`-Workflow mit `GITHUB_SHA == STABLE_SHA`, einem frischen DWD-Lauf und dem authentifizierten `fast-delivery-proof.json` ein unabhängiges R2-Vertrauensobjekt.

`ruc/fast/publisher-trust.v1.json` wird mit der **bereits vorhandenen** GitHub→Cloudflare-Autorisierung in den bestehenden `MID_RUC_R2_BUCKET` geschrieben und vor Jobabschluss bytegleich remote zurückgelesen. Fehlender Bucket, fehlende Cloudflare-Autorisierung, veralteter/future Run, falsche SHA, fehlender Digest, 900-MB-Sitebudget oder nicht bytegleicher R2-Readback führen zu Jobfailure und dem bereits vorhandenen Pages-Rollback. Es werden keine Secrets ausgegeben, keine Cloudflare-Rulesets verändert und keine zusätzlichen Nutzeraccounts oder kostenpflichtigen Dienste eingebunden. R2-Berechtigung ist vor echtem Workflow-Run **nicht** aus bloßer Repo-Codelektüre als vorhanden behauptbar.

Der Worker ermittelt den freigegebenen Fast-Manifest-SHA zuerst aus einer **explizit administrativ gesetzten** SHA-/Enable-Bindung oder alternativ automatisch aus dem bestehenden RUC-R2-Binding `MID_DWD_RUC_DATA` mit genau diesem unabhängig gespeicherten, schema-/versions-/repository-/laufgebundenen Beleg (30s Cache pro Binding). Öffentliche Pages-Header, die URL, öffentliche Manifestfelder oder beliebige Clientparameter dürfen **keinen** Vertrauensanker erzeugen. Die Option `MID_DWD_RUC_FAST_ENABLED='false'` deaktiviert Fast weiterhin sofort. Der ursprüngliche R2-/Full-Pages-/Legacy-Punktpfad bleibt als Fallback erhalten.

Missing Data bleibt `null`, eine tatsächlich belegte Niederschlagsmenge `0` bleibt `0`, EPS20 bleibt `unavailable`. Keine neue Nachbarschaftsglättung oder Pseudowahrscheinlichkeit. Modellrun und UTC-Gültigkeit müssen im Manifest und im R2-Beleg korrespondieren und innerhalb des bestehenden 4h-Fensters liegen.

## Im Quellkandidaten vorhandene Prüfschritte

- `node --test tools/ruc/test_build_fast_trust_receipt.mjs`: 2 Tests mit zwölf Negativfällen; Ref-/Repository-/SHA-/UTC-/Budget-Missbrauch wird verweigert.
- `node --test tests/unit/mid-ruc-fast-pages-worker-point.test.mjs`: zehn Tests, darunter neuer R2-Positivpfad und Abwehr von fehlerhaften, veralteten, fehlenden Belegen oder deaktivierter Funktion.
- Die beiden Serien sind über `scripts/test-ruc-fast-pages-worker-point-qa-0985498.mjs` in den bestehenden `MID_BASELINE.json`-Pflichtregressionen registriert. Der Wrapper prüft zusätzlich die bytegleichen Workflow- und Worker-Spiegel sowie die Rollback-Bedingung.

**Stand der tatsächlichen Ausführung:** Die neuen Writer-Original-Git-Blobs wurden unter Node 22 außerhalb der CI bytegleich nachgebildet und beide Builder-Tests bestanden. Die **ganze** Worker-Regression, GitHub Source/Core/Heavy, Cloudflare-Objektschreibrecht, realer Pages-/Worker-Readback, iOS und Stable-Promotion wurden für diesen Kandidaten nicht ausgeführt und sind nicht als erfolgreich zu melden.

## Freigabeentscheidung

Nur kontrollierter `chatgpt/*`-/`codex/*`-Source-PR aus diesem vollständigen SHA-Stand, vorhandener Source-PR-Gate, bestehender MID-App-Release-Bot und serverseitiges ZIP, `install-mid.yml`, betroffene Worker-/Pages-Checks und Stable-Promotion. Kein direkter Schreibzugriff auf `main`/`mid-stable`, keine persönliche Ruleset-Umgehung. `#176` (separater Agent-Ref-Transport) ist kein allgemeines zusätzliches Release-Gate.
