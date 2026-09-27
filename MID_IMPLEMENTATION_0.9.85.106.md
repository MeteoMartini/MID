# MID v0.9.85.106 – ChatGPT↔Replit Collaboration Hardening

## Ziel

Replit bleibt die bevorzugte MID-Werkbank für Design- und UI-Anpassungen. Die Auftragssteuerung bleibt vollständig bei ChatGPT: Replit beginnt keine eigenständigen MID-Arbeitspakete, erweitert den Umfang nicht selbständig und autorisiert weder Integration noch Veröffentlichung.

## Verbindlicher Ablauf

1. ChatGPT prüft den aktuellen `mid-stable`-/`main`-Stand und erteilt einen konkreten Design-/UI-Auftrag.
2. Replit arbeitet ausschließlich innerhalb dieses Auftrags und übergibt den Stand als `replit/*`-Branch.
3. Vor und nach dem Ref-Write werden Basis-, Parent-, Commit- und Remote-Ref-SHA verifiziert.
4. Der read-only MID Replit Handoff Gate prüft den Handoff und blockiert Governance-, CI-/Release-, Worker-, iOS-, Versions- und zentrale Build-/Deploy-Pfade.
5. ChatGPT prüft Diff, Provenienz und Gate-Status und übernimmt nur freigegebenen Inhalt in einen `chatgpt/*`-Integrationsbranch.
6. Veröffentlichung erfolgt ausschließlich über Source-PR-Gate → kontrollierten Merge → serverseitiges Release-ZIP → Installer → Worker/Pages → Stable-Promotion.

## Sicherheitsentscheidung

Der im Replit-Workspace konfigurierte direkte SSH-Pfad wird nicht repariert oder durch einen neuen schreibenden Deploy-Key ersetzt. Für den normalen Handoff genügt die vorhandene GitHub-Integration/API; strikte SSH-Hostprüfung bleibt unverändert. Unklare Provenienz, Berechtigungen oder SHA-Abweichungen blockieren fail-closed.

## Persistenz

- `replit.md`: dauerhafte Projektregeln für Replit Agent.
- `.agents/skills/mid-handoff/SKILL.md`: aufgabenspezifischer MID-Handoff-Ablauf.
- `AGENTS.md`: gemeinsamer Agentenvertrag ohne den veralteten ZIP-im-PR-Weg.
- `MID_REPLIT_HANDOFF_CONTRACT.md`: Rollen-, Vertrauens- und Übergabevertrag.
- `ci/github/workflows/replit-handoff-gate.yml`: kanonische Quelle des read-only Replit-Gates.

Required Regression: `scripts/test-mid-collaboration-hardening-0985106.mjs`.
