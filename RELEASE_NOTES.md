# MID v0.9.85.106

- Replit bleibt die gezielte MID-Werkbank für Design- und UI-Anpassungen; konkrete MID-Arbeitsaufträge an Replit werden ausschließlich von ChatGPT erteilt.
- Replit übergibt Änderungen nur über geprüfte `replit/*`-Handoffs. Prüfung, Integration und Veröffentlichung bleiben bei ChatGPT und dem geschützten GitHub-Releasepfad.
- Ein fehlender lokaler SSH-Deploy-Key wird nicht durch einen neuen Schreibschlüssel oder gelockerte Hostprüfung ersetzt; der vorhandene GitHub-Integrationsweg nutzt SHA-Verifikation vor und nach dem Handoff.
- Persistente Replit-Regeln und ein projektgebundener MID-Handoff-Skill machen den Ablauf auch nach neuen Replit-/ChatGPT-Sitzungen reproduzierbar.
- Das Replit-Handoff-Gate schützt zusätzlich Governance-, Agent-, CI-/Release-, Worker-, iOS-, Versions- und zentrale Build-/Deploy-Dateien vor direkten Replit-Änderungen.
