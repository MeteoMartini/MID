# MID .378 – Attestierungs-Consumer: sicherheitsneutrale Qualifikation, **keine** Releasefreigabe

Quellbasis: `main = mid-stable` v0.9.85.377 @ `44f5d02b0374b275e423e43233addff91d4eeb82`. Dies ist eine **Draft-Entwicklung** und noch kein neuer veröffentlichter MID-Build. Issue #526 bleibt offen.

## Zweck und Grenzen

`tools/ci/attested-reuse-policy.mjs` ist ausschließlich ein offline/CLI-qualifizierender, **lesender** Vertrauens- und Inhaltsprüfer. Sein Ein- und Ausgabeformat setzt `releaseAuthorized:false` und `reuseAuthorized:false` voraus; auch bei allen bestandenen Vergleichen bleibt beides **false**. Kein Source-Job, Core-Shard, Heavy-Shard, Installer, Worker, RUC, Pages, Stable-Gate, Review, Signaturvorgang oder Tokenprivileg wird durch diesen Kandidaten verändert oder ersetzt.

Die bestehende öffentliche .377-Version wurde über PR #529, Source-Gate 41083615668, SHA-Bot 41085076448 und Installer 41085126544 nachweislich veröffentlicht. Die bisherige Build-Paritäts-Qualifikation vergleicht unabhängig reproduzierbare Eingaben und Ausgabedateien, jedoch **kein vertrauenswürdiges signiertes Produzentenmanifest**. Zeitstempel in `mid-build-identity.json` unterscheiden sich trotz gleichem Nutzinhalt; eine vollständige Byteidentität darf daraus nicht gefolgert werden.

## Prüfvertrag dieses Kandidaten

1. Vertrauensanker ist ein separater, künftig auf dem geschützten `main` auszuführender Producer `MeteoMartini/MID/.github/workflows/attested-source-qualification.yml`, nicht der Code eines beliebigen Pull Requests. Der künftig zulässige Signing-Workflow und dessen vollständiger Commit-Digest müssen aus dem geschützten, geprüften Repository verifiziert werden. Der reine Modulname **erschafft keinen vertrauenswürdigen Producer**.
2. Das **tatsächlich geladene** JSON-Artefakt muss ein bekanntes SHA-256 und eine lückenlose, eindeutige Source-Jobliste haben: einen Source-Core, alle vier Core- und alle sechs Heavy-Shards; für jeden `success` mit demselben erwarteten Run, Attempt und Quell-HEAD. Unbekannte Felder, fehlende/duplizierte Jobs, abweichende Quelle, Tree, Lockfile, VITE-/Environment-Fingerprint, Version, Run/Attempt, Ablaufzeit oder Flags werden abgewiesen. Ein signiertes Manifest bleibt ohne vertrauenswürdigen Produzentenangriffsschutz **nur Behauptung**, nie Beweis des durchgeführten Jobs.
3. Der Verifier darf nur das echte, erfolgreiche `gh attestation verify`-Resultat akzeptieren; er ruft die GitHub CLI mit fixierter `--repo`, `--signer-workflow`, `--signer-digest`, `--source-ref`, `--source-digest`, `--deny-self-hosted-runners`, `--format json` und **ohne `--bundle`** auf. Danach werden die kryptografisch abgesicherten Zertifikatfelder `sourceRepositoryIdentifier` und `sourceRepository`, die verifizierten Zeitstempel, die in-toto/SLSA-Subject-Digests und die tatsächlich geladenen Bytes mit dem getrennt angelegten, vertrauenswürdigen Kontext verglichen. Es gibt keine automatische Freigabe aus GHA-`success`-Feldern.
4. Die synthetischen adversariellen Tests in `tools/ci/attested-reuse-policy.test.mjs` prüfen fehlende/abweichende Signaturen, falsche Repo-ID, falsch signierende Workflows, Quell-SHA, Tree, Lock, Env, Versionsspiegel, Run/Attempt, Ergebnisinventar, Digest, Zukunfts-/Ablaufzeit und unzulässige Release-/Reuse-Flags. Sie werden über den unveränderten obligatorischen `test-build-parity-0985377.mjs`-Einstieg geladen.

## Noch zu beweisen – **fail closed**

- Erlaubnisfreie Einrichtung und Versionierung eines tatsächlich geschützten, von PR-Eingaben getrennten Signatur-Producers (minimal `id-token:write`, `attestations:write`, `contents:read` nur im qualifizierten Job), mit fachlich unverfälschbarer Evidence. **Dieser PR aktiviert keine solchen Rechte.**
- Echte erfolgreiche `gh attestation verify`-Ausführung gegen Signatur und Dateien des vorgesehenen GitHub-Hosts; synthetische Verifierausgaben sind kein Kryptonachweis. Unabhängige Rekonstruktion der vollständigen Jobmenge direkt aus GitHub Runs statt aus vom PR gelieferten Assertions, Retry/Attempt/PR-Head-/Merge-Tree- und Baseline-Race-Gegenproben.
- GitHub-Artefaktdownload mit Digestprüfung; Replay/Expiry/Fork/PR-Cache-/Same-Run- und fremde Workflow-Identitätsattacken; Inhalt/Lock/Build-/Node-/npm/VITE-Vertrag; Worker-/RUC-/Codec-/Pages-Zusatzprüfung separat und vollständig.
- Repräsentativer A/B-Vergleich **identischer** Source-/Tree-SHAs mit **identischen** Safety-Gates über reale Worker/Pages/Stable-Releases und ausreichend reguläre Veröffentlichungen für neue P50/P95; kein künstlich erzeugter Release nur für Statistik.

**Sicherheitsentscheidung:** Keine produktive Wiederverwendung bis zum vollständigen vertraglichen Nachweis und einer gesonderten, für den exakten PR-Head autorisierten Integration. Kein GitHub-Admin-Bypass, keine erweiterte Tokenberechtigung, keine Umgehung der bestehenden Release-Gates.

Offizielle Dokumentation: https://cli.github.com/manual/gh_attestation_verify ; https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations ; https://docs.github.com/en/actions/reference/security/secure-use
