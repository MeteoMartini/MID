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

Required Regression: `scripts/test-replit-create-event-gate-0985107.mjs`.
