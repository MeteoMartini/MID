---
description: "MID Copilot: prepare a provenance-complete, non-releasing handoff"
---

# MID Copilot – sichere Ergebnisübergabe

Bereite für den ausdrücklich beauftragten MID-Arbeitsschritt einen prüfbaren Handoff an ChatGPT/autorisierten Integrator vor. **Nicht selbst veröffentlichen.**

- Auftrag und bewusste Nicht-Ziele; Basisprüfung (Zeit, Remote `main` und `mid-stable` als volle SHAs, Version), bestehende parallele PRs.
- Sicherung eigener Arbeit: Working-Tree-Status, lokaler Branch, Parent-/Head-/Tree-SHA, jede geänderte Datei inklusive Herkunft und Abgrenzung zu Fremdarbeit. Keine ungesicherten Änderungen durch Reset/Rebase verlieren.
- Tests mit exakten Kommandos und PASS/FAIL/NOT VERIFIED, inklusive Version, Typecheck, Meteorologie-Regressionen, CI/Budget und tatsächlicher Browser-/iOS-Abnahme. Für nicht ausgeführte Pflichtprüfungen klar die Gründe nennen.
- Fachlich relevante Daten: Quelldienst, run/valid time, Einheit, Akkumulation, Missing, Ensemble/Vertrauen, Warnabgrenzung; Datenschutz- und Sicherheitsfolgen.
- Wurde eine **explizit autorisierte** isolierte Copilot-Kandidatenübergabe technisch ermöglicht? Falls nein, lokale Änderung bewahren und reproduzierbaren Diff bzw. Patch beschreiben. **Kein** eigenmächtiger Schreibzugriff auf `chatgpt/*`, `codex/*`, `main` oder `mid-stable`.
- Gib Integrationsrisiken, Konfliktlage, fehlende Entscheidungen und nächste unabhängige Verifikation an. Vermerke: **kein Merge, kein Installer, kein Pages/Worker-Deploy, keine Stable-Promotion**.
