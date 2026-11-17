# MID #740 / PR #839 – belegte Originalartefakt-Lücke im realen Stable-Release .488

Stand 17.11.2026 · **read-only / QA ONLY**, kein Installer-Cutover, keine Produktionsfreigabe.

## Originale GitHub-Releasekette

Am 17.11.2026 wurde **v0.9.85.488** erfolgreich über den unveränderten Legacy-Pfad veröffentlicht. Verifizierter Stable: `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953`, drei Versionsspiegel synchron. Echte GitHub-REST-Kette:

| Stufe | Original-SHA/Run | Nachweis |
| --- | --- | --- |
| Vorheriger Stable .487 | `ee70a92ae6ed83d3fa46445f4941e3db8b8675d4` | Ausgangsbasis |
| PR #898 Source-Merge | `9dffb1abc7a2b158eb7f4255e34fb1dead5b6de9` | Git Parent .487 |
| Quell-Producer | [Run #44121439604](https://github.com/MeteoMartini/MID/actions/runs/44121439604) | completed/success, Attempt 1, Sourceworkflow `358777143`, Job `134173572538` |
| ZIP-only-Paketcommit | `c086e51c2bad1e4958651111eb5fa01a808179fa` | Parent = Source-Merge |
| Legacy Installer | [Run #44121560818](https://github.com/MeteoMartini/MID/actions/runs/44121560818) | workflow_dispatch, completed/success, HEAD Paketcommit |
| Installed Stable .488 | `9fe4dfbcdfd5a1f8fec55efa868e22110a612953` | Parent = Paketcommit |

**Kritische Originaldaten:**
- `GET /actions/runs/44121439604/artifacts?per_page=100&page=1` → `total_count:0`, `artifacts:[]`. Der Producer hat also **keinen** originären, fertiggestellten Actions-ZIP-Handoff hinterlassen.
- Sein ursprünglicher Job zeigt zwar die erfolgreichen Stufen `Geprüften Agent-PR automatisch zusammenführen` (6), `Release-ZIP aus dem aktuellen main-Quellstand erzeugen und committen` (8), `Bewährten MID-Installer explizit starten` (9), aber **keinen** Original-ZIP-Upload-Step.
- Der Installer wurde um **16:04:28 UTC** gestartet, der Producer-Run war erst **16:04:34 UTC** abgeschlossen. Damit konnte dieser Legacy-Installer einen aus genau diesem **abgeschlossenen** Producer authentifizierten Originalartefakt-Readback nicht als Startvoraussetzung gehabt haben. Das ist ein Beleg einer nachweislichen *fehlenden Sicherheitsvoraussetzung*, keine Aussage, dass die veröffentlichte Wetter-App defekt sei.
- Der Installer hat selbst 13 Actions-Artefakte (u.a. Pages-Snapshot). Diese dürfen NICHT mit einem im vorherigen Producer erzeugten, unabhängig konsumierten Original-ZIP verwechselt werden.

## Neu in diesem Security-Draft

`tools/ci/mid-740-legacy-producer-gap-qa.mjs` prüft ausschließlich lesend die originalen SHA-/Run-/Attempt-/Repository-/Workflowregistrierungs-/Job-/Step-/Zeit-/Git-Parent-/Artefaktinventar-Ketten **zweimal** über GitHub-REST. Er meldet nur `ORIGINAL_488_PRODUCER_ARTIFACT_GAP_QA_ONLY`, wenn genau diese reale Lücke vollständig belegbar ist. Jede Mutation (neuer Upload, abweichender SHA, Job, Zeitfolge oder REST-Race) liefert `BLOCKED` und fordert eine eigenständige neue Herkunftsprüfung. Ein eventuell neu vorhandenes Artefakt wird ausdrücklich NICHT ohne eigenständige Digest-/Git-Blob-/Installer-Input-Validierung legitimiert.

`tests/unit/mid-740-legacy-producer-gap-qa.test.ts` führt Positiv-/Negativproben gegen synthetische Github-REST-Objekte mit den tatsächlichen IDs aus. Der bestehende **PR-only**-Shadow `.github/workflows/mid-740-pr-artifact-shadow-qa.yml` und dessen byteidentischer `ci/github/workflows`-Spiegel werden um diesen reinen QA-Schritt ergänzt. Berechtigungen bleiben `contents:read`, `actions:read`; kein Deployment, kein Git-Push, kein Secret oder zusätzlicher Token. Die ursprüngliche historische .486-Forensik bleibt separat.

## Technische Schranken

Der QA-Erfolg bedeutet ausschließlich, dass eine **negative Produktionsherkunftstatsache** reproduzierbar bestätigt wurde. Der Output enthält unaufhebbar `originalProducerArtifactAttested:false`, `independentPreInstallerVerified:false`, `nativeReviewEnforced:false`, `installerAuthorized:false`, `releaseAuthorized:false`.

**Offen für produktiven #839/#740-Abschluss:** echter abgeschlossener Originalproducer/Upload, unabhängiger konsumierender Installer-Workflow, originalbytegenaue P0/P1/P2-Review- und Git-Tree-E2E-Prüfung, beide Legacy-Main-Writes nur gemeinsam ablösen, versionierte unveränderliche ZIP-/dist-/Widgets-/RUC-/PWA-/Pages-Restore-/Rollback-Assets, gesamte vollständige Source-/Core-/Heavy-/Worker-/Pages-/Stable-Gate-Kette. #839 bleibt DRAFT, #740 OPEN und ist kein pauschaler Blocker anderer unabhängiger Release-Trains.

GitHub-Referenzen: https://docs.github.com/en/actions/reference/security/secure-use , https://docs.github.com/en/rest/actions/artifacts .
