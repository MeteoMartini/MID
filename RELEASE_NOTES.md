# MID v0.9.85.107

- Replit-Handoffs werden künftig auch dann automatisch geprüft, wenn der fertige `replit/*`-Branch erst nach vollständigem Git-Objekttransfer angelegt wird.
- Jeder abgeschlossene Replit-Handoff verwendet einen neuen Branch; bereits geprüfte Handoff-Refs werden nicht nachträglich weitergeschoben.
- Der bestehende read-only Handoff-Gate bleibt ohne Secrets und Deploy-Rechte und blockiert weiterhin Governance-, Release-, Worker-, iOS- und zentrale Build-/Deploy-Dateien.
- Der sichere Handoff benötigt weiterhin keinen schreibenden SSH-Deploy-Key und keine künstlichen Trigger-Commits.
