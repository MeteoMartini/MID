# MID v0.9.85.107 – Replit Final-Ref Gate

## Ziel

Der sichere Replit-Handoff arbeitet mit vollständig erzeugten Git-Objekten und legt den fertigen `replit/*`-Branch-Ref erst am Ende an. Der read-only Handoff-Gate muss deshalb neben klassischen Pushes auch dieses Branch-Create-Ereignis automatisch erfassen.

## Vertrag

- Jeder abgeschlossene Replit-Handoff erhält einen frischen `replit/*`-Branch.
- Basis-, Parent-, Tree-/Blob- und Commit-SHAs werden vor Ref-Erstellung geprüft.
- Der Branch-Ref wird erst nach vollständigem Objekttransfer einmalig angelegt und unmittelbar zurückgelesen.
- Ein bereits geprüfter Handoff-Ref wird nicht für Nacharbeit weitergeschoben; Nacharbeit erhält einen neuen Branch.
- Der Replit-Handoff-Gate reagiert auf `create` für Branches unter `replit/*`, weiterhin auf klassische `push`-Ereignisse sowie auf direkte Replit-PRs nach `main`.
- Der Gate bleibt read-only und erhält keine Secrets oder Deploy-Rechte.
- Release-, Worker-, iOS-, Governance- und zentrale Build-/Deploy-Pfade bleiben für Replit-Handoffs blockiert.

## Anlass

Der gesicherte historische Replit-Arbeitsstand `replit/mid-18-2-15-progressive-mountain-weather` wurde korrekt über Git-Objekte und einen finalen Ref übertragen. Da der bisherige Workflow nur auf `push` lauschte, entstand bei diesem sicheren API-Handoff kein automatischer Gate-Lauf. v0.9.85.107 schließt genau diese Trigger-Lücke, ohne SSH-Schlüssel, künstliche Trigger-Commits oder weitergehende Replit-Rechte einzuführen.

## Geschützter ChatGPT/Codex-Ref-Broker

Die Trusted-Agent-Rulesets bleiben geschlossen. ChatGPT/Codex dürfen Git-Blobs, Trees und Commits ohne Ref-Änderung vorbereiten. Der feste Broker-Kanal Issue #176 akzeptiert ausschließlich eng formatierte Aufträge des Repository-Eigentümers für `chatgpt/*` oder `codex/*`. Der Broker validiert vollständige SHAs, eine identische aktuelle `main`-/`mid-stable`-Basis, Stable-Abstammung sowie bei bestehenden Branches einen echten Fast-Forward. Nur der dedizierte MID Release Bot erhält das kurzlebige Contents-Write-Token für den eigentlichen Ref-Write. `main`, `mid-stable`, Replit-Handoffs, Force-Updates, PRs, Releases und Deployments sind nicht Teil dieses Brokers.

Required Regressions: `scripts/test-replit-create-event-gate-0985107.mjs`, `scripts/test-agent-ref-broker-0985107.mjs`.
