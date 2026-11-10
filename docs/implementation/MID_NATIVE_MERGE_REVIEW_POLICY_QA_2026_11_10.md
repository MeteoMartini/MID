# MID Merge-Zeitpunkt-Review-Erzwingung – isolierte QA

Ausgangsbasis (10.11.2026): GitHub MeteoMartini/MID, veröffentlichte Stable-Version v0.9.85.454 auf ee7a55b5ece4d3d3687202a95caeb6c5ff615055. Der parallele Integrations-PR #745 ist weiterhin Draft. Die damaligen fünf aktiven Rulesets enthalten keine separat erzwungene GitHub-native Pull-Request-Review- und Thread-Resolution-Gate auf main. Ein zweimaliger GraphQL-Readback vor PUT /merge ist NICHT atomar.

Neue QA-Dateien:
- scripts/mid-native-merge-review-policy.mjs: authentifizierter, read-only GitHub-GET-Auditor mit strikt festem API-Ursprung und Fail-Closed-Pure-Policy; jede Rückgabe behält mergeAuthorized:false und releaseAuthorized:false.
- scripts/qa-mid-native-merge-review-policy.mjs und tests/unit/mid-native-merge-review-policy.test.ts: simulierte echte Parser-/HTTP-/Policy-Negativprüfungen ohne externe Aufrufe oder Secrets.

Vor einem Merge muss eine aktive GitHub-Branch-Ruleset auf refs/heads/main mit pull_request-Regel existieren, die mindestens eine unabhängige Genehmigung, vollständige Thread-Auflösung, Verwerfung alter Approvals, Zustimmung zu letztem Push sowie KEINE Bypass-Akteure erzwingt. GitHub selbst muss diese Regel beim tatsächlichen Merge durchsetzen. Aktuell ist diese Bedingung nicht nachgewiesen und bleibt bewusst BLOCKED. Der GitHub-App-Zugang besitzt keine Berechtigung, bestehende Rulesets administrativ zu verändern; keine Umgehung, kein PAT und keine heimliche Eskalation.

Dieses Modul prüft ausschließlich Metadaten. Es ist auf einem eigenen chatgpt/* QA-Draft aus unveränderter Stable-Basis isoliert und NICHT in den bestehenden produktiven Release-Workflow eingebaut. Ein nicht veröffentlichter Draft-Workflow könnte seinen eigenen ersten Merge ohnehin nicht schützen. Der Leit-Chat MID 18.2.88 muss eine echte administrative Regeländerung separat prüfen und dann sichere Einbindung samt vollständigem Source-, Integrations-, Installer-, Worker-, Pages- und Stable-Gate verantworten. Ein resolved-Flag ersetzt keine unabhängig dokumentierte Disposition des zugrunde liegenden Findings.

Kein Merge, keine Deployment-, Secrets-, Modell-, Meteorologie- oder Abovariantenänderung.