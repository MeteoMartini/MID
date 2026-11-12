# MID #446 · ICON-D2-Vollgebiet: signiertes Originaldaten-Artefakt in kanonischen RUC-/Pages-Publisher aufnehmen

Stand 12.11.2026 · **Source-Basis:** `main=mid-stable=ef585fdbbfe475146d68868a6b671057f8b52e0d` (`v0.9.85.458`). **Integrations-Draft; kein produktiver Publish, keine neue Releaseversion.** Änderungen erfolgen nur auf `chatgpt/v0.9.85.458-d2-attested-pages-admission`.

## Vorhandene Arbeit übernommen – ausdrücklich kein neuer Originaldatenpilot

- #446 und historische #447/#449/#555/#600: Der DWD-ICON-D2-Vollgebietsausschnitt umfasst **542.040 native Zellen**. Vollständige Originaldaten-/NoData-/Geometrie-/GRIB- und SHA-Prüfer existieren; die v2-Consumer-Validierung ist in `src/nativeD2FullDomain.ts` vorhanden.
- `tools/ruc/d2_native_eight_bundle.py`, `stage_d2_native_full_domain.py`, `approve_d2_originals_protected.py`: acht Parameter × neun Laufstunden = 72 Originalfelder, physikalische Parametereinheiten, exakt gleiche Quelle/Laufzeit und echte Missing-Masken.
- `.github/workflows/mid-d2-original-release-approval.yml`: **unabhängiger geschützter GitHub-Actions-Signer** nach drei echten Original-DWD-Zyklen; attestiert exakt das geprüfte `index.json` über GitHub SLSA. Keine PRs, kein eigener Deploy, keine Branch-Writes.
- `tools/ruc/admit_d2_native_pages.py`: unverändertes Sicherheits-/Zulassungsgate für Originalframe-Hashes, 72 Felder, 73 native Objekte einschließlich Originalindex, 542.040 Zellen, UTC-Lauf/Lead, Signer-SLSA und physisches Pages-Budget.
- Schon vorhandener Original-RUC-Pages-Publisher: `ci/github/workflows/mid-ruc-preprocess.yml` plus Spiegel `.github/workflows/...`, mit RUC-Core +27h, EPS20, Verlustfrei-Codec, Rollback, 900-MB-RUC-/950-MB-Site-Grenze, Published Health/Pages und Stable-SHA-Gates.

## Tatsächlicher technischer Fehler und Korrektur

Das bisherige normale `mid-ruc-preprocess` übergab **keine** authentifizierte Signer-Quelle an die v2-`admit`-Funktion. Der signierte 72-Felder-Nachweis blieb ein archiviertes, aber für die App unerreichbares Artefakt. `ruc/latest.json` veröffentlichte daher nur `modelFields` (alte Deutschland-Teilmenge), nicht `modelFieldsNative`. Am 12.11.2026 zeigte der öffentlich SHA-verifizierte `mid.icon-d2.fields.v1`-Index weiterhin 410×505=207050 statt 542040 Punkte. Dies betrifft sowohl `winter-berge` als auch `sommer-gewitter`.

Der hier implementierte, **nur außerhalb der Live-Veröffentlichung ausführbare** Integrationspfad:
1. `select_protected_d2_approval.py` liest **nur** die aktuellen `main`-/`mid-stable`-SHAs, die GitHub-Identität des separaten geschützten Signer-Workflows, erfolgreiche signierte Runs (`schedule` oder `workflow_dispatch`) und genau eine unexpired Artifact-ID mit GitHub-SHA256-Digest. Exakter Quelle-SHA ist zwingend. Ein optionaler konkreter Run-ID-Parameter kann keine fremde Signatur/älteren Commit aktivieren.
2. Das vorhandene `actions/download-artifact` lädt ausschließlich dieses über GitHub bestätigte Artefakt mit `digest-mismatch: error` und ohne neue Credential-/Schreibrechte.
3. `augment_compressed_native_d2.py` arbeitet **nach** RUC-Codec-Aktivierung, **vor** RUC-Snapshot-Seal und -Download-Artifact. Es validiert Originalreport, externen Quell-SHA, Index-Digest, `productionApproved`, Zeitfenster ≤12 h; ruft das bestehende `admit_d2_native_pages.admit()` mit echten GitHub-SLSA-Überprüfungen auf. Es fügt atomar die 73 SHA-bilanzierten Dateien in das unveröffentlichte Pages-Staging ein, prüft unveränderte RUC-Objektmetadaten und den Gesamtbudgetvertrag und schreibt **zuletzt** das neue `latest.json` mit `modelFieldsNative.productionApproved=true`.
4. Der bisherige `prepared_snapshot seal`-/Predownload-/Publish-/Rollback-/Worker-/Pages-Ablauf bleibt erhalten und muss das vergrößerte Objektinventar erneut unabhängig prüfen. Kein eigener neuer Pages-Deploy-Pfad.
5. Der unabhängige Originaldatensigner nutzt den unveränderten geschützten `main=mid-stable`-SHA-Vertrag nun auch im sechsstündlichen GitHub-`schedule`-Ereignis. Der bestehende stündliche RUC-Lauf kann das aktuelle Originalpaket nach unabhängiger Signatur über denselben Readback finden. Bei fehlender/abgelaufener Signatur wird **kein `modelFieldsNative`-Feld erfunden**; die alten Modellkarten bleiben ein separater, kenntlich zu machender Fallback. Kein neuer kostenpflichtiger Dienst (GitHub-Public-Repository, GitHub-hosted Runner).

## Bestehende Schutzkonflikte ausdrücklich beibehalten

- **Keine automatische Freigabe bei `productionApproved`-Flag allein.** Der Release-Signer wird per GitHub Workflow-ID + SHA + SLSA-Subject + Sigstore gebunden. Nur echte offizielle 72-Felder-Originale sind zulässig.
- **Keine Mehrfachversionen / fremde Läufe mischen.** Der D2-Run darf vom RUC-Run abweichen, wird aber als eigene original-signierte Modellquelle geführt, nie als RUC-Feld umetikettiert.
- **NoData ≠ 0; keine künstliche Randauffüllung.** Vollgebiet-Gitter, native Masken, Extrema, Isobaren, Punktwert/Export bleiben durch unveränderte v2-Prüfer verpflichtend.
- **Alte RUC-Rollback-Bytes bleiben unangetastet.** Neue D2-Dateien nur in bereits lossless-aktivierter, noch nicht publizierter Site; bei Fehler exit nonzero, kein Publish.
- **PR #750 überschneidet sich mit genau zwei RUC-Workflowspiegeln.** Bei Lead-Integration source-SHA-/Hunk-gebunden mit #750 zusammenführen, nicht still überschreiben. PRs #748, #765 sind disjunkt. Kein eigenständiger Merge/Release im Spezialchat.
- **Offen:** Realer geschützter SLSA-Signer-Run nach Main/Stable-Promotion, signierter Artefakt-Download, originale 72 Binärfiles, echte `modelFieldsNative`-Readback (Sölden/Köln plus Rand/NoData), ausverkaufte RUC-/950-MB-Budgets, vollständige source-/heavy-/browser-/Worker-/Pages-/Stable-/native iOS-Gates. Eine grüne Unit/CI allein ersetzt diese Evidenz nicht.

## Live-Produktion abnehmen

`https://midwx.app/ruc/latest.json` muss **nach** erfolgreich durchlaufenen Source-/Installer-/Produktionsgates `modelFieldsNative` mit `productionApproved:true`, `nativePoints:542040`, `frameCount:72`, `indexSha256` und `sourceInventorySha256` ausliefern. Das dort referenzierte `index.json` und 72 echte Quellenframes müssen unter allen referenzierten URLs mit exakt den im RUC-Pages-Inventar eingetragenen SHA-/Bytes verfügbar sein. Die Sölden-Ortskarte muss auf demselben D2-Lauf und Prognosezeitpunkt echte Rasterwerte liefern; die native transparent maskierte Außenkontur darf nicht fälschlich den alten Deutschlandzuschnitt verwenden.
