---
description: "MID Copilot: verified read-only task preflight before any implementation"
---

# MID Copilot – Auftrag vorab prüfen (nur lesend)

Aufgabe: **[Hier die konkrete, eng begrenzte Aufgabe ergänzen]**.

1. Lies `AGENTS.md`, `.github/copilot-instructions.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `package.json` und die zutreffenden Verträge.
2. Ermittle GitHub live: vollständige SHAs von `main` und `mid-stable`, Version, aktive Rulesets, offene PRs/Drafts, `copilot/*`-/`chatgpt/*`-/`codex/*`-/`replit/*`-Überschneidungen. Kein Arbeiten auf veraltetem Checkout.
3. Ermittle die konkreten betroffenen Dateien, Quellen/Zeiten, bestehenden Regressionen und risikobehafteten Schnittstellen; prüfe, ob die Aufgabe eventuell schon durch eine parallele PR erledigt ist.
4. Liefere eine knappe Tabelle: Befund/Evidenz, Ziel, Dateiscope, Abnahmekriterien, Risiken, Tests, benötigte Berechtigungen und offene Blocker. Kennzeichne Ungeprüftes als `NOT VERIFIED`.
5. **Noch nichts ändern, committen, pushen, keinen PR erstellen und kein Release starten.** Warte auf einen ausdrücklich erteilten Implementierungsauftrag. Bei SHA-Drift oder unklaren Rechten stoppe mit nachvollziehbarem Nachweis.
