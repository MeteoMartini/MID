# MID – Review-Merge-Gate 11.11.2026 (QA, nicht produktiv)

Source SHA: 7272a54ef9a9bd02fa1b6523f0cbf352b9412963, v0.9.85.455, main=mid-stable. #740/#752: 16 offene Reviewthreads beim Bot-Merge.

Schutz 1 im bereits etablierten Release-Bot: vollständige paginierte GitHub-GraphQL-Reviewthreads und Reviews, doppeltes REST-PR-Readback, exakter Head/Trusted-Branch, aktueller main=mid-stable-SHA, alle Threads aufgelöst, kein aktives CHANGES_REQUESTED. Fail-closed bei API-403, Drift, Paging, inkonsistenter Provenienz. Nur lesend; Script kommt aus veröffentlichtem Stable, nicht dem PR-Head. Keine Pflicht-Cubic-Verfügbarkeit, keine neuen Secrets oder zusätzlichen Merge-/Deploypfade.

Schutz 2 ist serverseitig zwingend: Der Repository-Owner aktiviert nach isoliertem Test eine eigenständige **klassische** Branch-Protection-Regel nur für main: Require conversation resolution before merging = ON, Enforce for administrators = ON. Require a pull request before merging und erforderliche Approvals NICHT zusätzlich einschalten; keine Bypässe, kein Signed-Commits-Gate. Die fünf aktuellen Rulesets bleiben erhalten. GitHub-Rulesets koppeln die Conversation-Pflicht an eine Require-PR-Regel, die den direkten serverseitigen ZIP-Commit nach dem normalen Bot-Merge verhindern könnte.

Vor Freigabe zwei echte nichtproduktive Tests mit demselben Release-App-Aktor: (A) offener Inline-Reviewthread nach Source-success verhindert PR-Merge; (B) nach unabhängig fachlich begründeter Disposition und Threadauflösung ist der SHA-gebundene PR-Merge möglich und ein direkter nicht-forcierter ZIP-artiger Folgecommit weiterhin möglich. Keine echten Testmerges nach main. Die klassische GitHub-Adminregel kann der ChatGPT-App-Connector mangels Administration:write nicht aktivieren; HTTP 403 beim klassischen Schutz-GET ist kein Grund für PAT/Scope-Erweiterung.

Bootstrap-Warnung: GitHub workflow_run benutzt den Workflow aus dem aktuellen Default-Branch. Deshalb MUSS die klassische native Regel bereits vor dem allerersten Source-Ready/Release des neuen Bot-Workflows wirksam sein. Der erste Merge des Codefixes selbst wird noch vom alten Stable-Workflow durchgeführt. Ein vorgelagertes GraphQL-Readback allein schließt die Merge-Race nicht.

Fehler sind lösbar durch belegte Reparatur, unabhängig geprüfte False-Positive-Disposition oder zulässige P3-Zurückstellung. Kein automatisches Resolve, kein selbst vergebenes Approval. Amtliche Warnungen/Wetterdaten-/NoData-Semantik und vollständige Source-/Installer-/Stable-Gates bleiben bindend.

Kein Merge, Installer, Deployment, Ruleset- oder Secret-Write durch diesen Draft.